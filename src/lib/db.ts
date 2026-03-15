import { neon } from "@neondatabase/serverless";

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return neon(url);
}

export type ReportType = "monthly" | "daily";

type SqlClient = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<unknown[]>;

export async function initSchema(sql: SqlClient) {
  await sql`
    CREATE TABLE IF NOT EXISTS report_data (
      id SERIAL PRIMARY KEY,
      report_type TEXT NOT NULL UNIQUE,
      data TEXT NOT NULL DEFAULT '{}',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    INSERT INTO report_data (report_type, data)
    VALUES ('monthly', '{}'), ('daily', '{}')
    ON CONFLICT (report_type) DO NOTHING
  `;
}

export async function getReportData(type: ReportType): Promise<Record<string, unknown>> {
  const sql = getSql();
  const rows = await sql`
    SELECT data FROM report_data WHERE report_type = ${type} LIMIT 1
  `;
  if (rows.length === 0) return {};
  const row = rows[0] as { data: string | null };
  if (!row?.data) return {};
  try {
    return JSON.parse(row.data) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function setReportData(type: ReportType, data: Record<string, unknown>): Promise<void> {
  const sql = getSql();
  const dataStr = JSON.stringify(data);
  await sql`
    INSERT INTO report_data (report_type, data, updated_at)
    VALUES (${type}, ${dataStr}, NOW())
    ON CONFLICT (report_type) DO UPDATE SET
      data = EXCLUDED.data,
      updated_at = NOW()
  `;
}
