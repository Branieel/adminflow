"use client";

import { FormEvent, useState } from "react";

interface UserFormProps {
  onCancel?: () => void;
  onSuccess?: () => void;
}

export default function UserForm({
  onCancel,
  onSuccess,
}: UserFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("User");
  const [status, setStatus] = useState<"Active" | "Inactive">(
    "Active"
  );

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
  }>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const validate = () => {
    const newErrors: {
      name?: string;
      email?: string;
    } = {};

    if (!name.trim()) {
      newErrors.name = "Name is required.";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      newErrors.email = "Please enter a valid email address.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!validate()) {
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          role,
          status,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to create user."
        );
      }

      setSuccessMessage(
        result.message || "User created successfully."
      );

      setName("");
      setEmail("");
      setRole("User");
      setStatus("Active");
      setErrors({});

      onSuccess?.();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while creating the user."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Add New User
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Create a new user account and assign their role.
        </p>
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

      <form
        onSubmit={handleSubmit}
        className="space-y-5"
        noValidate
      >
        <div>
          <label
            htmlFor="user-name"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Full Name
          </label>

          <input
            id="user-name"
            type="text"
            value={name}
            onChange={(event) => {
              setName(event.target.value);

              if (errors.name) {
                setErrors((current) => ({
                  ...current,
                  name: undefined,
                }));
              }
            }}
            placeholder="Enter full name"
            disabled={isSubmitting}
            className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition disabled:cursor-not-allowed disabled:bg-gray-100 ${
              errors.name
                ? "border-red-500 focus:border-red-500"
                : "border-gray-300 focus:border-gray-900"
            }`}
          />

          {errors.name && (
            <p className="mt-1.5 text-sm text-red-600">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="user-email"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Email Address
          </label>

          <input
            id="user-email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);

              if (errors.email) {
                setErrors((current) => ({
                  ...current,
                  email: undefined,
                }));
              }
            }}
            placeholder="Enter email address"
            disabled={isSubmitting}
            className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition disabled:cursor-not-allowed disabled:bg-gray-100 ${
              errors.email
                ? "border-red-500 focus:border-red-500"
                : "border-gray-300 focus:border-gray-900"
            }`}
          />

          {errors.email && (
            <p className="mt-1.5 text-sm text-red-600">
              {errors.email}
            </p>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="user-role"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Role
            </label>

            <select
              id="user-role"
              value={role}
              onChange={(event) =>
                setRole(event.target.value)
              }
              disabled={isSubmitting}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900 disabled:cursor-not-allowed disabled:bg-gray-100"
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
              htmlFor="user-status"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Status
            </label>

            <select
              id="user-status"
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value as
                    | "Active"
                    | "Inactive"
                )
              }
              disabled={isSubmitting}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900 disabled:cursor-not-allowed disabled:bg-gray-100"
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

        <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? "Creating..."
              : "Create User"}
          </button>
        </div>
      </form>
    </div>
  );
}

