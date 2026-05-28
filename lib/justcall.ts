const JUSTCALL_BASE = "https://api.justcall.io/v1";
const API_KEY = process.env.JUSTCALL_API_KEY!;
const API_SECRET = process.env.JUSTCALL_API_SECRET!;

// JustCall usa Basic Auth com api_key:api_secret
function authHeader(): string {
  return "Basic " + Buffer.from(`${API_KEY}:${API_SECRET}`).toString("base64");
}

export interface JustCallLog {
  id: string;
  call_sid: string;
  direction: "inbound" | "outbound";
  status: "completed" | "no-answer" | "busy" | "failed" | "voicemail" | "canceled";
  from: string;         // número de origem
  to: string;           // número de destino
  duration: number;     // segundos
  agent_name: string;
  agent_email: string;
  datetime: string;     // ISO timestamp
  recording_url?: string;
  notes?: string;
  contact_name?: string;
  disposition?: string; // etiqueta colocada pelo agente
}

export interface JustCallAgent {
  id: number;
  name: string;
  email: string;
  phone: string;
}

// Fetch call logs — suporta paginação automática
export async function getCallLogs(since?: string, limit = 1000): Promise<JustCallLog[]> {
  const logs: JustCallLog[] = [];
  let page = 1;
  const perPage = 100;

  while (logs.length < limit) {
    const params = new URLSearchParams({
      per_page: String(perPage),
      page: String(page),
      ...(since ? { from_datetime: since } : {}),
    });

    const res = await fetch(`${JUSTCALL_BASE}/calls/query?${params}`, {
      headers: {
        Authorization: authHeader(),
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      console.error("JustCall API error:", res.status, await res.text());
      break;
    }

    const data = await res.json();
    const items: any[] = data.data?.data || [];
    if (!items.length) break;

    items.forEach((item) => {
      logs.push({
        id: String(item.id),
        call_sid: item.call_sid || "",
        direction: item.direction === "Inbound" ? "inbound" : "outbound",
        status: normaliseStatus(item.call_type),
        from: item.from || "",
        to: item.to || "",
        duration: parseInt(item.duration || "0", 10),
        agent_name: item.agent_name || "",
        agent_email: item.agent_email || "",
        datetime: item.datetime || "",
        recording_url: item.recording_url || undefined,
        notes: item.call_notes || undefined,
        contact_name: item.contact_name || undefined,
        disposition: item.disposition_label || undefined,
      });
    });

    if (!data.data?.next_page_url) break;
    page++;
  }

  return logs;
}

function normaliseStatus(callType: string): JustCallLog["status"] {
  switch ((callType || "").toLowerCase()) {
    case "answered": return "completed";
    case "missed":
    case "no answer": return "no-answer";
    case "busy": return "busy";
    case "voicemail": return "voicemail";
    case "failed": return "failed";
    default: return "completed";
  }
}

// Fetch agents list
export async function getAgents(): Promise<JustCallAgent[]> {
  const res = await fetch(`${JUSTCALL_BASE}/users`, {
    headers: { Authorization: authHeader(), Accept: "application/json" },
  });
  const data = await res.json();
  return (data.data || []).map((u: any) => ({
    id: u.id,
    name: `${u.firstname} ${u.lastname}`.trim(),
    email: u.email,
    phone: u.phone || "",
  }));
}

// Build lookup: normalised phone → logs array (for matching with leads)
export function buildPhoneLookup(logs: JustCallLog[]): Record<string, JustCallLog[]> {
  const map: Record<string, JustCallLog[]> = {};
  for (const log of logs) {
    const numbers = [log.from, log.to].map(normalisePhone).filter(Boolean);
    for (const n of numbers) {
      if (!map[n]) map[n] = [];
      map[n].push(log);
    }
  }
  return map;
}

function normalisePhone(raw: string): string {
  return raw.replace(/[\s\-\(\)\.]/g, "").replace(/^\+/, "");
}
