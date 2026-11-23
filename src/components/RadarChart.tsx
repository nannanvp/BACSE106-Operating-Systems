import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  RadarAxisPoint,
  computeRadarPoint,
  computeRadarPolygonPath,
  TIER_META,
} from '../utils/standingEngine';

interface RadarChartProps {
  data: RadarAxisPoint[];
  onSelectModule?: (moduleId: string) => void;
  selectedModuleId?: string | null;
}

const MODULE_COLORS: Record<string, string> = {
  m1: '#E5B82E',
  m2: '#E06D2B',
  m3: '#4F8A3D',
  m4: '#147E7B',
  m5: '#22559C',
};

export const RadarChart: React.FC<RadarChartProps> = ({
  data,
  onSelectModule,
  selectedModuleId,
}) => {
  const [activeTier, setActiveTier] = useState<'all' | 'foundation' | 'application' | 'analysis'>('all');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const width = 420;
  const height = 370;
  const cx = width / 2;
  const cy = 180;
  const radius = 105;
  const count = Math.max(1, data.length);

  const ringLevels = [25, 50, 75, 100];

  const series = [
    {
      key: 'foundation' as const,
      label: 'Tier 1 · Foundation',
      color: TIER_META.foundation.colorHex,
      fillOpacity: 0.18,
      values: data.map((d) => d.foundationPct),
      path: computeRadarPolygonPath(
        data.map((d) => d.foundationPct),
        radius,
        cx,
        cy
      ),
      delay: 0.05,
    },
    {
      key: 'application' as const,
      label: 'Tier 2 · Application',
      color: TIER_META.application.colorHex,
      fillOpacity: 0.18,
      values: data.map((d) => d.applicationPct),
      path: computeRadarPolygonPath(
        data.map((d) => d.applicationPct),
        radius,
        cx,
        cy
      ),
      delay: 0.15,
    },
    {
      key: 'analysis' as const,
      label: 'Tier 3 · Analysis',
      color: TIER_META.analysis.colorHex,
      fillOpacity: 0.2,
      values: data.map((d) => d.analysisPct),
      path: computeRadarPolygonPath(
        data.map((d) => d.analysisPct),
        radius,
        cx,
        cy
      ),
      delay: 0.25,
    },
  ];

  const labelOffsets: Array<{ dx: number; dy: number; anchor: 'middle' | 'start' | 'end' }> = [
    { dx: 0, dy: -24, anchor: 'middle' }, // M1 (Top)
    { dx: 14, dy: -2, anchor: 'start' },  // M2 (Upper Right)
    { dx: 12, dy: 18, anchor: 'start' },  // M3 (Lower Right)
    { dx: -12, dy: 18, anchor: 'end' },   // M4 (Lower Left)
    { dx: -14, dy: -2, anchor: 'end' },   // M5 (Upper Left)
  ];

  const activeHoverData = hoveredIndex !== null ? data[hoveredIndex] : null;

  return (
    <div
      className="diagram-canvas-plate p-4 sm:p-5 flex flex-col items-center bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[4px] shadow-sm select-none"
      data-testid="standing-radar-chart"
    >
      {/* Header with tier filter tabs */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--rule-hairline)] mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-[2px] bg-[var(--div-standing)] border border-[var(--ink-primary)]" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--ink-primary)]">
            5-Axis Competency Radar
          </span>
        </div>

        {/* Tier Isolation Pills */}
        <div className="flex items-center gap-1 font-mono text-[10px]">
          {(['all', 'foundation', 'application', 'analysis'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setActiveTier(t)}
              className={`px-2 py-0.5 rounded-[2px] border font-bold transition-colors ${
                activeTier === t
                  ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)]'
                  : 'bg-[var(--bg-sheet)] text-[var(--ink-secondary)] border-[var(--rule-hairline)] hover:bg-[var(--bg-recessed)]'
              }`}
            >
              {t === 'all' ? 'All Tiers' : t === 'foundation' ? 'Fdn' : t === 'application' ? 'App' : 'Ana'}
            </button>
          ))}
        </div>
      </div>

      <div className="relative w-full max-w-[420px]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="5-Axis Competency Radar Chart across M1–M5"
          className="w-full h-auto overflow-visible"
        >
          {/* Concentric Reference Rings */}
          {ringLevels.map((ring, idx) => {
            const ringPath = computeRadarPolygonPath(
              data.map(() => ring),
              radius,
              cx,
              cy
            );
            return (
              <g key={ring}>
                <path
                  d={ringPath}
                  fill={idx === ringLevels.length - 1 ? 'var(--bg-sheet)' : 'none'}
                  fillOpacity={idx === ringLevels.length - 1 ? 0.45 : 0}
                  stroke="var(--rule-hairline)"
                  strokeWidth={idx === ringLevels.length - 1 ? 1.4 : 0.8}
                  strokeDasharray={idx === ringLevels.length - 1 ? undefined : '3 3'}
                />
              </g>
            );
          })}

          {/* Scale Ticks on Top Vertical Spoke */}
          {ringLevels.map((ring) => {
            const pt = computeRadarPoint(0, count, ring / 100, radius, cx, cy);
            return (
              <text
                key={`tick-${ring}`}
                x={pt.x + 6}
                y={pt.y + 3}
                fill="var(--ink-muted)"
                fontSize="8.5"
                fontFamily="var(--font-mono)"
                textAnchor="start"
              >
                {ring}%
              </text>
            );
          })}

          {/* Radial Spokes and Outer Labels */}
          {data.map((d, i) => {
            const outer = computeRadarPoint(i, count, 1, radius, cx, cy);
            const off = labelOffsets[i] ?? { dx: 0, dy: 0, anchor: 'middle' };
            const labelX = outer.x + off.dx;
            const labelY = outer.y + off.dy;
            const isSelected = selectedModuleId === d.moduleId;
            const isHovered = hoveredIndex === i;
            const modColor = MODULE_COLORS[d.moduleId] ?? 'var(--ink-primary)';

            return (
              <g
                key={d.moduleId}
                className="cursor-pointer"
                onClick={() => onSelectModule?.(d.moduleId)}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Spoke Line */}
                <line
                  x1={cx}
                  y1={cy}
                  x2={outer.x}
                  y2={outer.y}
                  stroke={modColor}
                  strokeWidth={isSelected || isHovered ? 2.2 : 1.2}
                  strokeOpacity={isSelected || isHovered ? 0.95 : 0.45}
                />

                {/* Outer Vertex Marker */}
                <circle
                  cx={outer.x}
                  cy={outer.y}
                  r={isSelected || isHovered ? 5.5 : 4}
                  fill={d.band ? modColor : 'var(--bg-paper)'}
                  stroke="var(--ink-primary)"
                  strokeWidth={1.5}
                />

                {/* Axis Code & Label */}
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor={off.anchor}
                  fill={isSelected || isHovered ? 'var(--ink-primary)' : 'var(--ink-primary)'}
                  fontSize="11"
                  fontFamily="var(--font-mono)"
                  fontWeight={isSelected || isHovered ? '800' : '700'}
                >
                  {d.code}
                </text>
                <text
                  x={labelX}
                  y={labelY + 12}
                  textAnchor={off.anchor}
                  fill={isSelected || isHovered ? 'var(--ink-primary)' : 'var(--ink-muted)'}
                  fontSize="9.5"
                  fontFamily="var(--font-mono)"
                >
                  {d.band ? `${d.overallPct}% · ${d.band}` : 'Untested'}
                </text>
              </g>
            );
          })}

          {/* Animated Tier Polygons */}
          {series.map((s) => {
            const isVisible = activeTier === 'all' || activeTier === s.key;
            if (!isVisible) return null;

            return (
              <motion.g
                key={s.key}
                initial={{ opacity: 0, scale: 0.2 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.5,
                  delay: s.delay,
                  ease: [0.16, 1, 0.3, 1],
                }}
                style={{ transformOrigin: `${cx}px ${cy}px` }}
              >
                <path
                  d={s.path}
                  fill={s.color}
                  fillOpacity={s.fillOpacity}
                  stroke={s.color}
                  strokeWidth={2.2}
                  strokeLinejoin="round"
                />

                {/* Per-Axis Data Points */}
                {s.values.map((val, idx) => {
                  const pt = computeRadarPoint(idx, count, val / 100, radius, cx, cy);
                  const isHovered = hoveredIndex === idx;

                  return (
                    <circle
                      key={`${s.key}-${data[idx].moduleId}`}
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 4.5 : 3}
                      fill={s.color}
                      stroke="var(--bg-paper)"
                      strokeWidth={1.2}
                    />
                  );
                })}
              </motion.g>
            );
          })}
        </svg>

        {/* Live Hover Tooltip Card */}
        <AnimatePresence>
          {activeHoverData && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="absolute left-1/2 bottom-2 -translate-x-1/2 bg-[var(--bg-board)] border border-[var(--ink-primary)] p-2.5 rounded-[3px] shadow-lg text-center z-10 w-64 pointer-events-none"
            >
              <div className="font-mono text-xs font-extrabold text-[var(--ink-primary)]">
                {activeHoverData.code}: {activeHoverData.label}
              </div>
              <div className="grid grid-cols-3 gap-1 pt-1.5 font-mono text-[10px] tabular-nums">
                <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] px-1 py-0.5 rounded-[2px]">
                  <span className="text-emerald-700 font-bold">Fdn:</span> {activeHoverData.foundationPct}%
                </div>
                <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] px-1 py-0.5 rounded-[2px]">
                  <span className="text-amber-700 font-bold">App:</span> {activeHoverData.applicationPct}%
                </div>
                <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] px-1 py-0.5 rounded-[2px]">
                  <span className="text-rose-700 font-bold">Ana:</span> {activeHoverData.analysisPct}%
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Crisp Legend (Boxed manual style) */}
      <div className="w-full flex flex-wrap items-center justify-center gap-4 mt-2 pt-2.5 border-t border-[var(--rule-hairline)] font-mono text-xs text-[var(--ink-secondary)]">
        {series.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setActiveTier((prev) => (prev === s.key ? 'all' : s.key))}
            className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-[2px] transition-colors ${
              activeTier === s.key || activeTier === 'all' ? 'opacity-100 font-bold' : 'opacity-40'
            }`}
          >
            <span
              className="w-2.5 h-2.5 rounded-[2px] border border-[var(--ink-primary)] shrink-0"
              style={{ backgroundColor: s.color }}
              aria-hidden="true"
            />
            <span className="text-[var(--ink-primary)]">{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
