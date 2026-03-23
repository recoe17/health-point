import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

const COL_I = 8;

/** Line-item labels under each bank section (not section headers). When we see "Total", use col I as that section's total. */
const SECTION_LINE_LABELS = new Set([
  "total", "subtotal", "grand total", "",
  "b/bfwd", "receipts", "transfer", "payments",
  "security deposit and prepayments", "security deposit", "prepayments",
]);

/** First non-empty string from row columns 0..3 (A–D) */
function getRowLabel(row: unknown[]): string {
  for (let c = 0; c <= 3; c++) {
    const v = row[c];
    const s = String(v ?? "").trim();
    if (s) return s;
  }
  return "";
}

/** True if this row is a "Total" row (label in A–D is "Total" or "Total:") */
function isTotalRow(row: unknown[]): boolean {
  const label = getRowLabel(row).toLowerCase();
  return label === "total" || label.startsWith("total:");
}

function extractBankBreakdownBySections(
  cashRows: unknown[][],
  parseNum: (v: unknown) => number,
  fmt: (n: number) => string
): { cashUsdBanks: { name: string; value: string }[]; cashZwgBanks: { name: string; value: string }[] } {
  const result = (start: number, end: number) => {
    const list: { name: string; value: string }[] = [];
    let currentSection = "";
    for (let r = start; r < Math.min(end, cashRows.length); r++) {
      const row = cashRows[r];
      if (!Array.isArray(row)) continue;
      const label = getRowLabel(row);
      const normalized = label.toLowerCase();
      const amount = parseNum(row[COL_I]);
      if (isTotalRow(row)) {
        if (currentSection) {
          list.push({ name: currentSection, value: fmt(amount) });
        }
        continue;
      }
      if (!label || SECTION_LINE_LABELS.has(normalized)) continue;
      currentSection = label;
    }
    return list;
  };
  return {
    cashUsdBanks: result(0, 67),
    cashZwgBanks: result(69, 107),
  };
}

function parseSheetDate(name: string): number | null {
  const monthMap: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };
  // Matches examples like: "13 Mar 26", "13-Mar-26", "13 Mar '26"
  const m = name.match(/(\d{1,2})[\s\-_/]+([A-Za-z]{3,9})[\s\-_/']+(\d{2,4})/);
  if (!m) return null;
  const day = Number(m[1]);
  const mon = monthMap[m[2].slice(0, 3).toLowerCase()];
  let year = Number(m[3]);
  if (Number.isNaN(day) || mon == null || Number.isNaN(year)) return null;
  if (year < 100) year += 2000;
  const t = new Date(year, mon, day).getTime();
  return Number.isNaN(t) ? null : t;
}

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
      const monthlyTxSheets = workbook.SheetNames.filter((name) =>
        name.toLowerCase().includes("monthly transactions")
      );
      if (monthlyTxSheets.length > 0) {
        monthlySheetName = monthlyTxSheets[0];
        let bestDate = -1;
        for (const name of monthlyTxSheets) {
          const t = parseSheetDate(name);
          if (t != null && t > bestDate) {
            bestDate = t;
            monthlySheetName = name;
          }
        }
      }
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

    // Monthly report: e.g. "HealthPoint Financial Statements - February 2026.xlsx"
    // Sheets: Financial Positions, CAPEX, Indirect Cashflow, YTD Summarised P&L
    if (reportType === "monthly") {
      const findSheet = (...names: string[]) =>
        workbook.SheetNames.find((n) => {
          const lower = n.toLowerCase();
          return names.some((name) => lower.includes(name.toLowerCase()));
        });
      const getCellFmt = (ws: XLSX.WorkSheet, ref: string) =>
        fmt(parseNum((ws[ref] as XLSX.CellObject | undefined)?.v ?? 0));
      const getCellLabel = (ws: XLSX.WorkSheet, ref: string): string =>
        String((ws[ref] as XLSX.CellObject | undefined)?.v ?? "").trim();

      const fpSheet = findSheet("Financial Positions", "Financial Position");
      const capexSheet = findSheet("CAPEX");
      const cashflowSheet = findSheet("Indirect Cashflow");
      const ytdSheet = findSheet("YTD Summarised P&L", "YTD");

      const monthlyParsed: Record<string, unknown> = {};
      if (fpSheet) {
        const ws = workbook.Sheets[fpSheet] as XLSX.WorkSheet;
        monthlyParsed.debtors = getCellFmt(ws, "D18");
        monthlyParsed.creditors = getCellFmt(ws, "D41");
        monthlyParsed.inventory = getCellFmt(ws, "D17");
      }
      if (capexSheet) {
        const ws = workbook.Sheets[capexSheet] as XLSX.WorkSheet;
        monthlyParsed.capex = getCellFmt(ws, "C225");
        const capexItems: { label: string; value: string }[] = [];
        for (let r = 229; r <= 233; r++) {
          const label = getCellLabel(ws, `B${r}`);
          const val = getCellFmt(ws, `C${r}`);
          capexItems.push({ label: label || `Row ${r}`, value: val });
        }
        monthlyParsed.capexItems = capexItems;
      }
      if (cashflowSheet) {
        const ws = workbook.Sheets[cashflowSheet] as XLSX.WorkSheet;
        monthlyParsed["loan-movement"] = getCellFmt(ws, "F49");
        const loanMovementItems: { label: string; value: string }[] = [];
        for (let r = 39; r <= 47; r++) {
          const label = getCellLabel(ws, `B${r}`);
          const val = getCellFmt(ws, `F${r}`);
          loanMovementItems.push({ label: label || `Row ${r}`, value: val });
        }
        monthlyParsed.loanMovementItems = loanMovementItems;
      }
      if (ytdSheet) {
        const ws = workbook.Sheets[ytdSheet] as XLSX.WorkSheet;
        const revenue = getCellFmt(ws, "P8");
        const grossProfit = getCellFmt(ws, "P23");
        const operationalProfit = getCellFmt(ws, "P41");
        const profitBeforeTax = getCellFmt(ws, "P48");
        const netProfit = getCellFmt(ws, "P52");
        monthlyParsed["income-statement"] = netProfit;
        monthlyParsed.incomeStatementItems = [
          { label: "Revenue", value: revenue },
          { label: "Gross Profit", value: grossProfit },
          { label: "Operational Profit", value: operationalProfit },
          { label: "Profit Before Tax", value: profitBeforeTax },
          { label: "Net Profit", value: netProfit },
        ];
      }
      if (Object.keys(monthlyParsed).length > 0) {
        return NextResponse.json(monthlyParsed);
      }
    }

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

    // Turnover by Medical Funder.xlsx
    const isTurnoverByMedicalFunderFile =
      reportType === "daily" && file.name.toLowerCase().includes("turnover by medical funder");
    if (isTurnoverByMedicalFunderFile) {
      const ws = sheet as XLSX.WorkSheet;
      const read = (ref: string) => parseNum((ws[ref] as XLSX.CellObject | undefined)?.v ?? 0);
      const percentage = (n: number) => (n <= 1 ? `${(n * 100).toFixed(2)}%` : `${n.toFixed(2)}%`);
      const patients = Math.round(read("D37"));
      const rowsOut: { label: string; turnover: string; percentage: string; patients: string }[] = [];
      for (let r = 13; r <= 35; r++) {
        const label = String((ws[`A${r}`] as XLSX.CellObject | undefined)?.v ?? "").trim() || `Row ${r}`;
        rowsOut.push({
          label,
          turnover: fmt(read(`B${r}`)),
          percentage: percentage(read(`C${r}`)),
          patients: String(Math.round(read(`D${r}`))),
        });
      }
      return NextResponse.json({
        "turnover-medical-funder": `${fmt(read("B37"))} | ${patients.toLocaleString()} patients`,
        turnoverMedicalFunderPatients: String(patients),
        turnoverMedicalFunderRows: rowsOut,
      });
    }

    // Daily Revenue.xlsx: Revenue = K23, COGS = Total row E+G, chart = location vs K, + number admissions, theater cases, theater minutes
    const isDailyRevenueCogsFile =
      reportType === "daily" && file.name.toLowerCase().includes("revenue");
    if (isDailyRevenueCogsFile) {
      const colK = 10;
      const colA = 0;
      const colB = 1;
      const fmtCount = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2));

      let revenue = 0;
      let revenueSheet: XLSX.WorkSheet = sheet as XLSX.WorkSheet;
      for (const sheetName of workbook.SheetNames) {
        const ws = workbook.Sheets[sheetName] as XLSX.WorkSheet;
        const cell = ws["K23"] as XLSX.CellObject | undefined;
        const v = cell != null ? parseNum(cell.v) : 0;
        if (v !== 0) {
          revenue = v;
          revenueSheet = ws;
          break;
        }
        const sheetRows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 }) as unknown[][];
        if (sheetRows.length >= 23) {
          const row23 = sheetRows[22];
          const fromRow = Array.isArray(row23) ? parseNum(row23[colK]) : 0;
          if (fromRow !== 0) {
            revenue = fromRow;
            revenueSheet = ws;
            break;
          }
        }
      }

      const rowArray = rows as unknown[][];
      const totalRowIndex = rowArray.findIndex((r) => {
        for (let c = 0; c <= 4; c++) {
          const label = String(r[c] ?? "").trim().toLowerCase();
          if (label === "total" || label.startsWith("total:") || label.startsWith("total ")) return true;
        }
        return false;
      });
      let cogs = 0;
      if (totalRowIndex >= 0) {
        const excelRow = totalRowIndex + 1;
        const eCell = (sheet as XLSX.WorkSheet)[`E${excelRow}`] as XLSX.CellObject | undefined;
        const gCell = (sheet as XLSX.WorkSheet)[`G${excelRow}`] as XLSX.CellObject | undefined;
        cogs = (eCell != null ? parseNum(eCell.v) : parseNum(rowArray[totalRowIndex]?.[4]))
          + (gCell != null ? parseNum(gCell.v) : parseNum(rowArray[totalRowIndex]?.[6]));
      }

      const chartRows = XLSX.utils.sheet_to_json<unknown[]>(revenueSheet, { header: 1 }) as unknown[][];
      const revenueByLocation: { name: string; value: number }[] = [];
      for (let r = 10; r <= 19; r++) {
        const row = chartRows[r];
        if (!Array.isArray(row)) {
          revenueByLocation.push({ name: `Row ${r + 1}`, value: 0 });
          continue;
        }
        const name = String(row[colA] ?? row[colB] ?? "").trim();
        const value = parseNum(row[colK]);
        revenueByLocation.push({ name: name || `Row ${r + 1}`, value });
      }

      const readCell = (ws: XLSX.WorkSheet, cellRef: string): number => {
        const cell = ws[cellRef] as XLSX.CellObject | undefined;
        if (cell != null) return parseNum(cell.v);
        const sheetRows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 }) as unknown[][];
        const row23 = sheetRows[22];
        if (!Array.isArray(row23)) return 0;
        const colIndex = cellRef.charCodeAt(0) - 65;
        return parseNum(row23[colIndex]);
      };
      const numberAdmissions = readCell(revenueSheet as XLSX.WorkSheet, "L23");
      const theaterCases = readCell(revenueSheet as XLSX.WorkSheet, "N23");
      const theaterMinutes = readCell(revenueSheet as XLSX.WorkSheet, "O23");

      const revenueCategoryItems = [
        { label: "Ward Fees", value: fmt(readCell(revenueSheet as XLSX.WorkSheet, "B20")) },
        { label: "Theatre Fees", value: fmt(readCell(revenueSheet as XLSX.WorkSheet, "C20")) },
        { label: "Ethicals", value: fmt(readCell(revenueSheet as XLSX.WorkSheet, "D20")) },
        { label: "Surgicals", value: fmt(readCell(revenueSheet as XLSX.WorkSheet, "F20")) },
        { label: "Equipment", value: fmt(readCell(revenueSheet as XLSX.WorkSheet, "H20")) },
        { label: "Other", value: fmt(readCell(revenueSheet as XLSX.WorkSheet, "I20")) },
      ];

      const numberAdmissionsItems: { label: string; value: string }[] = [];
      const theaterCasesItems: { label: string; value: string }[] = [];
      const theaterMinutesItems: { label: string; value: string }[] = [];
      for (let r = 11; r <= 18; r++) {
        const labelCell = (revenueSheet as XLSX.WorkSheet)[`A${r}`] as XLSX.CellObject | undefined;
        const label = String(labelCell?.v ?? "").trim() || `Row ${r}`;
        numberAdmissionsItems.push({
          label,
          value: fmtCount(readCell(revenueSheet as XLSX.WorkSheet, `K${r}`)),
        });
        theaterCasesItems.push({
          label,
          value: fmtCount(readCell(revenueSheet as XLSX.WorkSheet, `L${r}`)),
        });
        theaterMinutesItems.push({
          label,
          value: fmtCount(readCell(revenueSheet as XLSX.WorkSheet, `M${r}`)),
        });
      }

      return NextResponse.json({
        revenue: fmt(revenue),
        cogs: fmt(cogs),
        revenueByLocation,
        revenueCategoryItems,
        numberAdmissions: String(numberAdmissions),
        theaterCases: String(theaterCases),
        theaterMinutes: String(theaterMinutes),
        numberAdmissionsItems,
        theaterCasesItems,
        theaterMinutesItems,
      });
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
        const { cashUsdBanks, cashZwgBanks } = extractBankBreakdownBySections(cashRows, parseNum, fmt);

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
      const { cashUsdBanks, cashZwgBanks } = extractBankBreakdownBySections(cashRows, parseNum, fmtNum);
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
