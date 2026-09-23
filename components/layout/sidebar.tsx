"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: "●",
  },
  {
    name: "Users",
    href: "/users",
    icon: "●",
  },

];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-white lg:flex lg:flex-col">
      <div className="flex h-16 items-center border-b px-6">
        <Link
          href="/dashboard"
          className="text-lg font-bold text-gray-900"
        >
          TECHNICAL ASSESSMENT
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <span className="w-5 text-center">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <p className="text-xs font-medium text-gray-700">
          TECHNICAL ASSESSMENT
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Management Portal
        </p>
      </div>
    </aside>
  );
}