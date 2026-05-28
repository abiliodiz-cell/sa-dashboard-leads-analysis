import { NextResponse } from "next/server";
import { getSheetLeads } from "@/lib/sheets";
import { fuseFromSheet } from "@/lib/fusion";
import { getPipedriveEnrichments } from "@/lib/pipedrive";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days  = parseInt(searchParams.get("days") || "9999");
    const since = days >= 9999
      ? undefined
      : new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const leads = await getSheetLeads(since);

    // Enrich with Pipedrive data - fail gracefully if unavailable
    let enrichments;
    try {
      enrichments = await getPipedriveEnrichments(
        leads.map(l => ({ email: l.email, phone: l.phone, created_time: l.created_time }))
      );
    } catch (pdErr) {
      console.warn("Pipedrive enrichment failed (non-fatal):", pdErr);
    }

    const stats = fuseFromSheet(leads, enrichments);
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
