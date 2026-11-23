import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Dices,
  Eye,
  Flame,
  RotateCcw,
  Sparkles,
  Target,
  XCircle,
} from 'lucide-react';
import {
  DRILL_ARCHETYPES,
  DrillArchetype,
  DrillGradeResult,
  generateDrillProblem,
  gradeDrillAnswer,
  NumericalDrillProblem,
} from '../../utils/numericalDrillEngine';
import { WeakTopicSource } from '../../utils/weakTopicsEngine';

export interface NumericalDrillLabProps {
  onLogWeakTopic?: (payload: {
    topicId: string;
    moduleId: string;
    topicTitle: string;
    source: WeakTopicSource;
  }) => void;
  onJumpToLab?: (lab: 'cpu' | 'bankers' | 'sync' | 'memory' | 'disk') => void;
  solvedCount?: number;
  bestStreak?: number;
  onRecordResult?: (correct: boolean) => void;
  onResetDrillStats?: () => void;
}

const STORAGE_KEY = 'bacse106_numerical_drill_telemetry';

interface DrillTelemetry {
  solvedCount: number;
  currentStreak: number;
  bestStreak: number;
}

function loadStoredTelemetry(): DrillTelemetry {
  if (typeof window === 'undefined') {
    return { solvedCount: 0, currentStreak: 0, bestStreak: 0 };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        solvedCount: Number(parsed.solvedCount) || 0,
        currentStreak: Number(parsed.currentStreak) || 0,
        bestStreak: Number(parsed.bestStreak) || 0,
      };
    }
  } catch {
    // ignore
  }
  return { solvedCount: 0, currentStreak: 0, bestStreak: 0 };
}

function saveStoredTelemetry(data: DrillTelemetry) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

const MODULE_COLORS: Record<'m1' | 'm2' | 'm3' | 'm4' | 'm5', { hex: string; ink: string }> = {
  m1: { hex: 'var(--div-m1, #E5B82E)', ink: '#1C1B18' },
  m2: { hex: 'var(--div-m2, #E06D2B)', ink: '#1C1B18' },
  m3: { hex: 'var(--div-m3, #4F8A3D)', ink: '#FAF7F0' },
  m4: { hex: 'var(--div-m4, #147E7B)', ink: '#FAF7F0' },
  m5: { hex: 'var(--div-m5, #22559C)', ink: '#FAF7F0' },
};

const LAB_LABELS: Record<'cpu' | 'bankers' | 'sync' | 'memory' | 'disk', string> = {
  cpu: 'CPU Scheduler & CS Gantt',
  bankers: "Banker's & RAG Cycle",
  sync: 'Sync & Concurrency',
  memory: 'Memory, Paging & TLB',
  disk: 'Disk Scheduling & RAID',
};

export const NumericalDrillLab: React.FC<NumericalDrillLabProps> = ({
  onLogWeakTopic,
  onJumpToLab,
  solvedCount: propSolvedCount,
  bestStreak: propBestStreak,
  onRecordResult,
  onResetDrillStats,
}) => {
  const [telemetry, setTelemetry] = useState<DrillTelemetry>(() => loadStoredTelemetry());
  const [selectedCategory, setSelectedCategory] = useState<DrillArchetype | 'mix'>('mix');
  const [seed, setSeed] = useState<number>(10601);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [grade, setGrade] = useState<DrillGradeResult | null>(null);
  const [hasRecordedCurrent, setHasRecordedCurrent] = useState<boolean>(false);
  const [showRubric, setShowRubric] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Sync if parent passes controlled props
  useEffect(() => {
    if (propSolvedCount !== undefined || propBestStreak !== undefined) {
      setTelemetry((prev) => ({
        ...prev,
        solvedCount: propSolvedCount ?? prev.solvedCount,
        bestStreak: propBestStreak ?? prev.bestStreak,
      }));
    }
  }, [propSolvedCount, propBestStreak]);

  const activeArchetype: DrillArchetype = useMemo(() => {
    if (selectedCategory !== 'mix') return selectedCategory;
    const idx = (seed - 1) % DRILL_ARCHETYPES.length;
    return DRILL_ARCHETYPES[Math.abs(idx)].id;
  }, [selectedCategory, seed]);

  const problem: NumericalDrillProblem = useMemo(
    () => generateDrillProblem(activeArchetype, seed),
    [activeArchetype, seed]
  );

  // Live pacing timer tracking elapsed seconds vs target exam hall time (targetSeconds)
  // Pauses once graded
  useEffect(() => {
    if (grade !== null) return;
    const intervalId = window.setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [grade, seed, activeArchetype]);

  const loadProblem = (nextCat: DrillArchetype | 'mix', nextSeed: number) => {
    setSelectedCategory(nextCat);
    setSeed(nextSeed);
    setUserAnswer('');
    setGrade(null);
    setHasRecordedCurrent(false);
    setShowRubric(false);
    setElapsedSeconds(0);
  };

  const handleGrade = (overrideInput?: string) => {
    const inputToCheck = overrideInput !== undefined ? overrideInput : userAnswer;
    if (!inputToCheck.trim() && overrideInput === undefined) return;

    const res = gradeDrillAnswer(problem, inputToCheck);
    setGrade(res);
    setShowRubric(true);

    if (!hasRecordedCurrent && inputToCheck.trim().length > 0) {
      setHasRecordedCurrent(true);
      if (res.correct) {
        setTelemetry((prev) => {
          const nextStreak = prev.currentStreak + 1;
          const nextBest = Math.max(prev.bestStreak, nextStreak);
          const nextData: DrillTelemetry = {
            solvedCount: prev.solvedCount + 1,
            currentStreak: nextStreak,
            bestStreak: nextBest,
          };
          saveStoredTelemetry(nextData);
          return nextData;
        });
        onRecordResult?.(true);
      } else {
        setTelemetry((prev) => {
          const nextData: DrillTelemetry = {
            ...prev,
            currentStreak: 0,
          };
          saveStoredTelemetry(nextData);
          return nextData;
        });
        onRecordResult?.(false);
        onLogWeakTopic?.({
          topicId: problem.topicId,
          moduleId: problem.moduleId,
          topicTitle: problem.title,
          source: 'drill',
        });
      }
    }
  };

  const handleNextProblem = () => {
    loadProblem(selectedCategory, seed + 1);
  };

  const handleResetTelemetry = () => {
    const fresh = { solvedCount: 0, currentStreak: 0, bestStreak: 0 };
    setTelemetry(fresh);
    saveStoredTelemetry(fresh);
    onResetDrillStats?.();
  };

  const handleJumpToLab = (lab: 'cpu' | 'bankers' | 'sync' | 'memory' | 'disk') => {
    if (onJumpToLab) {
      onJumpToLab(lab);
      return;
    }
    const btn = document.querySelector(`button[data-lab-tab="${lab}"]`) as HTMLButtonElement | null;
    if (btn) {
      btn.click();
      return;
    }
    window.dispatchEvent(new CustomEvent('switch-lab-tab', { detail: lab }));
  };

  const modColor = MODULE_COLORS[problem.moduleId] || { hex: 'var(--div-m2)', ink: '#1C1B18' };
  const mins = Math.floor(elapsedSeconds / 60);
  const secs = elapsedSeconds % 60;
  const targetMins = Math.floor(problem.targetSeconds / 60);
  const targetSecs = problem.targetSeconds % 60;
  const overBudget = elapsedSeconds > problem.targetSeconds;

  return (
    <div data-testid="numerical-drill-lab" className="space-y-5">
      {/* Header & Scoreboard */}
      <div className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[4px] p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-extrabold text-[var(--ink-primary)] tracking-tight">
              95+ Unlimited FAT Numerical Drill Arena
            </h2>
            <span className="px-2 py-0.5 text-[11px] font-mono font-bold uppercase rounded-[2px] bg-[var(--div-labs,#8B3A62)] text-[#FAF7F0]">
              Lab 0
            </span>
          </div>
          <p className="text-xs font-mono text-[var(--ink-muted)]">
            PROCEDURAL EXAM NUMERICALS · 60/100 DETERMINISTIC MARKS (CPU WT, BANKER&apos;S NEED, DEMAND PAGING, WORKING SET, INODE, DISK LATENCY)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div
            data-testid="drill-solved-counter"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-board)] border border-[var(--rule-strong)] rounded-[4px] font-mono text-xs font-bold text-[var(--ink-primary)] tabular-nums"
          >
            <Target className="w-3.5 h-3.5 text-[var(--div-m3)]" aria-hidden="true" />
            <span>Solved: {telemetry.solvedCount}</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-board)] border border-[var(--rule-strong)] rounded-[4px] font-mono text-xs font-bold text-[var(--ink-primary)] tabular-nums">
            <Flame className="w-3.5 h-3.5 text-[var(--div-m2)]" aria-hidden="true" />
            <span>
              Streak: {telemetry.currentStreak} (Best {Math.max(telemetry.bestStreak, telemetry.currentStreak)})
            </span>
          </div>
          {(telemetry.solvedCount > 0 || telemetry.currentStreak > 0) && (
            <button
              type="button"
              onClick={handleResetTelemetry}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[4px] step-hinge transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Strip */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => loadProblem('mix', seed + 1)}
          className={`px-3 py-1.5 text-xs font-mono font-bold rounded-[4px] border border-[var(--rule-strong)] step-hinge transition-all ${
            selectedCategory === 'mix'
              ? 'bg-[var(--div-m1)] text-[#1C1B18] shadow-sm font-extrabold'
              : 'bg-[var(--bg-paper)] text-[var(--ink-primary)] hover:bg-[var(--bg-board)]'
          }`}
        >
          All 6 Mix
        </button>
        {DRILL_ARCHETYPES.map((cat) => {
          const active = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => loadProblem(cat.id, seed + 1)}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-[4px] border border-[var(--rule-strong)] step-hinge transition-all ${
                active
                  ? 'bg-[var(--div-m1)] text-[#1C1B18] shadow-sm font-extrabold'
                  : 'bg-[var(--bg-paper)] text-[var(--ink-primary)] hover:bg-[var(--bg-board)]'
              }`}
            >
              <span className="font-mono opacity-75 mr-1 font-semibold">{cat.moduleCode} ·</span>
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Main Drill Card */}
      <div className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[4px] overflow-hidden shadow-sm">
        {/* Card Header Bar */}
        <div className="px-5 py-3 bg-[var(--bg-board)] border-b border-[var(--rule-strong)] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              style={{ backgroundColor: modColor.hex, color: modColor.ink }}
              className="px-2 py-0.5 text-[11px] font-mono font-bold rounded-[2px] border border-[var(--rule-strong)]"
            >
              {problem.moduleCode}
            </span>
            <span className="font-mono text-xs font-bold text-[var(--ink-primary)]">
              {problem.fatTag}
            </span>
            <span className="font-mono text-[11px] text-[var(--ink-muted)] tabular-nums">
              · Variant #{problem.seed}
            </span>
            <span className="font-mono text-[11px] text-[var(--ink-muted)]">
              (Tolerance ±{problem.tolerance} {problem.unit})
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Live Pacing Timer */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] border font-mono text-xs font-bold tabular-nums transition-colors ${
                overBudget
                  ? 'bg-[var(--div-danger,#B83227)] text-[#FAF7F0] border-[var(--div-danger,#B83227)] animate-pulse'
                  : 'bg-[var(--bg-paper)] text-[var(--ink-primary)] border-[var(--rule-strong)]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              <span>
                {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')} /{' '}
                {String(targetMins).padStart(2, '0')}:{String(targetSecs).padStart(2, '0')} target
              </span>
            </span>

            <button
              type="button"
              data-testid="next-drill-problem"
              onClick={handleNextProblem}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold bg-[var(--div-m1)] hover:opacity-90 text-[#1C1B18] border border-[var(--rule-strong)] rounded-[4px] step-hinge"
            >
              <Dices className="w-3.5 h-3.5" aria-hidden="true" />
              <span>New Problem</span>
            </button>
          </div>
        </div>

        {/* Problem Body */}
        <div className="p-5 sm:p-6 space-y-5">
          <div className="space-y-1.5">
            <h3
              data-testid="drill-problem-title"
              className="text-base sm:text-lg font-extrabold text-[var(--ink-primary)] tracking-tight"
            >
              {problem.title}
            </h3>
            <p className="text-xs sm:text-sm text-[var(--ink-secondary)] leading-relaxed">
              {problem.prompt}
            </p>
          </div>

          <pre
            data-testid="drill-given-block"
            className="bg-[#1C1B18] text-[#FAF7F0] rounded-[4px] p-4 font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto whitespace-pre-wrap border border-[var(--rule-strong)]"
          >
            {problem.givenBlock}
          </pre>

          <div className="space-y-3 pt-1">
            <div className="text-sm font-bold text-[var(--ink-primary)]">
              {problem.questionLine}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleGrade();
              }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
            >
              <label htmlFor="drill-answer-input" className="sr-only">
                Your answer
              </label>
              <div className="relative flex-1">
                <input
                  id="drill-answer-input"
                  data-testid="drill-answer-input"
                  type="text"
                  inputMode="decimal"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder={problem.unitHint ? `Enter ${problem.unitHint}...` : 'Enter your numerical answer...'}
                  className="w-full h-11 px-3.5 text-sm font-mono bg-[var(--bg-sheet)] border border-[var(--rule-strong)] rounded-[4px] text-[var(--ink-primary)] tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--div-m1)]"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-[var(--ink-muted)] pointer-events-none">
                  {problem.unit}
                </span>
              </div>
              <button
                type="submit"
                data-testid="grade-drill-btn"
                className="px-5 h-11 text-xs font-mono font-extrabold uppercase tracking-wider bg-[var(--div-m1)] hover:opacity-90 text-[#1C1B18] border border-[var(--rule-strong)] rounded-[4px] step-hinge whitespace-nowrap"
              >
                Check My Answer
              </button>
            </form>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowRubric((v) => !v)}
                className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] underline underline-offset-4"
              >
                <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                <span>
                  {showRubric ? 'Hide 10M Marking Scheme' : 'Peek 10M Marking Scheme'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleJumpToLab(problem.matchingLab)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold text-[var(--ink-primary)] bg-[var(--bg-sheet)] hover:bg-[var(--bg-board)] border border-[var(--rule-strong)] rounded-[4px] step-hinge"
              >
                <span>Open {LAB_LABELS[problem.matchingLab]}</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Grading Verdict Banner */}
          {grade && (
            <div
              data-testid="drill-verdict"
              className={`border border-[var(--rule-strong)] rounded-[4px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                grade.correct
                  ? 'bg-[var(--div-m3,#4F8A3D)] text-[#FAF7F0]'
                  : 'bg-[var(--div-danger,#B83227)] text-[#FAF7F0]'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {grade.correct ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
                ) : (
                  <XCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
                )}
                <div className="space-y-0.5">
                  <div className="text-sm font-extrabold tracking-tight">
                    {grade.correct
                      ? 'FULL MARKS — EXACT MATCH'
                      : 'CHECK STEPS — RETRY OR NEXT VARIANT'}
                  </div>
                  <p className="text-xs opacity-95 leading-relaxed font-mono">
                    {grade.feedback}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleNextProblem}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-extrabold bg-[#FAF7F0] text-[#1C1B18] hover:bg-[var(--div-m1)] border border-[#1C1B18] rounded-[4px] step-hinge whitespace-nowrap self-start sm:self-auto shrink-0 transition-colors"
              >
                <span>Next Problem</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Step-by-Step 10-Mark FAT Rubric Solution */}
          {showRubric && (
            <div
              data-testid="drill-rubric"
              className="bg-[var(--bg-sheet)] border border-[var(--rule-strong)] rounded-[4px] p-4 space-y-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--rule-hairline)] pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[var(--div-m2)]" aria-hidden="true" />
                  <h4 className="text-xs font-mono font-extrabold uppercase tracking-wider text-[var(--ink-primary)]">
                    VIT FAT 10-Mark Answer Booklet Breakdown
                  </h4>
                </div>
                <span className="px-2 py-0.5 text-xs font-mono font-bold bg-[var(--div-m1)] text-[#1C1B18] border border-[var(--rule-strong)] rounded-[2px] tabular-nums">
                  Answer: {problem.expectedDisplay}
                </span>
              </div>
              <ol className="space-y-1.5 text-xs font-mono text-[var(--ink-primary)] leading-relaxed list-none">
                {problem.rubricSteps.map((step, idx) => (
                  <li key={idx} className="p-1 rounded-[2px] hover:bg-[var(--bg-board)]">
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
