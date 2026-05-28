const PD_TOKEN = process.env.PIPEDRIVE_TOKEN || "85b1d6068f2d9b6c0071286b96e26fc137a19c88";
const BASE = "https://api.pipedrive.com/v1";

interface PdPerson {
  id: number;
  name: string;
  email: { value: string; primary: boolean }[];
  phone: { value: string; primary: boolean }[];
}

interface PdDeal {
  id: number;
  stage_id: number;
  status: string;
  person_id: { value: number } | null;
  add_time: string;
  won_time: string | null;
  lost_time: string | null;
  value: number;
  owner_name: string;
  pipeline_id: number;
}

interface PdActivity {
  id: number;
  deal_id: number | null;
  person_id: number | null;
  type: string;
  done: boolean;
  due_date: string;
  due_time: string;
  marked_as_done_time: string | null;
  duration: string | null;
  add_time: string;
}

export interface PipedriveEnrichment {
  dealStage: string;
  dealStatus: string;
  dealValue: number;
  ownerName: string;
  wasCalled: boolean;
  callAnswered: boolean;
  firstCallTime: string | null;
  firstContactTime: string | null;
  minutesToFirstCall: number | null;
}

async function pdFetch<T>(path: string): Promise<T[]> {
  const items: T[] = [];
  let start = 0;
  const limit = 500;
  for (let page = 0; page < 20; page++) {
    const sep = path.includes("?") ? "&" : "?";
    const url = `${BASE}${path}${sep}api_token=${PD_TOKEN}&limit=${limit}&start=${start}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) break;
    const json = await res.json();
    if (!json.success || !json.data) break;
    const chunk: T[] = Array.isArray(json.data) ? json.data : [];
    items.push(...chunk);
    if (!json.additional_data?.pagination?.more_items_in_collection) break;
    start += limit;
  }
  return items;
}

function normEmail(e: string) { return e.toLowerCase().trim(); }
function normPhone(p: string) {
  const d = p.replace(/\D/g, "");
  return d.slice(-9);
}

function actTime(due_date: string, due_time: string): string {
  if (!due_date) return "";
  return `${due_date}T${due_time || "00:00:00"}`;
}

function durSeconds(dur: string | null): number {
  if (!dur) return 0;
  const parts = dur.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

export async function getPipedriveEnrichments(
  leads: Array<{ email: string; phone: string; created_time: string }>
): Promise<Map<string, PipedriveEnrichment>> {
  const result = new Map<string, PipedriveEnrichment>();

  // Fetch stages for pipeline 16
  const stageMap: Record<number, string> = {};
  try {
    const sr = await fetch(`${BASE}/stages?pipeline_id=16&api_token=${PD_TOKEN}`, { cache: "no-store" });
    const sj = await sr.json();
    if (sj.success && sj.data) {
      for (const s of sj.data) stageMap[s.id] = s.name;
    }
  } catch (_) { /* non-fatal */ }

  // Parallel fetch
  const [persons, deals, activities] = await Promise.all([
    pdFetch<PdPerson>("/persons"),
    pdFetch<PdDeal>("/deals?pipeline_id=16"),
    pdFetch<PdActivity>("/activities"),
  ]);

  // Build person lookups
  const emailToPerson = new Map<string, PdPerson>();
  const phoneToPerson = new Map<string, PdPerson>();
  for (const p of persons) {
    for (const e of p.email || []) {
      if (e.value) emailToPerson.set(normEmail(e.value), p);
    }
    for (const ph of p.phone || []) {
      if (ph.value) {
        const key = normPhone(ph.value);
        if (key.length >= 7) phoneToPerson.set(key, p);
      }
    }
  }

  // Person -> deals
  const personToDeals = new Map<number, PdDeal[]>();
  for (const d of deals) {
    const pid = d.person_id?.value;
    if (!pid) continue;
    if (!personToDeals.has(pid)) personToDeals.set(pid, []);
    personToDeals.get(pid)!.push(d);
  }

  // Person/deal -> activities
  const personToActs = new Map<number, PdActivity[]>();
  const dealToActs   = new Map<number, PdActivity[]>();
  for (const a of activities) {
    if (a.person_id) {
      if (!personToActs.has(a.person_id)) personToActs.set(a.person_id, []);
      personToActs.get(a.person_id)!.push(a);
    }
    if (a.deal_id) {
      if (!dealToActs.has(a.deal_id)) dealToActs.set(a.deal_id, []);
      dealToActs.get(a.deal_id)!.push(a);
    }
  }

  for (const lead of leads) {
    if (!lead.email && !lead.phone) continue;
    const ek = normEmail(lead.email || "");
    const pk = normPhone(lead.phone || "");

    const person = (ek ? emailToPerson.get(ek) : undefined) || (pk ? phoneToPerson.get(pk) : undefined);
    if (!person) continue;

    const personDeals = (personToDeals.get(person.id) || [])
      .sort((a, b) => b.add_time.localeCompare(a.add_time));
    const deal = personDeals[0];

    // Collect unique activities
    const actsById = new Map<number, PdActivity>();
    for (const a of (personToActs.get(person.id) || [])) actsById.set(a.id, a);
    if (deal) {
      for (const a of (dealToActs.get(deal.id) || [])) actsById.set(a.id, a);
    }
    const allActs = Array.from(actsById.values());

    // Call activities = type contains "justcall" (case-insensitive)
    const callActs = allActs.filter(a => a.type?.toLowerCase().includes("justcall"));

    const sortByTime = (arr: PdActivity[]) =>
      [...arr].sort((a, b) => actTime(a.due_date, a.due_time).localeCompare(actTime(b.due_date, b.due_time)));

    const sortedCalls = sortByTime(callActs);
    const firstCallAct = sortedCalls[0];
    const firstCallTime = firstCallAct ? actTime(firstCallAct.due_date, firstCallAct.due_time) : null;

    const callAnswered = callActs.some(a => a.done && durSeconds(a.duration) > 0);

    // First contact = earliest activity of any type
    const sortedAll = sortByTime(allActs);
    const firstContactTime = sortedAll[0] ? actTime(sortedAll[0].due_date, sortedAll[0].due_time) : null;

    let minutesToFirstCall: number | null = null;
    if (firstCallTime && lead.created_time) {
      const t1 = new Date(lead.created_time).getTime();
      const t2 = new Date(firstCallTime).getTime();
      if (!isNaN(t1) && !isNaN(t2) && t2 > t1) {
        minutesToFirstCall = Math.round((t2 - t1) / 60000);
      }
    }

    result.set(ek, {
      dealStage:          deal ? (stageMap[deal.stage_id] || `Stage ${deal.stage_id}`) : "",
      dealStatus:         deal?.status || "",
      dealValue:          deal?.value || 0,
      ownerName:          deal?.owner_name || "",
      wasCalled:          callActs.length > 0,
      callAnswered,
      firstCallTime,
      firstContactTime,
      minutesToFirstCall,
    });
  }

  return result;
}
