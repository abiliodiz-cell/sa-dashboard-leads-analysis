import { MetaLead, MetaAdInsight } from "./meta";
import { PipedriveDeal, PipedriveActivity } from "./pipedrive";
import { JustCallLog } from "./justcall";

export interface EnrichedLead {
  id: string;
  name: string;
  email: string;
  phone: string;

  // Meta origin
  meta_lead_id: string;
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

  // Pipedrive
  pipedrive_deal_id?: number;
  deal_status?: string;
  deal_stage?: string;
  owner?: string;
  deal_created_at?: string;
  email_sent?: boolean;
  email_opened?: boolean;
  activity_count?: number;

  // JustCall — source of truth for calls
  was_called?: boolean;
  call_answered?: boolean;
  first_call_at?: string;
  minutes_to_first_call?: number;
  total_calls?: number;
  total_call_duration?: number;
  call_agent?: string;
  last_call_at?: string;
  call_disposition?: string;
  justcall_logs?: JustCallLog[];

  // Ad
  ad_spend?: number;
  ad_cpl?: number;
}

export interface DashboardStats {
  leads: EnrichedLead[];
  adInsights: MetaAdInsight[];
  totalLeads: number;
  totalSpend: number;
  avgCPL: number;
  contactRate: number;
  callAnsweredRate: number;
  conversionRate: number;
  byHour: { hour: number; count: number }[];
  byWeekday: { day: string; count: number }[];
  byAd: { ad_name: string; leads: number; spend: number; cpl: number; contact_rate: number }[];
  byCampaign: { campaign: string; leads: number; spend: number; cpl: number }[];
  byOwner: { owner: string; leads: number; called: number; answered: number; converted: number; avg_duration: number }[];
  byRegion: { region: string; count: number }[];
  formAnswersSummary: Record<string, Record<string, number>>;
  timeToContactDistribution: { bucket: string; count: number }[];
  callDispositions: { disposition: string; count: number }[];
  callsByHour: { hour: number; total: number; answered: number }[];
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function normalisePhone(raw: string): string {
  return raw.replace(/[\s\-\(\)\.]/g, "").replace(/^\+/, "");
}

function extractField(lead: MetaLead, keys: string[]): string {
  for (const fd of lead.field_data) {
    if (keys.some((k) => fd.name.toLowerCase().includes(k.toLowerCase()))) {
      return fd.values?.[0] || "";
    }
  }
  return "";
}

function matchDeal(email: string, phone: string, deals: PipedriveDeal[]): PipedriveDeal | undefined {
  const normPhone = normalisePhone(phone);
  return deals.find((d) => {
    if (email && d.person_email.toLowerCase() === email.toLowerCase()) return true;
    if (normPhone && normalisePhone(d.person_phone) === normPhone) return true;
    return false;
  });
}

function minutesBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000);
}

function timeToBucket(minutes: number): string {
  if (minutes < 5) return "< 5 min";
  if (minutes < 30) return "5–30 min";
  if (minutes < 120) return "30–120 min";
  if (minutes < 1440) return "2–24 h";
  if (minutes < 4320) return "1–3 days";
  return "> 3 days";
}

export function fuseData(
  metaLeads: MetaLead[],
  deals: PipedriveDeal[],
  activitiesByDeal: Record<number, PipedriveActivity[]>,
  adInsights: MetaAdInsight[],
  stagesMap: Record<number, string>,
  justcallLogs: JustCallLog[],          // NEW
  justcallPhoneMap: Record<string, JustCallLog[]>  // NEW — pre-built lookup
): DashboardStats {
  const insightByAd = Object.fromEntries(adInsights.map((i) => [i.ad_id, i]));

  const enriched: EnrichedLead[] = metaLeads.map((ml) => {
    const name = extractField(ml, ["full_name", "name", "nome"]);
    const email = extractField(ml, ["email"]);
    const phone = extractField(ml, ["phone", "telefone", "mobile"]);
    const region = extractField(ml, ["city", "location", "region", "cidade"]);
    const country = extractField(ml, ["country", "pais", "país"]);

    const formAnswers: Record<string, string> = {};
    ml.field_data.forEach((fd) => { formAnswers[fd.name] = fd.values?.[0] || ""; });

    const submittedAt = ml.created_time;
    const dt = new Date(submittedAt);

    const deal = matchDeal(email, phone, deals);
    const activities = deal ? activitiesByDeal[deal.id] || [] : [];

    // --- JustCall match by phone ---
    const normLeadPhone = normalisePhone(phone);
    const callLogs = normLeadPhone ? (justcallPhoneMap[normLeadPhone] || []) : [];
    // Only calls AFTER the lead was submitted
    const relevantCalls = callLogs
      .filter((c) => new Date(c.datetime) >= new Date(submittedAt))
      .sort((a, b) => a.datetime.localeCompare(b.datetime));

    const firstCall = relevantCalls[0];
    const answeredCall = relevantCalls.find((c) => c.status === "completed");
    const totalDuration = relevantCalls.reduce((s, c) => s + c.duration, 0);
    const minutesToFirstCall = firstCall ? minutesBetween(submittedAt, firstCall.datetime) : undefined;

    const insight = insightByAd[ml.ad_id];

    return {
      id: ml.id,
      name,
      email,
      phone,
      meta_lead_id: ml.id,
      ad_id: ml.ad_id,
      ad_name: ml.ad_name,
      adset_name: ml.adset_name,
      campaign_name: ml.campaign_name,
      form_answers: formAnswers,
      submitted_at: submittedAt,
      submitted_hour: dt.getHours(),
      submitted_weekday: WEEKDAYS[dt.getDay()],
      region: region || "Unknown",
      country: country || "Unknown",

      pipedrive_deal_id: deal?.id,
      deal_status: deal?.status,
      deal_stage: deal?.stage_id ? stagesMap[deal.stage_id] : undefined,
      owner: deal?.owner_name,
      deal_created_at: deal?.add_time,
      email_sent: activities.some((a) => a.type === "email"),
      email_opened: deal?.email_opened,
      activity_count: activities.length,

      // JustCall
      was_called: relevantCalls.length > 0,
      call_answered: !!answeredCall,
      first_call_at: firstCall?.datetime,
      minutes_to_first_call: minutesToFirstCall,
      total_calls: relevantCalls.length,
      total_call_duration: totalDuration,
      call_agent: firstCall?.agent_name,
      last_call_at: relevantCalls[relevantCalls.length - 1]?.datetime,
      call_disposition: answeredCall?.disposition || firstCall?.disposition,
      justcall_logs: relevantCalls,

      ad_spend: insight ? parseFloat(insight.spend) : undefined,
      ad_cpl: insight ? parseFloat(insight.cpl) : undefined,
    };
  });

  // --- Aggregations ---
  const totalLeads = enriched.length;
  const totalSpend = adInsights.reduce((s, i) => s + parseFloat(i.spend), 0);
  const leadsWithCPL = enriched.filter((l) => l.ad_cpl && l.ad_cpl > 0);
  const avgCPL = leadsWithCPL.length
    ? leadsWithCPL.reduce((s, l) => s + (l.ad_cpl || 0), 0) / leadsWithCPL.length : 0;

  const contacted = enriched.filter((l) => l.was_called || l.email_sent).length;
  const answered = enriched.filter((l) => l.call_answered).length;
  const won = enriched.filter((l) => l.deal_status === "won").length;

  const hourMap: Record<number, number> = {};
  enriched.forEach((l) => { hourMap[l.submitted_hour] = (hourMap[l.submitted_hour] || 0) + 1; });
  const byHour = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: hourMap[h] || 0 }));

  const dayMap: Record<string, number> = {};
  enriched.forEach((l) => { dayMap[l.submitted_weekday] = (dayMap[l.submitted_weekday] || 0) + 1; });
  const byWeekday = WEEKDAYS.map((d) => ({ day: d, count: dayMap[d] || 0 }));

  const adMap: Record<string, { leads: number; spend: number; cpl_sum: number; cpl_count: number; contacted: number }> = {};
  enriched.forEach((l) => {
    const key = l.ad_name || "Unknown Ad";
    if (!adMap[key]) adMap[key] = { leads: 0, spend: 0, cpl_sum: 0, cpl_count: 0, contacted: 0 };
    adMap[key].leads++;
    if (l.ad_cpl) { adMap[key].cpl_sum += l.ad_cpl; adMap[key].cpl_count++; }
    if (l.was_called || l.email_sent) adMap[key].contacted++;
  });
  adInsights.forEach((i) => { if (adMap[i.ad_name]) adMap[i.ad_name].spend = parseFloat(i.spend); });
  const byAd = Object.entries(adMap).map(([ad_name, v]) => ({
    ad_name, leads: v.leads, spend: v.spend,
    cpl: v.cpl_count ? Math.round(v.cpl_sum / v.cpl_count * 100) / 100 : 0,
    contact_rate: v.leads ? Math.round((v.contacted / v.leads) * 100) : 0,
  })).sort((a, b) => b.leads - a.leads);

  const campMap: Record<string, { leads: number; spend: number }> = {};
  enriched.forEach((l) => {
    const key = l.campaign_name || "Unknown";
    if (!campMap[key]) campMap[key] = { leads: 0, spend: 0 };
    campMap[key].leads++;
  });
  adInsights.forEach((i) => { if (campMap[i.campaign_name]) campMap[i.campaign_name].spend += parseFloat(i.spend); });
  const byCampaign = Object.entries(campMap).map(([campaign, v]) => ({
    campaign, leads: v.leads, spend: v.spend,
    cpl: v.leads ? Math.round((v.spend / v.leads) * 100) / 100 : 0,
  })).sort((a, b) => b.leads - a.leads);

  // By owner — now includes avg call duration from JustCall
  const ownerMap: Record<string, { leads: number; called: number; answered: number; converted: number; total_duration: number }> = {};
  enriched.forEach((l) => {
    const key = l.owner || l.call_agent || "Unassigned";
    if (!ownerMap[key]) ownerMap[key] = { leads: 0, called: 0, answered: 0, converted: 0, total_duration: 0 };
    ownerMap[key].leads++;
    if (l.was_called) ownerMap[key].called++;
    if (l.call_answered) ownerMap[key].answered++;
    if (l.deal_status === "won") ownerMap[key].converted++;
    ownerMap[key].total_duration += l.total_call_duration || 0;
  });
  const byOwner = Object.entries(ownerMap).map(([owner, v]) => ({
    owner, leads: v.leads, called: v.called, answered: v.answered, converted: v.converted,
    avg_duration: v.called ? Math.round(v.total_duration / v.called) : 0,
  }));

  const regionMap: Record<string, number> = {};
  enriched.forEach((l) => { regionMap[l.region] = (regionMap[l.region] || 0) + 1; });
  const byRegion = Object.entries(regionMap)
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count);

  const formAnswersSummary: Record<string, Record<string, number>> = {};
  enriched.forEach((l) => {
    Object.entries(l.form_answers).forEach(([q, a]) => {
      if (!formAnswersSummary[q]) formAnswersSummary[q] = {};
      formAnswersSummary[q][a] = (formAnswersSummary[q][a] || 0) + 1;
    });
  });

  const bucketMap: Record<string, number> = {};
  enriched.filter((l) => l.minutes_to_first_call !== undefined).forEach((l) => {
    const b = timeToBucket(l.minutes_to_first_call!);
    bucketMap[b] = (bucketMap[b] || 0) + 1;
  });
  const bucketOrder = ["< 5 min", "5–30 min", "30–120 min", "2–24 h", "1–3 days", "> 3 days"];
  const timeToContactDistribution = bucketOrder.map((bucket) => ({ bucket, count: bucketMap[bucket] || 0 }));

  // Call dispositions (JustCall labels)
  const dispMap: Record<string, number> = {};
  justcallLogs.forEach((c) => {
    const key = c.disposition || c.status;
    dispMap[key] = (dispMap[key] || 0) + 1;
  });
  const callDispositions = Object.entries(dispMap)
    .map(([disposition, count]) => ({ disposition, count }))
    .sort((a, b) => b.count - a.count);

  // Calls by hour (JustCall — when are agents calling?)
  const callHourMap: Record<number, { total: number; answered: number }> = {};
  justcallLogs.forEach((c) => {
    const h = new Date(c.datetime).getHours();
    if (!callHourMap[h]) callHourMap[h] = { total: 0, answered: 0 };
    callHourMap[h].total++;
    if (c.status === "completed") callHourMap[h].answered++;
  });
  const callsByHour = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    total: callHourMap[h]?.total || 0,
    answered: callHourMap[h]?.answered || 0,
  }));

  return {
    leads: enriched,
    adInsights,
    totalLeads,
    totalSpend,
    avgCPL,
    contactRate: totalLeads ? Math.round((contacted / totalLeads) * 100) : 0,
    callAnsweredRate: totalLeads ? Math.round((answered / totalLeads) * 100) : 0,
    conversionRate: totalLeads ? Math.round((won / totalLeads) * 100) : 0,
    byHour,
    byWeekday,
    byAd,
    byCampaign,
    byOwner,
    byRegion,
    formAnswersSummary,
    timeToContactDistribution,
    callDispositions,
    callsByHour,
  };
}
