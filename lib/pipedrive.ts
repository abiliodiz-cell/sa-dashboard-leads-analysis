const PD_TOKEN = process.env.PIPEDRIVE_TOKEN || "85b1d6068f2d9b6c0071286b96e26fc137a19c88";
const BASE     = "https://api.pipedrive.com/v1";

// Pipeline 16 stage map (hardcoded to avoid extra API call)
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
  title: string;
  stage_id: number;
  status: string;           // open | won | lost | deleted
  pipeline_id: number;
  add_time: string;
  won_time: string | null;
  lost_time: string | null;
  value: number;
  owner_name: string;
  person_id: {
    id: number;
    name: string;
    email: { value: string; primary: boolean }[];
    phone: { value: string; primary: boolean }[];
  } | null;
}

export interface PipedriveEnrichment {
  dealStage: string;
  dealStatus: string;  // open | won | lost
  dealValue: number;
  ownerName: string;
}

function normEmail(e: string): string {
  return (e || "").toLowerCase().trim();
}
function normPhone(p: string): string {
  return (p || "").replace(/\D/g, "").slice(-9);
}

async function fetchAllDeals(): Promise<PdDeal[]> {
  const items: PdDeal[] = [];
  let start = 0;
  const limit = 500;

  // Fetch deals from all statuses: open, won, lost
  for (const status of ["open", "won", "lost"]) {
    let s = 0;
    for (let page = 0; page < 30; page++) {
      const url = `${BASE}/deals?pipeline_id=16&status=${status}&limit=${limit}&start=${s}&api_token=${PD_TOKEN}`;
      const res  = await fetch(url, { cache: "no-store" });
      if (!res.ok) break;
      const json = await res.json();
      if (!json.success || !json.data) break;
      items.push(...(json.data as PdDeal[]));
      if (!json.additional_data?.pagination?.more_items_in_collection) break;
      s += limit;
    }
    void start;
  }
  return items;
}

export async function getPipedriveEnrichments(
  leads: Array<{ email: string; phone: string; created_time: string }>
): Promise<Map<string, PipedriveEnrichment>> {
  const result = new Map<string, PipedriveEnrichment>();

  const deals = await fetchAllDeals();

  // Build lookup maps from deals - email -> best deal, phone -> best deal
  // "Best" = most recent / most advanced stage
  const stageOrder: Record<string, number> = {
    "New Lead": 1, "Contacted": 2, "Qualified": 3, "Presentation Done": 4,
    "Negotiation": 5, "Commitment + 20K Deposit": 6, "Docs/Legal Process": 7, "WON": 8,
    won: 9, lost: 0,
  };
  const rank = (d: PdDeal) => {
    if (d.status === "won")  return 100;
    if (d.status === "lost") return stageOrder[STAGE_NAMES[d.stage_id] || ""] || 0;
    return stageOrder[STAGE_NAMES[d.stage_id] || ""] || 0;
  };

  const emailToDeal = new Map<string, PdDeal>();
  const phoneToDeal = new Map<string, PdDeal>();

  for (const d of deals) {
    const p = d.person_id;
    if (!p) continue;

    for (const e of p.email || []) {
      if (!e.value) continue;
      const ek = normEmail(e.value);
      const existing = emailToDeal.get(ek);
      if (!existing || rank(d) > rank(existing)) {
        emailToDeal.set(ek, d);
      }
    }
    for (const ph of p.phone || []) {
      if (!ph.value) continue;
      const pk = normPhone(ph.value);
      if (pk.length < 7) continue;
      const existing = phoneToDeal.get(pk);
      if (!existing || rank(d) > rank(existing)) {
        phoneToDeal.set(pk, d);
      }
    }
  }

  for (const lead of leads) {
    const ek = normEmail(lead.email);
    const pk = normPhone(lead.phone);

    const deal = (ek ? emailToDeal.get(ek) : undefined)
              || (pk ? phoneToDeal.get(pk) : undefined);
    if (!deal) continue;

    result.set(ek, {
      dealStage:   STAGE_NAMES[deal.stage_id] || `Stage ${deal.stage_id}`,
      dealStatus:  deal.status,
      dealValue:   deal.value || 0,
      ownerName:   deal.owner_name || "",
    });
  }

  return result;
}
