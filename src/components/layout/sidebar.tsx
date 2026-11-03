"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UploadCloud,
  PhoneCall,
  Calendar,
  Wrench,
  UserX,
  FileText,
  UserCog,
  MapPin,
  ClipboardList,
  ShieldAlert,
  ChevronDown,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type Role = "admin" | "panel_manager" | "call_center_agent" | "field_executive";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
}

interface SidebarProps {
  userRole?: Role;
  userName?: string;
  userEmail?: string;
  onLogout?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "panel_manager", "call_center_agent", "field_executive"],
  },
  {
    title: "Households",
    href: "/households",
    icon: Users,
    roles: ["admin", "panel_manager", "call_center_agent"],
  },
  {
    title: "Recruitment Uploader",
    href: "/imports",
    icon: UploadCloud,
    roles: ["admin", "panel_manager"],
  },
  {
    title: "Call Center",
    href: "/calls",
    icon: PhoneCall,
    roles: ["admin", "panel_manager", "call_center_agent"],
  },
  {
    title: "Appointments",
    href: "/appointments",
    icon: Calendar,
    roles: ["admin", "panel_manager", "call_center_agent", "field_executive"],
  },
  {
    title: "Field Installations",
    href: "/installations",
    icon: Wrench,
    roles: ["admin", "field_executive"],
  },
  {
    title: "Rejections & Matching",
    href: "/rejections",
    icon: UserX,
    roles: ["admin", "panel_manager"],
  },
  {
    title: "Questionnaires",
    href: "/questionnaires",
    icon: ClipboardList,
    roles: ["admin", "panel_manager"],
  },
  {
    title: "Reports",
    href: "/reports",
    icon: FileText,
    roles: ["admin", "panel_manager"],
  },
  {
    title: "Regions",
    href: "/regions",
    icon: MapPin,
    roles: ["admin"],
  },
  {
    title: "User Management",
    href: "/users",
    icon: UserCog,
    roles: ["admin", "panel_manager"],
  },
  {
    title: "Audit History",
    href: "/audits",
    icon: ShieldAlert,
    roles: ["admin"],
  },
];

export function Sidebar({
  userRole = "admin",
  userName = "System User",
  userEmail = "user@panelsphere.internal",
  onLogout,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const filteredItems = navItems.filter((item) => item.roles.includes(userRole));

  const initials = useMemo(() => {
    const tokens = (userName || "System User")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (tokens.length === 1) {
      return tokens[0].slice(0, 2).toUpperCase();
    }

    return `${tokens[0][0]}${tokens[tokens.length - 1][0]}`.toUpperCase();
  }, [userName]);

  return (
    <aside className={cn(
      "border-r border-slate-200 bg-white flex flex-col shrink-0 transition-all duration-200 overflow-hidden dark:border-slate-800 dark:bg-slate-900",
      isCollapsed ? "w-0 border-r-0" : "w-64",
      "min-h-[calc(100vh-4rem)]"
    )}>
      {!isCollapsed && (
        <div className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150",
                  isCollapsed ? "justify-center px-2 py-2.5" : "px-3 py-2",
                  isActive
                    ? "bg-blue-50 text-blue-700 font-semibold shadow-xs dark:bg-blue-950/60 dark:text-blue-300"
                    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                )}
                title={item.title}
                aria-label={item.title}
              >
                {!isCollapsed && (
                  <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-blue-600 dark:text-blue-300" : "text-slate-400 dark:text-slate-400")} />
                )}
                {!isCollapsed && <span>{item.title}</span>}
              </Link>
            );
          })}
        </div>
      )}

      {!isCollapsed && (
        <div className="p-4 border-t border-slate-100 relative dark:border-slate-800">
          <button
            type="button"
            onClick={() => setIsProfileOpen((prev) => !prev)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-500 text-sm font-bold text-white shadow-sm">
                  {initials}
                </div>
                <div className="min-w-0 overflow-hidden">
                  <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{userName}</div>
                  <div className="truncate text-[11px] text-slate-500 dark:text-slate-400">{userEmail}</div>
                </div>
              </div>
              <ChevronDown className={cn("h-4 w-4 text-slate-500 transition-transform dark:text-slate-400", isProfileOpen && "rotate-180")} />
            </div>
          </button>

          {isProfileOpen && (
            <div className="absolute bottom-[78px] left-4 right-4 rounded-xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Role</div>
              <div className="mb-3 rounded-lg bg-slate-100 px-2 py-1 text-sm font-medium capitalize text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                {userRole.replace("_", " ")}
              </div>

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

