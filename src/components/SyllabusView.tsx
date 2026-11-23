import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  HelpCircle,
  Maximize2,
  Minimize2,
  RotateCcw,
  Search,
  Sparkles,
  X,
  XCircle,
} from 'lucide-react';
import { MODULES, SyllabusTopicMeta, ModuleMeta } from '../data/courseData';
import { TopicNote, DiagramId } from '../data/noteTypes';
import { ALL_TOPIC_NOTES, TOPIC_NOTES_BY_ID } from '../data/topicNotes';
import { WeakTopicSource } from '../utils/weakTopicsEngine';
import { ConceptDiagram } from './diagrams/ConceptDiagrams';
import { MarkdownBlock } from './MarkdownBlock';

export interface SyllabusViewProps {
  activeModuleId: 'm1' | 'm2' | 'm3' | 'm4' | 'm5';
  focusedTopicId?: string | null;
  masteredTopicIds: string[];
  onSelectModule: (moduleId: 'm1' | 'm2' | 'm3' | 'm4' | 'm5') => void;
  onToggleMastered: (topicId: string, rect?: { x: number; y: number }, accentHex?: string) => void;
  onLogWeakTopic?: (payload: {
    topicId: string;
    moduleId: string;
    topicTitle: string;
    source: WeakTopicSource;
  }) => void;
  onNavigateToLab?: (labTabId: string) => void;
  openMissedQueueSignal?: number;
}

export const TOPIC_BLOOM_LEVELS: Record<string, string> = {
  // Module 1: OS Structure & Architecture
  'm1-basics-history': 'K2 (Understand)',
  'm1-os-structures': 'K3 (Apply)',
  'm1-syscalls-services': 'K3 (Apply)',
  'm1-interrupts-dma': 'K2 (Understand)',
  'm1-design-booting': 'K2 (Understand)',

  // Module 2: Processes, Scheduling & Deadlocks
  'm2-process-pcb': 'K2 (Understand)',
  'm2-process-operations': 'K3 (Apply)',
  'm2-threads': 'K3 (Apply)',
  'm2-nonpreemptive-scheduling': 'K3 (Apply)',
  'm2-preemptive-scheduling': 'K3 (Apply)',
  'm2-deadlock-rag': 'K3 (Apply)',
  'm2-deadlock-handling': 'K4 (Analyze)',

  // Module 3: Process Synchronization
  'm3-ipc': 'K3 (Apply)',
  'm3-critical-section-peterson': 'K4 (Analyze)',
  'm3-hardware-sync': 'K3 (Apply)',
  'm3-mutex-semaphores': 'K3 (Apply)',
  'm3-classical-problems': 'K4 (Analyze)',
  'm3-monitors': 'K3 (Apply)',

  // Module 4: Memory & Storage
  'm4-contiguous-allocation': 'K3 (Apply)',
  'm4-paging-tlb': 'K5 (Evaluate)',
  'm4-virtual-memory': 'K3 (Apply)',
  'm4-page-replacement': 'K3 (Apply)',
  'm4-thrashing-ws': 'K4 (Analyze)',
  'm4-file-directories': 'K2 (Understand)',
  'm4-file-allocation': 'K3 (Apply)',

  // Module 5: Devices, Security & Virtualization
  'm5-disk-scheduling': 'K3 (Apply)',
  'm5-raid': 'K3 (Apply)',
  'm5-security-crypto': 'K2 (Understand)',
  'm5-protection-matrix': 'K3 (Apply)',
  'm5-virtualization': 'K2 (Understand)',
};

const MODULE_DIVISION_PALETTE: Record<
  'm1' | 'm2' | 'm3' | 'm4' | 'm5',
  { hex: string; ink: string; name: string; number: number }
> = {
  m1: { hex: '#E5B82E', ink: '#1C1B18', name: 'DIV 01 · OS STRUCTURE & ARCHITECTURE', number: 1 },
  m2: { hex: '#E06D2B', ink: '#1C1B18', name: 'DIV 02 · PROCESSES, SCHEDULING & DEADLOCKS', number: 2 },
  m3: { hex: '#4F8A3D', ink: '#FAF7F0', name: 'DIV 03 · SYNCHRONIZATION & CONCURRENCY', number: 3 },
  m4: { hex: '#147E7B', ink: '#FAF7F0', name: 'DIV 04 · MEMORY, PAGING & STORAGE', number: 4 },
  m5: { hex: '#22559C', ink: '#FAF7F0', name: 'DIV 05 · DISK, SECURITY & VIRTUALIZATION', number: 5 },
};

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderInlineMarkup(text: string, depth = 0): React.ReactNode {
  const tokenRegex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|<u>[^<]+<\/u>)/g;
  const parts = text.split(tokenRegex);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-bold text-[var(--ink-primary,#1C1B18)]">
          {depth < 2 ? renderInlineMarkup(part.slice(2, -2), depth + 1) : part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={idx} className="italic text-[var(--ink-secondary,#434038)]">
          {depth < 2 ? renderInlineMarkup(part.slice(1, -1), depth + 1) : part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={idx}
          className="font-mono text-[0.86em] bg-[var(--surface-board,#EAE4D7)] text-[var(--ink-primary,#1C1B18)] px-1.5 py-0.5 rounded-[2px] border border-[var(--rule-hairline,#C5BEB0)] break-words"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('<u>') && part.endsWith('</u>') && part.length > 7) {
      return (
        <span
          key={idx}
          className="underline decoration-[#E06D2B] decoration-2 underline-offset-3 font-semibold text-[var(--ink-primary,#1C1B18)]"
        >
          {depth < 2 ? renderInlineMarkup(part.slice(3, -4), depth + 1) : part.slice(3, -4)}
        </span>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

function renderHighlightedText(text: string, query: string): React.ReactNode {
  const trimmed = query.trim();
  if (!trimmed) return text;
  const regex = new RegExp(`(${escapeRegExp(trimmed)})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, idx) =>
    part.toLowerCase() === trimmed.toLowerCase() ? (
      <mark
        key={idx}
        className="bg-[#E5B82E] text-[#1C1B18] px-0.5 rounded-[2px] font-semibold"
      >
        {part}
      </mark>
    ) : (
      <React.Fragment key={idx}>{part}</React.Fragment>
    )
  );
}

function extractMatchSnippet(text: string, query: string, radius = 70): string {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, radius * 2);
  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + query.length + radius);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < text.length ? '…' : '';
  return `${prefix}${text.slice(start, end).replace(/\s+/g, ' ').trim()}${suffix}`;
}

export const SyllabusView: React.FC<SyllabusViewProps> = ({
  activeModuleId,
  focusedTopicId,
  masteredTopicIds,
  onSelectModule,
  onToggleMastered,
  onLogWeakTopic,
  onNavigateToLab,
  openMissedQueueSignal = 0,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeHighlightTerm, setActiveHighlightTerm] = useState('');
  const [showMissedQueue, setShowMissedQueue] = useState(false);
  const [expandedTopicIds, setExpandedTopicIds] = useState<string[]>(['m1-basics-history']);
  const [fullScreenTopicId, setFullScreenTopicId] = useState<string | null>(null);
  const [selfCheckAnswers, setSelfCheckAnswers] = useState<Record<string, number>>({});
  const [missedChecks, setMissedChecks] = useState<
    Array<{ topicId: string; topicTitle: string; checkId: string; moduleId: string }>
  >([]);
  const [recentlyMasteredId, setRecentlyMasteredId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const popTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (popTimerRef.current !== null) window.clearTimeout(popTimerRef.current);
    };
  }, []);

  const masteredSet = useMemo(() => new Set(masteredTopicIds), [masteredTopicIds]);
  const expandedSet = useMemo(() => new Set(expandedTopicIds), [expandedTopicIds]);

  const activeModule: ModuleMeta = useMemo(
    () => MODULES.find((m) => m.id === activeModuleId) ?? MODULES[0],
    [activeModuleId]
  );

  const activePalette = MODULE_DIVISION_PALETTE[activeModule.id];
  const activeModuleNumber = activePalette.number;
  const moduleMasteredCount = activeModule.topics.filter((t) => masteredSet.has(t.id)).length;
  const allModuleTopicsExpanded = activeModule.topics.every((t) => expandedSet.has(t.id));
  const totalSyllabusTopics = useMemo(
    () => MODULES.reduce((sum, m) => sum + m.topics.length, 0),
    []
  );

  // Focus & expand specific topic when requested from other views
  useEffect(() => {
    if (!focusedTopicId) return;
    setSearchQuery('');
    setShowMissedQueue(false);
    setExpandedTopicIds((prev) =>
      prev.includes(focusedTopicId) ? prev : [...prev, focusedTopicId]
    );
    window.requestAnimationFrame(() => {
      const el = document.getElementById(`topic-card-${focusedTopicId}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [focusedTopicId]);

  // Open missed queue when requested via signal
  useEffect(() => {
    if (openMissedQueueSignal > 0) {
      setSearchQuery('');
      setShowMissedQueue(true);
    }
  }, [openMissedQueueSignal]);

  // Keyboard shortcut: '/' focuses search, Escape closes full screen reader
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      if (e.key === '/' && !inInput && !fullScreenTopicId) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape' && fullScreenTopicId) {
        e.preventDefault();
        setFullScreenTopicId(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [fullScreenTopicId]);

  // Lock body scroll while full screen reader is open
  useEffect(() => {
    if (!fullScreenTopicId) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [fullScreenTopicId]);

  // Deep search across all 30 syllabus topics
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) return null;

    return MODULES.flatMap((mod) =>
      mod.topics.flatMap((t) => {
        const note = TOPIC_NOTES_BY_ID[t.id];
        const jumpTargets: Array<{ label: string; anchorId: string; snippet: string }> = [];

        if (
          t.title.toLowerCase().includes(q) ||
          t.silberschatzRef.toLowerCase().includes(q) ||
          mod.title.toLowerCase().includes(q)
        ) {
          jumpTargets.push({
            label: 'Topic Overview',
            anchorId: `topic-card-${t.id}`,
            snippet: extractMatchSnippet(`${t.title} — ${t.silberschatzRef}`, q),
          });
        }

        if (note) {
          if (note.summary.toLowerCase().includes(q)) {
            jumpTargets.push({
              label: 'Executive Summary',
              anchorId: `topic-card-${t.id}`,
              snippet: extractMatchSnippet(note.summary, q),
            });
          }
          note.keyPoints.forEach((kp, idx) => {
            if (kp.toLowerCase().includes(q)) {
              jumpTargets.push({
                label: `Key Point ${idx + 1}`,
                anchorId: `topic-card-${t.id}`,
                snippet: extractMatchSnippet(kp, q),
              });
            }
          });
          note.sections.forEach((sec, sIdx) => {
            const combined = `${sec.heading} ${sec.body} ${sec.codeBlock ?? ''} ${
              sec.table?.rows.flat().join(' ') ?? ''
            }`;
            if (combined.toLowerCase().includes(q)) {
              jumpTargets.push({
                label: `Section: ${sec.heading.slice(0, 32)}`,
                anchorId: `sec-${t.id}-${sIdx}`,
                snippet: extractMatchSnippet(combined, q),
              });
            }
          });
          if (
            note.workedExample &&
            (note.workedExample.problem.toLowerCase().includes(q) ||
              note.workedExample.solution.toLowerCase().includes(q))
          ) {
            jumpTargets.push({
              label: `Example: ${note.workedExample.title.slice(0, 30)}`,
              anchorId: `topic-card-${t.id}`,
              snippet: extractMatchSnippet(
                `${note.workedExample.problem} ${note.workedExample.solution}`,
                q
              ),
            });
          }
          note.fatQuestionMethods?.forEach((fm, fIdx) => {
            const combined = `${fm.paperSource} ${fm.promptSummary} ${fm.solutionSteps.join(' ')}`;
            if (combined.toLowerCase().includes(q)) {
              jumpTargets.push({
                label: `FAT Method: ${fm.paperSource.slice(0, 24)}`,
                anchorId: `topic-card-${t.id}`,
                snippet: extractMatchSnippet(combined, q),
              });
            }
          });
          note.selfChecks?.forEach((sc, scIdx) => {
            const combined = `${sc.question} ${sc.explanation}`;
            if (combined.toLowerCase().includes(q)) {
              jumpTargets.push({
                label: `Self-Check Q${scIdx + 1}`,
                anchorId: `sc-${t.id}-${scIdx}`,
                snippet: extractMatchSnippet(combined, q),
              });
            }
          });
          if (note.examTip.toLowerCase().includes(q)) {
            jumpTargets.push({
              label: 'Examiner Scoring Tip',
              anchorId: `topic-card-${t.id}`,
              snippet: extractMatchSnippet(note.examTip, q),
            });
          }
        }

        if (jumpTargets.length === 0) return [];
        return [{ mod, topic: t, jumpTargets: jumpTargets.slice(0, 4) }];
      })
    );
  }, [searchQuery]);

  // Aggregate all topic self-checks for stats and missed queue
  const allSelfChecks = useMemo(() => {
    const list: Array<{
      checkId: string;
      topicId: string;
      topicTitle: string;
      moduleId: 'm1' | 'm2' | 'm3' | 'm4' | 'm5';
      moduleNumber: number;
      question: string;
      options: string[];
      correctIndex: number;
      explanation: string;
    }> = [];

    for (const mod of MODULES) {
      for (const t of mod.topics) {
        const note = TOPIC_NOTES_BY_ID[t.id];
        note?.selfChecks?.forEach((sc) => {
          list.push({
            checkId: sc.id,
            topicId: t.id,
            topicTitle: t.title,
            moduleId: mod.id,
            moduleNumber: MODULE_DIVISION_PALETTE[mod.id].number,
            question: sc.question,
            options: sc.options,
            correctIndex: sc.correctIndex,
            explanation: sc.explanation,
          });
        });
      }
    }
    return list;
  }, []);

  const selfCheckStats = useMemo(() => {
    let answered = 0;
    let correct = 0;
    const missed: typeof allSelfChecks = [];

    for (const item of allSelfChecks) {
      const chosen = selfCheckAnswers[item.checkId];
      if (chosen !== undefined) {
        answered += 1;
        if (chosen === item.correctIndex) {
          correct += 1;
        } else {
          missed.push(item);
        }
      }
    }
    return { total: allSelfChecks.length, answered, correct, missed };
  }, [allSelfChecks, selfCheckAnswers]);

  // Linear flat array of all topics with module context for full-screen Prev/Next navigation
  const allTopicsWithMod = useMemo(() => {
    return MODULES.flatMap((mod) =>
      mod.topics.map((t, idx) => ({
        mod,
        topic: t,
        idxInMod: idx,
      }))
    );
  }, []);

  // Context for current full-screen topic
  const fullScreenContext = useMemo(() => {
    if (!fullScreenTopicId) return null;
    const globalIdx = allTopicsWithMod.findIndex((x) => x.topic.id === fullScreenTopicId);
    if (globalIdx === -1) return null;
    const curr = allTopicsWithMod[globalIdx];
    const prev = globalIdx > 0 ? allTopicsWithMod[globalIdx - 1] : null;
    const next = globalIdx < allTopicsWithMod.length - 1 ? allTopicsWithMod[globalIdx + 1] : null;
    return {
      mod: curr.mod,
      topic: curr.topic,
      index: curr.idxInMod,
      globalIndex: globalIdx,
      prevTopic: prev?.topic ?? null,
      nextTopic: next?.topic ?? null,
      prevModId: prev?.mod.id ?? null,
      nextModId: next?.mod.id ?? null,
    };
  }, [fullScreenTopicId, allTopicsWithMod]);

  const toggleTopicNotes = (topicId: string) => {
    setExpandedTopicIds((prev) =>
      prev.includes(topicId) ? prev.filter((id) => id !== topicId) : [...prev, topicId]
    );
  };

  const handleExpandCollapseAll = () => {
    const modTopicIds = activeModule.topics.map((t) => t.id);
    if (allModuleTopicsExpanded) {
      setExpandedTopicIds((prev) => prev.filter((id) => !modTopicIds.includes(id)));
    } else {
      setExpandedTopicIds((prev) => Array.from(new Set([...prev, ...modTopicIds])));
    }
  };

  const handleSelectModuleWithSeed = (modId: 'm1' | 'm2' | 'm3' | 'm4' | 'm5') => {
    onSelectModule(modId);
    const targetMod = MODULES.find((m) => m.id === modId);
    const firstTopicId = targetMod?.topics[0]?.id;
    if (firstTopicId && !expandedSet.has(firstTopicId)) {
      setExpandedTopicIds((prev) => [...prev, firstTopicId]);
    }
  };

  const jumpToTopicCard = (topicId: string) => {
    setExpandedTopicIds((prev) => (prev.includes(topicId) ? prev : [...prev, topicId]));
    window.requestAnimationFrame(() => {
      const el = document.getElementById(`topic-card-${topicId}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const openFullScreenTopic = (topicId: string) => {
    setExpandedTopicIds((prev) => (prev.includes(topicId) ? prev : [...prev, topicId]));
    setFullScreenTopicId(topicId);
  };

  const handleMasteryClick = (
    topicId: string,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    const wasMastered = masteredSet.has(topicId);
    const rect = event.currentTarget.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;
    const targetMod = MODULES.find((m) => m.topics.some((t) => t.id === topicId)) ?? activeModule;

    onToggleMastered(topicId, { x: originX, y: originY }, targetMod.accentHex);

    if (!wasMastered) {
      setRecentlyMasteredId(topicId);
      if (popTimerRef.current !== null) window.clearTimeout(popTimerRef.current);
      popTimerRef.current = window.setTimeout(() => {
        setRecentlyMasteredId((curr) => (curr === topicId ? null : curr));
      }, 350);
    }
  };

  const handleSelfCheck = (
    checkId: string,
    chosenIdx: number,
    correctIdx: number,
    note: TopicNote
  ) => {
    if (selfCheckAnswers[checkId] !== undefined) return;
    setSelfCheckAnswers((prev) => ({ ...prev, [checkId]: chosenIdx }));

    if (chosenIdx !== correctIdx) {
      setMissedChecks((prev) =>
        prev.some((x) => x.checkId === checkId)
          ? prev
          : [
              ...prev,
              {
                topicId: note.topicId,
                topicTitle: note.title,
                checkId,
                moduleId: note.moduleId,
              },
            ]
      );
      onLogWeakTopic?.({
        topicId: note.topicId,
        moduleId: note.moduleId,
        topicTitle: note.title,
        source: 'self-check',
      });
    }
  };

  // Render complete concept note contents on --surface-sheet with EB Garamond prose-manual
  const renderNoteBody = (note: TopicNote) => (
    <div className="space-y-6 pt-4 text-sm text-[var(--ink-primary,#1C1B18)]">
      {/* High-Yield Executive Summary & Folio Sources */}
      <div className="p-4 sm:p-5 bg-[var(--surface-sheet,#FAF7F0)] border border-[var(--rule-hairline,#C5BEB0)] rounded-[4px] space-y-3">
        <div className="prose-manual max-w-[68ch]">
          <MarkdownBlock content={note.summary} />
        </div>
        <div className="pt-2 border-t border-[var(--rule-hairline,#C5BEB0)]">
          <div className="font-mono text-xs font-bold text-[var(--ink-muted,#6E695D)] mb-2">
            FOLIO SOURCES: {note.sourceDecks.join(' · ')}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {note.keyPoints.map((kp, idx) => (
              <div
                key={idx}
                className="p-3 bg-[var(--surface-leaf,#F4EFE4)] border border-[var(--rule-hairline,#C5BEB0)] rounded-[4px] text-xs sm:text-sm leading-relaxed"
              >
                <MarkdownBlock content={kp} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sections with crisp embedded SVG diagrams, tables, and code */}
      {note.sections.map((sec, sIdx) => {
        const isHighlight =
          Boolean(activeHighlightTerm) &&
          `${sec.heading} ${sec.body} ${sec.codeBlock ?? ''}`
            .toLowerCase()
            .includes(activeHighlightTerm.toLowerCase());

        return (
          <article
            key={sIdx}
            id={`sec-${note.topicId}-${sIdx}`}
            className={`space-y-3 pt-4 border-t border-[var(--rule-hairline,#C5BEB0)] scroll-mt-24 ${
              isHighlight
                ? 'bg-[#E5B82E]/15 -mx-3 px-3 py-2 rounded-[4px] border-l-4 border-[#E5B82E]'
                : ''
            }`}
          >
            <h4 className="text-base sm:text-lg font-bold text-[var(--ink-primary,#1C1B18)]">
              {activeHighlightTerm
                ? renderHighlightedText(sec.heading, activeHighlightTerm)
                : renderInlineMarkup(sec.heading)}
            </h4>
            <div className="prose-manual max-w-[68ch]">
              {activeHighlightTerm ? (
                <p className="leading-relaxed">
                  {renderHighlightedText(sec.body, activeHighlightTerm)}
                </p>
              ) : (
                <MarkdownBlock content={sec.body} />
              )}
            </div>

            {/* Embedded Crisp SVG Architecture Diagram */}
            {sec.diagramId && <ConceptDiagram diagramId={sec.diagramId} />}

            {/* Reference Table */}
            {sec.table && (
              <div className="overflow-x-auto border border-[var(--ink-primary,#1C1B18)] rounded-[4px] bg-[var(--surface-sheet,#FAF7F0)] my-3">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-[var(--surface-board,#EAE4D7)] border-b border-[var(--ink-primary,#1C1B18)] text-[var(--ink-primary,#1C1B18)]">
                      {sec.table.headers.map((h, hi) => (
                        <th key={hi} className="px-3.5 py-2.5 font-mono font-bold whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--rule-hairline,#C5BEB0)]">
                    {sec.table.rows.map((row, ri) => (
                      <tr key={ri} className="hover:bg-[var(--surface-leaf,#F4EFE4)] transition-colors">
                        {row.map((cell, ci) => (
                          <td
                            key={ci}
                            className={`px-3.5 py-2.5 align-top ${
                              ci === 0
                                ? 'font-semibold text-[var(--ink-primary,#1C1B18)]'
                                : 'text-[var(--ink-secondary,#434038)]'
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

            {/* Code Block */}
            {sec.codeBlock && (
              <pre className="p-3.5 bg-[var(--surface-binder,#26231E)] border border-[var(--ink-primary,#1C1B18)] rounded-[4px] overflow-x-auto text-xs font-mono text-[#FAF7F0] leading-relaxed my-2">
                <code>{sec.codeBlock}</code>
              </pre>
            )}
          </article>
        );
      })}

      {/* Worked Example */}
      {note.workedExample && (
        <div className="p-4 sm:p-5 bg-[var(--surface-leaf,#F4EFE4)] border border-[var(--ink-primary,#1C1B18)] rounded-[4px] space-y-2.5">
          <h4 className="text-sm sm:text-base font-bold text-[var(--ink-primary,#1C1B18)]">
            Worked Example · {note.workedExample.title}
          </h4>
          <div className="text-xs sm:text-sm text-[var(--ink-secondary,#434038)] pb-2 border-b border-[var(--rule-hairline,#C5BEB0)]">
            <MarkdownBlock content={note.workedExample.problem} />
          </div>
          <div className="prose-manual max-w-[68ch] text-xs sm:text-sm">
            <MarkdownBlock content={note.workedExample.solution} />
          </div>
        </div>
      )}

      {/* Real VIT FAT Solved Methods */}
      {note.fatQuestionMethods && note.fatQuestionMethods.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-[var(--ink-primary,#1C1B18)]">
            <FileCheck2 className="w-4 h-4 text-[var(--ink-primary,#1C1B18)] shrink-0" />
            <h4>FAT Paper Solved Methods ({note.fatQuestionMethods.length})</h4>
          </div>
          {note.fatQuestionMethods.map((m, mi) => (
            <div
              key={mi}
              className="p-4 bg-[var(--surface-sheet,#FAF7F0)] border border-[var(--ink-primary,#1C1B18)] rounded-[4px] space-y-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs border-b border-[var(--rule-hairline,#C5BEB0)] pb-2">
                <span className="font-bold text-[var(--ink-primary,#1C1B18)]">{m.paperSource}</span>
                <span className="text-[var(--ink-muted,#6E695D)]">{m.markBreakdown}</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-[var(--ink-primary,#1C1B18)]">
                {m.promptSummary}
              </p>
              <ol className="list-decimal pl-5 space-y-1 text-xs sm:text-sm text-[var(--ink-secondary,#434038)]">
                {m.solutionSteps.map((step, si) => (
                  <li key={si}>
                    <MarkdownBlock content={step} />
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}

      {/* Examiner Scoring Tip */}
      {note.examTip && (
        <div className="p-4 bg-[var(--surface-board,#EAE4D7)] border border-[var(--ink-primary,#1C1B18)] rounded-[4px]">
          <div className="font-mono text-xs font-bold text-[var(--ink-primary,#1C1B18)] bg-[#E5B82E] px-1.5 py-0.5 rounded-[2px] inline-block mb-1.5">
            EXAMINER SCORING TIP
          </div>
          <div className="text-xs sm:text-sm text-[var(--ink-primary,#1C1B18)] leading-relaxed prose-manual max-w-[68ch]">
            <MarkdownBlock content={note.examTip} />
          </div>
        </div>
      )}

      {/* Topic Self-Check Questions */}
      {note.selfChecks && note.selfChecks.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-[var(--ink-primary,#1C1B18)]">
              <HelpCircle className="w-4 h-4 text-[var(--ink-primary,#1C1B18)] shrink-0" />
              <h4>Topic Self-Check ({note.selfChecks.length} Questions)</h4>
            </div>
            {note.selfChecks.some((sc) => selfCheckAnswers[sc.id] !== undefined) && (
              <button
                type="button"
                onClick={() => {
                  const keysToReset = note.selfChecks.map((sc) => sc.id);
                  setSelfCheckAnswers((prev) => {
                    const copy = { ...prev };
                    keysToReset.forEach((k) => delete copy[k]);
                    return copy;
                  });
                }}
                className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[var(--ink-muted,#6E695D)] hover:text-[var(--ink-primary,#1C1B18)]"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {note.selfChecks.map((sc, sIdx) => {
              const chosen = selfCheckAnswers[sc.id];
              const answered = chosen !== undefined;
              const isCorrect = answered && chosen === sc.correctIndex;

              return (
                <div
                  key={sc.id}
                  id={`sc-${note.topicId}-${sIdx}`}
                  className="p-4 bg-[var(--surface-leaf,#F4EFE4)] border border-[var(--ink-primary,#1C1B18)] rounded-[4px] space-y-3 flex flex-col justify-between scroll-mt-24"
                >
                  <div className="space-y-2.5">
                    <div className="text-xs sm:text-sm font-semibold text-[var(--ink-primary,#1C1B18)]">
                      <span className="font-mono text-xs text-[var(--ink-muted,#6E695D)] mr-1.5">
                        Q{sIdx + 1}.
                      </span>
                      <MarkdownBlock content={sc.question} />
                    </div>
                    <div className="grid grid-cols-1 gap-1.5">
                      {sc.options.map((opt, oi) => {
                        let btnCls =
                          'bg-[var(--surface-sheet,#FAF7F0)] border-[var(--rule-hairline,#C5BEB0)] text-[var(--ink-primary,#1C1B18)] hover:border-[var(--ink-primary,#1C1B18)] hover:bg-[var(--surface-board,#EAE4D7)]';
                        if (answered) {
                          if (oi === sc.correctIndex) {
                            btnCls = 'bg-[#4F8A3D]/15 border-[#4F8A3D] text-[#1C1B18] font-bold';
                          } else if (oi === chosen) {
                            btnCls = 'bg-[#A62B2B]/15 border-[#A62B2B] text-[#1C1B18]';
                          } else {
                            btnCls =
                              'bg-[var(--surface-sheet,#FAF7F0)] border-[var(--rule-hairline,#C5BEB0)] text-[var(--ink-muted,#6E695D)] opacity-60';
                          }
                        }
                        return (
                          <button
                            key={oi}
                            type="button"
                            disabled={answered}
                            onClick={() => handleSelfCheck(sc.id, oi, sc.correctIndex, note)}
                            className={`text-left px-3 py-2 text-xs rounded-[4px] border transition-colors flex items-center justify-between gap-2 ${btnCls}`}
                          >
                            <span>
                              <span className="font-mono font-bold mr-1.5">
                                {String.fromCharCode(65 + oi)}.
                              </span>
                              {opt}
                            </span>
                            {answered && oi === sc.correctIndex && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#4F8A3D] shrink-0" />
                            )}
                            {answered && oi === chosen && oi !== sc.correctIndex && (
                              <XCircle className="w-3.5 h-3.5 text-[#A62B2B] shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {answered && (
                    <div
                      className={`text-xs p-3 rounded-[4px] border leading-relaxed ${
                        isCorrect
                          ? 'bg-[var(--surface-sheet,#FAF7F0)] border-[#4F8A3D] text-[var(--ink-primary,#1C1B18)]'
                          : 'bg-[var(--surface-sheet,#FAF7F0)] border-[var(--ink-primary,#1C1B18)] text-[var(--ink-primary,#1C1B18)]'
                      }`}
                    >
                      <span className="font-bold">
                        {isCorrect ? 'Correct: ' : `Answer ${String.fromCharCode(65 + sc.correctIndex)}: `}
                      </span>
                      <MarkdownBlock content={sc.explanation} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 w-full">
      {/* Manual Specification Header: Title, Folio, Search & Stats */}
      <div className="bg-[var(--surface-sheet,#FAF7F0)] border border-[var(--ink-primary,#1C1B18)] rounded-[4px] p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--ink-primary,#1C1B18)]">
              BACSE106 Syllabus Reference Manual
            </h1>
            <p className="text-xs font-mono text-[var(--ink-muted,#6E695D)] tabular-nums">
              MODULES 1–5 · {masteredTopicIds.length} / {totalSyllabusTopics} TOPICS MASTERED ·{' '}
              {selfCheckStats.answered} / {selfCheckStats.total} SELF-CHECKS SAVED · PRESS [/] TO
              DEEP SEARCH
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <label htmlFor="syllabus-search-input" className="sr-only">
              Deep search syllabus topics and notes
            </label>
            <Search
              className="w-4 h-4 text-[var(--ink-muted,#6E695D)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              ref={searchInputRef}
              id="syllabus-search-input"
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.trim()) setShowMissedQueue(false);
              }}
              placeholder="Search syllabus (e.g. TLB, inode, Banker, RR)... (/)"
              className="w-full h-10 pl-10 pr-9 text-sm bg-[var(--surface-leaf,#F4EFE4)] border border-[var(--ink-primary,#1C1B18)] rounded-[4px] text-[var(--ink-primary,#1C1B18)] placeholder:text-[var(--ink-muted,#6E695D)] focus:outline-none focus:bg-[var(--surface-sheet,#FAF7F0)]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveHighlightTerm('');
                }}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted,#6E695D)] hover:text-[var(--ink-primary,#1C1B18)]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Self-Check Progress & Cross-Topic Missed Queue Bar */}
        <div className="pt-3 border-t border-[var(--rule-hairline,#C5BEB0)] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono tabular-nums">
            <span
              data-testid="self-check-progress-pill"
              className="px-2.5 py-1 bg-[var(--surface-board,#EAE4D7)] border border-[var(--ink-primary,#1C1B18)] rounded-[3px] font-bold text-[var(--ink-primary,#1C1B18)]"
            >
              Topic MCQs: {selfCheckStats.correct} correct / {selfCheckStats.answered} attempted (
              {selfCheckStats.total} total)
            </span>
            {activeHighlightTerm && !searchQuery && (
              <span className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#E5B82E] border border-[var(--ink-primary,#1C1B18)] rounded-[3px] font-bold text-[#1C1B18]">
                <span>Highlighting: &quot;{activeHighlightTerm}&quot;</span>
                <button
                  type="button"
                  onClick={() => setActiveHighlightTerm('')}
                  className="underline"
                >
                  Clear
                </button>
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setShowMissedQueue((v) => !v);
              }}
              data-testid="missed-queue-toggle"
              className={`px-3 py-1.5 text-xs font-bold rounded-[4px] border border-[var(--ink-primary,#1C1B18)] whitespace-nowrap tabular-nums transition-colors ${
                showMissedQueue
                  ? 'bg-[var(--ink-primary,#1C1B18)] text-[#FAF7F0]'
                  : selfCheckStats.missed.length > 0
                  ? 'bg-[#A62B2B] text-[#FAF7F0] hover:bg-[#8d2424]'
                  : 'bg-[var(--surface-sheet,#FAF7F0)] text-[var(--ink-primary,#1C1B18)] hover:bg-[var(--surface-board,#EAE4D7)]'
              }`}
            >
              {showMissedQueue
                ? 'Back to Module Manual'
                : `Missed-Question Queue (${selfCheckStats.missed.length})`}
            </button>
            {selfCheckStats.answered > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSelfCheckAnswers({});
                  setMissedChecks([]);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-[var(--ink-secondary,#434038)] bg-[var(--surface-sheet,#FAF7F0)] hover:bg-[var(--surface-board,#EAE4D7)] border border-[var(--ink-primary,#1C1B18)] rounded-[4px] transition-colors"
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                <span>Reset All MCQs</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cross-Topic Missed-Question Queue View */}
      {showMissedQueue && !searchResults ? (
        <section className="space-y-4" data-testid="missed-question-queue">
          <div className="bg-[var(--surface-sheet,#FAF7F0)] border border-[var(--ink-primary,#1C1B18)] rounded-[4px] p-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-[var(--ink-primary,#1C1B18)]">
                Cross-Topic Missed-Question Queue ({selfCheckStats.missed.length})
              </h2>
              <p className="text-xs font-mono text-[var(--ink-muted,#6E695D)]">
                PERSISTED ACROSS ALL 5 MODULES · RE-ANSWER CORRECTLY TO REINFORCE
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowMissedQueue(false)}
              className="px-3 py-1.5 text-xs font-bold text-[#1C1B18] bg-[#E5B82E] border border-[var(--ink-primary,#1C1B18)] rounded-[4px] hover:bg-[#d8ab22] transition-colors"
            >
              Return to Syllabus Manual
            </button>
          </div>

          {selfCheckStats.missed.length === 0 ? (
            <div className="bg-[var(--surface-sheet,#FAF7F0)] border border-[var(--ink-primary,#1C1B18)] rounded-[4px] p-10 text-center space-y-2">
              <p className="text-sm font-bold text-[var(--ink-primary,#1C1B18)]">
                Zero missed self-check questions right now.
              </p>
              <p className="text-xs text-[var(--ink-muted,#6E695D)]">
                Practice self-check MCQs inside any topic card; any incorrect answer is automatically
                queued here for targeted review.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {selfCheckStats.missed.map((item) => {
                const palette = MODULE_DIVISION_PALETTE[item.moduleId];
                const chosen = selfCheckAnswers[item.checkId];
                return (
                  <div
                    key={item.checkId}
                    className="bg-[var(--surface-sheet,#FAF7F0)] border border-[var(--ink-primary,#1C1B18)] rounded-[4px] p-5 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                        <span
                          style={{ backgroundColor: palette.hex, color: palette.ink }}
                          className="px-2 py-0.5 font-bold rounded-[2px] border border-[var(--ink-primary,#1C1B18)]"
                        >
                          Module {item.moduleNumber}
                        </span>
                        <span className="font-bold text-[var(--ink-primary,#1C1B18)]">
                          {item.topicTitle}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectModule(item.moduleId);
                          setShowMissedQueue(false);
                          jumpToTopicCard(item.topicId);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-[var(--surface-board,#EAE4D7)] hover:bg-[#E5B82E] border border-[var(--ink-primary,#1C1B18)] rounded-[3px] transition-colors"
                      >
                        <span>Open Topic Notes</span>
                        <ArrowRight className="w-3 h-3" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="text-sm font-bold text-[var(--ink-primary,#1C1B18)] leading-relaxed">
                      {renderInlineMarkup(item.question)}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {item.options.map((opt, oIdx) => {
                        const isPickedWrong = chosen === oIdx && oIdx !== item.correctIndex;
                        return (
                          <button
                            key={oIdx}
                            type="button"
                            onClick={() =>
                              setSelfCheckAnswers((prev) => ({ ...prev, [item.checkId]: oIdx }))
                            }
                            className={`text-left px-3 py-2 text-xs rounded-[4px] border transition-colors ${
                              isPickedWrong
                                ? 'bg-[#A62B2B]/15 border-[#A62B2B] text-[#1C1B18]'
                                : 'bg-[var(--surface-leaf,#F4EFE4)] border-[var(--ink-primary,#1C1B18)] text-[var(--ink-primary,#1C1B18)] hover:bg-[#E5B82E]/30'
                            }`}
                          >
                            <span className="font-mono font-bold mr-2">
                              {String.fromCharCode(65 + oIdx)}.
                            </span>
                            {renderInlineMarkup(opt)}
                          </button>
                        );
                      })}
                    </div>

                    <div className="text-xs bg-[var(--surface-leaf,#F4EFE4)] border border-[var(--rule-hairline,#C5BEB0)] rounded-[4px] p-3 text-[var(--ink-secondary,#434038)] leading-relaxed">
                      <span className="font-bold text-[var(--ink-primary,#1C1B18)]">
                        Explanation:{' '}
                      </span>
                      {renderInlineMarkup(item.explanation)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ) : searchResults ? (
        /* Deep Search Hit List */
        <section
          className="space-y-3"
          aria-label="Search results"
          data-testid="syllabus-search-results"
        >
          <div className="flex items-center justify-between text-xs font-mono text-[var(--ink-secondary,#434038)]">
            <span className="tabular-nums">
              {searchResults.length} MATCHING TOPIC{searchResults.length === 1 ? '' : 'S'} FOR &quot;
              {searchQuery}&quot;
            </span>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveHighlightTerm('');
              }}
              className="text-[var(--ink-primary,#1C1B18)] underline font-bold"
            >
              Clear search
            </button>
          </div>

          {searchResults.length === 0 ? (
            <div className="bg-[var(--surface-sheet,#FAF7F0)] border border-[var(--ink-primary,#1C1B18)] rounded-[4px] p-8 text-center text-sm text-[var(--ink-secondary,#434038)]">
              No syllabus topics matched &quot;{searchQuery}&quot;. Try keywords like &quot;TLB&quot;,
              &quot;Peterson&quot;, &quot;Banker&quot;, &quot;Working Set&quot;, &quot;Inode&quot;, or &quot;RAID&quot;.
            </div>
          ) : (
            <div className="space-y-3">
              {searchResults.map(({ mod, topic, jumpTargets }) => {
                const palette = MODULE_DIVISION_PALETTE[mod.id];
                const jumpToMatchAnchor = (anchorId: string) => {
                  const term = searchQuery.trim();
                  setActiveHighlightTerm(term);
                  onSelectModule(mod.id);
                  setExpandedTopicIds((prev) =>
                    prev.includes(topic.id) ? prev : [...prev, topic.id]
                  );
                  setSearchQuery('');
                  window.setTimeout(() => {
                    const el =
                      document.getElementById(anchorId) ??
                      document.getElementById(`topic-card-${topic.id}`);
                    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 60);
                };

                return (
                  <div
                    key={topic.id}
                    className="bg-[var(--surface-sheet,#FAF7F0)] border border-[var(--ink-primary,#1C1B18)] rounded-[4px] p-4 sm:p-5 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <h2 className="text-base font-bold text-[var(--ink-primary,#1C1B18)]">
                          {renderHighlightedText(topic.title, searchQuery)}
                        </h2>
                        <div className="flex items-center gap-2 text-xs font-mono text-[var(--ink-muted,#6E695D)]">
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-[var(--ink-primary,#1C1B18)] inline-block"
                            style={{ backgroundColor: palette.hex }}
                            aria-hidden="true"
                          />
                          <span>Module {palette.number}</span>
                          <span aria-hidden="true">·</span>
                          <span>{topic.hoursTag}</span>
                          <span aria-hidden="true">·</span>
                          <span>{topic.silberschatzRef}</span>
                          <span aria-hidden="true">·</span>
                          <span>{topic.fatFrequency}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => jumpToMatchAnchor(`topic-card-${topic.id}`)}
                        className="px-3 py-2 text-xs font-bold text-[#1C1B18] bg-[#E5B82E] hover:bg-[#d8ab22] border border-[var(--ink-primary,#1C1B18)] rounded-[4px] whitespace-nowrap shrink-0 transition-colors"
                      >
                        Open Notes
                      </button>
                    </div>

                    {/* Matched Jump Badges */}
                    <div className="pt-2.5 border-t border-[var(--rule-hairline,#C5BEB0)] space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        {jumpTargets.map((jt, jIdx) => (
                          <button
                            key={jIdx}
                            type="button"
                            onClick={() => jumpToMatchAnchor(jt.anchorId)}
                            className="px-2 py-1 text-[11px] font-mono font-bold text-[var(--ink-primary,#1C1B18)] bg-[var(--surface-board,#EAE4D7)] hover:bg-[#E5B82E] border border-[var(--ink-primary,#1C1B18)] rounded-[3px] transition-colors"
                          >
                            Jump → {jt.label}
                          </button>
                        ))}
                      </div>
                      <div className="space-y-1">
                        {jumpTargets.slice(0, 2).map((jt, jIdx) => (
                          <p
                            key={jIdx}
                            className="text-xs text-[var(--ink-secondary,#434038)] bg-[var(--surface-leaf,#F4EFE4)] border border-[var(--rule-hairline,#C5BEB0)] rounded-[3px] px-3 py-1.5 leading-relaxed"
                          >
                            <span className="font-mono font-bold text-[var(--ink-primary,#1C1B18)] mr-1.5">
                              [{jt.label}]
                            </span>
                            {renderHighlightedText(jt.snippet, searchQuery)}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        <>
          {/* Module Division Selector Tabs across top */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {MODULES.map((mod) => {
              const active = mod.id === activeModule.id;
              const palette = MODULE_DIVISION_PALETTE[mod.id];
              const modMastered = mod.topics.filter((t) => masteredSet.has(t.id)).length;

              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => handleSelectModuleWithSeed(mod.id)}
                  style={
                    active
                      ? { backgroundColor: palette.hex, color: palette.ink }
                      : undefined
                  }
                  className={`px-3.5 py-2.5 text-xs font-bold rounded-[4px] border border-[var(--ink-primary,#1C1B18)] flex items-center justify-between gap-2 tabular-nums transition-colors ${
                    active
                      ? ''
                      : 'bg-[var(--surface-sheet,#FAF7F0)] text-[var(--ink-primary,#1C1B18)] hover:bg-[var(--surface-leaf,#F4EFE4)]'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-[var(--ink-primary,#1C1B18)] shrink-0"
                      style={{ backgroundColor: palette.hex }}
                      aria-hidden="true"
                    />
                    <span className="truncate">{mod.code}</span>
                  </span>
                  <span className="font-mono text-[11px] opacity-85 shrink-0">
                    ({modMastered}/{mod.topics.length})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Distraction-Free 100% Full-Width Syllabus Manual Container */}
          <div className="space-y-5 w-full" data-testid="syllabus-full-width-notes">
            {/* Division Specification Plate */}
            <div className="bg-[var(--surface-sheet,#FAF7F0)] border border-[var(--ink-primary,#1C1B18)] rounded-[4px] overflow-hidden">
              {/* Division Color Band */}
              <div
                className="px-5 py-2.5 border-b border-[var(--ink-primary,#1C1B18)] flex flex-wrap items-center justify-between gap-2 text-xs font-mono font-bold"
                style={{ backgroundColor: activePalette.hex, color: activePalette.ink }}
              >
                <span>
                  {activePalette.name} · MODULE {activePalette.number} ({activeModule.hours} LECTURE HOURS)
                </span>
                <span className="tabular-nums">
                  {moduleMasteredCount} / {activeModule.topics.length} TOPICS MASTERED ({activeModule.weightPct}% FAT WEIGHT)
                </span>
              </div>

              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--ink-primary,#1C1B18)] tracking-tight">
                      {activeModule.code}: {activeModule.title}
                    </h2>
                    <p className="text-xs font-mono text-[var(--ink-muted,#6E695D)] tabular-nums">
                      {activeModule.co} · {activeModule.hours} Lecture Hours · {activeModule.weightPct}% Total FAT Marks
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleExpandCollapseAll}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[var(--ink-primary,#1C1B18)] bg-[var(--surface-board,#EAE4D7)] hover:bg-[#ded6c6] border border-[var(--ink-primary,#1C1B18)] rounded-[4px] whitespace-nowrap transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{allModuleTopicsExpanded ? 'Collapse All Notes' : 'Expand All Notes'}</span>
                    </button>
                    {onNavigateToLab && (
                      <button
                        type="button"
                        onClick={() => onNavigateToLab(activeModule.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#1C1B18] bg-[#E5B82E] hover:bg-[#d8ab22] border border-[var(--ink-primary,#1C1B18)] rounded-[4px] whitespace-nowrap transition-colors"
                      >
                        <span>Interactive Lab</span>
                        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Topic Jump Index Bar */}
                <div
                  aria-label="Module topic jump bar"
                  className="pt-3 border-t border-[var(--rule-hairline,#C5BEB0)] flex flex-wrap items-center gap-x-4 gap-y-2 text-xs"
                >
                  <span className="font-mono font-bold text-[var(--ink-muted,#6E695D)]">INDEX:</span>
                  {activeModule.topics.map((t, idx) => {
                    const isOpen = expandedSet.has(t.id);
                    const isDone = masteredSet.has(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => jumpToTopicCard(t.id)}
                        className={`inline-flex items-center gap-1.5 font-semibold transition-colors ${
                          isOpen
                            ? 'text-[var(--ink-primary,#1C1B18)] font-bold'
                            : 'text-[var(--ink-secondary,#434038)] hover:text-[var(--ink-primary,#1C1B18)]'
                        }`}
                      >
                        <span className="font-mono text-[11px] text-[var(--ink-muted,#6E695D)] tabular-nums">
                          {activePalette.number}.{idx + 1}
                        </span>
                        <span className="underline decoration-[var(--ink-primary,#1C1B18)] underline-offset-4">
                          {t.title.split(/[,:]/)[0]}
                        </span>
                        {isDone && (
                          <CheckCircle2 className="w-3 h-3 text-[#4F8A3D] shrink-0" aria-hidden="true" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* List of 100% Full-Width Topic Reading Plates */}
            <div className="space-y-5">
              {activeModule.topics.map((topic, tIdx) => {
                const isMastered = masteredSet.has(topic.id);
                const isExpanded = expandedSet.has(topic.id);
                const note = TOPIC_NOTES_BY_ID[topic.id];
                const bloomLevel = TOPIC_BLOOM_LEVELS[topic.id] ?? 'K3 (Apply)';

                return (
                  <div
                    key={topic.id}
                    id={`topic-card-${topic.id}`}
                    data-testid={`topic-card-${topic.id}`}
                    className={`border border-[var(--ink-primary,#1C1B18)] rounded-[4px] p-5 sm:p-7 scroll-mt-20 transition-colors ${
                      isMastered
                        ? 'bg-[var(--surface-leaf,#F4EFE4)]'
                        : 'bg-[var(--surface-sheet,#FAF7F0)]'
                    }`}
                  >
                    {/* Topic Card Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        {/* Tactile Circular Mastery Toggle Button */}
                        <button
                          type="button"
                          onClick={(e) => handleMasteryClick(topic.id, e)}
                          aria-label={
                            isMastered ? `Unmark "${topic.title}"` : `Mark "${topic.title}" mastered`
                          }
                          aria-pressed={isMastered}
                          className={`mt-1 w-6 h-6 rounded-full border border-[var(--ink-primary,#1C1B18)] flex items-center justify-center shrink-0 transition-transform ${
                            isMastered
                              ? 'bg-[#4F8A3D] text-[#FAF7F0]'
                              : 'bg-[var(--surface-sheet,#FAF7F0)] hover:bg-[var(--surface-board,#EAE4D7)] text-transparent'
                          } ${recentlyMasteredId === topic.id ? 'scale-110' : ''}`}
                        >
                          <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>

                        <div className="space-y-1.5 min-w-0 flex-1">
                          {/* Heading directly leads the block */}
                          <h3 className="text-xl sm:text-2xl font-extrabold text-[var(--ink-primary,#1C1B18)] tracking-tight">
                            {topic.title}
                          </h3>

                          {/* Topic Header Metadata directly below heading (Module X · Topic X.Y · Lecture Hours · Bloom level) */}
                          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[var(--ink-muted,#6E695D)] tabular-nums pt-0.5">
                            <span>Module {activePalette.number}</span>
                            <span aria-hidden="true">·</span>
                            <span>
                              Topic {activePalette.number}.{tIdx + 1}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{topic.hoursTag} Lecture Hours</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-semibold text-[var(--ink-primary,#1C1B18)]">
                              Bloom {bloomLevel}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{topic.silberschatzRef}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-semibold">{topic.fatFrequency}</span>
                            {isMastered && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-bold text-[#4F8A3D]">MASTERED</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Action Controls: Full Screen & Read/Hide */}
                      <div className="flex items-center gap-2 shrink-0 pl-9 sm:pl-0">
                        <button
                          type="button"
                          onClick={() => openFullScreenTopic(topic.id)}
                          aria-label={`Open full screen notes for ${topic.title}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold text-[var(--ink-primary,#1C1B18)] bg-[var(--surface-board,#EAE4D7)] hover:bg-[#ded6c6] border border-[var(--ink-primary,#1C1B18)] rounded-[4px] whitespace-nowrap shrink-0 transition-colors"
                        >
                          <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Full Screen</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleTopicNotes(topic.id)}
                          aria-expanded={isExpanded}
                          aria-label={
                            isExpanded ? `Hide notes for ${topic.title}` : `Read notes for ${topic.title}`
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold text-[#1C1B18] bg-[#E5B82E] hover:bg-[#d8ab22] border border-[var(--ink-primary,#1C1B18)] rounded-[4px] whitespace-nowrap shrink-0 transition-colors"
                        >
                          <span>{isExpanded ? 'Hide Notes' : 'Read Notes'}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Inline Expanded Concept Notes Body */}
                    {isExpanded && (
                      <div
                        className="mt-6 pt-6 border-t border-[var(--ink-primary,#1C1B18)]"
                        data-testid={`topic-notes-${topic.id}`}
                      >
                        {note ? (
                          renderNoteBody(note)
                        ) : (
                          <p className="text-sm text-[var(--ink-muted,#6E695D)]">
                            Concept notes for this topic are being compiled.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Distraction-Free Full Screen Note Reader Overlay Modal */}
      {fullScreenContext && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Full screen notes: ${fullScreenContext.topic.title}`}
          data-testid="fullscreen-note-reader"
          className="fixed inset-0 z-50 bg-[var(--surface-board,#EAE4D7)] overflow-y-auto"
        >
          {/* Sticky Full-Screen Top Header Bar */}
          <div className="sticky top-0 z-20 bg-[var(--surface-sheet,#FAF7F0)] border-b border-[var(--ink-primary,#1C1B18)] px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="min-w-0 max-w-xl">
              <h2 className="text-base sm:text-lg font-bold text-[var(--ink-primary,#1C1B18)] truncate">
                {fullScreenContext.topic.title}
              </h2>
              <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs text-[var(--ink-muted,#6E695D)] tabular-nums pt-0.5">
                <span>Module {MODULE_DIVISION_PALETTE[fullScreenContext.mod.id].number}</span>
                <span>·</span>
                <span>
                  Topic {MODULE_DIVISION_PALETTE[fullScreenContext.mod.id].number}.{fullScreenContext.index + 1}
                </span>
                <span>·</span>
                <span>{fullScreenContext.topic.hoursTag} Lecture Hours</span>
                <span>·</span>
                <span className="font-semibold text-[var(--ink-primary,#1C1B18)]">
                  Bloom {TOPIC_BLOOM_LEVELS[fullScreenContext.topic.id] ?? 'K3'}
                </span>
                <span>·</span>
                <span>{fullScreenContext.topic.silberschatzRef}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={!fullScreenContext.prevTopic}
                onClick={() => {
                  if (fullScreenContext.prevTopic) {
                    if (fullScreenContext.prevModId && fullScreenContext.prevModId !== activeModuleId) {
                      onSelectModule(fullScreenContext.prevModId);
                    }
                    openFullScreenTopic(fullScreenContext.prevTopic.id);
                  }
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono font-bold text-[var(--ink-primary,#1C1B18)] bg-[var(--surface-sheet,#FAF7F0)] border border-[var(--ink-primary,#1C1B18)] rounded-[4px] hover:bg-[var(--surface-board,#EAE4D7)] disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Prev</span>
              </button>

              <button
                type="button"
                disabled={!fullScreenContext.nextTopic}
                onClick={() => {
                  if (fullScreenContext.nextTopic) {
                    if (fullScreenContext.nextModId && fullScreenContext.nextModId !== activeModuleId) {
                      onSelectModule(fullScreenContext.nextModId);
                    }
                    openFullScreenTopic(fullScreenContext.nextTopic.id);
                  }
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono font-bold text-[var(--ink-primary,#1C1B18)] bg-[var(--surface-sheet,#FAF7F0)] border border-[var(--ink-primary,#1C1B18)] rounded-[4px] hover:bg-[var(--surface-board,#EAE4D7)] disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={(e) => handleMasteryClick(fullScreenContext.topic.id, e)}
                aria-pressed={masteredSet.has(fullScreenContext.topic.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[4px] border border-[var(--ink-primary,#1C1B18)] transition-colors ${
                  masteredSet.has(fullScreenContext.topic.id)
                    ? 'bg-[#4F8A3D] text-[#FAF7F0]'
                    : 'bg-[var(--surface-sheet,#FAF7F0)] text-[var(--ink-primary,#1C1B18)] hover:bg-[var(--surface-board,#EAE4D7)]'
                }`}
              >
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                <span>
                  {masteredSet.has(fullScreenContext.topic.id) ? 'Mastered' : 'Mark Mastered'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFullScreenTopicId(null)}
                aria-label="Exit full screen notes"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold text-[#FAF7F0] bg-[var(--ink-primary,#1C1B18)] hover:bg-[#26231E] rounded-[4px] transition-colors"
              >
                <Minimize2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Exit Full Screen (Esc)</span>
              </button>
            </div>
          </div>

          {/* Modal Reading Container */}
          <div className="w-full max-w-4xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
            <div className="bg-[var(--surface-sheet,#FAF7F0)] border border-[var(--ink-primary,#1C1B18)] rounded-[4px] p-6 sm:p-10 space-y-6">
              {/* Heading leading directly */}
              <div className="pb-4 border-b border-[var(--ink-primary,#1C1B18)] space-y-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink-primary,#1C1B18)] tracking-tight">
                  {fullScreenContext.topic.title}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[var(--ink-muted,#6E695D)] tabular-nums">
                  <span>Module {MODULE_DIVISION_PALETTE[fullScreenContext.mod.id].number}</span>
                  <span>·</span>
                  <span>
                    Topic {MODULE_DIVISION_PALETTE[fullScreenContext.mod.id].number}.{fullScreenContext.index + 1}
                  </span>
                  <span>·</span>
                  <span>{fullScreenContext.topic.hoursTag} Lecture Hours</span>
                  <span>·</span>
                  <span className="font-semibold text-[var(--ink-primary,#1C1B18)]">
                    Bloom {TOPIC_BLOOM_LEVELS[fullScreenContext.topic.id] ?? 'K3'}
                  </span>
                  <span>·</span>
                  <span>{fullScreenContext.topic.silberschatzRef}</span>
                  <span>·</span>
                  <span className="font-semibold">{fullScreenContext.topic.fatFrequency}</span>
                </div>
              </div>

              {/* Render Note Content in Modal */}
              {TOPIC_NOTES_BY_ID[fullScreenContext.topic.id] ? (
                renderNoteBody(TOPIC_NOTES_BY_ID[fullScreenContext.topic.id])
              ) : (
                <p className="text-sm text-[var(--ink-muted,#6E695D)]">
                  Concept notes for this topic are being compiled.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyllabusView;
