"use client";

import type { Route } from "next";
import Link from "next/link";
import {
  BarChart3,
  CalendarRange,
  ClipboardList,
  FileStack,
  LayoutDashboard,
  ReceiptText,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  dashboardNavigationGroups,
  dashboardNavigationItems,
} from "@/lib/dashboard/navigation";
import { cn } from "@/lib/utils";

const navigationIcons: Record<string, LucideIcon> = {
  admin: ShieldCheck,
  appointments: CalendarRange,
  billing: ReceiptText,
  "clinical-notes": ClipboardList,
  documents: FileStack,
  overview: LayoutDashboard,
  patients: Users,
  reports: BarChart3,
};

function getStatusLabel(status: "live" | "shell") {
  return status === "live" ? "Live" : "Shell";
}

function isNavItemActive(pathname: string, href: string) {
  if (href === "/admin") {
    return (
      pathname === "/admin" ||
      pathname.startsWith("/admin/") ||
      pathname === "/team" ||
      pathname.startsWith("/team/")
    );
  }

  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-5">
      {dashboardNavigationGroups.map((group) => (
        <div className="space-y-2" key={group.id}>
          <div className="px-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              {group.label}
            </p>
            <p className="mt-1 text-xs text-slate-500">{group.description}</p>
          </div>
          <div className="space-y-2">
            {dashboardNavigationItems
              .filter((item) => item.groupId === group.id)
              .map((item) => {
                const Icon = navigationIcons[item.id];
                const isActive = isNavItemActive(pathname, item.href);

                return (
                  <Link
                    className={cn(
                      "block rounded-3xl border px-4 py-3 transition",
                      isActive
                        ? "border-sky-400/40 bg-sky-500/10 text-white"
                        : "border-white/5 bg-white/5 text-slate-300 hover:border-white/10 hover:text-white"
                    )}
                    href={item.href as Route}
                    key={item.href}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "mt-0.5 rounded-2xl border p-2",
                            isActive
                              ? "border-sky-400/40 bg-sky-500/15 text-sky-100"
                              : "border-white/10 bg-slate-950/40 text-slate-400"
                          )}
                        >
                          <Icon className="size-4" />
                        </div>
                        <div>
                          <p className="font-medium">{item.label}</p>
                          <p className="text-sm text-slate-400">{item.description}</p>
                        </div>
                      </div>
                      <Badge variant={item.status === "live" ? "secondary" : "outline"}>
                        {getStatusLabel(item.status)}
                      </Badge>
                    </div>
                  </Link>
                );
              })}
          </div>
        </div>
      ))}
    </nav>
  );
}
