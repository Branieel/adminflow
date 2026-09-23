"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { canManageUsers } from "@/lib/auth/permissions";

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

interface UserDetailActionsProps {
  user: User;
}

export default function UserDetailActions({
  user,
}: UserDetailActionsProps) {
  const router = useRouter();

  const {
    data: session,
    status: sessionStatus,
  } = useSession();

  const canEdit = canManageUsers(
    session?.user?.role
  );

  const [isEditing, setIsEditing] =
    useState(false);

  const [name, setName] =
    useState(user.name);

  const [email, setEmail] =
    useState(user.email);

  const [role, setRole] =
    useState(user.role);

  const [status, setStatus] =
    useState<"Active" | "Inactive">(
      user.status
    );

  const [department, setDepartment] =
    useState(user.department || "");

  const [jobTitle, setJobTitle] =
    useState(user.jobTitle || "");

  const [phone, setPhone] =
    useState(user.phone || "");

  const [notes, setNotes] =
    useState(user.notes || "");

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    department?: string;
    jobTitle?: string;
  }>({});

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [isSaving, setIsSaving] =
    useState(false);

  const validate = () => {
    const newErrors: {
      name?: string;
      email?: string;
      department?: string;
      jobTitle?: string;
    } = {};

    if (!name.trim()) {
      newErrors.name =
        "Name is required.";
    }

    if (!email.trim()) {
      newErrors.email =
        "Email is required.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email.trim()
      )
    ) {
      newErrors.email =
        "Please enter a valid email address.";
    }

    if (!department.trim()) {
      newErrors.department =
        "Department is required.";
    }

    if (!jobTitle.trim()) {
      newErrors.jobTitle =
        "Job title is required.";
    }

    setErrors(newErrors);

    return (
      Object.keys(newErrors).length === 0
    );
  };

  const startEdit = () => {
    if (!canEdit) {
      return;
    }

    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setStatus(user.status);
    setDepartment(
      user.department || ""
    );
    setJobTitle(
      user.jobTitle || ""
    );
    setPhone(user.phone || "");
    setNotes(user.notes || "");

    setErrors({});
    setErrorMessage("");
    setSuccessMessage("");

    setIsEditing(true);
  };

  const cancelEdit = () => {
    if (isSaving) {
      return;
    }

    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setStatus(user.status);
    setDepartment(
      user.department || ""
    );
    setJobTitle(
      user.jobTitle || ""
    );
    setPhone(user.phone || "");
    setNotes(user.notes || "");

    setErrors({});
    setErrorMessage("");
    setSuccessMessage("");

    setIsEditing(false);
  };

  const saveChanges = async () => {
    if (!canEdit) {
      setErrorMessage(
        "You do not have permission to update users."
      );

      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    if (!validate()) {
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch(
        `/api/users/${user.id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            name: name.trim(),
            email: email
              .trim()
              .toLowerCase(),
            role,
            status,
            department:
              department.trim(),
            jobTitle:
              jobTitle.trim(),
            phone: phone.trim(),
            notes: notes.trim(),
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
            "Failed to update user."
        );
      }

      setSuccessMessage(
        "User updated successfully."
      );

      setIsEditing(false);

      /*
       * Important:
       * Refresh the current Next.js route.
       *
       * This causes the Server Component
       * app/users/[id]/page.tsx
       * to fetch the user again.
       */
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to update user."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4 flex justify-end">
        {sessionStatus ===
          "authenticated" &&
          canEdit &&
          !isEditing && (
            <button
              type="button"
              onClick={startEdit}
              className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              Edit User
            </button>
          )}
      </div>

      {errorMessage && (
        <div
          className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div
          className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
          role="status"
        >
          {successMessage}
        </div>
      )}

      {isEditing && canEdit && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
          <div className="mb-5">
            <h3 className="text-base font-semibold text-gray-900">
              Edit User Information
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Update the user&apos;s
              account and work
              information.
            </p>
          </div>

          <div className="space-y-5">
            {/* NAME */}

            <div>
              <label
                htmlFor="detail-user-name"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Full Name
              </label>

              <input
                id="detail-user-name"
                type="text"
                value={name}
                onChange={(event) => {
                  setName(
                    event.target.value
                  );

                  if (errors.name) {
                    setErrors(
                      (current) => ({
                        ...current,
                        name: undefined,
                      })
                    );
                  }
                }}
                disabled={isSaving}
                className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none ${
                  errors.name
                    ? "border-red-500"
                    : "border-gray-300 focus:border-gray-900"
                }`}
              />

              {errors.name && (
                <p className="mt-1.5 text-sm text-red-600">
                  {errors.name}
                </p>
              )}
            </div>

            {/* EMAIL */}

            <div>
              <label
                htmlFor="detail-user-email"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>

              <input
                id="detail-user-email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(
                    event.target.value
                  );

                  if (errors.email) {
                    setErrors(
                      (current) => ({
                        ...current,
                        email: undefined,
                      })
                    );
                  }
                }}
                disabled={isSaving}
                className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none ${
                  errors.email
                    ? "border-red-500"
                    : "border-gray-300 focus:border-gray-900"
                }`}
              />

              {errors.email && (
                <p className="mt-1.5 text-sm text-red-600">
                  {errors.email}
                </p>
              )}
            </div>

            {/* ROLE / STATUS */}

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="detail-user-role"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Role
                </label>

                <select
                  id="detail-user-role"
                  value={role}
                  onChange={(event) =>
                    setRole(
                      event.target.value
                    )
                  }
                  disabled={isSaving}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                >
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

              <div>
                <label
                  htmlFor="detail-user-status"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Status
                </label>

                <select
                  id="detail-user-status"
                  value={status}
                  onChange={(event) =>
                    setStatus(
                      event.target
                        .value as
                        | "Active"
                        | "Inactive"
                    )
                  }
                  disabled={isSaving}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                >
                  <option value="Active">
                    Active
                  </option>

                  <option value="Inactive">
                    Inactive
                  </option>
                </select>
              </div>
            </div>

            {/* DEPARTMENT / JOB TITLE */}

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="detail-user-department"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Department
                </label>

                <select
                  id="detail-user-department"
                  value={department}
                  onChange={(event) => {
                    setDepartment(
                      event.target.value
                    );

                    if (
                      errors.department
                    ) {
                      setErrors(
                        (current) => ({
                          ...current,
                          department:
                            undefined,
                        })
                      );
                    }
                  }}
                  disabled={isSaving}
                  className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none ${
                    errors.department
                      ? "border-red-500"
                      : "border-gray-300 focus:border-gray-900"
                  }`}
                >
                  <option value="">
                    Select department
                  </option>

                  <option value="IT">
                    IT
                  </option>

                  <option value="Finance">
                    Finance
                  </option>

                  <option value="Human Resources">
                    Human Resources
                  </option>

                  <option value="Sales">
                    Sales
                  </option>

                  <option value="Operations">
                    Operations
                  </option>
                </select>

                {errors.department && (
                  <p className="mt-1.5 text-sm text-red-600">
                    {
                      errors.department
                    }
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="detail-user-job-title"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Job Title
                </label>

                <input
                  id="detail-user-job-title"
                  type="text"
                  value={jobTitle}
                  onChange={(event) => {
                    setJobTitle(
                      event.target.value
                    );

                    if (
                      errors.jobTitle
                    ) {
                      setErrors(
                        (current) => ({
                          ...current,
                          jobTitle:
                            undefined,
                        })
                      );
                    }
                  }}
                  disabled={isSaving}
                  placeholder="e.g. IT Specialist"
                  className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none ${
                    errors.jobTitle
                      ? "border-red-500"
                      : "border-gray-300 focus:border-gray-900"
                  }`}
                />

                {errors.jobTitle && (
                  <p className="mt-1.5 text-sm text-red-600">
                    {errors.jobTitle}
                  </p>
                )}
              </div>
            </div>

            {/* PHONE */}

            <div>
              <label
                htmlFor="detail-user-phone"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Phone Number
              </label>

              <input
                id="detail-user-phone"
                type="tel"
                value={phone}
                onChange={(event) =>
                  setPhone(
                    event.target.value
                  )
                }
                disabled={isSaving}
                placeholder="+971 50 000 0000"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900"
              />
            </div>

            {/* NOTES */}

            <div>
              <label
                htmlFor="detail-user-notes"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Notes
              </label>

              <textarea
                id="detail-user-notes"
                value={notes}
                onChange={(event) =>
                  setNotes(
                    event.target.value
                  )
                }
                disabled={isSaving}
                rows={4}
                placeholder="Add optional notes..."
                className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900"
              />
            </div>
          </div>

          {/* BUTTONS */}

          <div className="mt-6 flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={cancelEdit}
              disabled={isSaving}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={saveChanges}
              disabled={isSaving}
              className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving
                ? "Saving..."
                : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}