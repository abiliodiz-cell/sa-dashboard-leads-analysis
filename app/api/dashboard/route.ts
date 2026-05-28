import { NextResponse } from "next/server";
import { getAllLeads, getAdInsights } from "@/lib/meta";
import { getDeals, getDealActivities, getStages } from "@/lib/pipedrive";
import { getCallLogs, buildPhoneLookup } from "@/lib/justcall";
import { fuseData } from "@/lib/fusion";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Parallel fetch — Meta, Pipedrive, JustCall ao mesmo tempo
    const [metaLeads, adInsights, deals, stagesMap, justcallLogs] = await Promise.all([
      getAllLeads(since),
      getAdInsights(days),
      getDeals(since),
      getStages(),
      getCallLogs(since),
    ]);

    // Activities por deal
    const activitiesByDeal: Record<number, any[]> = {};
    await Promise.all(
      deals.map(async (deal) => {
        activitiesByDeal[deal.id] = await getDealActivities(deal.id);
      })
    );

    // Build JustCall phone lookup
    const justcallPhoneMap = buildPhoneLookup(justcallLogs);

    const stats = fuseData(
      metaLeads,
      deals,
      activitiesByDeal,
      adInsights,
      stagesMap,
      justcallLogs,
      justcallPhoneMap
    );

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
