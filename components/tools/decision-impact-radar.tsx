"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

type RadarMetrics = {
  impact: number;
  effort: number;
  demand: number;
  confidence: number;
  revenue: number;
};

const LABELS = ["Impact", "Effort", "Demand", "Confidence", "Revenue"] as const;
const KEYS: (keyof RadarMetrics)[] = ["impact", "effort", "demand", "confidence", "revenue"];

export function DecisionImpactRadar({ metrics }: { metrics: RadarMetrics }) {
  const size = 180;
  const center = size / 2;
  const radius = center - 20;

  const points = useMemo(() => {
    return KEYS.map((key, i) => {
      const angle = (i * 360) / KEYS.length - 90;
      const rad = (angle * Math.PI) / 180;
      const value = Math.min(100, Math.max(0, metrics[key] ?? 50));
      const r = (value / 100) * radius;
      return {
        x: center + r * Math.cos(rad),
        y: center + r * Math.sin(rad),
        label: LABELS[i],
        value,
      };
    });
  }, [metrics]);

  const polygonPoints = points.map((p) => `${p.x},${p.y}`).join(" ");
  const labelPositions = useMemo(() => {
    return KEYS.map((_, i) => {
      const angle = (i * 360) / KEYS.length - 90;
      const rad = (angle * Math.PI) / 180;
      const r = radius + 15;
      return {
        x: center + r * Math.cos(rad),
        y: center + r * Math.sin(rad),
        label: LABELS[i],
      };
    });
  }, []);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Impact Radar</h3>
      <svg width={size} height={size} className="mx-auto">
        {/* Grid circles */}
        {[0.25, 0.5, 0.75, 1].map((scale) => (
          <circle
            key={scale}
            cx={center}
            cy={center}
            r={radius * scale}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.15}
            strokeWidth={1}
          />
        ))}
        {/* Axes */}
        {labelPositions.map((lp, i) => (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={center + radius * Math.cos(((i * 360) / KEYS.length - 90) * (Math.PI / 180))}
            y2={center + radius * Math.sin(((i * 360) / KEYS.length - 90) * (Math.PI / 180))}
            stroke="currentColor"
            strokeOpacity={0.2}
            strokeWidth={1}
          />
        ))}
        {/* Data polygon */}
        <polygon
          points={polygonPoints}
          fill="hsl(var(--primary) / 0.2)"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
        />
        {/* Labels */}
        {labelPositions.map((lp, i) => (
          <text
            key={i}
            x={lp.x}
            y={lp.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[10px] fill-muted-foreground"
          >
            {lp.label}
          </text>
        ))}
      </svg>
    </div>
  );
}
