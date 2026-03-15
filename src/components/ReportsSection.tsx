"use client";

import { useState, useCallback, useEffect } from "react";
import MetricCard from "./MetricCard";
import DetailModal from "./DetailModal";
import ImportModal from "./ImportModal";

const MONTHLY_ITEMS = [
  {
    id: "debtors",
    label: "Debtors",
    value: "$245K",
    description: "Accounts receivable - amounts owed by customers for goods or services delivered.",
    chartData: [
      { name: "Jan", value: 180 },
      { name: "Feb", value: 195 },
      { name: "Mar", value: 210 },
      { name: "Apr", value: 220 },
      { name: "May", value: 235 },
      { name: "Jun", value: 245 },
    ],
    items: [
      { label: "Current", value: "$198K" },
      { label: "30-60 days", value: "$32K" },
      { label: "60-90 days", value: "$15K" },
    ],
  },
  {
    id: "creditors",
    label: "Creditors",
    value: "$180K",
    description: "Accounts payable - amounts owed to suppliers and vendors.",
    chartData: [
      { name: "Jan", value: 210 },
      { name: "Feb", value: 200 },
      { name: "Mar", value: 195 },
      { name: "Apr", value: 190 },
      { name: "May", value: 185 },
      { name: "Jun", value: 180 },
    ],
    items: [
      { label: "Trade payables", value: "$142K" },
      { label: "Accrued expenses", value: "$38K" },
    ],
  },
  {
    id: "inventory",
    label: "Inventory",
    value: "$420K",
    description: "Total value of goods held for sale or in production.",
    chartData: [
      { name: "Jan", value: 380 },
      { name: "Feb", value: 395 },
      { name: "Mar", value: 410 },
      { name: "Apr", value: 400 },
      { name: "May", value: 415 },
      { name: "Jun", value: 420 },
    ],
    items: [
      { label: "Raw materials", value: "$120K" },
      { label: "Work in progress", value: "$95K" },
      { label: "Finished goods", value: "$205K" },
    ],
  },
  {
    id: "capex",
    label: "Capex",
    value: "$85K",
    description: "Capital expenditure - investments in fixed assets this month.",
    chartData: [
      { name: "Jan", value: 45 },
      { name: "Feb", value: 62 },
      { name: "Mar", value: 38 },
      { name: "Apr", value: 71 },
      { name: "May", value: 55 },
      { name: "Jun", value: 85 },
    ],
    items: [
      { label: "Equipment", value: "$52K" },
      { label: "IT & Software", value: "$18K" },
      { label: "Facilities", value: "$15K" },
    ],
  },
  {
    id: "loan-movement",
    label: "Loan Movement",
    value: "-$32K",
    description: "Net change in loan balance - principal repaid vs drawn.",
    chartData: [
      { name: "Jan", value: -28 },
      { name: "Feb", value: -30 },
      { name: "Mar", value: -35 },
      { name: "Apr", value: -31 },
      { name: "May", value: -33 },
      { name: "Jun", value: -32 },
    ],
    chartType: "line" as const,
    items: [
      { label: "Principal repaid", value: "$45K" },
      { label: "New drawdown", value: "$13K" },
    ],
  },
  {
    id: "income-statement",
    label: "Income Statement",
    value: "$520K",
    description: "Net profit for the month - revenue less all expenses.",
    chartData: [
      { name: "Jan", value: 420 },
      { name: "Feb", value: 445 },
      { name: "Mar", value: 480 },
      { name: "Apr", value: 465 },
      { name: "May", value: 505 },
      { name: "Jun", value: 520 },
    ],
    items: [
      { label: "Revenue", value: "$2.4M" },
      { label: "COGS", value: "$912K" },
      { label: "Operating expenses", value: "$968K" },
      { label: "Net profit", value: "$520K" },
    ],
  },
];

const DAILY_ITEMS = [
  {
    id: "cash-usd",
    label: "Cash (USD)",
    value: "$820K",
    description: "Total cash and cash equivalents held in USD across all accounts.",
    chartData: [
      { name: "Mon", value: 780 },
      { name: "Tue", value: 815 },
      { name: "Wed", value: 790 },
      { name: "Thu", value: 830 },
      { name: "Fri", value: 840 },
      { name: "Sat", value: 825 },
      { name: "Sun", value: 820 },
    ],
    items: [
      { label: "Operating account (USD)", value: "$520K" },
      { label: "Reserve account (USD)", value: "$280K" },
      { label: "Petty cash (USD)", value: "$20K" },
    ],
  },
  {
    id: "cash-zwg",
    label: "Cash (ZWG)",
    value: "ZWG 380K",
    description: "Total cash and cash equivalents held in ZWG across all accounts.",
    chartData: [
      { name: "Mon", value: 360 },
      { name: "Tue", value: 370 },
      { name: "Wed", value: 355 },
      { name: "Thu", value: 380 },
      { name: "Fri", value: 390 },
      { name: "Sat", value: 385 },
      { name: "Sun", value: 380 },
    ],
    items: [
      { label: "Operating account (ZWG)", value: "ZWG 260K" },
      { label: "Reserve account (ZWG)", value: "ZWG 110K" },
      { label: "Petty cash (ZWG)", value: "ZWG 10K" },
    ],
  },
  {
    id: "revenue",
    label: "Revenue",
    value: "$78.5K",
    description: "Daily revenue from sales and services.",
    chartData: [
      { name: "Mon", value: 72 },
      { name: "Tue", value: 85 },
      { name: "Wed", value: 68 },
      { name: "Thu", value: 91 },
      { name: "Fri", value: 95 },
      { name: "Sat", value: 78 },
      { name: "Sun", value: 78.5 },
    ],
    items: [
      { label: "Product sales", value: "$52K" },
      { label: "Services", value: "$18K" },
      { label: "Other", value: "$8.5K" },
    ],
  },
  {
    id: "cogs",
    label: "COGS",
    value: "$29.8K",
    description: "Cost of goods sold - direct costs to produce goods sold today.",
    chartData: [
      { name: "Mon", value: 28 },
      { name: "Tue", value: 32 },
      { name: "Wed", value: 26 },
      { name: "Thu", value: 35 },
      { name: "Fri", value: 36 },
      { name: "Sat", value: 30 },
      { name: "Sun", value: 29.8 },
    ],
    items: [
      { label: "Materials", value: "$18K" },
      { label: "Labour", value: "$8K" },
      { label: "Overhead", value: "$3.8K" },
    ],
  },
];

type DetailModalItem =
  | (Omit<(typeof MONTHLY_ITEMS)[0], "chartData"> & { chartData?: { name: string; value: number }[] })
  | (Omit<(typeof DAILY_ITEMS)[0], "chartData"> & { chartData?: { name: string; value: number }[] });

export default function ReportsSection() {
  const [modalItem, setModalItem] = useState<DetailModalItem | null>(null);
  const [monthlyModalOpen, setMonthlyModalOpen] = useState(false);
  const [dailyModalOpen, setDailyModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState<"monthly" | "daily-cash" | "daily-revenue-cogs" | null>(null);
  const [importedMonthly, setImportedMonthly] = useState<Record<string, unknown>>({});
  const [importedDaily, setImportedDaily] = useState<Record<string, unknown>>({});

  const openMetricDetail = (item: DetailModalItem) => {
    setModalItem(item);
  };

  const mergeMonthlyItem = useCallback(
    (item: (typeof MONTHLY_ITEMS)[0]) => {
      const raw = importedMonthly[item.id];
      const value =
        item.id === "income-statement"
          ? "—"
          : raw !== undefined && raw !== null
            ? typeof raw === "number"
              ? `$${raw.toLocaleString()}`
              : String(raw)
            : item.value;
      let items = item.items;
      let chartData: { name: string; value: number }[] | undefined = item.chartData;
      if (item.id === "capex" && Array.isArray(importedMonthly.capexItems)) {
        items = importedMonthly.capexItems as { label: string; value: string }[];
        chartData = undefined;
      } else if (item.id === "loan-movement" && Array.isArray(importedMonthly.loanMovementItems)) {
        items = importedMonthly.loanMovementItems as { label: string; value: string }[];
        chartData = undefined;
      } else if (item.id === "income-statement" && Array.isArray(importedMonthly.incomeStatementItems)) {
        items = importedMonthly.incomeStatementItems as { label: string; value: string }[];
        chartData = undefined;
      }
      return { ...item, value, items, chartData };
    },
    [importedMonthly]
  );

  const mergeDailyItem = useCallback(
    (item: (typeof DAILY_ITEMS)[0]) => {
      const value = (importedDaily[item.id] as string | undefined) ?? item.value;
      let items = item.items;
      let chartData: { name: string; value: number }[] | undefined = item.chartData;

      if (item.id === "cash-usd" && Array.isArray(importedDaily.cashUsdBanks) && importedDaily.cashUsdBanks.length > 0) {
        items = (importedDaily.cashUsdBanks as { name: string; value: string }[]).map((b) => ({ label: b.name, value: b.value }));
      } else if (item.id === "cash-zwg" && Array.isArray(importedDaily.cashZwgBanks) && importedDaily.cashZwgBanks.length > 0) {
        items = (importedDaily.cashZwgBanks as { name: string; value: string }[]).map((b) => ({ label: b.name, value: b.value }));
      } else if (item.id === "revenue") {
        const loc = importedDaily.revenueByLocation as { name: string; value: number }[] | undefined;
        if (Array.isArray(loc) && loc.length > 0) {
          chartData = loc.map((x) => ({ name: x.name, value: x.value }));
        } else {
          chartData = undefined;
        }
        const na = importedDaily.numberAdmissions as string | undefined;
        const tc = importedDaily.theaterCases as string | undefined;
        const tm = importedDaily.theaterMinutes as string | undefined;
        if (na !== undefined || tc !== undefined || tm !== undefined) {
          items = [
            { label: "Admissions", value: na ?? "—" },
            { label: "Theatre Cases", value: tc ?? "—" },
            { label: "Theatre Minutes", value: tm ?? "—" },
          ];
        }
      }

      const noChart = item.id === "cash-usd" || item.id === "cash-zwg" || item.id === "cogs";
      const cogsOnlyTotal = item.id === "cogs" ? [] : items;
      return { ...item, value, items: cogsOnlyTotal, chartData: noChart ? undefined : chartData };
    },
    [importedDaily]
  );

  useEffect(() => {
    const load = async () => {
      let monthly: Record<string, unknown> = {};
      let daily: Record<string, unknown> = {};
      try {
        const [monthlyRes, dailyRes] = await Promise.all([
          fetch("/api/reports?type=monthly").then((r) => (r.ok ? r.json() : {})),
          fetch("/api/reports?type=daily").then((r) => (r.ok ? r.json() : {})),
        ]);
        monthly = (monthlyRes && typeof monthlyRes === "object") ? (monthlyRes as Record<string, unknown>) : {};
        daily = (dailyRes && typeof dailyRes === "object") ? (dailyRes as Record<string, unknown>) : {};
      } catch {
        // continue to localStorage fallback
      }
      if (typeof window !== "undefined") {
        try {
          const storedMonthly = localStorage.getItem("healthpoint-monthly");
          const storedDaily = localStorage.getItem("healthpoint-daily");
          if (!Object.keys(monthly).length && storedMonthly) {
            const parsed = JSON.parse(storedMonthly) as Record<string, unknown>;
            if (Object.keys(parsed).length) monthly = parsed;
          }
          if (!Object.keys(daily).length && storedDaily) {
            const parsed = JSON.parse(storedDaily) as Record<string, unknown>;
            if (Object.keys(parsed).length) daily = parsed;
          }
        } catch {
          // ignore
        }
      }
      if (Object.keys(monthly).length) setImportedMonthly(monthly);
      if (Object.keys(daily).length) setImportedDaily(daily);
    };
    load();
  }, []);

  const handleImportMonthly = useCallback(async (data: Record<string, unknown>) => {
    setImportedMonthly(data);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("healthpoint-monthly", JSON.stringify(data));
      } catch {
        // ignore
      }
    }
    try {
      await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "monthly", data }),
      });
    } catch {
      // ignore if DB not configured
    }
  }, []);

  const handleImportDailyCash = useCallback(
    async (data: Record<string, unknown>) => {
      const next = {
        ...importedDaily,
        "cash-usd": data["cash-usd"],
        "cash-zwg": data["cash-zwg"],
        cashUsdBanks: data.cashUsdBanks,
        cashZwgBanks: data.cashZwgBanks,
      };
      setImportedDaily(next);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("healthpoint-daily", JSON.stringify(next));
        } catch {
          // ignore
        }
      }
      try {
        await fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "daily", data: next }),
        });
      } catch {
        // ignore if DB not configured
      }
    },
    [importedDaily]
  );

  const handleImportDailyRevenueCogs = useCallback(
    async (data: Record<string, unknown>) => {
      const next = {
        ...importedDaily,
        revenue: data.revenue,
        cogs: data.cogs,
        revenueByLocation: data.revenueByLocation,
        numberAdmissions: data.numberAdmissions,
        theaterCases: data.theaterCases,
        theaterMinutes: data.theaterMinutes,
      };
      setImportedDaily(next);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("healthpoint-daily", JSON.stringify(next));
        } catch {
          // ignore
        }
      }
      try {
        await fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "daily", data: next }),
        });
      } catch {
        // ignore if DB not configured
      }
    },
    [importedDaily]
  );

  return (
    <>
      <section className="mb-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <button
            type="button"
            onClick={() => setMonthlyModalOpen(true)}
            className="text-left rounded-2xl border border-red-700 bg-red-600 p-6 md:p-8 shadow-md transition hover:shadow-lg hover:-translate-y-0.5 min-h-[200px] flex flex-col cursor-pointer group text-white"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight group-hover:text-white transition">
                  Monthly Report
                </h2>
                <p className="text-sm text-red-100/90 mt-1">Financial summary for March 2025</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImportModalOpen("monthly");
                  }}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 bg-white hover:bg-red-50 transition"
                >
                  Import
                </button>
                <svg
                  className="w-6 h-6 text-red-100 group-hover:text-white transition"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              {MONTHLY_ITEMS.map((item) => {
                const merged = mergeMonthlyItem(item);
                return (
                  <MetricCard
                    key={item.id}
                    label={merged.label}
                    value={merged.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      openMetricDetail(merged);
                    }}
                    accentColor="text-white"
                  />
                );
              })}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setDailyModalOpen(true)}
            className="text-left rounded-2xl border border-slate-900 bg-slate-900 p-6 md:p-8 shadow-md transition hover:shadow-lg hover:-translate-y-0.5 min-h-[200px] flex flex-col cursor-pointer group text-white"
          >
            <div className="mb-4">
              <h2 className="text-xl font-bold tracking-tight group-hover:text-white transition">
                Daily Reports
              </h2>
              <p className="text-sm text-slate-200/80 mt-1">Cash flow &amp; transactions overview</p>
            </div>
            <div className="flex-1 space-y-6">
              <div>
                <div className="grid grid-cols-2 gap-3">
                  {DAILY_ITEMS.filter((i) => i.id === "cash-usd" || i.id === "cash-zwg").map((item) => {
                    const merged = mergeDailyItem(item);
                    return (
                      <MetricCard
                        key={item.id}
                        label={merged.label}
                        value={merged.value}
                        onClick={(e) => {
                          e.stopPropagation();
                          openMetricDetail(merged);
                        }}
                        accentColor="text-white"
                      />
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImportModalOpen("daily-cash");
                  }}
                  className="mt-3 w-full rounded-xl border border-white/40 bg-white/10 px-4 py-3 text-sm font-medium text-white hover:bg-white/20 transition"
                >
                  Import (Cash USD / Cash ZWG)
                </button>
              </div>
              <div>
                <div className="grid grid-cols-2 gap-3">
                  {DAILY_ITEMS.filter((i) => i.id === "revenue" || i.id === "cogs").map((item) => {
                    const merged = mergeDailyItem(item);
                    return (
                      <MetricCard
                        key={item.id}
                        label={merged.label}
                        value={merged.value}
                        onClick={(e) => {
                          e.stopPropagation();
                          openMetricDetail(merged);
                        }}
                        accentColor="text-white"
                      />
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImportModalOpen("daily-revenue-cogs");
                  }}
                  className="mt-3 w-full rounded-xl border border-white/40 bg-white/10 px-4 py-3 text-sm font-medium text-white hover:bg-white/20 transition"
                >
                  Import (Revenue & COGS)
                </button>
              </div>
            </div>
          </button>
        </div>
      </section>

      <DetailModal
        isOpen={monthlyModalOpen && !modalItem}
        onClose={() => setMonthlyModalOpen(false)}
        title="Monthly Report"
        value="March 2025"
        description="Full monthly financial overview. Click individual metrics on the card for detailed breakdowns and charts. Use Import to upload Excel or CSV."
        items={[
          { label: "Debtors", value: (importedMonthly.debtors as string | undefined) ?? "$245K" },
          { label: "Creditors", value: (importedMonthly.creditors as string | undefined) ?? "$180K" },
          { label: "Inventory", value: (importedMonthly.inventory as string | undefined) ?? "$420K" },
          { label: "Capex", value: (importedMonthly.capex as string | undefined) ?? "$85K" },
          { label: "Loan Movement", value: (importedMonthly["loan-movement"] as string | undefined) ?? "-$32K" },
          { label: "Income Statement", value: (importedMonthly["income-statement"] as string | undefined) ?? "$520K" },
        ]}
      />

      <DetailModal
        isOpen={dailyModalOpen && !modalItem}
        onClose={() => setDailyModalOpen(false)}
        title="Daily Reports"
        value="Today"
        description="Daily financial snapshot. Click individual metrics on the card for detailed breakdowns and charts. Use Import to upload Excel or CSV."
        items={[
          { label: "Cash (USD)", value: (importedDaily["cash-usd"] as string) ?? "$820K" },
          { label: "Cash (ZWG)", value: (importedDaily["cash-zwg"] as string) ?? "ZWG 380K" },
          { label: "Revenue", value: (importedDaily.revenue as string) ?? "$78.5K" },
          { label: "COGS", value: (importedDaily.cogs as string) ?? "$29.8K" },
        ]}
      />

      {modalItem && (
        <DetailModal
          isOpen={!!modalItem}
          onClose={() => setModalItem(null)}
          title={modalItem.label}
          value={modalItem.value}
          description={modalItem.description}
          chartData={modalItem.chartData}
          chartType={("chartType" in modalItem ? modalItem.chartType : "bar") ?? "bar"}
          items={modalItem.items}
        />
      )}

      {importModalOpen === "monthly" && (
        <ImportModal
          isOpen
          onClose={() => setImportModalOpen(null)}
          reportType="monthly"
          onImport={handleImportMonthly}
        />
      )}
      {importModalOpen === "daily-cash" && (
        <ImportModal
          isOpen
          onClose={() => setImportModalOpen(null)}
          reportType="daily"
          onImport={handleImportDailyCash}
          dailyFocus="cash"
        />
      )}
      {importModalOpen === "daily-revenue-cogs" && (
        <ImportModal
          isOpen
          onClose={() => setImportModalOpen(null)}
          reportType="daily"
          onImport={handleImportDailyRevenueCogs}
          dailyFocus="revenue-cogs"
        />
      )}
    </>
  );
}
