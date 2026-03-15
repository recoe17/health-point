import Image from "next/image";
import ReportsSection from "@/components/ReportsSection";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Image
            src="/healthpoint-logo.png"
            alt="HealthPoint"
            width={180}
            height={48}
            className="h-10 w-auto object-contain"
            priority
          />
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Health Point Financial Dashboard</h1>
            <p className="text-slate-500 text-sm mt-0.5">Daily &amp; Monthly Reports</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <ReportsSection />
      </main>
    </div>
  );
}
