const PD_TOKEN = process.env.PIPEDRIVE_TOKEN || "85b1d6068f2d9b6c0071286b96e26fc137a19c88";
const BASE     = "https://api.pipedrive.com/v1";

const STAGE_NAMES: Record<number, string> = {
  110: "New Lead",
  111: "Contacted",
  112: "Qualified",
  113: "Presentation Done",
  114: "Negotiation",
  217: "Commitment + 20K Deposit",
  218: "Docs/Legal Process",
  219: "WON",
};

interface PdDeal {
  id: number;
  stage_id: number;
  status: string;
  value: number;
  owner_name: string;
  person_id: {
    email: { value: string }[];
    phone: { value: string }[];
  } | null;
}

export interface PipedriveEnrichment {
  dealStage: string;
  dealStatus: string;
  dealValue: number;
  ownerName: string;
}

// Simple in-memory cache with 30-minute TTL
let _cache: { data: PdDeal[]; ts: number } | null = null;
const CACHE_TTL = 30 * 60 * 1000;

async function fetchPageOfDeals(status: string, start: number): Promise<{ data: PdDeal[]; more: boolean }> {
  const url = `${BASE}/deals?pipeline_id=16&status=${status}&limit=500&start=${start}&api_token=${PD_TOKEN}`;
  const res  = await fetch(url, { cache: "no-store" });
  if (!res.ok) return { data: [], more: false };
  const json = await res.json();
  if (!json.success || !json.data) return { data: [], more: false };
  return {
    data: json.data as PdDeal[],
    more: json.additional_data?.pagination?.more_items_in_collection ?? false,
  };
}

async function fetchAllDeals(): Promise<PdDeal[]> {
  // Return from cache if fresh
  if (_cache && Date.now() - _cache.ts < CACHE_TTL) return _cache.data;

  // Fetch open + won + lost in parallel (first page each)
  const [p1open, p1won, p1lost] = await Promise.all([
    fetchPageOfDeals("open", 0),
    fetchPageOfDeals("won",  0),
    fetchPageOfDeals("lost", 0),
  ]);

  const all: PdDeal[] = [...p1open.data, ...p1won.data, ...p1lost.data];

  // Paginate remaining pages in parallel where needed
  const continuations: Promise<PdDeal[]>[] = [];

  for (const [status, first] of [["open", p1open], ["won", p1won], ["lost", p1lost]] as const) {
    if (!first.more) continue;
    continuations.push((async () => {
      const items: PdDeal[] = [];
      let start = 500;
      for (let page = 0; page < 20; page++) {
        const { data, more } = await fetchPageOfDeals(status, start);
        items.push(...data);
        if (!more) break;
        start += 500;
      }
      return items;
    })());
  }

  const extra = await Promise.all(continuations);
  for (const batch of extra) all.push(...batch);

  _cache = { data: all, ts: Date.now() };
  return all;
}

function normEmail(e: string) { return (e || "").toLowerCase().trim(); }
function normPhone(p: string) { return (p || "").replace(/\D/g, "").slice(-9); }

function rankDeal(d: PdDeal): number {
  if (d.status === "won")  return 100;
  if (d.status === "lost") return 1;
  const stageRank: Record<number, number> = { 110: 10, 111: 20, 112: 30, 113: 40, 114: 50, 217: 60, 218: 70, 219: 90 };
  return stageRank[d.stage_id] || 5;
}

export async function getPipedriveEnrichments(
  leads: Array<{ email: string; phone: string; created_time: string }>
): Promise<Map<string, PipedriveEnrichment>> {
  const result = new Map<string, PipedriveEnrichment>();

  const deals = await fetchAllDeals();

  const emailToDeal = new Map<string, PdDeal>();
  const phoneToDeal = new Map<string, PdDeal>();

  for (const d of deals) {
    const p = d.person_id;
    if (!p) continue;
    for (const e of p.email || []) {
      if (!e.value) continue;
      const ek = normEmail(e.value);
      const ex = emailToDeal.get(ek);
      if (!ex || rankDeal(d) > rankDeal(ex)) emailToDeal.set(ek, d);
    }
    for (const ph of p.phone || []) {
      if (!ph.value) continue;
      const pk = normPhone(ph.value);
      if (pk.length < 7) continue;
      const ex = phoneToDeal.get(pk);
      if (!ex || rankDeal(d) > rankDeal(ex)) phoneToDeal.set(pk, d);
    }
  }

  for (const lead of leads) {
    const ek = normEmail(lead.email);
    const pk = normPhone(lead.phone);
    const deal = (ek ? emailToDeal.get(ek) : undefined) || (pk ? phoneToDeal.get(pk) : undefined);
    if (!deal) continue;
    result.set(ek, {
      dealStage:  STAGE_NAMES[deal.stage_id] || `Stage ${deal.stage_id}`,
      dealStatus: deal.status,
      dealValue:  deal.value || 0,
      ownerName:  deal.owner_name || "",
    });
  }

  return result;
}
