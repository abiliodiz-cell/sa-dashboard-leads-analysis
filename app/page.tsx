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
  { label: "7d",   days: 7   },
  { label: "30d",  days: 30  },
  { label: "90d",  days: 90  },
  { label: "All",  days: 9999 },
];

type Tab = "overview" | "ads" | "agents" | "leads";

const NAV: { id: Tab; label: string; icon: string }[] = [
  { id: "overview", label: "Overview",          icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
  { id: "ads",      label: "Ads & Campaigns",   icon: "M18 20V10M12 20V4M6 20v-6" },
  { id: "agents",   label: "Agent Performance", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" },
  { id: "leads",    label: "Lead Detail",        icon: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 0-2-2h2a2 2 0 0 0 2 2" },
];

function Icon({ d, size = 15 }: { d: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" width={size} height={size} style={{ flexShrink: 0 }}>
      <path d={d} />
    </svg>
  );
}

export default function DashboardPage() {
  const [stats, setStats]           = useState<DashboardStats | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [days, setDays]             = useState(9999);
  const [activeTab, setActiveTab]   = useState<Tab>("overview");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [collapsed, setCollapsed]   = useState(false);

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
    <div className="app-layout">

      {/* ── SIDEBAR ── */}
      <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>

        {/* Logo */}
        <div style={{ padding: "16px", borderBottom: "1px solid rgba(59,130,246,0.12)", display: "flex", alignItems: "center", gap: 10, minHeight: 60 }}>
          <div style={{ width: 32, height: 20, flexShrink: 0, display: "flex", alignItems: "center" }}>
            <Image src="/sa-logo-white.png" alt="S&A" width={32} height={12} style={{ objectFit: "contain", width: "100%", height: "auto" }} />
          </div>
          {!collapsed && (
            <div>
              <div style={{ color: "white", fontWeight: 600, fontSize: 13, lineHeight: 1.2 }}>Smith & Adams</div>
              <div style={{ color: "#475569", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}>Lead Intelligence</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "8px 0", overflowY: "auto" }}>
          {!collapsed && <div className="nav-label">Navigation</div>}
          {NAV.map((item) => (
            <div key={item.id} className={`nav-item ${activeTab === item.id ? "active" : ""}`}
              onClick={() => setActiveTab(item.id)} title={collapsed ? item.label : undefined}
              style={collapsed ? { justifyContent: "center", padding: "10px" } : {}}>
              <Icon d={item.icon} />
              {!collapsed && <span>{item.label}</span>}
            </div>
          ))}
        </nav>

        {/* Collapse toggle */}
        <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(59,130,246,0.12)" }}>
          <div className="nav-item" onClick={() => setCollapsed(!collapsed)}
            style={collapsed ? { justifyContent: "center", padding: "10px" } : {}}>
            <Icon d={collapsed ? "M9 18l6-6-6-6" : "M15 18l-6-6 6-6"} size={14} />
            {!collapsed && <span style={{ fontSize: 12 }}>Collapse</span>}
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="main-area">

        {/* Top bar */}
        <div className="top-bar">
          <div>
            <div style={{ color: "white", fontWeight: 600, fontSize: 15 }}>
              {NAV.find((n) => n.id === activeTab)?.label}
            </div>
            {lastRefresh && (
              <div style={{ color: "#475569", fontSize: 11, marginTop: 2 }}>
                Updated {lastRefresh.toLocaleTimeString("en-GB")}
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="range-group">
              {RANGES.map((r) => (
                <button key={r.days} className={`range-btn ${days === r.days ? "active" : ""}`}
                  onClick={() => setDays(r.days)}>{r.label}</button>
              ))}
            </div>
            <button className="refresh-btn" onClick={load} disabled={loading}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
                strokeLinecap="round" strokeLinejoin="round" width={13} height={13}
                style={{ animation: loading ? "spin 0.7s linear infinite" : "none" }}>
                <path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="content-area">

          {loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 300, gap: 16 }}>
              <div className="spinner" />
              <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Fetching leads from Google Sheets...</p>
            </div>
          )}

          {!loading && error && (
            <div className="card" style={{ maxWidth: 400, margin: "80px auto", textAlign: "center" }}>
              <p style={{ fontWeight: 600, marginBottom: 6 }}>Failed to load data</p>
              <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 16 }}>{error}</p>
              <button className="refresh-btn" onClick={load} style={{ margin: "0 auto" }}>Try again</button>
            </div>
          )}

          {!loading && stats && (
            <div className="fade-in">

              {/* ── OVERVIEW ── */}
              {activeTab === "overview" && (
                <div className="stack">
                  <div className="kpi-grid">
                    <KPICard label="Total Leads"  value={stats.totalLeads}        color="blue"   delay={0}   />
                    <KPICard label="Open"         value={stats.openLeads}         color="teal"   delay={60}  />
                    <KPICard label="Contact Rate" value={`${stats.contactRate}%`}
                      sub={stats.contactRate > 50 ? "Above 50%" : "Below 50%"}
                      trend={stats.contactRate > 50 ? "up" : "down"}
                      color="indigo" delay={120} />
                    <KPICard label="Conversion"   value={`${stats.conversionRate}%`}
                      sub={stats.conversionRate > 5 ? "Above avg" : "Tracking"}
                      trend={stats.conversionRate > 5 ? "up" : "neutral"}
                      color="green" delay={180} />
                  </div>
                  <DateChart data={stats.byDate} />
                  <div className="grid-2">
                    <HourChart    data={stats.byHour}    />
                    <WeekdayChart data={stats.byWeekday} />
                  </div>
                  <div className="grid-2">
                    <RegionChart   data={stats.byRegion}   />
                    <PlatformChart data={stats.byPlatform} />
                  </div>
                  <div className="grid-2">
                    <StatusChart      data={stats.byStatus}          />
                    <FormAnswersPanel data={stats.formAnswersSummary} />
                  </div>
                </div>
              )}

              {/* ── ADS ── */}
              {activeTab === "ads" && (
                <div className="stack">
                  <AdPerformanceChart data={stats.byAd}       />
                  <CampaignTable      data={stats.byCampaign} />
                  <div className="card">
                    <p className="section-title">Ad Detail</p>
                    <div style={{ overflowX: "auto" }}>
                      <table className="data-table">
                        <thead><tr>
                          <th>Ad Name</th><th>Leads</th><th>Contact Rate</th>
                        </tr></thead>
                        <tbody>
                          {stats.byAd.map((row, i) => (
                            <tr key={i}>
                              <td style={{ fontWeight: 500, maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.ad_name}</td>
                              <td style={{ fontWeight: 700, color: "var(--blue-light)", fontFamily: "DM Mono, monospace" }}>{row.leads}</td>
                              <td>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <div style={{ flex: 1, height: 6, borderRadius: 3, background: "var(--border)", maxWidth: 80 }}>
                                    <div style={{ height: "100%", borderRadius: 3, width: `${row.contact_rate}%`, background: row.contact_rate > 50 ? "var(--success)" : "var(--warning)" }} />
                                  </div>
                                  <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: "var(--text-muted)" }}>{row.contact_rate}%</span>
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
                <div className="stack">
                  <OwnerTable data={stats.byOwner} />
                  <div className="card">
                    <p className="section-title">Agent Conversion Funnel</p>
                    <div className="stack">
                      {stats.byOwner.map((agent, i) => {
                        const conv = agent.leads ? (agent.converted / agent.leads) * 100 : 0;
                        const openN = stats.leads.filter(l => l.owner === agent.owner && ["open","new",""].includes(l.deal_status.toLowerCase())).length;
                        const contacted = agent.leads ? ((agent.leads - openN) / agent.leads) * 100 : 0;
                        return (
                          <div key={i} style={{ padding: "16px", borderRadius: 10, border: "1px solid var(--border)", background: "#f8fafc" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                              <span style={{ fontWeight: 600 }}>{agent.owner}</span>
                              <span style={{ fontSize: 12, fontFamily: "DM Mono, monospace", background: "#dbeafe", color: "#1d4ed8", padding: "2px 10px", borderRadius: 20, fontWeight: 600 }}>{agent.leads} leads</span>
                            </div>
                            {[
                              { label: "Contacted",  value: contacted, color: "var(--blue-light)" },
                              { label: "Converted",  value: conv,      color: "var(--success)"    },
                            ].map(m => (
                              <div key={m.label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                                <span style={{ fontSize: 12, color: "var(--text-muted)", width: 80 }}>{m.label}</span>
                                <div style={{ flex: 1, height: 6, borderRadius: 3, background: "var(--border)" }}>
                                  <div style={{ height: "100%", borderRadius: 3, width: `${Math.min(m.value,100)}%`, background: m.color, transition: "width 0.5s ease" }} />
                                </div>
                                <span style={{ fontSize: 12, fontFamily: "DM Mono, monospace", width: 36, textAlign: "right", fontWeight: 600, color: m.color }}>{m.value.toFixed(0)}%</span>
                              </div>
                            ))}
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
