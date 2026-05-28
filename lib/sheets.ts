const SHEET_ID  = process.env.SHEET_ID  || "1XAoHV7qKn9IkLx1p28AQnzAnaeV7pQ6nbcBMfGNeyq4";
const SHEET_GID = process.env.SHEET_GID || "";

export interface SheetLead {
  id: string;
  created_time: string;
  ad_id: string;
  ad_name: string;
  adset_id: string;
  adset_name: string;
  campaign_id: string;
  campaign_name: string;
  form_id: string;
  form_name: string;
  is_organic: string;
  platform: string;
  answers: Record<string, string>;
  email: string;
  full_name: string;
  phone: string;
  job_title: string;
  organization_name: string;
  deal_title: string;
  country: string;
  owner: string;
  status: string;
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (c === "," && !inQuotes) {
      row.push(current); current = "";
    } else if ((c === "\n" || c === "\r") && !inQuotes) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(current);
      if (row.some((v) => v.trim())) rows.push(row);
      row = []; current = "";
    } else {
      current += c;
    }
  }
  if (row.length || current) {
    row.push(current);
    if (row.some((v) => v.trim())) rows.push(row);
  }
  return rows;
}

// Numeric-only strings are Pipedrive user IDs not resolved - treat as unassigned
function cleanOwner(o: string): string {
  if (!o || /^\d+$/.test(o.trim())) return "";
  return o.trim();
}

export async function getSheetLeads(since?: string): Promise<SheetLead[]> {
  const gidParam = SHEET_GID ? `&gid=${SHEET_GID}` : "";
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv${gidParam}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch Google Sheet: ${res.status}`);

  const rows = parseCSV(await res.text());
  if (rows.length < 2) return [];

  const rawHeaders = rows[0];
  const headers = rawHeaders.map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));

  const col = (name: string) =>
    headers.findIndex((h) => h === name.toLowerCase().replace(/\s+/g, "_"));

  const iId        = col("id");
  const iCreated   = col("created_time");
  const iAdId      = col("ad_id");
  const iAdName    = col("ad_name");
  const iAdsetId   = col("adset_id");
  const iAdsetName = col("adset_name");
  const iCampId    = col("campaign_id");
  const iCampName  = col("campaign_name");
  const iFormId    = col("form_id");
  const iFormName  = col("form_name");
  const iOrganic   = col("is_organic");
  const iPlatform  = col("platform");
  const iEmail     = col("email");
  const iFullName  = headers.findIndex((h) => h.includes("full") && h.includes("name"));
  const iPhone     = col("phone");
  const iJobTitle  = headers.findIndex((h) => h.includes("job") && h.includes("title"));
  const iOrgName   = headers.findIndex((h) => h.includes("organ") && (h.includes("name") || h.includes("izat")));
  const iDealTitle = headers.findIndex((h) => h.includes("deal") && h.includes("title"));
  const iCountry   = col("country");
  const iOwner     = col("owner");
  const iStatus    = col("status");

  // Dynamic qualification columns: between platform and email
  const qualStart = iPlatform + 1;
  const qualEnd   = iEmail > iPlatform ? iEmail : headers.length;
  const qualLabels = rawHeaders.slice(qualStart, qualEnd).map((h) => h.trim()).filter(Boolean);

  const get = (row: string[], i: number) => (i >= 0 ? row[i]?.trim() || "" : "");

  const leads: SheetLead[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!get(row, iId)) continue;

    const created_time = get(row, iCreated);
    if (since && created_time && created_time < since) continue;

    const answers: Record<string, string> = {};
    let qi = 0;
    for (let c = qualStart; c < qualEnd; c++) {
      const label = rawHeaders[c]?.trim();
      const val   = row[c]?.trim();
      if (label && val) answers[label] = val;
      qi++;
    }
    void qi;

    leads.push({
      id:                get(row, iId),
      created_time,
      ad_id:             get(row, iAdId),
      ad_name:           get(row, iAdName),
      adset_id:          get(row, iAdsetId),
      adset_name:        get(row, iAdsetName),
      campaign_id:       get(row, iCampId),
      campaign_name:     get(row, iCampName),
      form_id:           get(row, iFormId),
      form_name:         get(row, iFormName),
      is_organic:        get(row, iOrganic),
      platform:          get(row, iPlatform),
      answers,
      email:             get(row, iEmail),
      full_name:         get(row, iFullName),
      phone:             get(row, iPhone),
      job_title:         get(row, iJobTitle),
      organization_name: get(row, iOrgName),
      deal_title:        get(row, iDealTitle),
      country:           get(row, iCountry),
      owner:             cleanOwner(get(row, iOwner)),
      status:            get(row, iStatus),
    });
  }

  return leads;
}
