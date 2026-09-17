import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  hasPermission,
  hasRole,
  type AuthorizableUser,
} from "@/lib/auth/permission-checks";
import { PERMISSIONS, ROLE_NAMES } from "@/lib/auth/permissions";

describe("password hashing", () => {
  it("produces a hash that verifies against the original password", async () => {
    const hash = await hashPassword("correct-horse-battery-staple");
    await expect(
      verifyPassword("correct-horse-battery-staple", hash),
    ).resolves.toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("correct-horse-battery-staple");
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("never stores the plaintext password as the hash", async () => {
    const hash = await hashPassword("hunter2");
    expect(hash).not.toBe("hunter2");
  });
});

function fakeUser(overrides: Partial<AuthorizableUser> = {}): AuthorizableUser {
  return {
    role: { name: ROLE_NAMES.DEVELOPER },
    permissions: [PERMISSIONS.PROJECT_VIEW, PERMISSIONS.TASK_CREATE],
    ...overrides,
  };
}

describe("rbac permission checks", () => {
  it("hasPermission is true only for permissions the user actually has", () => {
    const user = fakeUser();
    expect(hasPermission(user, PERMISSIONS.TASK_CREATE)).toBe(true);
    expect(hasPermission(user, PERMISSIONS.USER_MANAGE)).toBe(false);
  });

  it("hasRole matches against one or more role names", () => {
    const admin = fakeUser({ role: { name: ROLE_NAMES.ADMIN } });
    expect(hasRole(admin, ROLE_NAMES.ADMIN)).toBe(true);
    expect(hasRole(admin, ROLE_NAMES.DEVELOPER, ROLE_NAMES.CLIENT)).toBe(false);
    expect(hasRole(admin, ROLE_NAMES.ADMIN, ROLE_NAMES.PROJECT_MANAGER)).toBe(
      true,
    );
  });
});
