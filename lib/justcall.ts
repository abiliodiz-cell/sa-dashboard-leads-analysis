const JC_KEY    = process.env.JUSTCALL_API_KEY    || "124efc5c98d2228b11bd7b268cfb8bc04b9ba13b";
const JC_SECRET = process.env.JUSTCALL_API_SECRET || "36a55928b9b30ac64f75ec98c4c744d103086d03";
const BASE      = "https://api.justcall.io/v2";

// Basic auth: base64(key:secret)
function authHeader(): string {
  const token = Buffer.from(`${JC_KEY}:${JC_SECRET}`).toString("base64");
  return `Basic ${token}`;
}

interface JCCall {
  id: number;
  call_sid?: string;
  contact_number: string;
  contact_name?: string;
  contact_email: string;
  call_date: string;        // "YYYY-MM-DD"
  call_time: string;        // "HH:MM:SS"
  agent_name?: string;
  cost_incurred?: number;
  call_info: {
    direction: string;      // "Outgoing" | "Incoming"
    type: string;           // "answered" | "missed" | "voicemail" | ...
    disposition?: string;
    notes?: string;
    rating?: string;
    recording?: string;     // presigned-URL getter (redirects to audio)
  };
  call_duration: {
    total_duration: number; // seconds
  };
}

interface JCText {
  id: number;
  contact_number: string;
  contact_email: string;
  sms_date: string;         // "YYYY-MM-DD"
  sms_time: string;         // "HH:MM:SS"
  direction: string;        // "Outgoing" | "Incoming"
}

// A call only counts as an EFFECTIVE conversation if it lasted longer than this.
// Shorter connected calls are flagged as "called but not effective" to avoid
// counting voicemails / quick hang-ups as real conversations.
export const EFFECTIVE_CALL_SECONDS = 120; // 2 minutes

export interface JCEnrichment {
  wasCalled: boolean;
  callAnswered: boolean;        // true only if there was an EFFECTIVE call (>2min)
  callConnectedShort: boolean;  // a call connected but no call reached 2 min
  longestCallSec: number;       // longest call duration in seconds
  firstCallTime: string | null;     // ISO
  firstContactTime: string | null;  // ISO - earliest call or SMS
  minutesToFirstCall: number | null;
  totalCalls: number;
  agentName: string;
}

async function jcFetch<T>(path: string, maxPages = 20): Promise<T[]> {
  const items: T[] = [];
  // JustCall's "page" param is 0-indexed - page 0 is the most recent batch.
  // Starting at 1 (the old behaviour) silently skipped the newest 100 records.
  let page = 0;
  const perPage = 100;

  for (let i = 0; i < maxPages; i++) {
    const sep = path.includes("?") ? "&" : "?";
    const url = `${BASE}${path}${sep}per_page=${perPage}&page=${page}`;
    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        "Authorization": authHeader(),
        "Accept": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`JustCall HTTP ${res.status} at ${path}`);
    }

    const json = await res.json();
    if (json.status === "failed") {
      throw new Error(`JustCall: ${json.message}`);
    }

    const rows: T[] = Array.isArray(json.data) ? json.data : [];
    if (!rows.length) break;
    items.push(...rows);

    // Paginate: stop once we've collected everything.
    const fetched = items.length;
    if (fetched >= (json.total_count || 0)) break;
    page++;
  }
  return items;
}

function normEmail(e: string): string {
  return (e || "").toLowerCase().trim();
}
function normPhone(p: string): string {
  return (p || "").replace(/\D/g, "").slice(-9);
}
function toISO(date: string, time: string): string {
  if (!date) return "";
  return `${date}T${time || "00:00:00"}`;
}

export async function getJustCallEnrichments(
  leads: Array<{ email: string; phone: string; created_time: string }>
): Promise<Map<string, JCEnrichment>> {
  const result = new Map<string, JCEnrichment>(); // keyed by normalised email

  const [calls, texts] = await Promise.all([
    jcFetch<JCCall>("/calls", 15),
    jcFetch<JCText>("/texts", 3).catch(() => [] as JCText[]),
  ]);

  // Build lookup maps keyed by email (primary) and phone (fallback)
  type ContactKey = string;
  const emailToCalls = new Map<ContactKey, JCCall[]>();
  const phoneToCalls = new Map<ContactKey, JCCall[]>();

  for (const c of calls) {
    const ek = normEmail(c.contact_email);
    const pk = normPhone(c.contact_number);
    if (ek) {
      if (!emailToCalls.has(ek)) emailToCalls.set(ek, []);
      emailToCalls.get(ek)!.push(c);
    }
    if (pk.length >= 7) {
      if (!phoneToCalls.has(pk)) phoneToCalls.set(pk, []);
      phoneToCalls.get(pk)!.push(c);
    }
  }

  const emailToTexts = new Map<ContactKey, JCText[]>();
  const phoneToTexts = new Map<ContactKey, JCText[]>();
  for (const s of texts) {
    const ek = normEmail(s.contact_email);
    const pk = normPhone(s.contact_number);
    if (ek) {
      if (!emailToTexts.has(ek)) emailToTexts.set(ek, []);
      emailToTexts.get(ek)!.push(s);
    }
    if (pk.length >= 7) {
      if (!phoneToTexts.has(pk)) phoneToTexts.set(pk, []);
      phoneToTexts.get(pk)!.push(s);
    }
  }

  for (const lead of leads) {
    const ek = normEmail(lead.email);
    const pk = normPhone(lead.phone);

    const leadCalls = (ek ? emailToCalls.get(ek) : undefined)
                   || (pk ? phoneToCalls.get(pk) : undefined)
                   || [];

    const leadTexts = (ek ? emailToTexts.get(ek) : undefined)
                   || (pk ? phoneToTexts.get(pk) : undefined)
                   || [];

    if (!leadCalls.length && !leadTexts.length) continue;

    // Sort calls chronologically
    const sortedCalls = [...leadCalls].sort((a, b) =>
      toISO(a.call_date, a.call_time).localeCompare(toISO(b.call_date, b.call_time))
    );

    const firstCall    = sortedCalls[0];
    const firstCallISO = firstCall ? toISO(firstCall.call_date, firstCall.call_time) : null;

    const longestCallSec = sortedCalls.reduce(
      (mx, c) => Math.max(mx, c.call_duration?.total_duration || 0), 0
    );
    // Effective call = a real conversation longer than 2 minutes.
    const callAnswered = longestCallSec > EFFECTIVE_CALL_SECONDS;
    // Connected but short: a call exists / picked up but never reached 2 min.
    const callConnectedShort = !callAnswered && sortedCalls.some(c =>
      (c.call_info?.type || "").toLowerCase() === "answered" ||
      (c.call_duration?.total_duration || 0) > 0
    );

    // First contact = earliest of calls or texts
    const allTimes: number[] = [
      ...sortedCalls.map(c => new Date(toISO(c.call_date, c.call_time)).getTime()),
      ...leadTexts.map(s => new Date(toISO(s.sms_date, s.sms_time)).getTime()),
    ].filter(t => t > 0);

    const firstContactISO = allTimes.length
      ? new Date(Math.min(...allTimes)).toISOString()
      : firstCallISO;

    let minutesToFirstCall: number | null = null;
    if (firstCallISO && lead.created_time) {
      const t1 = new Date(lead.created_time).getTime();
      const t2 = new Date(firstCallISO).getTime();
      if (!isNaN(t1) && !isNaN(t2) && t2 > t1) {
        minutesToFirstCall = Math.round((t2 - t1) / 60000);
      }
    }

    const enrichment: JCEnrichment = {
      wasCalled:         leadCalls.length > 0,
      callAnswered,
      callConnectedShort,
      longestCallSec,
      firstCallTime:     firstCallISO,
      firstContactTime:  firstContactISO,
      minutesToFirstCall,
      totalCalls:        leadCalls.length,
      agentName:         firstCall?.agent_name || "",
    };

    if (ek) result.set(ek, enrichment);
  }

  return result;
}

// ---- Per-lead call detail (for the lead call-analysis modal) ----

export interface CallDetail {
  id: number;
  callSid: string;
  iso: string;            // ISO datetime of the call
  agentName: string;
  direction: string;      // Outgoing | Incoming
  type: string;           // answered | missed | voicemail | ...
  disposition: string;
  notes: string;
  durationSec: number;
  effective: boolean;     // > 2 min
  hasRecording: boolean;
  recordingUrl: string;   // presigned-URL getter (302 -> audio)
}

// Fetch only THIS contact's calls via the JustCall server-side filter, so we
// never have to pull the whole call history (which would time out the function).
export async function getCallsForContact(email: string, phone: string): Promise<CallDetail[]> {
  const digits = (phone || "").replace(/\D/g, "");
  const candidates: string[] = [];
  if (digits) {
    candidates.push(digits);          // e.g. 17148032642
    candidates.push("+" + digits);    // e.g. +17148032642
  }

  // NOTE: JustCall's /calls "page" param is 0-indexed for the contact_number
  // filter (page=1 returns the *second* page = empty). We fetch directly
  // starting at page 0. A single contact's call history fits in one page.
  async function fetchContactCalls(num: string): Promise<JCCall[]> {
    const out: JCCall[] = [];
    for (let page = 0; page < 5; page++) {
      const url = `${BASE}/calls?contact_number=${encodeURIComponent(num)}&per_page=100&page=${page}`;
      const res = await fetch(url, {
        cache: "no-store",
        headers: { Authorization: authHeader(), Accept: "application/json" },
      });
      if (!res.ok) break;
      const json = await res.json();
      const rows: JCCall[] = Array.isArray(json.data) ? json.data : [];
      if (!rows.length) break;
      out.push(...rows);
      if (out.length >= (json.total_count || 0)) break;
    }
    return out;
  }

  const byId = new Map<number, JCCall>();
  for (const num of candidates) {
    let rows: JCCall[] = [];
    try { rows = await fetchContactCalls(num); } catch { rows = []; }
    for (const r of rows) byId.set(r.id, r);
    if (byId.size) break; // first candidate that matches wins
  }

  // Already phone-filtered server-side. (JustCall /calls has no email filter.)
  const matched = Array.from(byId.values());

  return matched
    .map(c => {
      const dur = c.call_duration?.total_duration || 0;
      return {
        id: c.id,
        callSid: c.call_sid || "",
        iso: toISO(c.call_date, c.call_time),
        agentName: c.agent_name || "",
        direction: c.call_info?.direction || "",
        type: c.call_info?.type || "",
        disposition: c.call_info?.disposition || "",
        notes: c.call_info?.notes || "",
        durationSec: dur,
        effective: dur > EFFECTIVE_CALL_SECONDS,
        hasRecording: !!c.call_info?.recording,
        recordingUrl: c.call_info?.recording || "",
      } as CallDetail;
    })
    .sort((a, b) => a.iso.localeCompare(b.iso));
}
