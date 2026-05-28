import { SheetLead } from "./sheets";

export interface EnrichedLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  ad_id: string;
  ad_name: string;
  adset_name: string;
  campaign_name: string;
  form_answers: Record<string, string>;
  submitted_at: string;
  submitted_hour: number;
  submitted_weekday: string;
  region: string;
  country: string;
  platform: string;
  owner: string;
  deal_stage: string;   // repurposed: shows CRM status
  deal_status: string;
  was_called: boolean;
  call_answered: boolean;
  minutes_to_first_call?: number;
}

export interface DashboardStats {
  leads: EnrichedLead[];
  totalLeads: number;
  openLeads: number;
  contactRate: number;
  conversionRate: number;
  byHour: { hour: number; count: number }[];
  byWeekday: { day: string; count: number }[];
  byAd: { ad_name: string; leads: number; spend: number; cpl: number; contact_rate: number }[];
  byCampaign: { campaign: string; leads: number; spend: number; cpl: number }[];
  byOwner: { owner: string; leads: number; called: number; answered: number; converted: number; avg_duration: number }[];
  byRegion: { region: string; count: number }[];
  byPlatform: { platform: string; count: number }[];
  byStatus: { status: string; count: number }[];
  byDate: { date: string; count: number }[];
  formAnswersSummary: Record<string, Record<string, number>>;
  timeToContactDistribution: { bucket: string; count: number }[];
  callDispositions: { disposition: string; count: number }[];
  callsByHour: { hour: number; total: number; answered: number }[];
  // legacy fields kept for type compat
  totalSpend: number;
  avgCPL: number;
  callAnsweredRate: number;
  adInsights: never[];
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const WON_STATUSES  = new Set(["won", "closed won", "converted", "ganho", "fechado"]);
const OPEN_STATUSES = new Set(["open", "new", "novo", "aberto", ""]);

function isWon(status: string)  { return WON_STATUSES.has(status.toLowerCase()); }
function isOpen(status: string) { return OPEN_STATUSES.has(status.toLowerCase()); }

export function fuseFromSheet(leads: SheetLead[]): DashboardStats {
  const enriched: EnrichedLead[] = leads.map((l) => {
    const dt = l.created_time ? new Date(l.created_time) : new Date();
    return {
      id:             l.id,
      name:           l.full_name,
      email:          l.email,
      phone:          l.phone,
      ad_id:          l.ad_id,
      ad_name:        l.ad_name,
      adset_name:     l.adset_name,
      campaign_name:  l.campaign_name,
      form_answers:   l.answers,
      submitted_at:   l.created_time,
      submitted_hour: dt.getHours(),
      submitted_weekday: WEEKDAYS[dt.getDay()],
      region:         l.country || "Unknown",
      country:        l.country || "Unknown",
      platform:       l.platform || "Unknown",
      owner:          l.owner || "Unassigned",
      deal_stage:     l.status,
      deal_status:    l.status,
      was_called:     false,
      call_answered:  false,
    };
  });

  const totalLeads   = enriched.length;
  const openLeads    = enriched.filter((l) => isOpen(l.deal_status)).length;
  const contacted    = enriched.filter((l) => !isOpen(l.deal_status)).length;
  const won          = enriched.filter((l) => isWon(l.deal_status)).length;

  // --- By Hour ---
  const hourMap: Record<number, number> = {};
  enriched.forEach((l) => { hourMap[l.submitted_hour] = (hourMap[l.submitted_hour] || 0) + 1; });
  const byHour = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: hourMap[h] || 0 }));

  // --- By Weekday ---
  const dayMap: Record<string, number> = {};
  enriched.forEach((l) => { dayMap[l.submitted_weekday] = (dayMap[l.submitted_weekday] || 0) + 1; });
  const byWeekday = WEEKDAYS.map((d) => ({ day: d, count: dayMap[d] || 0 }));

  // --- By Date (daily timeline) ---
  const dateMap: Record<string, number> = {};
  enriched.forEach((l) => {
    const d = l.submitted_at ? l.submitted_at.slice(0, 10) : "";
    if (d) dateMap[d] = (dateMap[d] || 0) + 1;
  });
  const byDate = Object.entries(dateMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  // --- By Ad ---
  const adMap: Record<string, { leads: number; contacted: number }> = {};
  enriched.forEach((l) => {
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

  // --- By Campaign ---
  const campMap: Record<string, number> = {};
  enriched.forEach((l) => {
    const key = l.campaign_name || "Unknown";
    campMap[key] = (campMap[key] || 0) + 1;
  });
  const byCampaign = Object.entries(campMap)
    .map(([campaign, leads]) => ({ campaign, leads, spend: 0, cpl: 0 }))
    .sort((a, b) => b.leads - a.leads);

  // --- By Owner ---
  const ownerMap: Record<string, { leads: number; converted: number }> = {};
  enriched.forEach((l) => {
    const key = l.owner || "Unassigned";
    if (!ownerMap[key]) ownerMap[key] = { leads: 0, converted: 0 };
    ownerMap[key].leads++;
    if (isWon(l.deal_status)) ownerMap[key].converted++;
  });
  const byOwner = Object.entries(ownerMap)
    .map(([owner, v]) => ({
      owner, leads: v.leads, called: 0, answered: 0,
      converted: v.converted, avg_duration: 0,
    }))
    .sort((a, b) => b.leads - a.leads);

  // --- By Region (country) ---
  const regionMap: Record<string, number> = {};
  enriched.forEach((l) => { regionMap[l.region] = (regionMap[l.region] || 0) + 1; });
  const byRegion = Object.entries(regionMap)
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count);

  // --- By Platform ---
  const platMap: Record<string, number> = {};
  enriched.forEach((l) => { platMap[l.platform] = (platMap[l.platform] || 0) + 1; });
  const byPlatform = Object.entries(platMap)
    .map(([platform, count]) => ({ platform, count }))
    .sort((a, b) => b.count - a.count);

  // --- By Status ---
  const statusMap: Record<string, number> = {};
  enriched.forEach((l) => {
    const key = l.deal_status || "Unknown";
    statusMap[key] = (statusMap[key] || 0) + 1;
  });
  const byStatus = Object.entries(statusMap)
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  // --- Form Answers ---
  const formAnswersSummary: Record<string, Record<string, number>> = {};
  enriched.forEach((l) => {
    Object.entries(l.form_answers).forEach(([q, a]) => {
      if (!formAnswersSummary[q]) formAnswersSummary[q] = {};
      formAnswersSummary[q][a] = (formAnswersSummary[q][a] || 0) + 1;
    });
  });

  return {
    leads: enriched,
    totalLeads,
    openLeads,
    contactRate:      totalLeads ? Math.round((contacted / totalLeads) * 100) : 0,
    conversionRate:   totalLeads ? Math.round((won / totalLeads) * 100) : 0,
    byHour,
    byWeekday,
    byDate,
    byAd,
    byCampaign,
    byOwner,
    byRegion,
    byPlatform,
    byStatus,
    formAnswersSummary,
    // fields without data from sheet
    timeToContactDistribution: [],
    callDispositions: [],
    callsByHour: Array.from({ length: 24 }, (_, h) => ({ hour: h, total: 0, answered: 0 })),
    totalSpend: 0,
    avgCPL: 0,
    callAnsweredRate: 0,
    adInsights: [],
  };
}
