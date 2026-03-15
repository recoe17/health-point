import type { SummaryCard as SummaryCardType } from "@/types/dashboard";

const colorClasses: Record<string, string> = {
  green: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/30",
  blue: "from-sky-500/20 to-sky-600/5 border-sky-500/30",
  amber: "from-amber-500/20 to-amber-600/5 border-amber-500/30",
  violet: "from-violet-500/20 to-violet-600/5 border-violet-500/30",
};

const iconColors: Record<string, string> = {
  green: "text-emerald-400",
  blue: "text-sky-400",
  amber: "text-amber-400",
  violet: "text-violet-400",
};

export default function SummaryCard(props: SummaryCardType) {
  const { title, value, subtitle, icon, trend, color } = props;
  return (
    <div
      className={`rounded-2xl border bg-gradient-to-br p-6 backdrop-blur-sm transition hover:scale-[1.02] hover:shadow-lg ${colorClasses[color]}`}
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
