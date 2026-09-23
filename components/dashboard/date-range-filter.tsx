"use client";

import { CalendarDays } from "lucide-react";
import { useState } from "react";

export default function DateRangeFilter() {
  const [selectedRange, setSelectedRange] = useState("30");

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <CalendarDays className="h-4 w-4" />
        Date range
      </div>

      <select
        value={selectedRange}
        onChange={(event) => setSelectedRange(event.target.value)}
        className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
        aria-label="Select date range"
      >
        <option value="7">Last 7 days</option>
        <option value="30">Last 30 days</option>
        <option value="90">Last 90 days</option>
        <option value="365">This year</option>
      </select>
    </div>
  );
}

