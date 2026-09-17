import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

/**
 * "Am I logged in" check for client components — e.g. a nav bar that needs
 * to know the current user without threading auth state down from a
 * Server Component on every single page.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.name,
    },
  });
}
