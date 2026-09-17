/**
 * Auth-related constants that are safe to import from Edge Runtime code
 * (e.g. middleware.ts). Do NOT add Node-only imports (crypto, Prisma) to
 * this file, or middleware's edge bundle will fail to build.
 */
export const SESSION_COOKIE_NAME = "pm_session";

// How long a session lives before the user must log in again.
// v1 uses a fixed lifetime (see lib/auth/session.ts for why sliding
// expiration was deliberately left out for now).
export const SESSION_DURATION_DAYS = 7;
