import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  FlaskConical,
  RotateCcw,
  X,
  XCircle,
} from 'lucide-react';
import { MODULES } from '../data/courseData';
import {
  MODULE_REFRESHERS,
  STANDING_QUESTIONS_BY_MODULE,
  StandingQuestion,
} from '../data/standingData';
import {
  StandingModuleResult,
  StandingTier,
  buildStandingRadarData,
  evaluateStandingModule,
} from '../utils/standingEngine';
import { WeakTopicSource } from '../utils/weakTopicsEngine';
import { MarkdownBlock } from './MarkdownBlock';
import { RadarChart } from './RadarChart';

type ModuleKey = 'm1' | 'm2' | 'm3' | 'm4' | 'm5';

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

const TIER_LABEL: Record<StandingTier, string> = {
  foundation: 'Foundation (K1–K2)',
  application: 'Application (K3)',
  analysis: 'Analysis (K4–K5)',
};

export const StandingView: React.FC<StandingViewProps> = ({
  standingResults,
  onSaveModuleResult,
  onLogWeakTopic,
  onNavigateView,
}) => {
  const [activeQuizModule, setActiveQuizModule] = useState<ModuleKey | null>(null);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showSummaryFor, setShowSummaryFor] = useState<ModuleKey | null>(null);
  const [refresherModule, setRefresherModule] = useState<ModuleKey | null>(null);

  const topicTitleMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of MODULES) {
      for (const t of m.topics) {
        map[t.id] = t.title;
      }
    }
    return map;
  }, []);

  const radarData = useMemo(
    () =>
      buildStandingRadarData(
        MODULES.map((m) => ({ id: m.id, code: m.code, shortTitle: m.shortTitle })),
        standingResults
      ),
    [standingResults]
  );

  const completedCount = MODULES.filter((m) => Boolean(standingResults[m.id])).length;
  const totalScore = MODULES.reduce((acc, m) => acc + (standingResults[m.id]?.score ?? 0), 0);

  const startDiagnostic = (modId: ModuleKey) => {
    setActiveQuizModule(modId);
    setQuestionIdx(0);
    setAnswers({});
    setShowSummaryFor(null);
  };

  const handleSelectOption = (q: StandingQuestion, optIndex: number) => {
    if (answers[q.id] !== undefined) return;
    setAnswers((prev) => ({ ...prev, [q.id]: optIndex }));
    if (optIndex !== q.correctIndex) {
      onLogWeakTopic({
        topicId: q.topicId,
        moduleId: q.moduleId,
        topicTitle: topicTitleMap[q.topicId] ?? q.topicId,
        source: 'standing',
      });
    }
  };

  const finishDiagnostic = (modId: ModuleKey) => {
    const questions = STANDING_QUESTIONS_BY_MODULE[modId];
    const result = evaluateStandingModule(modId, questions, answers);
    onSaveModuleResult(result);
    setActiveQuizModule(null);
    setShowSummaryFor(modId);
  };

  // Active Quiz Runner View
  if (activeQuizModule) {
    const mod = MODULES.find((m) => m.id === activeQuizModule)!;
    const questions = STANDING_QUESTIONS_BY_MODULE[activeQuizModule];
    const currentQ = questions[questionIdx];
    const answeredCount = Object.keys(answers).length;
    const chosen = answers[currentQ.id];
    const isAnswered = chosen !== undefined;
    const isCorrect = chosen === currentQ.correctIndex;

    return (
      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--rule-strong)]">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--ink-primary)]">
              {mod.code} Diagnostic · {mod.title}
            </h1>
            <p className="font-mono text-xs text-[var(--ink-muted)] mt-1 tabular-nums">
              Question {questionIdx + 1} of {questions.length} · {TIER_LABEL[currentQ.tier]} ·{' '}
              {answeredCount}/{questions.length} answered
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveQuizModule(null)}
              className="px-3 py-1.5 text-xs font-semibold rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-paper)] text-[var(--ink-primary)] hover:bg-[var(--bg-recessed)] inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Exit Quiz
            </button>
            <button
              type="button"
              onClick={() => finishDiagnostic(activeQuizModule)}
              className="px-3 py-1.5 text-xs font-semibold rounded-[2px] border border-[var(--ink-primary)] bg-[var(--ink-primary)] text-[var(--bg-paper)] hover:opacity-90"
            >
              Score Now ({answeredCount}/{questions.length})
            </button>
          </div>
        </div>

        {/* Tier Jump Strip */}
        <div className="flex flex-wrap items-center gap-1.5">
          {questions.map((q, idx) => {
            const ans = answers[q.id];
            let tone = 'bg-[var(--bg-paper)] text-[var(--ink-secondary)] border-[var(--rule-hairline)]';
            if (ans !== undefined) {
              tone =
                ans === q.correctIndex
                  ? 'bg-[var(--div-m3)]/20 text-[var(--ink-primary)] border-[var(--div-m3)]'
                  : 'bg-[var(--div-danger)]/20 text-[var(--ink-primary)] border-[var(--div-danger)]';
            }
            if (idx === questionIdx) {
              tone = 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)]';
            }
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setQuestionIdx(idx)}
                className={`w-7 h-7 font-mono text-xs font-semibold rounded-[2px] border tabular-nums transition-colors ${tone}`}
                aria-label={`Jump to question ${idx + 1}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Question Plate */}
        <div className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[2px] p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--rule-hairline)]">
            <span className="font-mono text-xs font-bold text-[var(--ink-secondary)]">
              {TIER_LABEL[currentQ.tier]} · {topicTitleMap[currentQ.topicId] ?? currentQ.topicId}
            </span>
            <span className="font-mono text-xs text-[var(--ink-muted)] tabular-nums">
              {currentQ.id.toUpperCase()}
            </span>
          </div>

          <div className="text-base sm:text-lg font-medium text-[var(--ink-primary)] leading-relaxed">
            <MarkdownBlock content={currentQ.question} />
          </div>

          <div className="space-y-2.5 pt-1">
            {currentQ.options.map((opt, idx) => {
              const letter = String.fromCharCode(65 + idx);
              let borderCls = 'border-[var(--rule-hairline)] bg-[var(--bg-sheet)] hover:bg-[var(--bg-recessed)]';
              if (isAnswered) {
                if (idx === currentQ.correctIndex) {
                  borderCls = 'border-[var(--div-m3)] bg-[var(--div-m3)]/15';
                } else if (idx === chosen) {
                  borderCls = 'border-[var(--div-danger)] bg-[var(--div-danger)]/15';
                } else {
                  borderCls = 'border-[var(--rule-hairline)] bg-[var(--bg-sheet)] opacity-65';
                }
              }

              return (
                <button
                  key={letter}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => handleSelectOption(currentQ, idx)}
                  className={`w-full text-left px-4 py-3 rounded-[2px] border transition-colors flex items-start gap-3 ${borderCls}`}
                >
                  <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded-[2px] bg-[var(--bg-paper)] border border-[var(--rule-hairline)] text-[var(--ink-primary)] shrink-0 mt-0.5">
                    {letter}
                  </span>
                  <span className="text-sm text-[var(--ink-primary)] leading-snug">{opt}</span>
                </button>
              );
            })}
          </div>

          {isAnswered && (
            <div className="mt-4 p-4 rounded-[2px] bg-[var(--bg-sheet)] border border-[var(--rule-strong)] space-y-1.5">
              <div className="flex items-center gap-2 font-mono text-xs font-bold">
                {isCorrect ? (
                  <span className="inline-flex items-center gap-1 text-[var(--div-m3)]">
                    <CheckCircle2 className="w-4 h-4" /> CORRECT
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[var(--div-danger)]">
                    <XCircle className="w-4 h-4" /> INCORRECT — Logged to Weak Topics Queue
                  </span>
                )}
              </div>
              <div className="text-sm text-[var(--ink-secondary)] leading-relaxed">
                <MarkdownBlock content={currentQ.explanation} />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-[var(--rule-hairline)]">
            <button
              type="button"
              disabled={questionIdx === 0}
              onClick={() => setQuestionIdx((i) => Math.max(0, i - 1))}
              className="px-3 py-1.5 text-xs font-semibold rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-sheet)] text-[var(--ink-primary)] disabled:opacity-40 inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Previous
            </button>

            {questionIdx < questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setQuestionIdx((i) => Math.min(questions.length - 1, i + 1))}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-[2px] border border-[var(--ink-primary)] bg-[var(--ink-primary)] text-[var(--bg-paper)] inline-flex items-center gap-1"
              >
                Next <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => finishDiagnostic(activeQuizModule)}
                className="px-4 py-1.5 text-xs font-semibold rounded-[2px] border border-[var(--div-m3)] bg-[var(--div-m3)] text-white"
              >
                Complete &amp; View Standing Report
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Main Standing Dashboard
  const summaryResult = showSummaryFor ? standingResults[showSummaryFor] : null;
  const activeRefresher = refresherModule ? MODULE_REFRESHERS[refresherModule] : null;

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 pb-3 border-b border-[var(--rule-strong)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--ink-primary)]">
            Diagnostic Standing — BACSE106 Operating Systems
          </h1>
          <p className="font-mono text-xs text-[var(--ink-muted)] mt-1 tabular-nums">
            150 Tiered Questions (30 per Module · 10 Foundation + 10 Application + 10 Analysis) ·{' '}
            {completedCount}/5 Modules Diagnosed · Aggregate {totalScore}/150
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigateView('sprint')}
            className="px-3 py-1.5 text-xs font-semibold rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-paper)] text-[var(--ink-primary)] hover:bg-[var(--bg-recessed)]"
          >
            Open 48h Sprint Planner
          </button>
          <button
            type="button"
            onClick={() => onNavigateView('labs')}
            className="px-3 py-1.5 text-xs font-semibold rounded-[2px] border border-[var(--ink-primary)] bg-[var(--ink-primary)] text-[var(--bg-paper)] hover:opacity-90 inline-flex items-center gap-1.5"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            Launch OS Labs
          </button>
        </div>
      </div>

      {/* Fresh Diagnostic Result Banner */}
      {summaryResult && (
        <div className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[2px] p-4 sm:p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-[var(--ink-primary)]">
                {summaryResult.moduleId.toUpperCase()} Standing Completed: {summaryResult.score}/
                {summaryResult.total} ({summaryResult.bandLabel})
              </h2>
              <p className="text-sm text-[var(--ink-secondary)] mt-1">
                {summaryResult.prescriptiveAdvice}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowSummaryFor(null)}
              className="p-1 text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
              aria-label="Dismiss diagnostic report"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 font-mono text-xs tabular-nums">
            <div className="p-2.5 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px]">
              <div className="text-[var(--ink-muted)]">Foundation</div>
              <div className="text-base font-bold text-[var(--ink-primary)]">
                {summaryResult.foundation.correct}/{summaryResult.foundation.total} ({summaryResult.foundation.pct}%)
              </div>
            </div>
            <div className="p-2.5 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px]">
              <div className="text-[var(--ink-muted)]">Application</div>
              <div className="text-base font-bold text-[var(--ink-primary)]">
                {summaryResult.application.correct}/{summaryResult.application.total} ({summaryResult.application.pct}%)
              </div>
            </div>
            <div className="p-2.5 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px]">
              <div className="text-[var(--ink-muted)]">Analysis</div>
              <div className="text-base font-bold text-[var(--ink-primary)]">
                {summaryResult.analysis.correct}/{summaryResult.analysis.total} ({summaryResult.analysis.pct}%)
              </div>
            </div>
          </div>

          {summaryResult.missedTopicIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="font-mono text-xs text-[var(--ink-muted)]">Jump to Missed Notes:</span>
              {summaryResult.missedTopicIds.map((tid) => (
                <button
                  key={tid}
                  type="button"
                  onClick={() =>
                    onNavigateView('syllabus', { moduleId: summaryResult.moduleId, topicId: tid })
                  }
                  className="font-mono text-xs px-2 py-1 rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-sheet)] text-[var(--ink-primary)] hover:bg-[var(--bg-recessed)]"
                >
                  {topicTitleMap[tid] ?? tid}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Top Grid: 5-Axis Radar + Diagnostic Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-5">
          <RadarChart data={radarData} />
        </div>

        <div className="lg:col-span-7 bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-5 space-y-4">
          <h2 className="text-lg font-bold text-[var(--ink-primary)]">
            How Your 3-Tier Standing Directs Your 48-Hour FAT Sprint
          </h2>
          <p className="prose-manual text-sm sm:text-base">
            Start by diagnosing each of the five VIT Chennai BACSE106 modules. Every 30-question
            check separates <strong>Foundation</strong> (definitions &amp; invariants),{' '}
            <strong>Application</strong> (C1/C2 numerical traces), and <strong>Analysis</strong>{' '}
            (15M edge cases &amp; scenario synthesis). Any missed question automatically feeds your{' '}
            <strong>Weak Topics Queue</strong>.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs tabular-nums">
            <div className="p-2.5 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px]">
              <div className="font-bold text-[var(--div-m3)]">Band A · 25–30</div>
              <div className="text-[var(--ink-muted)] mt-0.5">Exam-Ready</div>
            </div>
            <div className="p-2.5 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px]">
              <div className="font-bold text-[var(--div-m4)]">Band B · 18–24</div>
              <div className="text-[var(--ink-muted)] mt-0.5">Drill Edge Cases</div>
            </div>
            <div className="p-2.5 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px]">
              <div className="font-bold text-[var(--div-m2)]">Band C · 10–17</div>
              <div className="text-[var(--ink-muted)] mt-0.5">Study Notes</div>
            </div>
            <div className="p-2.5 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px]">
              <div className="font-bold text-[var(--div-danger)]">Band D · 0–9</div>
              <div className="text-[var(--ink-muted)] mt-0.5">Run Refresher</div>
            </div>
          </div>

          <div className="pt-2 border-t border-[var(--rule-hairline)] text-xs text-[var(--ink-secondary)] flex flex-wrap items-center justify-between gap-2">
            <span>
              High-alert overdue gaps across C1 &amp; C2: <strong>M4 File Systems / Inodes</strong>{' '}
              &amp; <strong>M5 Security / Access Matrix</strong>.
            </span>
            <button
              type="button"
              onClick={() => onNavigateView('prediction')}
              className="font-mono font-semibold underline text-[var(--ink-primary)]"
            >
              Inspect Coverage Matrix →
            </button>
          </div>
        </div>
      </div>

      {/* 5 Module Diagnostic Cards */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-[var(--ink-primary)]">
          Module Diagnostics &amp; Rapid Refreshers (M1 – M5)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MODULES.map((mod) => {
            const res = standingResults[mod.id];
            return (
              <div
                key={mod.id}
                className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-4 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-mono text-xs text-[var(--ink-muted)] tabular-nums">
                        {mod.code} · {mod.co} · {mod.hours}h ({mod.weightPct}% syllabus) ·{' '}
                        {mod.topics.length} topics
                      </div>
                      <h3 className="text-base font-bold text-[var(--ink-primary)] mt-0.5">
                        {mod.title}
                      </h3>
                    </div>
                    {res ? (
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-[2px] bg-[var(--bg-recessed)] border border-[var(--rule-strong)] text-[var(--ink-primary)] tabular-nums shrink-0">
                        Band {res.band} · {res.score}/{res.total}
                      </span>
                    ) : (
                      <span className="font-mono text-xs text-[var(--ink-muted)] shrink-0">
                        Not taken
                      </span>
                    )}
                  </div>

                  {res ? (
                    <div className="space-y-1.5">
                      <div className="grid grid-cols-3 gap-1.5 font-mono text-[11px] tabular-nums">
                        <div className="px-2 py-1 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px]">
                          Fdn: {res.foundation.pct}%
                        </div>
                        <div className="px-2 py-1 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px]">
                          App: {res.application.pct}%
                        </div>
                        <div className="px-2 py-1 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px]">
                          Ana: {res.analysis.pct}%
                        </div>
                      </div>
                      <p className="text-xs text-[var(--ink-secondary)] leading-snug">
                        {res.prescriptiveAdvice}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--ink-secondary)] leading-snug">
                      Covers {mod.topics.map((t) => t.title.split('&')[0].trim()).slice(0, 3).join(', ')}
                      {mod.topics.length > 3 ? ` + ${mod.topics.length - 3} more` : ''}.
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--rule-hairline)]">
                  <button
                    type="button"
                    onClick={() => startDiagnostic(mod.id)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-[2px] border border-[var(--ink-primary)] bg-[var(--ink-primary)] text-[var(--bg-paper)] hover:opacity-90 inline-flex items-center gap-1.5"
                  >
                    {res ? <RotateCcw className="w-3.5 h-3.5" /> : <ClipboardCheck className="w-3.5 h-3.5" />}
                    {res ? 'Retake 30-Q Check' : 'Start 30-Q Check'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRefresherModule(mod.id)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)] text-[var(--ink-primary)] hover:bg-[var(--bg-recessed)] inline-flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    5-Min Refresher
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateView('syllabus', { moduleId: mod.id })}
                    className="px-2.5 py-1.5 text-xs font-semibold rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-paper)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] inline-flex items-center gap-1"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Notes
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inline Module Refresher Modal */}
      {activeRefresher && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="refresher-modal-title"
          onClick={() => setRefresherModule(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[2px] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-5 py-3.5 bg-[var(--bg-board)] border-b border-[var(--rule-hairline)]">
              <div>
                <h2 id="refresher-modal-title" className="text-base font-bold text-[var(--ink-primary)]">
                  {activeRefresher.title}
                </h2>
                <p className="font-mono text-xs text-[var(--ink-muted)]">
                  Estimated read: {activeRefresher.readMinutes} min · Pre-Diagnostic Primer
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRefresherModule(null)}
                className="p-1.5 rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-paper)] text-[var(--ink-primary)]"
                aria-label="Close refresher"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3.5 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px]">
                <div className="font-mono text-xs font-bold text-[var(--ink-muted)] mb-1">
                  Core Mental Model
                </div>
                <div className="prose-manual text-sm">
                  <MarkdownBlock content={activeRefresher.coreMentalModel} />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-[var(--ink-primary)] mb-2">
                  Must-Know Formulas &amp; Invariants
                </h3>
                <div className="space-y-1.5">
                  {activeRefresher.mustKnowFormulas.map((f) => (
                    <div
                      key={f}
                      className="font-mono text-xs px-3 py-2 bg-[var(--bg-recessed)] border border-[var(--rule-hairline)] rounded-[2px] text-[var(--ink-primary)]"
                    >
                      {f}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-[var(--ink-primary)] mb-2">
                  High-Yield Takeaways
                </h3>
                <ul className="space-y-1.5 text-sm text-[var(--ink-secondary)] list-disc pl-5">
                  {activeRefresher.highYieldBullets.map((b) => (
                    <li key={b}>
                      <MarkdownBlock content={b} />
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 bg-[var(--bg-recessed)] border border-[var(--rule-strong)] rounded-[2px]">
                <h3 className="font-mono text-xs font-bold text-[var(--div-danger)] mb-1.5">
                  FAT Exam Checkpoints
                </h3>
                <ul className="space-y-1 text-xs text-[var(--ink-primary)] list-disc pl-4">
                  {activeRefresher.fatCheckpoints.map((c) => (
                    <li key={c}>
                      <MarkdownBlock content={c} />
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--rule-hairline)]">
                <button
                  type="button"
                  onClick={() => {
                    const m = activeRefresher.moduleId;
                    setRefresherModule(null);
                    startDiagnostic(m);
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-[2px] border border-[var(--ink-primary)] bg-[var(--ink-primary)] text-[var(--bg-paper)]"
                >
                  Start {activeRefresher.moduleId.toUpperCase()} 30-Q Diagnostic →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
