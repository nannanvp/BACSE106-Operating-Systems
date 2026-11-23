import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Maximize2,
  Search,
  Sparkles,
  X,
  XCircle,
} from 'lucide-react';
import { MODULES } from '../data/courseData';
import { TopicNote } from '../data/noteTypes';
import { COURSE_ATTACHED_FILES, MODULE_STUDY_PACKS } from '../data/professorMaterials';
import { ALL_TOPIC_NOTES, TOPIC_NOTES_BY_ID } from '../data/topicNotes';
import { WeakTopicSource } from '../utils/weakTopicsEngine';
import { ConceptDiagram } from './diagrams/ConceptDiagrams';
import { MarkdownBlock } from './MarkdownBlock';

interface SyllabusViewProps {
  activeModuleId: 'm1' | 'm2' | 'm3' | 'm4' | 'm5';
  focusedTopicId: string | null;
  masteredTopicIds: string[];
  onSelectModule: (moduleId: 'm1' | 'm2' | 'm3' | 'm4' | 'm5') => void;
  onToggleMastered: (topicId: string, rect?: { x: number; y: number }, accentHex?: string) => void;
  onLogWeakTopic: (payload: {
    topicId: string;
    moduleId: string;
    topicTitle: string;
    source: WeakTopicSource;
  }) => void;
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderHighlightedSnippet(text: string, query: string): React.ReactNode {
  const q = query.trim();
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  const start = Math.max(0, idx - 60);
  const slice = (start > 0 ? '…' : '') + text.slice(start, start + 180) + (start + 180 < text.length ? '…' : '');
  const parts = slice.split(new RegExp(`(${escapeRegExp(q)})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === q.toLowerCase() ? (
      <mark key={i} className="manual-mark">
        {part}
      </mark>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
}

export const SyllabusView: React.FC<SyllabusViewProps> = ({
  activeModuleId,
  focusedTopicId,
  masteredTopicIds,
  onSelectModule,
  onToggleMastered,
  onLogWeakTopic,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState<string>(
    () => focusedTopicId ?? MODULES.find((m) => m.id === activeModuleId)?.topics[0]?.id ?? 'm1-os-fundamentals'
  );
  const [readerOpen, setReaderOpen] = useState(false);
  const [selfCheckAnswers, setSelfCheckAnswers] = useState<Record<string, number>>({});
  const [missedChecks, setMissedChecks] = useState<Array<{ topicId: string; topicTitle: string; checkId: string }>>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const masteredSet = useMemo(() => new Set(masteredTopicIds), [masteredTopicIds]);
  const activeModule = useMemo(
    () => MODULES.find((m) => m.id === activeModuleId) ?? MODULES[0],
    [activeModuleId]
  );

  useEffect(() => {
    if (focusedTopicId && TOPIC_NOTES_BY_ID[focusedTopicId]) {
      setSelectedTopicId(focusedTopicId);
    }
  }, [focusedTopicId]);

  useEffect(() => {
    const modTopics = activeModule.topics.map((t) => t.id);
    if (!modTopics.includes(selectedTopicId)) {
      setSelectedTopicId(modTopics[0]);
    }
  }, [activeModule, selectedTopicId]);

  // Keyboard shortcuts: `/` focuses search, `Escape` closes reader
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inInput = target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      if (e.key === '/' && !inInput && !readerOpen) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape' && readerOpen) {
        e.preventDefault();
        setReaderOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [readerOpen]);

  // Deep Search across all 26 topics
  const searchHits = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    const results: Array<{ note: TopicNote; snippet: string }> = [];
    for (const note of ALL_TOPIC_NOTES) {
      const haystackParts = [
        note.title,
        note.summary,
        ...note.keyPoints,
        ...note.sections.map((s) => `${s.heading} ${s.body}`),
        note.workedExample.problem,
        note.workedExample.solution,
        note.examTip,
      ];
      const matchStr = haystackParts.find((p) => p.toLowerCase().includes(q));
      if (matchStr) {
        results.push({ note, snippet: matchStr });
      }
    }
    return results;
  }, [searchQuery]);

  const currentNote: TopicNote =
    TOPIC_NOTES_BY_ID[selectedTopicId] ?? TOPIC_NOTES_BY_ID[activeModule.topics[0].id];
  const currentTopicMeta = activeModule.topics.find((t) => t.id === currentNote.topicId);
  const currentTopicIdx = activeModule.topics.findIndex((t) => t.id === currentNote.topicId);
  const studyPack = MODULE_STUDY_PACKS[activeModule.id];
  const isMastered = masteredSet.has(currentNote.topicId);

  const handleSelfCheck = (checkId: string, chosenIdx: number, correctIdx: number) => {
    if (selfCheckAnswers[checkId] !== undefined) return;
    setSelfCheckAnswers((prev) => ({ ...prev, [checkId]: chosenIdx }));
    if (chosenIdx !== correctIdx) {
      setMissedChecks((prev) =>
        prev.some((x) => x.checkId === checkId)
          ? prev
          : [...prev, { topicId: currentNote.topicId, topicTitle: currentNote.title, checkId }]
      );
      onLogWeakTopic({
        topicId: currentNote.topicId,
        moduleId: currentNote.moduleId,
        topicTitle: currentNote.title,
        source: 'self-check',
      });
    }
  };

  const renderNoteBody = (note: TopicNote) => (
    <div className="space-y-6">
      {/* Summary + Key Points */}
      <div className="p-4 sm:p-5 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px] space-y-3">
        <div className="prose-manual">
          <MarkdownBlock content={note.summary} />
        </div>
        <div className="pt-2 border-t border-[var(--rule-hairline)]">
          <div className="font-mono text-xs font-bold text-[var(--ink-muted)] mb-2">
            High-Yield Exam Takeaways ({note.sourceDecks.join(' · ')})
          </div>
          <ul className="space-y-1.5 text-sm text-[var(--ink-primary)] list-disc pl-5">
            {note.keyPoints.map((kp) => (
              <li key={kp}>
                <MarkdownBlock content={kp} />
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Sections with Diagrams, Tables & Code */}
      {note.sections.map((sec) => (
        <article key={sec.heading} className="space-y-3">
          <h3 className="text-lg font-bold text-[var(--ink-primary)] pb-1 border-b border-[var(--rule-hairline)]">
            {sec.heading}
          </h3>
          <div className="prose-manual">
            <MarkdownBlock content={sec.body} />
          </div>
          {sec.diagramId && <ConceptDiagram diagramId={sec.diagramId} />}
          {sec.table && (
            <div className="overflow-x-auto border border-[var(--rule-hairline)] rounded-[2px]">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[var(--bg-recessed)] border-b border-[var(--rule-strong)]">
                    {sec.table.headers.map((h) => (
                      <th key={h} className="px-3 py-2 font-mono font-bold text-[var(--ink-primary)]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--rule-hairline)] bg-[var(--bg-paper)]">
                  {sec.table.rows.map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell, ci) => (
                        <td
                          key={ci}
                          className={`px-3 py-2 align-top text-[var(--ink-secondary)] ${
                            ci === 0 ? 'font-semibold text-[var(--ink-primary)]' : ''
                          }`}
                        >
                          <MarkdownBlock content={cell} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {sec.codeBlock && (
            <pre className="p-3.5 bg-[var(--bg-recessed)] border border-[var(--rule-hairline)] rounded-[2px] overflow-x-auto text-xs font-mono text-[var(--ink-primary)] leading-relaxed">
              <code>{sec.codeBlock}</code>
            </pre>
          )}
        </article>
      ))}

      {/* Worked Example */}
      <div className="p-4 sm:p-5 bg-[var(--bg-sheet)] border border-[var(--rule-strong)] rounded-[2px] space-y-2.5">
        <h3 className="text-base font-bold text-[var(--ink-primary)]">
          Worked Example · {note.workedExample.title}
        </h3>
        <div className="text-sm text-[var(--ink-secondary)] pb-2 border-b border-[var(--rule-hairline)]">
          <MarkdownBlock content={note.workedExample.problem} />
        </div>
        <div className="prose-manual text-sm sm:text-base">
          <MarkdownBlock content={note.workedExample.solution} />
        </div>
      </div>

      {/* Real VIT FAT Question Methods */}
      {note.fatQuestionMethods.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base font-bold text-[var(--ink-primary)]">
            FAT Paper Solved Methods ({note.fatQuestionMethods.length})
          </h3>
          {note.fatQuestionMethods.map((m) => (
            <div
              key={m.paperSource}
              className="p-4 bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] space-y-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
                <span className="font-bold text-[var(--ink-primary)]">{m.paperSource}</span>
                <span className="text-[var(--ink-muted)]">{m.markBreakdown}</span>
              </div>
              <p className="text-sm font-medium text-[var(--ink-secondary)]">{m.promptSummary}</p>
              <ol className="list-decimal pl-5 space-y-1 text-sm text-[var(--ink-primary)]">
                {m.solutionSteps.map((step, i) => (
                  <li key={i}>
                    <MarkdownBlock content={step} />
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}

      {/* Examiner Tip */}
      <div className="p-4 bg-[var(--bg-recessed)] border border-[var(--rule-strong)] rounded-[2px]">
        <div className="font-mono text-xs font-bold text-[var(--div-danger)] mb-1">
          Examiner Scoring Tip
        </div>
        <div className="text-sm text-[var(--ink-primary)]">
          <MarkdownBlock content={note.examTip} />
        </div>
      </div>

      {/* Inline Self-Checks */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-[var(--ink-primary)]">
          Topic Self-Check ({note.selfChecks.length} Questions)
        </h3>
        {note.selfChecks.map((sc, sIdx) => {
          const chosen = selfCheckAnswers[sc.id];
          const answered = chosen !== undefined;
          return (
            <div
              key={sc.id}
              className="p-4 bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] space-y-3"
            >
              <div className="text-sm font-semibold text-[var(--ink-primary)]">
                <span className="font-mono text-xs text-[var(--ink-muted)] mr-2">
                  Check {sIdx + 1}:
                </span>
                <MarkdownBlock content={sc.question} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sc.options.map((opt, oi) => {
                  let cls =
                    'border-[var(--rule-hairline)] bg-[var(--bg-sheet)] hover:bg-[var(--bg-recessed)]';
                  if (answered) {
                    if (oi === sc.correctIndex) cls = 'border-[var(--div-m3)] bg-[var(--div-m3)]/15';
                    else if (oi === chosen) cls = 'border-[var(--div-danger)] bg-[var(--div-danger)]/15';
                    else cls = 'border-[var(--rule-hairline)] bg-[var(--bg-sheet)] opacity-60';
                  }
                  return (
                    <button
                      key={oi}
                      type="button"
                      disabled={answered}
                      onClick={() => handleSelfCheck(sc.id, oi, sc.correctIndex)}
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
                <div className="text-xs text-[var(--ink-secondary)] pt-1 flex items-start gap-1.5">
                  {chosen === sc.correctIndex ? (
                    <CheckCircle2 className="w-4 h-4 text-[var(--div-m3)] shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-[var(--div-danger)] shrink-0 mt-0.5" />
                  )}
                  <MarkdownBlock content={sc.explanation} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <section className="space-y-5">
      {/* Header + Search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-3 border-b border-[var(--rule-strong)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--ink-primary)]">
            Syllabus Reference Manual (M1 – M5 · 26 Topics)
          </h1>
          <p className="font-mono text-xs text-[var(--ink-muted)] mt-1 tabular-nums">
            {masteredTopicIds.length}/26 Topics Mastered · Press <kbd className="px-1 border border-[var(--rule-hairline)] rounded-[2px]">/</kbd> to deep-search notes, worked examples &amp; tips
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[var(--ink-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Deep search syllabus (e.g., inode, TLB, banker)..."
            className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[2px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Deep Search Hit List */}
      {searchQuery.trim().length >= 2 && (
        <div className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[2px] p-4 space-y-2.5">
          <div className="font-mono text-xs font-bold text-[var(--ink-muted)]">
            {searchHits.length} matching topic{searchHits.length === 1 ? '' : 's'} for &ldquo;
            {searchQuery.trim()}&rdquo;
          </div>
          {searchHits.length === 0 ? (
            <p className="text-sm text-[var(--ink-secondary)]">
              No syllabus notes matched that query. Try a keyword like &ldquo;Peterson&rdquo;,
              &ldquo;RAID&rdquo;, &ldquo;Thrashing&rdquo;, or &ldquo;Belady&rdquo;.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {searchHits.slice(0, 8).map(({ note, snippet }) => (
                <button
                  key={note.topicId}
                  type="button"
                  onClick={() => {
                    onSelectModule(note.moduleId as 'm1' | 'm2' | 'm3' | 'm4' | 'm5');
                    setSelectedTopicId(note.topicId);
                    setSearchQuery('');
                  }}
                  className="text-left p-2.5 rounded-[2px] bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] hover:border-[var(--rule-strong)]"
                >
                  <div className="font-mono text-[11px] font-bold text-[var(--ink-muted)] uppercase">
                    {note.moduleId} · {note.title}
                  </div>
                  <div className="text-xs text-[var(--ink-secondary)] mt-1 line-clamp-2">
                    {renderHighlightedSnippet(snippet, searchQuery)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Missed Self-Check Banner */}
      {missedChecks.length > 0 && (
        <div className="p-3 bg-[var(--bg-recessed)] border border-[var(--div-danger)] rounded-[2px] flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--ink-primary)]">
            <AlertTriangle className="w-4 h-4 text-[var(--div-danger)]" />
            {missedChecks.length} missed self-check{missedChecks.length === 1 ? '' : 's'} logged
            to Weak Topics Queue.
          </span>
          <button
            type="button"
            onClick={() => setMissedChecks([])}
            className="font-mono text-[11px] underline text-[var(--ink-secondary)]"
          >
            Dismiss banner
          </button>
        </div>
      )}

      {/* Module Selector Tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        {MODULES.map((mod) => {
          const active = mod.id === activeModule.id;
          const modMastered = mod.topics.filter((t) => masteredSet.has(t.id)).length;
          return (
            <button
              key={mod.id}
              type="button"
              onClick={() => onSelectModule(mod.id)}
              className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-[2px] border transition-colors tabular-nums ${
                active
                  ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)]'
                  : 'bg-[var(--bg-paper)] text-[var(--ink-secondary)] border-[var(--rule-hairline)] hover:bg-[var(--bg-recessed)]'
              }`}
            >
              {mod.code} · {mod.shortTitle} ({modMastered}/{mod.topics.length})
            </button>
          );
        })}
      </div>

      {/* Main 12-Col Split: Topic Rail + Study Pack | Active Topic Manual */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <aside className="lg:col-span-4 space-y-4">
          <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] overflow-hidden">
            <div className="px-3.5 py-2.5 bg-[var(--bg-board)] border-b border-[var(--rule-hairline)]">
              <div className="font-mono text-xs font-bold text-[var(--ink-primary)]">
                {activeModule.code}: {activeModule.title}
              </div>
              <div className="font-mono text-[11px] text-[var(--ink-muted)] tabular-nums">
                {activeModule.hours}h · {activeModule.co} · {activeModule.weightPct}% Weight
              </div>
            </div>
            <div className="divide-y divide-[var(--rule-hairline)]">
              {activeModule.topics.map((t) => {
                const selected = t.id === currentNote.topicId;
                const done = masteredSet.has(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTopicId(t.id)}
                    className={`w-full text-left px-3.5 py-2.5 transition-colors flex items-start justify-between gap-2 ${
                      selected
                        ? 'bg-[var(--bg-recessed)] font-bold text-[var(--ink-primary)]'
                        : 'hover:bg-[var(--bg-sheet)] text-[var(--ink-secondary)]'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs sm:text-sm leading-snug">{t.title}</div>
                      <div className="font-mono text-[10px] text-[var(--ink-muted)]">
                        {t.silberschatzRef} · {t.fatFrequency}
                      </div>
                    </div>
                    {done && <CheckCircle2 className="w-4 h-4 text-[var(--div-m3)] shrink-0 mt-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Course Artifacts & Silberschatz Pack */}
          {studyPack && (
            <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-3.5 space-y-2.5">
              <div className="font-mono text-xs font-bold text-[var(--ink-primary)]">
                {activeModule.code} Course Resource Pack
              </div>
              <div className="space-y-1 text-xs text-[var(--ink-secondary)]">
                {studyPack.silberschatzChapters.map((ch) => (
                  <div key={ch}>· {ch}</div>
                ))}
              </div>
              <div className="pt-2 border-t border-[var(--rule-hairline)] space-y-1">
                {COURSE_ATTACHED_FILES.filter((f) => f.href && f.kind !== 'past-paper').map((f) => (
                  <a
                    key={f.id}
                    href={f.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-2 px-2 py-1.5 text-xs font-mono rounded-[2px] bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] text-[var(--ink-primary)] hover:bg-[var(--bg-recessed)]"
                  >
                    <span className="truncate">{f.label}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Active Topic Note Plate */}
        <div className="lg:col-span-8 bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[2px] p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[var(--rule-strong)]">
            <div>
              <div className="font-mono text-xs text-[var(--ink-muted)]">
                {activeModule.code} · {currentTopicMeta?.silberschatzRef} ·{' '}
                {currentTopicMeta?.fatFrequency}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--ink-primary)] mt-1">
                {currentNote.title}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  onToggleMastered(
                    currentNote.topicId,
                    { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
                    activeModule.accentHex
                  );
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-[2px] border inline-flex items-center gap-1.5 transition-colors ${
                  isMastered
                    ? 'bg-[var(--div-m3)] text-white border-[var(--div-m3)]'
                    : 'bg-[var(--bg-sheet)] text-[var(--ink-primary)] border-[var(--rule-strong)] hover:bg-[var(--bg-recessed)]'
                }`}
              >
                {isMastered ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Mastered
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" /> Mark Mastered
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setReaderOpen(true)}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-sheet)] text-[var(--ink-primary)] hover:bg-[var(--bg-recessed)] inline-flex items-center gap-1"
              >
                <Maximize2 className="w-3.5 h-3.5" /> Reader
              </button>
            </div>
          </div>

          {renderNoteBody(currentNote)}

          {/* Prev / Next Topic Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-[var(--rule-hairline)]">
            <button
              type="button"
              disabled={currentTopicIdx <= 0}
              onClick={() => setSelectedTopicId(activeModule.topics[currentTopicIdx - 1].id)}
              className="px-3 py-1.5 text-xs font-semibold rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-sheet)] text-[var(--ink-primary)] disabled:opacity-40 inline-flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prev Topic
            </button>
            <span className="font-mono text-xs text-[var(--ink-muted)] tabular-nums">
              Topic {currentTopicIdx + 1} of {activeModule.topics.length}
            </span>
            <button
              type="button"
              disabled={currentTopicIdx >= activeModule.topics.length - 1}
              onClick={() => setSelectedTopicId(activeModule.topics[currentTopicIdx + 1].id)}
              className="px-3 py-1.5 text-xs font-semibold rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-sheet)] text-[var(--ink-primary)] disabled:opacity-40 inline-flex items-center gap-1"
            >
              Next Topic <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Full-Screen Reader Overlay */}
      {readerOpen && (
        <div
          className="fixed inset-0 z-50 bg-[var(--bg-sheet)] overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Full-screen syllabus reader"
        >
          <div className="sticky top-0 z-10 bg-[var(--bg-board)] border-b border-[var(--rule-strong)] px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[var(--ink-primary)]" />
              <span className="font-bold text-sm text-[var(--ink-primary)]">
                {activeModule.code} · {currentNote.title}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentTopicIdx <= 0}
                onClick={() => setSelectedTopicId(activeModule.topics[currentTopicIdx - 1].id)}
                className="px-2.5 py-1 text-xs font-mono rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-paper)] text-[var(--ink-primary)] disabled:opacity-40"
              >
                ← Prev
              </button>
              <button
                type="button"
                disabled={currentTopicIdx >= activeModule.topics.length - 1}
                onClick={() => setSelectedTopicId(activeModule.topics[currentTopicIdx + 1].id)}
                className="px-2.5 py-1 text-xs font-mono rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-paper)] text-[var(--ink-primary)] disabled:opacity-40"
              >
                Next →
              </button>
              <button
                type="button"
                onClick={() => setReaderOpen(false)}
                className="px-2.5 py-1 text-xs font-mono font-semibold rounded-[2px] border border-[var(--ink-primary)] bg-[var(--ink-primary)] text-[var(--bg-paper)] inline-flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Close (Esc)
              </button>
            </div>
          </div>

          <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8">{renderNoteBody(currentNote)}</div>
        </div>
      )}
    </section>
  );
};
