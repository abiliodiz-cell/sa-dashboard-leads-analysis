const JC_KEY    = process.env.JUSTCALL_API_KEY    || "a0446b0c0f435eec2819f66afdd74da1cba334e0";
const JC_SECRET = process.env.JUSTCALL_API_SECRET || "8d25832a131e74eb5f22692b17ba63e3fc964503";
const BASE      = "https://api.justcall.io/v2";

interface JCCall {
  id: number | string;
  contact_number: string;  // phone number of the contact
  contact_name?: string;
  call_date: string;       // ISO or unix timestamp
  direction: number | string;  // 1=inbound, 2=outbound, or "inbound"/"outbound"
  duration: number;        // seconds
  call_status: string;     // answered, missed, voicemail, busy, failed
  agent_name?: string;
  notes?: string;
}

interface JCSms {
  id: number | string;
  contact_number: string;
  message_date: string;
  direction: number | string;
  agent_name?: string;
}

export interface JCEnrichment {
  wasCalled: boolean;
  callAnswered: boolean;
  firstCallTime: string | null;
  firstContactTime: string | null;
  minutesToFirstCall: number | null;
  totalCalls: number;
  lastCallStatus: string;
}

function normPhone(p: string): string {
  return p.replace(/\D/g, "").slice(-9);
}

async function jcFetch<T>(path: string): Promise<T[]> {
  const items: T[] = [];
  let page = 1;
  const perPage = 100;

  for (let attempt = 0; attempt < 50; attempt++) {
    const url = `${BASE}${path}${path.includes("?") ? "&" : "?"}per_page=${perPage}&page=${page}`;
    const res  = await fetch(url, {
      cache: "no-store",
      headers: {
        "apikey":    JC_KEY,
        "apisecret": JC_SECRET,
        "Accept":    "application/json",
      },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`JustCall API error ${res.status}: ${body.slice(0, 200)}`);
    }

    const json = await res.json();
    if (json.status === "failed") {
      throw new Error(`JustCall API: ${json.message}`);
    }

    // v2 response shape: { status, data: { count, has_next, data: [...] } }
    const rows: T[] = json?.data?.data || json?.data || [];
    if (!Array.isArray(rows) || rows.length === 0) break;
    items.push(...rows);

    const hasNext = json?.data?.has_next;
    if (!hasNext) break;
    page++;
  }
  return items;
}

function parseDate(val: string | number | undefined): Date | null {
  if (!val) return null;
  const d = typeof val === "number" ? new Date(val * 1000) : new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

export async function getJustCallEnrichments(
  leads: Array<{ phone: string; created_time: string }>
): Promise<Map<string, JCEnrichment>> {
  const result = new Map<string, JCEnrichment>();

  // Fetch calls and SMS in parallel
  const [calls, smsList] = await Promise.all([
    jcFetch<JCCall>("/calls/list"),
    jcFetch<JCSms>("/texts/list").catch(() => [] as JCSms[]),  // texts optional
  ]);

  // Build phone -> calls map
  const phoneToCalls  = new Map<string, JCCall[]>();
  const phoneToSms    = new Map<string, JCSms[]>();

  for (const c of calls) {
    const key = normPhone(c.contact_number || "");
    if (!key || key.length < 7) continue;
    if (!phoneToCalls.has(key)) phoneToCalls.set(key, []);
    phoneToCalls.get(key)!.push(c);
  }
  for (const s of smsList) {
    const key = normPhone(s.contact_number || "");
    if (!key || key.length < 7) continue;
    if (!phoneToSms.has(key)) phoneToSms.set(key, []);
    phoneToSms.get(key)!.push(s);
  }

  for (const lead of leads) {
    const pk = normPhone(lead.phone || "");
    if (!pk || pk.length < 7) continue;

    const leadCalls = phoneToCalls.get(pk) || [];
    const leadSms   = phoneToSms.get(pk)   || [];

    if (!leadCalls.length && !leadSms.length) continue;

    // Sort calls by date
    const sortedCalls = [...leadCalls].sort((a, b) => {
      const da = parseDate(a.call_date)?.getTime() || 0;
      const db = parseDate(b.call_date)?.getTime() || 0;
      return da - db;
    });

    const firstCall    = sortedCalls[0];
    const firstCallDt  = firstCall ? parseDate(firstCall.call_date) : null;
    const firstCallIso = firstCallDt?.toISOString() || null;

    const callAnswered = sortedCalls.some(c => {
      const s = (c.call_status || "").toLowerCase();
      return s === "answered" || (s !== "missed" && s !== "voicemail" && s !== "busy" && s !== "failed" && c.duration > 0);
    });

    // First contact = earliest of calls or SMS
    const allTimes: number[] = [
      ...sortedCalls.map(c => parseDate(c.call_date)?.getTime() || 0),
      ...leadSms.map(s    => parseDate(s.message_date)?.getTime() || 0),
    ].filter(t => t > 0);
    const firstContactTime = allTimes.length
      ? new Date(Math.min(...allTimes)).toISOString()
      : firstCallIso;

    let minutesToFirstCall: number | null = null;
    if (firstCallIso && lead.created_time) {
      const t1 = new Date(lead.created_time).getTime();
      const t2 = new Date(firstCallIso).getTime();
      if (!isNaN(t1) && !isNaN(t2) && t2 > t1) {
        minutesToFirstCall = Math.round((t2 - t1) / 60000);
      }
    }

    result.set(pk, {
      wasCalled:         leadCalls.length > 0,
      callAnswered,
      firstCallTime:     firstCallIso,
      firstContactTime,
      minutesToFirstCall,
      totalCalls:        leadCalls.length,
      lastCallStatus:    sortedCalls.at(-1)?.call_status || "",
    });
  }

  return result;
}
