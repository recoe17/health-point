import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const reportType = formData.get("reportType") as string | null;

    if (!file || !reportType || !["monthly", "daily"].includes(reportType)) {
      return NextResponse.json(
        { error: "Missing file or invalid reportType" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

    if (!rows.length) {
      return NextResponse.json({ error: "File is empty" }, { status: 400 });
    }

    const parseNum = (v: unknown): number => {
      if (v == null || v === "") return 0;
      if (typeof v === "number" && !Number.isNaN(v)) return v;
      const n = parseFloat(String(v).replace(/[$,%\s]/g, ""));
      return Number.isNaN(n) ? 0 : n;
    };
    const fmt = (n: number) =>
      Math.abs(n) >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : Math.abs(n) >= 1e3 ? `$${(n / 1e3).toFixed(1)}K` : `$${n.toFixed(2)}`;

    // HealthPoint Daily Revenue format (RptManagementRevenueAll)
    const isHealthPointDaily = reportType === "daily" && rows.some(
      (r) => String((r as unknown[])[0] ?? "").toLowerCase().includes("rptmanagement") ||
        String((r as unknown[])[1] ?? "").toLowerCase().includes("revenue per location")
    );
    if (isHealthPointDaily) {
      const totalRow = rows.find((r) =>
        String((r as unknown[])[0] ?? "").trim().toLowerCase() === "total:"
      ) as unknown[] | undefined;
      if (totalRow && totalRow.length >= 10) {
        const revenue = parseNum(totalRow[9]);
        const cogs = parseNum(totalRow[4]) + parseNum(totalRow[6]);
        return NextResponse.json({
          revenue: fmt(revenue),
          cogs: fmt(cogs),
        });
      }
    }

    const MONTHLY_MAP: Record<string, string> = {
      debtors: "debtors",
      "accounts receivable": "debtors",
      creditors: "creditors",
      "accounts payable": "creditors",
      inventory: "inventory",
      capex: "capex",
      "loan movement": "loan-movement",
      loan: "loan-movement",
      "income statement": "income-statement",
      "net profit": "income-statement",
    };
    const DAILY_MAP: Record<string, string> = {
      cash: "cash",
      revenue: "revenue",
      sales: "revenue",
      cogs: "cogs",
      "cost of goods sold": "cogs",
    };

    const norm = (v: unknown) =>
      String(v ?? "")
        .toLowerCase()
        .trim()
        .replace(/[_\s-]+/g, " ");
    const parseNumNullable = (v: unknown): number | null => {
      if (v == null || v === "") return null;
      if (typeof v === "number" && !Number.isNaN(v)) return v;
      const n = parseFloat(String(v).replace(/[$,%\s]/g, ""));
      return Number.isNaN(n) ? null : n;
    };
    const fmtNum = (n: number) =>
      Math.abs(n) >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : Math.abs(n) >= 1e3 ? `$${(n / 1e3).toFixed(1)}K` : `$${n.toFixed(2)}`;

    const match = (label: string, map: Record<string, string>) => {
      const k = norm(label);
      if (map[k]) return map[k];
      for (const [key, val] of Object.entries(map)) {
        if (k.includes(key) || key.includes(k)) return val;
      }
      return null;
    };

    const firstRow = rows[0] as unknown[];
    const secondNum = parseNumNullable(firstRow[1]);
    const isKeyValue =
      firstRow.length >= 2 &&
      typeof firstRow[0] === "string" &&
      secondNum !== null;

    const raw: Record<string, number> = {};
    if (isKeyValue) {
      for (const row of rows as unknown[][]) {
        const key = norm(row[0]);
        const val = parseNumNullable(row[1]);
        if (key && val !== null) raw[key] = val;
      }
    } else if (rows.length >= 2) {
      const headers = (rows[0] as unknown[]).map((h) => norm(h));
      const dataRow = rows[1] as unknown[];
      headers.forEach((h, i) => {
        const val = parseNumNullable(dataRow[i]);
        if (h && val !== null) raw[h] = val;
      });
    }

    const map = reportType === "monthly" ? MONTHLY_MAP : DAILY_MAP;
    const parsed: Record<string, string> = {};
    for (const [label, num] of Object.entries(raw)) {
      const field = match(label, map);
      if (field) parsed[field] = fmtNum(num);
    }

    return NextResponse.json(parsed);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Parse failed" },
      { status: 500 }
    );
  }
}
