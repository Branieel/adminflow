interface KpiCardProps {
  title: string;
  value: string;
  change: string;
  description: string;
}

export default function KpiCard({
  title,
  value,
  change,
  description,
}: KpiCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">
          {title}
        </p>

        <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
          {change}
        </span>
      </div>

      <div className="mt-3">
        <p className="text-3xl font-bold text-gray-900">
          {value}
        </p>

        <p className="mt-1 text-sm text-gray-500">
          {description}
        </p>
      </div>
    </div>
  );
}