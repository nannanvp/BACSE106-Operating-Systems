import React from 'react';
import { RadarAxisPoint } from '../utils/standingEngine';

interface RadarChartProps {
  data: RadarAxisPoint[];
}

export const RadarChart: React.FC<RadarChartProps> = ({ data }) => {
  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 110;
  const count = data.length;

  const pointAt = (index: number, pct: number): [number, number] => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
    const r = (Math.max(0, Math.min(100, pct)) / 100) * maxR;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  };

  const polygonPoints = (selector: (d: RadarAxisPoint) => number): string =>
    data
      .map((d, i) => {
        const [x, y] = pointAt(i, selector(d));
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

  const rings = [25, 50, 75, 100];

  return (
    <div className="diagram-canvas-plate p-4 flex flex-col items-center">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full max-w-[320px] h-auto"
        role="img"
        aria-label="5-Module 3-Tier Diagnostic Readiness Radar Chart"
      >
        {/* Concentric grid pentagons */}
        {rings.map((ring) => (
          <polygon
            key={ring}
            points={data
              .map((_, i) => {
                const [x, y] = pointAt(i, ring);
                return `${x.toFixed(1)},${y.toFixed(1)}`;
              })
              .join(' ')}
            fill="none"
            stroke="var(--rule-hairline)"
            strokeWidth={ring === 100 ? '1.2' : '0.8'}
            strokeDasharray={ring === 100 ? undefined : '3 3'}
          />
        ))}

        {/* Radial spokes */}
        {data.map((d, i) => {
          const [x, y] = pointAt(i, 100);
          return (
            <line
              key={d.moduleId}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="var(--rule-hairline)"
              strokeWidth="0.9"
            />
          );
        })}

        {/* Foundation Tier */}
        <polygon
          points={polygonPoints((d) => d.foundationPct)}
          fill="var(--div-m3)"
          fillOpacity="0.16"
          stroke="var(--div-m3)"
          strokeWidth="2"
        />

        {/* Application Tier */}
        <polygon
          points={polygonPoints((d) => d.applicationPct)}
          fill="var(--div-m2)"
          fillOpacity="0.14"
          stroke="var(--div-m2)"
          strokeWidth="2"
          strokeDasharray="5 3"
        />

        {/* Analysis Tier */}
        <polygon
          points={polygonPoints((d) => d.analysisPct)}
          fill="var(--div-m5)"
          fillOpacity="0.16"
          stroke="var(--div-m5)"
          strokeWidth="2"
        />

        {/* Axis labels */}
        {data.map((d, i) => {
          const [x, y] = pointAt(i, 122);
          return (
            <g key={`lbl-${d.moduleId}`}>
              <text
                x={x}
                y={y - 4}
                textAnchor="middle"
                fill="var(--ink-primary)"
                fontSize="11"
                fontWeight="700"
              >
                {d.code}
              </text>
              <text
                x={x}
                y={y + 9}
                textAnchor="middle"
                fill="var(--ink-muted)"
                fontSize="9.5"
              >
                {d.band ? `Band ${d.band} · ${d.overallPct}%` : 'Untested'}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="flex flex-wrap items-center justify-center gap-4 mt-2 pt-2 border-t border-[var(--rule-hairline)] w-full font-mono text-xs">
        <span className="inline-flex items-center gap-1.5 text-[var(--ink-secondary)]">
          <span className="w-3 h-0.5 bg-[var(--div-m3)] inline-block" /> Foundation
        </span>
        <span className="inline-flex items-center gap-1.5 text-[var(--ink-secondary)]">
          <span className="w-3 h-0.5 bg-[var(--div-m2)] inline-block border-b border-dashed" /> Application
        </span>
        <span className="inline-flex items-center gap-1.5 text-[var(--ink-secondary)]">
          <span className="w-3 h-0.5 bg-[var(--div-m5)] inline-block" /> Analysis
        </span>
      </div>
    </div>
  );
};
