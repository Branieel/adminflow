import fs from "fs";
import path from "path";

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
 * Location of the permanent
 * activity history JSON file.
 */
const activitiesFilePath =
  path.join(
    process.cwd(),
    "data",
    "user-activities.json"
  );

/*
 * Read all activity records.
 */
function readActivities(): UserActivity[] {
  try {
    if (
      !fs.existsSync(
        activitiesFilePath
      )
    ) {
      fs.writeFileSync(
        activitiesFilePath,
        "[]",
        "utf-8"
      );

      return [];
    }

    const fileContent =
      fs.readFileSync(
        activitiesFilePath,
        "utf-8"
      );

    if (!fileContent.trim()) {
      return [];
    }

    const parsed =
      JSON.parse(fileContent);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as UserActivity[];
  } catch (error) {
    console.error(
      "Failed to read user activities:",
      error
    );

    return [];
  }
}

/*
 * Save all activity records.
 */
function writeActivities(
  activities: UserActivity[]
) {
  fs.writeFileSync(
    activitiesFilePath,
    JSON.stringify(
      activities,
      null,
      2
    ),
    "utf-8"
  );
}

/*
 * Generate the next activity ID.
 */
function getNextActivityId(
  activities: UserActivity[]
) {
  if (activities.length === 0) {
    return 1;
  }

  return (
    Math.max(
      ...activities.map(
        (activity) => activity.id
      )
    ) + 1
  );
}

/*
 * Create and permanently save
 * a new activity record.
 */
export function createUserActivity(
  input: CreateActivityInput
) {
  const activities =
    readActivities();

  const activity: UserActivity = {
    id: getNextActivityId(
      activities
    ),
    userId: input.userId,
    title: input.title,
    description:
      input.description,
    type: input.type,
    createdAt:
      new Date().toISOString(),
  };

  activities.push(activity);

  writeActivities(activities);

  return activity;
}

/*
 * Get all activities belonging
 * to one user.
 *
 * Newest activity appears first.
 */
export function getUserActivities(
  userId: number
): UserActivity[] {
  const activities =
    readActivities();

  return activities
    .filter(
      (activity) =>
        activity.userId === userId
    )
    .sort(
      (a, b) =>
        new Date(
          b.createdAt
        ).getTime() -
        new Date(
          a.createdAt
        ).getTime()
    );
}

/*
 * Record creation of a user.
 */
export function recordUserCreated(
  userId: number,
  userName: string
) {
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
export function recordUserUpdated(
  userId: number
) {
  return createUserActivity({
    userId,
    title: "Profile updated",
    description:
      "User account information was updated.",
    type: "updated",
  });
}

/*
 * Record account status change.
 */
export function recordUserStatusChanged(
  userId: number,
  previousStatus: string,
  newStatus: string
) {
  return createUserActivity({
    userId,
    title:
      "Account status changed",
    description:
      `Account status changed from ${previousStatus} to ${newStatus}.`,
    type: "status",
  });
}