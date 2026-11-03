"use client";

import React from "react";
import { Moon, PanelLeftClose, PanelLeftOpen, Sun } from "lucide-react";

export interface NavbarProps {
  userName?: string;
  userRole?: string;
  onLogout?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
}

export function Navbar({ userName = "System User", userRole = "admin", onLogout, isCollapsed = false, onToggleCollapse, theme = "light", onToggleTheme }: NavbarProps) {
  return (
    <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-40 dark:border-slate-800 dark:bg-slate-900/80">
      <div className="flex items-center gap-3">
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-white"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        )}

        <div className="flex items-center gap-2">
          <img src="/icon.svg" alt="Indirex AM logo" className="h-7 w-7 rounded-md object-contain bg-slate-50 border border-slate-200 dark:border-slate-700 dark:bg-slate-800" />
          <div className="flex items-center gap-1 text-base font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            <span>Indirex</span>
            <span className="text-slate-500 dark:text-slate-400">AM</span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {onToggleTheme && (
          <button
            type="button"
            onClick={onToggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-white"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        )}
      </div>
    </header>
  );
}

