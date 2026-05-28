"use client";

interface KPICardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  color?: "blue" | "teal" | "indigo" | "green";
  icon?: string;
  delay?: number;
}

const BG: Record<string, [string, string]> = {
  blue:   ["#1d4ed8", "#3b82f6"],
  teal:   ["#0e7490", "#0891b2"],
  indigo: ["#4338ca", "#6366f1"],
  green:  ["#047857", "#10b981"],
};

const ICONS: Record<string, string> = {
  leads:   "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  open:    "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  contact: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z",
  star:    "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
};

export function KPICard({ label, value, sub, trend, color = "blue", icon = "leads", delay = 0 }: KPICardProps) {
  const [from, to] = BG[color] || BG.blue;
  const d = ICONS[icon] || ICONS.leads;

  return (
    <div className="fade-in" style={{
      background: `linear-gradient(135deg, ${from}, ${to})`,
      borderRadius: 14,
      padding: "20px 20px 18px",
      color: "white",
      display: "flex",
      flexDirection: "column",
      gap: 12,
      boxShadow: `0 4px 14px ${from}55`,
      animationDelay: `${delay}ms`,
      minHeight: 120,
    }}>
      {/* Label + Icon row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.85 }}>{label}</span>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width={16} height={16}>
            <path d={d} />
          </svg>
        </div>
      </div>
      {/* Value + sub */}
      <div>
        <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1, letterSpacing: "-0.02em" }}>{value}</div>
        {sub && (
          <div style={{ fontSize: 11, marginTop: 5, opacity: 0.8, display: "flex", alignItems: "center", gap: 3 }}>
            {trend === "up" && <span>↑</span>}
            {trend === "down" && <span>↓</span>}
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}
