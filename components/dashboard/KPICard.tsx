"use client";

interface KPICardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  color?: "blue" | "teal" | "indigo" | "green";
  delay?: number;
}

export function KPICard({ label, value, sub, trend, color = "blue", delay = 0 }: KPICardProps) {
  return (
    <div className={`kpi-card ${color} fade-in`} style={{ animationDelay: `${delay}ms` }}>
      <div className="kpi-label">{label}</div>
      <div>
        <div className="kpi-value">{value}</div>
        {sub && (
          <div className="kpi-sub">
            {trend === "up" && "↑ "}{trend === "down" && "↓ "}{sub}
          </div>
        )}
      </div>
    </div>
  );
}
