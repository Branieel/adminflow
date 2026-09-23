"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface AnalyticsData {
  department: string;
  users: number;
}

interface AnalyticsChartProps {
  data: AnalyticsData[];
  isLoading: boolean;
}

export default function AnalyticsChart({
  data,
  isLoading,
}: AnalyticsChartProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-900">
          User Analytics
        </h2>

        <p className="text-sm text-gray-500">
          Users by department
        </p>
      </div>

      <div className="h-[300px] w-full">
        {isLoading ? (
          <div
            className="h-full w-full animate-pulse rounded-lg bg-gray-100"
            aria-label="Loading analytics chart"
          />
        ) : data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-500">
            No analytics data available.
          </div>
        ) : (
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis
                dataKey="department"
              />

              <YAxis />

              <Tooltip />

              <Bar dataKey="users" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

