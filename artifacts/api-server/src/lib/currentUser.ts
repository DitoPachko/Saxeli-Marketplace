import { clerkClient, getAuth } from "@clerk/express";
import type { Request } from "express";
import { db, users, type User } from "@workspace/db";

function clerkName(user: Awaited<ReturnType<typeof clerkClient.users.getUser>>): string {
  return (
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    user.username ||
    user.primaryEmailAddress?.emailAddress ||
    "User"
  );
}

/**
 * Hydrates the application user record from Clerk on every authenticated request.
 * Passwords are never read or stored: Clerk remains the sole credential authority.
 */
export async function getCurrentUser(req: Request): Promise<User> {
  const { userId } = getAuth(req);
  if (!userId) throw new Error("Authenticated user is required");

  const clerkUser = await clerkClient.users.getUser(userId);
  const fullName = clerkName(clerkUser);
  const email = clerkUser.primaryEmailAddress?.emailAddress ?? "";
  const phoneNumber = clerkUser.primaryPhoneNumber?.phoneNumber ?? null;
  const avatarUrl = clerkUser.imageUrl ?? null;

  const [user] = await db
    .insert(users)
    .values({
      id: userId,
      fullName,
      email,
      passwordHash: null,
      phoneNumber,
      avatarUrl,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: { fullName, email, phoneNumber, avatarUrl, passwordHash: null },
    })
    .returning();

  return user;
}