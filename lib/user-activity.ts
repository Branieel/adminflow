import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

export type ActivityType =
  | "created"
  | "updated"
  | "status";

export interface UserActivity {
  id: number;
  userId: number;
  title: string;
  description: string;
  createdAt: string;
  type: ActivityType;
}

interface CreateActivityInput {
  userId: number;
  title: string;
  description: string;
  type: ActivityType;
}

/*
 * Reuse the Prisma client during
 * development to avoid creating
 * multiple database connections.
 */
const globalForPrisma =
  globalThis as unknown as {
    activityPrisma:
      | PrismaClient
      | undefined;
  };

const adapter = new PrismaPg({
  connectionString:
    process.env.DATABASE_URL!,
});

const prisma =
  globalForPrisma.activityPrisma ??
  new PrismaClient({
    adapter,
  });

if (
  process.env.NODE_ENV !==
  "production"
) {
  globalForPrisma.activityPrisma =
    prisma;
}

/*
 * Convert the database action
 * into the ActivityType used
 * by the UI.
 */
function getActivityType(
  action: string
): ActivityType {
  if (action === "created") {
    return "created";
  }

  if (action === "status") {
    return "status";
  }

  return "updated";
}

/*
 * Build the title displayed in
 * Activity & History.
 */
function getActivityTitle(
  type: ActivityType
): string {
  if (type === "created") {
    return "User account created";
  }

  if (type === "status") {
    return "Account status changed";
  }

  return "Profile updated";
}

/*
 * Convert a Prisma UserActivity
 * record into the format expected
 * by the existing UI.
 */
function toUserActivity(activity: {
  id: number;
  userId: number;
  action: string;
  details: string;
  createdAt: Date;
}): UserActivity {
  const type =
    getActivityType(
      activity.action
    );

  return {
    id: activity.id,
    userId: activity.userId,

    title:
      getActivityTitle(type),

    description:
      activity.details,

    createdAt:
      activity.createdAt.toISOString(),

    type,
  };
}

/*
 * Get all activities.
 *
 * PostgreSQL is now the permanent
 * source instead of
 * data/user-activities.json.
 */
export async function getActivities(): Promise<
  UserActivity[]
> {
  try {
    const activities =
      await prisma.userActivity.findMany({
        orderBy: {
          createdAt: "desc",
        },
      });

    return activities.map(
      toUserActivity
    );
  } catch (error) {
    console.error(
      "Failed to read user activities:",
      error
    );

    return [];
  }
}

/*
 * Create an activity directly
 * in PostgreSQL.
 */
export async function createUserActivity(
  input: CreateActivityInput
): Promise<UserActivity> {
  const activity =
    await prisma.userActivity.create({
      data: {
        userId: input.userId,
        action: input.type,
        details:
          input.description,
      },
    });

  return {
    id: activity.id,
    userId: activity.userId,
    title: input.title,
    description:
      activity.details,
    createdAt:
      activity.createdAt.toISOString(),
    type: input.type,
  };
}

/*
 * Get activity history for
 * one specific user.
 *
 * Newest activity first.
 */
export async function getUserActivities(
  userId: number
): Promise<UserActivity[]> {
  try {
    const activities =
      await prisma.userActivity.findMany({
        where: {
          userId,
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    return activities.map(
      toUserActivity
    );
  } catch (error) {
    console.error(
      `Failed to read activities for user ${userId}:`,
      error
    );

    return [];
  }
}

/*
 * Record account creation.
 */
export async function recordUserCreated(
  userId: number,
  userName: string
): Promise<UserActivity> {
  return createUserActivity({
    userId,
    title:
      "User account created",

    description:
      `${userName}'s user account was created.`,

    type: "created",
  });
}

/*
 * Record profile update.
 */
export async function recordUserUpdated(
  userId: number
): Promise<UserActivity> {
  return createUserActivity({
    userId,
    title:
      "Profile updated",

    description:
      "User account information was updated.",

    type: "updated",
  });
}

/*
 * Record account status change.
 */
export async function recordUserStatusChanged(
  userId: number,
  previousStatus: string,
  newStatus: string
): Promise<UserActivity> {
  return createUserActivity({
    userId,

    title:
      "Account status changed",

    description:
      `Account status changed from ${previousStatus} to ${newStatus}.`,

    type: "status",
  });
}