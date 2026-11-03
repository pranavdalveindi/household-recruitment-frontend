"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/api-client";
import { 
  Users, 
  PhoneCall, 
  Calendar, 
  Wrench, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  BarChart3,
  TrendingUp,
  MapPin
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await apiFetch("/dashboard");
        setData(res.data);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#64748b"];

  const statusPieData = data?.statusBreakdown
    ? Object.entries(data.statusBreakdown).map(([name, value]) => ({
        name: name.replace(/_/g, " "),
        value: Number(value),
      }))
    : [];

  return (
    <AppShell user={user || undefined} onLogout={logout}>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Welcome back, {user?.name || "Staff Member"}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Operational overview and real-time recruitment performance
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs bg-white text-slate-700 py-1 px-3">
              Role: <span className="font-semibold ml-1 capitalize text-blue-600">{user?.role?.replace("_", " ")}</span>
            </Badge>
          </div>
        </div>

        {error && <Alert variant="warning" title="Notice" description={error} />}

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase text-slate-500">Total Households</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{data?.totalHouseholds ?? 0}</div>
              <p className="text-xs text-slate-500 mt-1">Recruited in database</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase text-slate-500">Call Center Attempts</CardTitle>
              <PhoneCall className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{data?.totalCallAttempts ?? 0}</div>
              <p className="text-xs text-emerald-600 font-medium mt-1">
                {data?.successfulCalls ?? 0} successful contacts
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase text-slate-500">Scheduled Appointments</CardTitle>
              <Calendar className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{data?.totalAppointments ?? 0}</div>
              <p className="text-xs text-slate-500 mt-1">Technician visits scheduled</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase text-slate-500">TV Meters Installed</CardTitle>
              <Wrench className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{data?.completedInstallations ?? 0}</div>
              <p className="text-xs text-purple-600 font-medium mt-1">Active TV panel households</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts & Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Regional Progress Bar Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base text-slate-900 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                Regional Recruitment Progress
              </CardTitle>
              <CardDescription className="text-xs">
                Total recruited vs TV meters installed by zone
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72 w-full">
                {data?.regionalProgress && data.regionalProgress.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.regionalProgress} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="regionName" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="total" name="Total Recruited" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="installed" name="Meters Installed" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                    No regional recruitment data available yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Household Status Breakdown Pie */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-slate-900 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                Lifecycle Status
              </CardTitle>
              <CardDescription className="text-xs">
                Recruitment pipeline distribution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72 w-full flex flex-col items-center justify-center">
                {statusPieData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height="75%">
                      <PieChart>
                        <Pie
                          data={statusPieData}
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {statusPieData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-2 justify-center text-[10px] text-slate-600 mt-2">
                      {statusPieData.map((entry, idx) => (
                        <span key={idx} className="flex items-center gap-1">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                          />
                          <span className="capitalize">{entry.name}: {entry.value}</span>
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-slate-400 text-sm">No lifecycle status data</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

