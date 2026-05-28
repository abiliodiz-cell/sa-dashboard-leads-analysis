import { SheetLead } from "./sheets";
import { PipedriveEnrichment } from "./pipedrive";
import { JCEnrichment } from "./justcall";

export interface EnrichedLead {
  id: string;
  name: string;
  email: string;
  phone: string;
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
  byAd: { ad_name: string; leads: number; spend: number; cpl: number; contact_rate: number }[];
  byCampaign: { campaign: string; leads: number; spend: number; cpl: number }[];
  byOwner: { owner: string; leads: number; called: number; answered: number; converted: number; avg_duration: number }[];
  byRegion: { region: string; count: number }[];
  byPlatform: { platform: string; count: number }[];
  byStatus: { status: string; count: number }[];
  byDate: { date: string; count: number }[];
  heatmap: { weekday: number; hour: number; count: number }[];
  responseTimeByCountry: { country: string; avgMinutes: number; count: number }[];
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
  jcEnrichments?: Map<string, JCEnrichment>
): DashboardStats {
  const enriched: EnrichedLead[] = leads.map((l) => {
    const dt  = l.created_time ? new Date(l.created_time) : new Date();
    const ek  = l.email.toLowerCase().trim();
    const pk  = l.phone.replace(/\D/g, "").slice(-9);
    const pd  = enrichments?.get(ek);
    const jc  = pk ? jcEnrichments?.get(pk) : undefined;
    // JustCall is preferred for call data (more accurate), Pipedrive as fallback
    const callWasCalled         = jc?.wasCalled         ?? pd?.wasCalled         ?? false;
    const callAnswered          = jc?.callAnswered       ?? pd?.callAnswered      ?? false;
    const callFirstCallTime     = jc?.firstCallTime      ?? pd?.firstCallTime     ?? null;
    const callFirstContactTime  = jc?.firstContactTime   ?? pd?.firstContactTime  ?? null;
    const callMinutesToFirst    = jc?.minutesToFirstCall ?? pd?.minutesToFirstCall ?? undefined;

    return {
      id:                   l.id,
      name:                 l.full_name,
      email:                l.email,
      phone:                l.phone,
      ad_id:                l.ad_id,
      ad_name:              l.ad_name,
      adset_name:           l.adset_name,
      campaign_name:        l.campaign_name,
      form_name:            l.form_name,
      form_answers:         l.answers,
      submitted_at:         l.created_time,
      submitted_hour:       dt.getHours(),
      submitted_weekday:    WEEKDAYS[dt.getDay()],
      submitted_weekday_num: dt.getDay(),
      region:               l.country || "Unknown",
      country:              l.country || "Unknown",
      platform:             l.platform || "Unknown",
      owner:                pd?.ownerName || l.owner || "Unassigned",
      deal_stage:           pd?.dealStage  || l.status || "",
      deal_status:          pd?.dealStatus || l.status || "",
      deal_value:           pd?.dealValue  || 0,
      was_called:           callWasCalled,
      call_answered:        callAnswered,
      first_call_time:      callFirstCallTime,
      first_contact_time:   callFirstContactTime,
      minutes_to_first_call: callMinutesToFirst,
      lead_cost:            0,
    };
  });

  const totalLeads = enriched.length;
  const openLeads  = enriched.filter(l => isOpen(l.deal_status)).length;
  const contacted  = enriched.filter(l => !isOpen(l.deal_status)).length;
  const won        = enriched.filter(l => isWon(l.deal_status)).length;
  const called     = enriched.filter(l => l.was_called).length;
  const answered   = enriched.filter(l => l.call_answered).length;

  // Response time stats
  const withCallTime = enriched.filter(l => l.minutes_to_first_call != null && l.minutes_to_first_call > 0);
  const avgMinutesToFirstCall = withCallTime.length
    ? Math.round(withCallTime.reduce((s, l) => s + (l.minutes_to_first_call || 0), 0) / withCallTime.length)
    : null;

  // Heatmap: weekday (0-6) x hour (0-23)
  const heatGrid: Record<string, number> = {};
  enriched.forEach(l => {
    const key = `${l.submitted_weekday_num}_${l.submitted_hour}`;
    heatGrid[key] = (heatGrid[key] || 0) + 1;
  });
  const heatmap: { weekday: number; hour: number; count: number }[] = [];
  for (let w = 0; w < 7; w++) {
    for (let h = 0; h < 24; h++) {
      heatmap.push({ weekday: w, hour: h, count: heatGrid[`${w}_${h}`] || 0 });
    }
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

  // By Hour
  const hourMap: Record<number, number> = {};
  enriched.forEach(l => { hourMap[l.submitted_hour] = (hourMap[l.submitted_hour] || 0) + 1; });
  const byHour = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: hourMap[h] || 0 }));

  // By Weekday
  const dayMap: Record<string, number> = {};
  enriched.forEach(l => { dayMap[l.submitted_weekday] = (dayMap[l.submitted_weekday] || 0) + 1; });
  const byWeekday = WEEKDAYS.map(d => ({ day: d, count: dayMap[d] || 0 }));

  // By Date
  const dateMap: Record<string, number> = {};
  enriched.forEach(l => {
    const d = l.submitted_at?.slice(0, 10);
    if (d) dateMap[d] = (dateMap[d] || 0) + 1;
  });
  const byDate = Object.entries(dateMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  // By Ad
  const adMap: Record<string, { leads: number; contacted: number }> = {};
  enriched.forEach(l => {
    const key = l.ad_name || "Unknown Ad";
    if (!adMap[key]) adMap[key] = { leads: 0, contacted: 0 };
    adMap[key].leads++;
    if (!isOpen(l.deal_status)) adMap[key].contacted++;
  });
  const byAd = Object.entries(adMap)
    .map(([ad_name, v]) => ({
      ad_name, leads: v.leads, spend: 0, cpl: 0,
      contact_rate: v.leads ? Math.round((v.contacted / v.leads) * 100) : 0,
    }))
    .sort((a, b) => b.leads - a.leads);

  // By Campaign
  const campMap: Record<string, number> = {};
  enriched.forEach(l => { const k = l.campaign_name || "Unknown"; campMap[k] = (campMap[k] || 0) + 1; });
  const byCampaign = Object.entries(campMap)
    .map(([campaign, leads]) => ({ campaign, leads, spend: 0, cpl: 0 }))
    .sort((a, b) => b.leads - a.leads);

  // By Owner
  const ownerMap: Record<string, { leads: number; called: number; answered: number; converted: number }> = {};
  enriched.forEach(l => {
    const k = l.owner || "Unassigned";
    if (!ownerMap[k]) ownerMap[k] = { leads: 0, called: 0, answered: 0, converted: 0 };
    ownerMap[k].leads++;
    if (l.was_called)     ownerMap[k].called++;
    if (l.call_answered)  ownerMap[k].answered++;
    if (isWon(l.deal_status)) ownerMap[k].converted++;
  });
  const byOwner = Object.entries(ownerMap)
    .map(([owner, v]) => ({ owner, ...v, avg_duration: 0 }))
    .sort((a, b) => b.leads - a.leads);

  // By Region
  const regionMap: Record<string, number> = {};
  enriched.forEach(l => { regionMap[l.region] = (regionMap[l.region] || 0) + 1; });
  const byRegion = Object.entries(regionMap)
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count);

  // By Platform
  const platMap: Record<string, number> = {};
  enriched.forEach(l => { platMap[l.platform] = (platMap[l.platform] || 0) + 1; });
  const byPlatform = Object.entries(platMap)
    .map(([platform, count]) => ({ platform, count }))
    .sort((a, b) => b.count - a.count);

  // By Status
  const statusMap: Record<string, number> = {};
  enriched.forEach(l => { const k = l.deal_status || l.deal_stage || "Unknown"; statusMap[k] = (statusMap[k] || 0) + 1; });
  const byStatus = Object.entries(statusMap)
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  // Calls by hour (from first_call_time)
  const callHourMap: Record<number, { total: number; answered: number }> = {};
  enriched.forEach(l => {
    if (!l.first_call_time) return;
    const h = new Date(l.first_call_time).getHours();
    if (!callHourMap[h]) callHourMap[h] = { total: 0, answered: 0 };
    callHourMap[h].total++;
    if (l.call_answered) callHourMap[h].answered++;
  });
  const callsByHour = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    total:    callHourMap[h]?.total    || 0,
    answered: callHourMap[h]?.answered || 0,
  }));

  // Form answers
  const formAnswersSummary: Record<string, Record<string, number>> = {};
  enriched.forEach(l => {
    Object.entries(l.form_answers).forEach(([q, a]) => {
      if (!formAnswersSummary[q]) formAnswersSummary[q] = {};
      formAnswersSummary[q][a] = (formAnswersSummary[q][a] || 0) + 1;
    });
  });

  return {
    leads: enriched,
    totalLeads,
    openLeads,
    contactRate:           totalLeads ? Math.round((contacted / totalLeads) * 100) : 0,
    conversionRate:        totalLeads ? Math.round((won / totalLeads) * 100) : 0,
    pctCalled:             totalLeads ? Math.round((called / totalLeads) * 100) : 0,
    callAnswerRate:        called     ? Math.round((answered / called) * 100) : 0,
    avgMinutesToFirstCall,
    byHour,
    byWeekday,
    byDate,
    heatmap,
    responseTimeByCountry,
    byAd,
    byCampaign,
    byOwner,
    byRegion,
    byPlatform,
    byStatus,
    formAnswersSummary,
    callsByHour,
    timeToContactDistribution: [],
    callDispositions: [],
    totalSpend:   0,
    avgCPL:       0,
    callAnsweredRate: called ? Math.round((answered / called) * 100) : 0,
    adInsights:   [],
  };
}
