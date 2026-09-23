import fs from "fs";
import path from "path";

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

const usersFilePath = path.join(
  process.cwd(),
  "data",
  "users.json"
);

function readUsers(): User[] {
  try {
    const fileContent = fs.readFileSync(
      usersFilePath,
      "utf-8"
    );

    const data = JSON.parse(fileContent);

    if (!Array.isArray(data)) {
      return [];
    }

    /*
     * Keep compatibility with older users
     * that were created before
     * accessJustification was added.
     */
    return data.map((user) => ({
      ...user,
      accessJustification:
        typeof user.accessJustification === "string"
          ? user.accessJustification
          : "",
    })) as User[];
  } catch (error) {
    console.error(
      "Failed to read users.json:",
      error
    );

    return [];
  }
}

function writeUsers(users: User[]) {
  fs.writeFileSync(
    usersFilePath,
    JSON.stringify(users, null, 2),
    "utf-8"
  );
}

export function getUsers(): User[] {
  return readUsers();
}

export function getUserById(
  id: number
): User | undefined {
  const users = readUsers();

  return users.find(
    (user) => user.id === id
  );
}

export function createUser(
  userData: Omit<User, "id" | "createdAt">
): User {
  const users = readUsers();

  const newId =
    users.length > 0
      ? Math.max(
          ...users.map(
            (user) => user.id
          )
        ) + 1
      : 1;

  const newUser: User = {
    ...userData,
    id: newId,
    createdAt: new Date()
      .toISOString()
      .split("T")[0],
  };

  users.push(newUser);

  writeUsers(users);

  return newUser;
}

export function updateUser(
  id: number,
  userData: Partial<
    Omit<User, "id" | "createdAt">
  >
): User | null {
  const users = readUsers();

  const userIndex =
    users.findIndex(
      (user) => user.id === id
    );

  if (userIndex === -1) {
    return null;
  }

  users[userIndex] = {
    ...users[userIndex],
    ...userData,
  };

  writeUsers(users);

  return users[userIndex];
}

export function deleteUser(
  id: number
): boolean {
  const users = readUsers();

  const userIndex =
    users.findIndex(
      (user) => user.id === id
    );

  if (userIndex === -1) {
    return false;
  }

  users.splice(userIndex, 1);

  writeUsers(users);

  return true;
}

export function deleteUsers(
  ids: number[]
): number[] {
  const users = readUsers();

  const validIds = [
    ...new Set(ids),
  ];

  const deletedIds =
    users
      .filter((user) =>
        validIds.includes(user.id)
      )
      .map((user) => user.id);

  if (deletedIds.length === 0) {
    return [];
  }

  const remainingUsers =
    users.filter(
      (user) =>
        !deletedIds.includes(
          user.id
        )
    );

  writeUsers(remainingUsers);

  return deletedIds;
}