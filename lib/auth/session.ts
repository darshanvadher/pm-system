import { randomBytes, createHash } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import {
  SESSION_COOKIE_NAME,
  SESSION_DURATION_DAYS,
} from "@/lib/auth/constants";

/**
 * We never store the raw session token in the database — only its SHA-256
 * hash, the same way a password would be stored. If the `sessions` table
 * were ever exposed (a backup leak, an over-broad DB read, a curious
 * teammate with prod access), nobody could reconstruct a usable cookie
 * value from what's in the table.
 */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function generateToken(): string {
  return randomBytes(32).toString("hex"); // 256 bits of entropy
}

/**
 * Whether cookies should be marked `secure` (HTTPS-only). Deliberately NOT
 * `process.env.NODE_ENV === "production"` — this machine's Windows
 * environment has NODE_ENV permanently pinned to "production" system-wide,
 * so that check would be true even on localhost:3000 over plain HTTP and
 * the browser would silently refuse to store the cookie, breaking login.
 * APP_ENV is a separate variable we control ourselves in .env.
 */
const isProductionDeployment = process.env.APP_ENV === "production";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  role: {
    id: string;
    name: string;
  };
  permissions: string[];
};

/**
 * Creates a new session row and sets the httpOnly cookie for the current
 * response. Only call this from a Route Handler or Server Action — Next.js
 * throws if you try to set a cookie during a Server Component render.
 */
export async function createSession(userId: string): Promise<void> {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(
    Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000,
  );

  await prisma.session.create({
    data: { tokenHash, userId, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProductionDeployment,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/**
 * Reads the session cookie (if any), validates it against the database,
 * and returns the user with their role and a flattened permission-key
 * list. Returns null for: no cookie, unknown/expired token, or a
 * deactivated account.
 *
 * Safe to call from Server Components, Route Handlers, or anywhere else
 * server-side — it only reads, never writes, so it never hits the
 * "can't set cookies here" restriction.
 *
 * This does a DB read every call, by design: for session-based auth the
 * database is the source of truth for "is this session still valid,"
 * which is exactly what makes instant server-side logout / revocation
 * possible (a stateless JWT can't be un-issued this cleanly).
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);

  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: {
      user: {
        include: {
          role: {
            include: {
              permissions: { include: { permission: true } },
            },
          },
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date() || !session.user.isActive) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    isActive: session.user.isActive,
    role: { id: session.user.role.id, name: session.user.role.name },
    permissions: session.user.role.permissions.map((rp) => rp.permission.key),
  };
}

/**
 * Deletes the session row and clears the cookie. Call from the logout
 * route handler only (same cookie-mutation restriction as createSession).
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * NOT IMPLEMENTED YET, ON PURPOSE: sliding expiration (extending a
 * session's life on activity instead of a fixed 7-day window). Doing that
 * safely means re-setting the cookie's `expires` from inside
 * getCurrentUser(), but getCurrentUser() is called from Server Components
 * during render, where Next.js forbids writing cookies. The clean fix is
 * a small middleware-level refresh, which is a reasonable Stage G /
 * "future improvements" item rather than something to bolt on here.
 */
