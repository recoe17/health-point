"use client";

import type { MouseEvent } from "react";

interface MetricCardProps {
  label: string;
  value: string;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  accentColor?: string;
}

export default function MetricCard({ label, value, onClick, accentColor = "text-emerald-400" }: MetricCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-xl border border-slate-700/50 bg-slate-800/30 px-4 py-3 hover:bg-slate-700/40 hover:border-slate-600 transition flex items-center justify-between group"
    >
      <span className="text-slate-300">{label}</span>
      <span className={`font-semibold ${accentColor}`}>{value}</span>
      <svg
        className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}
