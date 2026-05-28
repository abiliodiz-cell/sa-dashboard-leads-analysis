"use client";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, CartesianGrid, Legend,
} from "recharts";
import { DashboardStats } from "@/lib/fusion";

const BLUE    = "#3b82f6";
const BLUE2   = "#1d4ed8";
const TEAL    = "#0891b2";
const INDIGO  = "#6366f1";
const SUCCESS = "#10b981";
const WARNING = "#f59e0b";
const DANGER  = "#ef4444";
const MUTED   = "#94a3b8";
const BORDER  = "#e2e8f0";
const SURFACE = "#ffffff";
const TEXT    = "#0f172a";
const TEXT_M  = "#64748b";

const PALETTE = [BLUE, TEAL, INDIGO, "#8b5cf6", SUCCESS, WARNING, "#ec4899"];

const TT = {
  contentStyle: {
    background: "#0f172a",
    border: "1px solid rgba(59,130,246,0.25)",
    borderRadius: 10,
    color: "#f8fafc",
    fontSize: 12,
    boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
  },
  labelStyle:  { color: BLUE, fontWeight: 700 },
  cursor:      { fill: "rgba(59,130,246,0.05)" },
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="section-title">{children}</p>;
}

export function DateChart({ data }: { data: DashboardStats["byDate"] }) {
  if (!data.length) return null;
  const fmt = (d: string) => {
    if (!d) return "";
    const dt = new Date(d);
    return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  };
  return (
    <div className="card p-5 fade-up">
      <SectionTitle>Leads Over Time</SectionTitle>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={BLUE} stopOpacity={0.18} />
              <stop offset="95%" stopColor={BLUE} stopOpacity={0}    />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={BORDER} />
          <XAxis dataKey="date" tick={{ fill: TEXT_M, fontSize: 11 }} tickFormatter={fmt}
            interval="preserveStartEnd" axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: TEXT_M, fontSize: 11 }} allowDecimals={false} axisLine={false} tickLine={false} />
          <Tooltip {...TT} labelFormatter={(d: any) => fmt(String(d))} />
          <Area type="monotone" dataKey="count" name="Leads" stroke={BLUE} strokeWidth={2.5}
            fill="url(#blueGrad)" dot={false} activeDot={{ r: 5, fill: BLUE, stroke: "#fff", strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function HourChart({ data }: { data: DashboardStats["byHour"] }) {
  return (
    <div className="card p-5 fade-up">
      <SectionTitle>Lead Volume by Hour</SectionTitle>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barSize={12}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={BORDER} />
          <XAxis dataKey="hour" tick={{ fill: TEXT_M, fontSize: 10 }} tickFormatter={(h) => `${h}h`}
            axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: TEXT_M, fontSize: 10 }} allowDecimals={false} axisLine={false} tickLine={false} />
          <Tooltip {...TT} labelFormatter={(h) => `${h}:00`} />
          <Bar dataKey="count" name="Leads" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={`rgba(59,130,246,${0.4 + (data[i].count / (Math.max(...data.map(d => d.count)) || 1)) * 0.6})`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WeekdayChart({ data }: { data: DashboardStats["byWeekday"] }) {
  const short = data.map((d) => ({ ...d, day: d.day.slice(0, 3) }));
  return (
    <div className="card p-5 fade-up">
      <SectionTitle>Lead Volume by Weekday</SectionTitle>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={short} barSize={22}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={BORDER} />
          <XAxis dataKey="day" tick={{ fill: TEXT_M, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: TEXT_M, fontSize: 10 }} allowDecimals={false} axisLine={false} tickLine={false} />
          <Tooltip {...TT} />
          <Bar dataKey="count" name="Leads" fill={TEAL} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AdPerformanceChart({ data }: { data: DashboardStats["byAd"] }) {
  const top = data.slice(0, 10);
  return (
    <div className="card p-5 fade-up">
      <SectionTitle>Top Ads by Lead Volume</SectionTitle>
      <ResponsiveContainer width="100%" height={Math.max(220, top.length * 32)}>
        <BarChart data={top} layout="vertical" barSize={14}>
          <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke={BORDER} />
          <XAxis type="number" tick={{ fill: TEXT_M, fontSize: 10 }} allowDecimals={false}
            axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="ad_name" tick={{ fill: TEXT_M, fontSize: 10 }} width={160}
            axisLine={false} tickLine={false} />
          <Tooltip {...TT} />
          <Bar dataKey="leads" name="Leads" fill={BLUE} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CampaignTable({ data }: { data: DashboardStats["byCampaign"] }) {
  return (
    <div className="card p-5 fade-up">
      <SectionTitle>Campaign Summary</SectionTitle>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
              {["Campaign", "Leads"].map((h) => (
                <th key={h} className="text-left py-2.5 px-3 text-xs font-semibold tracking-wider uppercase"
                  style={{ color: TEXT_M }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-blue-50/40 transition-colors" style={{ borderBottom: `1px solid ${BORDER}` }}>
                <td className="py-2.5 px-3 max-w-[300px] truncate font-medium" style={{ color: TEXT }}>{row.campaign}</td>
                <td className="py-2.5 px-3 font-mono font-semibold" style={{ color: BLUE }}>{row.leads}</td>
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
    <div className="card p-5 fade-up">
      <SectionTitle>Agent Performance</SectionTitle>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
              {["Agent", "Leads", "Converted", "Conv. Rate"].map((h) => (
                <th key={h} className="text-left py-2.5 px-3 text-xs font-semibold tracking-wider uppercase"
                  style={{ color: TEXT_M }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => {
              const convRate = row.leads ? Math.round((row.converted / row.leads) * 100) : 0;
              return (
                <tr key={i} className="hover:bg-blue-50/40 transition-colors" style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <td className="py-2.5 px-3 font-semibold" style={{ color: TEXT }}>{row.owner}</td>
                  <td className="py-2.5 px-3 font-mono font-semibold" style={{ color: BLUE }}>{row.leads}</td>
                  <td className="py-2.5 px-3 font-mono font-semibold" style={{ color: SUCCESS }}>{row.converted}</td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full max-w-[70px]" style={{ background: BORDER }}>
                        <div className="h-full rounded-full"
                          style={{ width: `${convRate}%`, background: convRate > 10 ? SUCCESS : WARNING }} />
                      </div>
                      <span className="font-mono text-xs" style={{ color: TEXT_M }}>{convRate}%</span>
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

export function RegionChart({ data }: { data: DashboardStats["byRegion"] }) {
  const top = data.slice(0, 7);
  return (
    <div className="card p-5 fade-up">
      <SectionTitle>Leads by Country</SectionTitle>
      <div className="flex gap-4 items-center">
        <ResponsiveContainer width="45%" height={190}>
          <PieChart>
            <Pie data={top} dataKey="count" nameKey="region" cx="50%" cy="50%"
              outerRadius={82} innerRadius={42} strokeWidth={2} stroke={SURFACE}>
              {top.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
            </Pie>
            <Tooltip {...TT} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-2">
          {top.map((r, i) => {
            const total = top.reduce((s, x) => s + x.count, 0);
            const pct = total ? Math.round((r.count / total) * 100) : 0;
            return (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: PALETTE[i % PALETTE.length] }} />
                  <span className="text-xs font-medium truncate max-w-[100px]" style={{ color: TEXT_M }}>{r.region}</span>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <span className="font-mono text-xs font-semibold" style={{ color: TEXT }}>{r.count}</span>
                  <span className="font-mono text-xs" style={{ color: MUTED }}>{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function PlatformChart({ data }: { data: DashboardStats["byPlatform"] }) {
  if (!data.length) return null;
  return (
    <div className="card p-5 fade-up">
      <SectionTitle>Leads by Platform</SectionTitle>
      <div className="flex gap-4 items-center">
        <ResponsiveContainer width="45%" height={190}>
          <PieChart>
            <Pie data={data} dataKey="count" nameKey="platform" cx="50%" cy="50%"
              outerRadius={82} innerRadius={42} strokeWidth={2} stroke={SURFACE}>
              {data.map((_, i) => <Cell key={i} fill={[BLUE, TEAL, INDIGO, "#8b5cf6"][i % 4]} />)}
            </Pie>
            <Tooltip {...TT} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-3">
          {data.map((r, i) => {
            const total = data.reduce((s, x) => s + x.count, 0);
            const pct = total ? Math.round((r.count / total) * 100) : 0;
            const color = [BLUE, TEAL, INDIGO, "#8b5cf6"][i % 4];
            return (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium" style={{ color: TEXT_M }}>{r.platform}</span>
                  <span className="font-mono font-semibold" style={{ color }}>{r.count} <span style={{ color: MUTED }}>({pct}%)</span></span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: BORDER }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function StatusChart({ data }: { data: DashboardStats["byStatus"] }) {
  if (!data.length) return null;
  const statusColor = (s: string) => {
    const l = s.toLowerCase();
    if (l.includes("won") || l.includes("convert")) return SUCCESS;
    if (l.includes("lost") || l.includes("cancel"))  return DANGER;
    if (l.includes("open") || l.includes("new"))     return BLUE;
    return WARNING;
  };
  const total = data.reduce((s, x) => s + x.count, 0);
  return (
    <div className="card p-5 fade-up">
      <SectionTitle>Leads by Status</SectionTitle>
      <div className="space-y-3">
        {data.map((r, i) => {
          const pct   = total ? Math.round((r.count / total) * 100) : 0;
          const color = statusColor(r.status);
          return (
            <div key={i}>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-medium" style={{ color: TEXT_M }}>{r.status || "Unknown"}</span>
                <span className="font-mono font-semibold">
                  <span style={{ color }}>{r.count}</span>
                  <span style={{ color: MUTED }}> ({pct}%)</span>
                </span>
              </div>
              <div className="h-2 rounded-full" style={{ background: BORDER }}>
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function FormAnswersPanel({ data }: { data: DashboardStats["formAnswersSummary"] }) {
  const questions = Object.entries(data).slice(0, 4);
  if (!questions.length) return null;
  return (
    <div className="card p-5 fade-up">
      <SectionTitle>Form Answers Summary</SectionTitle>
      <div className="space-y-4">
        {questions.map(([question, answers]) => {
          const entries = Object.entries(answers).sort((a, b) => b[1] - a[1]).slice(0, 5);
          const total   = entries.reduce((s, [, n]) => s + n, 0);
          return (
            <div key={question}>
              <div className="text-xs font-semibold mb-2 truncate" style={{ color: TEXT_M }} title={question}>{question}</div>
              <div className="space-y-1.5">
                {entries.map(([answer, count]) => {
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={answer}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="truncate max-w-[180px] font-medium" style={{ color: TEXT_M }}>{answer || "(empty)"}</span>
                        <span className="font-mono font-semibold ml-2" style={{ color: BLUE }}>{pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: BORDER }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: `rgba(59,130,246,0.6)` }} />
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
  const statusColor = (s: string) => {
    const l = s.toLowerCase();
    if (l.includes("won") || l.includes("convert")) return { bg: "#dcfce7", color: "#16a34a" };
    if (l.includes("lost") || l.includes("cancel"))  return { bg: "#fee2e2", color: "#dc2626" };
    if (l.includes("open") || l.includes("new"))     return { bg: "#dbeafe", color: "#2563eb" };
    return { bg: "#fef9c3", color: "#ca8a04" };
  };

  return (
    <div className="card p-5 fade-up">
      <SectionTitle>Lead Detail - {data.length} leads</SectionTitle>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: `2px solid ${BORDER}` }}>
              {["Name", "Date", "Platform", "Campaign", "Country", "Owner", "Status"].map((h) => (
                <th key={h} className="text-left py-3 px-3 text-xs font-semibold tracking-wider uppercase whitespace-nowrap"
                  style={{ color: TEXT_M }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 200).map((lead, i) => {
              const dt      = lead.submitted_at ? new Date(lead.submitted_at) : null;
              const dateStr = dt ? dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" }) : "-";
              const sc      = statusColor(lead.deal_stage || "");
              return (
                <tr key={i} className="hover:bg-blue-50/40 transition-colors"
                  style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <td className="py-2.5 px-3 font-semibold max-w-[130px] truncate" style={{ color: TEXT }}>{lead.name || "-"}</td>
                  <td className="py-2.5 px-3 font-mono whitespace-nowrap" style={{ color: TEXT_M }}>{dateStr}</td>
                  <td className="py-2.5 px-3 max-w-[110px] truncate" style={{ color: TEXT_M }}>{lead.platform || "-"}</td>
                  <td className="py-2.5 px-3 max-w-[160px] truncate" style={{ color: TEXT_M }}>{lead.campaign_name || "-"}</td>
                  <td className="py-2.5 px-3 font-medium" style={{ color: TEXT_M }}>{lead.country || "-"}</td>
                  <td className="py-2.5 px-3 font-medium" style={{ color: BLUE }}>{lead.owner || "-"}</td>
                  <td className="py-2.5 px-3">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap"
                      style={{ background: sc.bg, color: sc.color }}>
                      {lead.deal_stage || "-"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {data.length > 200 && (
          <p className="text-xs text-center mt-3" style={{ color: MUTED }}>
            Showing first 200 of {data.length} leads
          </p>
        )}
      </div>
    </div>
  );
}

// Legacy exports
export function TimeToContactChart({ data }: { data: DashboardStats["timeToContactDistribution"] }) { return null; }
export function CallsByHourChart({ data }: { data: DashboardStats["callsByHour"] }) { return null; }
export function CallDispositionsChart({ data }: { data: DashboardStats["callDispositions"] }) { return null; }
