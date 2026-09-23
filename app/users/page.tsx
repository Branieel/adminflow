"use client";

import {
  Suspense,
  useState,
} from "react";

import { useSession } from "next-auth/react";

import AdminLayout from "@/components/layout/admin-layout";
import UserTable from "@/components/dashboard/user-table";
import AdvancedUserForm from "@/components/dashboard/advanced-user-form";
import { canManageUsers } from "@/lib/auth/permissions";

function UsersContent() {
  const { data: session } = useSession();

  const [showForm, setShowForm] =
    useState(false);

  const [refreshKey, setRefreshKey] =
    useState(0);

  const userRole =
    session?.user?.role;

  const canCreateUsers =
    canManageUsers(userRole);

  const handleUserCreated = () => {
    setShowForm(false);

    setRefreshKey(
      (current) => current + 1
    );
  };

  return (
    <main>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Users
          </h1>

          <p className="mt-2 text-gray-500">
            Manage users and their account information.
          </p>
        </div>

        {canCreateUsers && (
          <button
            type="button"
            onClick={() =>
              setShowForm(true)
            }
            className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            + Add User
          </button>
        )}
      </div>

      {showForm &&
        canCreateUsers && (
          <div className="mb-6">
            <AdvancedUserForm
              onCancel={() =>
                setShowForm(false)
              }
              onSuccess={
                handleUserCreated
              }
            />
          </div>
        )}

      <UserTable
        key={refreshKey}
      />
    </main>
  );
}

export default function UsersPage() {
  return (
    <AdminLayout>
      <Suspense
        fallback={
          <main>
            <div className="mb-6">
              <div className="h-9 w-32 animate-pulse rounded-lg bg-gray-200" />

              <div className="mt-3 h-5 w-80 animate-pulse rounded bg-gray-200" />
            </div>

            <div className="h-96 animate-pulse rounded-xl border border-gray-200 bg-white" />
          </main>
        }
      >
        <UsersContent />
      </Suspense>
    </AdminLayout>
  );
}