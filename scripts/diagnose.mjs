/**
 * Diagnostic script - run with:  node scripts/diagnose.mjs
 * Shows: sheet data, Pipedrive deals, JustCall calls, and cross-match rates.
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);

const PD_TOKEN  = "85b1d6068f2d9b6c0071286b96e26fc137a19c88";
const JC_KEY    = "124efc5c98d2228b11bd7b268cfb8bc04b9ba13b";
const JC_SECRET = "36a55928b9b30ac64f75ec98c4c744d103086d03";
const SHEET_ID  = "1hRZXBG2F6U3Ae88fVj7CRspxo8PY6W-T";
const SHEET_GID = "1456952099";

const jcAuth = () => "Basic " + Buffer.from(`${JC_KEY}:${JC_SECRET}`).toString("base64");

// ── helpers ──────────────────────────────────────────────────────────────────
function normEmail(e) { return (e||"").toLowerCase().trim(); }
function normPhone(p) { return (p||"").replace(/\D/g,"").slice(-9); }

async function fetchJSON(url, headers = {}) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.json();
}

function parseCSV(text) {
  const rows = []; let cur = ""; let inQ = false; let row = [];
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') { if (inQ && text[i+1]==='"') { cur+='"'; i++; } else inQ=!inQ; }
    else if (c===',' && !inQ) { row.push(cur); cur=""; }
    else if ((c==='\n'||c==='\r') && !inQ) {
      if (c==='\r'&&text[i+1]==='\n') i++;
      row.push(cur); if (row.some(v=>v.trim())) rows.push(row); row=[]; cur="";
    } else cur+=c;
  }
  if (row.length||cur) { row.push(cur); if (row.some(v=>v.trim())) rows.push(row); }
  return rows;
}

// ── 1. Google Sheet ──────────────────────────────────────────────────────────
async function analyzeSheet() {
  console.log("\n=== GOOGLE SHEET ===");
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;
  const res = await fetch(url);
  const rows = parseCSV(await res.text());
  const headers = rows[0].map(h => h.trim().toLowerCase());
  const get = (row, col) => { const i = headers.indexOf(col); return i>=0 ? row[i]?.trim()||"" : ""; };

  const leads = rows.slice(1).filter(r => get(r,"id"));
  console.log(`Total leads: ${leads.length}`);

  // Date range
  const dates = leads.map(r => get(r,"created_time").slice(0,7)).filter(Boolean);
  const dateCounts = {};
  dates.forEach(d => dateCounts[d]=(dateCounts[d]||0)+1);
  console.log("By month:", dateCounts);

  // Owners
  const owners = {};
  leads.forEach(r => { const o = get(r,"owner")||"(unassigned)"; owners[o]=(owners[o]||0)+1; });
  console.log("Owners:", owners);

  // Countries
  const ctries = {};
  leads.forEach(r => { const c = get(r,"country")||"(none)"; ctries[c]=(ctries[c]||0)+1; });
  console.log("Countries:", Object.entries(ctries).sort((a,b)=>b[1]-a[1]).slice(0,10));

  // Sample emails + phones
  const emails = leads.slice(0,5).map(r => get(r,"email"));
  const phones = leads.slice(0,5).map(r => get(r,"phone"));
  console.log("Sample emails:", emails);
  console.log("Sample phones:", phones);

  return leads.map(r => ({
    email: normEmail(get(r,"email")),
    phone: normPhone(get(r,"phone")),
    date: get(r,"created_time").slice(0,10),
    owner: get(r,"owner"),
    country: get(r,"country"),
  }));
}

// ── 2. Pipedrive ─────────────────────────────────────────────────────────────
async function analyzePipedrive(sheetLeads) {
  console.log("\n=== PIPEDRIVE ===");

  // Fetch first 500 deals
  const d = await fetchJSON(`https://api.pipedrive.com/v1/deals?pipeline_id=16&limit=500&start=0&api_token=${PD_TOKEN}`);
  const deals = d.data || [];
  console.log(`Sample (first 500 of ~4532 deals):`);

  const stages = {};
  const statuses = {};
  const owners = {};
  const dealEmails = new Set();
  const dealPhones = new Set();

  for (const deal of deals) {
    const st = deal.stage_id; stages[st] = (stages[st]||0)+1;
    statuses[deal.status] = (statuses[deal.status]||0)+1;
    owners[deal.owner_name] = (owners[deal.owner_name]||0)+1;
    const p = deal.person_id;
    if (p) {
      (p.email||[]).forEach(e => e.value && dealEmails.add(normEmail(e.value)));
      (p.phone||[]).forEach(ph => ph.value && dealPhones.add(normPhone(ph.value)));
    }
  }

  console.log("Statuses (sample):", statuses);
  console.log("Owners (sample):", Object.entries(owners).sort((a,b)=>b[1]-a[1]).slice(0,8));
  console.log("Deal sample emails:", [...dealEmails].slice(0,5));

  // Cross-match with sheet
  const matched = sheetLeads.filter(l =>
    (l.email && dealEmails.has(l.email)) ||
    (l.phone && l.phone.length>=7 && [...dealPhones].some(p=>p===l.phone))
  );
  console.log(`Email/phone match rate (first 500 deals vs ${sheetLeads.length} sheet leads): ${matched.length} matches (${Math.round(matched.length/sheetLeads.length*100)}%)`);

  // Activities
  const acts = await fetchJSON(`https://api.pipedrive.com/v1/activities?limit=100&api_token=${PD_TOKEN}`);
  const actTypes = {};
  (acts.data||[]).forEach(a => { actTypes[a.type]=(actTypes[a.type]||0)+1; });
  console.log(`Activities (all, total ${acts.data?.length||0}):`, actTypes);

  // Notes sample
  const notes = await fetchJSON(`https://api.pipedrive.com/v1/notes?limit=5&api_token=${PD_TOKEN}`);
  console.log(`Notes sample (${notes.data?.length||0} returned):`);
  (notes.data||[]).slice(0,3).forEach(n =>
    console.log(`  - [${n.add_time?.slice(0,10)}] ${(n.content||"").slice(0,100)}`)
  );
}

// ── 3. JustCall ──────────────────────────────────────────────────────────────
async function analyzeJustCall(sheetLeads) {
  console.log("\n=== JUSTCALL ===");

  const d = await fetchJSON("https://api.justcall.io/v2/calls?per_page=100&page=1",
    { Authorization: jcAuth(), Accept: "application/json" });
  const calls = d.data || [];
  console.log(`Total calls: ${d.total_count}  (sampling first 100)`);

  // Date range
  const dates = calls.map(c => c.call_date?.slice(0,7)).filter(Boolean);
  const dateCounts = {};
  dates.forEach(d2 => dateCounts[d2]=(dateCounts[d2]||0)+1);
  console.log("By month (first 100):", dateCounts);

  // Call types
  const types = {};
  calls.forEach(c => { const t=c.call_info?.type||"?"; types[t]=(types[t]||0)+1; });
  console.log("Call types:", types);

  // Agents
  const agents = {};
  calls.forEach(c => { const a=c.agent_name||"?"; agents[a]=(agents[a]||0)+1; });
  console.log("Agents:", agents);

  // Emails
  const jcEmails = new Set(calls.map(c => normEmail(c.contact_email)).filter(e=>e&&e!=="0"));
  const jcPhones = new Set(calls.map(c => normPhone(c.contact_number)).filter(p=>p.length>=7));
  console.log("Sample JC emails:", [...jcEmails].slice(0,5));
  console.log("Sample JC phone prefixes:", [...jcPhones].slice(0,5));

  // Cross-match
  const matchedEmail = sheetLeads.filter(l => l.email && jcEmails.has(l.email));
  const matchedPhone = sheetLeads.filter(l => l.phone && jcPhones.has(l.phone));
  console.log(`Match vs sheet: email=${matchedEmail.length}, phone=${matchedPhone.length}`);
  if (matchedEmail.length > 0) console.log("Matched emails:", matchedEmail.slice(0,3).map(l=>l.email));
  if (matchedPhone.length > 0) console.log("Matched phones:", matchedPhone.slice(0,3).map(l=>l.phone));

  // Texts
  const t = await fetchJSON("https://api.justcall.io/v2/texts?per_page=5&page=1",
    { Authorization: jcAuth(), Accept: "application/json" });
  console.log(`Total SMS: ${t.total_count}`);
  (t.data||[]).slice(0,3).forEach(s =>
    console.log(`  SMS [${s.sms_date}] ${s.direction} from/to ${s.contact_number} email:${s.contact_email} - "${(s.sms_info?.body||"").slice(0,60)}"`)
  );
}

// ── main ─────────────────────────────────────────────────────────────────────
(async () => {
  try {
    const sheetLeads = await analyzeSheet();
    await analyzePipedrive(sheetLeads);
    await analyzeJustCall(sheetLeads);
    console.log("\n=== DONE ===");
  } catch (e) {
    console.error("Error:", e.message);
  }
})();
