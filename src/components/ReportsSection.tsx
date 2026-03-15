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
    id: "cash",
    label: "Cash",
    value: "$1.2M",
    description: "Total cash and cash equivalents held across all accounts.",
    chartData: [
      { name: "Mon", value: 1150 },
      { name: "Tue", value: 1180 },
      { name: "Wed", value: 1120 },
      { name: "Thu", value: 1190 },
      { name: "Fri", value: 1220 },
      { name: "Sat", value: 1210 },
      { name: "Sun", value: 1200 },
    ],
    items: [
      { label: "Operating account", value: "$680K" },
      { label: "Reserve account", value: "$420K" },
      { label: "Petty cash", value: "$12K" },
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

export default function ReportsSection() {
  const [modalItem, setModalItem] = useState<typeof MONTHLY_ITEMS[0] | typeof DAILY_ITEMS[0] | null>(null);
  const [monthlyModalOpen, setMonthlyModalOpen] = useState(false);
  const [dailyModalOpen, setDailyModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState<"monthly" | "daily" | null>(null);
  const [importedMonthly, setImportedMonthly] = useState<Record<string, string>>({});
  const [importedDaily, setImportedDaily] = useState<Record<string, string>>({});

  const openMetricDetail = (item: typeof MONTHLY_ITEMS[0] | typeof DAILY_ITEMS[0]) => {
    setModalItem(item);
  };

  const mergeMonthlyItem = useCallback(
    (item: (typeof MONTHLY_ITEMS)[0]) => ({
      ...item,
      value: importedMonthly[item.id] ?? item.value,
    }),
    [importedMonthly]
  );

  const mergeDailyItem = useCallback(
    (item: (typeof DAILY_ITEMS)[0]) => ({
      ...item,
      value: importedDaily[item.id] ?? item.value,
    }),
    [importedDaily]
  );

  useEffect(() => {
    Promise.all([
      fetch("/api/reports?type=monthly").then((r) => r.ok ? r.json() : {}),
      fetch("/api/reports?type=daily").then((r) => r.ok ? r.json() : {}),
    ]).then(([monthly, daily]) => {
      if (Object.keys(monthly).length) setImportedMonthly(monthly);
      if (Object.keys(daily).length) setImportedDaily(daily);
    });
  }, []);

  const handleImportMonthly = useCallback(async (data: Record<string, string>) => {
    setImportedMonthly(data);
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

  const handleImportDaily = useCallback(async (data: Record<string, string>) => {
    setImportedDaily(data);
    try {
      await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "daily", data }),
      });
    } catch {
      // ignore if DB not configured
    }
  }, []);

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
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight group-hover:text-white transition">
                  Daily Reports
                </h2>
                <p className="text-sm text-slate-200/80 mt-1">Cash flow &amp; transactions overview</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImportModalOpen("daily");
                  }}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-900 bg-white hover:bg-slate-100 transition"
                >
                  Import
                </button>
                <svg
                  className="w-6 h-6 text-slate-200 group-hover:text-white transition"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              {DAILY_ITEMS.map((item) => {
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
          { label: "Debtors", value: importedMonthly.debtors ?? "$245K" },
          { label: "Creditors", value: importedMonthly.creditors ?? "$180K" },
          { label: "Inventory", value: importedMonthly.inventory ?? "$420K" },
          { label: "Capex", value: importedMonthly.capex ?? "$85K" },
          { label: "Loan Movement", value: importedMonthly["loan-movement"] ?? "-$32K" },
          { label: "Income Statement", value: importedMonthly["income-statement"] ?? "$520K" },
        ]}
      />

      <DetailModal
        isOpen={dailyModalOpen && !modalItem}
        onClose={() => setDailyModalOpen(false)}
        title="Daily Reports"
        value="Today"
        description="Daily financial snapshot. Click individual metrics on the card for detailed breakdowns and charts. Use Import to upload Excel or CSV."
        items={[
          { label: "Cash", value: importedDaily.cash ?? "$1.2M" },
          { label: "Revenue", value: importedDaily.revenue ?? "$78.5K" },
          { label: "COGS", value: importedDaily.cogs ?? "$29.8K" },
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
      {importModalOpen === "daily" && (
        <ImportModal
          isOpen
          onClose={() => setImportModalOpen(null)}
          reportType="daily"
          onImport={handleImportDaily}
        />
      )}
    </>
  );
}
