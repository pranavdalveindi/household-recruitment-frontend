"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/api-client";
import {
  CalendarDays,
  Clock3,
  Plus,
  UserRound,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MapPin,
} from "lucide-react";

const statusPalette: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" | "info" }> = {
  scheduled: { label: "Scheduled", variant: "info" },
  rescheduled: { label: "Rescheduled", variant: "warning" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  completed: { label: "Completed", variant: "success" },
  rejected: { label: "Rejected", variant: "destructive" },
};

export default function AppointmentsPage() {
  const { user, logout } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [households, setHouseholds] = useState<any[]>([]);
  const [fieldExecutives, setFieldExecutives] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedAppt, setSelectedAppt] = useState<any>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [newAppt, setNewAppt] = useState({
    householdId: "",
    fieldExecutiveId: "",
    appointmentDate: "",
    appointmentTime: "10:00",
    householdInstructions: "",
  });

  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setNewAppt((prev) => ({ ...prev, appointmentDate: tomorrow.toISOString().split("T")[0] }));
    loadAppointments();
    loadLookups();
  }, []);

  async function loadLookups() {
    try {
      const [householdsRes, executivesRes] = await Promise.all([
        apiFetch("/households?limit=200"),
        apiFetch("/users?role=field_executive"),
      ]);

      setHouseholds(householdsRes.data || []);
      setFieldExecutives(executivesRes.data || []);

      if (!newAppt.householdId && (householdsRes.data || []).length > 0) {
        setNewAppt((prev) => ({ ...prev, householdId: (householdsRes.data || [0])[0].id }));
      }
      if (!newAppt.fieldExecutiveId && (executivesRes.data || []).length > 0) {
        setNewAppt((prev) => ({ ...prev, fieldExecutiveId: (executivesRes.data || [0])[0].id }));
      }
    } catch (e) {
      // Ignore lookup failures; user can still create manually if needed.
    }
  }

  async function loadAppointments() {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiFetch("/appointments");
      setAppointments(res.data || []);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load appointments");
    } finally {
      setIsLoading(false);
    }
  }

  const visibleAppointments = useMemo(() => {
    if (statusFilter === "all") return appointments;
    return appointments.filter((appt) => appt.status === statusFilter);
  }, [appointments, statusFilter]);

  const summary = useMemo(() => {
    const scheduleCount = appointments.filter((item) => item.status === "scheduled" || item.status === "rescheduled").length;
    const completedCount = appointments.filter((item) => item.status === "completed").length;
    const rejectedCount = appointments.filter((item) => item.status === "rejected").length;
    return { scheduleCount, completedCount, rejectedCount };
  }, [appointments]);

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await apiFetch("/appointments", {
        method: "POST",
        body: JSON.stringify({
          householdId: newAppt.householdId,
          fieldExecutiveId: newAppt.fieldExecutiveId,
          appointmentDate: newAppt.appointmentDate,
          appointmentTime: newAppt.appointmentTime,
          householdInstructions: newAppt.householdInstructions || undefined,
        }),
      });

      setSuccessMsg("Appointment scheduled successfully.");
      setIsCreateOpen(false);
      setNewAppt((prev) => ({
        ...prev,
        householdId: households[0]?.id || "",
        fieldExecutiveId: fieldExecutives[0]?.id || "",
        householdInstructions: "",
      }));
      await loadAppointments();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to schedule appointment");
    }
  };

  const getStatusBadge = (status: string) => {
    const config = statusPalette[status] || { label: status, variant: "default" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const columns = [
    { header: "Household ID", cell: (row: any) => <span className="font-mono text-xs font-bold text-blue-600">{row.householdHhid || row.hhid || "—"}</span> },
    { header: "Field Executive", cell: (row: any) => <span className="text-xs">{row.fieldExecutiveName || "Unassigned"}</span> },
    { header: "Date / Time", cell: (row: any) => <span className="text-xs font-medium"><div>{row.appointmentDate}</div><div className="text-slate-500">{row.appointmentTime}</div></span> },
    { header: "Status", cell: (row: any) => getStatusBadge(row.status) },
    { header: "Instructions", cell: (row: any) => <span className="text-xs text-slate-600 max-w-xs truncate">{row.householdInstructions || "—"}</span> },
    {
      header: "Action",
      cell: (row: any) => (
        <Button variant="ghost" size="sm" onClick={() => setSelectedAppt(row)} className="text-blue-600 hover:text-blue-800">
          View
        </Button>
      ),
    },
  ];

  return (
    <AppShell user={user || undefined} onLogout={logout}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Appointments</h1>
            <p className="text-xs text-slate-500 mt-1">Monitor and schedule household visits for field execution</p>
          </div>
          {user?.role === "call_center_agent" && (
            <Button size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Schedule Appointment
            </Button>
          )}
        </div>

        {errorMsg && <Alert variant="destructive" title="Error" description={errorMsg} />}
        {successMsg && <Alert variant="success" title="Success" description={successMsg} />}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase text-slate-500">Scheduled</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-slate-900">{summary.scheduleCount}</span>
                <CalendarDays className="h-5 w-5 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase text-slate-500">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-slate-900">{summary.completedCount}</span>
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase text-slate-500">Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-slate-900">{summary.rejectedCount}</span>
                <XCircle className="h-5 w-5 text-rose-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-blue-600" />
              Appointment queue
            </CardTitle>
            <CardDescription className="text-xs">
              Filter by status to review upcoming and completed field activities.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {[
                { value: "all", label: "All" },
                { value: "scheduled", label: "Scheduled" },
                { value: "rescheduled", label: "Rescheduled" },
                { value: "completed", label: "Completed" },
                { value: "rejected", label: "Rejected" },
              ].map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setStatusFilter(filter.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    statusFilter === filter.value ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <DataTable
              columns={columns}
              data={visibleAppointments}
              isLoading={isLoading}
              emptyMessage="No appointments match the current filters."
            />
          </CardContent>
        </Card>
      </div>

      <Dialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Schedule Appointment"
        description="Assign a household to a field executive for the next collection or installation visit."
        className="max-w-xl"
      >
        <form className="space-y-4" onSubmit={handleCreateAppointment}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-2 text-sm text-slate-700">
              <span>Household</span>
              <select
                value={newAppt.householdId}
                onChange={(e) => setNewAppt((prev) => ({ ...prev, householdId: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                required
              >
                <option value="">Select household</option>
                {households.map((household) => (
                  <option key={household.id} value={household.id}>
                    {household.hhid || household.respondentName}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span>Field executive</span>
              <select
                value={newAppt.fieldExecutiveId}
                onChange={(e) => setNewAppt((prev) => ({ ...prev, fieldExecutiveId: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                required
              >
                <option value="">Assign executive</option>
                {fieldExecutives.map((exec) => (
                  <option key={exec.id} value={exec.id}>
                    {exec.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-2 text-sm text-slate-700">
              <span>Appointment date</span>
              <Input
                type="date"
                value={newAppt.appointmentDate}
                onChange={(e) => setNewAppt((prev) => ({ ...prev, appointmentDate: e.target.value }))}
                required
              />
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span>Appointment time</span>
              <Input
                type="time"
                value={newAppt.appointmentTime}
                onChange={(e) => setNewAppt((prev) => ({ ...prev, appointmentTime: e.target.value }))}
                required
              />
            </label>
          </div>

          <label className="space-y-2 text-sm text-slate-700 block">
            <span>Household instructions</span>
            <textarea
              value={newAppt.householdInstructions}
              onChange={(e) => setNewAppt((prev) => ({ ...prev, householdInstructions: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Any prep notes, instructions, or access arrangements"
            />
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save appointment</Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        isOpen={!!selectedAppt}
        onClose={() => setSelectedAppt(null)}
        title="Appointment details"
        description="Operational summary for the scheduled household visit."
        className="max-w-lg"
      >
        {selectedAppt && (
          <div className="space-y-4 text-sm text-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Status</span>
              {getStatusBadge(selectedAppt.status)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Household</span>
              <span className="font-medium text-slate-900">{selectedAppt.householdId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Field Executive</span>
              <span className="font-medium text-slate-900">{selectedAppt.fieldExecutiveName || "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Date</span>
              <span className="font-medium text-slate-900">{selectedAppt.appointmentDate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Time</span>
              <span className="font-medium text-slate-900">{selectedAppt.appointmentTime}</span>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="font-medium text-slate-900 mb-1">Instructions</p>
              <p className="text-slate-600">{selectedAppt.householdInstructions || "No household instructions recorded."}</p>
            </div>
          </div>
        )}
      </Dialog>
    </AppShell>
  );
}
