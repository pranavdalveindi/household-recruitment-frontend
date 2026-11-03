"use client";

import React, { useState, useEffect, useRef } from "react";
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
  PhoneCall,
  Phone,
  PhoneOff,
  PhoneForwarded,
  Clock,
  UserCheck,
  Calendar,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  Users,
  Copy,
  Check,
  Play,
  Square,
  ChevronRight,
  ShieldAlert,
  Info
} from "lucide-react";

export default function CallCenterPage() {
  const { user, logout } = useAuth();

  // Queue state
  const [households, setHouseholds] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({ page: 1, totalPages: 1, totalItems: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterQueue, setFilterQueue] = useState<"pending" | "all">("pending");

  // Active call modal state
  const [selectedHh, setSelectedHh] = useState<any>(null);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [householdMembers, setHouseholdMembers] = useState<any[]>([]);
  const [callHistory, setCallHistory] = useState<any[]>([]);
  const [activeQuestionnaire, setActiveQuestionnaire] = useState<any>(null);
  const [fieldExecutives, setFieldExecutives] = useState<any[]>([]);

  // Call session timer & inputs
  const [callDuration, setCallDuration] = useState(0);
  const [isCallTimerActive, setIsCallTimerActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const callStartTimeRef = useRef<Date | null>(null);

  // Form states
  const [callStatus, setCallStatus] = useState<"successful" | "not_reachable" | "busy">("successful");
  const [appointmentDecision, setAppointmentDecision] = useState<"scheduled" | "rejected" | "">("");
  const [callNotes, setCallNotes] = useState("");
  const [answers, setAnswers] = useState<Record<string, any>>({});

  // Appointment scheduling fields (when decision is 'scheduled')
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("10:00");
  const [assignedExecutiveId, setAssignedExecutiveId] = useState("");
  const [appointmentInstructions, setAppointmentInstructions] = useState("");

  // Feedback states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Agent daily stats
  const [agentStats, setAgentStats] = useState({
    todayCalls: 0,
    successful: 0,
    notReachable: 0,
    busy: 0,
    scheduled: 0,
  });

  useEffect(() => {
    loadHouseholds(1, search, filterQueue);
    loadActiveQuestionnaire();
    loadFieldExecutives();
    loadAgentDashboardStats();
  }, [filterQueue]);

  async function loadAgentDashboardStats() {
    try {
      const res = await apiFetch("/dashboard");
      if (res.data) {
        setAgentStats({
          todayCalls: res.data.callsMadeToday ?? 0,
          successful: res.data.successfulCallsToday ?? 0,
          notReachable: res.data.notReachableToday ?? 0,
          busy: res.data.busyToday ?? 0,
          scheduled: res.data.appointmentsScheduledToday ?? 0,
        });
      }
    } catch (e) {
      // Ignore
    }
  }

  async function loadActiveQuestionnaire() {
    try {
      const res = await apiFetch("/questionnaires/active");
      setActiveQuestionnaire(res.data);
    } catch (e) {
      // Ignore
    }
  }

  async function loadFieldExecutives() {
    try {
      const res = await apiFetch("/users?role=field_executive");
      setFieldExecutives(res.data || []);
      if (res.data && res.data.length > 0) {
        setAssignedExecutiveId(res.data[0].id);
      }
    } catch (e) {
      // Ignore
    }
  }

  async function loadHouseholds(page = 1, searchQuery = "", queue = "pending") {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", "15");
      if (searchQuery) params.append("search", searchQuery);
      if (queue === "pending") {
        // Pending queue includes not_contacted and contact_in_progress
        params.append("recruitmentStatus", "contact_in_progress");
      }

      const res = await apiFetch(`/households?${params.toString()}`);
      setHouseholds(res.data || []);
      if (res.meta) setMeta(res.meta);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load household queue");
    } finally {
      setIsLoading(false);
    }
  }

  const handleOpenCallConsole = async (hh: any) => {
    setSelectedHh(hh);
    setErrorMsg(null);
    setSuccessMsg(null);
    setCallStatus("successful");
    setAppointmentDecision("");
    setCallNotes("");
    setAnswers({});
    setAppointmentInstructions("");
    setCallDuration(0);
    setIsCallTimerActive(false);
    callStartTimeRef.current = new Date();

    // Default appointment date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setAppointmentDate(tomorrow.toISOString().split("T")[0]);

    setIsConsoleOpen(true);

    // Fetch members and previous call attempts
    try {
      const [membersRes, historyRes] = await Promise.all([
        apiFetch(`/household-members/household/${hh.id}`),
        apiFetch(`/calls/household/${hh.id}`),
      ]);
      setHouseholdMembers(membersRes.data || []);
      setCallHistory(historyRes.data || []);
    } catch (e) {
      setHouseholdMembers([]);
      setCallHistory([]);
    }
  };

  const handleStartTimer = () => {
    if (!isCallTimerActive) {
      callStartTimeRef.current = new Date();
      setIsCallTimerActive(true);
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
  };

  const handleStopTimer = () => {
    if (isCallTimerActive && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      setIsCallTimerActive(false);
    }
  };

  const handleCopyPhone = (number: string) => {
    navigator.clipboard.writeText(number);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleAnswerChange = (questionId: string, val: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: val,
    }));
  };

  const handleSubmitCallAttempt = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    if (callStatus === "successful" && !appointmentDecision) {
      setErrorMsg("Appointment decision is mandatory for successful calls.");
      setIsSubmitting(false);
      return;
    }

    if (callStatus === "successful" && appointmentDecision === "scheduled") {
      if (!appointmentDate || !appointmentTime || !assignedExecutiveId) {
        setErrorMsg("Please specify the appointment date, time, and assigned field executive.");
        setIsSubmitting(false);
        return;
      }
    }

    // Format questionnaire responses
    const formattedResponses = Object.entries(answers).map(([qId, val]) => ({
      questionId: qId,
      responseValue: val,
    }));

    try {
      // 1. Record Call Attempt
      await apiFetch("/calls", {
        method: "POST",
        body: JSON.stringify({
          householdId: selectedHh.id,
          callStatus,
          appointmentDecision: callStatus === "successful" ? appointmentDecision : null,
          callStartedAt: callStartTimeRef.current?.toISOString(),
          callEndedAt: new Date().toISOString(),
          callDurationSeconds: callDuration,
          notes: callNotes || undefined,
          questionnaireVersionId: activeQuestionnaire?.version?.id,
          responses: formattedResponses,
        }),
      });

      // 2. If appointment decision is 'scheduled', create appointment record
      if (callStatus === "successful" && appointmentDecision === "scheduled") {
        await apiFetch("/appointments", {
          method: "POST",
          body: JSON.stringify({
            householdId: selectedHh.id,
            fieldExecutiveId: assignedExecutiveId,
            appointmentDate,
            appointmentTime: appointmentTime.length === 5 ? `${appointmentTime}:00` : appointmentTime,
            householdInstructions: appointmentInstructions || undefined,
          }),
        });
      }

      setSuccessMsg(`Call attempt recorded successfully for HHID ${selectedHh.hhid}!`);
      setIsConsoleOpen(false);
      handleStopTimer();
      loadHouseholds(meta.page, search, filterQueue);
      loadAgentDashboardStats();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to record call attempt");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const columns = [
    { header: "HHID", accessorKey: "hhid", className: "font-mono font-bold text-blue-600 text-xs" },
    { header: "Respondent", accessorKey: "respondentName", className: "font-semibold text-slate-900 text-xs" },
    {
      header: "Primary Phone",
      cell: (h: any) => (
        <a
          href={`tel:${h.contactNumber}`}
          className="text-xs font-mono font-medium text-slate-700 hover:text-blue-600 flex items-center gap-1"
        >
          <Phone className="h-3 w-3 text-emerald-600" />
          {h.contactNumber}
        </a>
      ),
    },
    { header: "Location / City", cell: (h: any) => <span className="text-xs">{h.city} ({h.regionName || "—"})</span> },
    {
      header: "Demographics",
      cell: (h: any) => (
        <div className="flex gap-1.5 text-xs font-medium">
          <Badge variant="outline">SEC {h.sec}</Badge>
          <Badge variant="outline">MOSR {h.mosr}</Badge>
        </div>
      ),
    },
    {
      header: "Current Status",
      cell: (h: any) => (
        <Badge
          variant={
            h.recruitmentStatus === "installed"
              ? "success"
              : h.recruitmentStatus === "appointment_scheduled"
              ? "info"
              : "warning"
          }
        >
          {h.recruitmentStatus.replace(/_/g, " ")}
        </Badge>
      ),
    },
    {
      header: "Action",
      cell: (h: any) => {
        const canCall = user?.role === "call_center_agent";
        if (!canCall) return <span className="text-xs text-slate-400">Not available</span>;

        return (
          <Button
            size="sm"
            onClick={() => handleOpenCallConsole(h)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm gap-1 text-xs h-8"
          >
            <PhoneCall className="h-3.5 w-3.5" />
            Call Contact
          </Button>
        );
      },
    },
  ];

  return (
    <AppShell user={user || undefined} onLogout={logout}>
      <div className="space-y-6">
        {/* Header with Call Center Context */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <PhoneCall className="h-6 w-6 text-blue-600" />
              Call Center Operations Console
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              External phone outreach, questionnaire administration, and technician visit scheduling
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Agent Active: External Phone Mode
            </span>
          </div>
        </div>

        {successMsg && <Alert variant="success" title="Success" description={successMsg} />}
        {errorMsg && <Alert variant="destructive" title="Error" description={errorMsg} />}

        {/* Agent Performance Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Card className="border-slate-200">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-[10px] uppercase font-bold text-slate-500">Today Calls</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-xl font-bold text-slate-900">{agentStats.todayCalls}</div>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50/20">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-[10px] uppercase font-bold text-emerald-700">Successful Contacts</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-xl font-bold text-emerald-600">{agentStats.successful}</div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/20">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-[10px] uppercase font-bold text-amber-700">Not Reachable</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-xl font-bold text-amber-600">{agentStats.notReachable}</div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-[10px] uppercase font-bold text-slate-500">Line Busy</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-xl font-bold text-slate-700">{agentStats.busy}</div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50/20">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-[10px] uppercase font-bold text-blue-700">Appointments Scheduled</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-xl font-bold text-blue-600">{agentStats.scheduled}</div>
            </CardContent>
          </Card>
        </div>

        {/* Queue Selector Tabs */}
        <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterQueue("pending")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterQueue === "pending"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Pending Call Queue
            </button>
            <button
              onClick={() => setFilterQueue("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterQueue === "all"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Households
            </button>
          </div>
          <span className="text-xs text-slate-500 hidden sm:inline">
            Showing {filterQueue === "pending" ? "households requiring contact" : "full household repository"}
          </span>
        </div>

        {/* Household Queue Table */}
        <DataTable
          columns={columns}
          data={households}
          isLoading={isLoading}
          searchPlaceholder="Search queue by HHID, respondent, or contact number..."
          searchValue={search}
          onSearchChange={(q) => {
            setSearch(q);
            loadHouseholds(1, q, filterQueue);
          }}
          page={meta.page}
          totalPages={meta.totalPages}
          totalItems={meta.totalItems}
          onPageChange={(p) => loadHouseholds(p, search, filterQueue)}
          emptyMessage="No households currently pending in this queue."
        />

        {/* Call Console Modal */}
        <Dialog
          isOpen={isConsoleOpen}
          onClose={() => {
            handleStopTimer();
            setIsConsoleOpen(false);
          }}
          title={`Call Console — ${selectedHh?.respondentName || ""} (${selectedHh?.hhid || ""})`}
          description="Dial respondent externally, capture responses, and confirm technician appointment"
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
        >
          {selectedHh && (
            <form onSubmit={handleSubmitCallAttempt} className="space-y-6">
              {/* Dialing & Household Summary Bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-900 text-white shadow-md">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Primary Contact</span>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-mono font-bold text-emerald-400">
                      {selectedHh.contactNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyPhone(selectedHh.contactNumber)}
                      className="p-1 text-slate-400 hover:text-white rounded"
                      title="Copy phone"
                    >
                      {copiedPhone ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                  {selectedHh.alternateContactNumber && (
                    <span className="text-xs text-slate-400 block font-mono">
                      Alt: {selectedHh.alternateContactNumber}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Address & Zone</span>
                  <p className="text-xs text-slate-200 line-clamp-2">
                    {selectedHh.address}, {selectedHh.city} ({selectedHh.regionName || "—"})
                  </p>
                  <span className="text-[10px] text-slate-400">
                    SEC {selectedHh.sec} • MOSR: {selectedHh.mosr} members
                  </span>
                </div>

                {/* Call Timer Control */}
                <div className="flex flex-col items-end justify-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Call Duration</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xl font-bold text-white tracking-wider">
                      {formatSeconds(callDuration)}
                    </span>
                    {!isCallTimerActive ? (
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleStartTimer}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 px-2 text-xs"
                      >
                        <Play className="h-3 w-3 mr-1" /> Start
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleStopTimer}
                        variant="destructive"
                        className="h-7 px-2 text-xs"
                      >
                        <Square className="h-3 w-3 mr-1" /> Stop
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Household Members Quick Review */}
              {householdMembers.length > 0 && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-blue-600" />
                    Household Members ({householdMembers.length}):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {householdMembers.map((m, idx) => (
                      <span key={idx} className="bg-white border border-slate-200 px-2 py-1 rounded text-slate-700">
                        <strong className="text-slate-900">{m.name}</strong> ({m.age}y, {m.gender}) — {m.relationshipToRespondent}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Previous Call Logs (if any) */}
              {callHistory.length > 0 && (
                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 text-xs">
                  <span className="font-semibold text-slate-700 block mb-2">Previous Call Attempts ({callHistory.length}):</span>
                  <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                    {callHistory.map((c, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border border-slate-200/60">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              c.callStatus === "successful"
                                ? "success"
                                : c.callStatus === "busy"
                                ? "warning"
                                : "destructive"
                            }
                            className="text-[10px]"
                          >
                            {c.callStatus}
                          </Badge>
                          <span className="text-slate-700 font-medium">{c.notes || "No call notes"}</span>
                        </div>
                        <span className="text-slate-400 text-[10px]">
                          {new Date(c.createdAt).toLocaleDateString()} by {c.agentName || "Agent"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Call Outcome Selection */}
              <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block text-xs font-bold uppercase text-slate-700">
                  Step 1: Select Call Outcome *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setCallStatus("successful")}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-xs font-semibold transition-all ${
                      callStatus === "successful"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" /> Successful Contact
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCallStatus("not_reachable");
                      setAppointmentDecision("");
                    }}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-xs font-semibold transition-all ${
                      callStatus === "not_reachable"
                        ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <PhoneOff className="h-4 w-4" /> Not Reachable / Unanswered
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCallStatus("busy");
                      setAppointmentDecision("");
                    }}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-xs font-semibold transition-all ${
                      callStatus === "busy"
                        ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <Clock className="h-4 w-4" /> Line Busy / Call Later
                  </button>
                </div>
              </div>

              {/* Conditional Questionnaire & Appointment Workflow if Successful */}
              {callStatus === "successful" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Appointment Decision */}
                  <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200 space-y-3">
                    <label className="block text-xs font-bold uppercase text-blue-900">
                      Step 2: Appointment Decision *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setAppointmentDecision("scheduled")}
                        className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-xs font-semibold transition-all ${
                          appointmentDecision === "scheduled"
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <Calendar className="h-4 w-4" /> Agreed to Appointment
                      </button>

                      <button
                        type="button"
                        onClick={() => setAppointmentDecision("rejected")}
                        className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-xs font-semibold transition-all ${
                          appointmentDecision === "rejected"
                            ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <AlertCircle className="h-4 w-4" /> Declined Appointment
                      </button>
                    </div>
                  </div>

                  {/* Active Questionnaire Survey */}
                  {activeQuestionnaire && (
                    <Card className="border-slate-200">
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xs uppercase font-bold text-slate-700 flex items-center gap-1.5">
                            <ClipboardList className="h-4 w-4 text-blue-600" />
                            {activeQuestionnaire.version.title} (v{activeQuestionnaire.version.versionNumber})
                          </CardTitle>
                          <Badge variant="outline" className="text-[10px]">Qualification Questionnaire</Badge>
                        </div>
                        {activeQuestionnaire.version.description && (
                          <CardDescription className="text-xs text-slate-500">
                            {activeQuestionnaire.version.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="p-4 space-y-4">
                        {activeQuestionnaire.questions.map((q: any, idx: number) => (
                          <div key={q.id} className="space-y-1.5 p-3 rounded-lg bg-slate-50 border border-slate-200/70 text-xs">
                            <label className="font-semibold text-slate-800 block">
                              {idx + 1}. {q.questionText} {q.isRequired && <span className="text-rose-500">*</span>}
                            </label>

                            {/* Render based on questionType */}
                            {q.questionType === "number" && (
                              <input
                                type="number"
                                className="h-8 w-48 rounded border border-slate-300 px-2 text-xs bg-white"
                                value={answers[q.id] || ""}
                                onChange={(e) => handleAnswerChange(q.id, Number(e.target.value))}
                                required={q.isRequired}
                              />
                            )}

                            {q.questionType === "boolean" && (
                              <div className="flex gap-4 pt-1">
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`q_${q.id}`}
                                    checked={answers[q.id] === true}
                                    onChange={() => handleAnswerChange(q.id, true)}
                                    required={q.isRequired}
                                  />
                                  <span>Yes</span>
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`q_${q.id}`}
                                    checked={answers[q.id] === false}
                                    onChange={() => handleAnswerChange(q.id, false)}
                                    required={q.isRequired}
                                  />
                                  <span>No</span>
                                </label>
                              </div>
                            )}

                            {q.questionType === "single_choice" && (
                              <select
                                className="h-8 rounded border border-slate-300 px-2 text-xs bg-white max-w-sm"
                                value={answers[q.id] || ""}
                                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                required={q.isRequired}
                              >
                                <option value="">Select option...</option>
                                {q.options?.map((opt: string, optIdx: number) => (
                                  <option key={optIdx} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            )}

                            {q.questionType === "text" && (
                              <input
                                type="text"
                                className="h-8 w-full rounded border border-slate-300 px-2 text-xs bg-white"
                                value={answers[q.id] || ""}
                                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                required={q.isRequired}
                              />
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Immediate Appointment Scheduling Module */}
                  {appointmentDecision === "scheduled" && (
                    <Card className="border-blue-300 bg-blue-50/20">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-xs uppercase font-bold text-blue-900 flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          Technician Visit Booking Details
                        </CardTitle>
                        <CardDescription className="text-xs text-blue-700">
                          Assign a field executive and confirm the appointment slot agreed with the respondent
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Visit Date *
                            </label>
                            <input
                              type="date"
                              required
                              value={appointmentDate}
                              onChange={(e) => setAppointmentDate(e.target.value)}
                              className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs shadow-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Visit Time Slot *
                            </label>
                            <input
                              type="time"
                              required
                              value={appointmentTime}
                              onChange={(e) => setAppointmentTime(e.target.value)}
                              className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs shadow-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Assign Field Executive *
                            </label>
                            <select
                              required
                              value={assignedExecutiveId}
                              onChange={(e) => setAssignedExecutiveId(e.target.value)}
                              className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs shadow-sm"
                            >
                              {fieldExecutives.map((exec) => (
                                <option key={exec.id} value={exec.id}>
                                  {exec.name} ({exec.regionName || "Executive"})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Technician Visit Instructions
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Please knock on door instead of ringing bell. Respondent home after 11 AM."
                            value={appointmentInstructions}
                            onChange={(e) => setAppointmentInstructions(e.target.value)}
                            className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs shadow-sm"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* General Operational Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Call Attempt Notes & Remarks
                </label>
                <textarea
                  rows={2}
                  placeholder="Record summary of conversation, callback instructions, or respondent feedback..."
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    handleStopTimer();
                    setIsConsoleOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  Save Call Attempt & Outcome
                </Button>
              </div>
            </form>
          )}
        </Dialog>
      </div>
    </AppShell>
  );
}

