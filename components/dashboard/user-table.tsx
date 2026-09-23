"use client";

import Link from "next/link";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { useSession } from "next-auth/react";

import ConfirmationModal from "@/components/ui/confirmation-modal";

import {
  canDeleteUsers,
  canManageUsers,
} from "@/lib/auth/permissions";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: "Active" | "Inactive";
  department: string;
  jobTitle: string;
  phone: string;
  notes: string;
}

interface UsersResponse {
  success: boolean;
  data?: User[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

type SortField =
  | "name"
  | "email"
  | "role"
  | "status"
  | "department"
  | "jobTitle";

type SortDirection = "asc" | "desc";

export default function UserTable() {
  const { data: session } = useSession();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [users, setUsers] = useState<User[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [deleteUserId, setDeleteUserId] =
    useState<number | null>(null);

  const [
    showBulkDeleteModal,
    setShowBulkDeleteModal,
  ] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);

  const userRole = session?.user?.role;

  const canEditUsers = canManageUsers(userRole);
  const canDelete = canDeleteUsers(userRole);

  const page = Math.max(
    1,
    Number(searchParams.get("page")) || 1
  );

  const pageSize = Math.max(
    1,
    Number(searchParams.get("pageSize")) || 10
  );

  const search = searchParams.get("search") || "";

  const status = searchParams.get("status") || "All";

  const role = searchParams.get("role") || "All";

  const sortField =
    (searchParams.get("sortField") as SortField) ||
    "name";

  const sortDirection: SortDirection =
    searchParams.get("sortDirection") === "desc"
      ? "desc"
      : "asc";

  /*
   * UPDATE URL QUERY
   */
  const updateQuery = (
    updates: Record<string, string>
  ) => {
    const params = new URLSearchParams(
      searchParams.toString()
    );

    Object.entries(updates).forEach(
      ([key, value]) => {
        if (!value || value === "All") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
    );

    const query = params.toString();

    router.push(
      query
        ? `${pathname}?${query}`
        : pathname
    );
  };

  /*
   * BUILD API REQUEST PARAMETERS
   *
   * useCallback keeps the function stable
   * between renders unless one of its
   * dependencies changes.
   */
  const buildRequestParams = useCallback(() => {
    const params = new URLSearchParams();

    params.set("page", String(page));
    params.set("pageSize", String(pageSize));

    if (search) {
      params.set("search", search);
    }

    if (status !== "All") {
      params.set("status", status);
    }

    if (role !== "All") {
      params.set("role", role);
    }

    params.set("sortField", sortField);
    params.set(
      "sortDirection",
      sortDirection
    );

    return params;
  }, [
    page,
    pageSize,
    search,
    status,
    role,
    sortField,
    sortDirection,
  ]);

  /*
   * APPLY USERS API RESPONSE
   */
  const applyUsersResponse = useCallback(
    (result: UsersResponse) => {
      if (
        !result.data ||
        !result.pagination
      ) {
        throw new Error(
          result.message ||
            "Invalid users response."
        );
      }

      setUsers(result.data);

      setTotalUsers(
        result.pagination.total
      );

      setTotalPages(
        Math.max(
          1,
          result.pagination.totalPages
        )
      );

      setSelectedIds((current) =>
        current.filter((id) =>
          result.data?.some(
            (user) => user.id === id
          )
        )
      );
    },
    []
  );

  /*
   * LOAD USERS
   */
  useEffect(() => {
    const controller =
      new AbortController();

    const loadUsers = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const params =
          buildRequestParams();

        const response = await fetch(
          `/api/users?${params.toString()}`,
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const result: UsersResponse =
          await response.json();

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ||
              "Failed to load users."
          );
        }

        applyUsersResponse(result);
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Failed to load users."
        );
      } finally {
        if (
          !controller.signal.aborted
        ) {
          setIsLoading(false);
        }
      }
    };

    void loadUsers();

    return () => {
      controller.abort();
    };
  }, [
    buildRequestParams,
    applyUsersResponse,
  ]);

  /*
   * MANUAL REFRESH / RETRY
   */
  const refreshUsers = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const params =
        buildRequestParams();

      const response = await fetch(
        `/api/users?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      const result: UsersResponse =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Failed to load users."
        );
      }

      applyUsersResponse(result);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to load users."
      );
    } finally {
      setIsLoading(false);
    }
  };

  /*
   * SELECT ALL USERS ON CURRENT PAGE
   */
  const toggleSelectAll = () => {
    if (!canDelete) {
      return;
    }

    const currentPageIds =
      users.map(
        (user) => user.id
      );

    const allSelected =
      currentPageIds.length > 0 &&
      currentPageIds.every((id) =>
        selectedIds.includes(id)
      );

    if (allSelected) {
      setSelectedIds((current) =>
        current.filter(
          (id) =>
            !currentPageIds.includes(id)
        )
      );
    } else {
      setSelectedIds((current) => [
        ...new Set([
          ...current,
          ...currentPageIds,
        ]),
      ]);
    }
  };

  /*
   * SELECT SINGLE USER
   */
  const toggleSelectUser = (
    id: number
  ) => {
    if (!canDelete) {
      return;
    }

    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter(
            (selectedId) =>
              selectedId !== id
          )
        : [...current, id]
    );
  };

  /*
   * SINGLE DELETE
   *
   * Optimistic update:
   * Remove user immediately.
   *
   * Error recovery:
   * Restore previous state if
   * API request fails.
   */
  const handleDeleteUser =
    async () => {
      if (
        deleteUserId === null ||
        !canDelete
      ) {
        return;
      }

      const previousUsers = [
        ...users,
      ];

      const previousTotalUsers =
        totalUsers;

      const previousSelectedIds = [
        ...selectedIds,
      ];

      const userIdToDelete =
        deleteUserId;

      try {
        setIsDeleting(true);
        setErrorMessage("");

        setUsers((current) =>
          current.filter(
            (user) =>
              user.id !==
              userIdToDelete
          )
        );

        setTotalUsers((current) =>
          Math.max(
            0,
            current - 1
          )
        );

        setSelectedIds((current) =>
          current.filter(
            (id) =>
              id !==
              userIdToDelete
          )
        );

        setDeleteUserId(null);

        const response =
          await fetch(
            `/api/users/${userIdToDelete}`,
            {
              method: "DELETE",
            }
          );

        const result =
          await response.json();

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ||
              "Failed to delete user."
          );
        }

        await refreshUsers();
      } catch (error) {
        setUsers(
          previousUsers
        );

        setTotalUsers(
          previousTotalUsers
        );

        setSelectedIds(
          previousSelectedIds
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Failed to delete user."
        );
      } finally {
        setIsDeleting(false);
      }
    };

  /*
   * BULK DELETE
   */
  const handleBulkDelete =
    async () => {
      if (
        selectedIds.length === 0 ||
        !canDelete
      ) {
        return;
      }

      const previousUsers = [
        ...users,
      ];

      const previousTotalUsers =
        totalUsers;

      const previousSelectedIds = [
        ...selectedIds,
      ];

      const idsToDelete = [
        ...selectedIds,
      ];

      try {
        setIsDeleting(true);
        setErrorMessage("");

        setUsers((current) =>
          current.filter(
            (user) =>
              !idsToDelete.includes(
                user.id
              )
          )
        );

        setTotalUsers((current) =>
          Math.max(
            0,
            current -
              idsToDelete.length
          )
        );

        setSelectedIds([]);

        setShowBulkDeleteModal(
          false
        );

        const response =
          await fetch(
            "/api/users/bulk-delete",
            {
              method: "DELETE",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                ids: idsToDelete,
              }),
            }
          );

        const result =
          await response.json();

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ||
              "Failed to delete selected users."
          );
        }

        await refreshUsers();
      } catch (error) {
        setUsers(
          previousUsers
        );

        setTotalUsers(
          previousTotalUsers
        );

        setSelectedIds(
          previousSelectedIds
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Failed to delete selected users."
        );
      } finally {
        setIsDeleting(false);
      }
    };

  /*
   * SORT
   */
  const handleSort = (
    field: SortField
  ) => {
    const nextDirection =
      sortField === field &&
      sortDirection === "asc"
        ? "desc"
        : "asc";

    updateQuery({
      sortField: field,
      sortDirection:
        nextDirection,
      page: "1",
    });
  };

  /*
   * PAGINATION
   */
  const goToPage = (
    nextPage: number
  ) => {
    if (
      nextPage < 1 ||
      nextPage > totalPages
    ) {
      return;
    }

    updateQuery({
      page: String(nextPage),
    });
  };

  const allCurrentPageSelected =
    canDelete &&
    users.length > 0 &&
    users.every((user) =>
      selectedIds.includes(
        user.id
      )
    );

  const someCurrentPageSelected =
    canDelete &&
    users.some((user) =>
      selectedIds.includes(
        user.id
      )
    );

  const firstUserNumber =
    totalUsers === 0
      ? 0
      : (page - 1) *
          pageSize +
        1;

  const lastUserNumber =
    totalUsers === 0
      ? 0
      : Math.min(
          page * pageSize,
          totalUsers
        );

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="flex-1">
                <label
                  htmlFor="user-search"
                  className="sr-only"
                >
                  Search users
                </label>

                <input
                  id="user-search"
                  type="search"
                  value={search}
                  onChange={(
                    event
                  ) =>
                    updateQuery({
                      search:
                        event
                          .target
                          .value,
                      page: "1",
                    })
                  }
                  placeholder="Search users..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                />
              </div>

              <select
                value={status}
                onChange={(
                  event
                ) =>
                  updateQuery({
                    status:
                      event.target
                        .value,
                    page: "1",
                  })
                }
                className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                aria-label="Filter by status"
              >
                <option value="All">
                  All Statuses
                </option>

                <option value="Active">
                  Active
                </option>

                <option value="Inactive">
                  Inactive
                </option>
              </select>

              <select
                value={role}
                onChange={(
                  event
                ) =>
                  updateQuery({
                    role:
                      event.target
                        .value,
                    page: "1",
                  })
                }
                className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                aria-label="Filter by role"
              >
                <option value="All">
                  All Roles
                </option>

                <option value="Administrator">
                  Administrator
                </option>

                <option value="Manager">
                  Manager
                </option>

                <option value="User">
                  User
                </option>
              </select>
            </div>

            {canDelete &&
              selectedIds.length >
                0 && (
                <div className="flex flex-col gap-3 rounded-lg border border-red-100 bg-red-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-medium text-red-700">
                    {
                      selectedIds.length
                    }{" "}
                    user
                    {selectedIds.length ===
                    1
                      ? ""
                      : "s"}{" "}
                    selected
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setShowBulkDeleteModal(
                        true
                      )
                    }
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                  >
                    Delete Selected
                  </button>
                </div>
              )}
          </div>
        </div>

        {errorMessage && (
          <div
            className="flex flex-col gap-3 border-b border-red-200 bg-red-50 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
            role="alert"
          >
            <p className="text-sm text-red-700">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={
                refreshUsers
              }
              disabled={
                isLoading
              }
              className="w-fit rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading
                ? "Retrying..."
                : "Retry"}
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                {canDelete && (
                  <th className="w-12 px-5 py-3">
                    <input
                      type="checkbox"
                      checked={
                        allCurrentPageSelected
                      }
                      ref={(
                        element
                      ) => {
                        if (
                          element
                        ) {
                          element.indeterminate =
                            !allCurrentPageSelected &&
                            someCurrentPageSelected;
                        }
                      }}
                      onChange={
                        toggleSelectAll
                      }
                      aria-label="Select all users on this page"
                    />
                  </th>
                )}

                <th className="px-5 py-3">
                  <button
                    type="button"
                    onClick={() =>
                      handleSort(
                        "name"
                      )
                    }
                    className="font-semibold text-gray-700"
                  >
                    Name{" "}
                    {sortField ===
                      "name" &&
                      (sortDirection ===
                      "asc"
                        ? "↑"
                        : "↓")}
                  </button>
                </th>

                <th className="px-5 py-3">
                  <button
                    type="button"
                    onClick={() =>
                      handleSort(
                        "email"
                      )
                    }
                    className="font-semibold text-gray-700"
                  >
                    Email{" "}
                    {sortField ===
                      "email" &&
                      (sortDirection ===
                      "asc"
                        ? "↑"
                        : "↓")}
                  </button>
                </th>

                <th className="px-5 py-3">
                  <button
                    type="button"
                    onClick={() =>
                      handleSort(
                        "role"
                      )
                    }
                    className="font-semibold text-gray-700"
                  >
                    Role{" "}
                    {sortField ===
                      "role" &&
                      (sortDirection ===
                      "asc"
                        ? "↑"
                        : "↓")}
                  </button>
                </th>

                <th className="px-5 py-3">
                  <button
                    type="button"
                    onClick={() =>
                      handleSort(
                        "status"
                      )
                    }
                    className="font-semibold text-gray-700"
                  >
                    Status{" "}
                    {sortField ===
                      "status" &&
                      (sortDirection ===
                      "asc"
                        ? "↑"
                        : "↓")}
                  </button>
                </th>

                <th className="px-5 py-3">
                  Department
                </th>

                <th className="px-5 py-3">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({
                  length:
                    pageSize,
                }).map(
                  (_, index) => (
                    <tr
                      key={
                        index
                      }
                    >
                      <td
                        colSpan={
                          canDelete
                            ? 7
                            : 6
                        }
                        className="px-5 py-4"
                      >
                        <div className="h-5 w-full animate-pulse rounded bg-gray-100" />
                      </td>
                    </tr>
                  )
                )
              ) : users.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={
                      canDelete
                        ? 7
                        : 6
                    }
                    className="px-5 py-12 text-center"
                  >
                    <p className="font-medium text-gray-900">
                      No users found
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Try changing your
                      search or filters.
                    </p>
                  </td>
                </tr>
              ) : (
                users.map(
                  (user) => (
                    <tr
                      key={
                        user.id
                      }
                      className="transition hover:bg-gray-50"
                    >
                      {canDelete && (
                        <td className="px-5 py-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(
                              user.id
                            )}
                            onChange={() =>
                              toggleSelectUser(
                                user.id
                              )
                            }
                            aria-label={`Select ${user.name}`}
                          />
                        </td>
                      )}

                      <td className="px-5 py-4">
                        <Link
                          href={`/users/${user.id}`}
                          className="font-medium text-gray-900 hover:underline"
                        >
                          {
                            user.name
                          }
                        </Link>
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {
                          user.email
                        }
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {
                          user.role
                        }
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            user.status ===
                            "Active"
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {
                            user.status
                          }
                        </span>
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {
                          user.department
                        }
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/users/${user.id}`}
                            className="text-sm font-medium text-gray-900 hover:underline"
                          >
                            View
                          </Link>

                          {canEditUsers && (
                            <Link
                              href={`/users/${user.id}?edit=true`}
                              className="text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                              Edit
                            </Link>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteUserId(
                                  user.id
                                )
                              }
                              className="text-sm font-medium text-red-600 hover:text-red-700"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-500">
            {isLoading ? (
              "Loading users..."
            ) : totalUsers ===
              0 ? (
              "No users"
            ) : (
              <>
                Showing{" "}
                <span className="font-medium text-gray-900">
                  {
                    firstUserNumber
                  }
                </span>
                {" – "}
                <span className="font-medium text-gray-900">
                  {
                    lastUserNumber
                  }
                </span>
                {" of "}
                <span className="font-medium text-gray-900">
                  {totalUsers}
                </span>
                {" users"}
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              Page{" "}
              <span className="font-medium text-gray-900">
                {page}
              </span>
              {" of "}
              <span className="font-medium text-gray-900">
                {
                  totalPages
                }
              </span>
            </span>

            <button
              type="button"
              onClick={() =>
                goToPage(
                  page - 1
                )
              }
              disabled={
                isLoading ||
                page <= 1
              }
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>

            <button
              type="button"
              onClick={() =>
                goToPage(
                  page + 1
                )
              }
              disabled={
                isLoading ||
                page >=
                  totalPages
              }
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <ConfirmationModal
        open={
          canDelete &&
          deleteUserId !== null
        }
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        confirmText="Delete User"
        cancelText="Cancel"
        loading={isDeleting}
        danger
        onConfirm={
          handleDeleteUser
        }
        onCancel={() =>
          setDeleteUserId(
            null
          )
        }
      />

      <ConfirmationModal
        open={
          canDelete &&
          showBulkDeleteModal
        }
        title="Delete Selected Users"
        message={`Are you sure you want to delete ${selectedIds.length} selected user${
          selectedIds.length ===
          1
            ? ""
            : "s"
        }? This action cannot be undone.`}
        confirmText="Delete Selected"
        cancelText="Cancel"
        loading={isDeleting}
        danger
        onConfirm={
          handleBulkDelete
        }
        onCancel={() =>
          setShowBulkDeleteModal(
            false
          )
        }
      />
    </>
  );
}