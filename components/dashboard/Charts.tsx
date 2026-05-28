"use client";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, CartesianGrid,
} from "recharts";
import { DashboardStats } from "@/lib/fusion";

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
  return (
    <div style={CARD}>
      <Label>Campaign Summary</Label>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {["Campaign", "Leads"].map(h => (
              <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: MUTED, borderBottom: `2px solid ${BORDER}` }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
              <td style={{ padding: "10px 12px", fontWeight: 500, color: "#334155" }}>{row.campaign}</td>
              <td style={{ padding: "10px 12px", fontWeight: 700, color: BLUE, fontFamily: "DM Mono, monospace" }}>{row.leads}</td>
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
            {["Agent", "Leads", "Converted", "Rate"].map(h => (
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
                <td style={{ padding: "10px 12px", fontWeight: 700, color: BLUE, fontFamily: "DM Mono, monospace" }}>{row.leads}</td>
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

// ── DONUT (reused) ────────────────────────────────────────────────────────────
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

// ── LEADS TABLE ───────────────────────────────────────────────────────────────
export function LeadsTable({ data }: { data: DashboardStats["leads"] }) {
  const badgeStyle = (s: string): React.CSSProperties => {
    const l = s.toLowerCase();
    if (l.includes("won") || l.includes("convert")) return { background: "#dcfce7", color: "#15803d" };
    if (l.includes("lost") || l.includes("cancel"))  return { background: "#fee2e2", color: "#dc2626" };
    if (l.includes("open") || l.includes("new"))     return { background: "#dbeafe", color: "#1d4ed8" };
    return { background: "#fef9c3", color: "#a16207" };
  };
  return (
    <div style={CARD}>
      <Label>All Leads ({data.length})</Label>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              {["Name","Date","Platform","Campaign","Country","Owner","Status"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "10px 12px", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: MUTED, borderBottom: `2px solid ${BORDER}`, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 200).map((lead, i) => {
              const dt  = lead.submitted_at ? new Date(lead.submitted_at) : null;
              const ds  = dt ? dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" }) : "-";
              const bs  = badgeStyle(lead.deal_stage || "");
              return (
                <tr key={i} style={{ borderBottom: `1px solid ${BORDER}`, transition: "background 0.1s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = BG)}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "10px 12px", fontWeight: 600, maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#0f172a" }}>{lead.name || "-"}</td>
                  <td style={{ padding: "10px 12px", fontFamily: "DM Mono, monospace", fontSize: 12, whiteSpace: "nowrap", color: MUTED }}>{ds}</td>
                  <td style={{ padding: "10px 12px", maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#334155" }}>{lead.platform || "-"}</td>
                  <td style={{ padding: "10px 12px", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#334155" }}>{lead.campaign_name || "-"}</td>
                  <td style={{ padding: "10px 12px", color: "#334155" }}>{lead.country || "-"}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 600, color: BLUE }}>{lead.owner || "-"}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ ...bs, display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{lead.deal_stage || "-"}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {data.length > 200 && <p style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: MUTED }}>Showing 200 of {data.length} leads</p>}
      </div>
    </div>
  );
}

// Legacy
export function TimeToContactChart({ data }: { data: any }) { return null; }
export function CallsByHourChart({ data }: { data: any }) { return null; }
export function CallDispositionsChart({ data }: { data: any }) { return null; }
