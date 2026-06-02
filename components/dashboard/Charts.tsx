"use client";
import { useState, useMemo, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, CartesianGrid,
  ScatterChart, Scatter, ZAxis, LabelList,
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
  const [selectedLead, setSelectedLead] = useState<EnrichedLead | null>(null);

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
        <span style={{ fontSize: 10, color: MUTED, flex: "0 0 auto" }} title="A call only counts as effective (Answered = Yes) if it lasted over 2 minutes. Shorter connected calls show as Called* (not effective).">
          <span style={{ color: ORANGE, fontWeight: 700 }}>Called*</span> = connected under 2 min (not effective)
        </span>
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
              <th style={thStyle} onClick={() => handleSort("name")}>Name / Company <SortArrow k="name" /></th>
              <th style={thStyle} onClick={() => handleSort("country")}>Country <SortArrow k="country" /></th>
              <th style={{ ...thStyle, cursor: "default" }}>Campaign / Ad</th>
              <th style={thStyle} onClick={() => handleSort("submitted_at")}>Form Date <SortArrow k="submitted_at" /></th>
              <th style={thStyle} onClick={() => handleSort("first_call_time")}>1st Call <SortArrow k="first_call_time" /></th>
              <th style={{ ...thStyle, cursor: "default" }}>Answered</th>
              <th style={thStyle} onClick={() => handleSort("minutes_to_first_call")}>Response <SortArrow k="minutes_to_first_call" /></th>
              <th style={thStyle} onClick={() => handleSort("deal_stage")}>Stage <SortArrow k="deal_stage" /></th>
              <th style={{ ...thStyle, cursor: "default" }}>CPL</th>
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
                  style={{ borderBottom: `1px solid ${BORDER}`, transition: "background 0.1s", cursor: "pointer" }}
                  onClick={() => setSelectedLead(lead)}
                  title="Click to view call analysis"
                  onMouseEnter={e => (e.currentTarget.style.background = BG)}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>

                  {/* Name + company + job title + LinkedIn */}
                  <td style={{ padding: "9px 12px", maxWidth: 180 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={lead.name}>
                          {lead.name || "-"}
                        </div>
                        {(lead.organization_name || lead.job_title) && (
                          <div style={{ fontSize: 11, color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}
                            title={[lead.organization_name, lead.job_title].filter(Boolean).join(" - ")}>
                            {lead.organization_name || lead.job_title}
                          </div>
                        )}
                      </div>
                      {lead.linkedin_url && (
                        <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer"
                          title="Search on LinkedIn"
                          style={{ flexShrink: 0, color: "#0a66c2", opacity: 0.75, marginTop: 1 }}
                          onClick={e => e.stopPropagation()}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                        </a>
                      )}
                    </div>
                  </td>

                  <td style={{ padding: "9px 12px", color: "#334155", whiteSpace: "nowrap" }}>{lead.country || "-"}</td>
                  <td style={{ padding: "9px 12px", maxWidth: 180, color: "#334155", fontSize: 12 }}>
                    {lead.campaign_name && <div style={{ fontSize: 10, color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={lead.campaign_name}>{lead.campaign_name}</div>}
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={lead.ad_name}>{lead.ad_name || "-"}</div>
                  </td>
                  <td style={{ padding: "9px 12px", whiteSpace: "nowrap" }}>
                    <div style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: MUTED }}>{sub.date}</div>
                    <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: "#cbd5e1" }}>{sub.time}</div>
                  </td>
                  <td style={{ padding: "9px 12px", whiteSpace: "nowrap" }}>
                    <div style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: lead.first_call_time ? TEAL : MUTED }}>{call.date}</div>
                    <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: lead.first_call_time ? "rgba(8,145,178,0.6)" : "#cbd5e1" }}>{call.time}</div>
                  </td>
                  <td style={{ padding: "9px 12px", textAlign: "center" }}>
                    {(() => {
                      if (!lead.was_called) return <span style={{ fontSize: 12, color: MUTED }}>-</span>;
                      const dur = lead.longest_call_sec || 0;
                      const durStr = dur >= 60 ? `${Math.floor(dur / 60)}m${dur % 60 ? ` ${dur % 60}s` : ""}` : `${dur}s`;
                      if (lead.call_answered) {
                        // Effective call > 2 min
                        return (
                          <div title={`Effective call - longest ${durStr}`}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: GREEN }}>Yes</div>
                            <div style={{ fontSize: 10, color: MUTED, fontFamily: "DM Mono, monospace" }}>{durStr}</div>
                          </div>
                        );
                      }
                      if (lead.call_connected_short) {
                        // Connected but under 2 min - not an effective conversation
                        return (
                          <div title={`Called but NOT an effective call (under 2 min) - longest ${durStr}`}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: ORANGE }}>Called*</div>
                            <div style={{ fontSize: 10, color: ORANGE, fontFamily: "DM Mono, monospace" }}>{durStr} &middot; not eff.</div>
                          </div>
                        );
                      }
                      // Called but never picked up
                      return <span style={{ fontSize: 12, fontWeight: 700, color: MUTED }} title="Called - no answer">No ans.</span>;
                    })()}
                  </td>
                  <td style={{ padding: "9px 12px", fontFamily: "DM Mono, monospace", fontSize: 12, fontWeight: 700, color: mins == null ? MUTED : mins < 120 ? GREEN : mins < 1440 ? YELLOW : DANGER, whiteSpace: "nowrap" }}>{respStr}</td>
                  <td style={{ padding: "9px 12px", whiteSpace: "nowrap" }}>
                    <span style={{ ...bs, display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{lead.deal_stage || "-"}</span>
                  </td>
                  <td style={{ padding: "9px 12px", fontFamily: "DM Mono, monospace", fontSize: 12, fontWeight: 700, color: lead.lead_cost > 0 ? ORANGE : MUTED, whiteSpace: "nowrap" }}>
                    {lead.lead_cost > 0 ? `$${lead.lead_cost.toFixed(2)}` : "-"}
                  </td>
                </tr>
              );
            })}
            {pageData.length === 0 && (
              <tr><td colSpan={9} style={{ padding: "32px 12px", textAlign: "center", color: MUTED }}>No leads found</td></tr>
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

      {selectedLead && (
        <LeadCallModal lead={selectedLead} onClose={() => setSelectedLead(null)} />
      )}
    </div>
  );
}

// ── LEAD CALL ANALYSIS MODAL ────────────────────────────────────────────────
interface CallDetailUI {
  id: number; callSid: string; iso: string; agentName: string;
  direction: string; type: string; disposition: string; notes: string;
  durationSec: number; effective: boolean; hasRecording: boolean; recordingUrl: string;
}
interface CallAnalysisResp {
  calls?: CallDetailUI[]; transcript?: string; analysis?: string;
  note?: string; error?: string;
  analyzedCall?: { id: number; durationSec: number; agentName: string; iso: string };
}

function fmtDuration(s: number): string {
  const m = Math.floor(s / 60), r = s % 60;
  return m ? `${m}m ${r}s` : `${r}s`;
}

// Minimal markdown renderer for the AI analysis (## headers + bullet/plain lines).
function AnalysisMarkdown({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div style={{ fontSize: 13, lineHeight: 1.6, color: "#334155" }}>
      {lines.map((ln, i) => {
        const t = ln.trim();
        if (!t) return <div key={i} style={{ height: 6 }} />;
        if (t.startsWith("## ")) return <div key={i} style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: TEAL, marginTop: 14, marginBottom: 4 }}>{t.slice(3)}</div>;
        if (t.startsWith("# "))  return <div key={i} style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginTop: 12, marginBottom: 4 }}>{t.slice(2)}</div>;
        const bullet = t.startsWith("- ") || t.startsWith("* ");
        const content = bullet ? t.slice(2) : t;
        // bold **...**
        const parts = content.split(/(\*\*[^*]+\*\*)/g);
        return (
          <div key={i} style={{ display: "flex", gap: 6, marginBottom: 3, paddingLeft: bullet ? 6 : 0 }}>
            {bullet && <span style={{ color: TEAL, flexShrink: 0 }}>•</span>}
            <span>{parts.map((p, j) => p.startsWith("**") && p.endsWith("**")
              ? <strong key={j} style={{ color: "#0f172a" }}>{p.slice(2, -2)}</strong>
              : <span key={j}>{p}</span>)}</span>
          </div>
        );
      })}
    </div>
  );
}

function LeadCallModal({ lead, onClose }: { lead: EnrichedLead; onClose: () => void }) {
  const [loading, setLoading]   = useState(true);
  const [resp, setResp]         = useState<CallAnalysisResp | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setResp(null);
    fetch("/api/call-analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: lead.email, phone: lead.phone, name: lead.name }),
    })
      .then(r => r.json())
      .then(j => { if (!cancelled) { setResp(j); setLoading(false); } })
      .catch(e => { if (!cancelled) { setResp({ error: e.message || "Request failed" }); setLoading(false); } });
    return () => { cancelled = true; };
  }, [lead.email, lead.phone, lead.name]);

  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const calls = resp?.calls || [];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 10000,
        background: "rgba(15,23,42,0.55)", backdropFilter: "blur(2px)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "40px 16px", overflowY: "auto",
      }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 16, width: "100%", maxWidth: 720,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)", overflow: "hidden",
        }}>
        {/* Header */}
        <div style={{ padding: "18px 22px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#0f172a" }}>{lead.name || "Lead"}</div>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>
              {[lead.organization_name, lead.country, lead.email].filter(Boolean).join(" · ")}
            </div>
          </div>
          <button onClick={onClose} style={{
            border: "none", background: BG, borderRadius: 8, width: 30, height: 30,
            cursor: "pointer", fontSize: 16, color: MUTED, flexShrink: 0,
          }}>×</button>
        </div>

        <div style={{ padding: "18px 22px", maxHeight: "70vh", overflowY: "auto" }}>
          {/* Call timeline */}
          <div style={{ ...LABEL, marginBottom: 10 }}>Call Timeline {calls.length ? `(${calls.length})` : ""}</div>
          {loading && !calls.length && (
            <div style={{ fontSize: 13, color: MUTED, padding: "8px 0" }}>Loading calls...</div>
          )}
          {!loading && !calls.length && (
            <div style={{ fontSize: 13, color: MUTED, padding: "8px 0" }}>{resp?.note || "No calls found for this lead."}</div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {calls.map(c => {
              const dt = fmtDT(c.iso);
              const badge = c.effective
                ? { bg: "rgba(16,185,129,0.1)", fg: GREEN, txt: "Effective" }
                : c.durationSec > 0
                  ? { bg: "rgba(249,115,22,0.1)", fg: ORANGE, txt: "Connected <2m (not eff.)" }
                  : { bg: BG, fg: MUTED, txt: "No answer" };
              return (
                <div key={c.id} style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: "#334155" }}>{dt.date} {dt.time}</span>
                    <span style={{ fontSize: 11, color: MUTED }}>· {c.direction || "-"} · {c.agentName || "-"}</span>
                    <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{fmtDuration(c.durationSec)}</span>
                    <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: badge.bg, color: badge.fg }}>{badge.txt}</span>
                  </div>
                  {c.disposition && <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>Disposition: {c.disposition}</div>}
                  {c.hasRecording && (
                    <audio controls preload="none" src={c.recordingUrl} style={{ width: "100%", height: 34, marginTop: 8 }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* AI analysis */}
          <div style={{ ...LABEL, marginTop: 22, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
            AI Call Analysis
            <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 6, background: "rgba(8,145,178,0.1)", color: TEAL }}>Whisper + Claude</span>
          </div>

          {loading && (
            <div style={{ fontSize: 13, color: MUTED, padding: "16px", textAlign: "center", background: BG, borderRadius: 10 }}>
              Transcribing recording and analyzing... this can take 10-30s.
            </div>
          )}

          {!loading && resp?.error && (
            <div style={{ fontSize: 13, color: DANGER, padding: "12px 14px", background: "rgba(239,68,68,0.07)", borderRadius: 10 }}>
              {resp.error}
            </div>
          )}

          {!loading && !resp?.error && resp?.analysis && (
            <>
              <div style={{ background: BG, borderRadius: 10, padding: "14px 16px" }}>
                <AnalysisMarkdown text={resp.analysis} />
              </div>
              {resp.transcript && (
                <div style={{ marginTop: 12 }}>
                  <button onClick={() => setShowTranscript(s => !s)} style={{
                    border: `1px solid ${BORDER}`, background: "#fff", borderRadius: 8,
                    padding: "6px 12px", fontSize: 12, fontWeight: 600, color: "#334155",
                    cursor: "pointer", fontFamily: "inherit",
                  }}>{showTranscript ? "Hide" : "Show"} full transcript</button>
                  {showTranscript && (
                    <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.6, color: "#475569", whiteSpace: "pre-wrap", background: BG, borderRadius: 10, padding: "12px 14px", maxHeight: 260, overflowY: "auto" }}>
                      {resp.transcript}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {!loading && !resp?.error && !resp?.analysis && resp?.note && (
            <div style={{ fontSize: 13, color: MUTED, padding: "12px 14px", background: BG, borderRadius: 10 }}>{resp.note}</div>
          )}
        </div>
      </div>
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

// ── CPL BY COUNTRY ────────────────────────────────────────────────────────────
export function CPLByCountryChart({ data }: { data: DashboardStats["cplByCountry"] }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.avgCPL), 1);
  return (
    <div style={CARD}>
      <Label>Avg Cost per Lead by Country</Label>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {data.map((r, i) => {
          const pct = (r.avgCPL / max) * 100;
          return (
            <div key={i}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                <span style={{ fontWeight: 600, color: "#334155" }}>{r.country}</span>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: MUTED }}>{r.count} leads</span>
                  <span style={{ fontFamily: "DM Mono, monospace", fontSize: 13, color: ORANGE, fontWeight: 700 }}>${r.avgCPL.toFixed(2)}</span>
                </div>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: BG }}>
                <div style={{ height: "100%", borderRadius: 4, width: `${pct}%`, background: ORANGE, transition: "width 0.5s" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── CPL VS RESPONSE TIME (scatter by country) ─────────────────────────────────
export function CPLvsResponseChart({ data }: { data: DashboardStats["cplVsResponseTime"] }) {
  if (!data.length) return null;
  const fmt = (m: number) => m < 60 ? `${m}m` : m < 1440 ? `${(m/60).toFixed(0)}h` : `${(m/1440).toFixed(1)}d`;
  const chartData = data.map(d => ({ ...d, x: d.avgMinutes, y: d.avgCPL, z: d.leads }));
  return (
    <div style={CARD}>
      <Label>CPL vs Response Time by Country</Label>
      <p style={{ fontSize: 11, color: MUTED, marginBottom: 12, marginTop: -8 }}>
        Each bubble = one country. Size = lead volume. Left = faster response. Bottom = cheaper leads.
      </p>
      <ResponsiveContainer width="100%" height={260}>
        <ScatterChart margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
          <XAxis dataKey="x" type="number" name="Avg Response Time"
            tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false}
            tickFormatter={fmt} label={{ value: "Response Time", position: "insideBottom", offset: -4, fill: MUTED, fontSize: 10 }} />
          <YAxis dataKey="y" type="number" name="Avg CPL"
            tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false}
            tickFormatter={v => `$${v}`} label={{ value: "CPL ($)", angle: -90, position: "insideLeft", fill: MUTED, fontSize: 10 }} />
          <ZAxis dataKey="z" range={[60, 600]} />
          <Tooltip
            contentStyle={{ background: "#0f172a", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 10, color: "#f8fafc", fontSize: 12 }}
            cursor={{ strokeDasharray: "3 3" }}
            formatter={(v: any, name: any) => {
              if (name === "Avg Response Time") return [fmt(Number(v)), name];
              if (name === "Avg CPL") return [`$${v}`, name];
              return [v, name];
            }}
          />
          <Scatter data={chartData} fill={BLUE}>
            <LabelList dataKey="country" position="top" style={{ fontSize: 10, fill: MUTED }} />
            {chartData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── LEGACY STUBS ──────────────────────────────────────────────────────────────
export function TimeToContactChart({ data }: { data: any }) { return null; }
export function CallsByHourChart({ data }: { data: any }) { return null; }
export function CallDispositionsChart({ data }: { data: any }) { return null; }
