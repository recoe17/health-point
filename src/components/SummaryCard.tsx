import type { SummaryCard as SummaryCardType } from "@/types/dashboard";

const colorClasses: Record<string, string> = {
  green: "bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-100",
  blue: "bg-gradient-to-br from-sky-50 to-sky-100 border-sky-100",
  amber: "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-100",
  violet: "bg-gradient-to-br from-violet-50 to-violet-100 border-violet-100",
};

const iconColors: Record<string, string> = {
  green: "text-emerald-500",
  blue: "text-sky-500",
  amber: "text-amber-500",
  violet: "text-violet-500",
};

export default function SummaryCard(props: SummaryCardType) {
  const { title, value, subtitle, icon, trend, color } = props;
  return (
    <div
      className={`rounded-2xl border p-6 shadow-sm transition hover:shadow-md hover:-translate-y-0.5 ${colorClasses[color]}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          {trend !== undefined && (
            <span
              className={`mt-2 inline-block text-xs font-semibold ${trend >= 0 ? "text-emerald-400" : "text-rose-400"}`}
            >
              {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}% vs last period
            </span>
          )}
        </div>
        <span className={`text-4xl ${iconColors[color]}`} role="img" aria-hidden>
          {icon}
        </span>
      </div>
    </div>
  );
}
