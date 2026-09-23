"use client";

import {
  FormEvent,
  Suspense,
  useState,
} from "react";

import { signIn } from "next-auth/react";

import { useSearchParams } from "next/navigation";

function LoginForm() {
  const searchParams = useSearchParams();

  const [email, setEmail] =
    useState("admin@adminflow.com");

  const [password, setPassword] =
    useState("Admin@123");

  const [isLoading, setIsLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setErrorMessage("");
    setIsLoading(true);

    const result = await signIn(
      "credentials",
      {
        email,
        password,
        redirect: false,
      }
    );

    if (!result?.ok) {
      setErrorMessage(
        "Invalid email or password."
      );

      setIsLoading(false);
      return;
    }

    const callbackUrl =
      searchParams.get("callbackUrl") ||
      "/dashboard";

    window.location.href = callbackUrl;
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gray-900 text-lg font-bold text-white">
              A
            </div>

            <h1 className="mt-5 text-2xl font-bold text-gray-900">
              AdminFlow
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Sign in to your administration portal.
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

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                disabled={isLoading}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900 disabled:cursor-not-allowed disabled:bg-gray-50"
                placeholder="admin@adminflow.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                disabled={isLoading}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900 disabled:cursor-not-allowed disabled:bg-gray-50"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading
                ? "Signing in..."
                : "Sign In"}
            </button>
          </form>

          <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-medium text-gray-500">
              Development account
            </p>

            <p className="mt-1 text-xs text-gray-600">
              admin@adminflow.com
            </p>

            <p className="text-xs text-gray-600">
              Admin@123
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
          <div className="w-full max-w-md">
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
              <p className="text-sm text-gray-500">
                Loading...
              </p>
            </div>
          </div>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

