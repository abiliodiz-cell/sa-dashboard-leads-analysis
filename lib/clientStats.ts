"use client";
import { EnrichedLead, DashboardStats } from "./fusion";

const WEEKDAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function isWon(s: string)  { return ["won","closed won","converted","ganho","fechado"].includes(s.toLowerCase()); }
function isOpen(s: string) { return ["open","new","novo","aberto","new lead",""].includes(s.toLowerCase()); }

export interface Filters {
  dateFrom: string;   // YYYY-MM-DD or ""
  dateTo:   string;   // YYYY-MM-DD or ""
  countries: string[];  // [] = all
  agents:    string[];  // [] = all
}

export function applyFilters(leads: EnrichedLead[], f: Filters): EnrichedLead[] {
  return leads.filter(l => {
    const d = l.submitted_at?.slice(0, 10) || "";
    if (f.dateFrom && d && d < f.dateFrom) return false;
    if (f.dateTo   && d && d > f.dateTo)   return false;
    if (f.countries.length && !f.countries.includes(l.country)) return false;
    if (f.agents.length    && !f.agents.includes(l.owner))      return false;
    return true;
  });
}

export function computeStats(leads: EnrichedLead[]): DashboardStats {
  const totalLeads  = leads.length;
  const openLeads   = leads.filter(l => isOpen(l.deal_status)).length;
  const contacted   = leads.filter(l => !isOpen(l.deal_status)).length;
  const won         = leads.filter(l => isWon(l.deal_status)).length;
  const called      = leads.filter(l => l.was_called).length;
  const answered    = leads.filter(l => l.call_answered).length;

  const withTime = leads.filter(l => l.minutes_to_first_call != null && l.minutes_to_first_call > 0);
  const avgMinutesToFirstCall = withTime.length
    ? Math.round(withTime.reduce((s, l) => s + (l.minutes_to_first_call||0), 0) / withTime.length)
    : null;

  // heatmap
  const hGrid: Record<string,number> = {};
  leads.forEach(l => { const k=`${l.submitted_weekday_num}_${l.submitted_hour}`; hGrid[k]=(hGrid[k]||0)+1; });
  const heatmap = [];
  for (let w=0;w<7;w++) for (let h=0;h<24;h++) heatmap.push({weekday:w,hour:h,count:hGrid[`${w}_${h}`]||0});

  // byHour
  const hourMap: Record<number,number> = {};
  leads.forEach(l => { hourMap[l.submitted_hour]=(hourMap[l.submitted_hour]||0)+1; });
  const byHour = Array.from({length:24},(_,h)=>({hour:h,count:hourMap[h]||0}));

  // byWeekday
  const dayMap: Record<string,number> = {};
  leads.forEach(l => { dayMap[l.submitted_weekday]=(dayMap[l.submitted_weekday]||0)+1; });
  const byWeekday = WEEKDAYS.map(d=>({day:d,count:dayMap[d]||0}));

  // byDate
  const dateMap: Record<string,number> = {};
  leads.forEach(l => { const d=l.submitted_at?.slice(0,10); if(d) dateMap[d]=(dateMap[d]||0)+1; });
  const byDate = Object.entries(dateMap).sort(([a],[b])=>a.localeCompare(b)).map(([date,count])=>({date,count}));

  // byAd
  const adMap: Record<string,{leads:number;contacted:number;campaign_name:string}> = {};
  leads.forEach(l => {
    const k=l.ad_name||"Unknown Ad";
    if(!adMap[k]) adMap[k]={leads:0,contacted:0,campaign_name:l.campaign_name||""};
    adMap[k].leads++;
    if(!isOpen(l.deal_status)) adMap[k].contacted++;
  });
  const byAd = Object.entries(adMap)
    .map(([ad_name,v])=>({ad_name,campaign_name:v.campaign_name,leads:v.leads,spend:0,cpl:0,impressions:0,clicks:0,contact_rate:v.leads?Math.round(v.contacted/v.leads*100):0}))
    .sort((a,b)=>b.leads-a.leads);

  // byCampaign
  const campMap: Record<string,number> = {};
  leads.forEach(l => { const k=l.campaign_name||"Unknown"; campMap[k]=(campMap[k]||0)+1; });
  const byCampaign = Object.entries(campMap).map(([campaign,leads])=>({campaign,leads,spend:0,cpl:0})).sort((a,b)=>b.leads-a.leads);

  // byOwner
  const ownerMap: Record<string,{leads:number;called:number;answered:number;converted:number}> = {};
  leads.forEach(l => {
    const k=l.owner||"Unassigned";
    if(!ownerMap[k]) ownerMap[k]={leads:0,called:0,answered:0,converted:0};
    ownerMap[k].leads++;
    if(l.was_called)        ownerMap[k].called++;
    if(l.call_answered)     ownerMap[k].answered++;
    if(isWon(l.deal_status)) ownerMap[k].converted++;
  });
  const byOwner = Object.entries(ownerMap)
    .map(([owner,v])=>({owner,...v,avg_duration:0}))
    .sort((a,b)=>b.leads-a.leads);

  // byRegion
  const regionMap: Record<string,number> = {};
  leads.forEach(l => { regionMap[l.region]=(regionMap[l.region]||0)+1; });
  const byRegion = Object.entries(regionMap).map(([region,count])=>({region,count})).sort((a,b)=>b.count-a.count);

  // byPlatform
  const platMap: Record<string,number> = {};
  leads.forEach(l => { platMap[l.platform]=(platMap[l.platform]||0)+1; });
  const byPlatform = Object.entries(platMap).map(([platform,count])=>({platform,count})).sort((a,b)=>b.count-a.count);

  // byStatus
  const statusMap: Record<string,number> = {};
  leads.forEach(l => { const k=l.deal_status||l.deal_stage||"Unknown"; statusMap[k]=(statusMap[k]||0)+1; });
  const byStatus = Object.entries(statusMap).map(([status,count])=>({status,count})).sort((a,b)=>b.count-a.count);

  // callsByHour
  const callHourMap: Record<number,{total:number;answered:number}> = {};
  leads.forEach(l => {
    if(!l.first_call_time) return;
    const h=new Date(l.first_call_time).getHours();
    if(!callHourMap[h]) callHourMap[h]={total:0,answered:0};
    callHourMap[h].total++;
    if(l.call_answered) callHourMap[h].answered++;
  });
  const callsByHour = Array.from({length:24},(_,h)=>({hour:h,total:callHourMap[h]?.total||0,answered:callHourMap[h]?.answered||0}));

  // responseTimeByCountry
  const ctryRt: Record<string,{sum:number;count:number}> = {};
  withTime.forEach(l => {
    const c=l.country||"Unknown";
    if(!ctryRt[c]) ctryRt[c]={sum:0,count:0};
    ctryRt[c].sum+=(l.minutes_to_first_call||0);
    ctryRt[c].count++;
  });
  const responseTimeByCountry = Object.entries(ctryRt)
    .map(([country,v])=>({country,avgMinutes:Math.round(v.sum/v.count),count:v.count}))
    .sort((a,b)=>a.avgMinutes-b.avgMinutes).slice(0,10);

  // formAnswersSummary
  const formAnswersSummary: Record<string,Record<string,number>> = {};
  leads.forEach(l => {
    Object.entries(l.form_answers).forEach(([q,a]) => {
      if(!formAnswersSummary[q]) formAnswersSummary[q]={};
      formAnswersSummary[q][a]=(formAnswersSummary[q][a]||0)+1;
    });
  });

  // CPL by country
  const cplCtry: Record<string, { sum: number; count: number }> = {};
  leads.forEach(l => {
    if (l.lead_cost > 0) {
      const c = l.country || "Unknown";
      if (!cplCtry[c]) cplCtry[c] = { sum: 0, count: 0 };
      cplCtry[c].sum += l.lead_cost; cplCtry[c].count++;
    }
  });
  const cplByCountry = Object.entries(cplCtry)
    .map(([country, v]) => ({ country, avgCPL: Math.round(v.sum/v.count*100)/100, count: v.count }))
    .sort((a, b) => b.avgCPL - a.avgCPL);

  // CPL vs response time by country
  const cplRtCtry: Record<string, { cplSum:number; cplCount:number; rtSum:number; rtCount:number }> = {};
  leads.forEach(l => {
    const c = l.country || "Unknown";
    if (!cplRtCtry[c]) cplRtCtry[c] = { cplSum:0, cplCount:0, rtSum:0, rtCount:0 };
    if (l.lead_cost > 0) { cplRtCtry[c].cplSum += l.lead_cost; cplRtCtry[c].cplCount++; }
    if (l.minutes_to_first_call && l.minutes_to_first_call > 0) { cplRtCtry[c].rtSum += l.minutes_to_first_call; cplRtCtry[c].rtCount++; }
  });
  const cplVsResponseTime = Object.entries(cplRtCtry)
    .filter(([,v]) => v.cplCount > 0 && v.rtCount > 0)
    .map(([country, v]) => ({
      country, avgCPL: Math.round(v.cplSum/v.cplCount*100)/100,
      avgMinutes: Math.round(v.rtSum/v.rtCount), leads: v.cplCount,
    }))
    .sort((a, b) => b.leads - a.leads);

  const totalSpend = byCampaign.reduce((s,c) => s + c.spend, 0);
  const avgCPL     = totalSpend > 0 && totalLeads > 0 ? Math.round(totalSpend/totalLeads*100)/100 : 0;

  return {
    leads,
    totalLeads, openLeads,
    contactRate:    totalLeads ? Math.round(contacted/totalLeads*100) : 0,
    conversionRate: totalLeads ? Math.round(won/totalLeads*100) : 0,
    pctCalled:      totalLeads ? Math.round(called/totalLeads*100) : 0,
    callAnswerRate: called     ? Math.round(answered/called*100) : 0,
    avgMinutesToFirstCall,
    byHour, byWeekday, byDate, heatmap,
    byAd, byCampaign, byOwner, byRegion, byPlatform, byStatus,
    responseTimeByCountry, cplByCountry, cplVsResponseTime,
    callsByHour, formAnswersSummary,
    timeToContactDistribution: [], callDispositions: [],
    totalSpend, avgCPL,
    callAnsweredRate: called ? Math.round(answered/called*100) : 0,
    adInsights:[],
  };
}
