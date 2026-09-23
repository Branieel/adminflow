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
  status:
    | "Completed"
    | "Pending"
    | "Active"
    | "Inactive";
  date: string;
}

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
    date: parsedDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    time: parsedDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

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
    description: activity.description,
    date: formattedDate.date,
    time: formattedDate.time,
    type: activity.type,
  };
}

function getRelatedRecords(
  user: NonNullable<
    Awaited<
      ReturnType<typeof getUserById>
    >
  >
): RelatedRecord[] {
  return [
    {
      id: 1,
      reference: `USR-${String(
        user.id
      ).padStart(4, "0")}`,
      type: "User Account",
      description: `${user.role} account`,
      status: user.status,
      date: user.createdAt,
    },
    {
      id: 2,
      reference: `ACT-${String(
        user.id
      ).padStart(4, "0")}`,
      type: "Account Activity",
      description:
        "Profile information and account activity",
      status: "Completed",
      date: user.createdAt,
    },
    {
      id: 3,
      reference: `PER-${String(
        user.id
      ).padStart(4, "0")}`,
      type: "Permission Record",
      description: `${user.role} permissions`,
      status: "Active",
      date: user.createdAt,
    },
  ];
}

export const dynamic = "force-dynamic";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const userId = Number(id);

  if (!Number.isInteger(userId)) {
    notFound();
  }

  /*
   * Load latest user information
   * from data/users.json.
   */
  const user =
    await getUserById(userId);

  if (!user) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              !
            </div>

            <h1 className="mt-4 text-xl font-semibold text-gray-900">
              User Not Found
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              The user you are looking for does not exist or
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
   * Load actual activity records
   * for this user.
   */
  const storedActivities =
    getUserActivities(user.id);

  const activities: Activity[] =
    storedActivities.map(
      formatActivity
    );

  const relatedRecords =
    getRelatedRecords(user);

  const createdDate =
    formatCreatedDate(
      user.createdAt
    );

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <Link
            href="/users"
            className="inline-flex items-center text-sm font-medium text-gray-600 transition hover:text-gray-900"
          >
            ← Back to Users
          </Link>
        </div>

        <div className="mb-6 flex flex-col gap-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">
              User Profile
            </p>

            <h1 className="mt-1 text-3xl font-bold text-gray-900">
              {user.name}
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              View account information and activity.
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 sm:items-end">
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

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Account Information
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Detailed information associated with this
                account.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Full Name
                </p>

                <p className="mt-2 text-sm font-medium text-gray-900">
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

                <p className="mt-2 text-sm text-gray-700">
                  {user.department}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Job Title
                </p>

                <p className="mt-2 text-sm text-gray-700">
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

                <p className="mt-2 text-sm leading-6 text-gray-700">
                  {user.notes ||
                    "No notes have been added."}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
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

                <p className="mt-1 text-sm font-medium text-gray-900">
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
              </div>
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-7">
            <h2 className="text-lg font-semibold text-gray-900">
              Activity & History
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Recent activity associated with this user
              account.
            </p>
          </div>

          {activities.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 px-6 py-10 text-center">
              <p className="font-medium text-gray-900">
                No activity yet
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Activity for this user will appear here
                after account changes are made.
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
                            activity.type ===
                            "created"
                              ? "bg-green-500"
                              : activity.type ===
                                  "updated"
                                ? "bg-blue-500"
                                : "bg-gray-500"
                          }`}
                        />
                      </div>

                      <div className="min-w-0 flex-1 pb-1">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <h3 className="text-sm font-semibold text-gray-900">
                            {
                              activity.title
                            }
                          </h3>

                          <span className="text-xs text-gray-400">
                            {
                              activity.date
                            }

                            {activity.time
                              ? ` · ${activity.time}`
                              : ""}
                          </span>
                        </div>

                        <p className="mt-1.5 text-sm leading-6 text-gray-500">
                          {
                            activity.description
                          }
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </section>

        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Related Records
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Records and permissions associated with this
                user.
              </p>
            </div>

            <span className="text-sm text-gray-400">
              {relatedRecords.length}{" "}
              records
            </span>
          </div>

          {relatedRecords.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 px-6 py-10 text-center">
              <p className="font-medium text-gray-900">
                No related records
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Related records will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
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
                    (record) => (
                      <tr
                        key={record.id}
                        className="transition hover:bg-gray-50"
                      >
                        <td className="px-4 py-4 font-medium text-gray-900">
                          {
                            record.reference
                          }
                        </td>

                        <td className="px-4 py-4 text-gray-700">
                          {record.type}
                        </td>

                        <td className="px-4 py-4 text-gray-500">
                          {
                            record.description
                          }
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              record.status ===
                              "Completed"
                                ? "bg-green-50 text-green-700"
                                : record.status ===
                                    "Active"
                                  ? "bg-blue-50 text-blue-700"
                                  : record.status ===
                                      "Inactive"
                                    ? "bg-gray-100 text-gray-600"
                                    : "bg-yellow-50 text-yellow-700"
                            }`}
                          >
                            {
                              record.status
                            }
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-gray-500">
                          {record.date}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}