"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

type Feature = {
  id: string;
  feature: string;
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
};

type RiceImpactEffortChartProps = {
  features: Feature[];
  onFeatureClick?: (id: string) => void;
  selectedId?: string | null;
};

// Map RICE impact (1-3) to 0-100 for chart; effort already 0-100
function toChartCoords(impact: number, effort: number) {
  const x = Math.min(100, effort);
  const y = Math.min(100, ((impact - 1) / 2) * 100); // 1->0, 2->50, 3->100
  return { x, y };
}

function getQuadrant(x: number, y: number) {
  const midX = 50;
  const midY = 50;
  if (y >= midY && x < midX) return "quick-wins";
  if (y >= midY && x >= midX) return "major-projects";
  if (y < midY && x < midX) return "fill-ins";
  return "avoid";
}

const QUADRANT_LABELS = {
  "quick-wins": { label: "Quick Wins", className: "bg-emerald-500/20 border-emerald-500/40" },
  "major-projects": { label: "Major Projects", className: "bg-blue-500/20 border-blue-500/40" },
  "fill-ins": { label: "Fill-ins", className: "bg-slate-500/20 border-slate-500/40" },
  avoid: { label: "Avoid", className: "bg-amber-500/20 border-amber-500/40" },
} as const;

export function RiceImpactEffortChart({
  features,
  onFeatureClick,
  selectedId,
}: RiceImpactEffortChartProps) {
  const points = useMemo(
    () =>
      features.map((f) => {
        const { x, y } = toChartCoords(f.impact, f.effort);
        const quadrant = getQuadrant(x, y);
        return {
          ...f,
          x,
          y,
          quadrant,
        };
      }),
    [features]
  );

  const chartSize = 320;
  const padding = 40;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Impact vs Effort</h3>
        <div className="flex gap-3 text-[10px] text-muted-foreground">
          {Object.entries(QUADRANT_LABELS).map(([key, { label }]) => (
            <span key={key} className="capitalize">
              {label}
            </span>
          ))}
        </div>
      </div>
      <div
        className="relative rounded-lg border bg-muted/20"
        style={{ width: chartSize + padding * 2, height: chartSize + padding * 2 }}
      >
        {/* Quadrant grid */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 p-[40px] gap-0">
          <div className={cn("border-r border-b rounded-tl", QUADRANT_LABELS["quick-wins"].className)} />
          <div className={cn("border-b rounded-tr", QUADRANT_LABELS["major-projects"].className)} />
          <div className={cn("border-r rounded-bl", QUADRANT_LABELS["fill-ins"].className)} />
          <div className={cn("rounded-br", QUADRANT_LABELS.avoid.className)} />
        </div>

        {/* Axes labels */}
        <div
          className="absolute text-[10px] text-muted-foreground"
          style={{ left: padding, top: padding - 20 }}
        >
          Impact ↑
        </div>
        <div
          className="absolute text-[10px] text-muted-foreground"
          style={{ left: padding + chartSize - 30, bottom: padding - 20 }}
        >
          Effort →
        </div>

        {/* Plot area */}
        <svg
          className="absolute"
          width={chartSize + padding * 2}
          height={chartSize + padding * 2}
          style={{ left: 0, top: 0 }}
        >
          <g transform={`translate(${padding}, ${padding})`}>
            {points.map((p) => {
              const cx = (p.x / 100) * chartSize;
              const cy = chartSize - (p.y / 100) * chartSize;
              const isSelected = selectedId === p.id;
              return (
                <g key={p.id}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? 10 : 8}
                    className={cn(
                      "cursor-pointer transition-all fill-primary stroke-background stroke-2 hover:r-[10]",
                      isSelected && "fill-amber-500 stroke-amber-600"
                    )}
                    onClick={() => onFeatureClick?.(p.id)}
                  />
                  <title>
                    {p.feature} — Impact: {p.impact}, Effort: {p.effort}
                  </title>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
      <p className="text-xs text-muted-foreground">
        Click a point to select. High impact + low effort = Quick Wins.
      </p>
    </div>
  );
}
