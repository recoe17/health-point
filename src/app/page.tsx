import ReportsSection from "@/components/ReportsSection";
import FinalDetailsTable from "@/components/FinalDetailsTable";
import type { FinalDetailItem } from "@/types/dashboard";

const finalDetails: FinalDetailItem[] = [
  { id: "1", label: "Revenue", value: "2.4M", unit: "USD", status: "healthy", trend: "up" },
  { id: "2", label: "Operating Expenses", value: "1.1M", unit: "USD", status: "healthy", trend: "down" },
  { id: "3", label: "Net Profit", value: "520K", unit: "USD", status: "healthy", trend: "up" },
  { id: "4", label: "Gross Margin", value: 62, unit: "%", status: "healthy", trend: "up" },
  { id: "5", label: "Cash Flow", value: "380K", unit: "USD", status: "healthy", trend: "stable" },
  { id: "6", label: "Accounts Receivable", value: "245K", unit: "USD", status: "warning", trend: "up" },
  { id: "7", label: "Total Assets", value: "4.2M", unit: "USD", status: "healthy", trend: "up" },
  { id: "8", label: "Debt-to-Equity", value: 0.42, unit: "", status: "healthy", trend: "down" },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/30 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Company Financial Dashboard</h1>
          <p className="text-slate-500 mt-1">Final Details & Summary</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <ReportsSection />

        {/* Final Details Table */}
        <section>
          <FinalDetailsTable items={finalDetails} title="Final Details" />
        </section>
      </main>
    </div>
  );
}
