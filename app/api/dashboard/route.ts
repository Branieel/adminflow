import {
  NextRequest,
  NextResponse,
} from "next/server";

import { auth } from "@/auth";
import { getUsers } from "@/lib/users";

export async function GET(
  request: NextRequest
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * Read users from PostgreSQL
     * through Prisma.
     */
    const users = await getUsers();

    const searchParams =
      request.nextUrl.searchParams;

    const range =
      searchParams.get("range") ||
      "30";

    const allowedRanges = [
      "7",
      "30",
      "90",
    ];

    const selectedRange =
      allowedRanges.includes(range)
        ? Number(range)
        : 30;

    /*
     * Calculate the starting date
     * for the selected range.
     */
    const today = new Date();

    const startDate =
      new Date(today);

    startDate.setHours(
      0,
      0,
      0,
      0
    );

    startDate.setDate(
      startDate.getDate() -
        selectedRange
    );

    /*
     * Only include users created
     * within the selected range.
     */
    const filteredUsers =
      users.filter((user) => {
        if (!user.createdAt) {
          return false;
        }

        const createdAt =
          new Date(
            user.createdAt
          );

        if (
          Number.isNaN(
            createdAt.getTime()
          )
        ) {
          return false;
        }

        return (
          createdAt >= startDate
        );
      });

    /*
     * KPI calculations.
     */
    const totalUsers =
      filteredUsers.length;

    const activeUsers =
      filteredUsers.filter(
        (user) =>
          user.status ===
          "Active"
      ).length;

    const inactiveUsers =
      filteredUsers.filter(
        (user) =>
          user.status ===
          "Inactive"
      ).length;

    const administrators =
      filteredUsers.filter(
        (user) =>
          user.role ===
          "Administrator"
      ).length;

    const managers =
      filteredUsers.filter(
        (user) =>
          user.role ===
          "Manager"
      ).length;

    const regularUsers =
      filteredUsers.filter(
        (user) =>
          user.role ===
          "User"
      ).length;

    /*
     * Department analytics.
     */
    const departmentCounts =
      filteredUsers.reduce<
        Record<string, number>
      >(
        (result, user) => {
          const department =
            user.department ||
            "Unassigned";

          result[department] =
            (result[
              department
            ] || 0) + 1;

          return result;
        },
        {}
      );

    const departmentAnalytics =
      Object.entries(
        departmentCounts
      ).map(
        ([
          department,
          count,
        ]) => ({
          department,
          users: count,
        })
      );

    return NextResponse.json({
      success: true,

      data: {
        range:
          String(
            selectedRange
          ),

        totalUsers,
        activeUsers,
        inactiveUsers,

        administrators,
        managers,
        regularUsers,

        departmentAnalytics,
      },
    });
  } catch (error) {
    console.error(
      "GET /api/dashboard error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load dashboard analytics.",
      },
      {
        status: 500,
      }
    );
  }
}