import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: "Active" | "Inactive";
  department: string;
  jobTitle: string;
  phone: string;
  notes: string;
  accessJustification: string;
  createdAt: string;
}

function toUser(user: {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  department: string;
  jobTitle: string;
  phone: string;
  notes: string;
  accessJustification: string;
  createdAt: Date;
}): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status:
      user.status === "Inactive"
        ? "Inactive"
        : "Active",
    department: user.department,
    jobTitle: user.jobTitle,
    phone: user.phone,
    notes: user.notes,
    accessJustification:
      user.accessJustification,
    createdAt:
      user.createdAt
        .toISOString()
        .split("T")[0],
  };
}

export async function getUsers(): Promise<User[]> {
  const users = await prisma.user.findMany({
    orderBy: {
      id: "asc",
    },
  });

  return users.map(toUser);
}

export async function getUserById(
  id: number
): Promise<User | undefined> {
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
  });

  return user ? toUser(user) : undefined;
}

export async function createUser(
  userData: Omit<User, "id" | "createdAt">
): Promise<User> {
  const user = await prisma.user.create({
    data: {
      name: userData.name,
      email: userData.email,
      role: userData.role,
      status: userData.status,
      department: userData.department,
      jobTitle: userData.jobTitle,
      phone: userData.phone,
      notes: userData.notes,
      accessJustification:
        userData.accessJustification,
    },
  });

  return toUser(user);
}

export async function updateUser(
  id: number,
  userData: Partial<
    Omit<User, "id" | "createdAt">
  >
): Promise<User | null> {
  const existingUser =
    await prisma.user.findUnique({
      where: { id },
    });

  if (!existingUser) {
    return null;
  }

  const user =
    await prisma.user.update({
      where: { id },
      data: {
        ...(userData.name !== undefined && {
          name: userData.name,
        }),
        ...(userData.email !== undefined && {
          email: userData.email,
        }),
        ...(userData.role !== undefined && {
          role: userData.role,
        }),
        ...(userData.status !== undefined && {
          status: userData.status,
        }),
        ...(userData.department !== undefined && {
          department: userData.department,
        }),
        ...(userData.jobTitle !== undefined && {
          jobTitle: userData.jobTitle,
        }),
        ...(userData.phone !== undefined && {
          phone: userData.phone,
        }),
        ...(userData.notes !== undefined && {
          notes: userData.notes,
        }),
        ...(userData.accessJustification !==
          undefined && {
          accessJustification:
            userData.accessJustification,
        }),
      },
    });

  return toUser(user);
}

export async function deleteUser(
  id: number
): Promise<boolean> {
  const existingUser =
    await prisma.user.findUnique({
      where: { id },
    });

  if (!existingUser) {
    return false;
  }

  await prisma.user.delete({
    where: { id },
  });

  return true;
}

export async function deleteUsers(
  ids: number[]
): Promise<number[]> {
  const uniqueIds = [
    ...new Set(ids),
  ];

  if (uniqueIds.length === 0) {
    return [];
  }

  const result =
    await prisma.user.deleteMany({
      where: {
        id: {
          in: uniqueIds,
        },
      },
    });

  return uniqueIds.slice(
    0,
    result.count
  );
}