"use client";
import { useState, useEffect, useCallback } from "react";
import { DashboardStats } from "@/lib/fusion";
import { KPICard } from "@/components/dashboard/KPICard";
import {
  DateChart, HourChart, WeekdayChart,
  AdPerformanceChart, CampaignTable, OwnerTable,
  RegionChart, PlatformChart, StatusChart,
  FormAnswersPanel, LeadsTable,
} from "@/components/dashboard/Charts";

const RANGES = [
  { label: "7d",  days: 7  },
  { label: "30d", days: 30 },
  { label: "60d", days: 60 },
  { label: "90d", days: 90 },
];

export default function DashboardPage() {
  const [stats, setStats]           = useState<DashboardStats | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [days, setDays]             = useState(30);
  const [activeTab, setActiveTab]   = useState<"overview" | "ads" | "agents" | "leads">("overview");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard?days=${days}`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStats(data);
      setLastRefresh(new Date());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const tabs = [
    { id: "overview", label: "Overview"         },
    { id: "ads",      label: "Ads & Campaigns"  },
    { id: "agents",   label: "Agent Performance" },
    { id: "leads",    label: "Lead Detail"       },
  ] as const;

  return (
    <div className="min-h-screen" style={{ background: "var(--navy)" }}>
      <header className="border-b border-[rgba(201,168,76,0.15)] px-6 py-4">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-display text-2xl gold-glow">Smith & Adams</span>
              <span className="text-[#7a8fa8] text-sm">|</span>
              <span className="text-[#7a8fa8] text-sm tracking-widest uppercase">Lead Intelligence</span>
            </div>
            {lastRefresh && (
              <p className="text-[10px] text-[#7a8fa8] mt-0.5">
                Last updated: {lastRefresh.toLocaleTimeString("en-GB")}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg overflow-hidden border border-[rgba(201,168,76,0.2)]">
              {RANGES.map((r) => (
                <button key={r.days} onClick={() => setDays(r.days)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${days === r.days ? "bg-[#c9a84c] text-[#0b1628]" : "text-[#7a8fa8] hover:text-[#c9a84c]"}`}>
                  {r.label}
                </button>
              ))}
            </div>
            <button onClick={load} disabled={loading}
              className="px-4 py-1.5 text-xs font-medium rounded-lg border border-[rgba(201,168,76,0.3)] text-[#c9a84c] hover:bg-[rgba(201,168,76,0.08)] transition-colors disabled:opacity-50">
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>
      </header>

      <div className="border-b border-[rgba(201,168,76,0.1)] px-6">
        <div className="max-w-[1400px] mx-auto flex gap-1">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === t.id ? "border-[#c9a84c] text-[#c9a84c]" : "border-transparent text-[#7a8fa8] hover:text-[#d4ccbb]"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-6 py-6">
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="spinner" />
            <p className="text-[#7a8fa8] text-sm">Fetching leads from Google Sheets...</p>
          </div>
        )}

        {!loading && error && (
          <div className="card p-6 text-center py-16">
            <p className="text-[#e05252] font-medium mb-2">Failed to load data</p>
            <p className="text-[#7a8fa8] text-sm mb-4">{error}</p>
            <button onClick={load} className="px-4 py-2 rounded-lg bg-[rgba(201,168,76,0.1)] text-[#c9a84c] text-sm border border-[rgba(201,168,76,0.2)] hover:bg-[rgba(201,168,76,0.15)] transition-colors">
              Try again
            </button>
          </div>
        )}

        {!loading && stats && (
          <>
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KPICard label="Total Leads"    value={stats.totalLeads}              delay={0}   />
                  <KPICard label="Open"           value={stats.openLeads}               delay={50}  />
                  <KPICard label="Contact Rate"
                    value={`${stats.contactRate}%`}
                    sub={stats.contactRate > 50 ? "Above 50%" : "Below 50%"}
                    trend={stats.contactRate > 50 ? "up" : "down"}
                    delay={100} />
                  <KPICard label="Conversion"
                    value={`${stats.conversionRate}%`}
                    sub={stats.conversionRate > 5 ? "Above avg" : "Tracking"}
                    trend={stats.conversionRate > 5 ? "up" : "neutral"}
                    delay={150} />
                </div>
                <DateChart data={stats.byDate} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <HourChart    data={stats.byHour}     />
                  <WeekdayChart data={stats.byWeekday}  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <RegionChart   data={stats.byRegion}   />
                  <PlatformChart data={stats.byPlatform} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <StatusChart       data={stats.byStatus}         />
                  <FormAnswersPanel  data={stats.formAnswersSummary} />
                </div>
              </div>
            )}

            {activeTab === "ads" && (
              <div className="space-y-6">
                <AdPerformanceChart data={stats.byAd}       />
                <CampaignTable      data={stats.byCampaign} />
                <div className="card p-5 fade-up">
                  <div className="mb-4">
                    <h2 className="font-display text-xl text-[#e4c97a] font-semibold">Ad Detail</h2>
                    <div className="gold-rule mt-1" />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[rgba(201,168,76,0.15)]">
                          {["Ad", "Leads", "Contact Rate"].map((h) => (
                            <th key={h} className="text-left py-2 px-3 text-xs tracking-wider uppercase text-[#7a8fa8]">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {stats.byAd.map((row, i) => (
                          <tr key={i} className="border-b border-[rgba(201,168,76,0.06)] hover:bg-[rgba(201,168,76,0.04)] transition-colors">
                            <td className="py-2 px-3 text-[#f5f0e8] max-w-[260px] truncate">{row.ad_name}</td>
                            <td className="py-2 px-3 font-mono text-[#c9a84c]">{row.leads}</td>
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-[rgba(201,168,76,0.1)] rounded-full overflow-hidden max-w-[80px]">
                                  <div className="h-full rounded-full"
                                    style={{ width: `${row.contact_rate}%`, background: row.contact_rate > 50 ? "#3db87a" : "#f0a045" }} />
                                </div>
                                <span className="font-mono text-xs text-[#7a8fa8]">{row.contact_rate}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "agents" && (
              <div className="space-y-6">
                <OwnerTable data={stats.byOwner} />
                <div className="card p-5 fade-up">
                  <div className="mb-4">
                    <h2 className="font-display text-xl text-[#e4c97a] font-semibold">Agent Conversion</h2>
                    <div className="gold-rule mt-1" />
                  </div>
                  <div className="space-y-4">
                    {stats.byOwner.map((agent, i) => {
                      const convRate = agent.leads ? (agent.converted / agent.leads) * 100 : 0;
                      const openCount = stats.leads.filter((l) =>
                        l.owner === agent.owner && ["open","new",""].includes(l.deal_status.toLowerCase())
                      ).length;
                      const openRate = agent.leads ? (openCount / agent.leads) * 100 : 0;
                      return (
                        <div key={i} className="p-3 rounded-lg bg-[rgba(11,22,40,0.5)] border border-[rgba(201,168,76,0.08)]">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-medium text-[#f5f0e8]">{agent.owner}</span>
                            <span className="font-mono text-xs text-[#7a8fa8]">{agent.leads} leads</span>
                          </div>
                          <div className="space-y-2">
                            {[
                              { label: "Contacted",  value: 100 - openRate, color: "#c9a84c"  },
                              { label: "Converted",  value: convRate,        color: "#3db87a"  },
                            ].map((m) => (
                              <div key={m.label} className="flex items-center gap-3">
                                <span className="text-xs text-[#7a8fa8] w-24">{m.label}</span>
                                <div className="flex-1 h-1.5 bg-[rgba(201,168,76,0.1)] rounded-full overflow-hidden">
                                  <div className="h-full rounded-full transition-all"
                                    style={{ width: `${Math.min(m.value, 100)}%`, background: m.color }} />
                                </div>
                                <span className="font-mono text-xs w-10 text-right" style={{ color: m.color }}>
                                  {m.value.toFixed(0)}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "leads" && (
              <div className="space-y-4">
                <LeadsTable data={stats.leads} />
              </div>
            )}
          </>
        )}
      </main>

      <footer className="mt-12 border-t border-[rgba(201,168,76,0.1)] px-6 py-4">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <span className="text-[10px] text-[#7a8fa8] tracking-widest uppercase">Smith & Adams - Lead Intelligence Dashboard</span>
          <span className="text-[10px] text-[#7a8fa8]">Google Sheets</span>
        </div>
      </footer>
    </div>
  );
}
