import { NextRequest, NextResponse } from "next/server";
import { getReportData, setReportData, initSchema } from "@/lib/db";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const type = request.nextUrl.searchParams.get("type");
    if (type !== "monthly" && type !== "daily") {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
    const data = await getReportData(type);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof Error && err.message.includes("DATABASE_URL")) {
      return NextResponse.json({}, { status: 200 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body as { type?: string; data?: Record<string, string> };
    if (type !== "monthly" && type !== "daily" || !data || typeof data !== "object") {
      return NextResponse.json({ error: "Invalid type or data" }, { status: 400 });
    }
    await setReportData(type, data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message.includes("DATABASE_URL")) {
      return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 503 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const url = process.env.DATABASE_URL;
    if (!url) return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 503 });
    const sql = neon(url);
    await initSchema(sql);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to init schema" },
      { status: 500 }
    );
  }
}
