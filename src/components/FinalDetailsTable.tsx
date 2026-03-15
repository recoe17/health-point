import type { FinalDetailItem } from "@/types/dashboard";

const statusStyles = {
  healthy: "text-slate-900 bg-white border border-slate-200",
  warning: "text-slate-900 bg-white border border-slate-200",
  attention: "text-red-600 bg-red-50 border border-red-200",
};

const trendIcons = {
  up: "↑",
  down: "↓",
  stable: "→",
};

interface FinalDetailsTableProps {
  items: FinalDetailItem[];
  title?: string;
}

export default function FinalDetailsTable({ items, title = "Final Details" }: FinalDetailsTableProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500 mt-0.5">Complete summary of company financial metrics</p>
      </div>
      <div className="divide-y divide-slate-100">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="flex items-center justify-between px-6 py-4 hover:bg-slate-800/30 transition"
          >
            <div className="flex items-center gap-3">
              <span className="text-slate-400 text-sm font-mono w-8">{String(index + 1).padStart(2, "0")}</span>
              <span className="text-slate-800">{item.label}</span>
            </div>
            <div className="flex items-center gap-3">
              {item.status && (
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyles[item.status]}`}
                >
                  {item.status}
                </span>
              )}
              <span className="font-semibold text-slate-900 tabular-nums">
                {item.value}
                {item.unit && <span className="text-slate-500 font-normal ml-1">{item.unit}</span>}
              </span>
              {item.trend && (
                <span className="text-sm text-red-500">
                  {trendIcons[item.trend]}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
