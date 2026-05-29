"use client";
import Image from "next/image";
import { useState, useEffect, useCallback, useMemo, useRef, CSSProperties } from "react";
import { DashboardStats } from "@/lib/fusion";
import { applyFilters, computeStats, Filters } from "@/lib/clientStats";
import { KPICard } from "@/components/dashboard/KPICard";
import {
  DateChart, HourChart, WeekdayChart, WeekdayDonutChart,
  AdPerformanceChart, CampaignTable, OwnerTable,
  RegionChart, PlatformChart, StatusChart, StatusDonutChart,
  FormAnswersPanel, LeadsTable,
  LeadsHeatmap, ResponseTimeChart, CallsHourChart,
  ResponseTimeBucketsChart, AnswerRateByCountryChart, ResponseTimeByAgentChart,
  CPLByCountryChart, CPLvsResponseChart,
} from "@/components/dashboard/Charts";

// ── Colours ───────────────────────────────────────────────────────────────────
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
type Tab = "overview" | "ads" | "agents" | "leads" | "patterns";

const NAV: { id: Tab; label: string; icon: string }[] = [
  { id: "overview",  label: "Overview",          icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
  { id: "leads",     label: "All Leads",         icon: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 0-2-2h2a2 2 0 0 0 2 2" },
  { id: "patterns",  label: "Patterns",          icon: "M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16" },
  { id: "ads",       label: "Ads & Campaigns",   icon: "M18 20V10M12 20V4M6 20v-6" },
  { id: "agents",    label: "Agent Performance", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" },
];

const QUICK_RANGES = [
  { label: "7d",  days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "All", days: 0 },
];

function presetDateFrom(days: number): string {
  if (days === 0) return "";
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function detectPreset(dateFrom: string, dateTo: string): number | null {
  if (!dateTo) {
    if (!dateFrom) return 0;
    for (const r of QUICK_RANGES) {
      if (r.days > 0 && presetDateFrom(r.days) === dateFrom) return r.days;
    }
  }
  return null;
}

function SvgIcon({ d, size = 16, color = "currentColor" }: { d: string; size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" width={size} height={size} style={{ flexShrink: 0 }}>
      <path d={d} />
    </svg>
  );
}

function fmtMinutes(m: number | null): string {
  if (m == null) return "-";
  if (m < 60)    return `${m}m`;
  if (m < 1440)  return `${(m / 60).toFixed(1)}h`;
  return `${(m / 1440).toFixed(1)}d`;
}

// ── Multi-select dropdown ─────────────────────────────────────────────────────
function MultiSelect({
  label, options, value, onChange,
}: {
  label: string; options: string[]; value: string[]; onChange: (v: string[]) => void;
}) {
  const [open, setOpen]   = useState(false);
  const [pos,  setPos]    = useState({ top: 0, left: 0 });
  const btnRef  = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (
        dropRef.current && !dropRef.current.contains(e.target as Node) &&
        btnRef.current  && !btnRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  function openMenu() {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left });
    }
    setOpen(true);
  }

  const toggle = (v: string) =>
    onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v]);

  const display = value.length === 0
    ? `All ${label}s`
    : value.length === 1
      ? (value[0] || "(unassigned)")
      : `${value.length} ${label}s`;

  const active = value.length > 0;

  return (
    <div>
      <button ref={btnRef} onClick={() => open ? setOpen(false) : openMenu()} style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "6px 12px", borderRadius: 8, cursor: "pointer",
        border: `1px solid ${active ? C.blueLight : C.border}`,
        background: active ? "#eff6ff" : C.surface,
        color: active ? C.blue : C.textMuted,
        fontSize: 12, fontWeight: 500, fontFamily: "inherit", whiteSpace: "nowrap",
        minWidth: 110,
      }}>
        <span style={{ flex: 1, textAlign: "left" }}>{display}</span>
        <SvgIcon d="M6 9l6 6 6-6" size={11} color={active ? C.blue : C.textMuted} />
      </button>

      {open && (
        <div ref={dropRef} style={{
          position: "fixed", top: pos.top, left: pos.left, zIndex: 9999,
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)", minWidth: 200, maxHeight: 280, overflowY: "auto",
        }}>
          <div style={{ padding: "6px 8px", borderBottom: `1px solid ${C.border}` }}>
            <button onClick={() => { onChange([]); setOpen(false); }} style={{
              width: "100%", textAlign: "left", padding: "6px 10px", borderRadius: 6,
              background: value.length === 0 ? "#eff6ff" : "transparent",
              border: "none", cursor: "pointer", fontSize: 12,
              color: value.length === 0 ? C.blue : C.textMid,
              fontFamily: "inherit", fontWeight: value.length === 0 ? 600 : 400,
            }}>All {label}s</button>
          </div>
          <div style={{ padding: "6px 8px" }}>
            {options.map(opt => (
              <label key={opt} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "5px 10px", borderRadius: 6, cursor: "pointer",
                background: value.includes(opt) ? "#f0f9ff" : "transparent",
              }}>
                <input type="checkbox" checked={value.includes(opt)} onChange={() => toggle(opt)}
                  style={{ accentColor: C.blue, cursor: "pointer" }} />
                <span style={{ fontSize: 12, color: C.textMid }}>{opt || "(unassigned)"}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [stats, setStats]             = useState<DashboardStats | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [activeTab, setActiveTab]     = useState<Tab>("overview");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Filter state - default to last 30 days
  const [dateFrom, setDateFrom] = useState(() => presetDateFrom(30));
  const [dateTo,   setDateTo]   = useState("");
  const [selCountries, setSelCountries] = useState<string[]>([]);
  const [selAgents,    setSelAgents]    = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/dashboard?days=9999`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStats(data); setLastRefresh(new Date());
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Available filter options from the full (unfiltered) dataset
  const availableCountries = useMemo(() => {
    if (!stats) return [];
    return [...new Set(stats.leads.map(l => l.country).filter(Boolean))].sort();
  }, [stats]);

  const availableAgents = useMemo(() => {
    if (!stats) return [];
    return [...new Set(stats.leads.map(l => l.owner).filter(Boolean))].sort();
  }, [stats]);

  // Client-side filtered + re-aggregated stats
  const filteredStats = useMemo((): DashboardStats | null => {
    if (!stats) return null;
    const f: Filters = { dateFrom, dateTo, countries: selCountries, agents: selAgents };
    return computeStats(applyFilters(stats.leads, f));
  }, [stats, dateFrom, dateTo, selCountries, selAgents]);

  const curPreset = detectPreset(dateFrom, dateTo);

  const hasActiveFilters = dateFrom || dateTo || selCountries.length > 0 || selAgents.length > 0;

  function clearFilters() {
    setDateFrom(""); setDateTo(""); setSelCountries([]); setSelAgents([]);
  }

  const d = filteredStats ?? stats;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: C.bg }}>

      {/* SIDEBAR */}
      <aside style={{
        width: SIDEBAR_W, minWidth: SIDEBAR_W,
        background: C.navy,
        display: "flex", flexDirection: "column",
        borderRight: `1px solid ${C.navyBorder}`,
        overflow: "hidden",
      }}>
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
                  fontWeight: active ? 600 : 400, fontSize: 13,
                  borderLeft: active ? "3px solid #3b82f6" : "3px solid transparent",
                }}>
                <SvgIcon d={item.icon} size={15} color={active ? "#60a5fa" : "#64748b"} />
                <span>{item.label}</span>
              </div>
            );
          })}
        </nav>

        <div style={{ padding: "16px 20px", borderTop: `1px solid ${C.navyBorder}` }}>
          <div style={{ fontSize: 11, color: "#334155", textAlign: "center", letterSpacing: "0.05em" }}>Smith & Adams Group</div>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* Top bar */}
        <div style={{
          background: C.surface, borderBottom: `1px solid ${C.border}`,
          flexShrink: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}>
          {/* Title row */}
          <div style={{
            height: 56, display: "flex", alignItems: "center",
            justifyContent: "space-between", padding: "0 24px",
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: C.text }}>
                {NAV.find(n => n.id === activeTab)?.label}
              </div>
              {lastRefresh && (
                <div style={{ fontSize: 11, color: C.textFaint, marginTop: 1 }}>
                  Updated: {lastRefresh.toLocaleTimeString("en-GB")}
                  {d && <span style={{ marginLeft: 6, color: C.blue, fontWeight: 600 }}>{d.totalLeads} leads shown</span>}
                </div>
              )}
            </div>
            <button onClick={load} disabled={loading} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer",
              background: C.blueLight, color: "white", fontSize: 12, fontWeight: 600,
              fontFamily: "inherit", opacity: loading ? 0.6 : 1,
            }}>
              <SvgIcon d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
                size={13} color="white" />
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {/* Filter bar */}
          <div style={{
            height: 50, display: "flex", alignItems: "center", gap: 10,
            padding: "0 24px", borderTop: `1px solid ${C.border}`,
            background: "#fafbfc", overflow: "visible",
          }}>
            {/* Quick presets */}
            <div style={{ display: "flex", background: C.bg, borderRadius: 8, padding: 3, gap: 2, border: `1px solid ${C.border}`, flexShrink: 0 }}>
              {QUICK_RANGES.map(r => {
                const active = curPreset === r.days;
                return (
                  <button key={r.days} onClick={() => { setDateFrom(presetDateFrom(r.days)); setDateTo(""); }} style={{
                    padding: "4px 13px", borderRadius: 6, border: "none", cursor: "pointer",
                    fontSize: 12, fontWeight: 600, fontFamily: "inherit",
                    background: active ? C.blueLight : "transparent",
                    color:      active ? "white"     : C.textMuted,
                  }}>{r.label}</button>
                );
              })}
            </div>

            {/* Divider */}
            <div style={{ width: 1, height: 24, background: C.border, flexShrink: 0 }} />

            {/* Date inputs */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 500 }}>From</span>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{
                padding: "5px 10px", borderRadius: 8, border: `1px solid ${C.border}`,
                fontSize: 12, color: C.text, background: C.surface, fontFamily: "inherit", cursor: "pointer",
              }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 500 }}>To</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{
                padding: "5px 10px", borderRadius: 8, border: `1px solid ${C.border}`,
                fontSize: 12, color: C.text, background: C.surface, fontFamily: "inherit", cursor: "pointer",
              }} />
            </div>

            {/* Divider */}
            <div style={{ width: 1, height: 24, background: C.border, flexShrink: 0 }} />

            {/* Country */}
            <MultiSelect
              label="Country"
              options={availableCountries}
              value={selCountries}
              onChange={setSelCountries}
            />

            {/* Agent */}
            <MultiSelect
              label="Agent"
              options={availableAgents}
              value={selAgents}
              onChange={setSelAgents}
            />

            {/* Clear */}
            {hasActiveFilters && (
              <button onClick={clearFilters} style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "5px 11px", borderRadius: 8, cursor: "pointer",
                border: `1px solid #fca5a5`, background: "#fff1f2",
                color: "#dc2626", fontSize: 12, fontWeight: 500, fontFamily: "inherit",
                flexShrink: 0,
              }}>
                <SvgIcon d="M18 6L6 18M6 6l12 12" size={11} color="#dc2626" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>

          {loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 300, gap: 16 }}>
              <div style={{ width: 36, height: 36, border: "3px solid rgba(59,130,246,0.15)", borderTopColor: C.blueLight, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
              <p style={{ color: C.textMuted, fontSize: 13 }}>Loading data from Google Sheets, Pipedrive and JustCall...</p>
              <p style={{ color: C.textFaint, fontSize: 11 }}>First load may take up to 30s while fetching all records</p>
            </div>
          )}

          {!loading && error && (
            <div style={{ ...card, maxWidth: 380, margin: "80px auto", textAlign: "center" }}>
              <p style={{ fontWeight: 600, marginBottom: 8, color: C.text }}>Failed to load data</p>
              <p style={{ color: C.textMuted, fontSize: 13, marginBottom: 16 }}>{error}</p>
              <button onClick={load} style={{ padding: "8px 20px", background: C.blueLight, color: "white", border: "none", borderRadius: 8, fontFamily: "inherit", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Try again</button>
            </div>
          )}

          {!loading && d && (
            <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* OVERVIEW */}
              {activeTab === "overview" && <>
                {stats && stats.byDate.length > 0 && (
                  <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "10px 16px", fontSize: 12, color: "#1d4ed8", display: "flex", alignItems: "center", gap: 8 }}>
                    <SvgIcon d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" size={14} color="#3b82f6" />
                    <span>
                      Sheet data: <strong>{stats.byDate[0]?.date}</strong> to <strong>{stats.byDate[stats.byDate.length-1]?.date}</strong> ({stats.totalLeads} total leads).
                      {" "}Showing <strong>{d.totalLeads}</strong> leads after current filters.
                    </span>
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                  <KPICard label="Total Leads"    value={d.totalLeads}                        icon="leads"   color="blue"   delay={0}   />
                  <KPICard label="Called"         value={`${d.pctCalled}%`}                   icon="contact" color="teal"   delay={60}
                    sub={`${d.leads.filter(l => l.was_called).length} of ${d.totalLeads}`}
                    trend={d.pctCalled > 70 ? "up" : "down"} />
                  <KPICard label="Answer Rate"    value={`${d.callAnswerRate}%`}              icon="open"    color="indigo" delay={120}
                    sub={d.callAnswerRate > 50 ? "Above 50%" : "Below 50%"}
                    trend={d.callAnswerRate > 50 ? "up" : "down"} />
                  <KPICard label="Avg Response"   value={fmtMinutes(d.avgMinutesToFirstCall)} icon="star"    color="green"  delay={180}
                    sub="time to first call" />
                </div>
                {d.totalSpend > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                    <KPICard label="Total Spend (90d)" value={`$${d.totalSpend.toFixed(0)}`}  icon="star" color="indigo" delay={0} sub="Meta Ads" />
                    <KPICard label="Avg CPL"           value={`$${d.avgCPL.toFixed(2)}`}      icon="star" color="teal"   delay={60} sub="cost per lead" />
                    <div /><div />
                  </div>
                )}

                <DateChart data={d.byDate} />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <HourChart    data={d.byHour}    />
                  <WeekdayChart data={d.byWeekday} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <RegionChart   data={d.byRegion}   />
                  <PlatformChart data={d.byPlatform} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <StatusChart      data={d.byStatus}           />
                  <FormAnswersPanel data={d.formAnswersSummary} />
                </div>
              </>}

              {/* LEADS */}
              {activeTab === "leads" && (
                <LeadsTable data={d.leads} />
              )}

              {/* PATTERNS */}
              {activeTab === "patterns" && <>

                {/* KPI row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                  {[
                    { label: "Peak Hour",         value: (() => { const h = [...d.byHour].sort((a,b)=>b.count-a.count)[0]; return h ? `${h.hour}:00` : "-"; })() },
                    { label: "Peak Day",          value: (() => { const w = [...d.byWeekday].sort((a,b)=>b.count-a.count)[0]; return w ? w.day.slice(0,3) : "-"; })() },
                    { label: "Top Country",       value: d.byRegion[0]?.region || "-" },
                    { label: "Avg Response Time", value: fmtMinutes(d.avgMinutesToFirstCall) },
                  ].map((kpi, i) => (
                    <div key={i} style={{ ...card, textAlign: "center" }}>
                      <p style={{ ...sectionLabel, marginBottom: 8 }}>{kpi.label}</p>
                      <p style={{ fontSize: 28, fontWeight: 700, color: C.blue }}>{kpi.value}</p>
                    </div>
                  ))}
                </div>

                {/* Section: Temporal Patterns */}
                <SectionHeader title="Temporal Patterns" description="When do leads arrive and calls get answered" />
                <LeadsHeatmap data={d.heatmap} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <HourChart       data={d.byHour}    />
                  <WeekdayDonutChart data={d.byWeekday} />
                </div>

                {/* Section: Response Time Analysis */}
                <SectionHeader title="Response Time Analysis" description="How fast leads are being contacted and call outcomes" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <ResponseTimeBucketsChart leads={d.leads} />
                  <ResponseTimeChart        data={d.responseTimeByCountry} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <ResponseTimeByAgentChart leads={d.leads} />
                  <CallsHourChart           data={d.callsByHour} />
                </div>

                {/* Section: Geographic Analysis */}
                <SectionHeader title="Geographic Analysis" description="Lead volume and call performance by country" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <RegionChart               data={d.byRegion} />
                  <AnswerRateByCountryChart  leads={d.leads}   />
                </div>

                {/* Section: Cost Analysis */}
                {d.cplByCountry.length > 0 && <>
                  <SectionHeader title="Cost Analysis" description="Lead cost from Meta Ads - last 90 days" />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <CPLByCountryChart    data={d.cplByCountry}      />
                    <CPLvsResponseChart   data={d.cplVsResponseTime} />
                  </div>
                </>}

                {/* Section: Status & Platform */}
                <SectionHeader title="Pipeline Status" description="Current deal stage distribution across leads" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <StatusDonutChart data={d.byStatus}   />
                  <PlatformChart   data={d.byPlatform} />
                </div>

                {/* Section: AI Analysis */}
                <SectionHeader title="AI Analysis" description="Claude analyzes your filtered data and surfaces patterns and recommendations" />
                <AIInsightsPanel stats={d} />

              </>}

              {/* ADS */}
              {activeTab === "ads" && <>
                <AdPerformanceChart data={d.byAd} />
                <CampaignTable      data={d.byCampaign} />
                <div style={card}>
                  <p style={sectionLabel}>Ad Detail</p>
                  <AdDetailTable data={d.byAd} />
                </div>
              </>}

              {/* AGENTS */}
              {activeTab === "agents" && <>
                <OwnerTable data={d.byOwner} />
                <div style={card}>
                  <p style={sectionLabel}>Agent Conversion Funnel</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {d.byOwner.map((agent, i) => {
                      const conv    = agent.leads ? (agent.converted / agent.leads) * 100 : 0;
                      const callPct = agent.leads ? (agent.called / agent.leads) * 100 : 0;
                      const ansPct  = agent.called ? (agent.answered / agent.called) * 100 : 0;
                      return (
                        <div key={i} style={{ padding: 16, borderRadius: 10, background: "#f8fafc", border: `1px solid ${C.border}` }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                            <span style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{agent.owner}</span>
                            <span style={{ fontSize: 12, background: "#dbeafe", color: "#1d4ed8", padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>{agent.leads} leads</span>
                          </div>
                          {[
                            { label: "Called",    value: callPct, color: C.teal   },
                            { label: "Answered",  value: ansPct,  color: C.indigo },
                            { label: "Converted", value: conv,    color: C.green  },
                          ].map(m => (
                            <div key={m.label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                              <span style={{ fontSize: 12, color: C.textMuted, width: 80 }}>{m.label}</span>
                              <div style={{ flex: 1, height: 7, borderRadius: 4, background: C.border }}>
                                <div style={{ height: "100%", borderRadius: 4, width: `${Math.min(m.value, 100)}%`, background: m.color, transition: "width 0.5s" }} />
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

            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div style={{ paddingTop: 8 }}>
      <div style={{ height: 1, background: C.border, marginBottom: 16 }} />
      <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: description ? 2 : 0 }}>{title}</div>
      {description && <div style={{ fontSize: 12, color: C.textMuted }}>{description}</div>}
    </div>
  );
}

// ── AI Insights Panel ─────────────────────────────────────────────────────────
function buildAnalysisPayload(stats: DashboardStats) {
  const leads = stats.leads;
  const buckets: Record<string, number> = { "Under 1h": 0, "1-24h": 0, "1-3 days": 0, "Over 3 days": 0, "Not called": 0 };
  leads.forEach(l => {
    if (!l.was_called) { buckets["Not called"]++; return; }
    const m = l.minutes_to_first_call;
    if (m == null || m <= 0) { buckets["Not called"]++; return; }
    if (m < 60)        buckets["Under 1h"]++;
    else if (m < 1440) buckets["1-24h"]++;
    else if (m < 4320) buckets["1-3 days"]++;
    else               buckets["Over 3 days"]++;
  });
  const topHours = [...stats.byHour].sort((a,b)=>b.count-a.count).slice(0,3).map(h=>`${h.hour}:00 (${h.count})`);
  const topDays  = [...stats.byWeekday].sort((a,b)=>b.count-a.count).slice(0,3).map(d=>`${d.day} (${d.count})`);
  return {
    totalLeads:            stats.totalLeads,
    pctCalled:             stats.pctCalled,
    callAnswerRate:        stats.callAnswerRate,
    avgMinutesToFirstCall: stats.avgMinutesToFirstCall,
    byStatus:              stats.byStatus.slice(0, 6),
    byCountry:             stats.byRegion.slice(0, 8),
    byAgent:               stats.byOwner.map(o => ({ agent: o.owner, leads: o.leads, called: o.called, answered: o.answered, converted: o.converted })),
    topHours,
    topDays,
    responseTimeBuckets:   buckets,
    responseTimeByCountry: stats.responseTimeByCountry.slice(0, 5),
    byCampaign:            stats.byCampaign.slice(0, 5),
  };
}

function renderAnalysis(text: string) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("## ")) return (
      <div key={i} style={{ fontWeight: 700, fontSize: 14, color: C.text, marginTop: i > 0 ? 20 : 0, marginBottom: 8, borderBottom: `1px solid ${C.border}`, paddingBottom: 6 }}>
        {line.replace("## ", "")}
      </div>
    );
    if (line.startsWith("- ") || line.startsWith("* ")) return (
      <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
        <span style={{ color: C.blueLight, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>-</span>
        <span style={{ fontSize: 13, color: C.textMid, lineHeight: 1.6 }}>{line.slice(2)}</span>
      </div>
    );
    if (line.trim() === "") return <div key={i} style={{ height: 4 }} />;
    return <p key={i} style={{ fontSize: 13, color: C.textMid, lineHeight: 1.6, margin: "0 0 6px" }}>{line}</p>;
  });
}

function AIInsightsPanel({ stats }: { stats: DashboardStats }) {
  const [loading,  setLoading]  = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error,    setError]    = useState<string | null>(null);

  async function analyze() {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildAnalysisPayload(stats)),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Analysis failed");
      setAnalysis(data.analysis);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ ...card }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: "linear-gradient(135deg, #cc785c 0%, #e8a87c 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, color: "white", flexShrink: 0,
            }}>AI</div>
            <span style={{ fontWeight: 700, fontSize: 15, color: C.text }}>Claude Insights</span>
          </div>
          <p style={{ fontSize: 12, color: C.textMuted, margin: 0 }}>
            Powered by Claude {analysis ? `- ${stats.totalLeads} leads analyzed` : "- click to analyze your filtered data"}
          </p>
        </div>
        <button onClick={analyze} disabled={loading} style={{
          display: "flex", alignItems: "center", gap: 7, flexShrink: 0,
          padding: "9px 20px", borderRadius: 9, border: "none",
          cursor: loading ? "default" : "pointer",
          background: loading ? C.bg : "linear-gradient(135deg, #cc785c 0%, #e8a87c 100%)",
          color: loading ? C.textMuted : "white",
          fontSize: 13, fontWeight: 600, fontFamily: "inherit",
          boxShadow: loading ? "none" : "0 2px 8px rgba(204,120,92,0.35)",
        }}>
          {loading
            ? <><div style={{ width: 14, height: 14, border: "2px solid #94a3b8", borderTopColor: C.textMuted, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> Analyzing...</>
            : analysis ? "Re-analyze" : "Generate Insights"
          }
        </button>
      </div>

      {!analysis && !loading && !error && (
        <div style={{ textAlign: "center", padding: "36px 0", background: "#fafbfc", borderRadius: 10, border: `1px dashed ${C.border}` }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, #cc785c 0%, #e8a87c 100%)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 20, fontWeight: 700, color: "white" }}>AI</div>
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: C.textMid, marginBottom: 6 }}>AI-Powered Pattern Analysis</p>
          <p style={{ fontSize: 12, color: C.textMuted, maxWidth: 340, margin: "0 auto" }}>
            Claude will analyze your {stats.totalLeads} filtered leads and surface key patterns, agent performance gaps, and actionable recommendations.
          </p>
        </div>
      )}

      {error && (
        <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10, padding: "14px 16px", fontSize: 13, color: "#9a3412" }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Could not generate analysis</div>
          <div>{error.includes("ANTHROPIC_API_KEY")
            ? "Set the ANTHROPIC_API_KEY environment variable in your Vercel project settings to enable AI insights."
            : error
          }</div>
        </div>
      )}

      {analysis && (
        <div style={{ paddingTop: 4 }}>{renderAnalysis(analysis)}</div>
      )}
    </div>
  );
}

function AdDetailTable({ data }: { data: any[] }) {
  const hasSpend = data.some(r => r.spend > 0);
  const thS: React.CSSProperties = { textAlign: "left", padding: "10px 12px", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#64748b", borderBottom: "2px solid #e2e8f0", whiteSpace: "nowrap" };
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            <th style={thS}>Campaign</th>
            <th style={thS}>Ad Name</th>
            <th style={thS}>Leads</th>
            {hasSpend && <><th style={thS}>Spend</th><th style={thS}>CPL</th><th style={thS}>Impressions</th></>}
            <th style={thS}>Contact Rate</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
              <td style={{ padding: "10px 12px", color: "#64748b", fontSize: 12, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={row.campaign_name}>{row.campaign_name || "-"}</td>
              <td style={{ padding: "10px 12px", color: "#0f172a", fontWeight: 500, maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={row.ad_name}>{row.ad_name}</td>
              <td style={{ padding: "10px 12px", color: "#3b82f6", fontWeight: 700, fontFamily: "DM Mono, monospace" }}>{row.leads}</td>
              {hasSpend && <>
                <td style={{ padding: "10px 12px", color: row.spend > 0 ? "#f97316" : "#94a3b8", fontWeight: 700, fontFamily: "DM Mono, monospace" }}>
                  {row.spend > 0 ? `$${row.spend.toFixed(0)}` : "-"}
                </td>
                <td style={{ padding: "10px 12px", color: row.cpl > 0 ? "#10b981" : "#94a3b8", fontWeight: 700, fontFamily: "DM Mono, monospace" }}>
                  {row.cpl > 0 ? `$${row.cpl.toFixed(2)}` : "-"}
                </td>
                <td style={{ padding: "10px 12px", color: "#64748b", fontFamily: "DM Mono, monospace" }}>
                  {row.impressions > 0 ? row.impressions.toLocaleString() : "-"}
                </td>
              </>}
              <td style={{ padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 70, height: 6, borderRadius: 3, background: "#e2e8f0" }}>
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
