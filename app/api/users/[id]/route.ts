import {
  NextRequest,
  NextResponse,
} from "next/server";

import { auth } from "@/auth";

import {
  canDeleteUsers,
  canManageUsers,
} from "@/lib/auth/permissions";

import {
  recordUserStatusChanged,
  recordUserUpdated,
} from "@/lib/user-activity";

import {
  deleteUser,
  getUserById,
  getUsers,
  updateUser,
} from "@/lib/users";

interface UserUpdate {
  name?: unknown;
  email?: unknown;
  role?: unknown;
  status?: unknown;
  department?: unknown;
  jobTitle?: unknown;
  phone?: unknown;
  notes?: unknown;
  accessJustification?: unknown;
}

const allowedRoles = [
  "Administrator",
  "Manager",
  "User",
] as const;

const allowedStatuses = [
  "Active",
  "Inactive",
] as const;

type UserRole =
  (typeof allowedRoles)[number];

type UserStatus =
  (typeof allowedStatuses)[number];

function isUserRole(
  value: unknown
): value is UserRole {
  return (
    typeof value === "string" &&
    allowedRoles.includes(
      value as UserRole
    )
  );
}

function isUserStatus(
  value: unknown
): value is UserStatus {
  return (
    typeof value === "string" &&
    allowedStatuses.includes(
      value as UserStatus
    )
  );
}

/*
 * GET ONE USER
 */
export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
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

    const { id } =
      await context.params;

    const userId =
      Number(id);

    if (
      !Number.isInteger(userId)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid user ID.",
        },
        {
          status: 400,
        }
      );
    }

    const user =
      await getUserById(
        userId
      );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "User not found.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error(
      "GET /api/users/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load user.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * UPDATE USER
 */
export async function PUT(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    if (
      !canManageUsers(
        session.user.role
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden. You do not have permission to update users.",
        },
        {
          status: 403,
        }
      );
    }

    const { id } =
      await context.params;

    const userId =
      Number(id);

    if (
      !Number.isInteger(userId)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid user ID.",
        },
        {
          status: 400,
        }
      );
    }

    const previousUser =
      await getUserById(
        userId
      );

    if (!previousUser) {
      return NextResponse.json(
        {
          success: false,
          message:
            "User not found.",
        },
        {
          status: 404,
        }
      );
    }

    let body: UserUpdate;

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid JSON request body. Please send valid JSON.",
        },
        {
          status: 400,
        }
      );
    }

    const name =
      typeof body.name ===
      "string"
        ? body.name.trim()
        : "";

    const email =
      typeof body.email ===
      "string"
        ? body.email
            .trim()
            .toLowerCase()
        : "";

    const role =
      typeof body.role ===
      "string"
        ? body.role.trim()
        : "";

    const status:
      | UserStatus
      | "" =
      isUserStatus(
        body.status
      )
        ? body.status
        : "";

    const department =
      typeof body.department ===
      "string"
        ? body.department.trim()
        : "";

    const jobTitle =
      typeof body.jobTitle ===
      "string"
        ? body.jobTitle.trim()
        : "";

    const phone =
      typeof body.phone ===
      "string"
        ? body.phone.trim()
        : "";

    const notes =
      typeof body.notes ===
      "string"
        ? body.notes.trim()
        : "";

    const accessJustification =
      typeof body.accessJustification ===
      "string"
        ? body.accessJustification.trim()
        : previousUser
            .accessJustification;

    /*
     * VALIDATION
     */
    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Name is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (name.length < 2) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Name must contain at least 2 characters.",
        },
        {
          status: 400,
        }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Name must not exceed 100 characters.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !/^[\p{L}\p{M}.' -]+$/u.test(
        name
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Name can only contain letters, spaces, apostrophes, periods, and hyphens.",
        },
        {
          status: 400,
        }
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Email is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a valid email address.",
        },
        {
          status: 400,
        }
      );
    }

    if (!isUserRole(role)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid role.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !isUserStatus(status)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid status.",
        },
        {
          status: 400,
        }
      );
    }

    if (!department) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Department is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!jobTitle) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Job title is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      role === "Administrator" &&
      !accessJustification
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Access justification is required for Administrator accounts.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * DUPLICATE EMAIL CHECK
     */
    const allUsers =
      await getUsers();

    const duplicateUser =
      allUsers.find(
        (item) =>
          item.id !== userId &&
          item.email
            .trim()
            .toLowerCase() ===
            email
      );

    if (duplicateUser) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A user with this email already exists.",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * DETECT CHANGES
     */
    const profileChanged =
      previousUser.name !==
        name ||
      previousUser.email !==
        email ||
      previousUser.role !==
        role ||
      previousUser.department !==
        department ||
      previousUser.jobTitle !==
        jobTitle ||
      previousUser.phone !==
        phone ||
      previousUser.notes !==
        notes ||
      previousUser
        .accessJustification !==
        accessJustification;

    const statusChanged =
      previousUser.status !==
      status;

    /*
     * UPDATE POSTGRESQL
     */
    const updatedUser =
      await updateUser(
        userId,
        {
          name,
          email,
          role,
          status,
          department,
          jobTitle,
          phone,
          notes,
          accessJustification,
        }
      );

    if (!updatedUser) {
      return NextResponse.json(
        {
          success: false,
          message:
            "User not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * SAVE PROFILE ACTIVITY.
     *
     * IMPORTANT:
     * await ensures Vercel does
     * not finish the request before
     * PostgreSQL saves the activity.
     */
    if (profileChanged) {
      await recordUserUpdated(
        userId
      );
    }

    /*
     * SAVE STATUS ACTIVITY
     */
    if (statusChanged) {
      await recordUserStatusChanged(
        userId,
        previousUser.status,
        status
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "User updated successfully.",
      data: updatedUser,
    });
  } catch (error) {
    console.error(
      "PUT /api/users/[id] error:",
      error
    );

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A user with this email already exists.",
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to update user.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * DELETE USER
 */
export async function DELETE(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

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

    const { id } =
      await context.params;

    const userId =
      Number(id);

    if (
      !Number.isInteger(userId)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid user ID.",
        },
        {
          status: 400,
        }
      );
    }

    const existingUser =
      await getUserById(
        userId
      );

    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          message:
            "User not found.",
        },
        {
          status: 404,
        }
      );
    }

    const deleted =
      await deleteUser(
        userId
      );

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          message:
            "User not found.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "User deleted successfully.",
      data: existingUser,
    });
  } catch (error) {
    console.error(
      "DELETE /api/users/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to delete user.",
      },
      {
        status: 500,
      }
    );
  }
}