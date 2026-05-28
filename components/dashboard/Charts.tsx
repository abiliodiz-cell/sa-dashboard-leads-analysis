"use client";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, CartesianGrid, Legend
} from "recharts";
import { DashboardStats } from "@/lib/fusion";

const GOLD = "#c9a84c";
const GOLD_LIGHT = "#e4c97a";
const NAVY_MID = "#132040";
const NAVY_LIGHT = "#1e3060";
const SLATE = "#7a8fa8";
const SUCCESS = "#3db87a";
const DANGER = "#e05252";
const WARNING = "#f0a045";

const COLORS = [GOLD, "#7a8fa8", "#3db87a", "#e05252", "#f0a045", "#6c8ebf", "#9b6cf0"];

const tooltipStyle = {
  contentStyle: { background: NAVY_MID, border: `1px solid rgba(201,168,76,0.3)`, borderRadius: 8, color: "#f5f0e8", fontSize: 12 },
  labelStyle: { color: GOLD, fontWeight: 600 },
  cursor: { fill: "rgba(201,168,76,0.06)" },
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h2 className="font-display text-xl text-[#e4c97a] font-semibold">{children}</h2>
      <div className="gold-rule mt-1" />
    </div>
  );
}

export function HourChart({ data }: { data: DashboardStats["byHour"] }) {
  return (
    <div className="card p-5 fade-up" style={{ animationDelay: "100ms" }}>
      <SectionTitle>Lead Volume by Hour</SectionTitle>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barSize={14}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="hour" tick={{ fill: SLATE, fontSize: 10 }} tickFormatter={(h) => `${h}h`} />
          <YAxis tick={{ fill: SLATE, fontSize: 10 }} />
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
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="day" tick={{ fill: SLATE, fontSize: 11 }} />
          <YAxis tick={{ fill: SLATE, fontSize: 10 }} />
          <Tooltip {...tooltipStyle} />
          <Bar dataKey="count" fill={GOLD_LIGHT} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AdPerformanceChart({ data }: { data: DashboardStats["byAd"] }) {
  const top = data.slice(0, 8);
  return (
    <div className="card p-5 fade-up" style={{ animationDelay: "200ms" }}>
      <SectionTitle>Ad Performance — Leads & Spend</SectionTitle>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={top} layout="vertical" barSize={12} barGap={4}>
          <CartesianGrid horizontal={false} strokeDasharray="3 3" />
          <XAxis type="number" tick={{ fill: SLATE, fontSize: 10 }} />
          <YAxis type="category" dataKey="ad_name" tick={{ fill: SLATE, fontSize: 10 }} width={130} />
          <Tooltip {...tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11, color: SLATE }} />
          <Bar dataKey="leads" name="Leads" fill={GOLD} radius={[0, 3, 3, 0]} />
          <Bar dataKey="spend" name="Spend (€)" fill={NAVY_LIGHT} radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TimeToContactChart({ data }: { data: DashboardStats["timeToContactDistribution"] }) {
  return (
    <div className="card p-5 fade-up" style={{ animationDelay: "250ms" }}>
      <SectionTitle>Time to First Contact</SectionTitle>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barSize={28}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="bucket" tick={{ fill: SLATE, fontSize: 10 }} />
          <YAxis tick={{ fill: SLATE, fontSize: 10 }} />
          <Tooltip {...tooltipStyle} />
          <Bar dataKey="count" radius={[3, 3, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={i < 2 ? SUCCESS : i < 4 ? WARNING : DANGER} />
            ))}
          </Bar>
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
              {["Campaign", "Leads", "Spend", "CPL"].map((h) => (
                <th key={h} className="text-left py-2 px-3 text-xs tracking-wider uppercase text-[#7a8fa8]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-b border-[rgba(201,168,76,0.06)] hover:bg-[rgba(201,168,76,0.04)] transition-colors">
                <td className="py-2 px-3 text-[#f5f0e8] max-w-[200px] truncate">{row.campaign}</td>
                <td className="py-2 px-3 font-mono text-[#c9a84c]">{row.leads}</td>
                <td className="py-2 px-3 font-mono text-[#7a8fa8]">€{row.spend.toFixed(0)}</td>
                <td className="py-2 px-3 font-mono text-[#e4c97a]">€{row.cpl.toFixed(2)}</td>
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
              {["Agent", "Leads", "Called", "Answered", "Converted", "Avg Duration"].map((h) => (
                <th key={h} className="text-left py-2 px-3 text-xs tracking-wider uppercase text-[#7a8fa8]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => {
              const callRate = row.leads ? Math.round((row.called / row.leads) * 100) : 0;
              const answerRate = row.called ? Math.round((row.answered / row.called) * 100) : 0;
              const convRate = row.leads ? Math.round((row.converted / row.leads) * 100) : 0;
              const durMin = Math.floor((row.avg_duration || 0) / 60);
              const durSec = (row.avg_duration || 0) % 60;
              return (
                <tr key={i} className="border-b border-[rgba(201,168,76,0.06)] hover:bg-[rgba(201,168,76,0.04)] transition-colors">
                  <td className="py-2 px-3 text-[#f5f0e8]">{row.owner}</td>
                  <td className="py-2 px-3 font-mono text-[#c9a84c]">{row.leads}</td>
                  <td className="py-2 px-3 font-mono">
                    <span className="text-[#f5f0e8]">{row.called}</span>
                    <span className="text-[#7a8fa8] text-xs ml-1">({callRate}%)</span>
                  </td>
                  <td className="py-2 px-3 font-mono">
                    <span className={answerRate > 50 ? "text-[#3db87a]" : "text-[#f0a045]"}>{row.answered}</span>
                    <span className="text-[#7a8fa8] text-xs ml-1">({answerRate}%)</span>
                  </td>
                  <td className="py-2 px-3 font-mono">
                    <span className={convRate > 10 ? "text-[#3db87a]" : "text-[#e05252]"}>{row.converted}</span>
                    <span className="text-[#7a8fa8] text-xs ml-1">({convRate}%)</span>
                  </td>
                  <td className="py-2 px-3 font-mono text-[#7a8fa8]">
                    {row.avg_duration > 0 ? `${durMin}m ${durSec}s` : "—"}
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
      <SectionTitle>Leads by Region</SectionTitle>
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

export function FormAnswersPanel({ data }: { data: DashboardStats["formAnswersSummary"] }) {
  const questions = Object.entries(data).slice(0, 6);
  if (!questions.length) return null;
  return (
    <div className="card p-5 fade-up" style={{ animationDelay: "450ms" }}>
      <SectionTitle>Form Answers Summary</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {questions.map(([question, answers]) => {
          const entries = Object.entries(answers).sort((a, b) => b[1] - a[1]).slice(0, 5);
          const total = entries.reduce((s, [, n]) => s + n, 0);
          return (
            <div key={question} className="p-3 rounded-lg bg-[rgba(11,22,40,0.5)] border border-[rgba(201,168,76,0.08)]">
              <div className="text-xs font-medium text-[#7a8fa8] mb-2 truncate">{question}</div>
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
      <SectionTitle>Lead Detail Table</SectionTitle>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[rgba(201,168,76,0.15)]">
              {["Name", "Submitted", "Ad", "Region", "Owner", "Stage", "Called", "Answered", "Time to Call"].map((h) => (
                <th key={h} className="text-left py-2 px-2 tracking-wider uppercase text-[#7a8fa8] whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 100).map((lead, i) => {
              const dt = new Date(lead.submitted_at);
              const dateStr = dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
              const timeStr = dt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
              return (
                <tr key={i} className="border-b border-[rgba(201,168,76,0.05)] hover:bg-[rgba(201,168,76,0.03)] transition-colors">
                  <td className="py-1.5 px-2 text-[#f5f0e8] max-w-[120px] truncate">{lead.name || "—"}</td>
                  <td className="py-1.5 px-2 font-mono text-[#7a8fa8] whitespace-nowrap">{dateStr} {timeStr}</td>
                  <td className="py-1.5 px-2 text-[#d4ccbb] max-w-[120px] truncate">{lead.ad_name || "—"}</td>
                  <td className="py-1.5 px-2 text-[#7a8fa8]">{lead.region}</td>
                  <td className="py-1.5 px-2 text-[#d4ccbb]">{lead.owner || "—"}</td>
                  <td className="py-1.5 px-2 text-[#c9a84c] max-w-[100px] truncate">{lead.deal_stage || "—"}</td>
                  <td className="py-1.5 px-2">
                    <span className={`inline-block w-4 h-4 rounded-full ${lead.was_called ? "bg-[#3db87a]" : "bg-[rgba(201,168,76,0.15)]"}`} />
                  </td>
                  <td className="py-1.5 px-2">
                    <span className={`inline-block w-4 h-4 rounded-full ${lead.call_answered ? "bg-[#3db87a]" : lead.was_called ? "bg-[#e05252]" : "bg-[rgba(201,168,76,0.15)]"}`} />
                  </td>
                  <td className="py-1.5 px-2 font-mono text-[#7a8fa8]">
                    {lead.minutes_to_first_call !== undefined ? `${lead.minutes_to_first_call}m` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {data.length > 100 && (
          <p className="text-xs text-[#7a8fa8] mt-2 text-center">Showing first 100 of {data.length} leads</p>
        )}
      </div>
    </div>
  );
}

export function CallsByHourChart({ data }: { data: DashboardStats["callsByHour"] }) {
  return (
    <div className="card p-5 fade-up" style={{ animationDelay: "200ms" }}>
      <SectionTitle>Calls by Hour — Total vs Answered (JustCall)</SectionTitle>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barSize={10} barGap={2}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="hour" tick={{ fill: SLATE, fontSize: 10 }} tickFormatter={(h) => `${h}h`} />
          <YAxis tick={{ fill: SLATE, fontSize: 10 }} />
          <Tooltip {...tooltipStyle} labelFormatter={(h) => `${h}:00`} />
          <Legend wrapperStyle={{ fontSize: 11, color: SLATE }} />
          <Bar dataKey="total" name="Total Calls" fill={GOLD} radius={[3,3,0,0]} />
          <Bar dataKey="answered" name="Answered" fill={SUCCESS} radius={[3,3,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CallDispositionsChart({ data }: { data: DashboardStats["callDispositions"] }) {
  return (
    <div className="card p-5 fade-up" style={{ animationDelay: "250ms" }}>
      <SectionTitle>Call Outcomes (JustCall)</SectionTitle>
      <div className="flex gap-6 items-center">
        <ResponsiveContainer width="50%" height={180}>
          <PieChart>
            <Pie data={data} dataKey="count" nameKey="disposition" cx="50%" cy="50%" outerRadius={75} strokeWidth={0}>
              {data.map((_, i) => <Cell key={i} fill={[SUCCESS, DANGER, WARNING, GOLD, SLATE][i % 5]} />)}
            </Pie>
            <Tooltip {...tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-2">
          {data.map((d, i) => {
            const total = data.reduce((s, x) => s + x.count, 0);
            const pct = total ? Math.round((d.count / total) * 100) : 0;
            const colors = [SUCCESS, DANGER, WARNING, GOLD, SLATE];
            return (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: colors[i % 5] }} />
                  <span className="text-xs text-[#d4ccbb] capitalize">{d.disposition}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[#c9a84c]">{d.count}</span>
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
