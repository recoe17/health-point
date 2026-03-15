import type { SummaryCard as SummaryCardType } from "@/types/dashboard";

const colorClasses: Record<string, string> = {
  green: "bg-white border-red-100",
  blue: "bg-white border-red-100",
  amber: "bg-white border-red-100",
  violet: "bg-white border-red-100",
};

const iconColors: Record<string, string> = {
  green: "text-red-500",
  blue: "text-red-500",
  amber: "text-red-500",
  violet: "text-red-500",
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
            <span className="mt-2 inline-block text-xs font-semibold text-red-500">
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
