import { NextResponse } from "next/server";
import { getSheetLeads } from "@/lib/sheets";
import { fuseFromSheet } from "@/lib/fusion";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const leads = await getSheetLeads(since);
    const stats = fuseFromSheet(leads);

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
