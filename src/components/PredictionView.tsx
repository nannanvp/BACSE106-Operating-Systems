import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  ExternalLink,
  Filter,
  Grid3X3,
  Layers,
  RotateCw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';
import {
  ALPHA_F2_BLUEPRINT,
  BETA_F2_BLUEPRINT,
  C1_TO_C2_SHIFT_PATTERNS,
  GAMMA_F2_BLUEPRINT,
  GAMMA_SYNTHESIS_ROWS,
  GammaConsensusType,
  PredictedF2Question,
  PredictionCoverageFilter,
  SlotQuestionLink,
  TopicPredictionEntry,
  buildTopicPredictionMatrix,
  computePredictionStats,
  filterPredictionMatrix,
} from '../utils/predictionEngine';

interface PredictionViewProps {
  onOpenTopicInSyllabus: (moduleId: string, topicId: string) => void;
  onOpenFatPaper?: (paperId: string, qRef?: string) => void;
}

type LensTab = 'matrix' | 'alpha' | 'beta' | 'gamma';

const GAMMA_BADGE_STYLE: Record<GammaConsensusType, { bg: string; text: string; border: string }> = {
  'Unanimous Lock': {
    bg: 'bg-emerald-500/15 dark:bg-emerald-500/20',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-600/30 dark:border-emerald-400/40',
  },
  'Consensus + Split': {
    bg: 'bg-amber-500/15 dark:bg-amber-500/20',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-600/30 dark:border-amber-400/40',
  },
  'Arbitrated Anchor': {
    bg: 'bg-purple-500/15 dark:bg-purple-500/20',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-600/30 dark:border-purple-400/40',
  },
};

const ExpandableQuestionCard: React.FC<{
  link: SlotQuestionLink;
  onOpenTopicInSyllabus?: (moduleId: string, topicId: string) => void;
}> = ({ link }) => {
  const [open, setOpen] = useState(false);

  const slotBadgeClass =
    link.slotId === 'f1'
      ? 'bg-[var(--div-m3)] text-[var(--bg-paper)]'
      : link.slotId === 'c1-2-2'
        ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)]'
        : link.slotId === 'c1-1-2'
          ? 'bg-[var(--div-m2)] text-[var(--bg-paper)]'
          : 'bg-[var(--div-m4)] text-[var(--bg-paper)]';

  return (
    <div className="border border-[var(--rule-strong)] rounded-[2px] bg-[var(--bg-recessed)] overflow-hidden transition-all">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="w-full px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-left hover:bg-[var(--bg-sheet)] transition-colors"
      >
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span
            className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded-[2px] whitespace-nowrap shrink-0 ${slotBadgeClass}`}
          >
            {link.slotLabel} · {link.qNo} [{link.marks}M]
          </span>
          <span className="text-xs font-semibold text-[var(--ink-primary)] leading-tight truncate">
            {link.title}
          </span>
          <span className="font-mono text-[10px] text-[var(--ink-muted)]">
            Bloom {link.bl} · {link.co}
          </span>
        </div>
        <div className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-[var(--ink-secondary)] shrink-0">
          <span>{open ? 'Hide Question' : 'View Question'}</span>
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {open && (
        <div className="px-3.5 py-3 border-t border-[var(--rule-hairline)] bg-[var(--bg-paper)] space-y-3 text-xs">
          <div className="text-xs text-[var(--ink-primary)] leading-relaxed font-medium">
            {link.stem}
          </div>

          {link.subParts.length > 0 && (
            <div className="space-y-1.5 border-t border-b border-[var(--rule-hairline)] py-2">
              {link.subParts.map((sp) => (
                <div key={sp.label} className="flex items-start justify-between gap-2">
                  <div className="text-[var(--ink-secondary)] leading-relaxed">
                    <strong className="text-[var(--ink-primary)] mr-1 font-mono">{sp.label}</strong>
                    {sp.prompt}
                    {sp.rubricCue && (
                      <div className="text-[10px] font-mono text-[var(--ink-muted)] mt-0.5">
                        Rubric: {sp.rubricCue}
                      </div>
                    )}
                  </div>
                  <span className="font-mono text-[11px] font-bold text-[var(--ink-primary)] shrink-0 tabular-nums">
                    [{sp.marks}M]
                  </span>
                </div>
              ))}
            </div>
          )}

          {link.workedSolution && (
            <div className="space-y-1 bg-[var(--bg-recessed)] p-2.5 rounded-[2px] border border-[var(--rule-hairline)]">
              <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                Worked Solution / Marking Scheme
              </div>
              <p className="text-[11px] text-[var(--ink-secondary)] leading-relaxed whitespace-pre-wrap">
                {link.workedSolution}
              </p>
            </div>
          )}

          {link.labPresetLink && (
            <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-[var(--div-m3)]">
              <ExternalLink className="w-3 h-3" />
              <span>Interactive Preset: {link.labPresetLink.note}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const PredictionView: React.FC<PredictionViewProps> = ({ onOpenTopicInSyllabus }) => {
  const [lens, setLens] = useState<LensTab>('matrix');
  const [statusFilter, setStatusFilter] = useState<PredictionCoverageFilter>('all');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);

  const matrix = useMemo(() => buildTopicPredictionMatrix(), []);
  const stats = useMemo(() => computePredictionStats(matrix), [matrix]);

  const filteredMatrix = useMemo(
    () => filterPredictionMatrix(matrix, statusFilter, moduleFilter, searchQuery),
    [matrix, statusFilter, moduleFilter, searchQuery]
  );

  const toggleTopicExpand = (topicId: string) => {
    setExpandedTopicId((curr) => (curr === topicId ? null : topicId));
  };

  const renderPaperLens = (
    paperTitle: string,
    paperSubtitle: string,
    modelTag: 'Alpha F2' | 'Beta F2' | 'Gamma F2',
    questions: PredictedF2Question[],
    extraBanner?: React.ReactNode
  ) => {
    const totalMarks = questions.reduce((s, q) => s + q.marks, 0);
    const section1 = questions.filter((q) => q.marks === 10);
    const section2 = questions.filter((q) => q.marks === 15);

    return (
      <div className="space-y-6">
        {/* Model Header */}
        <div className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[2px] p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 mb-1.5 rounded-[2px] font-mono text-[11px] font-bold bg-[var(--ink-primary)] text-[var(--bg-paper)] uppercase tracking-wider">
              {modelTag} Model
            </div>
            <h2 className="text-xl font-bold text-[var(--ink-primary)]">{paperTitle}</h2>
            <p className="text-xs sm:text-sm text-[var(--ink-secondary)] mt-0.5">{paperSubtitle}</p>
          </div>
          <div className="flex flex-col items-end gap-1 font-mono text-xs tabular-nums">
            <span className="px-3 py-1.5 rounded-[2px] bg-[var(--bg-recessed)] border border-[var(--rule-strong)] font-bold text-[var(--ink-primary)]">
              {questions.length} Questions · {totalMarks} Marks
            </span>
            <span className="text-[11px] text-[var(--ink-muted)]">
              Section I: 7×10M (70M) · Section II: 2×15M (30M)
            </span>
          </div>
        </div>

        {extraBanner}

        {/* Section I */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-[var(--rule-hairline)] font-mono text-xs font-bold text-[var(--ink-secondary)]">
            <span>SECTION I: 7 × 10M = 70 MARKS (CORE ARCHETYPES)</span>
            <span>7 Questions</span>
          </div>
          <div className="space-y-3">
            {section1.map((q) => renderQuestionCard(q))}
          </div>
        </div>

        {/* Section II */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between pb-1 border-b border-[var(--rule-hairline)] font-mono text-xs font-bold text-[var(--ink-secondary)]">
            <span>SECTION II: 2 × 15M = 30 MARKS (CAPSTONE SYNTHESIS)</span>
            <span>2 Questions</span>
          </div>
          <div className="space-y-3">
            {section2.map((q) => renderQuestionCard(q))}
          </div>
        </div>
      </div>
    );
  };

  const renderQuestionCard = (q: PredictedF2Question) => (
    <div
      key={q.id}
      className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-4 space-y-3 hover:border-[var(--rule-strong)] transition-colors"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-[2px] bg-[var(--ink-primary)] text-[var(--bg-paper)]">
            {q.qNo} · {q.marks}M
          </span>
          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-[2px] bg-[var(--bg-recessed)] border border-[var(--rule-hairline)] text-[var(--ink-primary)]">
            {q.moduleId.toUpperCase()} · {q.co} · Bloom {q.bl}
          </span>
          {q.betaMechanism && (
            <span
              className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded-[2px] ${
                q.betaMechanism === 'Sibling Rotation'
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                  : 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30'
              }`}
            >
              {q.betaMechanism}
            </span>
          )}
          {q.gammaConsensusType && (
            <span
              className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded-[2px] border ${
                GAMMA_BADGE_STYLE[q.gammaConsensusType].bg
              } ${GAMMA_BADGE_STYLE[q.gammaConsensusType].text} ${
                GAMMA_BADGE_STYLE[q.gammaConsensusType].border
              }`}
            >
              {q.gammaConsensusType} {q.confidencePct && `(${q.confidencePct}%)`}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onOpenTopicInSyllabus(q.moduleId, q.targetTopicIds[0])}
          className="px-2.5 py-1 text-xs font-mono font-semibold rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)] text-[var(--ink-primary)] hover:bg-[var(--bg-recessed)] inline-flex items-center gap-1"
        >
          Study Syllabus Note <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div>
        <h3 className="text-base font-bold text-[var(--ink-primary)]">{q.title}</h3>
        {q.counterpart && (
          <div className="font-mono text-xs text-[var(--ink-muted)] mt-0.5">
            Past Baseline: {q.counterpart}
          </div>
        )}
        {q.precedentShift && (
          <div className="font-mono text-xs text-[var(--div-m3)] mt-0.5">
            Shift Provenance: {q.precedentShift}
          </div>
        )}
        {q.alphaVsBetaSummary && (
          <div className="font-mono text-xs text-amber-600 dark:text-amber-400 mt-0.5">
            Synthesis: {q.alphaVsBetaSummary}
          </div>
        )}
      </div>

      <div className="space-y-2 border-t border-b border-[var(--rule-hairline)] py-2.5">
        {q.subQuestions.map((sq) => (
          <div key={sq.part} className="flex items-start justify-between gap-2 text-xs">
            <div className="text-[var(--ink-secondary)] leading-relaxed">
              <strong className="text-[var(--ink-primary)] font-mono mr-1">{sq.part}</strong>
              {sq.text}
              {sq.rubricCue && (
                <div className="text-[10px] font-mono text-[var(--ink-muted)] mt-0.5">
                  Rubric Cue: {sq.rubricCue}
                </div>
              )}
            </div>
            <span className="font-mono font-bold text-[var(--ink-primary)] shrink-0 tabular-nums">
              [{sq.marks}M]
            </span>
          </div>
        ))}
      </div>

      <div className="text-xs font-mono text-[var(--ink-muted)] pt-0.5">
        Forensic Rationale: {q.rationale}
      </div>
    </div>
  );

  return (
    <section className="space-y-6">
      {/* Title and High-Level Context Header */}
      <div className="flex flex-wrap items-end justify-between gap-3 pb-3 border-b border-[var(--rule-strong)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--ink-primary)]">
            FAT Slot Forensics &amp; 2026 Prediction Workbench
          </h1>
          <p className="font-mono text-xs text-[var(--ink-muted)] mt-1 tabular-nums">
            3 Real Papers (C1 2-2 · C1 1-2 · C2+TC2 = 27 Questions) + F1 Slot (10 Questions) ·{' '}
            {stats.untestedCount} Overdue Gaps · {stats.partialCount} Partial · {stats.testedCount} Tested Anchors
          </p>
        </div>

        {/* Telemetry Pills */}
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
          <span className="px-2.5 py-1 rounded-[2px] bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20 font-bold tabular-nums">
            {stats.untestedCount} Untested Gaps
          </span>
          <span className="px-2.5 py-1 rounded-[2px] bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-bold tabular-nums">
            {stats.partialCount} Partial
          </span>
          <span className="px-2.5 py-1 rounded-[2px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-bold tabular-nums">
            {stats.testedCount} Tested Anchors
          </span>
        </div>
      </div>

      {/* 4 Lens Switcher Tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        {(
          [
            { id: 'matrix', label: '1. Topic Coverage Matrix (C1/C2/F1)', icon: Grid3X3 },
            { id: 'alpha', label: '2. Alpha F2 Model (Pure Complement S \\ Q_F1)', icon: Target },
            { id: 'beta', label: '3. Beta F2 Model (Empirical Shift Patterns)', icon: Compass },
            { id: 'gamma', label: '4. Gamma F2 Model (Arbitrated Consensus)', icon: Sparkles },
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

      {/* =========================================================================
          LENS 1: TOPIC COVERAGE MATRIX
         ========================================================================= */}
      {lens === 'matrix' && (
        <div className="space-y-4">
          {/* Controls Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 font-mono text-xs">
                {(
                  [
                    { id: 'all', label: `All (${matrix.length})` },
                    { id: 'untested', label: `Overdue Gaps (${stats.untestedCount})` },
                    { id: 'partial', label: `Partial (${stats.partialCount})` },
                    { id: 'tested', label: `Anchors (${stats.testedCount})` },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setStatusFilter(f.id)}
                    className={`px-2.5 py-1 rounded-[2px] border font-semibold ${
                      statusFilter === f.id
                        ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)]'
                        : 'bg-[var(--bg-sheet)] text-[var(--ink-secondary)] border-[var(--rule-hairline)] hover:bg-[var(--bg-recessed)]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Module Dropdown */}
              <div className="flex items-center gap-1 font-mono text-xs pl-2 border-l border-[var(--rule-hairline)]">
                <span className="text-[var(--ink-muted)]">Mod:</span>
                {['all', 'm1', 'm2', 'm3', 'm4', 'm5'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setModuleFilter(m)}
                    className={`px-2 py-0.5 rounded-[2px] uppercase ${
                      moduleFilter === m
                        ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] font-bold'
                        : 'text-[var(--ink-secondary)] hover:bg-[var(--bg-recessed)]'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" />
              <input
                type="text"
                placeholder="Search topics or gap details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1 text-xs font-mono rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-paper)] text-[var(--ink-primary)] focus:outline-none focus:border-[var(--ink-primary)]"
              />
            </div>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[2px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[var(--bg-recessed)] border-b border-[var(--rule-strong)] font-mono">
                  <th className="px-3 py-2.5 w-14">Mod</th>
                  <th className="px-2 py-2.5 w-10 text-center">#</th>
                  <th className="px-3 py-2.5">Syllabus Topic &amp; Weight</th>
                  <th className="px-3 py-2.5 whitespace-nowrap">
                    <div>C1 Set 2-2</div>
                    <div className="text-[10px] font-normal text-[var(--ink-muted)]">Sudhakaran · 4×10+4×15</div>
                  </th>
                  <th className="px-3 py-2.5 whitespace-nowrap">
                    <div>C1 Set 1-2</div>
                    <div className="text-[10px] font-normal text-[var(--ink-muted)]">7×10+2×15</div>
                  </th>
                  <th className="px-3 py-2.5 whitespace-nowrap">
                    <div>C2+TC2</div>
                    <div className="text-[10px] font-normal text-[var(--ink-muted)]">Linda Joseph · 10×10</div>
                  </th>
                  <th className="px-3 py-2.5 whitespace-nowrap">
                    <div>F1 Slot</div>
                    <div className="text-[10px] font-normal text-[var(--ink-muted)]">10×10 Real / Mock</div>
                  </th>
                  <th className="px-3 py-2.5 whitespace-nowrap">Status Signal</th>
                  <th className="px-3 py-2.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--rule-hairline)]">
                {filteredMatrix.map((row) => {
                  const isExpanded = expandedTopicId === row.topicId;

                  return (
                    <React.Fragment key={row.topicId}>
                      <tr
                        className={`hover:bg-[var(--bg-sheet)] transition-colors ${
                          isExpanded ? 'bg-[var(--bg-recessed)]/50' : ''
                        }`}
                      >
                        <td className="px-3 py-2.5 font-mono font-bold text-[var(--ink-primary)]">
                          {row.moduleCode}
                        </td>
                        <td className="px-2 py-2.5 font-mono text-[var(--ink-muted)] text-center tabular-nums">
                          {row.topicOrder}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onOpenTopicInSyllabus(row.moduleId, row.topicId)}
                              className="text-left font-semibold text-[var(--ink-primary)] hover:underline"
                            >
                              {row.topicTitle}
                            </button>
                            <span
                              className={`px-1.5 py-0.2 text-[9px] font-mono uppercase rounded-[2px] ${
                                row.fatWeight === 'Core'
                                  ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20'
                                  : row.fatWeight === 'Numerical / Diagram'
                                    ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20'
                                    : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                              }`}
                            >
                              {row.fatWeight}
                            </span>
                          </div>
                        </td>

                        {/* C1 2-2 */}
                        <td className="px-3 py-2.5 font-mono text-xs tabular-nums">
                          {row.c122Refs.length > 0 ? (
                            <span className="font-bold text-[var(--ink-primary)]">
                              {row.c122Refs.join(', ')}
                            </span>
                          ) : (
                            <span className="text-[var(--ink-muted)]">—</span>
                          )}
                        </td>

                        {/* C1 1-2 */}
                        <td className="px-3 py-2.5 font-mono text-xs tabular-nums">
                          {row.c112Refs.length > 0 ? (
                            <span className="font-bold text-[var(--ink-primary)]">
                              {row.c112Refs.join(', ')}
                            </span>
                          ) : (
                            <span className="text-[var(--ink-muted)]">—</span>
                          )}
                        </td>

                        {/* C2 */}
                        <td className="px-3 py-2.5 font-mono text-xs tabular-nums">
                          {row.c2Refs.length > 0 ? (
                            <span className="font-bold text-[var(--ink-primary)]">
                              {row.c2Refs.join(', ')}
                            </span>
                          ) : (
                            <span className="text-[var(--ink-muted)]">—</span>
                          )}
                        </td>

                        {/* F1 */}
                        <td className="px-3 py-2.5 font-mono text-xs tabular-nums">
                          {row.f1Refs.length > 0 ? (
                            <span className="font-bold text-[var(--div-m3)]">
                              {row.f1Refs.join(', ')}
                            </span>
                          ) : (
                            <span className="text-[var(--ink-muted)]">—</span>
                          )}
                        </td>

                        {/* Status Signal */}
                        <td className="px-3 py-2.5 font-mono font-bold whitespace-nowrap">
                          {row.status === 'untested' ? (
                            <span className="px-2 py-0.5 rounded-[2px] bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30">
                              OVERDUE GAP
                            </span>
                          ) : row.status === 'partial' ? (
                            <span className="px-2 py-0.5 rounded-[2px] bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                              PARTIAL
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-[2px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                              CORE ANCHOR
                            </span>
                          )}
                        </td>

                        {/* Expand Button */}
                        <td className="px-3 py-2.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => toggleTopicExpand(row.topicId)}
                            className="px-2.5 py-1 text-xs font-mono font-semibold rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-sheet)] hover:bg-[var(--bg-recessed)] inline-flex items-center gap-1"
                          >
                            <span>{isExpanded ? 'Hide' : 'Inspect'}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Topic Forensic Card */}
                      {isExpanded && (
                        <tr className="bg-[var(--bg-recessed)]/70">
                          <td colSpan={9} className="p-4 space-y-3.5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                              {/* Tested Detail */}
                              <div className="p-3 bg-[var(--bg-paper)] rounded-[2px] border border-[var(--rule-hairline)] space-y-1">
                                <div className="font-mono font-bold text-[10px] uppercase text-[var(--ink-muted)]">
                                  Tested Forensic History
                                </div>
                                <p className="text-[var(--ink-secondary)] leading-relaxed">
                                  {row.testedDetail}
                                </p>
                              </div>

                              {/* Untested Gap Analysis */}
                              <div className="p-3 bg-[var(--bg-paper)] rounded-[2px] border border-[var(--rule-hairline)] space-y-1">
                                <div className="font-mono font-bold text-[10px] uppercase text-red-600 dark:text-red-400">
                                  Untested Gap &amp; Next Slot Surprise Risk
                                </div>
                                <p className="text-[var(--ink-secondary)] leading-relaxed font-medium">
                                  {row.untestedGap}
                                </p>
                              </div>
                            </div>

                            {/* Likely Question Types */}
                            {row.likelyQuestionTypes.length > 0 && (
                              <div className="p-3 bg-[var(--bg-paper)] rounded-[2px] border border-[var(--rule-hairline)] space-y-1.5">
                                <div className="font-mono font-bold text-[10px] uppercase text-[var(--ink-muted)]">
                                  Examiner Archetypes (Likely Question Formats for Nov 2026)
                                </div>
                                <ul className="list-disc pl-4 space-y-1 text-xs text-[var(--ink-secondary)]">
                                  {row.likelyQuestionTypes.map((qType, i) => (
                                    <li key={i}>{qType}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Expandable Question Cards across C1, C2, F1 */}
                            {row.questionLinks.length > 0 && (
                              <div className="space-y-2 pt-1">
                                <div className="font-mono font-bold text-[11px] text-[var(--ink-primary)] flex items-center justify-between">
                                  <span>
                                    Past Slot Questions Linked to This Topic ({row.questionLinks.length})
                                  </span>
                                  <span className="text-[10px] font-normal text-[var(--ink-muted)]">
                                    Click any card to inspect full stem, sub-parts &amp; worked solutions
                                  </span>
                                </div>
                                <div className="space-y-2">
                                  {row.questionLinks.map((link) => (
                                    <ExpandableQuestionCard
                                      key={link.id}
                                      link={link}
                                      onOpenTopicInSyllabus={onOpenTopicInSyllabus}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          LENS 2: ALPHA F2 MODEL (PURE COMPLEMENT OF F1: S \ Q_F1)
         ========================================================================= */}
      {lens === 'alpha' &&
        renderPaperLens(
          'Alpha F2 Model — Pure Syllabus Complement (S \\ Q_F1)',
          'Complete 100M examination paper targeting untested syllabus hours (0 appearances in F1 slot)',
          'Alpha F2',
          ALPHA_F2_BLUEPRINT,
          <div className="p-4 bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] space-y-2 text-xs">
            <div className="font-mono font-bold text-[var(--ink-primary)] flex items-center gap-1.5">
              <Target className="w-4 h-4 text-red-500" />
              <span>Mathematical Complement Definition: S \ Q_F1</span>
            </div>
            <p className="text-[var(--ink-secondary)] leading-relaxed">
              Examiners writing consecutive or parallel slot papers (F1 ➔ F2) deliberately avoid testing
              the exact same algorithms to prevent student leaks between exam halls. The Alpha F2 paper targets
              the pure complement of topics tested in F1:
            </p>
            <div className="font-mono text-[11px] bg-[var(--bg-recessed)] p-2.5 rounded-[2px] border border-[var(--rule-hairline)] text-[var(--ink-primary)] overflow-x-auto whitespace-pre-wrap">
              S \ Q_F1 = &#123; m1-interrupts-dma (DMA cycle stealing), m2-process-operations (fork/exec/wait tree),
              m2-threads (Amdahl speedup), m3-hardware-sync (Bounded-waiting CAS), m3-classical-problems (Dining
              Philosophers asymmetric / Readers-Writers), m4-file-directories (DAG/Hard links), m4-file-allocation
              (Unix Inode multi-level math), m4-paging-tlb (Multi-level page tables &amp; EAT), m5-security-crypto
              (Buffer overflow &amp; RSA signatures), m5-protection-matrix (Access Matrix meta-rights),
              m5-virtualization (Type-1/Type-2 hypervisors &amp; Docker) &#125;
            </div>
          </div>
        )}

      {/* =========================================================================
          LENS 3: BETA F2 MODEL (EMPIRICAL SHIFT PATTERNS)
         ========================================================================= */}
      {lens === 'beta' && (
        <div className="space-y-6">
          {/* Empirical Shift Table */}
          <div className="space-y-3">
            <div className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[2px] p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 mb-1.5 rounded-[2px] font-mono text-[11px] font-bold bg-[var(--ink-primary)] text-[var(--bg-paper)] uppercase tracking-wider">
                  Lens 3 Forensics
                </div>
                <h2 className="text-xl font-bold text-[var(--ink-primary)]">
                  Empirical Shift Pattern Table (C1 ➔ C2 ➔ F1 ➔ Projected F2)
                </h2>
                <p className="text-xs sm:text-sm text-[var(--ink-secondary)] mt-0.5">
                  Tracks actual historical progression rules from C1 to C2 and applies them to F1 slot to forecast F2.
                </p>
              </div>
              <div className="font-mono text-xs font-bold px-3 py-1.5 rounded-[2px] bg-[var(--bg-recessed)] border border-[var(--rule-strong)] text-[var(--ink-primary)] tabular-nums">
                {C1_TO_C2_SHIFT_PATTERNS.length} Shift Rules Documented
              </div>
            </div>

            <div className="overflow-x-auto bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[2px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[var(--bg-recessed)] border-b border-[var(--rule-strong)] font-mono">
                    <th className="px-3 py-2.5">Domain</th>
                    <th className="px-3 py-2.5">Topic</th>
                    <th className="px-3 py-2.5">C1 Real Paper Tested</th>
                    <th className="px-3 py-2.5">C2 Real Paper Tested</th>
                    <th className="px-3 py-2.5">Mechanism</th>
                    <th className="px-3 py-2.5">Empirical Progression Rule</th>
                    <th className="px-3 py-2.5">F1 Baseline</th>
                    <th className="px-3 py-2.5 text-right">Beta F2 Projection</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--rule-hairline)]">
                  {C1_TO_C2_SHIFT_PATTERNS.map((pattern) => (
                    <tr key={pattern.id} className="hover:bg-[var(--bg-sheet)]">
                      <td className="px-3 py-2.5 font-mono font-bold text-[var(--ink-primary)] whitespace-nowrap">
                        {pattern.moduleLabel}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-[var(--ink-primary)] whitespace-nowrap">
                        {pattern.topicTitle}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[11px] text-[var(--ink-secondary)]">
                        {pattern.c1Asked}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[11px] text-[var(--ink-primary)] font-semibold">
                        {pattern.c2Asked}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap font-mono">
                        <span
                          className={`px-2 py-0.5 rounded-[2px] text-[10px] font-bold ${
                            pattern.mechanism === 'Sibling Rotation'
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                              : 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {pattern.mechanism}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-[var(--ink-secondary)] leading-relaxed">
                        {pattern.empiricalRule}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[11px] text-[var(--div-m3)]">
                        {pattern.f1Baseline}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[11px] font-bold text-[var(--ink-primary)] text-right">
                        {pattern.betaF2Projection}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Render Beta F2 100M Paper */}
          {renderPaperLens(
            'Beta F2 Model — Empirical Shift Pattern Paper',
            'Rotates parameters/algorithms based on C1 ➔ C2 progression applied to F1 (7×10M + 2×15M = 100M)',
            'Beta F2',
            BETA_F2_BLUEPRINT
          )}
        </div>
      )}

      {/* =========================================================================
          LENS 4: GAMMA F2 MODEL (ARBITRATED CONSENSUS SYNTHESIS)
         ========================================================================= */}
      {lens === 'gamma' && (
        <div className="space-y-6">
          {/* Arbitration Synthesis Matrix Table */}
          <div className="space-y-3">
            <div className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[2px] p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 mb-1.5 rounded-[2px] font-mono text-[11px] font-bold bg-[var(--ink-primary)] text-[var(--bg-paper)] uppercase tracking-wider">
                  Lens 4 Ensemble
                </div>
                <h2 className="text-xl font-bold text-[var(--ink-primary)]">
                  Arbitrated Consensus Synthesis Matrix (Alpha ∩ Beta Arbitration)
                </h2>
                <p className="text-xs sm:text-sm text-[var(--ink-secondary)] mt-0.5">
                  Cross-model arbitration balancing guaranteed recurring anchors (55M) with overdue syllabus gaps (45M).
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                <span className="px-2.5 py-1 rounded-[2px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-bold tabular-nums">
                  {stats.gammaUnanimousCount} Unanimous Locks (95%+)
                </span>
                <span className="px-2.5 py-1 rounded-[2px] bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-bold tabular-nums">
                  Consensus + Splits (92%+)
                </span>
                <span className="px-2.5 py-1 rounded-[2px] bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 font-bold tabular-nums">
                  Arbitrated Anchors (90%+)
                </span>
              </div>
            </div>

            <div className="overflow-x-auto bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[2px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[var(--bg-recessed)] border-b border-[var(--rule-strong)] font-mono">
                    <th className="px-3 py-2.5 w-12">QNo</th>
                    <th className="px-2 py-2.5 w-14">Marks</th>
                    <th className="px-3 py-2.5 w-14">Mod</th>
                    <th className="px-3 py-2.5">Alpha Model Pick (Gap)</th>
                    <th className="px-3 py-2.5">Beta Model Pick (Shift)</th>
                    <th className="px-3 py-2.5">Consensus Type</th>
                    <th className="px-2 py-2.5 text-center">Conf</th>
                    <th className="px-3 py-2.5 text-right">Gamma Arbitrated Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--rule-hairline)]">
                  {GAMMA_SYNTHESIS_ROWS.map((row) => (
                    <tr key={row.id} className="hover:bg-[var(--bg-sheet)]">
                      <td className="px-3 py-2.5 font-mono font-bold text-[var(--ink-primary)]">
                        {row.qNo}
                      </td>
                      <td className="px-2 py-2.5 font-mono text-[var(--ink-muted)] tabular-nums">
                        {row.marks}M
                      </td>
                      <td className="px-3 py-2.5 font-mono font-bold text-[var(--ink-primary)] uppercase">
                        {row.moduleId}
                      </td>
                      <td className="px-3 py-2.5 text-[var(--ink-secondary)] leading-relaxed">
                        {row.alphaPick}
                      </td>
                      <td className="px-3 py-2.5 text-[var(--ink-secondary)] leading-relaxed">
                        {row.betaPick}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap font-mono">
                        <span
                          className={`px-2 py-0.5 rounded-[2px] text-[10px] font-bold border ${
                            GAMMA_BADGE_STYLE[row.consensusType].bg
                          } ${GAMMA_BADGE_STYLE[row.consensusType].text} ${
                            GAMMA_BADGE_STYLE[row.consensusType].border
                          }`}
                        >
                          {row.consensusType}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 font-mono font-bold text-center tabular-nums text-[var(--ink-primary)]">
                        {row.confidencePct}%
                      </td>
                      <td className="px-3 py-2.5 text-right text-[var(--ink-primary)] font-medium leading-relaxed">
                        {row.gammaDecision}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Render Gamma F2 100M Paper */}
          {renderPaperLens(
            'Gamma F2 Model — Consensus Synthesized Paper',
            'Ensemble consensus paper: 55M guaranteed VIT anchors + 45M overdue File Systems & Security gaps (7×10M + 2×15M = 100M)',
            'Gamma F2',
            GAMMA_F2_BLUEPRINT
          )}
        </div>
      )}
    </section>
  );
};
