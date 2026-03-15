"use client";

import { useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  value: string;
  description?: string;
  chartData?: { name: string; value: number; fill?: string }[];
  chartType?: "bar" | "line";
  items?: { label: string; value: string }[];
}

export default function DetailModal({
  isOpen,
  onClose,
  title,
  value,
  description,
  chartData,
  chartType = "bar",
  items,
}: DetailModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-700 bg-slate-900/95 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100">{title}</h2>
            <p className="text-2xl font-semibold text-emerald-400 mt-1">{value}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-6">
          {description && <p className="text-slate-400">{description}</p>}
          {chartData && chartData.length > 0 && (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "line" ? (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: "#94a3b8" }} />
                    <YAxis stroke="#94a3b8" tick={{ fill: "#94a3b8" }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                      labelStyle={{ color: "#e2e8f0" }}
                    />
                    <Line type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} dot={{ fill: "#22c55e" }} />
                  </LineChart>
                ) : (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: "#94a3b8" }} />
                    <YAxis stroke="#94a3b8" tick={{ fill: "#94a3b8" }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                      labelStyle={{ color: "#e2e8f0" }}
                    />
                    <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
          {items && items.length > 0 && (
            <div className="rounded-lg border border-slate-700 divide-y divide-slate-700">
              {items.map((item, i) => (
                <div key={i} className="flex justify-between px-4 py-3">
                  <span className="text-slate-400">{item.label}</span>
                  <span className="font-semibold text-slate-100">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
