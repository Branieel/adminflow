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
 * Location of the activity JSON file.
 */
const activitiesFilePath = path.join(
  process.cwd(),
  "data",
  "user-activities.json"
);

/*
 * Read all activities from
 * data/user-activities.json.
 */
export function getActivities(): UserActivity[] {
  try {
    if (!fs.existsSync(activitiesFilePath)) {
      fs.writeFileSync(
        activitiesFilePath,
        JSON.stringify([], null, 2),
        "utf-8"
      );

      return [];
    }

    const fileContent = fs.readFileSync(
      activitiesFilePath,
      "utf-8"
    );

    if (!fileContent.trim()) {
      return [];
    }

    const activities = JSON.parse(
      fileContent
    ) as UserActivity[];

    if (!Array.isArray(activities)) {
      return [];
    }

    return activities;
  } catch (error) {
    console.error(
      "Failed to read user activities:",
      error
    );

    return [];
  }
}

/*
 * Save all activities to
 * data/user-activities.json.
 */
function saveActivities(
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
 * an activity record.
 */
export function createUserActivity(
  input: CreateActivityInput
) {
  const activities =
    getActivities();

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

  saveActivities(activities);

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
) {
  const activities =
    getActivities();

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
    description: `${userName}'s user account was created.`,
    type: "created",
  });
}

/*
 * Record a profile update.
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
 * Record an account status change.
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