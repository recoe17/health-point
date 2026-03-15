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

    // For daily reports, choose the sheet that holds the real cash totals (I68 / I108).
    // 1) Prefer a sheet whose name contains "monthly transactions"
    // 2) Otherwise, use the sheet where I68 is LARGEST (main totals sheet has ~122K; summary sheets have smaller values)
    let cashSheet: XLSX.WorkSheet = sheet;
    let monthlySheetName: string | undefined;
    if (reportType === "daily") {
      monthlySheetName = workbook.SheetNames.find((name) =>
        name.toLowerCase().includes("monthly transactions")
      );
      if (monthlySheetName) {
        cashSheet = workbook.Sheets[monthlySheetName];
      }
    }

    // For monthly we require content; for daily we accept any file and read I68/I108
    if (!rows.length && reportType === "monthly") {
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

    // If we didn't find "Monthly Transactions" by name, pick the sheet where I68 is LARGEST
    // (main totals sheet has ~122K USD; other sheets have smaller values like 100K)
    if (reportType === "daily" && !monthlySheetName) {
      let bestI68 = -1;
      for (const name of workbook.SheetNames) {
        const ws = workbook.Sheets[name] as XLSX.WorkSheet;
        const usdCell = ws["I68"] as XLSX.CellObject | undefined;
        const v = usdCell?.v != null ? parseNum(usdCell.v) : -1;
        if (v > bestI68) {
          bestI68 = v;
          cashSheet = ws;
        }
      }
    }

    // HealthPoint Daily Revenue format (RptManagementRevenueAll)
    const isHealthPointDaily =
      reportType === "daily" &&
      rows.some(
        (r) =>
          String((r as unknown[])[0] ?? "")
            .toLowerCase()
            .includes("rptmanagement") ||
          String((r as unknown[])[1] ?? "")
            .toLowerCase()
            .includes("revenue per location")
      );
    if (isHealthPointDaily) {
      const totalRow = rows.find(
        (r) =>
          String((r as unknown[])[0] ?? "").trim().toLowerCase() === "total:"
      ) as unknown[] | undefined;
      if (totalRow && totalRow.length >= 10) {
        const revenue = parseNum(totalRow[9]);
        const cogs = parseNum(totalRow[4]) + parseNum(totalRow[6]);

        // Cash totals from combined USD / ZWG tables
        const usdCell = (cashSheet as XLSX.WorkSheet)["I68"] as
          | XLSX.CellObject
          | undefined;
        const zwgCell = (cashSheet as XLSX.WorkSheet)["I108"] as
          | XLSX.CellObject
          | undefined;
        const cashUsd = usdCell ? parseNum(usdCell.v) : 0;
        const cashZwg = zwgCell ? parseNum(zwgCell.v) : 0;

        const cashRows = XLSX.utils.sheet_to_json<unknown[]>(cashSheet as XLSX.WorkSheet, { header: 1 }) as unknown[][];
        const colI = 8;
        const colA = 0;
        const colB = 1;
        const skipLabels = new Set(["total", "subtotal", "grand total", ""]);
        const toBankRow = (row: unknown[]): { name: string; value: string } | null => {
          const amount = parseNum(row[colI]);
          if (amount === 0) return null;
          const label = String(row[colA] ?? row[colB] ?? "").trim();
          if (!label || skipLabels.has(label.toLowerCase())) return null;
          return { name: label, value: fmt(amount) };
        };
        const cashUsdBanks: { name: string; value: string }[] = [];
        for (let r = 0; r < Math.min(67, cashRows.length); r++) {
          const row = cashRows[r];
          if (!Array.isArray(row)) continue;
          const bank = toBankRow(row);
          if (bank) cashUsdBanks.push(bank);
        }
        const cashZwgBanks: { name: string; value: string }[] = [];
        for (let r = 69; r < Math.min(107, cashRows.length); r++) {
          const row = cashRows[r];
          if (!Array.isArray(row)) continue;
          const bank = toBankRow(row);
          if (bank) cashZwgBanks.push(bank);
        }

        return NextResponse.json({
          "cash-usd": fmt(cashUsd),
          "cash-zwg": fmt(cashZwg),
          revenue: fmt(revenue),
          cogs: fmt(cogs),
          cashUsdBanks,
          cashZwgBanks,
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
      "cash usd": "cash-usd",
      "cash (usd)": "cash-usd",
      "cash zwg": "cash-zwg",
      "cash (zwg)": "cash-zwg",
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

    const raw: Record<string, number> = {};
    if (rows.length >= 1) {
      const firstRow = rows[0] as unknown[];
      const secondNum = parseNumNullable(firstRow?.[1]);
      const isKeyValue =
        Array.isArray(firstRow) &&
        firstRow.length >= 2 &&
        typeof firstRow[0] === "string" &&
        secondNum !== null;

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
    }

    const map = reportType === "monthly" ? MONTHLY_MAP : DAILY_MAP;
    const parsed: Record<string, string> = {};
    for (const [label, num] of Object.entries(raw)) {
      const field = match(label, map);
      if (field) parsed[field] = fmtNum(num);
    }

    // For daily: set Cash USD/ZWG and extract bank breakdown from the cash sheet
    if (reportType === "daily") {
      const usdCell = (cashSheet as XLSX.WorkSheet)["I68"] as XLSX.CellObject | undefined;
      const zwgCell = (cashSheet as XLSX.WorkSheet)["I108"] as XLSX.CellObject | undefined;
      parsed["cash-usd"] = fmtNum(parseNum(usdCell?.v ?? 0));
      parsed["cash-zwg"] = fmtNum(parseNum(zwgCell?.v ?? 0));

      const cashRows = XLSX.utils.sheet_to_json<unknown[]>(cashSheet as XLSX.WorkSheet, { header: 1 }) as unknown[][];
      const colI = 8;
      const colA = 0;
      const colB = 1;
      const skipLabels = new Set(["total", "subtotal", "grand total", ""]);
      const toBankRow = (row: unknown[], rowIndex: number): { name: string; value: string } | null => {
        const amount = parseNum(row[colI]);
        if (amount === 0) return null;
        const label = String(row[colA] ?? row[colB] ?? "").trim();
        if (!label || skipLabels.has(label.toLowerCase())) return null;
        return { name: label, value: fmtNum(amount) };
      };
      const cashUsdBanks: { name: string; value: string }[] = [];
      for (let r = 0; r < Math.min(67, cashRows.length); r++) {
        const row = cashRows[r];
        if (!Array.isArray(row)) continue;
        const bank = toBankRow(row, r);
        if (bank) cashUsdBanks.push(bank);
      }
      const cashZwgBanks: { name: string; value: string }[] = [];
      for (let r = 69; r < Math.min(107, cashRows.length); r++) {
        const row = cashRows[r];
        if (!Array.isArray(row)) continue;
        const bank = toBankRow(row, r);
        if (bank) cashZwgBanks.push(bank);
      }
      (parsed as Record<string, unknown>)["cashUsdBanks"] = cashUsdBanks;
      (parsed as Record<string, unknown>)["cashZwgBanks"] = cashZwgBanks;
    }

    return NextResponse.json(parsed);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Parse failed" },
      { status: 500 }
    );
  }
}
