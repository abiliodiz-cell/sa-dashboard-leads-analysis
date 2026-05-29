const META_TOKEN   = process.env.META_TOKEN       || "";
const AD_ACCOUNT   = process.env.META_AD_ACCOUNT  || "act_4254163034827981";
const GRAPH        = "https://graph.facebook.com/v21.0";
const CACHE_TTL    = 30 * 60 * 1000; // 30 min

export interface MetaAdInsight {
  ad_id:         string;
  ad_name:       string;
  adset_name:    string;
  campaign_id:   string;
  campaign_name: string;
  spend:         number;
  impressions:   number;
  clicks:        number;
  meta_leads:    number; // leads counted by Meta (from actions)
  date_start:    string;
  date_stop:     string;
}

let _cache: { data: MetaAdInsight[]; ts: number } | null = null;

async function fetchJSON(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Meta API ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

export async function getMetaInsights(): Promise<MetaAdInsight[]> {
  if (!META_TOKEN) return [];

  if (_cache && Date.now() - _cache.ts < CACHE_TTL) return _cache.data;

  const fields = "ad_id,ad_name,adset_name,campaign_id,campaign_name,spend,impressions,clicks,actions";
  const url = `${GRAPH}/${AD_ACCOUNT}/insights?fields=${fields}&level=ad&date_preset=last_90d&limit=500&access_token=${META_TOKEN}`;

  const all: MetaAdInsight[] = [];
  let next: string | null = url;

  while (next) {
    const data = await fetchJSON(next);
    for (const d of data.data || []) {
      const leadAction = (d.actions || []).find(
        (a: any) => a.action_type === "lead" || a.action_type === "onsite_conversion.lead_grouped"
      );
      all.push({
        ad_id:         d.ad_id         || "",
        ad_name:       d.ad_name       || "",
        adset_name:    d.adset_name    || "",
        campaign_id:   d.campaign_id   || "",
        campaign_name: d.campaign_name || "",
        spend:         parseFloat(d.spend       || "0"),
        impressions:   parseInt(d.impressions   || "0", 10),
        clicks:        parseInt(d.clicks        || "0", 10),
        meta_leads:    leadAction ? parseInt(leadAction.value, 10) : 0,
        date_start:    d.date_start || "",
        date_stop:     d.date_stop  || "",
      });
    }
    next = data.paging?.next || null;
  }

  _cache = { data: all, ts: Date.now() };
  return all;
}

// Returns a lookup map: ad_id -> insight
export function buildMetaLookup(insights: MetaAdInsight[]): Map<string, MetaAdInsight> {
  const map = new Map<string, MetaAdInsight>();
  for (const i of insights) {
    if (i.ad_id) {
      const existing = map.get(i.ad_id);
      if (existing) {
        // Aggregate multiple date ranges
        existing.spend      += i.spend;
        existing.impressions+= i.impressions;
        existing.clicks     += i.clicks;
        existing.meta_leads += i.meta_leads;
      } else {
        map.set(i.ad_id, { ...i });
      }
    }
  }
  return map;
}

// Returns campaign-level spend map: campaign_name -> spend
export function buildCampaignSpendMap(insights: MetaAdInsight[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const i of insights) {
    map.set(i.campaign_name, (map.get(i.campaign_name) || 0) + i.spend);
  }
  return map;
}
