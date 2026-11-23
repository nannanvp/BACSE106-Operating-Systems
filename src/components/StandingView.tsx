import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  ExternalLink,
  FastForward,
  FileText,
  Filter,
  FlaskConical,
  Gauge,
  Layers,
  ListChecks,
  RotateCcw,
  Search,
  Sparkles,
  Target,
  X,
  XCircle,
} from 'lucide-react';
import { MODULES } from '../data/courseData';
import {
  MODULE_REFRESHERS,
  STANDING_QUESTIONS_BY_MODULE,
  ALL_STANDING_QUESTIONS,
  StandingQuestion,
} from '../data/standingData';
import {
  StandingModuleResult,
  StandingTier,
  buildStandingRadarData,
  evaluateStandingModule,
  evaluate95Readiness,
  analyzeModuleWeakSpots,
  getModuleDrillPreset,
  TIER_META,
  MODULE_ORDER,
} from '../utils/standingEngine';
import { WeakTopicSource } from '../utils/weakTopicsEngine';
import { MarkdownBlock } from './MarkdownBlock';
import { RadarChart } from './RadarChart';

type ModuleKey = 'm1' | 'm2' | 'm3' | 'm4' | 'm5';
type ViewMode = 'dashboard' | 'refresher' | 'quiz' | 'results';
type DashboardTab = 'modules' | 'bank';

interface StandingViewProps {
  standingResults: Record<string, StandingModuleResult>;
  onSaveModuleResult: (result: StandingModuleResult) => void;
  onLogWeakTopic: (payload: {
    topicId: string;
    moduleId: string;
    topicTitle: string;
    source: WeakTopicSource;
  }) => void;
  onNavigateView: (
    view: 'standing' | 'sprint' | 'syllabus' | 'reference' | 'prediction' | 'labs' | 'mock',
    opts?: { moduleId?: string; topicId?: string }
  ) => void;
}

const MODULE_BORDER_COLORS: Record<string, string> = {
  m1: '#E5B82E',
  m2: '#E06D2B',
  m3: '#4F8A3D',
  m4: '#147E7B',
  m5: '#22559C',
};

const GRADE_STYLES: Record<'A' | 'B' | 'C' | 'D', { bg: string; text: string; label: string }> = {
  A: { bg: 'bg-emerald-600', text: 'text-[#FAF7F0]', label: 'Band A · 25–30 (Exam-Ready)' },
  B: { bg: 'bg-amber-500', text: 'text-[#1C1B18]', label: 'Band B · 18–24 (Solid — Drill Edge Cases)' },
  C: { bg: 'bg-[#E06D2B]', text: 'text-[#FAF7F0]', label: 'Band C · 10–17 (Study Notes Needed)' },
  D: { bg: 'bg-rose-600', text: 'text-[#FAF7F0]', label: 'Band D · 0–9 (Critical Gap)' },
};

export const StandingView: React.FC<StandingViewProps> = ({
  standingResults,
  onSaveModuleResult,
  onLogWeakTopic,
  onNavigateView,
}) => {
  const [mode, setMode] = useState<ViewMode>('dashboard');
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>('modules');
  const [selectedModuleId, setSelectedModuleId] = useState<ModuleKey>('m1');
  const [questionIdx, setQuestionIdx] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [transitionBannerTier, setTransitionBannerTier] = useState<StandingTier | null>(null);

  // Bank filtering state
  const [bankTierFilter, setBankTierFilter] = useState<'all' | StandingTier>('all');
  const [bankModuleFilter, setBankModuleFilter] = useState<'all' | ModuleKey>('all');
  const [bankSearch, setBankSearch] = useState('');
  const [revealedSolutions, setRevealedSolutions] = useState<Record<string, boolean>>({});

  // Topic titles lookup
  const topicTitleMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of MODULES) {
      for (const t of m.topics) {
        map[t.id] = t.title;
      }
    }
    return map;
  }, []);

  // 5-Axis Radar Data
  const radarData = useMemo(
    () =>
      buildStandingRadarData(
        MODULES.map((m) => ({ id: m.id, code: m.code, shortTitle: m.shortTitle })),
        standingResults
      ),
    [standingResults]
  );

  // 95+ Readiness Assessment
  const readiness95 = useMemo(
    () => evaluate95Readiness(standingResults),
    [standingResults]
  );

  // Module Weak Spots Analysis
  const weakSpotAnalysis = useMemo(
    () =>
      analyzeModuleWeakSpots(
        standingResults,
        MODULES.map((m) => ({ id: m.id, code: m.code, title: m.title, hours: m.hours }))
      ),
    [standingResults]
  );

  // Diagnostic Runner Helpers
  const startDiagnostic = (modId: ModuleKey, skipRefresher = false) => {
    setSelectedModuleId(modId);
    setQuestionIdx(0);
    setQuizAnswers({});
    setTransitionBannerTier(null);
    if (skipRefresher) {
      setMode('quiz');
    } else {
      setMode('refresher');
    }
  };

  const handleSelectOption = (q: StandingQuestion, optIndex: number) => {
    if (quizAnswers[q.id] !== undefined) return;
    setQuizAnswers((prev) => ({ ...prev, [q.id]: optIndex }));

    if (optIndex !== q.correctIndex) {
      onLogWeakTopic({
        topicId: q.topicId,
        moduleId: q.moduleId,
        topicTitle: topicTitleMap[q.topicId] ?? q.topicId,
        source: 'standing',
      });
    }
  };

  const handleNextQuizQuestion = () => {
    const questions = STANDING_QUESTIONS_BY_MODULE[selectedModuleId];
    if (questionIdx >= questions.length - 1) {
      finishDiagnostic();
      return;
    }
    const currentQ = questions[questionIdx];
    const nextQ = questions[questionIdx + 1];

    if (nextQ.tier !== currentQ.tier) {
      setTransitionBannerTier(nextQ.tier);
    } else {
      setQuestionIdx((i) => i + 1);
    }
  };

  const finishDiagnostic = () => {
    const questions = STANDING_QUESTIONS_BY_MODULE[selectedModuleId];
    const result = evaluateStandingModule(selectedModuleId, questions, quizAnswers);
    onSaveModuleResult(result);
    setMode('results');
  };

  // Test Bank Filtered List
  const filteredBankQuestions = useMemo(() => {
    return ALL_STANDING_QUESTIONS.filter((q) => {
      if (bankTierFilter !== 'all' && q.tier !== bankTierFilter) return false;
      if (bankModuleFilter !== 'all' && q.moduleId !== bankModuleFilter) return false;
      if (bankSearch.trim()) {
        const query = bankSearch.toLowerCase();
        const matchesQ = q.question.toLowerCase().includes(query);
        const matchesExplanation = q.explanation.toLowerCase().includes(query);
        const matchesOptions = q.options.some((o) => o.toLowerCase().includes(query));
        const matchesId = q.id.toLowerCase().includes(query);
        return matchesQ || matchesExplanation || matchesOptions || matchesId;
      }
      return true;
    });
  }, [bankTierFilter, bankModuleFilter, bankSearch]);

  // Score Count-Up Animation in Results Mode
  const activeResult = standingResults[selectedModuleId];
  const [displayResultScore, setDisplayResultScore] = useState(0);

  useEffect(() => {
    if (mode === 'results' && activeResult) {
      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced || activeResult.score === 0) {
        setDisplayResultScore(activeResult.score);
        return;
      }
      let rafId = 0;
      const durationMs = 450;
      const startTime = performance.now();
      const targetScore = activeResult.score;

      const step = (now: number) => {
        const progress = Math.min(1, (now - startTime) / durationMs);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayResultScore(Math.round(eased * targetScore));
        if (progress < 1) {
          rafId = requestAnimationFrame(step);
        }
      };
      rafId = requestAnimationFrame(step);
      return () => cancelAnimationFrame(rafId);
    }
  }, [mode, activeResult]);

  // --------------------------------------------------------------------------
  // STEP 1: RAPID REFRESHER PRIMER (Boxed Reference Style)
  // --------------------------------------------------------------------------
  if (mode === 'refresher') {
    const refresher = MODULE_REFRESHERS[selectedModuleId];
    const mod = MODULES.find((m) => m.id === selectedModuleId)!;
    const accent = MODULE_BORDER_COLORS[selectedModuleId];

    return (
      <div className="space-y-6" data-testid="standing-refresher-view">
        {/* Top Control Strip */}
        <div className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[4px] p-5 sm:p-6 space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--rule-hairline)] pb-4">
            <button
              type="button"
              onClick={() => setMode('dashboard')}
              className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Standing Dashboard</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMode('quiz')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wide text-[var(--bg-paper)] bg-[var(--ink-primary)] hover:opacity-90 rounded-[3px] border border-[var(--ink-primary)] shadow-sm"
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>Skip to 30-Q Quiz →</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2.5 text-xs font-mono text-[var(--ink-muted)] tabular-nums">
              <span
                className="w-2.5 h-2.5 rounded-[2px] border border-[var(--ink-primary)] shrink-0"
                style={{ backgroundColor: accent }}
              />
              <span className="font-bold text-[var(--ink-primary)]">Step 1 of 3 · 5-Minute Refresher</span>
              <span>·</span>
              <span>{mod.code} ({mod.hours}h lecture time)</span>
              <span>·</span>
              <span>{refresher.readMinutes} min read</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-extrabold text-[var(--ink-primary)] leading-tight">
              {refresher.title}
            </h1>
          </div>
        </div>

        {/* Two-Column Technical Content Plate */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Mental Model & Formulas */}
          <div className="lg:col-span-6 space-y-5">
            <section className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[4px] p-5 space-y-3">
              <div className="flex items-center gap-2 border-b border-[var(--rule-hairline)] pb-2">
                <BookOpen className="w-4 h-4 text-[var(--div-standing)]" />
                <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--ink-primary)]">
                  Core Mental Model
                </h2>
              </div>
              <div className="prose-manual text-sm leading-relaxed text-[var(--ink-primary)]">
                <MarkdownBlock content={refresher.coreMentalModel} />
              </div>
            </section>

            <section className="bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[4px] p-5 space-y-3">
              <div className="flex items-center gap-2 border-b border-[var(--rule-hairline)] pb-2">
                <Target className="w-4 h-4 text-[var(--div-standing)]" />
                <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--ink-primary)]">
                  Must-Know Formulas &amp; Invariants
                </h2>
              </div>
              <div className="space-y-2">
                {refresher.mustKnowFormulas.map((f, i) => (
                  <div
                    key={i}
                    className="font-mono text-xs p-2.5 bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[3px] text-[var(--ink-primary)] leading-relaxed"
                  >
                    {f}
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: High-Yield Bullets & FAT Checkpoints */}
          <div className="lg:col-span-6 space-y-5">
            <section className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[4px] p-5 space-y-3">
              <div className="flex items-center gap-2 border-b border-[var(--rule-hairline)] pb-2">
                <Layers className="w-4 h-4 text-[var(--div-standing)]" />
                <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--ink-primary)]">
                  High-Yield Exam Takeaways
                </h2>
              </div>
              <ul className="space-y-2 text-xs text-[var(--ink-secondary)] leading-relaxed list-disc pl-4">
                {refresher.highYieldBullets.map((b, i) => (
                  <li key={i}>
                    <MarkdownBlock content={b} />
                  </li>
                ))}
              </ul>
            </section>

            <section className="bg-[var(--bg-recessed)] border border-[var(--rule-strong)] rounded-[4px] p-5 space-y-3">
              <div className="flex items-center gap-2 border-b border-[var(--rule-strong)] pb-2">
                <AlertTriangle className="w-4 h-4 text-[var(--div-danger)]" />
                <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--div-danger)]">
                  FAT Exam Hall Checkpoints &amp; Traps
                </h2>
              </div>
              <ul className="space-y-1.5 text-xs text-[var(--ink-primary)] list-disc pl-4 leading-relaxed font-mono">
                {refresher.fatCheckpoints.map((c, i) => (
                  <li key={i}>
                    <MarkdownBlock content={c} />
                  </li>
                ))}
              </ul>
            </section>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setMode('quiz')}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-mono font-bold uppercase tracking-wider text-[var(--bg-paper)] bg-[var(--div-standing)] hover:opacity-95 rounded-[3px] border border-[var(--ink-primary)] shadow-sm"
              >
                <span>Ready: Start {mod.code} 30-Question Diagnostic →</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // STEP 2: 30-QUESTION TIERED QUIZ RUNNER (Boxed Workbench Style)
  // --------------------------------------------------------------------------
  if (mode === 'quiz') {
    const mod = MODULES.find((m) => m.id === selectedModuleId)!;
    const questions = STANDING_QUESTIONS_BY_MODULE[selectedModuleId];
    const currentQ = questions[questionIdx];
    const answeredCount = Object.keys(quizAnswers).length;
    const chosen = quizAnswers[currentQ.id];
    const isAnswered = chosen !== undefined;
    const isCorrect = chosen === currentQ.correctIndex;
    const tierMeta = TIER_META[currentQ.tier];

    // Compute live tier counts
    const tierStats = {
      foundation: { correct: 0, answered: 0, total: 10 },
      application: { correct: 0, answered: 0, total: 10 },
      analysis: { correct: 0, answered: 0, total: 10 },
    };
    questions.forEach((q) => {
      const a = quizAnswers[q.id];
      if (a !== undefined) {
        tierStats[q.tier].answered += 1;
        if (a === q.correctIndex) tierStats[q.tier].correct += 1;
      }
    });

    return (
      <div className="space-y-5" data-testid="standing-quiz-view">
        {/* Quiz Top Action & Status Bar */}
        <div className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[4px] p-5 space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--rule-hairline)] pb-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[var(--ink-muted)]">
                <span
                  className="w-2.5 h-2.5 rounded-[2px] border border-[var(--ink-primary)]"
                  style={{ backgroundColor: MODULE_BORDER_COLORS[selectedModuleId] }}
                />
                <span className="font-bold text-[var(--ink-primary)]">
                  Step 2 of 3 · {mod.code} Diagnostic
                </span>
                <span>·</span>
                <span>{mod.title}</span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-[var(--ink-primary)] mt-1">
                Question {questionIdx + 1} of {questions.length} · {tierMeta.shortLabel}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMode('refresher')}
                className="px-3 py-1.5 text-xs font-mono font-semibold rounded-[3px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)] text-[var(--ink-primary)] hover:bg-[var(--bg-recessed)]"
              >
                Refresher
              </button>
              <button
                type="button"
                onClick={() => setMode('dashboard')}
                className="px-3 py-1.5 text-xs font-mono font-semibold rounded-[3px] border border-[var(--rule-hairline)] bg-[var(--bg-paper)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
              >
                Exit
              </button>
              <button
                type="button"
                onClick={finishDiagnostic}
                className="px-3.5 py-1.5 text-xs font-mono font-bold rounded-[3px] border border-[var(--ink-primary)] bg-[var(--ink-primary)] text-[var(--bg-paper)] hover:opacity-90 tabular-nums"
              >
                Score ({answeredCount}/30)
              </button>
            </div>
          </div>

          {/* Tier Breakdown Live Counters */}
          <div className="grid grid-cols-3 gap-2 font-mono text-xs tabular-nums">
            <div className="p-2 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[3px] flex items-center justify-between">
              <span className="font-bold text-emerald-800 dark:text-emerald-400">Foundation (1–10)</span>
              <span className="font-extrabold text-[var(--ink-primary)]">
                {tierStats.foundation.correct}/{tierStats.foundation.answered} (of 10)
              </span>
            </div>
            <div className="p-2 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[3px] flex items-center justify-between">
              <span className="font-bold text-amber-800 dark:text-amber-400">Application (11–20)</span>
              <span className="font-extrabold text-[var(--ink-primary)]">
                {tierStats.application.correct}/{tierStats.application.answered} (of 10)
              </span>
            </div>
            <div className="p-2 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[3px] flex items-center justify-between">
              <span className="font-bold text-rose-800 dark:text-rose-400">Analysis (21–30)</span>
              <span className="font-extrabold text-[var(--ink-primary)]">
                {tierStats.analysis.correct}/{tierStats.analysis.answered} (of 10)
              </span>
            </div>
          </div>

          {/* 30-Question Jump Strip */}
          <div className="flex flex-wrap items-center gap-1 pt-1">
            {questions.map((q, idx) => {
              const ans = quizAnswers[q.id];
              let tone = 'bg-[var(--bg-sheet)] text-[var(--ink-secondary)] border-[var(--rule-hairline)]';

              if (ans !== undefined) {
                tone =
                  ans === q.correctIndex
                    ? 'bg-emerald-600 text-white border-emerald-700 font-bold'
                    : 'bg-rose-600 text-white border-rose-700 font-bold';
              }
              if (idx === questionIdx) {
                tone = 'ring-2 ring-[var(--ink-primary)] bg-[var(--ink-primary)] text-[var(--bg-paper)] font-extrabold border-[var(--ink-primary)]';
              }

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setQuestionIdx(idx)}
                  className={`w-7 h-7 font-mono text-[11px] rounded-[2px] border tabular-nums transition-all ${tone}`}
                  title={`Question ${idx + 1} (${TIER_META[q.tier].shortLabel})`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tier Transition Banner (when jumping across tiers) */}
        {transitionBannerTier && (
          <div className="bg-[var(--bg-board)] border-2 border-[var(--ink-primary)] rounded-[4px] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--div-standing)]">
                Advancing to Next Tier
              </div>
              <h2 className="text-base font-bold text-[var(--ink-primary)]">
                {TIER_META[transitionBannerTier].label} · {TIER_META[transitionBannerTier].subtitle}
              </h2>
              <p className="text-xs text-[var(--ink-secondary)]">
                {TIER_META[transitionBannerTier].description}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setTransitionBannerTier(null);
                setQuestionIdx((i) => Math.min(questions.length - 1, i + 1));
              }}
              className="px-4 py-2 text-xs font-mono font-bold uppercase tracking-wide bg-[var(--ink-primary)] text-[var(--bg-paper)] rounded-[3px] shrink-0"
            >
              Continue to Question {questionIdx + 2} →
            </button>
          </div>
        )}

        {/* Main Question Plate */}
        <div className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[4px] p-5 sm:p-7 space-y-5 shadow-sm">
          {/* Question Metadata Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--rule-hairline)] text-xs font-mono">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-[2px] border border-[var(--ink-primary)]"
                style={{ backgroundColor: tierMeta.colorHex }}
              />
              <span className="font-bold text-[var(--ink-primary)]">{tierMeta.label}</span>
              <span className="text-[var(--ink-muted)]">{tierMeta.stars}</span>
              <span className="text-[var(--ink-muted)]">·</span>
              <span className="text-[var(--ink-secondary)]">
                {topicTitleMap[currentQ.topicId] ?? currentQ.topicId}
              </span>
            </div>
            <span className="font-bold text-[var(--ink-muted)] tabular-nums">{currentQ.id.toUpperCase()}</span>
          </div>

          {/* Question Prompt */}
          <div className="text-base sm:text-lg font-medium text-[var(--ink-primary)] leading-relaxed">
            <MarkdownBlock content={currentQ.question} />
          </div>

          {/* 4 Options */}
          <div className="space-y-2.5 pt-1">
            {currentQ.options.map((opt, idx) => {
              const letter = String.fromCharCode(65 + idx);
              let borderCls = 'border-[var(--rule-hairline)] bg-[var(--bg-sheet)] hover:bg-[var(--bg-recessed)] text-[var(--ink-primary)]';

              if (isAnswered) {
                if (idx === currentQ.correctIndex) {
                  borderCls = 'border-emerald-600 bg-emerald-500/15 text-[var(--ink-primary)] font-medium';
                } else if (idx === chosen) {
                  borderCls = 'border-rose-600 bg-rose-500/15 text-[var(--ink-primary)] font-medium';
                } else {
                  borderCls = 'border-[var(--rule-hairline)] bg-[var(--bg-sheet)] opacity-60 text-[var(--ink-secondary)]';
                }
              }

              return (
                <button
                  key={letter}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => handleSelectOption(currentQ, idx)}
                  className={`w-full text-left px-4 py-3 rounded-[3px] border transition-colors flex items-start gap-3 ${borderCls}`}
                >
                  <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded-[2px] bg-[var(--bg-paper)] border border-[var(--rule-hairline)] text-[var(--ink-primary)] shrink-0 mt-0.5">
                    {letter}
                  </span>
                  <span className="text-sm leading-snug">{opt}</span>
                </button>
              );
            })}
          </div>

          {/* Immediate Worked Solution & Explanation Reveal */}
          {isAnswered && (
            <div className="mt-4 p-4 rounded-[3px] bg-[var(--bg-board)] border border-[var(--rule-strong)] space-y-2">
              <div className="flex items-center gap-2 font-mono text-xs font-bold">
                {isCorrect ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-800 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" /> CORRECT · Full Credit
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-rose-800 dark:text-rose-400">
                    <XCircle className="w-4 h-4" /> INCORRECT · Logged to Weak Topics Queue
                  </span>
                )}
              </div>
              <div className="text-xs sm:text-sm text-[var(--ink-secondary)] leading-relaxed">
                <MarkdownBlock content={currentQ.explanation} />
              </div>
            </div>
          )}

          {/* Stepper Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-[var(--rule-hairline)]">
            <button
              type="button"
              disabled={questionIdx === 0}
              onClick={() => setQuestionIdx((i) => Math.max(0, i - 1))}
              className="px-3.5 py-1.5 text-xs font-mono font-semibold rounded-[3px] border border-[var(--rule-hairline)] bg-[var(--bg-sheet)] text-[var(--ink-primary)] disabled:opacity-40 inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Previous
            </button>

            {questionIdx < questions.length - 1 ? (
              <button
                type="button"
                onClick={handleNextQuizQuestion}
                className="px-4 py-1.5 text-xs font-mono font-bold rounded-[3px] border border-[var(--ink-primary)] bg-[var(--ink-primary)] text-[var(--bg-paper)] hover:opacity-90 inline-flex items-center gap-1"
              >
                Next <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={finishDiagnostic}
                className="px-5 py-2 text-xs font-mono font-bold rounded-[3px] border border-[var(--div-standing)] bg-[var(--div-standing)] text-[var(--bg-paper)] hover:opacity-90 shadow-sm"
              >
                Complete Diagnostic &amp; View Standing Report →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // STEP 3: RESULTS DASHBOARD (Boxed Ledger Style)
  // --------------------------------------------------------------------------
  if (mode === 'results' && activeResult) {
    const mod = MODULES.find((m) => m.id === selectedModuleId)!;
    const accent = MODULE_BORDER_COLORS[selectedModuleId];
    const gradeStyle = GRADE_STYLES[activeResult.band];
    const totalPossible = activeResult.total;
    const pctScore = Math.round((activeResult.score / totalPossible) * 100);
    const drillPreset = getModuleDrillPreset(selectedModuleId, activeResult.missedTopicIds[0]);

    const tiers = [
      { key: 'foundation' as const, label: 'Foundation', val: activeResult.foundation },
      { key: 'application' as const, label: 'Application', val: activeResult.application },
      { key: 'analysis' as const, label: 'Analysis', val: activeResult.analysis },
    ];

    return (
      <div className="space-y-6" data-testid="standing-results-view">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setMode('dashboard')}
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to All Modules Overview</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => startDiagnostic(selectedModuleId, true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono font-bold text-[var(--ink-primary)] bg-[var(--bg-paper)] hover:bg-[var(--bg-recessed)] border border-[var(--rule-strong)] rounded-[3px]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake Diagnostic</span>
            </button>
          </div>
        </div>

        {/* Hero Diagnostic Ledger Plate */}
        <div className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[4px] p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[var(--rule-hairline)] pb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono text-[var(--ink-muted)]">
                <span
                  className="w-2.5 h-2.5 rounded-[2px] border border-[var(--ink-primary)] shrink-0"
                  style={{ backgroundColor: accent }}
                />
                <span className="font-bold text-[var(--ink-primary)]">
                  Step 3 of 3 · Standing Assessment Result
                </span>
                <span>·</span>
                <span>{mod.code} ({mod.title})</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-display font-extrabold text-[var(--ink-primary)]">
                {mod.title} Diagnostic Completed
              </h1>
              <p className="font-mono text-xs sm:text-sm font-semibold text-[var(--ink-secondary)] tabular-nums">
                Foundation {activeResult.foundation.correct}/10 · Application{' '}
                {activeResult.application.correct}/10 · Analysis {activeResult.analysis.correct}/10
              </p>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right">
                <div className="font-mono text-3xl sm:text-4xl font-extrabold text-[var(--ink-primary)] tabular-nums">
                  {displayResultScore}
                  <span className="text-lg text-[var(--ink-muted)] font-semibold">/30</span>
                </div>
                <div className="text-xs font-mono text-[var(--ink-muted)]">{gradeStyle.label}</div>
              </div>
              <div
                className={`w-16 h-16 rounded-[4px] border-2 border-[var(--ink-primary)] flex items-center justify-center font-display text-3xl font-extrabold ${gradeStyle.bg} ${gradeStyle.text} shadow-sm`}
              >
                {activeResult.band}
              </div>
            </div>
          </div>

          {/* Stacked 3-Tier Score Bar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-[var(--ink-secondary)]">
              <span className="font-bold text-[var(--ink-primary)]">
                Tier Competency Distribution
              </span>
              <span className="tabular-nums font-bold">{pctScore}% overall competency</span>
            </div>

            <div
              className="h-5 w-full bg-[var(--bg-board)] border border-[var(--rule-strong)] rounded-[3px] overflow-hidden flex"
              role="img"
              aria-label={`Tier breakdown bar`}
            >
              {tiers.map(({ key, val }) => {
                const widthPct = (val.correct / 30) * 100;
                const meta = TIER_META[key];
                return (
                  <div
                    key={key}
                    style={{ width: `${widthPct}%`, backgroundColor: meta.colorHex }}
                    className="h-full border-r border-[var(--ink-primary)]/40 last:border-r-0"
                    title={`${meta.shortLabel}: ${val.correct}/10 (${val.pct}%)`}
                  />
                );
              })}
            </div>

            {/* 3 Tier Readout Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {tiers.map(({ key, label, val }) => {
                const meta = TIER_META[key];
                const isWeak = val.pct < 60;
                return (
                  <div
                    key={key}
                    className="bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[3px] p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs font-mono">
                      <span className="font-bold text-[var(--ink-primary)]">{label}</span>
                      <span
                        className={`font-bold ${
                          isWeak
                            ? 'text-rose-700 dark:text-rose-400'
                            : 'text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        {isWeak ? 'Priority Gap' : 'Solid'}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <span className="font-mono text-2xl font-extrabold text-[var(--ink-primary)] tabular-nums">
                        {val.correct}
                        <span className="text-sm text-[var(--ink-muted)] font-normal">/10</span>
                      </span>
                      <span className="text-xs font-mono text-[var(--ink-muted)]">{meta.stars}</span>
                    </div>

                    <div className="h-2 w-full bg-[var(--bg-board)] rounded-[2px] overflow-hidden border border-[var(--rule-hairline)]">
                      <div
                        className="h-full"
                        style={{ width: `${val.pct}%`, backgroundColor: meta.colorHex }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Prescriptive Advice Callout */}
          <div className="bg-[var(--bg-sheet)] border border-[var(--rule-strong)] rounded-[4px] p-5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[var(--div-standing)]">
              <Target className="w-4 h-4" />
              <span>Prescriptive Standing Advice</span>
            </div>
            <h2 className="text-base font-bold text-[var(--ink-primary)]">
              {activeResult.band === 'A'
                ? 'Exam-Ready Mastery Locked In'
                : 'Targeted Review Recommended Before Timed Papers'}
            </h2>
            <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">
              {activeResult.prescriptiveAdvice}
            </p>
          </div>

          {/* Missed Topics & 1-Click Drill Jumping */}
          {activeResult.missedTopicIds.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--ink-primary)] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                  Missed Topics ({activeResult.missedTopicIds.length}) · 1-Click Drill Jumping
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeResult.missedTopicIds.map((tid) => (
                  <div
                    key={tid}
                    className="p-3 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[3px] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="font-mono text-[11px] text-[var(--ink-muted)]">{tid}</div>
                      <div className="text-xs font-bold text-[var(--ink-primary)] truncate">
                        {topicTitleMap[tid] ?? tid}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigateView('syllabus', { moduleId: selectedModuleId, topicId: tid })}
                      className="px-2.5 py-1 text-xs font-mono font-semibold rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-paper)] text-[var(--ink-primary)] hover:bg-[var(--bg-recessed)] shrink-0 inline-flex items-center gap-1"
                    >
                      <span>Notes</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 1-Click Action Row */}
          <div className="pt-3 border-t border-[var(--rule-hairline)] flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigateView(drillPreset.view, { moduleId: drillPreset.moduleId, topicId: drillPreset.topicId })}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wide bg-[var(--ink-primary)] text-[var(--bg-paper)] rounded-[3px] hover:opacity-90 shadow-sm"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span>{drillPreset.labAction} →</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateView('syllabus', { moduleId: selectedModuleId })}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono font-bold bg-[var(--bg-sheet)] text-[var(--ink-primary)] border border-[var(--rule-strong)] rounded-[3px] hover:bg-[var(--bg-recessed)]"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Module Notes</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                const unassessed = MODULES.find((m) => !standingResults[m.id]);
                if (unassessed) {
                  startDiagnostic(unassessed.id as ModuleKey);
                } else {
                  setMode('dashboard');
                }
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-bold bg-[var(--div-standing)] text-[var(--bg-paper)] rounded-[3px] hover:opacity-90 shadow-sm"
            >
              <span>
                {MODULES.some((m) => !standingResults[m.id])
                  ? `Next Module (${MODULES.find((m) => !standingResults[m.id])?.code}) →`
                  : 'Return to Dashboard →'}
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // MAIN DASHBOARD SURFACE (Boxed-Manual Binder Aesthetic)
  // --------------------------------------------------------------------------
  const assessedCount = MODULES.filter((m) => Boolean(standingResults[m.id])).length;
  const totalScore = MODULES.reduce((acc, m) => acc + (standingResults[m.id]?.score ?? 0), 0);

  return (
    <div className="space-y-6" data-testid="standing-landing-view">
      {/* 1. Header Banner */}
      <section className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[4px] p-6 sm:p-7 space-y-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono text-[var(--div-standing)] font-bold">
              <Gauge className="w-4 h-4 shrink-0" />
              <span>Pre-Study Diagnostic · Late-1980s Reference Binder</span>
              <span className="text-[var(--rule-hairline)]">·</span>
              <span className="text-[var(--ink-secondary)] tabular-nums">
                {assessedCount}/5 Modules Assessed · {totalScore}/150 Standing Score
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-[var(--ink-primary)] leading-tight text-balance">
              BACSE106 Diagnostic Standing &amp; Competency Surface
            </h1>
            <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">
              Calibrate your exact exam standing across Modules 1–5 before committing study hours. Each module provides a 5-minute technical cheat sheet followed by a 30-question tiered assessment (10 Foundation · 10 Application · 10 Analysis) with immediate worked derivations and automated weak-topic logging.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                const nextUnassessed = MODULES.find((m) => !standingResults[m.id])?.id ?? 'm1';
                startDiagnostic(nextUnassessed as ModuleKey);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider text-[var(--bg-paper)] bg-[var(--ink-primary)] hover:opacity-90 border border-[var(--ink-primary)] rounded-[3px] shadow-sm whitespace-nowrap"
            >
              <span>
                {assessedCount === 0
                  ? 'Start Module 1 Diagnostic →'
                  : assessedCount < 5
                  ? `Assess Next (${MODULES.find((m) => !standingResults[m.id])?.code}) →`
                  : 'Re-Assess Module 1 →'}
              </span>
            </button>
          </div>
        </div>

        {/* Tier Meta Key Strip */}
        <div className="pt-3 border-t border-[var(--rule-hairline)] flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono text-[var(--ink-secondary)]">
          {(['foundation', 'application', 'analysis'] as const).map((tierKey) => {
            const meta = TIER_META[tierKey];
            return (
              <div key={tierKey} className="inline-flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-[2px] border border-[var(--ink-primary)] shrink-0"
                  style={{ backgroundColor: meta.colorHex }}
                />
                <span className="font-bold text-[var(--ink-primary)]">{meta.shortLabel}</span>
                <span className="text-[var(--ink-muted)]">{meta.stars}</span>
                <span>({meta.subtitle})</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. 95+ READINESS BAND ASSESSMENT WITH MODULE WEAK SPOT ANALYSIS */}
      <section
        className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[4px] p-6 sm:p-7 space-y-6 shadow-sm"
        aria-label="95+ Readiness Band Assessment"
        data-testid="readiness-95-assessment"
      >
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 border-b border-[var(--rule-hairline)] pb-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[var(--div-standing)]">
              <Target className="w-4 h-4" />
              <span>FAT 95+ Target Evaluator · Academic Consistency Gate</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-extrabold text-[var(--ink-primary)]">
              {readiness95.label}
            </h2>
            <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">
              {readiness95.verdict}
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] p-4 rounded-[4px] shrink-0">
            <div>
              <div className="font-mono text-xs text-[var(--ink-muted)]">Projected FAT Mark</div>
              <div className="font-mono text-2xl font-extrabold text-[var(--ink-primary)] tabular-nums">
                {readiness95.projectedFatMarks}
              </div>
            </div>
            <div className="h-10 w-px bg-[var(--rule-hairline)] hidden sm:block" />
            <div>
              <div className="font-mono text-xs text-[var(--ink-muted)]">Gap to 95+ Lock</div>
              <div className="font-mono text-2xl font-extrabold text-rose-700 dark:text-rose-400 tabular-nums">
                {readiness95.gapTo95 === 0 ? '0 (Locked)' : `-${readiness95.gapTo95} pts`}
              </div>
            </div>
          </div>
        </div>

        {/* Readiness Progress Bar to 95+ */}
        <div className="space-y-2">
          <div className="flex items-center justify-between font-mono text-xs text-[var(--ink-secondary)]">
            <span className="font-bold text-[var(--ink-primary)]">
              Standing Progress: {readiness95.currentScore} / {readiness95.maxScore} pts ({readiness95.percent}%)
            </span>
            <span className="tabular-nums font-bold text-[var(--div-standing)]">
              95% Target Gate = {readiness95.targetScore95} / 150 pts
            </span>
          </div>

          <div className="relative h-4 w-full bg-[var(--bg-board)] border border-[var(--rule-strong)] rounded-[3px] overflow-hidden">
            {/* Progress Fill */}
            <div
              className="h-full bg-[var(--div-standing)] transition-all duration-500"
              style={{ width: `${(readiness95.currentScore / readiness95.maxScore) * 100}%` }}
            />
            {/* 95% Target Marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-rose-600 z-10"
              style={{ left: `${(readiness95.targetScore95 / readiness95.maxScore) * 100}%` }}
              title="95% Target Mark (142 pts)"
            />
          </div>
        </div>

        {/* Cross-Module Competency Split: 5-Axis Radar Chart + Weak Spot Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-2">
          {/* Left Column: 5-Axis Radar Chart */}
          <div className="lg:col-span-5 flex justify-center">
            <RadarChart
              data={radarData}
              onSelectModule={(mId) => startDiagnostic(mId as ModuleKey)}
              selectedModuleId={selectedModuleId}
            />
          </div>

          {/* Right Column: Module Weak Spot Analysis & 1-Click Drill Arena */}
          <div className="lg:col-span-7 space-y-4">
            {/* Weakest Module Callout */}
            {weakSpotAnalysis.weakestModule ? (
              <div className="bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[4px] p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="font-mono text-xs font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Weakest Module Priority: {weakSpotAnalysis.weakestModule.moduleCode} ({weakSpotAnalysis.weakestModule.pct}%)
                    </div>
                    <h3 className="text-base font-bold text-[var(--ink-primary)]">
                      {weakSpotAnalysis.weakestModule.moduleTitle}
                    </h3>
                    <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
                      Primary mark leakage occurs in <strong>{weakSpotAnalysis.weakestModule.weakTierLabel}</strong> ({weakSpotAnalysis.weakestModule.lowestTierPct}%).
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onNavigateView(
                        weakSpotAnalysis.weakestModule!.drillPreset.view,
                        {
                          moduleId: weakSpotAnalysis.weakestModule!.drillPreset.moduleId,
                          topicId: weakSpotAnalysis.weakestModule!.drillPreset.topicId,
                        }
                      )
                    }
                    className="px-3 py-1.5 text-xs font-mono font-bold rounded-[3px] border border-[var(--ink-primary)] bg-[var(--ink-primary)] text-[var(--bg-paper)] hover:opacity-90 shrink-0 inline-flex items-center gap-1 shadow-sm"
                  >
                    <FlaskConical className="w-3.5 h-3.5" />
                    <span>Jump to Lab Drill →</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[4px] text-xs font-mono text-[var(--ink-muted)]">
                Complete at least one module diagnostic to run forensic weak spot detection.
              </div>
            )}

            {/* Tier Gaps Overview Ledger */}
            <div className="grid grid-cols-3 gap-2.5 font-mono text-xs tabular-nums">
              <div className="p-3 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[3px]">
                <div className="text-[var(--ink-muted)]">Foundation Tier</div>
                <div className="text-lg font-bold text-[var(--ink-primary)]">
                  {weakSpotAnalysis.tierGaps.foundation.pct}%
                </div>
                <div className="text-[10px] text-[var(--ink-muted)]">
                  {weakSpotAnalysis.tierGaps.foundation.correct}/{weakSpotAnalysis.tierGaps.foundation.total} points
                </div>
              </div>

              <div className="p-3 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[3px]">
                <div className="text-[var(--ink-muted)]">Application Tier</div>
                <div className="text-lg font-bold text-[var(--ink-primary)]">
                  {weakSpotAnalysis.tierGaps.application.pct}%
                </div>
                <div className="text-[10px] text-[var(--ink-muted)]">
                  {weakSpotAnalysis.tierGaps.application.correct}/{weakSpotAnalysis.tierGaps.application.total} points
                </div>
              </div>

              <div className="p-3 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[3px]">
                <div className="text-[var(--ink-muted)]">Analysis Tier</div>
                <div className="text-lg font-bold text-[var(--ink-primary)]">
                  {weakSpotAnalysis.tierGaps.analysis.pct}%
                </div>
                <div className="text-[10px] text-[var(--ink-muted)]">
                  {weakSpotAnalysis.tierGaps.analysis.correct}/{weakSpotAnalysis.tierGaps.analysis.total} points
                </div>
              </div>
            </div>

            {/* 1-Click Interactive Lab & Drill Jumping Arena */}
            <div className="space-y-2 pt-1">
              <div className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--ink-primary)] flex items-center justify-between">
                <span>1-Click High-Yield OS Lab Workbenches</span>
                <span className="text-[var(--ink-muted)]">Direct Jump</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => onNavigateView('labs', { moduleId: 'm2' })}
                  className="p-2.5 text-left rounded-[3px] border border-[var(--rule-hairline)] bg-[var(--bg-sheet)] hover:bg-[var(--bg-recessed)] transition-colors flex flex-col justify-between"
                >
                  <span className="font-bold text-[var(--ink-primary)]">Banker’s &amp; RAG</span>
                  <span className="text-[10px] text-[var(--ink-muted)]">M2 · Safety Traces</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateView('labs', { moduleId: 'm3' })}
                  className="p-2.5 text-left rounded-[3px] border border-[var(--rule-hairline)] bg-[var(--bg-sheet)] hover:bg-[var(--bg-recessed)] transition-colors flex flex-col justify-between"
                >
                  <span className="font-bold text-[var(--ink-primary)]">Peterson &amp; Sync</span>
                  <span className="text-[10px] text-[var(--ink-muted)]">M3 · Concurrency</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateView('labs', { moduleId: 'm4' })}
                  className="p-2.5 text-left rounded-[3px] border border-[var(--rule-hairline)] bg-[var(--bg-sheet)] hover:bg-[var(--bg-recessed)] transition-colors flex flex-col justify-between"
                >
                  <span className="font-bold text-[var(--ink-primary)]">Paging &amp; TLB</span>
                  <span className="text-[10px] text-[var(--ink-muted)]">M4 · Belady &amp; EAT</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateView('labs', { moduleId: 'm5' })}
                  className="p-2.5 text-left rounded-[3px] border border-[var(--rule-hairline)] bg-[var(--bg-sheet)] hover:bg-[var(--bg-recessed)] transition-colors flex flex-col justify-between"
                >
                  <span className="font-bold text-[var(--ink-primary)]">Disk &amp; RAID</span>
                  <span className="text-[10px] text-[var(--ink-muted)]">M5 · Cylinder Seeks</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateView('labs')}
                  className="p-2.5 text-left rounded-[3px] border border-[var(--rule-hairline)] bg-[var(--bg-sheet)] hover:bg-[var(--bg-recessed)] transition-colors flex flex-col justify-between"
                >
                  <span className="font-bold text-[var(--ink-primary)]">Numerical Drills</span>
                  <span className="text-[10px] text-[var(--ink-muted)]">Unlimited Arena</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateView('sprint')}
                  className="p-2.5 text-left rounded-[3px] border border-[var(--rule-hairline)] bg-[var(--bg-sheet)] hover:bg-[var(--bg-recessed)] transition-colors flex flex-col justify-between"
                >
                  <span className="font-bold text-[var(--ink-primary)]">48h FAT Sprint</span>
                  <span className="text-[10px] text-[var(--ink-muted)]">Hourly Study Plan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. NAVIGATION TABS: Module Diagnostic Cards VS 150-Question Test Bank */}
      <div className="flex items-center justify-between border-b border-[var(--rule-strong)] pb-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDashboardTab('modules')}
            className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-t-[3px] transition-colors border-t border-l border-r ${
              dashboardTab === 'modules'
                ? 'bg-[var(--bg-paper)] text-[var(--ink-primary)] border-[var(--rule-strong)]'
                : 'bg-transparent text-[var(--ink-muted)] border-transparent hover:text-[var(--ink-primary)]'
            }`}
          >
            Module Diagnostic Runs (M1–M5)
          </button>
          <button
            type="button"
            onClick={() => setDashboardTab('bank')}
            className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-t-[3px] transition-colors border-t border-l border-r ${
              dashboardTab === 'bank'
                ? 'bg-[var(--bg-paper)] text-[var(--ink-primary)] border-[var(--rule-strong)]'
                : 'bg-transparent text-[var(--ink-muted)] border-transparent hover:text-[var(--ink-primary)]'
            }`}
          >
            Explore 150-Question Test Bank
          </button>
        </div>
      </div>

      {/* TAB 1: 5 MODULE CARDS (Boxed-Manual Binder Cards) */}
      {dashboardTab === 'modules' && (
        <section aria-label="Module Diagnostics Grid" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
            {MODULES.map((mod) => {
              const res = standingResults[mod.id];
              const accent = MODULE_BORDER_COLORS[mod.id];
              const isAssessed = Boolean(res);

              return (
                <div
                  key={mod.id}
                  className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[4px] overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow"
                  data-testid={`standing-module-card-${mod.id}`}
                >
                  {/* Top Accent Strip */}
                  <div
                    className="h-2 w-full border-b border-[var(--ink-primary)]"
                    style={{ backgroundColor: accent }}
                  />

                  <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 text-xs font-mono tabular-nums">
                        <span className="font-bold text-[var(--ink-primary)]">
                          {mod.code} · {mod.hours}h ({mod.weightPct}%)
                        </span>
                        {res ? (
                          <span className="font-bold text-[var(--div-standing)] inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Band {res.band} ({res.score}/30)</span>
                          </span>
                        ) : (
                          <span className="text-[var(--ink-muted)]">Not taken</span>
                        )}
                      </div>

                      <h3 className="text-base sm:text-lg font-display font-extrabold text-[var(--ink-primary)] leading-snug">
                        {mod.title}
                      </h3>

                      <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
                        Covers {mod.topics.map((t) => t.title.split('&')[0].trim()).slice(0, 3).join(', ')}
                        {mod.topics.length > 3 ? ` + ${mod.topics.length - 3} more` : ''}.
                      </p>
                    </div>

                    {res ? (
                      <div className="space-y-3 pt-3 border-t border-[var(--rule-hairline)]">
                        {/* 3-Tier Mini Grid */}
                        <div className="grid grid-cols-3 gap-1.5 font-mono text-[11px] tabular-nums text-center">
                          <div className="p-1.5 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px]">
                            <div className="text-[10px] text-emerald-800 dark:text-emerald-400 font-bold">FOUND.</div>
                            <div className="font-extrabold text-[var(--ink-primary)]">{res.foundation.correct}/10</div>
                          </div>
                          <div className="p-1.5 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px]">
                            <div className="text-[10px] text-amber-800 dark:text-amber-400 font-bold">APPL.</div>
                            <div className="font-extrabold text-[var(--ink-primary)]">{res.application.correct}/10</div>
                          </div>
                          <div className="p-1.5 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px]">
                            <div className="text-[10px] text-rose-800 dark:text-rose-400 font-bold">ANALYS.</div>
                            <div className="font-extrabold text-[var(--ink-primary)]">{res.analysis.correct}/10</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedModuleId(mod.id as ModuleKey);
                              setMode('results');
                            }}
                            className="flex-1 py-1.5 px-3 text-xs font-mono font-bold rounded-[3px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)] text-[var(--ink-primary)] hover:bg-[var(--bg-recessed)]"
                          >
                            View Results
                          </button>
                          <button
                            type="button"
                            onClick={() => startDiagnostic(mod.id as ModuleKey)}
                            className="py-1.5 px-3 text-xs font-mono font-bold rounded-[3px] border border-[var(--ink-primary)] bg-[var(--ink-primary)] text-[var(--bg-paper)] hover:opacity-90 inline-flex items-center gap-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Retake</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-3 border-t border-[var(--rule-hairline)] space-y-2">
                        <button
                          type="button"
                          onClick={() => startDiagnostic(mod.id as ModuleKey)}
                          className="w-full inline-flex items-center justify-between px-3.5 py-2.5 text-xs font-mono font-bold rounded-[3px] border border-[var(--ink-primary)] bg-[var(--ink-primary)] text-[var(--bg-paper)] hover:opacity-90 shadow-sm"
                        >
                          <span>Start {mod.code} Diagnostic (30 Qs)</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedModuleId(mod.id as ModuleKey);
                              setMode('refresher');
                            }}
                            className="flex-1 py-1 px-2 text-xs font-mono rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-sheet)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] inline-flex items-center justify-center gap-1"
                          >
                            <FileText className="w-3 h-3" /> 5-Min Cheat Sheet
                          </button>
                          <button
                            type="button"
                            onClick={() => onNavigateView('syllabus', { moduleId: mod.id })}
                            className="py-1 px-2 text-xs font-mono rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-sheet)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] inline-flex items-center justify-center gap-1"
                          >
                            <BookOpen className="w-3 h-3" /> Notes
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 2: EXPLORE 150-QUESTION TEST BANK */}
      {dashboardTab === 'bank' && (
        <section aria-label="150-Question Diagnostic Bank" className="space-y-4">
          {/* Bank Controls Strip */}
          <div className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[4px] p-4 sm:p-5 space-y-3 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-[var(--div-standing)]" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--ink-primary)]">
                  Diagnostic Test Bank ({filteredBankQuestions.length} of 150 Questions)
                </span>
              </div>

              {/* Tier Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
                {(['all', 'foundation', 'application', 'analysis'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setBankTierFilter(t)}
                    className={`px-2.5 py-1 rounded-[2px] border font-bold transition-colors ${
                      bankTierFilter === t
                        ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)]'
                        : 'bg-[var(--bg-sheet)] text-[var(--ink-secondary)] border-[var(--rule-hairline)] hover:bg-[var(--bg-recessed)]'
                    }`}
                  >
                    {t === 'all'
                      ? 'All Tiers (150)'
                      : t === 'foundation'
                      ? 'Foundation (50)'
                      : t === 'application'
                      ? 'Application (50)'
                      : 'Analysis (50)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Module Filter Pills & Keyword Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[var(--rule-hairline)]">
              <div className="flex flex-wrap items-center gap-1 font-mono text-xs">
                <span className="text-[var(--ink-muted)] text-[11px] mr-1">Module:</span>
                {(['all', 'm1', 'm2', 'm3', 'm4', 'm5'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setBankModuleFilter(m)}
                    className={`px-2 py-0.5 rounded-[2px] border ${
                      bankModuleFilter === m
                        ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)] font-bold'
                        : 'bg-[var(--bg-sheet)] text-[var(--ink-secondary)] border-[var(--rule-hairline)] hover:bg-[var(--bg-recessed)]'
                    }`}
                  >
                    {m.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" />
                <input
                  type="text"
                  placeholder="Filter by keyword or ID..."
                  value={bankSearch}
                  onChange={(e) => setBankSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 text-xs font-mono bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px] text-[var(--ink-primary)] focus:outline-none focus:border-[var(--ink-primary)]"
                />
              </div>
            </div>
          </div>

          {/* Question List Cards */}
          <div className="space-y-3">
            {filteredBankQuestions.map((q) => {
              const meta = TIER_META[q.tier];
              const isRevealed = Boolean(revealedSolutions[q.id]);

              return (
                <div
                  key={q.id}
                  className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[4px] p-4 sm:p-5 space-y-3 shadow-sm hover:border-[var(--rule-strong)] transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--rule-hairline)] pb-2 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-[2px] border border-[var(--ink-primary)] shrink-0"
                        style={{ backgroundColor: meta.colorHex }}
                      />
                      <span className="font-bold text-[var(--ink-primary)]">{q.moduleId.toUpperCase()}</span>
                      <span>·</span>
                      <span className="font-bold">{meta.shortLabel}</span>
                      <span className="text-[var(--ink-muted)]">{meta.stars}</span>
                      <span>·</span>
                      <span className="text-[var(--ink-secondary)]">
                        {topicTitleMap[q.topicId] ?? q.topicId}
                      </span>
                    </div>

                    <span className="font-bold text-[var(--ink-muted)] tabular-nums">{q.id.toUpperCase()}</span>
                  </div>

                  <div className="text-sm sm:text-base font-medium text-[var(--ink-primary)] leading-relaxed">
                    <MarkdownBlock content={q.question} />
                  </div>

                  {/* Options Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs pt-1">
                    {q.options.map((opt, optIdx) => {
                      const letter = String.fromCharCode(65 + optIdx);
                      const isCorrect = isRevealed && optIdx === q.correctIndex;

                      return (
                        <div
                          key={letter}
                          className={`p-2 rounded-[2px] border flex items-start gap-2 ${
                            isCorrect
                              ? 'bg-emerald-500/15 border-emerald-600 font-bold text-[var(--ink-primary)]'
                              : 'bg-[var(--bg-sheet)] border-[var(--rule-hairline)] text-[var(--ink-secondary)]'
                          }`}
                        >
                          <span className="font-bold px-1.5 py-0.5 rounded-[2px] bg-[var(--bg-paper)] border border-[var(--rule-hairline)] text-[var(--ink-primary)] shrink-0">
                            {letter}
                          </span>
                          <span className="font-sans text-xs pt-0.5 leading-snug">{opt}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Worked Solution Toggle */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setRevealedSolutions((prev) => ({ ...prev, [q.id]: !prev[q.id] }))
                      }
                      className="px-3 py-1 text-xs font-mono font-semibold rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)] text-[var(--ink-primary)] hover:bg-[var(--bg-recessed)]"
                    >
                      {isRevealed ? 'Hide Worked Solution' : 'Reveal Worked Solution'}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onLogWeakTopic({
                            topicId: q.topicId,
                            moduleId: q.moduleId,
                            topicTitle: topicTitleMap[q.topicId] ?? q.topicId,
                            source: 'standing',
                          })
                        }
                        className="px-2.5 py-1 text-xs font-mono rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-paper)] text-[var(--ink-muted)] hover:text-rose-700"
                        title="Add to Weak Topics Queue"
                      >
                        + Log Weak Topic
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigateView('syllabus', { moduleId: q.moduleId, topicId: q.topicId })}
                        className="px-2.5 py-1 text-xs font-mono rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-paper)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] inline-flex items-center gap-1"
                      >
                        <span>Notes</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {isRevealed && (
                    <div className="p-3.5 bg-[var(--bg-board)] border border-[var(--rule-strong)] rounded-[3px] space-y-1.5 mt-2">
                      <div className="font-mono text-xs font-bold text-emerald-800 dark:text-emerald-400">
                        Correct Answer: {String.fromCharCode(65 + q.correctIndex)} · Worked Forensic Derivation
                      </div>
                      <div className="text-xs text-[var(--ink-secondary)] leading-relaxed">
                        <MarkdownBlock content={q.explanation} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
