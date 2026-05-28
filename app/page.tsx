"use client";
import Image from "next/image";
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

type Tab = "overview" | "ads" | "agents" | "leads";

const NAV: { id: Tab; label: string; icon: string }[] = [
  { id: "overview", label: "Overview",          icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
  { id: "ads",      label: "Ads & Campaigns",   icon: "M18 20V10M12 20V4M6 20v-6" },
  { id: "agents",   label: "Agent Performance", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" },
  { id: "leads",    label: "Lead Detail",       icon: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" },
];

function NavIcon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" width={15} height={15} className="flex-shrink-0">
      <path d={d} />
    </svg>
  );
}

export default function DashboardPage() {
  const [stats, setStats]         = useState<DashboardStats | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [days, setDays]           = useState(30);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
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

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>

      {/* ─── SIDEBAR ─── */}
      <aside
        className="flex-shrink-0 flex flex-col transition-all duration-300"
        style={{
          width: sidebarOpen ? 230 : 64,
          background: "var(--sidebar)",
          borderRight: "1px solid var(--sidebar-border)",
        }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: "var(--sidebar-border)" }}>
          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
            <Image src="/sa-logo-white.png" alt="Smith & Adams" width={32} height={12} style={{ objectFit: "contain" }} />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <div className="text-white font-semibold text-sm leading-tight whitespace-nowrap">Smith & Adams</div>
              <div className="text-[#475569] text-[10px] tracking-widest uppercase whitespace-nowrap">Lead Intelligence</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {sidebarOpen && <div className="nav-section-label">Navigation</div>}
          {NAV.map((item) => (
            <div key={item.id}
              className={`nav-item ${activeTab === item.id ? "active" : ""}`}
              onClick={() => setActiveTab(item.id)}
              title={!sidebarOpen ? item.label : undefined}>
              <NavIcon d={item.icon} />
              {sidebarOpen && <span>{item.label}</span>}
            </div>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="p-3 border-t" style={{ borderColor: "var(--sidebar-border)" }}>
          <div
            className="nav-item justify-center"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? "Collapse" : "Expand"}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round" width={14} height={14}>
              <path d={sidebarOpen ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} />
            </svg>
            {sidebarOpen && <span className="text-xs">Collapse</span>}
          </div>
        </div>
      </aside>

      {/* ─── MAIN ─── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top Header */}
        <header
          className="flex-shrink-0 flex items-center justify-between px-6 py-4"
          style={{
            background: "var(--sidebar)",
            borderBottom: "1px solid var(--sidebar-border)",
          }}>

          <div>
            <h1 className="text-white font-semibold text-base">
              {NAV.find((n) => n.id === activeTab)?.label}
            </h1>
            {lastRefresh && (
              <p className="text-[#475569] text-[10px] mt-0.5">
                Updated {lastRefresh.toLocaleTimeString("en-GB")}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Range selector */}
            <div className="flex items-center gap-0.5 bg-[#0e2040] rounded-lg p-1 border" style={{ borderColor: "var(--sidebar-border)" }}>
              {RANGES.map((r) => (
                <button key={r.days} onClick={() => setDays(r.days)}
                  className={`range-btn ${days === r.days ? "active" : ""}`}>
                  {r.label}
                </button>
              ))}
            </div>

            {/* Refresh */}
            <button onClick={load} disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
              style={{ background: "var(--blue)", color: "#fff" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" width={13} height={13}
                className={loading ? "animate-spin" : ""}>
                <path d="M23 4v6h-6M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">

          {loading && (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="spinner" />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Fetching leads from Google Sheets...</p>
            </div>
          )}

          {!loading && error && (
            <div className="card p-8 text-center max-w-md mx-auto mt-16">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" width={22} height={22}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              </div>
              <p className="font-semibold mb-1" style={{ color: "var(--text)" }}>Failed to load data</p>
              <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>{error}</p>
              <button onClick={load} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: "var(--blue)" }}>
                Try again
              </button>
            </div>
          )}

          {!loading && stats && (
            <>
              {/* ── OVERVIEW ── */}
              {activeTab === "overview" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <KPICard label="Total Leads"   value={stats.totalLeads}       gradient={1} icon="leads"   delay={0}   />
                    <KPICard label="Open"           value={stats.openLeads}        gradient={2} icon="open"    delay={60}  />
                    <KPICard label="Contact Rate"   value={`${stats.contactRate}%`}
                      sub={stats.contactRate > 50 ? "Above 50%" : "Below 50%"}
                      trend={stats.contactRate > 50 ? "up" : "down"}
                      gradient={3} icon="contact" delay={120} />
                    <KPICard label="Conversion"     value={`${stats.conversionRate}%`}
                      sub={stats.conversionRate > 5 ? "Above avg" : "Tracking"}
                      trend={stats.conversionRate > 5 ? "up" : "neutral"}
                      gradient={4} icon="convert" delay={180} />
                  </div>
                  <DateChart data={stats.byDate} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <HourChart data={stats.byHour} />
                    <WeekdayChart data={stats.byWeekday} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <RegionChart data={stats.byRegion} />
                    <PlatformChart data={stats.byPlatform} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <StatusChart data={stats.byStatus} />
                    <FormAnswersPanel data={stats.formAnswersSummary} />
                  </div>
                </div>
              )}

              {/* ── ADS ── */}
              {activeTab === "ads" && (
                <div className="space-y-5">
                  <AdPerformanceChart data={stats.byAd} />
                  <CampaignTable data={stats.byCampaign} />
                  <div className="card p-5 fade-up">
                    <p className="section-title">Ad Detail</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr style={{ borderBottom: "1px solid var(--border)" }}>
                            {["Ad Name", "Leads", "Contact Rate"].map((h) => (
                              <th key={h} className="text-left py-2.5 px-3 text-xs font-semibold tracking-wider uppercase"
                                style={{ color: "var(--text-muted)" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {stats.byAd.map((row, i) => (
                            <tr key={i} className="transition-colors hover:bg-blue-50/50"
                              style={{ borderBottom: "1px solid var(--border)" }}>
                              <td className="py-2.5 px-3 max-w-[280px] truncate font-medium"
                                style={{ color: "var(--text)" }}>{row.ad_name}</td>
                              <td className="py-2.5 px-3 font-mono font-semibold"
                                style={{ color: "var(--blue)" }}>{row.leads}</td>
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1.5 rounded-full max-w-[80px]"
                                    style={{ background: "var(--border)" }}>
                                    <div className="h-full rounded-full"
                                      style={{ width: `${row.contact_rate}%`, background: row.contact_rate > 50 ? "var(--success)" : "var(--warning)" }} />
                                  </div>
                                  <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>{row.contact_rate}%</span>
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

              {/* ── AGENTS ── */}
              {activeTab === "agents" && (
                <div className="space-y-5">
                  <OwnerTable data={stats.byOwner} />
                  <div className="card p-5 fade-up">
                    <p className="section-title">Agent Conversion Funnel</p>
                    <div className="space-y-4">
                      {stats.byOwner.map((agent, i) => {
                        const convRate = agent.leads ? (agent.converted / agent.leads) * 100 : 0;
                        const openCount = stats.leads.filter((l) =>
                          l.owner === agent.owner && ["open","new",""].includes(l.deal_status.toLowerCase())
                        ).length;
                        const contactedRate = agent.leads ? ((agent.leads - openCount) / agent.leads) * 100 : 0;
                        return (
                          <div key={i} className="p-4 rounded-xl border fade-up"
                            style={{ borderColor: "var(--border)", animationDelay: `${i * 50}ms` }}>
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-semibold text-sm" style={{ color: "var(--text)" }}>{agent.owner}</span>
                              <span className="text-xs font-mono px-2.5 py-1 rounded-full font-medium"
                                style={{ background: "var(--blue-pale)", color: "var(--blue)" }}>
                                {agent.leads} leads
                              </span>
                            </div>
                            <div className="space-y-2">
                              {[
                                { label: "Contacted", value: contactedRate, color: "var(--blue-light)" },
                                { label: "Converted", value: convRate,      color: "var(--success)"    },
                              ].map((m) => (
                                <div key={m.label} className="flex items-center gap-3">
                                  <span className="text-xs w-20" style={{ color: "var(--text-muted)" }}>{m.label}</span>
                                  <div className="flex-1 h-2 rounded-full" style={{ background: "var(--border)" }}>
                                    <div className="h-full rounded-full transition-all"
                                      style={{ width: `${Math.min(m.value, 100)}%`, background: m.color }} />
                                  </div>
                                  <span className="font-mono text-xs w-10 text-right font-semibold"
                                    style={{ color: m.color }}>{m.value.toFixed(0)}%</span>
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

              {/* ── LEADS ── */}
              {activeTab === "leads" && (
                <LeadsTable data={stats.leads} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
