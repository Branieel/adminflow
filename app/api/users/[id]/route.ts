import { NextRequest, NextResponse } from "next/server";

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
    params: Promise<{ id: string }>;
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
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const userId = Number(id);

    if (!Number.isInteger(userId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid user ID.",
        },
        { status: 400 }
      );
    }

    /*
     * Read the latest user from
     * data/users.json.
     */
    const user =
      await getUserById(userId);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        { status: 404 }
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
        message: "Failed to load user.",
      },
      { status: 500 }
    );
  }
}

/*
 * UPDATE USER
 */
export async function PUT(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
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
        { status: 401 }
      );
    }

    /*
     * Administrator and Manager
     * can update users.
     */
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
        { status: 403 }
      );
    }

    const { id } = await context.params;

    const userId = Number(id);

    if (!Number.isInteger(userId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid user ID.",
        },
        { status: 400 }
      );
    }

    /*
     * Load the existing user from
     * data/users.json.
     */
    const previousUser =
      await getUserById(userId);

    if (!previousUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        { status: 404 }
      );
    }

    let body: UserUpdate;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid JSON request body. Please send valid JSON.",
        },
        { status: 400 }
      );
    }

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const email =
      typeof body.email === "string"
        ? body.email
            .trim()
            .toLowerCase()
        : "";

    const role =
      typeof body.role === "string"
        ? body.role.trim()
        : "";

    const status: UserStatus | "" =
      isUserStatus(body.status)
        ? body.status
        : "";

    const department =
      typeof body.department === "string"
        ? body.department.trim()
        : "";

    const jobTitle =
      typeof body.jobTitle === "string"
        ? body.jobTitle.trim()
        : "";

    const phone =
      typeof body.phone === "string"
        ? body.phone.trim()
        : "";

    const notes =
      typeof body.notes === "string"
        ? body.notes.trim()
        : "";

    /*
     * Validate name.
     */
    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Name is required.",
        },
        { status: 400 }
      );
    }

    /*
     * Validate email.
     */
    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Email is required.",
        },
        { status: 400 }
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
        { status: 400 }
      );
    }

    /*
     * Validate role.
     */
    if (!isUserRole(role)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid role.",
        },
        { status: 400 }
      );
    }

    /*
     * Validate status.
     */
    if (!isUserStatus(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid status.",
        },
        { status: 400 }
      );
    }

    /*
     * Validate department.
     */
    if (!department) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Department is required.",
        },
        { status: 400 }
      );
    }

    /*
     * Validate job title.
     */
    if (!jobTitle) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Job title is required.",
        },
        { status: 400 }
      );
    }

    /*
     * Read all users so we can
     * check duplicate emails.
     */
    const allUsers =
      await getUsers();

    const duplicateUser =
      allUsers.find(
        (item) =>
          item.id !== userId &&
          item.email.toLowerCase() ===
            email
      );

    if (duplicateUser) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A user with this email already exists.",
        },
        { status: 409 }
      );
    }

    /*
     * Check whether profile
     * information changed.
     *
     * Status is handled separately
     * so we can create a specific
     * status-change activity.
     */
    const profileChanged =
      previousUser.name !== name ||
      previousUser.email !== email ||
      previousUser.role !== role ||
      previousUser.department !==
        department ||
      previousUser.jobTitle !==
        jobTitle ||
      previousUser.phone !== phone ||
      previousUser.notes !== notes;

    /*
     * Check whether status changed.
     */
    const statusChanged =
      previousUser.status !== status;

    /*
     * Save the changes into
     * data/users.json.
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
        }
      );

    if (!updatedUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        { status: 404 }
      );
    }

    /*
     * Record profile activity only
     * when profile information
     * actually changed.
     */
    if (profileChanged) {
      recordUserUpdated(userId);
    }

    /*
     * Record status activity only
     * when Active/Inactive changed.
     */
    if (statusChanged) {
      recordUserStatusChanged(
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

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to update user.",
      },
      { status: 500 }
    );
  }
}

/*
 * DELETE USER
 */
export async function DELETE(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
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
        { status: 401 }
      );
    }

    /*
     * Only Administrator can
     * delete users.
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
        { status: 403 }
      );
    }

    const { id } = await context.params;

    const userId = Number(id);

    if (!Number.isInteger(userId)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid user ID.",
        },
        { status: 400 }
      );
    }

    /*
     * Get the user before deleting
     * so we can return it.
     */
    const existingUser =
      await getUserById(userId);

    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          message:
            "User not found.",
        },
        { status: 404 }
      );
    }

    /*
     * Delete from data/users.json.
     */
    const deleted =
      await deleteUser(userId);

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          message:
            "User not found.",
        },
        { status: 404 }
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
      { status: 500 }
    );
  }
}