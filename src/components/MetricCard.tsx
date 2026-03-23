"use client";

import type { MouseEvent } from "react";

interface MetricCardProps {
  label: string;
  value: string;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  accentColor?: string;
}

export default function MetricCard({ label, value, onClick, accentColor = "text-red-400" }: MetricCardProps) {
  const clickable = typeof onClick === "function";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-xl border border-slate-700/60 bg-slate-900/40 px-4 py-3 transition flex items-center justify-between group ${
        clickable ? "hover:bg-slate-800/60 hover:border-red-500/60 cursor-pointer" : "cursor-default"
      }`}
    >
      <span className="text-slate-200">{label}</span>
      <span className={`font-semibold ${accentColor}`}>{value}</span>
      {clickable && (
        <svg
          className="w-4 h-4 text-slate-500 group-hover:text-red-400 transition"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </button>
  );
}
