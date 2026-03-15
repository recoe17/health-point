import { type ReactNode } from "react";

interface ReportCardProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  accent?: "primary" | "secondary";
}

const accentStyles = {
  primary: "bg-red-600 border-red-700",
  secondary: "bg-slate-900 border-slate-900",
};

export default function ReportCard({ title, subtitle, children, accent = "primary" }: ReportCardProps) {
  return (
    <div
      className={`rounded-2xl border p-6 md:p-8 text-white shadow-md transition hover:shadow-lg hover:-translate-y-0.5 min-h-[200px] flex flex-col ${accentStyles[accent]}`}
    >
      <div className="mb-4">
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-slate-200/80 mt-1">{subtitle}</p>}
      </div>
      {children && <div className="flex-1">{children}</div>}
    </div>
  );
}
