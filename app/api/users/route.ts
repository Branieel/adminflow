import {
  NextRequest,
  NextResponse,
} from "next/server";

import { auth } from "@/auth";

import {
  createUser,
  getUsers,
} from "@/lib/users";

import {
  canManageUsers,
} from "@/lib/auth/permissions";

import {
  recordUserCreated,
} from "@/lib/user-activity";

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
 * GET USERS
 *
 * Supports:
 * - Authentication
 * - Server-side pagination
 * - Search
 * - Status filtering
 * - Role filtering
 * - Sorting
 */
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
     * PostgreSQL/Prisma is asynchronous,
     * so we must wait for the users.
     */
    const users = await getUsers();

    const { searchParams } =
      new URL(request.url);

    const page = Math.max(
      1,
      Number(
        searchParams.get("page")
      ) || 1
    );

    const requestedPageSize =
      Number(
        searchParams.get(
          "pageSize"
        )
      ) || 10;

    const pageSize = Math.min(
      100,
      Math.max(
        1,
        requestedPageSize
      )
    );

    const search =
      searchParams
        .get("search")
        ?.toLowerCase()
        .trim() || "";

    const status =
      searchParams.get("status") ||
      "All";

    const role =
      searchParams.get("role") ||
      "All";

    const sortField =
      searchParams.get(
        "sortField"
      ) || "name";

    const sortDirection =
      searchParams.get(
        "sortDirection"
      ) === "desc"
        ? "desc"
        : "asc";

    /*
     * Search and filtering.
     */
    const filteredUsers =
      users.filter((user) => {
        const matchesSearch =
          !search ||
          user.name
            .toLowerCase()
            .includes(search) ||
          user.email
            .toLowerCase()
            .includes(search) ||
          user.role
            .toLowerCase()
            .includes(search) ||
          user.department
            .toLowerCase()
            .includes(search) ||
          user.jobTitle
            .toLowerCase()
            .includes(search);

        const matchesStatus =
          status === "All" ||
          user.status === status;

        const matchesRole =
          role === "All" ||
          user.role === role;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesRole
        );
      });

    /*
     * Only allow known sorting fields.
     */
    const allowedSortFields = [
      "name",
      "email",
      "role",
      "status",
      "department",
      "jobTitle",
    ] as const;

    const validSortField =
      allowedSortFields.includes(
        sortField as
          (typeof allowedSortFields)[number]
      )
        ? (sortField as
            (typeof allowedSortFields)[number])
        : "name";

    const sortedUsers = [
      ...filteredUsers,
    ].sort((a, b) => {
      const first = String(
        a[validSortField]
      ).toLowerCase();

      const second = String(
        b[validSortField]
      ).toLowerCase();

      const result =
        first.localeCompare(
          second
        );

      return sortDirection ===
        "asc"
        ? result
        : -result;
    });

    /*
     * Server-side pagination.
     */
    const total =
      sortedUsers.length;

    const totalPages =
      Math.max(
        1,
        Math.ceil(
          total / pageSize
        )
      );

    const safePage =
      Math.min(
        page,
        totalPages
      );

    const startIndex =
      (safePage - 1) *
      pageSize;

    const paginatedUsers =
      sortedUsers.slice(
        startIndex,
        startIndex +
          pageSize
      );

    return NextResponse.json({
      success: true,
      data: paginatedUsers,
      pagination: {
        page: safePage,
        pageSize,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error(
      "GET /api/users error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load users.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * CREATE USER
 */
export async function POST(
  request: NextRequest
) {
  try {
    const session = await auth();

    /*
     * Authentication check.
     */
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
     * Role-based API access.
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
            "Forbidden. You do not have permission to create users.",
        },
        {
          status: 403,
        }
      );
    }

    let body: Record<
      string,
      unknown
    >;

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

    /*
     * Normalize incoming data.
     */
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
        : "";

    /*
     * SERVER-SIDE VALIDATION
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

    /*
     * Administrator accounts require
     * an access justification.
     */
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
     * Duplicate email protection.
     *
     * getUsers() now reads from
     * PostgreSQL through Prisma.
     */
    const users =
      await getUsers();

    const existingUser =
      users.find(
        (user) =>
          user.email
            .toLowerCase() ===
          email
      );

    if (existingUser) {
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
     * Create and persist user
     * in PostgreSQL.
     */
    const newUser =
      await createUser({
        name,
        email,
        role,
        status,
        department,
        jobTitle,
        phone,
        notes,
        accessJustification,
      });

    /*
     * Add creation event to
     * Activity & History.
     */
    recordUserCreated(
      newUser.id,
      newUser.name
    );

    return NextResponse.json(
      {
        success: true,
        message:
          "User created successfully.",
        data: newUser,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST /api/users error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to create user.",
      },
      {
        status: 500,
      }
    );
  }
}