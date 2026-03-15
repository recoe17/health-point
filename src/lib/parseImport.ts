export type ReportType = "monthly" | "daily";

export interface ParsedMonthlyData {
  debtors?: string;
  creditors?: string;
  inventory?: string;
  capex?: string;
  "loan-movement"?: string;
  "income-statement"?: string;
}

export interface ParsedDailyData {
  cash?: string;
  revenue?: string;
  cogs?: string;
}

export async function parseFile(
  file: File,
  reportType: ReportType
): Promise<Record<string, string>> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("reportType", reportType);

  const res = await fetch("/api/parse-report", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "Failed to parse file");
  }

  return res.json();
}
