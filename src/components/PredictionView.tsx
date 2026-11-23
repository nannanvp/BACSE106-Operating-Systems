import React, { useMemo, useState } from 'react';
import { ArrowUpRight, Compass, Grid3X3, Sparkles, Target } from 'lucide-react';
import { MODULES } from '../data/courseData';
import { SLOT_COLUMNS, SLOT_FORENSIC_ITEMS } from '../data/slotPaperAnalysis';
import { PredictedQuestionItem, buildPredictionModels } from '../utils/predictionEngine';

interface PredictionViewProps {
  onOpenTopicInSyllabus: (moduleId: string, topicId: string) => void;
}

type LensTab = 'matrix' | 'alpha' | 'beta' | 'gamma';

export const PredictionView: React.FC<PredictionViewProps> = ({ onOpenTopicInSyllabus }) => {
  const [lens, setLens] = useState<LensTab>('matrix');
  const [statusFilter, setStatusFilter] = useState<'all' | 'untested-gap' | 'recurring-anchor'>('all');

  const prediction = useMemo(() => {
    const syllabusTopics = MODULES.flatMap((m) =>
      m.topics.map((t) => ({
        moduleId: m.id,
        moduleCode: m.code,
        topicId: t.id,
        topicTitle: t.title,
      }))
    );
    return buildPredictionModels(syllabusTopics, SLOT_FORENSIC_ITEMS);
  }, []);

  const filteredMatrix = useMemo(() => {
    if (statusFilter === 'all') return prediction.matrix;
    return prediction.matrix.filter((row) => row.status === statusFilter);
  }, [prediction.matrix, statusFilter]);

  const renderPaperLens = (paper: {
    name: string;
    subtitle: string;
    totalMarks: number;
    questions: PredictedQuestionItem[];
  }) => (
    <div className="space-y-4">
      <div className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[2px] p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[var(--ink-primary)]">{paper.name}</h2>
          <p className="text-xs sm:text-sm text-[var(--ink-secondary)] mt-0.5">{paper.subtitle}</p>
        </div>
        <div className="font-mono text-xs font-bold px-3 py-1.5 rounded-[2px] bg-[var(--bg-recessed)] border border-[var(--rule-strong)] text-[var(--ink-primary)] tabular-nums">
          {paper.questions.length} Questions · {paper.totalMarks} Marks
        </div>
      </div>

      <div className="space-y-3">
        {paper.questions.map((q) => (
          <div
            key={q.qNo}
            className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-4 space-y-2"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-mono text-xs font-bold text-[var(--ink-primary)] tabular-nums">
                {q.qNo} · {q.moduleCode} · {q.marks} Marks · Bloom {q.bloom}
              </div>
              <button
                type="button"
                onClick={() => onOpenTopicInSyllabus(q.moduleId, q.topicId)}
                className="px-2.5 py-1 text-xs font-mono font-semibold rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)] text-[var(--ink-primary)] hover:bg-[var(--bg-recessed)] inline-flex items-center gap-1"
              >
                Study Syllabus Note <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <h3 className="text-base font-bold text-[var(--ink-primary)]">{q.title}</h3>
            <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">{q.prompt}</p>
            <div className="text-xs font-mono text-[var(--ink-muted)] pt-1 border-t border-[var(--rule-hairline)]">
              Forensic Rationale: {q.rationale}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 pb-3 border-b border-[var(--rule-strong)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--ink-primary)]">
            FAT Slot Forensics &amp; 2026 Prediction Models
          </h1>
          <p className="font-mono text-xs text-[var(--ink-muted)] mt-1 tabular-nums">
            Analyzed: 3 Real VIT Chennai Papers (C1 Set 2-2 · C1 Set 1-2 · C2+TC2 = 27 Questions) ·
            F1 Slot Ready to Plug In · {prediction.untestedTopicsCount} Overdue Gaps ·{' '}
            {prediction.recurringAnchorsCount} Recurring Anchors
          </p>
        </div>
      </div>

      {/* 4 Lens Tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        {(
          [
            { id: 'matrix', label: '1. Coverage Matrix (C1/C2/F1)', icon: Grid3X3 },
            { id: 'alpha', label: '2. Alpha Gap Model (100M)', icon: Target },
            { id: 'beta', label: '3. Beta Rotation Model (100M)', icon: Compass },
            { id: 'gamma', label: '4. Gamma Consensus (100M)', icon: Sparkles },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = lens === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setLens(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-[2px] border inline-flex items-center gap-1.5 transition-colors ${
                active
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

      {lens === 'matrix' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-3.5">
            <div className="text-xs text-[var(--ink-secondary)]">
              Every syllabus topic mapped across uploaded slots. <strong>Overdue Gaps</strong>{' '}
              (0 appearances across C1 &amp; C2) carry maximum surprise risk for 25 Nov 2026.
            </div>
            <div className="flex items-center gap-1.5 font-mono text-xs">
              {(
                [
                  { id: 'all', label: `All (${prediction.matrix.length})` },
                  { id: 'untested-gap', label: `Overdue Gaps (${prediction.untestedTopicsCount})` },
                  { id: 'recurring-anchor', label: `Anchors (${prediction.recurringAnchorsCount})` },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-2.5 py-1 rounded-[2px] border font-semibold ${
                    statusFilter === f.id
                      ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)]'
                      : 'bg-[var(--bg-sheet)] text-[var(--ink-secondary)] border-[var(--rule-hairline)]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[2px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[var(--bg-recessed)] border-b border-[var(--rule-strong)] font-mono">
                  <th className="px-3 py-2.5">Mod</th>
                  <th className="px-3 py-2.5">Syllabus Topic</th>
                  {SLOT_COLUMNS.map((col) => (
                    <th key={col.id} className="px-3 py-2.5 whitespace-nowrap">
                      <div>{col.label}</div>
                      <div className="text-[10px] font-normal text-[var(--ink-muted)]">{col.sub}</div>
                    </th>
                  ))}
                  <th className="px-3 py-2.5">Signal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--rule-hairline)]">
                {filteredMatrix.map((row) => (
                  <tr key={row.topicId} className="hover:bg-[var(--bg-sheet)]">
                    <td className="px-3 py-2 font-mono font-bold text-[var(--ink-primary)]">
                      {row.moduleCode}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => onOpenTopicInSyllabus(row.moduleId, row.topicId)}
                        className="text-left font-medium text-[var(--ink-primary)] hover:underline"
                      >
                        {row.topicTitle}
                      </button>
                    </td>
                    {SLOT_COLUMNS.map((col) => {
                      if (col.id === 'f1') {
                        return (
                          <td
                            key={col.id}
                            className="px-3 py-2 font-mono text-[11px] text-[var(--ink-muted)] italic"
                          >
                            Pending
                          </td>
                        );
                      }
                      const hit = row.appearances[col.id];
                      return (
                        <td key={col.id} className="px-3 py-2 font-mono tabular-nums">
                          {hit ? (
                            <span className="font-bold text-[var(--ink-primary)]">
                              {hit.questionNumber} ({hit.marks}M)
                            </span>
                          ) : (
                            <span className="text-[var(--ink-muted)]">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 font-mono font-bold whitespace-nowrap">
                      {row.status === 'untested-gap' ? (
                        <span className="text-[var(--div-danger)]">OVERDUE GAP</span>
                      ) : row.status === 'recurring-anchor' ? (
                        <span className="text-[var(--div-m3)]">
                          ANCHOR ({row.totalMarksAcrossSlots}M)
                        </span>
                      ) : (
                        <span className="text-[var(--ink-muted)]">
                          1 Slot ({row.totalMarksAcrossSlots}M)
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {lens === 'alpha' && renderPaperLens(prediction.alphaGapPaper)}
      {lens === 'beta' && renderPaperLens(prediction.betaRotationPaper)}
      {lens === 'gamma' && renderPaperLens(prediction.gammaConsensusPaper)}
    </section>
  );
};
