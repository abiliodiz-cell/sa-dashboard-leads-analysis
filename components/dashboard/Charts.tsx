"use client";
import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, CartesianGrid,
} from "recharts";
import { DashboardStats, EnrichedLead } from "@/lib/fusion";

const BLUE   = "#3b82f6";
const TEAL   = "#0891b2";
const INDIGO = "#6366f1";
const GREEN  = "#10b981";
const ORANGE = "#f97316";
const YELLOW = "#f59e0b";
const DANGER = "#ef4444";
const MUTED  = "#94a3b8";
const BORDER = "#e2e8f0";
const BG     = "#f8fafc";
const PALETTE = [BLUE, TEAL, INDIGO, "#8b5cf6", GREEN, ORANGE, "#ec4899", "#14b8a6"];

const CARD: React.CSSProperties = {
  background: "#ffffff",
  border: `1px solid ${BORDER}`,
  borderRadius: 14,
  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  padding: 20,
};

const LABEL: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: MUTED,
  marginBottom: 16,
};

const TT = {
  contentStyle: { background: "#0f172a", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 10, color: "#f8fafc", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.3)" },
  labelStyle:   { color: BLUE, fontWeight: 700 },
  cursor:       { fill: "rgba(59,130,246,0.05)" },
};

function Label({ children }: { children: React.ReactNode }) {
  return <p style={LABEL}>{children}</p>;
}

// ── DATE CHART ────────────────────────────────────────────────────────────────
export function DateChart({ data }: { data: DashboardStats["byDate"] }) {
  if (!data.length) return null;
  const fmt = (d: string) => !d ? "" : new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  return (
    <div style={CARD}>
      <Label>Leads Over Time</Label>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={BLUE} stopOpacity={0.25} />
              <stop offset="95%" stopColor={BLUE} stopOpacity={0}    />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={BORDER} />
          <XAxis dataKey="date" tick={{ fill: MUTED, fontSize: 11 }} tickFormatter={fmt}
            interval="preserveStartEnd" axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: MUTED, fontSize: 11 }} allowDecimals={false} axisLine={false} tickLine={false} />
          <Tooltip {...TT} labelFormatter={(d: any) => fmt(String(d))} />
          <Area type="monotone" dataKey="count" name="Leads" stroke={BLUE} strokeWidth={2.5}
            fill="url(#aGrad)" dot={false} activeDot={{ r: 5, fill: BLUE, stroke: "#fff", strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── HOUR CHART ────────────────────────────────────────────────────────────────
export function HourChart({ data }: { data: DashboardStats["byHour"] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div style={CARD}>
      <Label>Leads by Hour</Label>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barSize={9} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={BORDER} />
          <XAxis dataKey="hour" tick={{ fill: MUTED, fontSize: 10 }} tickFormatter={h => `${h}h`}
            axisLine={false} tickLine={false} interval={3} />
          <YAxis tick={{ fill: MUTED, fontSize: 10 }} allowDecimals={false} axisLine={false} tickLine={false} />
          <Tooltip {...TT} labelFormatter={h => `${h}:00`} />
          <Bar dataKey="count" name="Leads" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => <Cell key={i} fill={`rgba(59,130,246,${0.25 + (d.count / max) * 0.75})`} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── WEEKDAY CHART ─────────────────────────────────────────────────────────────
export function WeekdayChart({ data }: { data: DashboardStats["byWeekday"] }) {
  return (
    <div style={CARD}>
      <Label>Leads by Weekday</Label>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data.map(d => ({ ...d, day: d.day.slice(0, 3) }))}
          barSize={22} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={BORDER} />
          <XAxis dataKey="day" tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: MUTED, fontSize: 10 }} allowDecimals={false} axisLine={false} tickLine={false} />
          <Tooltip {...TT} />
          <Bar dataKey="count" name="Leads" fill={TEAL} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── AD PERFORMANCE ────────────────────────────────────────────────────────────
export function AdPerformanceChart({ data }: { data: DashboardStats["byAd"] }) {
  const top = data.slice(0, 10);
  if (!top.length) return null;
  return (
    <div style={CARD}>
      <Label>Top Ads by Volume</Label>
      <ResponsiveContainer width="100%" height={Math.max(200, top.length * 32)}>
        <BarChart data={top} layout="vertical" barSize={14}
          margin={{ top: 4, right: 16, left: 150, bottom: 0 }}>
          <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke={BORDER} />
          <XAxis type="number" tick={{ fill: MUTED, fontSize: 10 }} allowDecimals={false} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="ad_name" tick={{ fill: MUTED, fontSize: 10 }} width={0} axisLine={false} tickLine={false} />
          <Tooltip {...TT} />
          <Bar dataKey="leads" name="Leads" fill={BLUE} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── CAMPAIGN TABLE ────────────────────────────────────────────────────────────
export function CampaignTable({ data }: { data: DashboardStats["byCampaign"] }) {
  const hasSpend = data.some(r => r.spend > 0);
  return (
    <div style={CARD}>
      <Label>Campaign Summary</Label>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {["Campaign", "Leads", ...(hasSpend ? ["Spend", "CPL"] : [])].map(h => (
              <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: MUTED, borderBottom: `2px solid ${BORDER}` }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
              <td style={{ padding: "10px 12px", fontWeight: 500, color: "#334155" }}>{row.campaign}</td>
              <td style={{ padding: "10px 12px", fontWeight: 700, color: BLUE, fontFamily: "DM Mono, monospace" }}>{row.leads}</td>
              {hasSpend && <>
                <td style={{ padding: "10px 12px", fontWeight: 600, color: ORANGE, fontFamily: "DM Mono, monospace" }}>
                  {row.spend > 0 ? `$${row.spend.toFixed(0)}` : "-"}
                </td>
                <td style={{ padding: "10px 12px", fontWeight: 600, color: row.cpl > 0 ? GREEN : MUTED, fontFamily: "DM Mono, monospace" }}>
                  {row.cpl > 0 ? `$${row.cpl.toFixed(2)}` : "-"}
                </td>
              </>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── OWNER TABLE ───────────────────────────────────────────────────────────────
export function OwnerTable({ data }: { data: DashboardStats["byOwner"] }) {
  return (
    <div style={CARD}>
      <Label>Agent Performance</Label>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {["Agent", "Leads", "Called", "Answered", "Converted", "Rate"].map(h => (
              <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: MUTED, borderBottom: `2px solid ${BORDER}` }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => {
            const rate = row.leads ? Math.round((row.converted / row.leads) * 100) : 0;
            return (
              <tr key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
                <td style={{ padding: "10px 12px", fontWeight: 600, color: "#0f172a" }}>{row.owner}</td>
                <td style={{ padding: "10px 12px", fontWeight: 700, color: BLUE,  fontFamily: "DM Mono, monospace" }}>{row.leads}</td>
                <td style={{ padding: "10px 12px", fontWeight: 700, color: TEAL,  fontFamily: "DM Mono, monospace" }}>{row.called}</td>
                <td style={{ padding: "10px 12px", fontWeight: 700, color: INDIGO, fontFamily: "DM Mono, monospace" }}>{row.answered}</td>
                <td style={{ padding: "10px 12px", fontWeight: 700, color: GREEN, fontFamily: "DM Mono, monospace" }}>{row.converted}</td>
                <td style={{ padding: "10px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 60, height: 6, borderRadius: 3, background: BORDER }}>
                      <div style={{ height: "100%", borderRadius: 3, width: `${rate}%`, background: rate > 10 ? GREEN : YELLOW }} />
                    </div>
                    <span style={{ fontSize: 12, fontFamily: "DM Mono, monospace", color: MUTED }}>{rate}%</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── DONUT ─────────────────────────────────────────────────────────────────────
function DonutCard({ title, data, nameKey, countKey }: { title: string; data: any[]; nameKey: string; countKey: string }) {
  const top   = data.slice(0, 7);
  const total = top.reduce((s: number, x: any) => s + x[countKey], 0);
  return (
    <div style={CARD}>
      <Label>{title}</Label>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ flexShrink: 0 }}>
          <ResponsiveContainer width={160} height={160}>
            <PieChart>
              <Pie data={top} dataKey={countKey} nameKey={nameKey} cx="50%" cy="50%"
                outerRadius={72} innerRadius={40} strokeWidth={3} stroke="#fff">
                {top.map((_: any, i: number) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Pie>
              <Tooltip {...TT} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
          {top.map((r: any, i: number) => {
            const pct = total ? Math.round((r[countKey] / total) * 100) : 0;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: PALETTE[i % PALETTE.length], flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#334155", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r[nameKey]}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: PALETTE[i % PALETTE.length], fontFamily: "DM Mono, monospace" }}>{r[countKey]}</span>
                <span style={{ fontSize: 11, color: MUTED, fontFamily: "DM Mono, monospace", minWidth: 30, textAlign: "right" }}>{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function RegionChart({ data }: { data: DashboardStats["byRegion"] }) {
  return <DonutCard title="Leads by Country" data={data} nameKey="region" countKey="count" />;
}
export function PlatformChart({ data }: { data: DashboardStats["byPlatform"] }) {
  if (!data.length) return null;
  return <DonutCard title="Leads by Platform" data={data} nameKey="platform" countKey="count" />;
}

// ── STATUS CHART ──────────────────────────────────────────────────────────────
export function StatusChart({ data }: { data: DashboardStats["byStatus"] }) {
  if (!data.length) return null;
  const total = data.reduce((s, x) => s + x.count, 0);
  const color = (s: string) => {
    const l = s.toLowerCase();
    if (l.includes("won") || l.includes("convert")) return GREEN;
    if (l.includes("lost") || l.includes("cancel"))  return DANGER;
    if (l.includes("open") || l.includes("new"))     return BLUE;
    return YELLOW;
  };
  return (
    <div style={CARD}>
      <Label>Leads by Status</Label>
      <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
        {data.map((r, i) => {
          const pct = total ? Math.round((r.count / total) * 100) : 0;
          const c   = color(r.status);
          return (
            <div key={i}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5, fontWeight: 500 }}>
                <span style={{ color: "#334155" }}>{r.status || "Unknown"}</span>
                <span style={{ fontFamily: "DM Mono, monospace" }}>
                  <span style={{ color: c, fontWeight: 700 }}>{r.count}</span>
                  <span style={{ color: MUTED }}> ({pct}%)</span>
                </span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: BG }}>
                <div style={{ height: "100%", borderRadius: 4, width: `${pct}%`, background: c, transition: "width 0.6s ease" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── FORM ANSWERS ──────────────────────────────────────────────────────────────
export function FormAnswersPanel({ data }: { data: DashboardStats["formAnswersSummary"] }) {
  const qs = Object.entries(data).slice(0, 3);
  if (!qs.length) return null;
  return (
    <div style={CARD}>
      <Label>Form Answers</Label>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {qs.map(([question, answers]) => {
          const entries = Object.entries(answers).sort((a, b) => b[1] - a[1]).slice(0, 4);
          const total   = entries.reduce((s, [, n]) => s + n, 0);
          return (
            <div key={question}>
              <div style={{ fontSize: 11, fontWeight: 600, color: MUTED, marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={question}>{question}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {entries.map(([answer, count]) => {
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={answer}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                        <span style={{ color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "75%", fontWeight: 500 }}>{answer || "(empty)"}</span>
                        <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: BLUE }}>{pct}%</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: BORDER }}>
                        <div style={{ height: "100%", borderRadius: 3, width: `${pct}%`, background: "rgba(59,130,246,0.5)", transition: "width 0.4s ease" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── LEADS TABLE (paginated + searchable + sortable) ───────────────────────────
const PAGE_SIZE = 25;

type SortKey = "submitted_at" | "name" | "country" | "deal_stage" | "first_call_time" | "minutes_to_first_call";

function fmtDT(iso: string | null | undefined): { date: string; time: string } {
  if (!iso) return { date: "-", time: "-" };
  const d = new Date(iso);
  if (isNaN(d.getTime())) return { date: "-", time: "-" };
  return {
    date: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" }),
    time: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
  };
}

function stageBadge(s: string): React.CSSProperties {
  const l = (s || "").toLowerCase();
  if (l.includes("won"))                                       return { background: "#dcfce7", color: "#15803d" };
  if (l.includes("lost") || l.includes("cancel"))             return { background: "#fee2e2", color: "#dc2626" };
  if (l.includes("qualif") || l.includes("presentation") || l.includes("negotiat") || l.includes("commitment")) return { background: "#dbeafe", color: "#1d4ed8" };
  if (l.includes("contact"))                                  return { background: "#fef9c3", color: "#a16207" };
  return { background: "#f1f5f9", color: "#475569" };
}

export function LeadsTable({ data }: { data: EnrichedLead[] }) {
  const [search, setSearch] = useState("");
  const [page,   setPage]   = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>("submitted_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data.filter(l =>
      !q ||
      (l.name || "").toLowerCase().includes(q) ||
      (l.email || "").toLowerCase().includes(q) ||
      (l.country || "").toLowerCase().includes(q) ||
      (l.ad_name || "").toLowerCase().includes(q) ||
      (l.form_name || "").toLowerCase().includes(q) ||
      (l.deal_stage || "").toLowerCase().includes(q)
    );
  }, [data, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av: any = a[sortKey];
      let bv: any = b[sortKey];
      if (av == null) av = "";
      if (bv == null) bv = "";
      const cmp = typeof av === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageData   = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
    setPage(0);
  }

  function SortArrow({ k }: { k: SortKey }) {
    if (sortKey !== k) return <span style={{ color: "#cbd5e1", marginLeft: 3 }}>-</span>;
    return <span style={{ marginLeft: 3 }}>{sortDir === "asc" ? "^" : "v"}</span>;
  }

  const thStyle: React.CSSProperties = {
    textAlign: "left", padding: "10px 12px", fontSize: 10, fontWeight: 700,
    letterSpacing: "0.1em", textTransform: "uppercase" as const, color: MUTED,
    borderBottom: `2px solid ${BORDER}`, whiteSpace: "nowrap", cursor: "pointer",
    userSelect: "none",
  };

  return (
    <div style={{ ...CARD, padding: 0, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "16px 20px 12px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <p style={{ ...LABEL, margin: 0, flex: "0 0 auto" }}>All Leads ({filtered.length}{search ? ` of ${data.length}` : ""})</p>
        <div style={{ flex: 1, minWidth: 200 }}>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search name, country, ad, status..."
            style={{
              width: "100%", padding: "7px 12px", borderRadius: 8, border: `1px solid ${BORDER}`,
              fontSize: 13, fontFamily: "inherit", color: "#334155", outline: "none",
              background: BG,
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              <th style={thStyle} onClick={() => handleSort("name")}>Name <SortArrow k="name" /></th>
              <th style={thStyle} onClick={() => handleSort("country")}>Country <SortArrow k="country" /></th>
              <th style={{ ...thStyle, cursor: "default" }}>Form</th>
              <th style={{ ...thStyle, cursor: "default" }}>Campaign / Ad</th>
              <th style={thStyle} onClick={() => handleSort("submitted_at")}>Form Date <SortArrow k="submitted_at" /></th>
              <th style={{ ...thStyle, cursor: "default" }}>Time</th>
              <th style={thStyle} onClick={() => handleSort("first_call_time")}>1st Call <SortArrow k="first_call_time" /></th>
              <th style={{ ...thStyle, cursor: "default" }}>Call Time</th>
              <th style={{ ...thStyle, cursor: "default" }}>Answered</th>
              <th style={thStyle} onClick={() => handleSort("minutes_to_first_call")}>Response <SortArrow k="minutes_to_first_call" /></th>
              <th style={thStyle} onClick={() => handleSort("deal_stage")}>Stage <SortArrow k="deal_stage" /></th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((lead, i) => {
              const sub  = fmtDT(lead.submitted_at);
              const call = fmtDT(lead.first_call_time);
              const bs   = stageBadge(lead.deal_stage || "");
              const mins = lead.minutes_to_first_call;
              const respStr = mins == null ? "-" : mins < 60 ? `${mins}m` : `${Math.round(mins / 60)}h`;
              return (
                <tr key={i}
                  style={{ borderBottom: `1px solid ${BORDER}`, transition: "background 0.1s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = BG)}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "9px 12px", fontWeight: 600, maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#0f172a" }} title={lead.name}>{lead.name || "-"}</td>
                  <td style={{ padding: "9px 12px", color: "#334155", whiteSpace: "nowrap" }}>{lead.country || "-"}</td>
                  <td style={{ padding: "9px 12px", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: MUTED, fontSize: 12 }} title={lead.form_name}>{lead.form_name || "-"}</td>
                  <td style={{ padding: "9px 12px", maxWidth: 180, color: "#334155", fontSize: 12 }}>
                    {lead.campaign_name && <div style={{ fontSize: 10, color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={lead.campaign_name}>{lead.campaign_name}</div>}
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={lead.ad_name}>{lead.ad_name || "-"}</div>
                  </td>
                  <td style={{ padding: "9px 12px", fontFamily: "DM Mono, monospace", fontSize: 12, color: MUTED, whiteSpace: "nowrap" }}>{sub.date}</td>
                  <td style={{ padding: "9px 12px", fontFamily: "DM Mono, monospace", fontSize: 12, color: MUTED, whiteSpace: "nowrap" }}>{sub.time}</td>
                  <td style={{ padding: "9px 12px", fontFamily: "DM Mono, monospace", fontSize: 12, color: lead.first_call_time ? TEAL : MUTED, whiteSpace: "nowrap" }}>{call.date}</td>
                  <td style={{ padding: "9px 12px", fontFamily: "DM Mono, monospace", fontSize: 12, color: lead.first_call_time ? TEAL : MUTED, whiteSpace: "nowrap" }}>{call.time}</td>
                  <td style={{ padding: "9px 12px", textAlign: "center" }}>
                    {lead.was_called
                      ? <span style={{ fontSize: 12, fontWeight: 700, color: lead.call_answered ? GREEN : ORANGE }}>{lead.call_answered ? "Yes" : "No answer"}</span>
                      : <span style={{ fontSize: 12, color: MUTED }}>-</span>
                    }
                  </td>
                  <td style={{ padding: "9px 12px", fontFamily: "DM Mono, monospace", fontSize: 12, fontWeight: 700, color: mins == null ? MUTED : mins < 120 ? GREEN : mins < 1440 ? YELLOW : DANGER, whiteSpace: "nowrap" }}>{respStr}</td>
                  <td style={{ padding: "9px 12px", whiteSpace: "nowrap" }}>
                    <span style={{ ...bs, display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{lead.deal_stage || "-"}</span>
                  </td>
                </tr>
              );
            })}
            {pageData.length === 0 && (
              <tr><td colSpan={11} style={{ padding: "32px 12px", textAlign: "center", color: MUTED }}>No leads found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ padding: "12px 20px", borderTop: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: MUTED }}>
            Showing {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, sorted.length)} of {sorted.length}
          </span>
          <div style={{ display: "flex", gap: 4 }}>
            <PagBtn onClick={() => setPage(0)}         disabled={page === 0}             label="First" />
            <PagBtn onClick={() => setPage(p => p - 1)} disabled={page === 0}            label="Prev"  />
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = totalPages <= 7 ? i : Math.max(0, Math.min(page - 3, totalPages - 7)) + i;
              return (
                <button key={p} onClick={() => setPage(p)} style={{
                  padding: "5px 10px", borderRadius: 6, border: "none", cursor: "pointer",
                  fontSize: 12, fontWeight: page === p ? 700 : 400, fontFamily: "inherit",
                  background: page === p ? BLUE : "transparent",
                  color:      page === p ? "white" : MUTED,
                }}>{p + 1}</button>
              );
            })}
            <PagBtn onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1} label="Next"  />
            <PagBtn onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1} label="Last" />
          </div>
        </div>
      )}
    </div>
  );
}

function PagBtn({ onClick, disabled, label }: { onClick: () => void; disabled: boolean; label: string }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "5px 10px", borderRadius: 6, border: "none", cursor: disabled ? "default" : "pointer",
      fontSize: 12, fontFamily: "inherit", fontWeight: 500,
      background: "transparent", color: disabled ? "#cbd5e1" : MUTED,
    }}>{label}</button>
  );
}

// ── HEATMAP: form fills by hour x weekday ─────────────────────────────────────
const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function LeadsHeatmap({ data }: { data: DashboardStats["heatmap"] }) {
  const maxCount = Math.max(...data.map(d => d.count), 1);

  // Build grid: day -> hour -> count
  const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  data.forEach(d => { grid[d.weekday][d.hour] = d.count; });

  return (
    <div style={CARD}>
      <Label>Lead Arrival Heatmap (Weekday x Hour)</Label>
      <div style={{ overflowX: "auto" }}>
        <div style={{ display: "inline-block", minWidth: 600 }}>
          {/* Hour labels */}
          <div style={{ display: "flex", marginLeft: 38 }}>
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} style={{ width: 26, textAlign: "center", fontSize: 9, color: MUTED, fontFamily: "DM Mono, monospace", flexShrink: 0 }}>
                {h % 3 === 0 ? `${h}h` : ""}
              </div>
            ))}
          </div>
          {/* Rows */}
          {DAYS_SHORT.map((day, w) => (
            <div key={w} style={{ display: "flex", alignItems: "center", marginBottom: 3 }}>
              <div style={{ width: 34, fontSize: 11, color: MUTED, textAlign: "right", paddingRight: 6, fontWeight: 600 }}>{day}</div>
              {Array.from({ length: 24 }, (_, h) => {
                const count = grid[w][h];
                const intensity = count / maxCount;
                return (
                  <div key={h} title={`${day} ${h}:00 - ${count} leads`}
                    style={{
                      width: 23, height: 20, margin: 1, borderRadius: 3, flexShrink: 0,
                      background: count === 0
                        ? "#f1f5f9"
                        : `rgba(59,130,246,${0.15 + intensity * 0.85})`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 9, color: intensity > 0.5 ? "white" : MUTED,
                      fontFamily: "DM Mono, monospace", cursor: "default",
                    }}>
                    {count > 0 ? count : ""}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {/* Legend */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, justifyContent: "flex-end" }}>
        <span style={{ fontSize: 10, color: MUTED }}>Low</span>
        {[0.1, 0.3, 0.5, 0.7, 0.9].map(v => (
          <div key={v} style={{ width: 16, height: 16, borderRadius: 3, background: `rgba(59,130,246,${0.15 + v * 0.85})` }} />
        ))}
        <span style={{ fontSize: 10, color: MUTED }}>High</span>
      </div>
    </div>
  );
}

// ── RESPONSE TIME BY COUNTRY ──────────────────────────────────────────────────
export function ResponseTimeChart({ data }: { data: DashboardStats["responseTimeByCountry"] }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.avgMinutes), 1);
  const fmt = (m: number) => m < 60 ? `${m}m` : m < 1440 ? `${(m / 60).toFixed(1)}h` : `${(m / 1440).toFixed(1)}d`;
  const color = (m: number) => m < 120 ? GREEN : m < 1440 ? YELLOW : DANGER;

  return (
    <div style={CARD}>
      <Label>Avg Response Time by Country</Label>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {data.map((r, i) => {
          const pct = (r.avgMinutes / max) * 100;
          const c   = color(r.avgMinutes);
          return (
            <div key={i}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                <span style={{ fontWeight: 600, color: "#334155" }}>{r.country}</span>
                <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: c, fontWeight: 700 }}>{fmt(r.avgMinutes)}</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: BG }}>
                <div style={{ height: "100%", borderRadius: 4, width: `${pct}%`, background: c, transition: "width 0.5s" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── CALL ANSWERED RATE BY HOUR ────────────────────────────────────────────────
export function CallsHourChart({ data }: { data: DashboardStats["callsByHour"] }) {
  const chartData = data.map(d => ({
    hour: d.hour,
    total: d.total,
    rate: d.total ? Math.round((d.answered / d.total) * 100) : 0,
  })).filter(d => d.total > 0);

  if (!chartData.length) return null;

  return (
    <div style={CARD}>
      <Label>Call Answer Rate by Hour</Label>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barSize={9} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={BORDER} />
          <XAxis dataKey="hour" tick={{ fill: MUTED, fontSize: 10 }} tickFormatter={h => `${h}h`}
            axisLine={false} tickLine={false} interval={3} />
          <YAxis tick={{ fill: MUTED, fontSize: 10 }} allowDecimals={false} axisLine={false} tickLine={false} />
          <Tooltip {...TT} labelFormatter={h => `${h}:00`}
            formatter={(v: any, name: any) => [v, name === "total" ? "Calls" : "Answered"]} />
          <Bar dataKey="total"    name="total"    fill={`rgba(59,130,246,0.25)`} radius={[4, 4, 0, 0]} />
          <Bar dataKey="answered" name="answered" fill={GREEN}                   radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── RESPONSE TIME BUCKETS (donut) ─────────────────────────────────────────────
export function ResponseTimeBucketsChart({ leads }: { leads: EnrichedLead[] }) {
  const buckets = useMemo(() => {
    const b = [
      { name: "Under 1h",   count: 0, color: GREEN  },
      { name: "1 - 24h",    count: 0, color: YELLOW },
      { name: "1 - 3 days", count: 0, color: ORANGE },
      { name: "Over 3 days",count: 0, color: DANGER },
      { name: "Not called", count: 0, color: "#cbd5e1" },
    ];
    leads.forEach(l => {
      if (!l.was_called) { b[4].count++; return; }
      const m = l.minutes_to_first_call;
      if (m == null || m <= 0) { b[4].count++; return; }
      if      (m < 60)   b[0].count++;
      else if (m < 1440) b[1].count++;
      else if (m < 4320) b[2].count++;
      else               b[3].count++;
    });
    return b;
  }, [leads]);

  const total = leads.length;
  const data  = buckets.filter(b => b.count > 0);
  if (!data.length) return null;

  return (
    <div style={CARD}>
      <Label>Response Time Distribution</Label>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ flexShrink: 0 }}>
          <ResponsiveContainer width={150} height={150}>
            <PieChart>
              <Pie data={data} dataKey="count" nameKey="name" cx="50%" cy="50%"
                outerRadius={68} innerRadius={38} strokeWidth={3} stroke="#fff">
                {data.map((_: any, i: number) => <Cell key={i} fill={data[i].color} />)}
              </Pie>
              <Tooltip {...TT} formatter={(v: any, n: any) => [v, n]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 9 }}>
          {data.map((b, i) => {
            const pct = total ? Math.round((b.count / total) * 100) : 0;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: b.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#334155", flex: 1 }}>{b.name}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: b.color, fontFamily: "DM Mono, monospace" }}>{b.count}</span>
                <span style={{ fontSize: 11, color: MUTED, fontFamily: "DM Mono, monospace", minWidth: 30, textAlign: "right" }}>{pct}%</span>
              </div>
            );
          })}
          <div style={{ paddingTop: 6, borderTop: `1px solid ${BORDER}`, fontSize: 11, color: MUTED }}>
            {total} leads total
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ANSWER RATE BY COUNTRY ────────────────────────────────────────────────────
export function AnswerRateByCountryChart({ leads }: { leads: EnrichedLead[] }) {
  const data = useMemo(() => {
    const map: Record<string, { total: number; called: number; answered: number }> = {};
    leads.forEach(l => {
      const c = l.country || "Unknown";
      if (!map[c]) map[c] = { total: 0, called: 0, answered: 0 };
      map[c].total++;
      if (l.was_called)    map[c].called++;
      if (l.call_answered) map[c].answered++;
    });
    return Object.entries(map)
      .filter(([, v]) => v.total >= 3)
      .map(([country, v]) => ({
        country,
        leads: v.total,
        callRate:   v.total  ? Math.round(v.called    / v.total  * 100) : 0,
        answerRate: v.called ? Math.round(v.answered  / v.called * 100) : 0,
      }))
      .sort((a, b) => b.leads - a.leads)
      .slice(0, 8);
  }, [leads]);

  if (!data.length) return (
    <div style={CARD}>
      <Label>Call & Answer Rate by Country</Label>
      <p style={{ color: MUTED, fontSize: 13 }}>No call data available yet</p>
    </div>
  );

  return (
    <div style={CARD}>
      <Label>Call & Answer Rate by Country</Label>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {data.map((r, i) => (
          <div key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
              <span style={{ fontWeight: 600, color: "#334155" }}>{r.country}</span>
              <span style={{ color: MUTED, fontFamily: "DM Mono, monospace", fontSize: 11 }}>{r.leads} leads</span>
            </div>
            {[
              { label: "Called",    rate: r.callRate,   color: TEAL  },
              { label: "Answered",  rate: r.answerRate, color: GREEN },
            ].map(m => (
              <div key={m.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                <span style={{ fontSize: 10, color: MUTED, width: 54, flexShrink: 0 }}>{m.label}</span>
                <div style={{ flex: 1, height: 6, borderRadius: 3, background: BG }}>
                  <div style={{ height: "100%", borderRadius: 3, width: `${m.rate}%`, background: m.color, transition: "width 0.5s" }} />
                </div>
                <span style={{ fontSize: 11, fontFamily: "DM Mono, monospace", color: m.color, fontWeight: 700, minWidth: 28, textAlign: "right" }}>{m.rate}%</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── RESPONSE TIME BY AGENT ────────────────────────────────────────────────────
export function ResponseTimeByAgentChart({ leads }: { leads: EnrichedLead[] }) {
  const data = useMemo(() => {
    const map: Record<string, { sum: number; count: number }> = {};
    leads.forEach(l => {
      if (l.minutes_to_first_call == null || l.minutes_to_first_call <= 0) return;
      const a = l.owner || "Unassigned";
      if (!map[a]) map[a] = { sum: 0, count: 0 };
      map[a].sum   += l.minutes_to_first_call;
      map[a].count++;
    });
    return Object.entries(map)
      .map(([agent, v]) => ({ agent, avgMinutes: Math.round(v.sum / v.count), count: v.count }))
      .sort((a, b) => a.avgMinutes - b.avgMinutes);
  }, [leads]);

  if (!data.length) return null;

  const max = Math.max(...data.map(d => d.avgMinutes), 1);
  const fmt = (m: number) => m < 60 ? `${m}m` : m < 1440 ? `${(m / 60).toFixed(1)}h` : `${(m / 1440).toFixed(1)}d`;
  const col = (m: number) => m < 120 ? GREEN : m < 1440 ? YELLOW : DANGER;

  return (
    <div style={CARD}>
      <Label>Avg Response Time by Agent</Label>
      <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
        {data.map((r, i) => {
          const pct = (r.avgMinutes / max) * 100;
          const c   = col(r.avgMinutes);
          return (
            <div key={i}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                <span style={{ fontWeight: 600, color: "#334155" }}>{r.agent}</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: MUTED }}>{r.count} calls</span>
                  <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: c, fontWeight: 700 }}>{fmt(r.avgMinutes)}</span>
                </div>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: BG }}>
                <div style={{ height: "100%", borderRadius: 4, width: `${pct}%`, background: c, transition: "width 0.5s" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── LEAD SHARE BY WEEKDAY (donut) ─────────────────────────────────────────────
export function WeekdayDonutChart({ data }: { data: DashboardStats["byWeekday"] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  const pieData = data.map((d, i) => ({ name: d.day.slice(0, 3), count: d.count, color: PALETTE[i % PALETTE.length] }))
    .filter(d => d.count > 0);

  if (!pieData.length) return null;
  return (
    <div style={CARD}>
      <Label>Lead Share by Day of Week</Label>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ flexShrink: 0 }}>
          <ResponsiveContainer width={150} height={150}>
            <PieChart>
              <Pie data={pieData} dataKey="count" nameKey="name" cx="50%" cy="50%"
                outerRadius={68} innerRadius={38} strokeWidth={3} stroke="#fff">
                {pieData.map((_, i) => <Cell key={i} fill={pieData[i].color} />)}
              </Pie>
              <Tooltip {...TT} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
          {pieData.map((d, i) => {
            const pct = total ? Math.round((d.count / total) * 100) : 0;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#334155", flex: 1 }}>{d.name}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: d.color, fontFamily: "DM Mono, monospace" }}>{d.count}</span>
                <span style={{ fontSize: 11, color: MUTED, fontFamily: "DM Mono, monospace", minWidth: 28, textAlign: "right" }}>{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── PLATFORM DONUT ────────────────────────────────────────────────────────────
export function StatusDonutChart({ data }: { data: DashboardStats["byStatus"] }) {
  if (!data.length) return null;
  const total = data.reduce((s, x) => s + x.count, 0);
  const COLOR = (s: string) => {
    const l = s.toLowerCase();
    if (l.includes("won") || l.includes("convert")) return GREEN;
    if (l.includes("lost"))  return DANGER;
    if (l.includes("open") || l.includes("new"))    return BLUE;
    return YELLOW;
  };
  const pieData = data.slice(0, 7).map(d => ({ ...d, color: COLOR(d.status) }));
  return (
    <div style={CARD}>
      <Label>Deal Status Breakdown</Label>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ flexShrink: 0 }}>
          <ResponsiveContainer width={150} height={150}>
            <PieChart>
              <Pie data={pieData} dataKey="count" nameKey="status" cx="50%" cy="50%"
                outerRadius={68} innerRadius={38} strokeWidth={3} stroke="#fff">
                {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip {...TT} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
          {pieData.map((d, i) => {
            const pct = total ? Math.round((d.count / total) * 100) : 0;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#334155", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.status || "Unknown"}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: d.color, fontFamily: "DM Mono, monospace" }}>{d.count}</span>
                <span style={{ fontSize: 11, color: MUTED, fontFamily: "DM Mono, monospace", minWidth: 28, textAlign: "right" }}>{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── LEGACY STUBS ──────────────────────────────────────────────────────────────
export function TimeToContactChart({ data }: { data: any }) { return null; }
export function CallsByHourChart({ data }: { data: any }) { return null; }
export function CallDispositionsChart({ data }: { data: any }) { return null; }
