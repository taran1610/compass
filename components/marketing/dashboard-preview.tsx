"use client";

import { Activity, Box, Zap, FileText } from "lucide-react";

const MOCK_METRICS = [
  { label: "Total Signals", value: "12,847", change: "+23%", positive: true, icon: Activity },
  { label: "Opportunities", value: "48", change: "+7", positive: true, icon: Box },
  { label: "Active PRDs", value: "12", change: "+3", positive: true, icon: FileText },
  { label: "Team Score", value: "94", change: "+5%", positive: true, icon: Zap },
];

const MOCK_OPPORTUNITIES = [
  { priorityScore: 94, title: "In-app onboarding redesign", signalCount: 847, sparkline: [20, 35, 28, 45, 52, 60, 70] },
  { priorityScore: 88, title: "API rate limit alerts", signalCount: 623, sparkline: [40, 38, 42, 48, 55, 58, 62] },
  { priorityScore: 82, title: "Team collaboration features", signalCount: 491, sparkline: [15, 22, 30, 35, 42, 50, 55] },
];

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = data.length > 1 ? (i / (data.length - 1)) * 100 : 50;
      const y = 90 - ((v - min) / range) * 70;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg className="h-8 w-14 shrink-0 text-[#6366F1]" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

export function DashboardPreview() {
  return (
    <div className="relative mx-auto max-w-4xl">
      <div className="rounded-2xl border border-[#1F1F1F] bg-[#0A0A0A] shadow-2xl shadow-[#6366F1]/10 overflow-hidden">
        <div className="border-b border-[#1F1F1F] px-4 py-3 flex items-center gap-2">
          <Activity className="h-4 w-4 text-[#9CA3AF]" />
          <span className="text-sm font-medium text-[#9CA3AF] tracking-tight">Compass — Product Intelligence</span>
        </div>
        <div className="flex">
          <aside className="w-48 border-r border-[#1F1F1F] p-3 space-y-0.5">
            {[
              { icon: Activity, label: "Dashboard", active: true },
              { icon: Box, label: "Opportunities", active: false },
              { icon: Zap, label: "Priorities", active: false },
              { icon: FileText, label: "PRDs", active: false },
            ].map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm tracking-tight ${
                  item.active ? "bg-[#6366F1]/15 text-[#6366F1] font-medium" : "text-[#9CA3AF] hover:bg-white/5"
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                {item.label}
              </div>
            ))}
          </aside>
          <main className="flex-1 p-6 min-w-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {MOCK_METRICS.map((m) => (
                <div key={m.label} className="rounded-xl border border-[#1F1F1F] bg-white/[0.02] p-5 transition-colors hover:border-[#1F1F1F]/80">
                  <div className="flex items-center gap-2">
                    <m.icon className="h-4 w-4 text-[#6366F1]/70" strokeWidth={1.5} />
                    <p className="text-xs text-[#9CA3AF] tracking-tight">{m.label}</p>
                  </div>
                  <p className="text-2xl font-bold mt-2 text-white tracking-tight">{m.value}</p>
                  <p className={`text-xs mt-0.5 font-medium ${m.positive ? "text-emerald-500" : "text-[#9CA3AF]"}`}>
                    {m.change}
                  </p>
                </div>
              ))}
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white tracking-tight">Top Opportunities</h3>
                <span className="text-sm text-[#9CA3AF] hover:text-white cursor-pointer transition-colors">View all →</span>
              </div>
              <div className="space-y-2">
                {MOCK_OPPORTUNITIES.map((o, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 rounded-lg border border-[#1F1F1F] bg-white/[0.02] p-4 hover:bg-white/[0.04] hover:border-[#1F1F1F]/80 transition-all"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#6366F1]/30 bg-[#6366F1]/10 text-sm font-bold text-[#6366F1]">
                      {o.priorityScore}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate text-white tracking-tight">{o.title}</p>
                      <p className="text-xs text-[#9CA3AF] mt-0.5">{o.signalCount} signals</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Sparkline data={o.sparkline} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
