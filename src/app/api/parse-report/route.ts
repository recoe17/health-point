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

    // For daily reports, choose the sheet that actually holds the cash totals (I68 / I108).
    // 1) Prefer a sheet whose name contains "monthly transactions"
    // 2) Otherwise, scan all sheets and pick the first one where I68 or I108 has a value
    let cashSheet: XLSX.WorkSheet = sheet;
    if (reportType === "daily") {
      const monthlySheetName = workbook.SheetNames.find((name) =>
        name.toLowerCase().includes("monthly transactions")
      );
      if (monthlySheetName) {
        cashSheet = workbook.Sheets[monthlySheetName];
      } else {
        for (const name of workbook.SheetNames) {
          const ws = workbook.Sheets[name] as XLSX.WorkSheet;
          const usdCell = ws["I68"] as XLSX.CellObject | undefined;
          const zwgCell = ws["I108"] as XLSX.CellObject | undefined;
          if (
            (usdCell && usdCell.v !== undefined && usdCell.v !== "") ||
            (zwgCell && zwgCell.v !== undefined && zwgCell.v !== "")
          ) {
            cashSheet = ws;
            break;
          }
        }
      }
    }

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

        return NextResponse.json({
          "cash-usd": fmt(cashUsd),
          "cash-zwg": fmt(cashZwg),
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

    // For daily reports, always read Cash USD (I68) and Cash ZWG (I108) from the cash sheet
    if (reportType === "daily") {
      const usdCell = (cashSheet as XLSX.WorkSheet)["I68"] as XLSX.CellObject | undefined;
      const zwgCell = (cashSheet as XLSX.WorkSheet)["I108"] as XLSX.CellObject | undefined;
      if (usdCell != null && (usdCell.v !== undefined && usdCell.v !== "")) {
        parsed["cash-usd"] = fmtNum(parseNum(usdCell.v));
      }
      if (zwgCell != null && (zwgCell.v !== undefined && zwgCell.v !== "")) {
        parsed["cash-zwg"] = fmtNum(parseNum(zwgCell.v));
      }
    }

    return NextResponse.json(parsed);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Parse failed" },
      { status: 500 }
    );
  }
}
