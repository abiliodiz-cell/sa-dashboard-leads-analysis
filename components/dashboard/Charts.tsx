"use client";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, CartesianGrid,
} from "recharts";
import { DashboardStats } from "@/lib/fusion";

const BLUE    = "#3b82f6";
const TEAL    = "#0891b2";
const INDIGO  = "#6366f1";
const SUCCESS = "#10b981";
const WARNING = "#f59e0b";
const DANGER  = "#ef4444";
const MUTED   = "#94a3b8";
const BORDER  = "#e2e8f0";
const PALETTE = [BLUE, TEAL, INDIGO, "#8b5cf6", SUCCESS, WARNING, "#ec4899", "#f97316"];

const TT = {
  contentStyle: { background: "#0f172a", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 10, color: "#f8fafc", fontSize: 12 },
  labelStyle:   { color: BLUE, fontWeight: 700 },
  cursor:       { fill: "rgba(59,130,246,0.05)" },
};

export function DateChart({ data }: { data: DashboardStats["byDate"] }) {
  if (!data.length) return null;
  const fmt = (d: string) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  };
  return (
    <div className="card">
      <p className="section-title">Leads Over Time</p>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="10%" stopColor={BLUE} stopOpacity={0.2} />
              <stop offset="90%" stopColor={BLUE} stopOpacity={0}   />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={BORDER} />
          <XAxis dataKey="date" tick={{ fill: MUTED, fontSize: 11 }} tickFormatter={fmt}
            interval="preserveStartEnd" axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: MUTED, fontSize: 11 }} allowDecimals={false} axisLine={false} tickLine={false} />
          <Tooltip {...TT} labelFormatter={(d: any) => fmt(String(d))} />
          <Area type="monotone" dataKey="count" name="Leads" stroke={BLUE} strokeWidth={2.5}
            fill="url(#grad1)" dot={false} activeDot={{ r: 5, fill: BLUE, stroke: "#fff", strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function HourChart({ data }: { data: DashboardStats["byHour"] }) {
  const maxVal = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="card">
      <p className="section-title">Leads by Hour</p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barSize={10} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={BORDER} />
          <XAxis dataKey="hour" tick={{ fill: MUTED, fontSize: 10 }} tickFormatter={(h) => `${h}h`}
            axisLine={false} tickLine={false} interval={2} />
          <YAxis tick={{ fill: MUTED, fontSize: 10 }} allowDecimals={false} axisLine={false} tickLine={false} />
          <Tooltip {...TT} labelFormatter={(h) => `${h}:00`} />
          <Bar dataKey="count" name="Leads" radius={[3, 3, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={`rgba(59,130,246,${0.3 + (d.count / maxVal) * 0.7})`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WeekdayChart({ data }: { data: DashboardStats["byWeekday"] }) {
  return (
    <div className="card">
      <p className="section-title">Leads by Weekday</p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data.map(d => ({ ...d, day: d.day.slice(0, 3) }))}
          barSize={24} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={BORDER} />
          <XAxis dataKey="day" tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: MUTED, fontSize: 10 }} allowDecimals={false} axisLine={false} tickLine={false} />
          <Tooltip {...TT} />
          <Bar dataKey="count" name="Leads" fill={TEAL} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AdPerformanceChart({ data }: { data: DashboardStats["byAd"] }) {
  const top = data.slice(0, 10);
  if (!top.length) return null;
  return (
    <div className="card">
      <p className="section-title">Top Ads by Lead Volume</p>
      <ResponsiveContainer width="100%" height={Math.max(200, top.length * 30)}>
        <BarChart data={top} layout="vertical" barSize={14}
          margin={{ top: 4, right: 16, left: 140, bottom: 0 }}>
          <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke={BORDER} />
          <XAxis type="number" tick={{ fill: MUTED, fontSize: 10 }} allowDecimals={false} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="ad_name" tick={{ fill: MUTED, fontSize: 10 }} width={0} axisLine={false} tickLine={false} />
          <Tooltip {...TT} />
          <Bar dataKey="leads" name="Leads" fill={BLUE} radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CampaignTable({ data }: { data: DashboardStats["byCampaign"] }) {
  return (
    <div className="card">
      <p className="section-title">Campaign Summary</p>
      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead><tr><th>Campaign</th><th>Leads</th></tr></thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 500 }}>{row.campaign}</td>
                <td style={{ fontWeight: 700, color: BLUE, fontFamily: "DM Mono, monospace" }}>{row.leads}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function OwnerTable({ data }: { data: DashboardStats["byOwner"] }) {
  return (
    <div className="card">
      <p className="section-title">Agent Performance</p>
      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead><tr><th>Agent</th><th>Leads</th><th>Converted</th><th>Conv. Rate</th></tr></thead>
          <tbody>
            {data.map((row, i) => {
              const convRate = row.leads ? Math.round((row.converted / row.leads) * 100) : 0;
              return (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{row.owner}</td>
                  <td style={{ fontWeight: 700, color: BLUE, fontFamily: "DM Mono, monospace" }}>{row.leads}</td>
                  <td style={{ fontWeight: 700, color: SUCCESS, fontFamily: "DM Mono, monospace" }}>{row.converted}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 60, height: 6, borderRadius: 3, background: BORDER }}>
                        <div style={{ height: "100%", borderRadius: 3, width: `${convRate}%`, background: convRate > 10 ? SUCCESS : WARNING }} />
                      </div>
                      <span style={{ fontSize: 12, fontFamily: "DM Mono, monospace", color: MUTED }}>{convRate}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DonutCard({ title, data, nameKey, countKey }: { title: string; data: any[]; nameKey: string; countKey: string }) {
  const top = data.slice(0, 7);
  const total = top.reduce((s: number, x: any) => s + x[countKey], 0);
  return (
    <div className="card">
      <p className="section-title">{title}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ flexShrink: 0 }}>
          <ResponsiveContainer width={160} height={160}>
            <PieChart>
              <Pie data={top} dataKey={countKey} nameKey={nameKey}
                cx="50%" cy="50%" outerRadius={72} innerRadius={38} strokeWidth={2} stroke="#fff">
                {top.map((_: any, i: number) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Pie>
              <Tooltip {...TT} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          {top.map((r: any, i: number) => {
            const pct = total ? Math.round((r[countKey] / total) * 100) : 0;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: PALETTE[i % PALETTE.length], flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#334155", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r[nameKey]}</span>
                <span style={{ fontSize: 12, fontFamily: "DM Mono, monospace", fontWeight: 700, color: PALETTE[i % PALETTE.length] }}>{r[countKey]}</span>
                <span style={{ fontSize: 11, fontFamily: "DM Mono, monospace", color: MUTED, width: 30, textAlign: "right" }}>{pct}%</span>
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

export function StatusChart({ data }: { data: DashboardStats["byStatus"] }) {
  if (!data.length) return null;
  const total = data.reduce((s, x) => s + x.count, 0);
  const statusColor = (s: string) => {
    const l = s.toLowerCase();
    if (l.includes("won") || l.includes("convert")) return SUCCESS;
    if (l.includes("lost") || l.includes("cancel"))  return DANGER;
    if (l.includes("open") || l.includes("new"))     return BLUE;
    return WARNING;
  };
  return (
    <div className="card">
      <p className="section-title">Leads by Status</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {data.map((r, i) => {
          const pct   = total ? Math.round((r.count / total) * 100) : 0;
          const color = statusColor(r.status);
          return (
            <div key={i}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                <span style={{ fontWeight: 500, color: "#334155" }}>{r.status || "Unknown"}</span>
                <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 700 }}>
                  <span style={{ color }}>{r.count}</span>
                  <span style={{ color: MUTED }}> ({pct}%)</span>
                </span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: BORDER }}>
                <div style={{ height: "100%", borderRadius: 4, width: `${pct}%`, background: color, transition: "width 0.6s ease" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function FormAnswersPanel({ data }: { data: DashboardStats["formAnswersSummary"] }) {
  const questions = Object.entries(data).slice(0, 3);
  if (!questions.length) return null;
  return (
    <div className="card">
      <p className="section-title">Form Answers</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {questions.map(([question, answers]) => {
          const entries = Object.entries(answers).sort((a, b) => b[1] - a[1]).slice(0, 4);
          const total   = entries.reduce((s, [, n]) => s + n, 0);
          return (
            <div key={question}>
              <div style={{ fontSize: 11, fontWeight: 600, color: MUTED, marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={question}>{question}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {entries.map(([answer, count]) => {
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={answer}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                        <span style={{ color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "75%" }}>{answer || "(empty)"}</span>
                        <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: BLUE }}>{pct}%</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: BORDER }}>
                        <div style={{ height: "100%", borderRadius: 3, width: `${pct}%`, background: "rgba(59,130,246,0.55)" }} />
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

export function LeadsTable({ data }: { data: DashboardStats["leads"] }) {
  const badgeClass = (s: string) => {
    const l = s.toLowerCase();
    if (l.includes("won") || l.includes("convert")) return "badge badge-green";
    if (l.includes("lost") || l.includes("cancel"))  return "badge badge-red";
    if (l.includes("open") || l.includes("new"))     return "badge badge-blue";
    return "badge badge-yellow";
  };
  return (
    <div className="card">
      <p className="section-title">Lead Detail - {data.length} leads</p>
      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead><tr>
            <th>Name</th><th>Date</th><th>Platform</th><th>Campaign</th><th>Country</th><th>Owner</th><th>Status</th>
          </tr></thead>
          <tbody>
            {data.slice(0, 200).map((lead, i) => {
              const dt      = lead.submitted_at ? new Date(lead.submitted_at) : null;
              const dateStr = dt ? dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" }) : "-";
              return (
                <tr key={i}>
                  <td style={{ fontWeight: 600, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.name || "-"}</td>
                  <td style={{ fontFamily: "DM Mono, monospace", fontSize: 12, whiteSpace: "nowrap" }}>{dateStr}</td>
                  <td style={{ maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.platform || "-"}</td>
                  <td style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.campaign_name || "-"}</td>
                  <td>{lead.country || "-"}</td>
                  <td style={{ fontWeight: 600, color: BLUE }}>{lead.owner || "-"}</td>
                  <td><span className={badgeClass(lead.deal_stage || "")}>{lead.deal_stage || "-"}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {data.length > 200 && (
          <p style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: MUTED }}>
            Showing first 200 of {data.length} leads
          </p>
        )}
      </div>
    </div>
  );
}

// Legacy
export function TimeToContactChart({ data }: { data: any }) { return null; }
export function CallsByHourChart({ data }: { data: any }) { return null; }
export function CallDispositionsChart({ data }: { data: any }) { return null; }
