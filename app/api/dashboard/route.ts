import { NextResponse } from "next/server";
import { getSheetLeads } from "@/lib/sheets";
import { fuseFromSheet } from "@/lib/fusion";
import { getPipedriveEnrichments } from "@/lib/pipedrive";
import { getJustCallEnrichments } from "@/lib/justcall";
import { getMetaInsights, buildMetaLookup, buildCampaignSpendMap } from "@/lib/meta";

export const dynamic    = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60;

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

    // Fetch all sources in parallel - each fails gracefully
    const [enrichments, jcEnrichments, metaInsights] = await Promise.all([
      getPipedriveEnrichments(leadRefs).catch(err => {
        console.warn("Pipedrive enrichment failed (non-fatal):", err?.message);
        return undefined;
      }),
      getJustCallEnrichments(leadRefs).catch(err => {
        console.warn("JustCall enrichment failed (non-fatal):", err?.message);
        return undefined;
      }),
      getMetaInsights().catch(err => {
        console.warn("Meta insights failed (non-fatal):", err?.message);
        return [];
      }),
    ]);

    const metaByAd       = buildMetaLookup(metaInsights);
    const metaByCampaign = buildCampaignSpendMap(metaInsights);

    const stats = fuseFromSheet(leads, enrichments, jcEnrichments, metaByAd, metaByCampaign);
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
