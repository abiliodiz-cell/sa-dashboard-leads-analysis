"use client";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, CartesianGrid, Legend,
} from "recharts";
import { DashboardStats } from "@/lib/fusion";

const GOLD       = "#c9a84c";
const GOLD_LIGHT = "#e4c97a";
const NAVY_MID   = "#132040";
const NAVY_LIGHT = "#1e3060";
const SLATE      = "#7a8fa8";
const SUCCESS    = "#3db87a";
const DANGER     = "#e05252";
const WARNING    = "#f0a045";
const COLORS     = [GOLD, "#7a8fa8", "#3db87a", "#e05252", "#f0a045", "#6c8ebf", "#9b6cf0"];

const tooltipStyle = {
  contentStyle: { background: NAVY_MID, border: `1px solid rgba(201,168,76,0.3)`, borderRadius: 8, color: "#f5f0e8", fontSize: 12 },
  labelStyle:   { color: GOLD, fontWeight: 600 },
  cursor:       { fill: "rgba(201,168,76,0.06)" },
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h2 className="font-display text-xl text-[#e4c97a] font-semibold">{children}</h2>
      <div className="gold-rule mt-1" />
    </div>
  );
}

export function DateChart({ data }: { data: DashboardStats["byDate"] }) {
  if (!data.length) return null;
  const fmt = (d: string) => {
    const dt = new Date(d);
    return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  };
  return (
    <div className="card p-5 fade-up" style={{ animationDelay: "50ms" }}>
      <SectionTitle>Leads Over Time</SectionTitle>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={GOLD} stopOpacity={0.25} />
              <stop offset="95%" stopColor={GOLD} stopOpacity={0}    />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(201,168,76,0.08)" />
          <XAxis dataKey="date" tick={{ fill: SLATE, fontSize: 10 }} tickFormatter={fmt} interval="preserveStartEnd" />
          <YAxis tick={{ fill: SLATE, fontSize: 10 }} allowDecimals={false} />
          <Tooltip {...tooltipStyle} labelFormatter={(d: any) => fmt(String(d))} />
          <Area type="monotone" dataKey="count" name="Leads" stroke={GOLD} strokeWidth={2} fill="url(#goldGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function HourChart({ data }: { data: DashboardStats["byHour"] }) {
  return (
    <div className="card p-5 fade-up" style={{ animationDelay: "100ms" }}>
      <SectionTitle>Lead Volume by Hour</SectionTitle>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barSize={14}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(201,168,76,0.08)" />
          <XAxis dataKey="hour" tick={{ fill: SLATE, fontSize: 10 }} tickFormatter={(h) => `${h}h`} />
          <YAxis tick={{ fill: SLATE, fontSize: 10 }} allowDecimals={false} />
          <Tooltip {...tooltipStyle} labelFormatter={(h) => `${h}:00`} />
          <Bar dataKey="count" fill={GOLD} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WeekdayChart({ data }: { data: DashboardStats["byWeekday"] }) {
  const short = data.map((d) => ({ ...d, day: d.day.slice(0, 3) }));
  return (
    <div className="card p-5 fade-up" style={{ animationDelay: "150ms" }}>
      <SectionTitle>Lead Volume by Weekday</SectionTitle>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={short} barSize={22}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(201,168,76,0.08)" />
          <XAxis dataKey="day" tick={{ fill: SLATE, fontSize: 11 }} />
          <YAxis tick={{ fill: SLATE, fontSize: 10 }} allowDecimals={false} />
          <Tooltip {...tooltipStyle} />
          <Bar dataKey="count" fill={GOLD_LIGHT} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AdPerformanceChart({ data }: { data: DashboardStats["byAd"] }) {
  const top = data.slice(0, 10);
  return (
    <div className="card p-5 fade-up" style={{ animationDelay: "200ms" }}>
      <SectionTitle>Top Ads by Lead Volume</SectionTitle>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={top} layout="vertical" barSize={14}>
          <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="rgba(201,168,76,0.08)" />
          <XAxis type="number" tick={{ fill: SLATE, fontSize: 10 }} allowDecimals={false} />
          <YAxis type="category" dataKey="ad_name" tick={{ fill: SLATE, fontSize: 10 }} width={150} />
          <Tooltip {...tooltipStyle} />
          <Bar dataKey="leads" name="Leads" fill={GOLD} radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CampaignTable({ data }: { data: DashboardStats["byCampaign"] }) {
  return (
    <div className="card p-5 fade-up" style={{ animationDelay: "300ms" }}>
      <SectionTitle>Campaign Summary</SectionTitle>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[rgba(201,168,76,0.15)]">
              {["Campaign", "Leads"].map((h) => (
                <th key={h} className="text-left py-2 px-3 text-xs tracking-wider uppercase text-[#7a8fa8]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-b border-[rgba(201,168,76,0.06)] hover:bg-[rgba(201,168,76,0.04)] transition-colors">
                <td className="py-2 px-3 text-[#f5f0e8] max-w-[300px] truncate">{row.campaign}</td>
                <td className="py-2 px-3 font-mono text-[#c9a84c]">{row.leads}</td>
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
    <div className="card p-5 fade-up" style={{ animationDelay: "350ms" }}>
      <SectionTitle>Agent Performance</SectionTitle>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[rgba(201,168,76,0.15)]">
              {["Agent", "Leads", "Converted", "Conv. Rate"].map((h) => (
                <th key={h} className="text-left py-2 px-3 text-xs tracking-wider uppercase text-[#7a8fa8]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => {
              const convRate = row.leads ? Math.round((row.converted / row.leads) * 100) : 0;
              return (
                <tr key={i} className="border-b border-[rgba(201,168,76,0.06)] hover:bg-[rgba(201,168,76,0.04)] transition-colors">
                  <td className="py-2 px-3 text-[#f5f0e8]">{row.owner}</td>
                  <td className="py-2 px-3 font-mono text-[#c9a84c]">{row.leads}</td>
                  <td className="py-2 px-3 font-mono text-[#3db87a]">{row.converted}</td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-[rgba(201,168,76,0.1)] rounded-full overflow-hidden max-w-[60px]">
                        <div className="h-full rounded-full" style={{ width: `${convRate}%`, background: convRate > 10 ? SUCCESS : WARNING }} />
                      </div>
                      <span className="font-mono text-xs text-[#7a8fa8]">{convRate}%</span>
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
  const top = data.slice(0, 8);
  return (
    <div className="card p-5 fade-up" style={{ animationDelay: "400ms" }}>
      <SectionTitle>Leads by Country</SectionTitle>
      <div className="flex gap-6 items-center">
        <ResponsiveContainer width="50%" height={200}>
          <PieChart>
            <Pie data={top} dataKey="count" nameKey="region" cx="50%" cy="50%" outerRadius={80} strokeWidth={0}>
              {top.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip {...tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-2">
          {top.map((r, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="text-xs text-[#d4ccbb]">{r.region}</span>
              </div>
              <span className="font-mono text-xs text-[#c9a84c]">{r.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PlatformChart({ data }: { data: DashboardStats["byPlatform"] }) {
  if (!data.length) return null;
  return (
    <div className="card p-5 fade-up" style={{ animationDelay: "420ms" }}>
      <SectionTitle>Leads by Platform</SectionTitle>
      <div className="flex gap-6 items-center">
        <ResponsiveContainer width="50%" height={200}>
          <PieChart>
            <Pie data={data} dataKey="count" nameKey="platform" cx="50%" cy="50%" outerRadius={80} strokeWidth={0}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip {...tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-2">
          {data.map((r, i) => {
            const total = data.reduce((s, x) => s + x.count, 0);
            const pct = total ? Math.round((r.count / total) * 100) : 0;
            return (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-xs text-[#d4ccbb]">{r.platform}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[#c9a84c]">{r.count}</span>
                  <span className="font-mono text-xs text-[#7a8fa8]">{pct}%</span>
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
    if (l.includes("open") || l.includes("new"))     return GOLD;
    return WARNING;
  };
  return (
    <div className="card p-5 fade-up" style={{ animationDelay: "440ms" }}>
      <SectionTitle>Leads by Status</SectionTitle>
      <div className="space-y-3">
        {data.map((r, i) => {
          const total = data.reduce((s, x) => s + x.count, 0);
          const pct   = total ? Math.round((r.count / total) * 100) : 0;
          const color = statusColor(r.status);
          return (
            <div key={i}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#d4ccbb]">{r.status || "Unknown"}</span>
                <span className="font-mono" style={{ color }}>
                  {r.count} <span className="text-[#7a8fa8]">({pct}%)</span>
                </span>
              </div>
              <div className="h-1.5 bg-[rgba(201,168,76,0.1)] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
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
    <div className="card p-5 fade-up" style={{ animationDelay: "450ms" }}>
      <SectionTitle>Form Answers Summary</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {questions.map(([question, answers]) => {
          const entries = Object.entries(answers).sort((a, b) => b[1] - a[1]).slice(0, 5);
          const total   = entries.reduce((s, [, n]) => s + n, 0);
          return (
            <div key={question} className="p-3 rounded-lg bg-[rgba(11,22,40,0.5)] border border-[rgba(201,168,76,0.08)]">
              <div className="text-xs font-medium text-[#7a8fa8] mb-2 truncate" title={question}>{question}</div>
              <div className="space-y-1.5">
                {entries.map(([answer, count]) => {
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={answer}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-[#d4ccbb] truncate max-w-[160px]">{answer || "(empty)"}</span>
                        <span className="font-mono text-[#c9a84c] ml-2">{pct}%</span>
                      </div>
                      <div className="h-1 bg-[rgba(201,168,76,0.1)] rounded-full overflow-hidden">
                        <div className="h-full bg-[#c9a84c] rounded-full" style={{ width: `${pct}%` }} />
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
  return (
    <div className="card p-5 fade-up" style={{ animationDelay: "500ms" }}>
      <SectionTitle>Lead Detail ({data.length} leads)</SectionTitle>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[rgba(201,168,76,0.15)]">
              {["Name", "Date", "Platform", "Campaign", "Country", "Owner", "Status"].map((h) => (
                <th key={h} className="text-left py-2 px-2 tracking-wider uppercase text-[#7a8fa8] whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 200).map((lead, i) => {
              const dt      = lead.submitted_at ? new Date(lead.submitted_at) : null;
              const dateStr = dt ? dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" }) : "-";
              const statusL = (lead.deal_stage || "").toLowerCase();
              const statusColor =
                statusL.includes("won") || statusL.includes("convert") ? SUCCESS :
                statusL.includes("lost") || statusL.includes("cancel")  ? DANGER  :
                statusL.includes("open") || statusL.includes("new")     ? GOLD    : WARNING;
              return (
                <tr key={i} className="border-b border-[rgba(201,168,76,0.05)] hover:bg-[rgba(201,168,76,0.03)] transition-colors">
                  <td className="py-1.5 px-2 text-[#f5f0e8] max-w-[130px] truncate">{lead.name || "-"}</td>
                  <td className="py-1.5 px-2 font-mono text-[#7a8fa8] whitespace-nowrap">{dateStr}</td>
                  <td className="py-1.5 px-2 text-[#d4ccbb] max-w-[110px] truncate">{lead.platform || "-"}</td>
                  <td className="py-1.5 px-2 text-[#7a8fa8] max-w-[160px] truncate">{lead.campaign_name || "-"}</td>
                  <td className="py-1.5 px-2 text-[#d4ccbb]">{lead.country || "-"}</td>
                  <td className="py-1.5 px-2 text-[#c9a84c]">{lead.owner || "-"}</td>
                  <td className="py-1.5 px-2">
                    <span className="text-xs font-medium" style={{ color: statusColor }}>
                      {lead.deal_stage || "-"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {data.length > 200 && (
          <p className="text-xs text-[#7a8fa8] mt-2 text-center">Showing first 200 of {data.length} leads</p>
        )}
      </div>
    </div>
  );
}

// Legacy exports kept for type safety
export function TimeToContactChart({ data }: { data: DashboardStats["timeToContactDistribution"] }) { return null; }
export function CallsByHourChart({ data }: { data: DashboardStats["callsByHour"] }) { return null; }
export function CallDispositionsChart({ data }: { data: DashboardStats["callDispositions"] }) { return null; }
