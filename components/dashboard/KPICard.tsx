"use client";

interface KPICardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  gradient?: 1 | 2 | 3 | 4;
  icon?: string;
  delay?: number;
}

const ICONS: Record<string, string> = {
  leads:   "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  open:    "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  contact: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z",
  convert: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
};

export function KPICard({ label, value, sub, trend, gradient = 1, icon = "leads", delay = 0 }: KPICardProps) {
  const gradClass = `kpi-gradient-${gradient}`;
  const trendColor = trend === "up" ? "#10b981" : trend === "down" ? "#ef4444" : "#64748b";
  const trendArrow = trend === "up" ? "+" : trend === "down" ? "" : "";
  const d = ICONS[icon] || ICONS.leads;

  return (
    <div className={`${gradClass} rounded-2xl p-5 text-white fade-up shadow-lg`}
      style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between mb-4">
        <span className="text-xs font-semibold tracking-widest uppercase opacity-80">{label}</span>
        <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 opacity-90" width={18} height={18}>
            <path d={d} />
          </svg>
        </div>
      </div>
      <div className="text-3xl font-bold tracking-tight mb-1">{value}</div>
      {sub && (
        <div className="text-xs font-medium opacity-80 flex items-center gap-1">
          {trend === "up" && <span>+</span>}
          {sub}
        </div>
      )}
    </div>
  );
}
