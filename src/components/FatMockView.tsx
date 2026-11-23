import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  FileCheck2,
  FlaskConical,
  ListChecks,
  Pause,
  Play,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { MOCK_MCQS, MODULES } from '../data/courseData';
import { COURSE_ATTACHED_FILES } from '../data/professorMaterials';
import { EXAM_PAPERS, SLOT_FORENSIC_ITEMS } from '../data/slotPaperAnalysis';
import { AnnotatedWeakTopic, WeakTopicSource } from '../utils/weakTopicsEngine';
import { LabTabId } from './InteractiveLabsView';
import { MarkdownBlock } from './MarkdownBlock';
import { WeakTopicsPanel } from './WeakTopicsPanel';

export type MockSubView = 'papers' | 'forensics' | 'mcq' | 'weak';

interface FatMockViewProps {
  initialSubView?: MockSubView;
  rubricScores: Record<string, Record<string, number>>;
  onUpdateRubricScore: (paperId: string, subPartId: string, score: number) => void;
  mcqAnswers: Record<string, number>;
  onAnswerMcq: (mcqId: string, chosenIndex: number) => void;
  onResetMcq: () => void;
  weakTopics: AnnotatedWeakTopic[];
  onLogWeakTopic: (payload: {
    topicId: string;
    moduleId: string;
    topicTitle: string;
    source: WeakTopicSource;
  }) => void;
  onMarkWeakReviewed: (topicId: string, resolve: boolean) => void;
  onOpenTopicInSyllabus: (moduleId: string, topicId: string) => void;
  onOpenLabPreset: (labTab: LabTabId) => void;
}

function formatHms(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export const FatMockView: React.FC<FatMockViewProps> = ({
  initialSubView,
  rubricScores,
  onUpdateRubricScore,
  mcqAnswers,
  onAnswerMcq,
  onResetMcq,
  weakTopics,
  onLogWeakTopic,
  onMarkWeakReviewed,
  onOpenTopicInSyllabus,
  onOpenLabPreset,
}) => {
  const [subView, setSubView] = useState<MockSubView>(initialSubView ?? 'papers');
  const [selectedPaperId, setSelectedPaperId] = useState<string>(EXAM_PAPERS[0].id);
  const [expandedSolutions, setExpandedSolutions] = useState<Record<string, boolean>>({});
  const [examModeActive, setExamModeActive] = useState(false);
  const [examTimerRunning, setExamTimerRunning] = useState(false);
  const [examRemainingSec, setExamRemainingSec] = useState(180 * 60);

  // MCQ filter state
  const [mcqModFilter, setMcqModFilter] = useState<'all' | 'm1' | 'm2' | 'm3' | 'm4' | 'm5'>('all');
  const [mcqPartFilter, setMcqPartFilter] = useState<'ALL' | 'A' | 'B'>('ALL');
  const [confirmResetMcq, setConfirmResetMcq] = useState(false);

  useEffect(() => {
    if (initialSubView) setSubView(initialSubView);
  }, [initialSubView]);

  useEffect(() => {
    if (!examTimerRunning) return;
    const id = window.setInterval(() => {
      setExamRemainingSec((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [examTimerRunning]);

  const topicTitleMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of MODULES) {
      for (const t of m.topics) map[t.id] = t.title;
    }
    return map;
  }, []);

  const activePaper = useMemo(
    () => EXAM_PAPERS.find((p) => p.id === selectedPaperId) ?? EXAM_PAPERS[0],
    [selectedPaperId]
  );

  const paperScoreMap = rubricScores[activePaper.id] ?? {};
  const paperTotalScored = useMemo(() => {
    let sum = 0;
    for (const q of activePaper.questions) {
      for (const sp of q.subParts) {
        sum += Math.min(sp.maxMarks, Math.max(0, paperScoreMap[sp.id] ?? 0));
      }
    }
    return Number(sum.toFixed(1));
  }, [activePaper, paperScoreMap]);

  const filteredMcqs = useMemo(
    () =>
      MOCK_MCQS.filter((q) => {
        if (mcqModFilter !== 'all' && q.moduleId !== mcqModFilter) return false;
        if (mcqPartFilter !== 'ALL' && q.part !== mcqPartFilter) return false;
        return true;
      }),
    [mcqModFilter, mcqPartFilter]
  );

  const mcqStats = useMemo(() => {
    let attempted = 0;
    let correct = 0;
    for (const q of MOCK_MCQS) {
      if (mcqAnswers[q.id] !== undefined) {
        attempted += 1;
        if (mcqAnswers[q.id] === q.correctIndex) correct += 1;
      }
    }
    return { attempted, correct };
  }, [mcqAnswers]);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 pb-3 border-b border-[var(--rule-strong)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--ink-primary)]">
            100M FAT Mock Papers, Forensics &amp; Weak Queue
          </h1>
          <p className="font-mono text-xs text-[var(--ink-muted)] mt-1 tabular-nums">
            4 Full 100-Mark Papers (3 Real VIT Chennai Slots + Predicted 2026) · 50 Rapid MCQs ·{' '}
            {weakTopics.length} Active Weak Topic{weakTopics.length === 1 ? '' : 's'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'papers', label: '100M Papers (4)', icon: FileCheck2 },
              { id: 'forensics', label: 'Paper Forensics (27 Qs)', icon: BookOpen },
              { id: 'mcq', label: `Rapid MCQs (${mcqStats.correct}/${MOCK_MCQS.length})`, icon: ListChecks },
              { id: 'weak', label: `Weak Queue (${weakTopics.length})`, icon: AlertTriangle },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubView(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-[2px] border inline-flex items-center gap-1.5 ${
                  subView === tab.id
                    ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)]'
                    : 'bg-[var(--bg-paper)] text-[var(--ink-secondary)] border-[var(--rule-hairline)] hover:bg-[var(--bg-recessed)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* SUBVIEW 1: 4×100M FULL PAPERS */}
      {subView === 'papers' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {EXAM_PAPERS.map((paper) => {
              const active = paper.id === activePaper.id;
              return (
                <button
                  key={paper.id}
                  type="button"
                  onClick={() => setSelectedPaperId(paper.id)}
                  className={`p-3 text-left rounded-[2px] border transition-colors ${
                    active
                      ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)]'
                      : 'bg-[var(--bg-paper)] text-[var(--ink-primary)] border-[var(--rule-hairline)] hover:bg-[var(--bg-recessed)]'
                  }`}
                >
                  <div className="font-mono text-[11px] font-bold opacity-85">{paper.code}</div>
                  <div className="text-xs font-bold mt-0.5 leading-snug">{paper.structureLabel}</div>
                  <div className="font-mono text-[10px] opacity-75 mt-1 truncate">
                    {paper.isRealSlot ? 'Real VIT Chennai FAT' : '2026 Consensus Mock'}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Paper Header + 3-Hour Exam Mode Control Bar */}
          <div className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[2px] p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-[var(--ink-primary)]">{activePaper.title}</h2>
              <p className="text-xs text-[var(--ink-secondary)]">{activePaper.subtitle}</p>
              <div className="font-mono text-xs text-[var(--ink-muted)] flex flex-wrap items-center gap-3">
                <span>Setter: {activePaper.setter}</span>
                {activePaper.pdfHref && (
                  <a
                    href={activePaper.pdfHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 underline text-[var(--ink-primary)] font-semibold"
                  >
                    Original PDF <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <div className="px-3 py-1.5 rounded-[2px] bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] font-mono text-xs tabular-nums">
                Rubric Score:{' '}
                <strong className="text-sm text-[var(--ink-primary)]">
                  {paperTotalScored} / {activePaper.totalMarks}
                </strong>
              </div>

              <button
                type="button"
                onClick={() => {
                  setExamModeActive((v) => !v);
                  if (!examModeActive) {
                    setExpandedSolutions({});
                    setExamTimerRunning(true);
                  } else {
                    setExamTimerRunning(false);
                  }
                }}
                className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-[2px] border inline-flex items-center gap-1.5 ${
                  examModeActive
                    ? 'bg-[var(--div-m2)] text-white border-[var(--div-m2)]'
                    : 'bg-[var(--bg-sheet)] text-[var(--ink-primary)] border-[var(--rule-strong)]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                {examModeActive ? `Exam Mode ${formatHms(examRemainingSec)}` : 'Start 3-Hour Exam Mode'}
              </button>

              {examModeActive && (
                <div className="inline-flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setExamTimerRunning((r) => !r)}
                    className="p-1.5 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)]"
                    aria-label={examTimerRunning ? 'Pause exam timer' : 'Resume exam timer'}
                  >
                    {examTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setExamTimerRunning(false);
                      setExamRemainingSec(180 * 60);
                    }}
                    className="p-1.5 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)]"
                    aria-label="Reset exam timer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Paper Questions + Inline Sub-part Rubric Inputs */}
          <div className="space-y-4">
            {activePaper.questions.map((q) => {
              const showSol = Boolean(expandedSolutions[q.id]);
              return (
                <div
                  key={q.id}
                  className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-4 sm:p-5 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--rule-hairline)]">
                    <div className="font-mono text-xs font-bold text-[var(--ink-primary)] tabular-nums">
                      {q.qNo} · {q.moduleId.toUpperCase()} · {q.co} · Bloom {q.bloom} · {q.marks}{' '}
                      Marks
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {q.labPresetLink && (
                        <button
                          type="button"
                          onClick={() => onOpenLabPreset(q.labPresetLink!.labTab)}
                          className="px-2.5 py-1 text-xs font-mono font-semibold rounded-[2px] border border-[var(--div-m4)] bg-[var(--bg-sheet)] text-[var(--ink-primary)] inline-flex items-center gap-1"
                        >
                          <FlaskConical className="w-3 h-3 text-[var(--div-m4)]" />
                          Verify in Lab
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onOpenTopicInSyllabus(q.moduleId, q.topicId)}
                        className="px-2.5 py-1 text-xs font-mono rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-sheet)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                      >
                        Syllabus Note
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-[var(--ink-primary)]">{q.title}</h3>
                  <div className="prose-manual text-sm">
                    <MarkdownBlock content={q.stem} />
                  </div>

                  {/* Sub-part Self-Grading Rubric */}
                  <div className="space-y-2 pt-1">
                    {q.subParts.map((sp) => (
                      <div
                        key={sp.id}
                        className="p-3 rounded-[2px] bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                      >
                        <div className="space-y-0.5 text-xs">
                          <div className="text-[var(--ink-primary)]">
                            <strong className="font-mono mr-1.5">{sp.label}</strong>
                            {sp.prompt}
                          </div>
                          {!examModeActive && (
                            <div className="font-mono text-[11px] text-[var(--ink-muted)]">
                              Rubric: {sp.rubricCue}
                            </div>
                          )}
                        </div>

                        <label className="inline-flex items-center gap-1.5 font-mono text-xs shrink-0 tabular-nums">
                          <input
                            type="number"
                            min={0}
                            max={sp.maxMarks}
                            step={0.5}
                            value={paperScoreMap[sp.id] ?? 0}
                            onChange={(e) =>
                              onUpdateRubricScore(
                                activePaper.id,
                                sp.id,
                                Math.min(sp.maxMarks, Math.max(0, Number(e.target.value) || 0))
                              )
                            }
                            className="w-16 px-2 py-1 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-paper)] text-right font-bold"
                          />
                          <span className="text-[var(--ink-muted)]">/ {sp.maxMarks}M</span>
                        </label>
                      </div>
                    ))}
                  </div>

                  {/* Worked Solution Toggle */}
                  {!examModeActive && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedSolutions((prev) => ({ ...prev, [q.id]: !prev[q.id] }))
                        }
                        className="px-3 py-1.5 text-xs font-mono font-semibold rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)] text-[var(--ink-primary)] hover:bg-[var(--bg-recessed)] inline-flex items-center gap-1.5"
                      >
                        {showSol ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        {showSol ? 'Hide Verified Solution' : 'Show Machine-Verified Solution'}
                      </button>

                      {showSol && (
                        <div className="mt-3 p-4 rounded-[2px] bg-[var(--bg-recessed)] border border-[var(--rule-strong)] prose-manual text-sm">
                          <MarkdownBlock content={q.workedSolution} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBVIEW 2: PAPER SOURCE FORENSICS */}
      {subView === 'forensics' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {COURSE_ATTACHED_FILES.filter((f) => f.kind === 'past-paper' || f.kind === 'pending-slot').map(
              (f) => (
                <div
                  key={f.id}
                  className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-4 flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="text-sm font-bold text-[var(--ink-primary)]">{f.label}</div>
                    <div className="text-xs text-[var(--ink-secondary)] mt-1">{f.detail}</div>
                  </div>
                  {f.href ? (
                    <a
                      href={f.href}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 text-xs font-mono font-semibold rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)] text-[var(--ink-primary)] inline-flex items-center gap-1 shrink-0"
                    >
                      PDF <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="font-mono text-[11px] font-bold text-[var(--div-m2)] shrink-0">
                      READY FOR F1
                    </span>
                  )}
                </div>
              )
            )}
          </div>

          <div className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[2px] overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[var(--bg-recessed)] border-b border-[var(--rule-strong)] font-mono">
                  <th className="px-3 py-2">Slot</th>
                  <th className="px-3 py-2">Q#</th>
                  <th className="px-3 py-2">Mod</th>
                  <th className="px-3 py-2">Marks</th>
                  <th className="px-3 py-2">Bloom</th>
                  <th className="px-3 py-2">Topic &amp; Question Archetype</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--rule-hairline)]">
                {SLOT_FORENSIC_ITEMS.map((item, idx) => (
                  <tr key={`${item.slotId}-${item.questionNumber}-${idx}`} className="hover:bg-[var(--bg-sheet)]">
                    <td className="px-3 py-2 font-mono font-bold whitespace-nowrap">{item.slotLabel}</td>
                    <td className="px-3 py-2 font-mono">{item.questionNumber}</td>
                    <td className="px-3 py-2 font-mono uppercase">{item.moduleId}</td>
                    <td className="px-3 py-2 font-mono tabular-nums font-bold">{item.marks}M</td>
                    <td className="px-3 py-2 font-mono">{item.bloom}</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => onOpenTopicInSyllabus(item.moduleId, item.topicId)}
                        className="text-left hover:underline text-[var(--ink-primary)] font-medium"
                      >
                        {item.topicTitle} — <span className="text-[var(--ink-secondary)] font-normal">{item.archetype}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBVIEW 3: RAPID 50-MCQ DRILL */}
      {subView === 'mcq' && (
        <div className="space-y-4">
          <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
              {(['all', 'm1', 'm2', 'm3', 'm4', 'm5'] as const).map((mf) => (
                <button
                  key={mf}
                  type="button"
                  onClick={() => setMcqModFilter(mf)}
                  className={`px-2 py-1 rounded-[2px] border font-semibold uppercase ${
                    mcqModFilter === mf
                      ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)]'
                      : 'bg-[var(--bg-sheet)] text-[var(--ink-secondary)] border-[var(--rule-hairline)]'
                  }`}
                >
                  {mf === 'all' ? 'All Mods' : mf}
                </button>
              ))}
              {(['ALL', 'A', 'B'] as const).map((pf) => (
                <button
                  key={pf}
                  type="button"
                  onClick={() => setMcqPartFilter(pf)}
                  className={`px-2 py-1 rounded-[2px] border font-semibold ${
                    mcqPartFilter === pf
                      ? 'bg-[var(--div-m4)] text-white border-[var(--div-m4)]'
                      : 'bg-[var(--bg-sheet)] text-[var(--ink-secondary)] border-[var(--rule-hairline)]'
                  }`}
                >
                  {pf === 'ALL' ? 'Part A+B' : `Part ${pf}`}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 font-mono text-xs tabular-nums">
              <span>
                Score: <strong>{mcqStats.correct}</strong> / {mcqStats.attempted} attempted
              </span>
              {!confirmResetMcq ? (
                <button
                  type="button"
                  onClick={() => setConfirmResetMcq(true)}
                  className="px-2 py-1 rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-sheet)] text-[var(--ink-secondary)]"
                >
                  Reset
                </button>
              ) : (
                <div className="inline-flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      onResetMcq();
                      setConfirmResetMcq(false);
                    }}
                    className="px-2 py-1 rounded-[2px] bg-[var(--div-danger)] text-white font-semibold"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmResetMcq(false)}
                    className="px-2 py-1 rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-sheet)]"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {filteredMcqs.map((q) => {
              const chosen = mcqAnswers[q.id];
              const answered = chosen !== undefined;
              return (
                <div
                  key={q.id}
                  className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-4 space-y-3"
                >
                  <div className="flex items-center justify-between font-mono text-xs text-[var(--ink-muted)]">
                    <span className="uppercase font-bold text-[var(--ink-primary)]">
                      {q.moduleId} · Part {q.part} ({q.marks}M)
                    </span>
                    <span>{topicTitleMap[q.topicId] ?? q.topicId}</span>
                  </div>
                  <div className="text-sm font-semibold text-[var(--ink-primary)]">
                    <MarkdownBlock content={q.question} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt, oi) => {
                      let cls =
                        'border-[var(--rule-hairline)] bg-[var(--bg-sheet)] hover:bg-[var(--bg-recessed)]';
                      if (answered) {
                        if (oi === q.correctIndex) cls = 'border-[var(--div-m3)] bg-[var(--div-m3)]/15';
                        else if (oi === chosen) cls = 'border-[var(--div-danger)] bg-[var(--div-danger)]/15';
                        else cls = 'border-[var(--rule-hairline)] bg-[var(--bg-sheet)] opacity-60';
                      }
                      return (
                        <button
                          key={oi}
                          type="button"
                          disabled={answered}
                          onClick={() => {
                            onAnswerMcq(q.id, oi);
                            if (oi !== q.correctIndex) {
                              onLogWeakTopic({
                                topicId: q.topicId,
                                moduleId: q.moduleId,
                                topicTitle: topicTitleMap[q.topicId] ?? q.topicId,
                                source: 'mcq',
                              });
                            }
                          }}
                          className={`text-left px-3 py-2 text-xs rounded-[2px] border transition-colors ${cls}`}
                        >
                          <span className="font-mono font-bold mr-1.5">
                            {String.fromCharCode(65 + oi)}.
                          </span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {answered && (
                    <div className="text-xs text-[var(--ink-secondary)] flex items-start gap-1.5 pt-1">
                      {chosen === q.correctIndex ? (
                        <CheckCircle2 className="w-4 h-4 text-[var(--div-m3)] shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-[var(--div-danger)] shrink-0 mt-0.5" />
                      )}
                      <MarkdownBlock content={q.explanation} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBVIEW 4: WEAK TOPICS QUEUE */}
      {subView === 'weak' && (
        <WeakTopicsPanel
          topics={weakTopics}
          onOpenTopicInSyllabus={onOpenTopicInSyllabus}
          onMarkReviewed={onMarkWeakReviewed}
        />
      )}
    </section>
  );
};
