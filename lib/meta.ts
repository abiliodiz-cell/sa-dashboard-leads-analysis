const META_BASE = "https://graph.facebook.com/v19.0";
const TOKEN = process.env.META_ACCESS_TOKEN!;
const AD_ACCOUNT = process.env.META_AD_ACCOUNT_ID!;
const PAGE_ID = process.env.META_PAGE_ID!;

export interface MetaLead {
  id: string;
  created_time: string;
  ad_id: string;
  ad_name: string;
  adset_name: string;
  campaign_name: string;
  form_id: string;
  field_data: { name: string; values: string[] }[];
}

export interface MetaAdInsight {
  ad_id: string;
  ad_name: string;
  adset_name: string;
  campaign_name: string;
  spend: string;
  impressions: string;
  clicks: string;
  leads: string;
  cpl: string; // cost per lead
  date_start: string;
  date_stop: string;
}

export interface MetaFormQuestion {
  key: string;
  label: string;
  type: string;
}

// Get all lead forms for the page
export async function getLeadForms(): Promise<{ id: string; name: string; questions: MetaFormQuestion[] }[]> {
  const res = await fetch(
    `${META_BASE}/${PAGE_ID}/leadgen_forms?fields=id,name,questions&access_token=${TOKEN}`
  );
  const data = await res.json();
  return data.data || [];
}

// Get leads from a specific form (paginated)
export async function getLeadsFromForm(formId: string, since?: string): Promise<MetaLead[]> {
  const sinceParam = since ? `&filtering=[{"field":"time_created","operator":"GREATER_THAN","value":${Math.floor(new Date(since).getTime() / 1000)}}]` : "";
  const url = `${META_BASE}/${formId}/leads?fields=id,created_time,ad_id,ad_name,adset_name,campaign_name,form_id,field_data&limit=100&access_token=${TOKEN}${sinceParam}`;

  const leads: MetaLead[] = [];
  let nextUrl: string | null = url;

  while (nextUrl) {
    const res: Response = await fetch(nextUrl);
    const data: { data?: MetaLead[]; paging?: { next?: string } } = await res.json();
    if (data.data) leads.push(...data.data);
    nextUrl = data.paging?.next || null;
    if (leads.length > 1000) break; // safety cap
  }

  return leads;
}

// Get all leads across all forms
export async function getAllLeads(since?: string): Promise<MetaLead[]> {
  const forms = await getLeadForms();
  const results = await Promise.all(forms.map((f) => getLeadsFromForm(f.id, since)));
  return results.flat();
}

// Get ad insights (spend, CPL, etc.) for the last N days
export async function getAdInsights(days = 30): Promise<MetaAdInsight[]> {
  const url = `${META_BASE}/${AD_ACCOUNT}/insights?fields=ad_id,ad_name,adset_name,campaign_name,spend,impressions,clicks,actions,cost_per_action_type&level=ad&date_preset=last_${days}d&limit=100&access_token=${TOKEN}`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data.data) return [];

  return (data.data as any[]).map((item) => {
    const leadAction = item.actions?.find((a: any) => a.action_type === "leadgen_grouped") || {};
    const leads = leadAction.value || "0";
    const cplAction = item.cost_per_action_type?.find((a: any) => a.action_type === "leadgen_grouped") || {};

    return {
      ad_id: item.ad_id,
      ad_name: item.ad_name,
      adset_name: item.adset_name,
      campaign_name: item.campaign_name,
      spend: item.spend || "0",
      impressions: item.impressions || "0",
      clicks: item.clicks || "0",
      leads,
      cpl: cplAction.value || "0",
      date_start: item.date_start,
      date_stop: item.date_stop,
    };
  });
}
