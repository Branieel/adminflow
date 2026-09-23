import {
  NextRequest,
  NextResponse,
} from "next/server";

import { auth } from "@/auth";

import {
  canDeleteUsers,
} from "@/lib/auth/permissions";

import {
  deleteUser,
  getUserById,
} from "@/lib/users";

interface BulkDeleteBody {
  ids?: unknown;
}

export async function DELETE(
  request: NextRequest
) {
  try {
    /*
     * Check authentication.
     */
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
     * Only Administrators
     * can delete users.
     */
    if (
      !canDeleteUsers(
        session.user.role
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden. Only administrators can delete users.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * Read request body.
     */
    let body: BulkDeleteBody;

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid JSON request body.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Validate IDs.
     */
    if (!Array.isArray(body.ids)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "User IDs are required.",
        },
        {
          status: 400,
        }
      );
    }

    const ids = body.ids
      .map((id) => Number(id))
      .filter((id) =>
        Number.isInteger(id)
      );

    if (ids.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Select at least one user to delete.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Remove duplicate IDs.
     */
    const uniqueIds = [
      ...new Set(ids),
    ];

    /*
     * Check which users actually
     * exist before deleting them.
     */
    const existingUsers = [];

    for (const id of uniqueIds) {
      const user =
        await getUserById(id);

      if (user) {
        existingUsers.push(user);
      }
    }

    if (existingUsers.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No matching users were found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Delete each user through
     * lib/users.ts so data/users.json
     * is updated correctly.
     */
    let deletedCount = 0;

    for (const user of existingUsers) {
      const deleted =
        await deleteUser(
          user.id
        );

      if (deleted) {
        deletedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message:
        deletedCount === 1
          ? "1 user deleted successfully."
          : `${deletedCount} users deleted successfully.`,
      deletedCount,
      deletedIds:
        existingUsers.map(
          (user) => user.id
        ),
    });
  } catch (error) {
    console.error(
      "DELETE /api/users/bulk-delete error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to delete selected users.",
      },
      {
        status: 500,
      }
    );
  }
}