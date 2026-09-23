import Link from "next/link";
import { notFound } from "next/navigation";

import UserDetailActions from "@/components/dashboard/user-detail-actions";

import {
  getUserActivities,
  type UserActivity,
} from "@/lib/user-activity";

import { getUserById } from "@/lib/users";

interface Activity {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  type: "created" | "updated" | "status";
}

interface RelatedRecord {
  id: number;
  reference: string;
  type: string;
  description: string;
  status: "Completed" | "Pending" | "Active";
  date: string;
}

/*
 * Format database date/time
 * for display.
 */
function formatCreatedDate(
  createdAt: string
): {
  date: string;
  time: string;
} {
  const parsedDate = new Date(createdAt);

  if (Number.isNaN(parsedDate.getTime())) {
    return {
      date: createdAt,
      time: "",
    };
  }

  return {
    date: parsedDate.toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "Asia/Dubai",
      }
    ),

    time: parsedDate.toLocaleTimeString(
      "en-US",
      {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "Asia/Dubai",
      }
    ),
  };
}

/*
 * Convert database activity
 * into UI activity format.
 */
function formatActivity(
  activity: UserActivity
): Activity {
  const formattedDate =
    formatCreatedDate(
      activity.createdAt
    );

  return {
    id: activity.id,
    title: activity.title,
    description:
      activity.description,
    date: formattedDate.date,
    time: formattedDate.time,
    type: activity.type,
  };
}

/*
 * Build Related Records.
 *
 * Creation records use the actual
 * "created" activity timestamp.
 *
 * ACT uses the latest activity.
 *
 * PER uses the latest status
 * activity when available.
 */
function getRelatedRecords(
  user: NonNullable<
    Awaited<
      ReturnType<typeof getUserById>
    >
  >,
  activities: UserActivity[]
): RelatedRecord[] {
  /*
   * Latest activity.
   *
   * getUserActivities() should
   * return newest first.
   */
  const latestActivity =
    activities[0] ?? null;

  /*
   * Find the actual account
   * creation event.
   */
  const createdActivity =
    activities.find(
      (activity) =>
        activity.type === "created"
    );

  /*
   * Find latest status /
   * permission-related event.
   */
  const latestPermissionActivity =
    activities.find(
      (activity) =>
        activity.type === "status"
    );

  /*
   * Real creation timestamp.
   *
   * Prefer the creation activity.
   * Fall back to user.createdAt
   * for older records.
   */
  const accountCreatedAt =
    createdActivity?.createdAt ??
    user.createdAt;

  return [
    /*
     * USER ACCOUNT
     */
    {
      id: 1,

      reference: `USR-${String(
        user.id
      ).padStart(4, "0")}`,

      type: "User Account",

      description:
        `${user.role} account`,

      status:
        user.status === "Active"
          ? "Active"
          : "Pending",

      /*
       * Actual creation event.
       */
      date: accountCreatedAt,
    },

    /*
     * ACCOUNT ACTIVITY
     */
    {
      id: 2,

      reference: `ACT-${String(
        user.id
      ).padStart(4, "0")}`,

      type: "Account Activity",

      description:
        latestActivity?.description ??
        "Profile information and account activity",

      status: "Completed",

      /*
       * Latest real activity.
       */
      date:
        latestActivity?.createdAt ??
        accountCreatedAt,
    },

    /*
     * PERMISSION RECORD
     */
    {
      id: 3,

      reference: `PER-${String(
        user.id
      ).padStart(4, "0")}`,

      type: "Permission Record",

      description:
        `${user.role} permissions`,

      status: "Active",

      /*
       * If permissions/status have
       * changed, show that event.
       *
       * Otherwise use the actual
       * account creation event.
       */
      date:
        latestPermissionActivity
          ?.createdAt ??
        accountCreatedAt,
    },
  ];
}

export const dynamic =
  "force-dynamic";

export const revalidate = 0;

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } =
    await params;

  const userId =
    Number(id);

  if (
    !Number.isInteger(userId)
  ) {
    notFound();
  }

  /*
   * Load latest user information
   * from PostgreSQL.
   */
  const user =
    await getUserById(
      userId
    );

  if (!user) {
    return (
      <main className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              !
            </div>

            <h1 className="mt-4 text-xl font-semibold text-gray-900">
              User Not Found
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              The user you are looking
              for does not exist or
              could not be loaded.
            </p>

            <Link
              href="/users"
              className="mt-6 inline-flex rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              Back to Users
            </Link>

          </div>
        </div>
      </main>
    );
  }

  /*
   * Load current activities
   * directly from PostgreSQL.
   */
  const storedActivities =
    await getUserActivities(
      user.id
    );

  const activities: Activity[] =
    storedActivities.map(
      formatActivity
    );

  const relatedRecords =
    getRelatedRecords(
      user,
      storedActivities
    );

  /*
   * Prefer the actual creation
   * activity timestamp for the
   * Quick Summary as well.
   */
  const createdActivity =
    storedActivities.find(
      (activity) =>
        activity.type === "created"
    );

  const actualCreatedAt =
    createdActivity?.createdAt ??
    user.createdAt;

  const createdDate =
    formatCreatedDate(
      actualCreatedAt
    );

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6">

      <div className="mx-auto max-w-5xl">

        {/* BACK */}

        <div className="mb-6">
          <Link
            href="/users"
            className="inline-flex items-center text-sm font-medium text-gray-600 transition hover:text-gray-900"
          >
            ← Back to Users
          </Link>
        </div>

        {/* PROFILE HEADER */}

        <div className="mb-6 flex flex-col gap-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">

          <div className="min-w-0">

            <p className="text-sm font-medium text-gray-500">
              User Profile
            </p>

            <h1 className="mt-1 break-words text-2xl font-bold text-gray-900 sm:text-3xl">
              {user.name}
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              View account information
              and activity.
            </p>

          </div>

          <div className="flex w-full flex-col items-start gap-3 sm:w-auto sm:items-end">

            <span
              className={`inline-flex w-fit rounded-full px-3 py-1.5 text-sm font-medium ${
                user.status === "Active"
                  ? "bg-green-50 text-green-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {user.status}
            </span>

            <div className="w-full sm:w-auto">
              <UserDetailActions
                user={user}
              />
            </div>

          </div>

        </div>

        {/* ACCOUNT INFORMATION */}

        <div className="grid gap-6 lg:grid-cols-3">

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 lg:col-span-2">

            <div className="mb-6">

              <h2 className="text-lg font-semibold text-gray-900">
                Account Information
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Detailed information
                associated with this
                account.
              </p>

            </div>

            <div className="grid gap-6 sm:grid-cols-2">

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Full Name
                </p>

                <p className="mt-2 break-words text-sm font-medium text-gray-900">
                  {user.name}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  User ID
                </p>

                <p className="mt-2 text-sm font-medium text-gray-900">
                  #{user.id}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Email Address
                </p>

                <p className="mt-2 break-all text-sm text-gray-700">
                  {user.email}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Role
                </p>

                <p className="mt-2 text-sm font-medium text-gray-900">
                  {user.role}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Account Status
                </p>

                <p className="mt-2 text-sm text-gray-700">
                  {user.status}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Department
                </p>

                <p className="mt-2 break-words text-sm text-gray-700">
                  {user.department}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Job Title
                </p>

                <p className="mt-2 break-words text-sm text-gray-700">
                  {user.jobTitle}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Phone
                </p>

                <p className="mt-2 text-sm text-gray-700">
                  {user.phone ||
                    "Not provided"}
                </p>
              </div>

              <div className="sm:col-span-2">

                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Notes
                </p>

                <p className="mt-2 break-words text-sm leading-6 text-gray-700">
                  {user.notes ||
                    "No notes have been added."}
                </p>

              </div>

            </div>

          </section>

          {/* QUICK SUMMARY */}

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">

            <h2 className="text-lg font-semibold text-gray-900">
              Quick Summary
            </h2>

            <div className="mt-5 space-y-5">

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Account Type
                </p>

                <p className="mt-1 text-sm font-medium text-gray-900">
                  {user.role}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Department
                </p>

                <p className="mt-1 break-words text-sm font-medium text-gray-900">
                  {user.department}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Status
                </p>

                <p className="mt-1 text-sm font-medium text-gray-900">
                  {user.status}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  User ID
                </p>

                <p className="mt-1 text-sm font-medium text-gray-900">
                  #{user.id}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Created
                </p>

                <p className="mt-1 text-sm font-medium text-gray-900">
                  {createdDate.date}
                </p>

                {createdDate.time && (
                  <p className="mt-1 text-xs text-gray-500">
                    {createdDate.time}
                  </p>
                )}
              </div>

            </div>

          </section>

        </div>

        {/* ACTIVITY & HISTORY */}

        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">

          <div className="mb-7">

            <h2 className="text-lg font-semibold text-gray-900">
              Activity & History
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Recent activity associated
              with this user account.
            </p>

          </div>

          {activities.length === 0 ? (

            <div className="rounded-lg border border-dashed border-gray-300 px-4 py-10 text-center sm:px-6">

              <p className="font-medium text-gray-900">
                No activity yet
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Activity for this user
                will appear here after
                account changes are made.
              </p>

            </div>

          ) : (

            <div className="relative">

              <div className="absolute bottom-5 left-4 top-5 w-px bg-gray-200" />

              <div className="space-y-7">

                {activities.map(
                  (activity) => (

                    <div
                      key={activity.id}
                      className="relative flex gap-4"
                    >

                      <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white">

                        <div
                          className={`h-2.5 w-2.5 rounded-full ${
                            activity.type === "created"
                              ? "bg-green-500"
                              : activity.type === "updated"
                                ? "bg-blue-500"
                                : "bg-gray-500"
                          }`}
                        />

                      </div>

                      <div className="min-w-0 flex-1 pb-1">

                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">

                          <h3 className="break-words text-sm font-semibold text-gray-900">
                            {activity.title}
                          </h3>

                          <span className="shrink-0 text-xs text-gray-400">
                            {activity.date}

                            {activity.time
                              ? ` · ${activity.time}`
                              : ""}
                          </span>

                        </div>

                        <p className="mt-1.5 break-words text-sm leading-6 text-gray-500">
                          {activity.description}
                        </p>

                      </div>

                    </div>

                  )
                )}

              </div>

            </div>

          )}

        </section>

        {/* RELATED RECORDS */}

        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">

          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h2 className="text-lg font-semibold text-gray-900">
                Related Records
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Records and permissions
                associated with this user.
              </p>

            </div>

            <span className="text-sm text-gray-400">
              {relatedRecords.length} records
            </span>

          </div>

          {relatedRecords.length === 0 ? (

            <div className="rounded-lg border border-dashed border-gray-300 px-4 py-10 text-center sm:px-6">

              <p className="font-medium text-gray-900">
                No related records
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Related records will
                appear here.
              </p>

            </div>

          ) : (

            <div className="-mx-5 overflow-x-auto sm:mx-0">

              <div className="min-w-[700px] px-5 sm:px-0">

                <table className="w-full text-left text-sm">

                  <thead className="border-b bg-gray-50 text-xs uppercase tracking-wide text-gray-500">

                    <tr>

                      <th className="px-4 py-3 font-medium">
                        Reference
                      </th>

                      <th className="px-4 py-3 font-medium">
                        Type
                      </th>

                      <th className="px-4 py-3 font-medium">
                        Description
                      </th>

                      <th className="px-4 py-3 font-medium">
                        Status
                      </th>

                      <th className="px-4 py-3 font-medium">
                        Date
                      </th>

                    </tr>

                  </thead>

                  <tbody className="divide-y">

                    {relatedRecords.map(
                      (record) => {
                        const recordDate =
                          formatCreatedDate(
                            record.date
                          );

                        return (

                          <tr
                            key={record.id}
                            className="transition hover:bg-gray-50"
                          >

                            <td className="px-4 py-4 font-medium text-gray-900">
                              {record.reference}
                            </td>

                            <td className="px-4 py-4 text-gray-700">
                              {record.type}
                            </td>

                            <td className="px-4 py-4 text-gray-500">
                              {record.description}
                            </td>

                            <td className="px-4 py-4">

                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                  record.status === "Completed"
                                    ? "bg-green-50 text-green-700"
                                    : record.status === "Active"
                                      ? "bg-blue-50 text-blue-700"
                                      : "bg-yellow-50 text-yellow-700"
                                }`}
                              >
                                {record.status}
                              </span>

                            </td>

                            <td className="whitespace-nowrap px-4 py-4 text-gray-500">

                              {recordDate.date}

                              {recordDate.time
                                ? ` · ${recordDate.time}`
                                : ""}

                            </td>

                          </tr>

                        );
                      }
                    )}

                  </tbody>

                </table>

              </div>

            </div>

          )}

        </section>

      </div>

    </main>
  );
}