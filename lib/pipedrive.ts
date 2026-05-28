const PD_BASE = `https://${process.env.PIPEDRIVE_DOMAIN}.pipedrive.com/api/v1`;
const TOKEN = process.env.PIPEDRIVE_API_TOKEN!;

export interface PipedriveDeal {
  id: number;
  title: string;
  status: string;
  stage_id: number;
  stage_name?: string;
  owner_name: string;
  person_id: number;
  person_name: string;
  person_phone: string;
  person_email: string;
  add_time: string;
  update_time: string;
  won_time?: string;
  lost_time?: string;
  close_time?: string;
  custom_fields?: Record<string, any>;
  // enriched
  first_activity_time?: string;
  activity_count?: number;
  email_opened?: boolean;
  activities?: PipedriveActivity[];
}

export interface PipedriveActivity {
  id: number;
  type: string; // call, email, meeting, task, etc.
  subject: string;
  done: boolean;
  due_date: string;
  due_time: string;
  add_time: string;
  marked_as_done_time?: string;
  duration?: string;
  note?: string;
  deal_id: number;
  person_id: number;
  user_id: number;
  owner_name?: string;
}

async function pdFetch(path: string, params: Record<string, string> = {}) {
  const url = new URL(`${PD_BASE}${path}`);
  url.searchParams.set("api_token", TOKEN);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  return res.json();
}

// Fetch all deals (paginated), optionally filtered by date
export async function getDeals(since?: string, limit = 500): Promise<PipedriveDeal[]> {
  const deals: PipedriveDeal[] = [];
  let start = 0;
  const pageSize = 100;

  while (deals.length < limit) {
    const data = await pdFetch("/deals", {
      status: "all_not_deleted",
      start: String(start),
      limit: String(pageSize),
      ...(since ? { start_time: since } : {}),
    });

    if (!data.data?.length) break;

    for (const d of data.data) {
      const person = d.person_id;
      deals.push({
        id: d.id,
        title: d.title,
        status: d.status,
        stage_id: d.stage_id,
        owner_name: d.owner_name,
        person_id: person?.value || 0,
        person_name: person?.name || d.title,
        person_phone: person?.phone?.[0]?.value || "",
        person_email: person?.email?.[0]?.value || "",
        add_time: d.add_time,
        update_time: d.update_time,
        won_time: d.won_time,
        lost_time: d.lost_time,
        close_time: d.close_time,
        activity_count: d.activities_count || 0,
        email_opened: d.email_messages_count > 0,
      });
    }

    if (!data.additional_data?.pagination?.more_items_in_collection) break;
    start += pageSize;
  }

  return deals;
}

// Fetch activities for a deal
export async function getDealActivities(dealId: number): Promise<PipedriveActivity[]> {
  const data = await pdFetch(`/deals/${dealId}/activities`, { limit: "50" });
  if (!data.data) return [];
  return data.data.map((a: any) => ({
    id: a.id,
    type: a.type,
    subject: a.subject,
    done: a.done,
    due_date: a.due_date,
    due_time: a.due_time,
    add_time: a.add_time,
    marked_as_done_time: a.marked_as_done_time,
    duration: a.duration,
    note: a.note,
    deal_id: a.deal_id,
    person_id: a.person_id,
    user_id: a.user_id,
    owner_name: a.owner_name,
  }));
}

// Fetch all activities across all deals (for timeline analysis)
export async function getAllActivities(since?: string): Promise<PipedriveActivity[]> {
  const activities: PipedriveActivity[] = [];
  let start = 0;

  while (true) {
    const data = await pdFetch("/activities", {
      start: String(start),
      limit: "100",
      ...(since ? { start_date: since.split("T")[0] } : {}),
    });

    if (!data.data?.length) break;
    activities.push(...data.data);
    if (!data.additional_data?.pagination?.more_items_in_collection) break;
    start += 100;
  }

  return activities;
}

// Get stages map
export async function getStages(): Promise<Record<number, string>> {
  const data = await pdFetch("/stages");
  const map: Record<number, string> = {};
  if (data.data) data.data.forEach((s: any) => (map[s.id] = s.name));
  return map;
}
