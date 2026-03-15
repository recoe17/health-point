"use client";

import { useCallback, useState } from "react";
import type { ReportType } from "@/lib/parseImport";
import { parseFile } from "@/lib/parseImport";

export type DailyImportFocus = "cash" | "revenue-cogs";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: ReportType;
  onImport: (data: Record<string, unknown>) => void;
  /** When reportType is "daily", only show and pass these keys (separate cash vs revenue/cogs imports). */
  dailyFocus?: DailyImportFocus;
}

const ACCEPT = ".csv,.xlsx,.xls";
const LABELS: Record<ReportType, string[]> = {
  monthly: ["Debtors", "Creditors", "Inventory", "Capex", "Loan Movement", "Income Statement"],
  daily: ["Cash USD", "Cash ZWG", "Revenue", "COGS"],
};

const FIELD_KEYS: Record<ReportType, string[]> = {
  monthly: ["debtors", "creditors", "inventory", "capex", "loan-movement", "income-statement"],
  daily: ["cash-usd", "cash-zwg", "revenue", "cogs"],
};

const DAILY_CASH_KEYS = ["cash-usd", "cash-zwg", "cashUsdBanks", "cashZwgBanks"];
const DAILY_REVENUE_COGS_KEYS = [
  "revenue",
  "cogs",
  "revenueByLocation",
  "numberAdmissions",
  "theaterCases",
  "theaterMinutes",
];

export default function ImportModal({ isOpen, onClose, reportType, onImport, dailyFocus }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedData, setParsedData] = useState<Record<string, unknown> | null>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files[0];
      if (f && (f.name.endsWith(".csv") || f.name.endsWith(".xlsx") || f.name.endsWith(".xls"))) {
        setFile(f);
        setError(null);
      } else {
        setError("Please select a .csv, .xlsx, or .xls file");
      }
    },
    []
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setError(null);
    }
    e.target.value = "";
  };

  const handleParse = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setParsedData(null);
    try {
      const parsed = await parseFile(file, reportType) as Record<string, unknown>;
      if (reportType === "daily" && dailyFocus) {
        const keys = dailyFocus === "cash" ? DAILY_CASH_KEYS : DAILY_REVENUE_COGS_KEYS;
        const data: Record<string, unknown> = {};
        for (const k of keys) {
          const v = parsed[k];
          if (v !== undefined && v !== null) data[k] = v;
        }
        setParsedData(data);
      } else if (reportType === "daily") {
        setParsedData(parsed);
      } else {
        const data: Record<string, unknown> = {};
        for (const k of FIELD_KEYS[reportType]) {
          const v = parsed[k];
          if (v) data[k] = v;
        }
        setParsedData(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse file. Ensure headers match: " + LABELS[reportType].join(", "));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = () => {
    if (parsedData) {
      onImport(parsedData);
      handleClose();
    }
  };

  const handleClose = () => {
    setFile(null);
    setError(null);
    setParsedData(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-100">
            Import {reportType === "monthly" ? "Monthly" : dailyFocus === "cash" ? "Daily (Cash USD / ZWG)" : dailyFocus === "revenue-cogs" ? "Daily (Revenue & COGS)" : "Daily"} Report
          </h2>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-400">
            Upload Excel (.xlsx, .xls) or CSV. Use column headers or first column as labels. Supported labels:
          </p>
          <p className="text-xs text-slate-500 font-mono">
            {reportType === "monthly"
              ? "Debtors, Creditors, Inventory, Capex, Loan Movement, Income Statement"
              : "Cash, Revenue, COGS"}
          </p>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`rounded-xl border-2 border-dashed p-8 text-center transition ${
              isDragging
                ? "border-red-500 bg-red-500/10"
                : "border-slate-600 hover:border-red-400/60"
            }`}
          >
            <input
              type="file"
              accept={ACCEPT}
              onChange={handleFileChange}
              className="hidden"
              id={`import-${reportType}`}
            />
            <label
              htmlFor={`import-${reportType}`}
              className="cursor-pointer block"
            >
              <svg
                className="mx-auto h-12 w-12 text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="mt-2 text-sm text-slate-400">
                {file ? file.name : "Drop file or click to browse"}
              </p>
              <p className="mt-1 text-xs text-slate-500">CSV, XLSX, XLS</p>
            </label>
          </div>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          {parsedData && Object.keys(parsedData).length > 0 && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/5 p-4">
              <p className="text-sm font-medium text-red-400 mb-3">Preview — click Update to show latest on dashboard</p>
              <div className="space-y-2 text-sm">
                {Object.entries(parsedData)
                  .filter(([, val]) => typeof val === "string" || (Array.isArray(val) && val.length > 0))
                  .map(([key, val]) => (
                    <div key={key} className="flex justify-between text-slate-300">
                      <span className="capitalize">{key.replace(/-/g, " ")}</span>
                      <span className="font-semibold text-slate-100">
                        {Array.isArray(val)
                          ? `${(val as { name: string; value: string }[]).length} bank(s)`
                          : String(val)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row justify-end gap-3 border-t border-slate-700 px-6 py-4">
          <button
            onClick={handleClose}
            className="rounded-lg px-4 py-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition order-2 sm:order-1"
          >
            Cancel
          </button>
          {parsedData ? (
            <button
              onClick={handleUpdate}
              className="rounded-xl px-6 py-3.5 bg-red-600 text-white font-semibold text-base shadow-lg shadow-red-600/30 ring-2 ring-red-400/50 hover:bg-red-500 hover:shadow-red-500/40 transition order-1 sm:order-2 w-full sm:w-auto"
            >
              Update Dashboard
            </button>
          ) : (
            <button
              onClick={handleParse}
              disabled={!file || loading}
              className="rounded-lg px-4 py-2 bg-red-600 text-white font-medium hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? "Parsing…" : "Parse File"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
