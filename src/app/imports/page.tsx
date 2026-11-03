"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { DataTable } from "@/components/ui/data-table";
import { useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/api-client";
import { 
  UploadCloud, 
  Download, 
  FileCheck, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  FileSpreadsheet,
  Users
} from "lucide-react";

export default function RecruitmentUploaderPage() {
  const { user, logout } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [batches, setBatches] = useState<any[]>([]);

  useEffect(() => {
    loadBatches();
  }, []);

  async function loadBatches() {
    try {
      const res = await apiFetch("/imports/batches");
      setBatches(res.data || []);
    } catch (err) {
      // Ignore initial batch load errors
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setValidationResult(null);
      setImportSuccessMsg(null);
      setErrorMessage(null);
    }
  };

  const handleValidate = async () => {
    if (!selectedFile) return;
    setIsValidating(true);
    setErrorMessage(null);
    setImportSuccessMsg(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await apiFetch("/imports/validate", {
        method: "POST",
        body: formData,
      });
      setValidationResult(res.data);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to validate CSV file");
    } finally {
      setIsValidating(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!validationResult || !selectedFile) return;
    setIsImporting(true);
    setErrorMessage(null);

    const validRows = validationResult.preview.filter((r: any) => r.isValid);

    try {
      const res = await apiFetch("/imports/confirm", {
        method: "POST",
        body: JSON.stringify({
          filename: selectedFile.name,
          rows: validRows,
        }),
      });

      setImportSuccessMsg(
        `Successfully imported ${res.data.importedCount} households into PanelSphere!`
      );
      setValidationResult(null);
      setSelectedFile(null);
      loadBatches();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to complete household import");
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    const token = localStorage.getItem("panelsphere_token");
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1";

    if (!token) {
      window.location.href = "/login";
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/imports/template`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("panelsphere_token");
          localStorage.removeItem("panelsphere_user");
          window.location.href = "/login";
          return;
        }
        throw new Error("Failed to download template");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "household_recruitment_template.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setErrorMessage("Unable to download the CSV template. Please try again.");
    }
  };

  const previewColumns = [
    { header: "Row #", accessorKey: "rowIndex", className: "w-16 font-mono text-xs" },
    { header: "HHID", accessorKey: "hhid", className: "font-semibold text-blue-600 text-xs" },
    { header: "Respondent", accessorKey: "respondentName", className: "text-xs font-medium" },
    { header: "Contact", accessorKey: "contactNumber", className: "text-xs" },
    { header: "Region", accessorKey: "region", className: "text-xs" },
    { header: "SEC", accessorKey: "sec", className: "text-xs" },
    { header: "MOSR", accessorKey: "mosr", className: "text-xs" },
    {
      header: "Members",
      cell: (row: any) => (
        <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium">
          {row.members?.length || 0} members
        </span>
      ),
    },
    {
      header: "Status",
      cell: (row: any) =>
        row.isValid ? (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="h-3 w-3" /> Valid
          </Badge>
        ) : (
          <div className="space-y-1">
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" /> Invalid
            </Badge>
            <div className="text-[10px] text-rose-600 max-w-xs">
              {row.errors?.join(", ")}
            </div>
          </div>
        ),
    },
  ];

  return (
    <AppShell user={user || undefined} onLogout={logout}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Household Recruitment Information Uploader
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Bulk CSV ingestion supporting up to 10 members per household with pre-import validation
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Download CSV Template
          </Button>
        </div>

        {importSuccessMsg && (
          <Alert variant="success" title="Import Completed" description={importSuccessMsg} />
        )}

        {errorMessage && (
          <Alert variant="destructive" title="Error" description={errorMessage} />
        )}

        {/* Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-blue-600" />
              Upload Consolidated Recruitment CSV
            </CardTitle>
            <CardDescription className="text-xs">
              Select your prepared recruitment CSV file containing respondent demographics and member columns (member_1 through member_10).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-slate-200 rounded-lg p-1.5"
              />
              <Button
                onClick={handleValidate}
                disabled={!selectedFile || isValidating}
                isLoading={isValidating}
                className="w-full sm:w-auto shrink-0"
              >
                <FileCheck className="h-4 w-4 mr-2" />
                Validate CSV File
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Validation Preview & Confirmation */}
        {validationResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border-slate-200">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-xs uppercase text-slate-500">Total Rows Detected</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-xl font-bold text-slate-900">{validationResult.totalRows}</div>
                </CardContent>
              </Card>

              <Card className="border-emerald-200 bg-emerald-50/30">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-xs uppercase text-emerald-700 font-semibold">Valid Rows</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-xl font-bold text-emerald-600">{validationResult.validRowsCount}</div>
                </CardContent>
              </Card>

              <Card className="border-rose-200 bg-rose-50/30">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-xs uppercase text-rose-700 font-semibold">Invalid / Incomplete Rows</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-xl font-bold text-rose-600">{validationResult.invalidRowsCount}</div>
                </CardContent>
              </Card>
            </div>

            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div>
                <h4 className="text-sm font-semibold text-slate-800">Review Validation Results</h4>
                <p className="text-xs text-slate-500">
                  Only valid rows will be committed to the database in a transaction-safe operation.
                </p>
              </div>
              <Button
                onClick={handleConfirmImport}
                disabled={validationResult.validRowsCount === 0 || isImporting}
                isLoading={isImporting}
              >
                <UploadCloud className="h-4 w-4 mr-2" />
                Confirm & Import {validationResult.validRowsCount} Valid Households
              </Button>
            </div>

            <DataTable
              columns={previewColumns}
              data={validationResult.preview || []}
            />
          </div>
        )}

        {/* Import Batch History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-500" />
              Recent Recruitment Import History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { header: "Filename", accessorKey: "filename", className: "font-medium text-xs text-slate-800" },
                { header: "Total Rows", accessorKey: "totalRows", className: "text-xs" },
                {
                  header: "Successful",
                  cell: (b: any) => (
                    <span className="text-xs text-emerald-600 font-semibold">{b.successfulRows}</span>
                  ),
                },
                {
                  header: "Imported By",
                  accessorKey: "importedByName",
                  className: "text-xs text-slate-500",
                },
                {
                  header: "Date",
                  cell: (b: any) => (
                    <span className="text-xs text-slate-500 font-mono">
                      {new Date(b.createdAt).toLocaleString()}
                    </span>
                  ),
                },
              ]}
              data={batches}
              emptyMessage="No previous import batches recorded."
            />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

