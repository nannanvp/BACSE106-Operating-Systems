import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  CheckSquare,
  Flame,
  RotateCcw,
  Square,
  Target,
} from 'lucide-react';
import { MODULES, SPRINT_BLOCKS, SprintBlock } from '../data/courseData';
import { ReadinessResult } from '../utils/readinessEngine';
import { ExamCountdown } from './ExamCountdown';
import { PomodoroTimer } from './PomodoroTimer';

interface SprintPlannerViewProps {
  readiness: ReadinessResult;
  masteredTopicIds: string[];
  completedSprintBlockIds: string[];
  highYieldOnly: boolean;
  onToggleHighYield: () => void;
  onToggleSprintBlock: (blockId: string) => void;
  onResetSprintBlocks: () => void;
  onNavigateView: (
    view: 'standing' | 'sprint' | 'syllabus' | 'reference' | 'prediction' | 'labs' | 'mock',
    opts?: { moduleId?: string; topicId?: string }
  ) => void;
}

const DAY_FILTERS: Array<'ALL' | SprintBlock['day']> = [
  'ALL',
  'Day 1 · Mon 23 Nov',
  'Day 2 · Tue 24 Nov',
  'Exam Morning · Wed 25 Nov',
];

export const SprintPlannerView: React.FC<SprintPlannerViewProps> = ({
  readiness,
  masteredTopicIds,
  completedSprintBlockIds,
  highYieldOnly,
  onToggleHighYield,
  onToggleSprintBlock,
  onResetSprintBlocks,
  onNavigateView,
}) => {
  const [dayFilter, setDayFilter] = useState<'ALL' | SprintBlock['day']>('ALL');
  const [confirmReset, setConfirmReset] = useState(false);

  const completedSet = useMemo(() => new Set(completedSprintBlockIds), [completedSprintBlockIds]);
  const masteredSet = useMemo(() => new Set(masteredTopicIds), [masteredTopicIds]);

  const visibleBlocks = useMemo(() => {
    return SPRINT_BLOCKS.filter((b) => {
      if (highYieldOnly && !b.isHighYield) return false;
      if (dayFilter !== 'ALL' && b.day !== dayFilter) return false;
      return true;
    });
  }, [dayFilter, highYieldOnly]);

  const totalHoursVisible = (
    visibleBlocks.reduce((acc, b) => acc + b.durationMins, 0) / 60
  ).toFixed(1);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 pb-3 border-b border-[var(--rule-strong)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--ink-primary)]">
            48-Hour FAT Sprint Planner &amp; Readiness Coach
          </h1>
          <p className="font-mono text-xs text-[var(--ink-muted)] mt-1 tabular-nums">
            Target: 25 Nov 2026 · 09:00–12:00 IST · {completedSprintBlockIds.length}/
            {SPRINT_BLOCKS.length} Sprint Blocks Completed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleHighYield}
            className={`px-3 py-1.5 text-xs font-semibold rounded-[2px] border inline-flex items-center gap-1.5 transition-colors ${
              highYieldOnly
                ? 'bg-[var(--div-m2)] text-white border-[var(--div-m2)]'
                : 'bg-[var(--bg-paper)] text-[var(--ink-primary)] border-[var(--rule-strong)] hover:bg-[var(--bg-recessed)]'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            {highYieldOnly ? '80/20 High-Yield Triage: ON' : '80/20 High-Yield Triage'}
          </button>
        </div>
      </div>

      {/* 7:5 Masthead — Exam Countdown + Readiness Coach */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 space-y-4">
          <ExamCountdown variant="hero" />
          <PomodoroTimer />
        </div>

        <div className="lg:col-span-5 bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[2px] p-5 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2 pb-2 border-b border-[var(--rule-hairline)]">
              <div>
                <h2 className="text-base font-bold text-[var(--ink-primary)]">
                  Composite FAT Readiness
                </h2>
                <p className="font-mono text-xs text-[var(--ink-muted)]">
                  25% Syllabus · 15% Sprint · 25% Standing · 20% SRS · 15% MCQ
                </p>
              </div>
              <div className="text-right font-mono tabular-nums">
                <div className="text-2xl font-bold text-[var(--ink-primary)]">
                  {readiness.overallScore}%
                </div>
                <div className="text-[11px] font-semibold text-[var(--div-m4)]">
                  {readiness.band}
                </div>
              </div>
            </div>

            {/* 5 Weighted Bars */}
            <div className="space-y-2 font-mono text-xs tabular-nums">
              {[
                { label: 'Syllabus Mastery (25%)', pct: readiness.breakdown.syllabusPct },
                { label: 'Diagnostic Standing (25%)', pct: readiness.breakdown.standingPct },
                { label: 'SM-2 Flashcards (20%)', pct: readiness.breakdown.flashcardsPct },
                { label: '48h Sprint Ledger (15%)', pct: readiness.breakdown.sprintPct },
                { label: 'MCQ Drill Score (15%)', pct: readiness.breakdown.mcqPct },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between text-[var(--ink-secondary)] mb-0.5">
                    <span>{row.label}</span>
                    <span className="font-bold text-[var(--ink-primary)]">{row.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-[var(--bg-recessed)] rounded-[1px] overflow-hidden">
                    <div
                      className="h-full bg-[var(--ink-primary)] transition-all"
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top 3 Next Actions */}
          <div className="pt-3 border-t border-[var(--rule-hairline)] space-y-2">
            <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-[var(--ink-primary)]">
              <Target className="w-3.5 h-3.5 text-[var(--div-m2)]" />
              Top Prescriptive Actions
            </div>
            {readiness.topActions.map((act) => (
              <button
                key={act.id}
                type="button"
                onClick={() =>
                  onNavigateView(act.targetView, { moduleId: act.targetModuleId })
                }
                className="w-full text-left p-2.5 rounded-[2px] bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] hover:border-[var(--rule-strong)] transition-colors flex items-start justify-between gap-2"
              >
                <div>
                  <div className="text-xs font-bold text-[var(--ink-primary)]">{act.title}</div>
                  <div className="text-[11px] text-[var(--ink-secondary)] mt-0.5">{act.detail}</div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[var(--ink-muted)] shrink-0 mt-0.5" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Module Mastery Strip (M1-M5) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {MODULES.map((m) => {
          const mastered = m.topics.filter((t) => masteredSet.has(t.id)).length;
          const pct = Math.round((mastered / m.topics.length) * 100);
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onNavigateView('syllabus', { moduleId: m.id })}
              className="text-left p-3 rounded-[2px] bg-[var(--bg-paper)] border border-[var(--rule-hairline)] hover:border-[var(--rule-strong)] transition-colors"
            >
              <div className="flex items-center justify-between font-mono text-xs tabular-nums">
                <span className="font-bold text-[var(--ink-primary)]">{m.code}</span>
                <span className="text-[var(--ink-muted)]">{pct}%</span>
              </div>
              <div className="text-xs font-semibold text-[var(--ink-secondary)] truncate mt-0.5">
                {m.shortTitle}
              </div>
              <div className="h-1.5 bg-[var(--bg-recessed)] rounded-[1px] overflow-hidden mt-2">
                <div
                  className="h-full"
                  style={{ width: `${pct}%`, backgroundColor: `var(--div-${m.id})` }}
                />
              </div>
              <div className="font-mono text-[11px] text-[var(--ink-muted)] mt-1 tabular-nums">
                {mastered}/{m.topics.length} topics · {m.hours}h
              </div>
            </button>
          );
        })}
      </div>

      {/* 15-Block Sprint Ledger */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {DAY_FILTERS.map((df) => (
              <button
                key={df}
                type="button"
                onClick={() => setDayFilter(df)}
                className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-[2px] border transition-colors ${
                  dayFilter === df
                    ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)]'
                    : 'bg-[var(--bg-paper)] text-[var(--ink-secondary)] border-[var(--rule-hairline)] hover:bg-[var(--bg-recessed)]'
                }`}
              >
                {df === 'ALL' ? 'All Days (15)' : df}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-[var(--ink-muted)] tabular-nums">
              Showing {visibleBlocks.length} blocks ({totalHoursVisible}h)
            </span>
            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="px-2.5 py-1 rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-paper)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset Progress
              </button>
            ) : (
              <div className="inline-flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onResetSprintBlocks();
                    setConfirmReset(false);
                  }}
                  className="px-2.5 py-1 rounded-[2px] bg-[var(--div-danger)] text-white font-semibold"
                >
                  Confirm Clear
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="px-2 py-1 rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-paper)] text-[var(--ink-primary)]"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="divide-y divide-[var(--rule-hairline)] bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px]">
          {visibleBlocks.map((block) => {
            const done = completedSet.has(block.id);
            return (
              <div
                key={block.id}
                className={`p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3 transition-colors ${
                  done ? 'bg-[var(--bg-sheet)] opacity-80' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => onToggleSprintBlock(block.id)}
                    className="mt-0.5 text-[var(--ink-primary)] shrink-0"
                    aria-label={done ? `Mark ${block.title} incomplete` : `Mark ${block.title} complete`}
                  >
                    {done ? (
                      <CheckSquare className="w-5 h-5 text-[var(--div-m3)]" />
                    ) : (
                      <Square className="w-5 h-5 text-[var(--ink-muted)]" />
                    )}
                  </button>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-[var(--ink-muted)] tabular-nums">
                      <span className="font-bold text-[var(--ink-primary)] uppercase">
                        {block.moduleId}
                      </span>
                      <span>· {block.day}</span>
                      <span>· {block.timeWindow}</span>
                      <span>· {block.durationMins}m</span>
                      {block.isHighYield && (
                        <span className="font-bold text-[var(--div-m2)]">· 80/20 HIGH YIELD</span>
                      )}
                    </div>
                    <h3
                      className={`text-sm sm:text-base font-bold ${
                        done ? 'line-through text-[var(--ink-muted)]' : 'text-[var(--ink-primary)]'
                      }`}
                    >
                      {block.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--ink-secondary)]">
                      {block.objective}
                    </p>
                    <p className="font-mono text-[11px] text-[var(--ink-muted)]">
                      Deliverable: {block.deliverable}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onNavigateView(block.targetView, {
                      moduleId: block.moduleId.startsWith('m') ? block.moduleId : undefined,
                      topicId: block.targetTopicId,
                    })
                  }
                  className="px-3 py-1.5 text-xs font-semibold rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)] text-[var(--ink-primary)] hover:bg-[var(--bg-recessed)] inline-flex items-center gap-1 shrink-0 self-start"
                >
                  Open Module
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
