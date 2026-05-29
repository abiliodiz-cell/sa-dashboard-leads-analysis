import { SheetLead } from "./sheets";
import { PipedriveEnrichment } from "./pipedrive";
import { JCEnrichment } from "./justcall";
import { MetaAdInsight } from "./meta";

export interface EnrichedLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  job_title: string;
  organization_name: string;
  linkedin_url: string;      // search URL constructed from name + org
  ad_id: string;
  ad_name: string;
  adset_name: string;
  campaign_name: string;
  form_name: string;
  form_answers: Record<string, string>;
  submitted_at: string;
  submitted_hour: number;
  submitted_weekday: string;
  submitted_weekday_num: number; // 0=Sun
  region: string;
  country: string;
  platform: string;
  owner: string;
  deal_stage: string;
  deal_status: string;
  deal_value: number;
  was_called: boolean;
  call_answered: boolean;
  first_call_time: string | null;
  first_contact_time: string | null;
  minutes_to_first_call?: number;
  lead_cost: number;
}

export interface DashboardStats {
  leads: EnrichedLead[];
  totalLeads: number;
  openLeads: number;
  contactRate: number;
  conversionRate: number;
  pctCalled: number;
  callAnswerRate: number;
  avgMinutesToFirstCall: number | null;
  byHour: { hour: number; count: number }[];
  byWeekday: { day: string; count: number }[];
  byAd: { ad_name: string; campaign_name: string; leads: number; spend: number; cpl: number; contact_rate: number; impressions: number; clicks: number }[];
  byCampaign: { campaign: string; leads: number; spend: number; cpl: number }[];
  byOwner: { owner: string; leads: number; called: number; answered: number; converted: number; avg_duration: number }[];
  byRegion: { region: string; count: number }[];
  byPlatform: { platform: string; count: number }[];
  byStatus: { status: string; count: number }[];
  byDate: { date: string; count: number }[];
  heatmap: { weekday: number; hour: number; count: number }[];
  responseTimeByCountry: { country: string; avgMinutes: number; count: number }[];
  cplByCountry: { country: string; avgCPL: number; count: number }[];
  cplVsResponseTime: { country: string; avgCPL: number; avgMinutes: number; leads: number }[];
  formAnswersSummary: Record<string, Record<string, number>>;
  timeToContactDistribution: { bucket: string; count: number }[];
  callDispositions: { disposition: string; count: number }[];
  callsByHour: { hour: number; total: number; answered: number }[];
  totalSpend: number;
  avgCPL: number;
  callAnsweredRate: number;
  adInsights: never[];
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const WON_STATUSES  = new Set(["won", "closed won", "converted", "ganho", "fechado"]);
const OPEN_STATUSES = new Set(["open", "new", "novo", "aberto", "new lead", ""]);

function isWon(s: string)  { return WON_STATUSES.has(s.toLowerCase()); }
function isOpen(s: string) { return OPEN_STATUSES.has(s.toLowerCase()); }

export function fuseFromSheet(
  leads: SheetLead[],
  enrichments?: Map<string, PipedriveEnrichment>,
  jcEnrichments?: Map<string, JCEnrichment>,
  metaByAd?: Map<string, MetaAdInsight>,
  metaByCampaign?: Map<string, number>
): DashboardStats {
  // Build campaign leads count for campaign-level CPL fallback
  const campLeadCount: Record<string, number> = {};
  leads.forEach(l => { const k = l.campaign_name || ""; campLeadCount[k] = (campLeadCount[k] || 0) + 1; });

  const enriched: EnrichedLead[] = leads.map((l) => {
    const dt = l.created_time ? new Date(l.created_time) : new Date();
    const ek = l.email.toLowerCase().trim();
    const pk = l.phone.replace(/\D/g, "").slice(-9);
    const pd = enrichments?.get(ek);
    const jc = (ek ? jcEnrichments?.get(ek) : undefined)
             || (pk ? jcEnrichments?.get(pk) : undefined);

    // Lead cost: try ad-level first, then campaign-level fallback
    const metaAd = l.ad_id ? metaByAd?.get(l.ad_id) : undefined;
    let leadCost = 0;
    if (metaAd && metaAd.meta_leads > 0) {
      leadCost = Math.round((metaAd.spend / metaAd.meta_leads) * 100) / 100;
    } else if (metaAd && metaAd.spend > 0) {
      // Ad spend known but no Meta lead count - use sheet leads for this ad
      leadCost = Math.round((metaAd.spend / 1) * 100) / 100; // will be divided later
    } else if (l.campaign_name && metaByCampaign) {
      // Campaign-level fallback
      const campSpend = metaByCampaign.get(l.campaign_name) || 0;
      const campLeads = campLeadCount[l.campaign_name] || 1;
      if (campSpend > 0) leadCost = Math.round((campSpend / campLeads) * 100) / 100;
    }

    // LinkedIn search URL from name + company
    const liQuery  = [l.full_name, l.organization_name].filter(Boolean).join(" ");
    const liUrl    = liQuery ? `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(liQuery)}` : "";

    return {
      id:                    l.id,
      name:                  l.full_name,
      email:                 l.email,
      phone:                 l.phone,
      job_title:             l.job_title             || "",
      organization_name:     l.organization_name     || "",
      linkedin_url:          liUrl,
      ad_id:                 l.ad_id,
      ad_name:               l.ad_name,
      adset_name:            l.adset_name,
      campaign_name:         l.campaign_name,
      form_name:             l.form_name,
      form_answers:          l.answers,
      submitted_at:          l.created_time,
      submitted_hour:        dt.getHours(),
      submitted_weekday:     WEEKDAYS[dt.getDay()],
      submitted_weekday_num: dt.getDay(),
      region:                l.country || "Unknown",
      country:               l.country || "Unknown",
      platform:              l.platform || "Unknown",
      owner:                 pd?.ownerName || l.owner || "Unassigned",
      deal_stage:            pd?.dealStage  || l.status || "",
      deal_status:           pd?.dealStatus || l.status || "",
      deal_value:            pd?.dealValue  || 0,
      was_called:            jc?.wasCalled          ?? false,
      call_answered:         jc?.callAnswered       ?? false,
      first_call_time:       jc?.firstCallTime      ?? null,
      first_contact_time:    jc?.firstContactTime   ?? null,
      minutes_to_first_call: jc?.minutesToFirstCall ?? undefined,
      lead_cost:             leadCost,
    };
  });

  const totalLeads = enriched.length;
  const openLeads  = enriched.filter(l => isOpen(l.deal_status)).length;
  const contacted  = enriched.filter(l => !isOpen(l.deal_status)).length;
  const won        = enriched.filter(l => isWon(l.deal_status)).length;
  const called     = enriched.filter(l => l.was_called).length;
  const answered   = enriched.filter(l => l.call_answered).length;

  const withCallTime = enriched.filter(l => l.minutes_to_first_call != null && l.minutes_to_first_call > 0);
  const avgMinutesToFirstCall = withCallTime.length
    ? Math.round(withCallTime.reduce((s, l) => s + (l.minutes_to_first_call || 0), 0) / withCallTime.length)
    : null;

  // Heatmap
  const heatGrid: Record<string, number> = {};
  enriched.forEach(l => {
    const key = `${l.submitted_weekday_num}_${l.submitted_hour}`;
    heatGrid[key] = (heatGrid[key] || 0) + 1;
  });
  const heatmap: { weekday: number; hour: number; count: number }[] = [];
  for (let w = 0; w < 7; w++) for (let h = 0; h < 24; h++) {
    heatmap.push({ weekday: w, hour: h, count: heatGrid[`${w}_${h}`] || 0 });
  }

  // Response time by country
  const ctryRt: Record<string, { sum: number; count: number }> = {};
  withCallTime.forEach(l => {
    const c = l.country || "Unknown";
    if (!ctryRt[c]) ctryRt[c] = { sum: 0, count: 0 };
    ctryRt[c].sum   += l.minutes_to_first_call || 0;
    ctryRt[c].count += 1;
  });
  const responseTimeByCountry = Object.entries(ctryRt)
    .map(([country, v]) => ({ country, avgMinutes: Math.round(v.sum / v.count), count: v.count }))
    .sort((a, b) => a.avgMinutes - b.avgMinutes)
    .slice(0, 10);

  const hourMap: Record<number, number> = {};
  enriched.forEach(l => { hourMap[l.submitted_hour] = (hourMap[l.submitted_hour] || 0) + 1; });
  const byHour = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: hourMap[h] || 0 }));

  const dayMap: Record<string, number> = {};
  enriched.forEach(l => { dayMap[l.submitted_weekday] = (dayMap[l.submitted_weekday] || 0) + 1; });
  const byWeekday = WEEKDAYS.map(d => ({ day: d, count: dayMap[d] || 0 }));

  const dateMap: Record<string, number> = {};
  enriched.forEach(l => { const d = l.submitted_at?.slice(0, 10); if (d) dateMap[d] = (dateMap[d] || 0) + 1; });
  const byDate = Object.entries(dateMap).sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count }));

  // By Ad - enrich with Meta spend
  const adMap: Record<string, { leads: number; contacted: number; campaign_name: string; ad_id: string }> = {};
  enriched.forEach(l => {
    const key = l.ad_name || "Unknown Ad";
    if (!adMap[key]) adMap[key] = { leads: 0, contacted: 0, campaign_name: l.campaign_name || "", ad_id: l.ad_id || "" };
    adMap[key].leads++;
    if (!isOpen(l.deal_status)) adMap[key].contacted++;
  });
  const byAd = Object.entries(adMap).map(([ad_name, v]) => {
    const meta       = v.ad_id ? metaByAd?.get(v.ad_id) : undefined;
    const spend      = meta?.spend      ?? 0;
    const impressions= meta?.impressions ?? 0;
    const clicks     = meta?.clicks      ?? 0;
    const cpl        = spend > 0 && v.leads > 0 ? Math.round((spend / v.leads) * 100) / 100 : 0;
    return {
      ad_name, campaign_name: v.campaign_name,
      leads: v.leads, spend, cpl, impressions, clicks,
      contact_rate: v.leads ? Math.round((v.contacted / v.leads) * 100) : 0,
    };
  }).sort((a, b) => b.leads - a.leads);

  // By Campaign - enrich with Meta spend
  const campMap: Record<string, number> = {};
  enriched.forEach(l => { const k = l.campaign_name || "Unknown"; campMap[k] = (campMap[k] || 0) + 1; });
  const byCampaign = Object.entries(campMap).map(([campaign, leads]) => {
    const spend = metaByCampaign?.get(campaign) ?? 0;
    const cpl   = spend > 0 && leads > 0 ? Math.round((spend / leads) * 100) / 100 : 0;
    return { campaign, leads, spend, cpl };
  }).sort((a, b) => b.leads - a.leads);

  // Total spend
  const totalSpend = byCampaign.reduce((s, c) => s + c.spend, 0);
  const avgCPL     = totalSpend > 0 && totalLeads > 0 ? Math.round((totalSpend / totalLeads) * 100) / 100 : 0;

  // By Owner
  const ownerMap: Record<string, { leads: number; called: number; answered: number; converted: number }> = {};
  enriched.forEach(l => {
    const k = l.owner || "Unassigned";
    if (!ownerMap[k]) ownerMap[k] = { leads: 0, called: 0, answered: 0, converted: 0 };
    ownerMap[k].leads++;
    if (l.was_called)          ownerMap[k].called++;
    if (l.call_answered)       ownerMap[k].answered++;
    if (isWon(l.deal_status))  ownerMap[k].converted++;
  });
  const byOwner = Object.entries(ownerMap)
    .map(([owner, v]) => ({ owner, ...v, avg_duration: 0 }))
    .sort((a, b) => b.leads - a.leads);

  const regionMap: Record<string, number> = {};
  enriched.forEach(l => { regionMap[l.region] = (regionMap[l.region] || 0) + 1; });
  const byRegion = Object.entries(regionMap).map(([region, count]) => ({ region, count })).sort((a, b) => b.count - a.count);

  const platMap: Record<string, number> = {};
  enriched.forEach(l => { platMap[l.platform] = (platMap[l.platform] || 0) + 1; });
  const byPlatform = Object.entries(platMap).map(([platform, count]) => ({ platform, count })).sort((a, b) => b.count - a.count);

  const statusMap: Record<string, number> = {};
  enriched.forEach(l => { const k = l.deal_status || l.deal_stage || "Unknown"; statusMap[k] = (statusMap[k] || 0) + 1; });
  const byStatus = Object.entries(statusMap).map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count);

  const callHourMap: Record<number, { total: number; answered: number }> = {};
  enriched.forEach(l => {
    if (!l.first_call_time) return;
    const h = new Date(l.first_call_time).getHours();
    if (!callHourMap[h]) callHourMap[h] = { total: 0, answered: 0 };
    callHourMap[h].total++;
    if (l.call_answered) callHourMap[h].answered++;
  });
  const callsByHour = Array.from({ length: 24 }, (_, h) => ({
    hour: h, total: callHourMap[h]?.total || 0, answered: callHourMap[h]?.answered || 0,
  }));

  const formAnswersSummary: Record<string, Record<string, number>> = {};
  enriched.forEach(l => {
    Object.entries(l.form_answers).forEach(([q, a]) => {
      if (!formAnswersSummary[q]) formAnswersSummary[q] = {};
      formAnswersSummary[q][a] = (formAnswersSummary[q][a] || 0) + 1;
    });
  });

  // CPL by country (only for leads with a known cost)
  const cplCtry: Record<string, { sum: number; count: number }> = {};
  enriched.forEach(l => {
    if (l.lead_cost > 0) {
      const c = l.country || "Unknown";
      if (!cplCtry[c]) cplCtry[c] = { sum: 0, count: 0 };
      cplCtry[c].sum   += l.lead_cost;
      cplCtry[c].count += 1;
    }
  });
  const cplByCountry = Object.entries(cplCtry)
    .map(([country, v]) => ({ country, avgCPL: Math.round((v.sum / v.count) * 100) / 100, count: v.count }))
    .sort((a, b) => b.avgCPL - a.avgCPL);

  // CPL vs Response Time by country (for scatter analysis)
  const cplRtCtry: Record<string, { cplSum: number; cplCount: number; rtSum: number; rtCount: number }> = {};
  enriched.forEach(l => {
    const c = l.country || "Unknown";
    if (!cplRtCtry[c]) cplRtCtry[c] = { cplSum: 0, cplCount: 0, rtSum: 0, rtCount: 0 };
    if (l.lead_cost > 0) { cplRtCtry[c].cplSum += l.lead_cost; cplRtCtry[c].cplCount++; }
    if (l.minutes_to_first_call && l.minutes_to_first_call > 0) { cplRtCtry[c].rtSum += l.minutes_to_first_call; cplRtCtry[c].rtCount++; }
  });
  const cplVsResponseTime = Object.entries(cplRtCtry)
    .filter(([, v]) => v.cplCount > 0 && v.rtCount > 0)
    .map(([country, v]) => ({
      country,
      avgCPL:     Math.round((v.cplSum / v.cplCount) * 100) / 100,
      avgMinutes: Math.round(v.rtSum / v.rtCount),
      leads:      v.cplCount,
    }))
    .sort((a, b) => b.leads - a.leads);

  return {
    leads: enriched,
    totalLeads, openLeads,
    contactRate:      totalLeads ? Math.round((contacted / totalLeads) * 100) : 0,
    conversionRate:   totalLeads ? Math.round((won / totalLeads) * 100) : 0,
    pctCalled:        totalLeads ? Math.round((called / totalLeads) * 100) : 0,
    callAnswerRate:   called     ? Math.round((answered / called) * 100) : 0,
    avgMinutesToFirstCall,
    byHour, byWeekday, byDate, heatmap,
    byAd, byCampaign, byOwner, byRegion, byPlatform, byStatus,
    responseTimeByCountry, cplByCountry, cplVsResponseTime,
    callsByHour, formAnswersSummary,
    timeToContactDistribution: [], callDispositions: [],
    totalSpend, avgCPL,
    callAnsweredRate: called ? Math.round((answered / called) * 100) : 0,
    adInsights: [],
  };
}
