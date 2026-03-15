import { type ReactNode } from "react";

interface ReportCardProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  accent?: "emerald" | "sky";
}

const accentStyles = {
  emerald: "from-emerald-500/15 to-emerald-600/5 border-emerald-500/30",
  sky: "from-sky-500/15 to-sky-600/5 border-sky-500/30",
};

export default function ReportCard({ title, subtitle, children, accent = "emerald" }: ReportCardProps) {
  return (
    <div
      className={`rounded-2xl border bg-gradient-to-br p-6 md:p-8 backdrop-blur-sm transition hover:shadow-xl hover:border-opacity-60 min-h-[200px] flex flex-col ${accentStyles[accent]}`}
    >
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-100 tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {children && <div className="flex-1">{children}</div>}
    </div>
  );
}
