"use client";

import React, { useState } from "react";
import { Sidebar, Role } from "./sidebar";
import { Navbar } from "./navbar";
import { useTheme } from "@/components/theme-provider";

export interface AppShellProps {
  children: React.ReactNode;
  user?: {
    name: string;
    email?: string;
    role: Role;
  };
  onLogout?: () => void;
}

export function AppShell({ children, user = { name: "System Administrator", email: "admin@panelsphere.internal", role: "admin" }, onLogout }: AppShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100">
      <Navbar
        userName={user.name}
        userRole={user.role}
        onLogout={onLogout}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        theme={theme}
        onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
      />

      <div className="flex flex-1 min-h-0">
        <Sidebar
          userRole={user.role}
          userName={user.name}
          userEmail={user.email}
          onLogout={onLogout}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        />
        <main className="flex-1 p-6 overflow-y-auto bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100">{children}</main>
      </div>
    </div>
  );
}

