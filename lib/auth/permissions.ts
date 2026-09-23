export const ROLES = {
  ADMINISTRATOR: "Administrator",
  MANAGER: "Manager",
  USER: "User",
} as const;

export type UserRole =
  (typeof ROLES)[keyof typeof ROLES];

export function isAdministrator(
  role?: string | null
) {
  return role === ROLES.ADMINISTRATOR;
}

export function isManager(
  role?: string | null
) {
  return role === ROLES.MANAGER;
}

export function canManageUsers(
  role?: string | null
) {
  return (
    role === ROLES.ADMINISTRATOR ||
    role === ROLES.MANAGER
  );
}

export function canDeleteUsers(
  role?: string | null
) {
  return role === ROLES.ADMINISTRATOR;
}