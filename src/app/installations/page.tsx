"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/api-client";
import {
  Wrench,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock3,
  MapPin,
  ClipboardList,
} from "lucide-react";

const statusPalette: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" | "info" }> = {
  scheduled: { label: "Scheduled", variant: "info" },
  rescheduled: { label: "Rescheduled", variant: "warning" },
  completed: { label: "Completed", variant: "success" },
  rejected: { label: "Rejected", variant: "destructive" },
  pending: { label: "Pending", variant: "warning" },
  installed: { label: "Installed", variant: "success" },
  issue: { label: "Issue", variant: "info" },
};

export default function InstallationsPage() {
  const { user, logout } = useAuth();
  const [assignedAppointments, setAssignedAppointments] = useState<any[]>([]);
  const [households, setHouseholds] = useState<any[]>([]);
  const [installationVisits, setInstallationVisits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedAppt, setSelectedAppt] = useState<any>(null);
  const [visitDialogOpen, setVisitDialogOpen] = useState(false);
  const [newVisit, setNewVisit] = useState({
    householdId: "",
    appointmentId: "",
    visitDate: "",
    status: "installed",
    rejectionReason: "",
    issueCategory: "",
    issueDescription: "",
    notes: "",
    meterSerialNumber: "",
  });

  useEffect(() => {
    loadData();
  }, [user?.id, user?.role]);

  async function loadData() {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const [appointmentsRes, householdsRes, visitsRes] = await Promise.all([
        apiFetch("/appointments"),
        apiFetch("/households?limit=200"),
        apiFetch("/installations"),
      ]);

      const householdMap = new Map<string, any>((householdsRes.data || []).map((hh: any) => [hh.id, hh]));
      const filteredAppointments = (appointmentsRes.data || []).filter((appt: any) => {
        if (user?.role !== "field_executive") return true;
        return appt.fieldExecutiveId === user.id;
      });

      const normalizedAppointments = filteredAppointments.map((appt: any) => {
        const household = householdMap.get(String(appt.householdId));
        return {
          ...appt,
          hhid: (household && (household.hhid ?? household.hhid)) || "—",
          address: household?.address || "—",
          landmark: household?.landmark || "—",
        } as any;
      });

      setHouseholds(householdsRes.data || []);
      setAssignedAppointments(normalizedAppointments);
      setInstallationVisits(visitsRes.data || []);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load assigned field work");
    } finally {
      setIsLoading(false);
    }
  }

  const isFieldExecutive = user?.role === "field_executive";

  const handleOpenVisitDialog = (appt: any) => {
    setSelectedAppt(appt);
    setVisitDialogOpen(true);
    setNewVisit({
      householdId: appt.householdId,
      appointmentId: appt.id,
      visitDate: new Date().toISOString().split("T")[0],
      status: "installed",
      rejectionReason: "",
      issueCategory: "",
      issueDescription: "",
      notes: "",
      meterSerialNumber: "",
    });
  };

  const handleRecordVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await apiFetch("/installations", {
        method: "POST",
        body: JSON.stringify({
          householdId: newVisit.householdId,
          appointmentId: newVisit.appointmentId || null,
          visitDate: newVisit.visitDate,
          status: newVisit.status,
          rejectionReason: newVisit.rejectionReason || null,
          issueCategory: newVisit.issueCategory || null,
          issueDescription: newVisit.issueDescription || null,
          notes: newVisit.notes || null,
          meterSerialNumber: newVisit.meterSerialNumber || null,
        }),
      });

      setSuccessMsg("Installation status updated successfully.");
      setVisitDialogOpen(false);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update installation status");
    }
  };

  const getStatusBadge = (status: string) => {
    const config = statusPalette[status] || { label: status, variant: "default" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const assignmentColumns = [
    { header: "Household ID", cell: (row: any) => <span className="font-mono text-xs font-bold text-blue-600">{row.hhid || "—"}</span> },
    { header: "Address", cell: (row: any) => <span className="text-xs text-slate-700">{row.address || "—"}</span> },
    { header: "Landmark", cell: (row: any) => <span className="text-xs text-slate-600">{row.landmark || "—"}</span> },
    { header: "Assigned Field Executive", cell: (row: any) => <span className="text-xs text-slate-700">{row.fieldExecutiveName || "Unassigned"}</span> },
    { header: "Appointment", cell: (row: any) => <span className="text-xs font-medium"><div>{row.appointmentDate}</div><div className="text-slate-500">{row.appointmentTime}</div></span> },
    { header: "Status", cell: (row: any) => getStatusBadge(row.status) },
    { header: "Instructions", cell: (row: any) => <span className="text-xs text-slate-600">{row.householdInstructions || "—"}</span> },
    ...(isFieldExecutive ? [{
      header: "Action",
      cell: (row: any) => (
        <Button size="sm" onClick={() => handleOpenVisitDialog(row)}>
          Update Status
        </Button>
      ),
    }] : []),
  ];

  const recentVisits = useMemo(() => {
    return installationVisits
      .slice()
      .sort((a, b) => new Date(b.visitDate || 0).getTime() - new Date(a.visitDate || 0).getTime())
      .slice(0, 5);
  }, [installationVisits]);

  return (
    <AppShell user={user || undefined} onLogout={logout}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Field Installations</h1>
            <p className="text-xs text-slate-500 mt-1">
              {isFieldExecutive
                ? "Your assigned household installations and visit updates"
                : "Track field installation outcomes for the assigned workforce"}
            </p>
          </div>
        </div>

        {errorMsg && <Alert variant="destructive" title="Error" description={errorMsg} />}
        {successMsg && <Alert variant="success" title="Success" description={successMsg} />}

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wrench className="h-4 w-4 text-blue-600" />
              {isFieldExecutive ? "My assigned household visits" : "Assigned household visits"}
            </CardTitle>
            <CardDescription className="text-xs">
              Each row is a household assigned to the field executive. Update the installation status from the action column.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={assignmentColumns}
              data={assignedAppointments}
              isLoading={isLoading}
              emptyMessage={isFieldExecutive ? "No households are assigned to you for installation work." : "No assigned installation work found."}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-emerald-600" />
              Recent visit outcomes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentVisits.length === 0 ? (
              <div className="text-sm text-slate-500">No installation visit records have been captured yet.</div>
            ) : (
              <div className="space-y-3">
                {recentVisits.map((visit: any) => (
                  <div key={visit.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <div>
                      <div className="text-xs font-semibold text-slate-900">HHID: {visit.householdId || "—"}</div>
                      <div className="text-[11px] text-slate-500">{visit.visitDate || "—"}</div>
                    </div>
                    {getStatusBadge(visit.status)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        isOpen={visitDialogOpen}
        onClose={() => setVisitDialogOpen(false)}
        title="Update installation status"
        description="Record the actual field outcome for the selected appointment."
        className="max-w-2xl"
      >
        {selectedAppt && (
          <form className="space-y-4" onSubmit={handleRecordVisit}>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
              <div className="font-semibold text-slate-900">HHID: {selectedAppt.hhid}</div>
              <div className="text-slate-600">{selectedAppt.address || "—"}</div>
              <div className="text-slate-500 text-xs mt-1">
                {selectedAppt.appointmentDate} @ {selectedAppt.appointmentTime}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="space-y-2 text-sm text-slate-700">
                <span>Visit date</span>
                <Input type="date" value={newVisit.visitDate} onChange={(e) => setNewVisit((prev) => ({ ...prev, visitDate: e.target.value }))} required />
              </label>

              <label className="space-y-2 text-sm text-slate-700">
                <span>Installation outcome</span>
                <select
                  value={newVisit.status}
                  onChange={(e) => setNewVisit((prev) => ({ ...prev, status: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="installed">Installed</option>
                  <option value="issue">Issue</option>
                  <option value="rejected">Rejected</option>
                  <option value="pending">Pending</option>
                </select>
              </label>
            </div>

            {newVisit.status === "rejected" && (
              <label className="space-y-2 text-sm text-slate-700 block">
                <span>Rejection reason</span>
                <textarea
                  value={newVisit.rejectionReason}
                  onChange={(e) => setNewVisit((prev) => ({ ...prev, rejectionReason: e.target.value }))}
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  required={newVisit.status === "rejected"}
                />
              </label>
            )}

            {newVisit.status === "issue" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="space-y-2 text-sm text-slate-700 block">
                  <span>Issue category</span>
                  <Input
                    value={newVisit.issueCategory}
                    onChange={(e) => setNewVisit((prev) => ({ ...prev, issueCategory: e.target.value }))}
                    required={newVisit.status === "issue"}
                  />
                </label>

                <label className="space-y-2 text-sm text-slate-700 block">
                  <span>Meter serial number</span>
                  <Input
                    value={newVisit.meterSerialNumber}
                    onChange={(e) => setNewVisit((prev) => ({ ...prev, meterSerialNumber: e.target.value }))}
                  />
                </label>

                <div className="md:col-span-2">
                  <label className="space-y-2 text-sm text-slate-700 block">
                    <span>Issue description</span>
                    <textarea
                      value={newVisit.issueDescription}
                      onChange={(e) => setNewVisit((prev) => ({ ...prev, issueDescription: e.target.value }))}
                      rows={3}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      required={newVisit.status === "issue"}
                    />
                  </label>
                </div>
              </div>
            )}

            <label className="space-y-2 text-sm text-slate-700 block">
              <span>Field notes</span>
              <textarea
                value={newVisit.notes}
                onChange={(e) => setNewVisit((prev) => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setVisitDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save status</Button>
            </div>
          </form>
        )}
      </Dialog>
    </AppShell>
  );
}
