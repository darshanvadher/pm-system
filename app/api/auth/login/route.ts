import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validations/auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  // Same error message whether the email doesn't exist or the password is
  // wrong — distinguishing them would let an attacker enumerate which
  // emails have accounts.
  const invalidCredentials = () =>
    NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

  if (!user) return invalidCredentials();

  const passwordMatches = await verifyPassword(password, user.passwordHash);
  if (!passwordMatches) return invalidCredentials();

  if (!user.isActive) {
    return NextResponse.json(
      { error: "This account has been deactivated. Contact an administrator." },
      { status: 403 },
    );
  }

  await createSession(user.id);

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email },
  });
}
