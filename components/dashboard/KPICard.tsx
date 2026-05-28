"use client";
import { ReactNode } from "react";

interface KPICardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
  delay?: number;
}

export function KPICard({ label, value, sub, icon, trend, delay = 0 }: KPICardProps) {
  const trendColor =
    trend === "up" ? "text-[#3db87a]" : trend === "down" ? "text-[#e05252]" : "text-[#7a8fa8]";

  return (
    <div className="card p-5 fade-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium tracking-widest uppercase text-[#7a8fa8]">{label}</span>
        {icon && <span className="text-[#c9a84c] opacity-70">{icon}</span>}
      </div>
      <div className="kpi-value text-4xl gold-glow mb-1">{value}</div>
      {sub && <div className={`text-xs mt-1 ${trendColor}`}>{sub}</div>}
    </div>
  );
}
