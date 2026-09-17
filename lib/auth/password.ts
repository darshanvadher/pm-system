import bcrypt from "bcrypt";

// 12 rounds is a reasonable balance of brute-force resistance vs. login
// latency as of 2026. It's baked into every stored hash (bcrypt encodes the
// cost in the hash itself), so bumping this later doesn't invalidate
// existing passwords — they just keep verifying at their original cost.
const SALT_ROUNDS = 12;

export async function hashPassword(plainTextPassword: string): Promise<string> {
  return bcrypt.hash(plainTextPassword, SALT_ROUNDS);
}

export async function verifyPassword(
  plainTextPassword: string,
  storedHash: string,
): Promise<boolean> {
  return bcrypt.compare(plainTextPassword, storedHash);
}
