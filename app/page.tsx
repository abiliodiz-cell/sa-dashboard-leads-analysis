"use client";
import Image from "next/image";
import { useState, useEffect, useCallback, CSSProperties } from "react";
import { DashboardStats } from "@/lib/fusion";
import { KPICard } from "@/components/dashboard/KPICard";
import {
  DateChart, HourChart, WeekdayChart,
  AdPerformanceChart, CampaignTable, OwnerTable,
  RegionChart, PlatformChart, StatusChart,
  FormAnswersPanel, LeadsTable,
} from "@/components/dashboard/Charts";

// ── Colours ──────────────────────────────────────────────────────────────────
const C = {
  navy:       "#0f2040",
  navyLight:  "#152a54",
  navyBorder: "rgba(255,255,255,0.07)",
  bg:         "#f0f4f8",
  surface:    "#ffffff",
  border:     "#e2e8f0",
  blue:       "#2563eb",
  blueLight:  "#3b82f6",
  teal:       "#0891b2",
  indigo:     "#4f46e5",
  green:      "#10b981",
  text:       "#0f172a",
  textMid:    "#334155",
  textMuted:  "#64748b",
  textFaint:  "#94a3b8",
};

// ── Shared styles ─────────────────────────────────────────────────────────────
const card: CSSProperties = {
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: 14,
  boxShadow: "0 1px 4px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.03)",
  padding: 20,
};

const sectionLabel: CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
  color: C.textFaint,
  marginBottom: 14,
};

// ── Layout constants ──────────────────────────────────────────────────────────
const SIDEBAR_W = 230;
const RANGES    = [{ label: "7d", days: 7 }, { label: "30d", days: 30 }, { label: "90d", days: 90 }, { label: "All", days: 9999 }];
type Tab        = "overview" | "ads" | "agents" | "leads";

const NAV: { id: Tab; label: string; icon: string }[] = [
  { id: "overview", label: "Overview",          icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
  { id: "ads",      label: "Ads & Campaigns",   icon: "M18 20V10M12 20V4M6 20v-6" },
  { id: "agents",   label: "Agent Performance", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" },
  { id: "leads",    label: "All Leads",         icon: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 0-2-2h2a2 2 0 0 0 2 2" },
];

function SvgIcon({ d, size = 16, color = "currentColor" }: { d: string; size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" width={size} height={size} style={{ flexShrink: 0 }}>
      <path d={d} />
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [stats, setStats]           = useState<DashboardStats | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [days, setDays]             = useState(9999);
  const [activeTab, setActiveTab]   = useState<Tab>("overview");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/dashboard?days=${days}`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStats(data); setLastRefresh(new Date());
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: C.bg }}>

      {/* ══ SIDEBAR ══════════════════════════════════════════════════════════ */}
      <aside style={{
        width: SIDEBAR_W, minWidth: SIDEBAR_W,
        background: C.navy,
        display: "flex", flexDirection: "column",
        borderRight: `1px solid ${C.navyBorder}`,
        overflow: "hidden",
      }}>
        {/* Logo block */}
        <div style={{ padding: "24px 20px 20px", borderBottom: `1px solid ${C.navyBorder}` }}>
          <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}>
            <Image src="/sa-logo-white.png" alt="Smith & Adams" width={120} height={40}
              style={{ objectFit: "contain", width: "auto", height: 36 }} />
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "white", fontWeight: 700, fontSize: 14, letterSpacing: "0.01em" }}>Smith & Adams</div>
            <div style={{ color: C.textFaint, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 2 }}>Lead Intelligence</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "16px 12px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#334155", padding: "4px 8px 10px" }}>Menu</div>
          {NAV.map((item) => {
            const active = activeTab === item.id;
            return (
              <div key={item.id} onClick={() => setActiveTab(item.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                  background: active ? "rgba(59,130,246,0.18)" : "transparent",
                  color: active ? "#60a5fa" : "#94a3b8",
                  fontWeight: active ? 600 : 400,
                  fontSize: 13,
                  transition: "all 0.15s",
                  borderLeft: active ? "3px solid #3b82f6" : "3px solid transparent",
                }}>
                <SvgIcon d={item.icon} size={15} color={active ? "#60a5fa" : "#64748b"} />
                <span>{item.label}</span>
              </div>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div style={{ padding: "16px 20px", borderTop: `1px solid ${C.navyBorder}` }}>
          <div style={{ fontSize: 11, color: "#334155", textAlign: "center", letterSpacing: "0.05em" }}>
            Smith & Adams Group
          </div>
        </div>
      </aside>

      {/* ══ MAIN ═════════════════════════════════════════════════════════════ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* Top bar */}
        <div style={{
          height: 60, background: C.surface, borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 24px", flexShrink: 0,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: C.text }}>
              {NAV.find(n => n.id === activeTab)?.label}
            </div>
            {lastRefresh && (
              <div style={{ fontSize: 11, color: C.textFaint, marginTop: 1 }}>
                Last updated: {lastRefresh.toLocaleTimeString("en-GB")}
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Range pills */}
            <div style={{ display: "flex", background: C.bg, borderRadius: 8, padding: 3, gap: 2, border: `1px solid ${C.border}` }}>
              {RANGES.map(r => (
                <button key={r.days} onClick={() => setDays(r.days)} style={{
                  padding: "5px 14px", borderRadius: 6, border: "none", cursor: "pointer",
                  fontSize: 12, fontWeight: 600, transition: "all 0.15s",
                  background: days === r.days ? C.blueLight : "transparent",
                  color:      days === r.days ? "white"     : C.textMuted,
                  fontFamily: "inherit",
                }}>{r.label}</button>
              ))}
            </div>
            {/* Refresh */}
            <button onClick={load} disabled={loading} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer",
              background: C.blueLight, color: "white", fontSize: 12, fontWeight: 600,
              fontFamily: "inherit", opacity: loading ? 0.6 : 1,
            }}>
              <SvgIcon d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
                size={13} color="white" />
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>

          {/* Loading */}
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 300, gap: 16 }}>
              <div style={{ width: 36, height: 36, border: "3px solid rgba(59,130,246,0.15)", borderTopColor: C.blueLight, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
              <p style={{ color: C.textMuted, fontSize: 13 }}>Fetching leads from Google Sheets...</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div style={{ ...card, maxWidth: 380, margin: "80px auto", textAlign: "center" }}>
              <p style={{ fontWeight: 600, marginBottom: 8, color: C.text }}>Failed to load data</p>
              <p style={{ color: C.textMuted, fontSize: 13, marginBottom: 16 }}>{error}</p>
              <button onClick={load} style={{ padding: "8px 20px", background: C.blueLight, color: "white", border: "none", borderRadius: 8, fontFamily: "inherit", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Try again</button>
            </div>
          )}

          {/* Content */}
          {!loading && stats && (
            <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* ── OVERVIEW ── */}
              {activeTab === "overview" && <>
                {/* KPI Row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                  <KPICard label="Total Leads"  value={stats.totalLeads}         icon="leads"   color="blue"   delay={0}   />
                  <KPICard label="Open Leads"   value={stats.openLeads}          icon="open"    color="teal"   delay={60}  />
                  <KPICard label="Contact Rate" value={`${stats.contactRate}%`}  icon="contact" color="indigo"
                    sub={stats.contactRate > 50 ? "Above 50%" : "Below 50%"} trend={stats.contactRate > 50 ? "up" : "down"} delay={120} />
                  <KPICard label="Conversion"   value={`${stats.conversionRate}%`} icon="star"  color="green"
                    sub={stats.conversionRate > 5 ? "Above avg" : "Tracking"} trend={stats.conversionRate > 5 ? "up" : "neutral"} delay={180} />
                </div>

                {/* Timeline */}
                <DateChart data={stats.byDate} />

                {/* Row 2 */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <HourChart    data={stats.byHour}    />
                  <WeekdayChart data={stats.byWeekday} />
                </div>

                {/* Row 3 */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <RegionChart   data={stats.byRegion}   />
                  <PlatformChart data={stats.byPlatform} />
                </div>

                {/* Row 4 */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <StatusChart      data={stats.byStatus}           />
                  <FormAnswersPanel data={stats.formAnswersSummary} />
                </div>
              </>}

              {/* ── ADS ── */}
              {activeTab === "ads" && <>
                <AdPerformanceChart data={stats.byAd}       />
                <CampaignTable      data={stats.byCampaign} />
                <div style={card}>
                  <p style={sectionLabel}>Ad Detail</p>
                  <AdDetailTable data={stats.byAd} />
                </div>
              </>}

              {/* ── AGENTS ── */}
              {activeTab === "agents" && <>
                <OwnerTable data={stats.byOwner} />
                <div style={card}>
                  <p style={sectionLabel}>Agent Conversion Funnel</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {stats.byOwner.map((agent, i) => {
                      const conv   = agent.leads ? (agent.converted / agent.leads) * 100 : 0;
                      const openN  = stats.leads.filter(l => l.owner === agent.owner && ["open","new",""].includes(l.deal_status.toLowerCase())).length;
                      const conPct = agent.leads ? ((agent.leads - openN) / agent.leads) * 100 : 0;
                      return (
                        <div key={i} style={{ padding: 16, borderRadius: 10, background: "#f8fafc", border: `1px solid ${C.border}` }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                            <span style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{agent.owner}</span>
                            <span style={{ fontSize: 12, background: "#dbeafe", color: "#1d4ed8", padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>{agent.leads} leads</span>
                          </div>
                          {[
                            { label: "Contacted", value: conPct, color: C.blueLight },
                            { label: "Converted", value: conv,   color: C.green     },
                          ].map(m => (
                            <div key={m.label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                              <span style={{ fontSize: 12, color: C.textMuted, width: 80 }}>{m.label}</span>
                              <div style={{ flex: 1, height: 7, borderRadius: 4, background: C.border }}>
                                <div style={{ height: "100%", borderRadius: 4, width: `${Math.min(m.value,100)}%`, background: m.color, transition: "width 0.5s ease" }} />
                              </div>
                              <span style={{ fontSize: 12, fontFamily: "DM Mono, monospace", width: 36, textAlign: "right", fontWeight: 700, color: m.color }}>{m.value.toFixed(0)}%</span>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>}

              {/* ── LEADS ── */}
              {activeTab === "leads" && <LeadsTable data={stats.leads} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AdDetailTable({ data }: { data: any[] }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {["Ad Name", "Leads", "Contact Rate"].map(h => (
              <th key={h} style={{ textAlign: "left", padding: "10px 12px", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "#64748b", borderBottom: "2px solid #e2e8f0" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
              <td style={{ padding: "10px 12px", color: "#0f172a", fontWeight: 500, maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.ad_name}</td>
              <td style={{ padding: "10px 12px", color: "#3b82f6", fontWeight: 700, fontFamily: "DM Mono, monospace" }}>{row.leads}</td>
              <td style={{ padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 80, height: 6, borderRadius: 3, background: "#e2e8f0" }}>
                    <div style={{ height: "100%", borderRadius: 3, width: `${row.contact_rate}%`, background: row.contact_rate > 50 ? "#10b981" : "#f59e0b" }} />
                  </div>
                  <span style={{ fontSize: 12, fontFamily: "DM Mono, monospace", color: "#64748b" }}>{row.contact_rate}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
