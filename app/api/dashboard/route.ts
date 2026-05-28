import { NextResponse } from "next/server";
import { getSheetLeads } from "@/lib/sheets";
import { fuseFromSheet } from "@/lib/fusion";
import { getPipedriveEnrichments } from "@/lib/pipedrive";
import { getJustCallEnrichments } from "@/lib/justcall";

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

    const leadRefs = leads.map(l => ({
      email:        l.email,
      phone:        l.phone,
      created_time: l.created_time,
    }));

    // Enrich from Pipedrive and JustCall in parallel - both fail gracefully
    const [enrichments, jcEnrichments] = await Promise.all([
      getPipedriveEnrichments(leadRefs).catch(err => {
        console.warn("Pipedrive enrichment failed (non-fatal):", err?.message);
        return undefined;
      }),
      getJustCallEnrichments(leadRefs).catch(err => {
        console.warn("JustCall enrichment failed (non-fatal):", err?.message);
        return undefined;
      }),
    ]);

    const stats = fuseFromSheet(leads, enrichments, jcEnrichments);
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
