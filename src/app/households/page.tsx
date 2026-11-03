"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/api-client";
import { 
  Users, 
  Plus, 
  Eye, 
  Phone, 
  MapPin, 
  Calendar, 
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2
} from "lucide-react";

export default function HouseholdsPage() {
  const { user, logout } = useAuth();
  const [households, setHouseholds] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({ page: 1, totalPages: 1, totalItems: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedHh, setSelectedHh] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [regions, setRegions] = useState<any[]>([]);
  const [newHh, setNewHh] = useState({
    hhid: "",
    respondentName: "",
    contactNumber: "",
    alternateContactNumber: "",
    address: "",
    landmark: "",
    city: "",
    regionId: "",
    sec: "1",
    mosr: "3",
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadHouseholds(1, search, statusFilter);
    loadRegions();
  }, []);

  async function loadRegions() {
    try {
      const res = await apiFetch("/regions");
      setRegions(res.data || []);
      if (res.data?.length > 0) {
        setNewHh((prev) => ({ ...prev, regionId: res.data[0].id }));
      }
    } catch (e) {
      // Ignore
    }
  }

  async function loadHouseholds(page = 1, searchQuery = "", status = "") {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", "15");
      if (searchQuery) params.append("search", searchQuery);
      if (status) params.append("recruitmentStatus", status);

      const res = await apiFetch(`/households?${params.toString()}`);
      setHouseholds(res.data || []);
      if (res.meta) {
        setMeta(res.meta);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load households");
    } finally {
      setIsLoading(false);
    }
  }

  const handleSearch = (val: string) => {
    setSearch(val);
    loadHouseholds(1, val, statusFilter);
  };

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    loadHouseholds(1, search, status);
  };

  const handleViewDetail = async (hh: any) => {
    setSelectedHh(hh);
    setIsDetailOpen(true);
    try {
      const res = await apiFetch(`/household-members/household/${hh.id}`);
      setMembers(res.data || []);
    } catch (e) {
      setMembers([]);
    }
  };

  const handleCreateHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await apiFetch("/households", {
        method: "POST",
        body: JSON.stringify(newHh),
      });
      setIsCreateOpen(false);
      loadHouseholds(1, search, statusFilter);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create household");
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" | "info" }> = {
      not_contacted: { label: "Not Contacted", variant: "default" },
      contact_in_progress: { label: "Contact In Progress", variant: "warning" },
      appointment_pending: { label: "Appointment Pending", variant: "info" },
      appointment_scheduled: { label: "Appointment Scheduled", variant: "info" },
      installation_in_progress: { label: "Installation In Progress", variant: "warning" },
      installed: { label: "Installed", variant: "success" },
      rejected: { label: "Permanently Rejected", variant: "destructive" },
    };

    const cfg = map[status] || { label: status, variant: "default" };
    return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
  };

  const columns = [
    { header: "HHID", accessorKey: "hhid", className: "font-mono font-bold text-blue-600 text-xs" },
    { header: "Respondent", accessorKey: "respondentName", className: "font-medium text-slate-900 text-xs" },
    { header: "Contact Number", accessorKey: "contactNumber", className: "text-xs font-mono" },
    { header: "City / Region", cell: (h: any) => <span className="text-xs">{h.city} ({h.regionName || "—"})</span> },
    { header: "SEC", accessorKey: "sec", className: "text-xs font-semibold" },
    { header: "MOSR", accessorKey: "mosr", className: "text-xs font-semibold" },
    { header: "Recruitment Status", cell: (h: any) => getStatusBadge(h.recruitmentStatus) },
    {
      header: "Action",
      cell: (h: any) => (
        <Button variant="ghost" size="sm" onClick={() => handleViewDetail(h)} className="text-blue-600 hover:text-blue-800">
          <Eye className="h-4 w-4 mr-1" /> View
        </Button>
      ),
    },
  ];

  return (
    <AppShell user={user || undefined} onLogout={logout}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Household Management</h1>
            <p className="text-xs text-slate-500 mt-1">
              Browse, filter, inspect, and register recruited panel households
            </p>
          </div>
          {["admin", "panel_manager"].includes(user?.role || "") && (
            <Button size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Household
            </Button>
          )}
        </div>

        {errorMsg && <Alert variant="destructive" title="Error" description={errorMsg} />}

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2 items-center bg-white p-3 rounded-xl border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 mr-2">Filter Status:</span>
          {["", "not_contacted", "contact_in_progress", "appointment_scheduled", "installed", "rejected"].map((st) => (
            <button
              key={st}
              onClick={() => handleStatusChange(st)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                statusFilter === st
                  ? "bg-blue-600 text-white font-semibold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st === "" ? "All Statuses" : st.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        {/* Household Table */}
        <DataTable
          columns={columns}
          data={households}
          isLoading={isLoading}
          searchPlaceholder="Search by HHID, name, or phone..."
          searchValue={search}
          onSearchChange={handleSearch}
          page={meta.page}
          totalPages={meta.totalPages}
          totalItems={meta.totalItems}
          onPageChange={(p) => loadHouseholds(p, search, statusFilter)}
        />

        {/* Detail Modal */}
        <Dialog
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Household Details — ${selectedHh?.hhid || ""}`}
          description="Demographic profile and household member registry"
          className="max-w-2xl"
        >
          {selectedHh && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block">Respondent Name</span>
                  <span className="font-semibold text-slate-800 text-sm">{selectedHh.respondentName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Primary Contact</span>
                  <span className="font-mono font-semibold text-slate-800 text-sm">{selectedHh.contactNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Address</span>
                  <span className="text-slate-700">{selectedHh.address}, {selectedHh.city}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Region</span>
                  <span className="text-slate-700 font-medium">{selectedHh.regionName || "—"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Socio-Economic Class (SEC)</span>
                  <span className="font-semibold text-slate-800">Class {selectedHh.sec}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">MOSR (Mode of Reception)</span>
                  <span className="font-semibold text-slate-800">{selectedHh.mosr}</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-blue-600" />
                  Household Members ({members.length})
                </h4>
                {members.length === 0 ? (
                  <p className="text-slate-400 italic">No member records recorded for this household.</p>
                ) : (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-semibold">
                        <tr>
                          <th className="p-2.5">Name</th>
                          <th className="p-2.5">Age</th>
                          <th className="p-2.5">Gender</th>
                          <th className="p-2.5">Relationship to Respondent</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {members.map((m, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2.5 font-medium text-slate-900">{m.name}</td>
                            <td className="p-2.5 text-slate-600">{m.age}</td>
                            <td className="p-2.5 text-slate-600 capitalize">{m.gender}</td>
                            <td className="p-2.5 text-slate-600">{m.relationshipToRespondent}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </Dialog>

        {/* Create Household Modal */}
        <Dialog
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="Register New Household"
          description="Create an initial household record in the recruitment pipeline"
        >
          <form onSubmit={handleCreateHousehold} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="HHID"
                required
                placeholder="HH2001"
                value={newHh.hhid}
                onChange={(e) => setNewHh({ ...newHh, hhid: e.target.value })}
              />
              <Input
                label="Respondent Name"
                required
                placeholder="Ramesh Gupta"
                value={newHh.respondentName}
                onChange={(e) => setNewHh({ ...newHh, respondentName: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Contact Number"
                required
                placeholder="+919876543210"
                value={newHh.contactNumber}
                onChange={(e) => setNewHh({ ...newHh, contactNumber: e.target.value })}
              />
              <Input
                label="Alternate Contact"
                placeholder="+919876543211"
                value={newHh.alternateContactNumber}
                onChange={(e) => setNewHh({ ...newHh, alternateContactNumber: e.target.value })}
              />
            </div>

            <Input
              label="Address"
              required
              placeholder="Flat 101, Galaxy Heights, Linking Road"
              value={newHh.address}
              onChange={(e) => setNewHh({ ...newHh, address: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="City"
                required
                placeholder="Mumbai"
                value={newHh.city}
                onChange={(e) => setNewHh({ ...newHh, city: e.target.value })}
              />
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Region *</label>
                <select
                  required
                  value={newHh.regionId}
                  onChange={(e) => setNewHh({ ...newHh, regionId: e.target.value })}
                  className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm"
                >
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="SEC"
                type="number"
                required
                value={newHh.sec}
                onChange={(e) => setNewHh({ ...newHh, sec: e.target.value })}
              />
              <Input
                label="MOSR (Mode of Reception)"
                type="number"
                required
                value={newHh.mosr}
                onChange={(e) => setNewHh({ ...newHh, mosr: e.target.value })}
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Household</Button>
            </div>
          </form>
        </Dialog>
      </div>
    </AppShell>
  );
}

