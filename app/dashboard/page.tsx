"use client";

import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import KpiCard from "@/components/dashboard/kpi-card";
import AdminLayout from "@/components/layout/admin-layout";

const AnalyticsChart = dynamic(
  () =>
    import(
      "@/components/dashboard/analytics-chart"
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-80 animate-pulse rounded-xl border border-gray-200 bg-gray-100" />
    ),
  }
);

interface DashboardAnalytics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  administrators: number;
  managers: number;
  regularUsers: number;
  departmentAnalytics: {
    department: string;
    users: number;
  }[];
}

interface DashboardResponse {
  success: boolean;
  data?: DashboardAnalytics;
  message?: string;
}

type DateRange =
  | "7"
  | "30"
  | "90";

export default function DashboardPage() {
  const [analytics, setAnalytics] =
    useState<DashboardAnalytics | null>(
      null
    );

  const [dateRange, setDateRange] =
    useState<DateRange>("30");

  const [isLoading, setIsLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  /*
   * RETRY DASHBOARD REQUEST
   *
   * Used by the Retry button after
   * an API request fails.
   */
  const loadDashboard =
    useCallback(async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const params =
          new URLSearchParams();

        params.set(
          "range",
          dateRange
        );

        const response =
          await fetch(
            `/api/dashboard?${params.toString()}`,
            {
              cache: "no-store",
            }
          );

        const result: DashboardResponse =
          await response.json();

        if (
          !response.ok ||
          !result.success ||
          !result.data
        ) {
          throw new Error(
            result.message ||
              "Failed to load dashboard analytics."
          );
        }

        setAnalytics(
          result.data
        );
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Failed to load dashboard analytics."
        );
      } finally {
        setIsLoading(false);
      }
    }, [dateRange]);

  /*
   * INITIAL LOAD + DATE RANGE CHANGES
   */
  useEffect(() => {
    const controller =
      new AbortController();

    const fetchDashboard =
      async () => {
        try {
          const params =
            new URLSearchParams();

          params.set(
            "range",
            dateRange
          );

          const response =
            await fetch(
              `/api/dashboard?${params.toString()}`,
              {
                cache: "no-store",
                signal:
                  controller.signal,
              }
            );

          const result: DashboardResponse =
            await response.json();

          if (
            !response.ok ||
            !result.success ||
            !result.data
          ) {
            throw new Error(
              result.message ||
                "Failed to load dashboard analytics."
            );
          }

          if (
            !controller.signal.aborted
          ) {
            setAnalytics(
              result.data
            );

            setErrorMessage("");
          }
        } catch (error) {
          if (
            error instanceof DOMException &&
            error.name ===
              "AbortError"
          ) {
            return;
          }

          if (
            !controller.signal.aborted
          ) {
            setErrorMessage(
              error instanceof Error
                ? error.message
                : "Failed to load dashboard analytics."
            );
          }
        } finally {
          if (
            !controller.signal.aborted
          ) {
            setIsLoading(false);
          }
        }
      };

    /*
     * Schedule the asynchronous request
     * instead of synchronously updating
     * state from the effect body.
     */
    void fetchDashboard();

    return () => {
      controller.abort();
    };
  }, [dateRange]);

  const handleDateRangeChange = (
    value: DateRange
  ) => {
    setIsLoading(true);
    setErrorMessage("");
    setDateRange(value);
  };

  return (
    <AdminLayout>
      <main>
        <div className="mx-auto max-w-7xl">
          {/* HEADER */}
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Dashboard
              </h1>

              <p className="mt-2 text-gray-500">
                Monitor your business
                performance and activity.
              </p>
            </div>

            {/* DATE RANGE FILTER */}
            <div className="w-full lg:w-48">
              <label
                htmlFor="dashboard-date-range"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Date Range
              </label>

              <select
                id="dashboard-date-range"
                value={dateRange}
                onChange={(event) =>
                  handleDateRangeChange(
                    event.target
                      .value as DateRange
                  )
                }
                disabled={isLoading}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="7">
                  Last 7 Days
                </option>

                <option value="30">
                  Last 30 Days
                </option>

                <option value="90">
                  Last 90 Days
                </option>
              </select>
            </div>
          </div>

          {/* ERROR STATE */}
          {errorMessage && (
            <div
              className="mb-6 flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              role="alert"
            >
              <div>
                <p className="text-sm font-medium text-red-700">
                  Unable to load
                  dashboard
                </p>

                <p className="mt-1 text-sm text-red-600">
                  {errorMessage}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  loadDashboard
                }
                disabled={isLoading}
                className="w-fit rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading
                  ? "Retrying..."
                  : "Retry"}
              </button>
            </div>
          )}

          {/* KPI CARDS */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Total Users"
              value={
                isLoading
                  ? "..."
                  : String(
                      analytics
                        ?.totalUsers ??
                        0
                    )
              }
              change="Live"
              description="Total registered users"
            />

            <KpiCard
              title="Active Users"
              value={
                isLoading
                  ? "..."
                  : String(
                      analytics
                        ?.activeUsers ??
                        0
                    )
              }
              change="Live"
              description="Currently active users"
            />

            <KpiCard
              title="Inactive Users"
              value={
                isLoading
                  ? "..."
                  : String(
                      analytics
                        ?.inactiveUsers ??
                        0
                    )
              }
              change="Live"
              description="Inactive user accounts"
            />

            <KpiCard
              title="Administrators"
              value={
                isLoading
                  ? "..."
                  : String(
                      analytics
                        ?.administrators ??
                        0
                    )
              }
              change="Live"
              description="Administrator accounts"
            />
          </div>

          {/* ANALYTICS CHART */}
          <div className="mt-6">
            <AnalyticsChart
              data={
                analytics
                  ?.departmentAnalytics ??
                []
              }
              isLoading={
                isLoading
              }
            />
          </div>

          {/* ADDITIONAL KPI CARDS */}
          {!isLoading &&
            analytics && (
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-medium text-gray-500">
                    Managers
                  </p>

                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {
                      analytics.managers
                    }
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Manager accounts
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-medium text-gray-500">
                    Regular Users
                  </p>

                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {
                      analytics.regularUsers
                    }
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Standard user
                    accounts
                  </p>
                </div>
              </div>
            )}
        </div>
      </main>
    </AdminLayout>
  );
}