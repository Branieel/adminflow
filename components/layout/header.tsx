"use client";

import { useSession } from "next-auth/react";

import LogoutButton from "@/components/auth/logout-button";

export default function Header() {
  const { data: session } = useSession();

  const userName = session?.user?.name || "Admin User";
  const userRole = session?.user?.role || "Administrator";

  const userInitials = userName
    .split(" ")
    .map((name) => name.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div>
        <h2 className="text-sm font-medium text-gray-900">
          Admin Dashboard
        </h2>

        <p className="text-xs text-gray-500">
          Management Portal
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100"
        >
          <span className="text-lg">🔔</span>

          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">
          {userInitials}
        </div>

        <div className="hidden sm:block">
          <p className="text-sm font-medium text-gray-900">
            {userName}
          </p>

          <p className="text-xs text-gray-500">
            {userRole}
          </p>
        </div>

        <LogoutButton />
      </div>
    </header>
  );
}