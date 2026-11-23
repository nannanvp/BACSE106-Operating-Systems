import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileCheck2,
  FileText,
  Filter,
  Layers,
  Printer,
  RotateCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import {
  COURSE_META,
  EXAMINER_BLUEPRINTS,
  EXAMINER_TRAPS,
  ExaminerTrap,
  FLASHCARDS,
  FlashcardItem,
  MODULES,
  ModuleMeta,
  PACING_PLAN,
} from '../data/courseData';
import {
  COURSE_ATTACHED_FILES,
  MODULE_STUDY_PACKS,
  ModuleStudyPack,
} from '../data/professorMaterials';
import { buildCheatSheetHtml, printCheatSheetHtml } from '../utils/cheatSheetPrintEngine';
import {
  FormulaEntry,
  OS_FORMULAS,
  filterFormulas,
} from '../utils/formulaQuickRefEngine';
import {
  SrsCardState,
  SrsProfile,
  SrsRating,
  computeSrsForecast,
  formatIntervalLabel,
  reviewCard,
  sortCardsByDueOrder,
} from '../utils/srsEngine';
import { MarkdownBlock } from './MarkdownBlock';

export type ReferenceViewTab = 'appendix' | 'flashcards' | 'traps' | 'cheatsheet';

interface ReferenceViewProps {
  srsStates: Record<string, SrsCardState>;
  srsProfile: SrsProfile;
  onChangeSrsProfile: (profile: SrsProfile) => void;
  onRateCard: (cardId: string, rating: SrsRating) => void;
  initialTab?: ReferenceViewTab;
  onNavigateToModule?: (moduleId: string) => void;
}

const TRAPS_STORAGE_KEY = 'bacse106_traps_locked_v1';
const REVISION_CHECKS_KEY = 'bacse106_ref_checklist_v1';

const MODULE_PALETTE: Record<string, { hex: string; ink: string; name: string }> = {
  m1: { hex: '#E5B82E', ink: '#1C1B18', name: 'M1 · OS Structures' },
  m2: { hex: '#E06D2B', ink: '#1C1B18', name: 'M2 · CPU & Deadlocks' },
  m3: { hex: '#4F8A3D', ink: '#FAF7F0', name: 'M3 · Synchronization' },
  m4: { hex: '#147E7B', ink: '#FAF7F0', name: 'M4 · Memory & Paging' },
  m5: { hex: '#22559C', ink: '#FAF7F0', name: 'M5 · Disk & Security' },
};

export function getLeitnerBox(reps: number = 0): {
  box: 1 | 2 | 3 | 4 | 5;
  label: string;
  intervalDesc: string;
} {
  if (reps <= 0) return { box: 1, label: 'Box 1: Daily', intervalDesc: 'New / Reset' };
  if (reps === 1) return { box: 2, label: 'Box 2: 3-Day', intervalDesc: 'Learning' };
  if (reps === 2) return { box: 3, label: 'Box 3: 1-Week', intervalDesc: 'Reviewing' };
  if (reps === 3) return { box: 4, label: 'Box 4: 2-Weeks', intervalDesc: 'Consolidating' };
  return { box: 5, label: 'Box 5: Mastered', intervalDesc: 'Permanent' };
}

export const ReferenceView: React.FC<ReferenceViewProps> = ({
  srsStates,
  srsProfile,
  onChangeSrsProfile,
  onRateCard,
  initialTab = 'appendix',
  onNavigateToModule,
}) => {
  // Main view navigation tabs
  const [activeTab, setActiveTab] = useState<ReferenceViewTab>(initialTab);

  // Tab 1 (Appendix) states
  const [selectedModuleId, setSelectedModuleId] = useState<'m1' | 'm2' | 'm3' | 'm4' | 'm5'>('m1');
  const [completedChecks, setCompletedChecks] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(REVISION_CHECKS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Tab 2 (Flashcards) states
  const [fcModuleFilter, setFcModuleFilter] = useState<'all' | 'm1' | 'm2' | 'm3' | 'm4' | 'm5'>('all');
  const [fcQueueFilter, setFcQueueFilter] = useState<'all' | 'due' | 'weak'>('all');
  const [fcLeitnerFilter, setFcLeitnerFilter] = useState<'all' | 1 | 2 | 3 | 4 | 5>('all');
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Tab 3 (Traps) states
  const [trapSubTab, setTrapSubTab] = useState<'traps' | 'blueprints' | 'pacing'>('traps');
  const [trapModuleFilter, setTrapModuleFilter] = useState<'all' | 'm1' | 'm2' | 'm3' | 'm4' | 'm5'>('all');
  const [trapSearchQuery, setTrapSearchQuery] = useState('');
  const [lockedTrapIds, setLockedTrapIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(TRAPS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Tab 4 (Cheat Sheet) states
  const [formulaMode, setFormulaMode] = useState<'interactive' | 'paper'>('interactive');
  const [formulaModuleFilter, setFormulaModuleFilter] = useState<'all' | 'm2' | 'm3' | 'm4' | 'm5'>('all');
  const [formulaSearchQuery, setFormulaSearchQuery] = useState('');
  const [copiedFormulaId, setCopiedFormulaId] = useState<string | null>(null);

  // Persist checkable items
  const toggleChecklist = (checkId: string) => {
    setCompletedChecks((prev) => {
      const next = prev.includes(checkId) ? prev.filter((id) => id !== checkId) : [...prev, checkId];
      try {
        localStorage.setItem(REVISION_CHECKS_KEY, JSON.stringify(next));
      } catch {
        // quota ignore
      }
      return next;
    });
  };

  const toggleTrapLock = (trapId: string) => {
    setLockedTrapIds((prev) => {
      const next = prev.includes(trapId) ? prev.filter((id) => id !== trapId) : [...prev, trapId];
      try {
        localStorage.setItem(TRAPS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // quota ignore
      }
      return next;
    });
  };

  // Active module object
  const activeModule: ModuleMeta = useMemo(
    () => MODULES.find((m) => m.id === selectedModuleId) ?? MODULES[0],
    [selectedModuleId]
  );
  const activeStudyPack: ModuleStudyPack = useMemo(
    () => MODULE_STUDY_PACKS[selectedModuleId] ?? MODULE_STUDY_PACKS.m1,
    [selectedModuleId]
  );

  // Filtered flashcards
  const filteredCards = useMemo(() => {
    let list = FLASHCARDS;
    if (fcModuleFilter !== 'all') {
      list = list.filter((c) => c.moduleId === fcModuleFilter);
    }
    const now = Date.now();
    if (fcQueueFilter === 'due') {
      list = list.filter((c) => {
        const st = srsStates[c.id];
        return !st || st.dueAt <= now;
      });
    } else if (fcQueueFilter === 'weak') {
      list = list.filter((c) => {
        const st = srsStates[c.id];
        return st && st.easeFactor < 2.1;
      });
    }
    if (fcLeitnerFilter !== 'all') {
      list = list.filter((c) => {
        const st = srsStates[c.id];
        const reps = st?.repetitions ?? 0;
        return getLeitnerBox(reps).box === fcLeitnerFilter;
      });
    }
    return sortCardsByDueOrder(list, srsStates);
  }, [fcModuleFilter, fcQueueFilter, fcLeitnerFilter, srsStates]);

  const currentCard: FlashcardItem | undefined =
    filteredCards[Math.min(cardIdx, Math.max(0, filteredCards.length - 1))];

  // Global Leitner box distribution
  const leitnerCounts = useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    FLASHCARDS.forEach((card) => {
      const st = srsStates[card.id];
      const box = getLeitnerBox(st?.repetitions ?? 0).box;
      counts[box] += 1;
    });
    return counts;
  }, [srsStates]);

  // Forecast for filtered cards
  const forecast = useMemo(
    () =>
      computeSrsForecast(
        filteredCards.map((c) => c.id),
        srsStates
      ),
    [filteredCards, srsStates]
  );

  // Interval preview calculations for 1..4 buttons
  const nextIntervals = useMemo(() => {
    if (!currentCard) return { again: '5m', hard: '20m', good: '45m', easy: '2h' };
    const st = srsStates[currentCard.id];
    const now = Date.now();
    return {
      again: formatIntervalLabel(reviewCard(st, currentCard.id, 'again', srsProfile, now).intervalMs),
      hard: formatIntervalLabel(reviewCard(st, currentCard.id, 'hard', srsProfile, now).intervalMs),
      good: formatIntervalLabel(reviewCard(st, currentCard.id, 'good', srsProfile, now).intervalMs),
      easy: formatIntervalLabel(reviewCard(st, currentCard.id, 'easy', srsProfile, now).intervalMs),
    };
  }, [currentCard, srsStates, srsProfile]);

  const handleRate = useCallback(
    (rating: SrsRating) => {
      if (!currentCard) return;
      onRateCard(currentCard.id, rating);
      setFlipped(false);
      setCardIdx((i) => (i + 1 >= filteredCards.length ? 0 : i + 1));
    },
    [currentCard, onRateCard, filteredCards.length]
  );

  // Keyboard navigation for Flashcards
  useEffect(() => {
    if (activeTab !== 'flashcards' || !currentCard) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag && ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;

      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setFlipped(false);
        setCardIdx((i) => (i + 1) % filteredCards.length);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setFlipped(false);
        setCardIdx((i) => (i - 1 + filteredCards.length) % filteredCards.length);
      } else if (flipped && ['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        const map: Record<string, SrsRating> = {
          '1': 'again',
          '2': 'hard',
          '3': 'good',
          '4': 'easy',
        };
        handleRate(map[e.key]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeTab, currentCard, flipped, filteredCards.length, handleRate]);

  // Print Cheat Sheet Handler
  const handlePrintCheatSheet = () => {
    const html = buildCheatSheetHtml({
      courseCode: COURSE_META.code,
      courseTitle: COURSE_META.title,
      examDateLabel: COURSE_META.examDateDisplay,
      formulas: OS_FORMULAS,
      examinerTraps: EXAMINER_TRAPS.map((t) => ({
        title: t.title,
        fix: t.fix,
        moduleCode: t.moduleCode,
      })),
      comparisonRows: [
        {
          label: 'Monolithic vs Microkernel',
          summary:
            'Monolithic: Ring-0 direct C calls, fastest, driver crash panics OS. Microkernel: Ring-3 servers + IPC message passing, fault-isolated, higher context-switch cost.',
        },
        {
          label: 'Paging vs Segmentation',
          summary:
            'Paging: fixed frames, zero external fragmentation, slight internal frag. Segmentation: logical variable regions, external frag, strict offset < limit check.',
        },
        {
          label: 'OPT / LRU vs FIFO',
          summary:
            'OPT & LRU are Stack Algorithms (zero Belady anomaly). FIFO suffers Belady anomaly (more frames -> more faults on 1,2,3,4,1,2,5,1,2,3,4,5).',
        },
        {
          label: 'SCAN vs LOOK',
          summary:
            'SCAN/C-SCAN travel all the way to physical boundary cylinders (0/maxTrack). LOOK/C-LOOK reverse immediately at the furthest pending request.',
        },
        {
          label: 'ACL vs Capability List',
          summary:
            'ACL = column of Access Matrix stored per object (easy revocation, slower check). Capability = row stored per domain (fast unforgeable token, hard global revoke).',
        },
        {
          label: 'VMs vs Containers',
          summary:
            'VMs run full Guest OS atop Hypervisor (strong kernel isolation, GB RAM). Containers share Host Kernel via Namespaces + cgroups (ms boot, MB RAM).',
        },
      ],
    });
    printCheatSheetHtml(html);
  };

  // Filtered Examiner Traps
  const filteredTraps = useMemo(() => {
    let list = EXAMINER_TRAPS;
    if (trapModuleFilter !== 'all') {
      list = list.filter((t) => t.moduleId === trapModuleFilter);
    }
    if (trapSearchQuery.trim()) {
      const q = trapSearchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.mistake.toLowerCase().includes(q) ||
          t.fix.toLowerCase().includes(q) ||
          t.moduleCode.toLowerCase().includes(q)
      );
    }
    return list;
  }, [trapModuleFilter, trapSearchQuery]);

  // Filtered Formulas
  const filteredFormulas = useMemo(() => {
    const base =
      formulaModuleFilter === 'all'
        ? OS_FORMULAS
        : OS_FORMULAS.filter((f) => f.moduleId === formulaModuleFilter);
    return filterFormulas(base, formulaSearchQuery);
  }, [formulaModuleFilter, formulaSearchQuery]);

  const handleCopyFormula = (entry: FormulaEntry) => {
    navigator.clipboard?.writeText?.(entry.formula);
    setCopiedFormulaId(entry.id);
    setTimeout(() => {
      setCopiedFormulaId((curr) => (curr === entry.id ? null : curr));
    }, 1800);
  };

  return (
    <section className="space-y-6" data-testid="reference-view">
      {/* Editorial Header Banner */}
      <div className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[3px] p-5 sm:p-6 flex flex-col md:flex-row md:items-end justify-between gap-4 shadow-sm print-card">
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--ink-primary)]">
            {activeTab === 'appendix'
              ? 'Course Reference Appendix & Module Study Packs'
              : activeTab === 'flashcards'
              ? '50 SM-2 Flashcard Deck & Leitner Tracking'
              : activeTab === 'traps'
              ? 'Examiner Trap Catalog & 95+ Playbook'
              : 'All-Module OS Formula Cheat Sheet'}
          </h1>
          <p className="text-xs font-mono text-[var(--ink-muted)] tabular-nums">
            {COURSE_META.code} · SLIDE DECKS, CHAPTERS, 50 SM-2 LEITNER CARDS, 20 DEDUCTION TRAPS &amp; 2-PAGE A4 CHEAT SHEET
          </p>
        </div>

        {/* Top 4-Mode Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 self-start md:self-auto no-print">
          <button
            type="button"
            onClick={() => setActiveTab('appendix')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-[2px] border transition-colors ${
              activeTab === 'appendix'
                ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)]'
                : 'bg-[var(--bg-paper)] text-[var(--ink-primary)] border-[var(--rule-strong)] hover:bg-[var(--bg-recessed)]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Module Appendix</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('flashcards')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-[2px] border transition-colors ${
              activeTab === 'flashcards'
                ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)]'
                : 'bg-[var(--bg-paper)] text-[var(--ink-primary)] border-[var(--rule-strong)] hover:bg-[var(--bg-recessed)]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>SM-2 Flashcards (50)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('traps')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-[2px] border transition-colors ${
              activeTab === 'traps'
                ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)]'
                : 'bg-[var(--bg-paper)] text-[var(--ink-primary)] border-[var(--rule-strong)] hover:bg-[var(--bg-recessed)]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-[var(--div-danger)]" />
            <span>20 Examiner Traps</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cheatsheet')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-[2px] border transition-colors ${
              activeTab === 'cheatsheet'
                ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)]'
                : 'bg-[var(--bg-paper)] text-[var(--ink-primary)] border-[var(--rule-strong)] hover:bg-[var(--bg-recessed)]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Formula Sheet</span>
          </button>

          <button
            type="button"
            onClick={handlePrintCheatSheet}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#1C1B18] bg-[#E5B82E] hover:bg-[#d8ab22] border border-[#1C1B18] rounded-[2px] step-hinge whitespace-nowrap"
            title="Print 2-Page A4 Portrait Cheat Sheet"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print A4</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-VIEW 1: MODULE REFERENCE APPENDIX (Slides, Chapters, Lab & Past Qs) */}
      {/* ========================================================================= */}
      {activeTab === 'appendix' && (
        <div className="space-y-6">
          {/* Module Selector Pill Bar */}
          <div className="flex flex-col sm:flex-row items-stretch gap-2 no-print">
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-5 gap-2">
              {MODULES.map((mod) => {
                const active = mod.id === selectedModuleId;
                const pal = MODULE_PALETTE[mod.id];
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => setSelectedModuleId(mod.id)}
                    className={`px-3 py-2 text-xs font-bold rounded-[2px] border transition-colors flex items-center justify-between gap-2 tabular-nums ${
                      active
                        ? 'border-[var(--ink-primary)] shadow-sm'
                        : 'border-[var(--rule-hairline)] bg-[var(--bg-paper)] text-[var(--ink-secondary)] hover:bg-[var(--bg-recessed)]'
                    }`}
                    style={
                      active
                        ? { backgroundColor: pal.hex, color: pal.ink }
                        : undefined
                    }
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-black/30 shrink-0"
                        style={{ backgroundColor: pal.hex }}
                        aria-hidden="true"
                      />
                      <span className="truncate">{mod.code} · {mod.shortTitle}</span>
                    </span>
                    <span className="font-mono text-[11px] opacity-85 shrink-0">{mod.hours}h</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Module Context Ribbon */}
          <div className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[3px] overflow-hidden">
            <div
              className="px-5 py-2 border-b border-[var(--rule-hairline)] flex flex-wrap items-center justify-between gap-2 text-xs font-mono font-bold"
              style={{
                backgroundColor: MODULE_PALETTE[activeModule.id].hex,
                color: MODULE_PALETTE[activeModule.id].ink,
              }}
            >
              <span>{activeModule.code} REFERENCE APPENDIX · {activeModule.title.toUpperCase()}</span>
              <span>{activeModule.hours} LECTURE HOURS · WEIGHT: {activeModule.weightPct}%</span>
            </div>
            <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[var(--bg-sheet)]">
              <div className="space-y-0.5">
                <h2 className="text-base sm:text-lg font-bold text-[var(--ink-primary)]">
                  {activeModule.title} ({activeModule.co})
                </h2>
                <p className="text-xs text-[var(--ink-muted)] font-mono">
                  Primary Source: {COURSE_META.textbook}
                </p>
              </div>

              {onNavigateToModule && (
                <button
                  type="button"
                  onClick={() => onNavigateToModule(activeModule.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-paper)] text-[var(--ink-primary)] hover:bg-[var(--bg-recessed)] self-start md:self-auto step-hinge"
                >
                  <span>Open Full Syllabus Reading Notes</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 2-Column Physical Binder Reference Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 6 Columns: Course Material Files + Textbook Study Pack */}
            <div className="lg:col-span-6 space-y-6">
              {/* Course Attached Files */}
              <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[3px] p-5 space-y-4">
                <div className="flex items-center justify-between gap-2 border-b border-[var(--rule-hairline)] pb-3">
                  <h3 className="text-sm sm:text-base font-bold text-[var(--ink-primary)] flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-[var(--div-m4)]" />
                    Official Course Documents &amp; Silberschatz Slides
                  </h3>
                  <span className="font-mono text-xs text-[var(--ink-muted)]">Verified PDFs</span>
                </div>

                <ul className="divide-y divide-[var(--rule-hairline)]">
                  {COURSE_ATTACHED_FILES.map((file) => (
                    <li key={file.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-0.5">
                          <span className="text-xs sm:text-sm font-semibold text-[var(--ink-primary)] block">
                            {file.label}
                          </span>
                          <p className="text-[11px] font-mono text-[var(--ink-muted)]">
                            {file.detail}
                          </p>
                        </div>

                        {file.href ? (
                          <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                            <a
                              href={file.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-semibold rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-sheet)] text-[var(--ink-primary)] hover:bg-[var(--bg-recessed)]"
                            >
                              <span>View</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                            <a
                              href={file.href}
                              download
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-semibold rounded-[2px] border border-[var(--ink-primary)] bg-[var(--ink-primary)] text-[var(--bg-paper)] hover:opacity-90"
                            >
                              <Download className="w-3 h-3" />
                              <span>Get</span>
                            </a>
                          </div>
                        ) : (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-[2px] bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] text-[var(--ink-muted)] shrink-0">
                            Available in Slot Matrix
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Module Textbook Study Pack */}
              <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[3px] p-5 space-y-4">
                <h3 className="text-sm sm:text-base font-bold text-[var(--ink-primary)] flex items-center gap-2 border-b border-[var(--rule-hairline)] pb-3">
                  <BookOpen className="w-4 h-4 text-[var(--div-m2)]" />
                  {activeModule.code} Textbook Chapters ({COURSE_META.textbook})
                </h3>

                <div className="space-y-2.5">
                  {activeStudyPack.silberschatzChapters.map((chap, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px] text-xs leading-relaxed font-mono text-[var(--ink-primary)]"
                    >
                      {chap}
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-[var(--rule-hairline)] space-y-2">
                  <h4 className="text-xs font-bold text-[var(--ink-secondary)] uppercase tracking-wide">
                    Mapped VITC Lab Experiments:
                  </h4>
                  <ul className="text-xs font-mono text-[var(--ink-muted)] space-y-1 list-disc pl-4">
                    {activeStudyPack.labExperiments.map((exp, idx) => (
                      <li key={idx} className="text-[var(--ink-primary)]">{exp}</li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-[var(--rule-hairline)] space-y-2">
                  <h4 className="text-xs font-bold text-[var(--ink-secondary)] uppercase tracking-wide">
                    Real FAT Past Paper Question Citations:
                  </h4>
                  <div className="space-y-1.5">
                    {activeStudyPack.pastPaperQuestions.map((q, idx) => (
                      <div
                        key={idx}
                        className="text-xs font-mono p-2 rounded-[2px] bg-[var(--bg-board)] border border-[var(--rule-hairline)] text-[var(--ink-primary)]"
                      >
                        {q}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Interactive Revision Checklist */}
                <div className="pt-3 border-t border-[var(--rule-hairline)] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[var(--ink-secondary)] uppercase tracking-wide flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[var(--div-m3)]" />
                      Module Master Revision Checklist:
                    </h4>
                    <span className="font-mono text-[11px] text-[var(--ink-muted)]">
                      {activeStudyPack.revisionChecklist.filter((_, i) =>
                        completedChecks.includes(`${activeModule.id}-ck-${i}`)
                      ).length}
                      /{activeStudyPack.revisionChecklist.length} checked
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {activeStudyPack.revisionChecklist.map((item, idx) => {
                      const checkId = `${activeModule.id}-ck-${idx}`;
                      const isDone = completedChecks.includes(checkId);
                      return (
                        <button
                          key={checkId}
                          type="button"
                          onClick={() => toggleChecklist(checkId)}
                          className={`w-full text-left p-2.5 rounded-[2px] border text-xs flex items-start gap-2.5 transition-colors ${
                            isDone
                              ? 'bg-[#4F8A3D]/10 border-[#4F8A3D]/40 text-[var(--ink-primary)]'
                              : 'bg-[var(--bg-sheet)] border-[var(--rule-hairline)] text-[var(--ink-secondary)] hover:bg-[var(--bg-recessed)]'
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded-[2px] border flex items-center justify-center shrink-0 mt-0.5 ${
                              isDone
                                ? 'bg-[#4F8A3D] border-[#4F8A3D] text-white'
                                : 'border-[var(--rule-strong)] bg-[var(--bg-paper)]'
                            }`}
                          >
                            {isDone && <Check className="w-3 h-3" />}
                          </span>
                          <span className={`leading-snug ${isDone ? 'line-through opacity-75' : ''}`}>
                            {item}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Right 6 Columns: Critical Rules, Comparison Table & Expected FAT Prompts */}
            <div className="lg:col-span-6 space-y-6">
              {/* Critical Rules & Invariants */}
              <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[3px] p-5 space-y-4">
                <h3 className="text-sm sm:text-base font-bold text-[var(--ink-primary)] border-b border-[var(--rule-hairline)] pb-3 flex items-center justify-between">
                  <span>{activeModule.code} Critical Rules &amp; Mathematical Invariants</span>
                  <span className="font-mono text-xs text-[var(--ink-muted)]">{activeModule.criticalRules.length} Rules</span>
                </h3>

                <dl className="divide-y divide-[var(--rule-hairline)]">
                  {activeModule.criticalRules.map((rule, idx) => (
                    <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-start gap-2.5">
                      <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded-[2px] bg-[var(--bg-board)] border border-[var(--rule-hairline)] text-[var(--ink-primary)] shrink-0 mt-0.5">
                        R{idx + 1}
                      </span>
                      <dd className="text-xs sm:text-[13px] font-mono leading-relaxed text-[var(--ink-primary)]">
                        {rule}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Module Comparison Matrix */}
              <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[3px] p-5 space-y-3 overflow-x-auto">
                <h3 className="text-sm sm:text-base font-bold text-[var(--ink-primary)] border-b border-[var(--rule-hairline)] pb-2.5">
                  {activeModule.comparisonTable.title}
                </h3>
                <table className="w-full text-left border-collapse text-xs tabular-nums">
                  <thead>
                    <tr className="border-b border-[var(--rule-strong)] bg-[var(--bg-recessed)] text-[var(--ink-primary)] font-mono">
                      {activeModule.comparisonTable.headers.map((h, idx) => (
                        <th key={idx} className="py-2 px-2.5 font-bold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--rule-hairline)]">
                    {activeModule.comparisonTable.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-[var(--bg-sheet)]">
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className={`py-2 px-2.5 align-top leading-snug ${
                              cIdx === 0
                                ? 'font-bold text-[var(--ink-primary)] whitespace-nowrap'
                                : 'text-[var(--ink-secondary)]'
                            }`}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Expected VIT FAT Exam Prompts */}
              <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[3px] p-5 space-y-3">
                <h3 className="text-sm sm:text-base font-bold text-[var(--ink-primary)] border-b border-[var(--rule-hairline)] pb-2.5">
                  Recurring VIT FAT Exam Prompts ({activeModule.code})
                </h3>
                <ol className="space-y-2.5 text-xs sm:text-sm text-[var(--ink-primary)]">
                  {activeModule.expectedPrompts.map((prompt, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded-[2px] bg-[#E5B82E] text-[#1C1B18] shrink-0 mt-0.5">
                        Q{idx + 1}
                      </span>
                      <span className="leading-relaxed prose-manual text-xs sm:text-sm">{prompt}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 2: 50 SM-2 FLASHCARD DECK & LEITNER SPACED-REPETITION TRACKING */}
      {/* ========================================================================= */}
      {activeTab === 'flashcards' && (
        <div className="space-y-6" data-testid="flashcard-deck">
          {/* Controls: Module filter, Queue filter, SRS Profile toggle */}
          <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[3px] p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Module Filter Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
                {(['all', 'm1', 'm2', 'm3', 'm4', 'm5'] as const).map((mf) => (
                  <button
                    key={mf}
                    type="button"
                    onClick={() => {
                      setFcModuleFilter(mf);
                      setCardIdx(0);
                      setFlipped(false);
                    }}
                    className={`px-2.5 py-1 font-bold rounded-[2px] border uppercase transition-colors ${
                      fcModuleFilter === mf
                        ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)]'
                        : 'bg-[var(--bg-sheet)] text-[var(--ink-secondary)] border-[var(--rule-hairline)] hover:bg-[var(--bg-recessed)]'
                    }`}
                  >
                    {mf === 'all' ? 'All (50)' : mf}
                  </button>
                ))}
              </div>

              {/* Profile Toggle (48h Sprint vs Longterm SM-2) */}
              <div className="inline-flex rounded-[2px] border border-[var(--rule-strong)] overflow-hidden font-mono text-xs">
                <button
                  type="button"
                  onClick={() => onChangeSrsProfile('fat48h')}
                  className={`px-3 py-1 font-semibold transition-colors ${
                    srsProfile === 'fat48h'
                      ? 'bg-[var(--div-m2)] text-white'
                      : 'bg-[var(--bg-paper)] text-[var(--ink-secondary)] hover:bg-[var(--bg-recessed)]'
                  }`}
                  title="Compressed minute/hour intervals for 48-hour exam cramming"
                >
                  48h FAT Sprint
                </button>
                <button
                  type="button"
                  onClick={() => onChangeSrsProfile('longterm')}
                  className={`px-3 py-1 font-semibold transition-colors ${
                    srsProfile === 'longterm'
                      ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)]'
                      : 'bg-[var(--bg-paper)] text-[var(--ink-secondary)] hover:bg-[var(--bg-recessed)]'
                  }`}
                  title="Standard SuperMemo-2 day intervals for long-term retention"
                >
                  Long-Term SM-2
                </button>
              </div>
            </div>

            {/* Leitner Spaced-Repetition Box Distribution Strip */}
            <div className="pt-3 border-t border-[var(--rule-hairline)] space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-mono font-bold text-[var(--ink-primary)] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[var(--div-m1)]" />
                  Leitner Spaced-Repetition System (5 Boxes):
                </span>
                <span className="font-mono text-[11px] text-[var(--ink-muted)]">
                  Click a box to filter queue
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-xs">
                {[
                  { b: 1 as const, name: 'Box 1: Daily', desc: '0 Reps / Reset', col: 'border-red-500/40 text-red-600' },
                  { b: 2 as const, name: 'Box 2: 3-Day', desc: '1 Rep · Learning', col: 'border-orange-500/40 text-orange-600' },
                  { b: 3 as const, name: 'Box 3: 1-Week', desc: '2 Reps · Reviewing', col: 'border-yellow-600/40 text-yellow-700' },
                  { b: 4 as const, name: 'Box 4: 2-Weeks', desc: '3 Reps · Retained', col: 'border-teal-500/40 text-teal-600' },
                  { b: 5 as const, name: 'Box 5: Mastered', desc: '4+ Reps · Permanent', col: 'border-green-600/40 text-green-700' },
                ].map((item) => {
                  const count = leitnerCounts[item.b];
                  const isSelected = fcLeitnerFilter === item.b;
                  return (
                    <button
                      key={item.b}
                      type="button"
                      onClick={() => {
                        setFcLeitnerFilter(isSelected ? 'all' : item.b);
                        setCardIdx(0);
                        setFlipped(false);
                      }}
                      className={`p-2 rounded-[2px] border text-left transition-all ${
                        isSelected
                          ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)] shadow-sm'
                          : 'bg-[var(--bg-sheet)] hover:bg-[var(--bg-recessed)] ' + item.col
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span>{item.name}</span>
                        <span className="text-sm tabular-nums">{count}</span>
                      </div>
                      <div className="text-[10px] opacity-75 truncate">{item.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4-Bucket Retention Forecast Strip */}
            <div className="grid grid-cols-4 gap-2 font-mono text-xs tabular-nums text-center pt-1">
              <div className="p-2 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px]">
                <div className="text-[var(--div-danger)] font-bold text-sm">{forecast.dueNow}</div>
                <div className="text-[10px] text-[var(--ink-muted)]">Due Now</div>
              </div>
              <div className="p-2 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px]">
                <div className="text-[var(--div-m2)] font-bold text-sm">{forecast.within2h}</div>
                <div className="text-[10px] text-[var(--ink-muted)]">&lt; 2 Hours</div>
              </div>
              <div className="p-2 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px]">
                <div className="text-[var(--div-m4)] font-bold text-sm">{forecast.within12h}</div>
                <div className="text-[10px] text-[var(--ink-muted)]">&lt; 12 Hours</div>
              </div>
              <div className="p-2 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px]">
                <div className="text-[var(--div-m3)] font-bold text-sm">{forecast.later}</div>
                <div className="text-[10px] text-[var(--ink-muted)]">Later / Mastered</div>
              </div>
            </div>
          </div>

          {/* Flashcard 3D Interactive Card Plate */}
          {currentCard ? (
            <div className="space-y-4">
              <div
                className="w-full relative min-h-[300px] select-none cursor-pointer"
                style={{ perspective: '1200px' }}
                onClick={() => setFlipped((f) => !f)}
                title="Click card or press Spacebar to flip"
              >
                <div
                  className="w-full min-h-[300px] relative transition-transform duration-500 rounded-[3px] border border-[var(--rule-strong)] shadow-md"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  }}
                >
                  {/* CARD FRONT */}
                  <div
                    className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-between bg-[var(--bg-paper)] rounded-[2px] overflow-y-auto"
                    style={{
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                    }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--rule-hairline)] font-mono text-xs text-[var(--ink-muted)] tabular-nums">
                      <div className="flex items-center gap-2">
                        <span className="font-bold px-2 py-0.5 rounded-[2px] bg-[var(--bg-board)] border border-[var(--rule-hairline)] text-[var(--ink-primary)]">
                          {currentCard.moduleId.toUpperCase()}
                        </span>
                        <span className="font-semibold text-[var(--ink-secondary)]">
                          {currentCard.tag}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* 5-Pip Leitner Visual */}
                        <div
                          className="flex items-center gap-1"
                          title={getLeitnerBox(srsStates[currentCard.id]?.repetitions ?? 0).label}
                        >
                          {[1, 2, 3, 4, 5].map((b) => (
                            <span
                              key={b}
                              className={`h-2 w-3 rounded-[1px] border border-[var(--rule-strong)] ${
                                b <= getLeitnerBox(srsStates[currentCard.id]?.repetitions ?? 0).box
                                  ? 'bg-[#4F8A3D]'
                                  : 'bg-transparent'
                              }`}
                            />
                          ))}
                        </div>
                        <span>
                          Card {cardIdx + 1} / {filteredCards.length}
                        </span>
                      </div>
                    </div>

                    <div className="py-6 flex flex-col justify-center space-y-3">
                      <span className="font-mono text-[11px] font-bold text-[var(--ink-muted)] uppercase tracking-wider">
                        Prompt (Press Space or Click to Reveal Answer):
                      </span>
                      <div className="prose-manual text-base sm:text-xl font-medium text-[var(--ink-primary)] leading-relaxed">
                        <MarkdownBlock content={currentCard.front} />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[var(--rule-hairline)] flex items-center justify-between text-xs font-mono text-[var(--ink-muted)]">
                      <span>Click anywhere or press [Space] to flip</span>
                      <span>
                        EF: {(srsStates[currentCard.id]?.easeFactor ?? 2.5).toFixed(2)} · Reps:{' '}
                        {srsStates[currentCard.id]?.repetitions ?? 0}
                      </span>
                    </div>
                  </div>

                  {/* CARD BACK */}
                  <div
                    className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-between bg-[var(--bg-paper)] rounded-[2px] overflow-y-auto"
                    style={{
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                    }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--rule-hairline)] font-mono text-xs text-[var(--ink-muted)] tabular-nums">
                      <div className="flex items-center gap-2">
                        <span className="font-bold px-2 py-0.5 rounded-[2px] bg-[#4F8A3D] text-[#FAF7F0]">
                          Verified Marking Rubric Hook
                        </span>
                        <span className="font-semibold text-[var(--ink-secondary)]">
                          {currentCard.tag}
                        </span>
                      </div>

                      <span>
                        {getLeitnerBox(srsStates[currentCard.id]?.repetitions ?? 0).label}
                      </span>
                    </div>

                    <div className="py-5 flex flex-col justify-center space-y-2">
                      <span className="font-mono text-[11px] font-bold text-[#4F8A3D] uppercase tracking-wider">
                        Examiner Key Points &amp; Answer:
                      </span>
                      <div className="prose-manual text-sm sm:text-base text-[var(--ink-primary)] leading-relaxed">
                        <MarkdownBlock content={currentCard.back} />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[var(--rule-hairline)] flex items-center justify-between text-xs font-mono text-[var(--ink-muted)]">
                      <span>Rate card recall below using [1], [2], [3], [4]</span>
                      <span>
                        Lapses: {srsStates[currentCard.id]?.lapses ?? 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Toolbar Below Card */}
              <div className="p-4 bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[3px] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFlipped(false);
                      setCardIdx((i) => (i - 1 + filteredCards.length) % filteredCards.length);
                    }}
                    className="px-3 py-1.5 text-xs font-mono rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-sheet)] text-[var(--ink-primary)] hover:bg-[var(--bg-recessed)] inline-flex items-center gap-1"
                    title="Previous card (Left Arrow)"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Prev</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFlipped((f) => !f)}
                    className="px-4 py-1.5 text-xs font-bold rounded-[2px] border border-[var(--ink-primary)] bg-[var(--ink-primary)] text-[var(--bg-paper)] inline-flex items-center gap-1.5 step-hinge"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>{flipped ? 'Show Question Prompt' : 'Reveal Answer (Space)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFlipped(false);
                      setCardIdx((i) => (i + 1) % filteredCards.length);
                    }}
                    className="px-3 py-1.5 text-xs font-mono rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-sheet)] text-[var(--ink-primary)] hover:bg-[var(--bg-recessed)] inline-flex items-center gap-1"
                    title="Next card (Right Arrow)"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Rating Buttons (Shown always or when flipped) */}
                <div className="flex flex-wrap items-center gap-2 font-mono text-xs tabular-nums">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRate('again');
                    }}
                    className="px-3 py-1.5 rounded-[2px] border font-bold bg-[var(--bg-sheet)] hover:bg-red-500/10 border-[var(--div-danger)] text-[var(--div-danger)] step-hinge"
                    title="Reset repetition count to 0 (Leitner Box 1)"
                  >
                    [1] Again ({nextIntervals.again})
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRate('hard');
                    }}
                    className="px-3 py-1.5 rounded-[2px] border font-bold bg-[var(--bg-sheet)] hover:bg-orange-500/10 border-[var(--div-m2)] text-[var(--div-m2)] step-hinge"
                  >
                    [2] Hard ({nextIntervals.hard})
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRate('good');
                    }}
                    className="px-3 py-1.5 rounded-[2px] border font-bold bg-[var(--bg-sheet)] hover:bg-green-500/10 border-[var(--div-m3)] text-[var(--div-m3)] step-hinge"
                    title="Advance to next Leitner Box"
                  >
                    [3] Good ({nextIntervals.good})
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRate('easy');
                    }}
                    className="px-3 py-1.5 rounded-[2px] border font-bold bg-[var(--bg-sheet)] hover:bg-blue-500/10 border-[var(--div-m5)] text-[var(--div-m5)] step-hinge"
                    title="Bonus interval jump + ease factor increase"
                  >
                    [4] Easy ({nextIntervals.easy})
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[3px] text-center font-mono text-xs sm:text-sm text-[var(--ink-muted)] space-y-3">
              <CheckCircle2 className="w-8 h-8 text-[#4F8A3D] mx-auto" />
              <p className="font-bold text-[var(--ink-primary)]">
                All filtered flashcards completed!
              </p>
              <button
                type="button"
                onClick={() => {
                  setFcModuleFilter('all');
                  setFcQueueFilter('all');
                  setFcLeitnerFilter('all');
                  setCardIdx(0);
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-[2px] border border-[var(--ink-primary)] bg-[var(--ink-primary)] text-[var(--bg-paper)] inline-flex items-center gap-1.5"
              >
                Reset Filters &amp; View All 50 Cards
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 3: EXAMINER TRAP CATALOG (20 High-Frequency Traps & Playbook)   */}
      {/* ========================================================================= */}
      {activeTab === 'traps' && (
        <div className="space-y-6" data-testid="examiner-traps-view">
          {/* Sub-tab Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[var(--rule-hairline)]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTrapSubTab('traps')}
                className={`px-3 py-1.5 text-xs font-bold rounded-[2px] border inline-flex items-center gap-1.5 ${
                  trapSubTab === 'traps'
                    ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)]'
                    : 'bg-[var(--bg-paper)] text-[var(--ink-secondary)] border-[var(--rule-hairline)] hover:bg-[var(--bg-recessed)]'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-[var(--div-danger)]" />
                <span>20 Trap Busters ({lockedTrapIds.length}/20 Defused)</span>
              </button>

              <button
                type="button"
                onClick={() => setTrapSubTab('blueprints')}
                className={`px-3 py-1.5 text-xs font-bold rounded-[2px] border inline-flex items-center gap-1.5 ${
                  trapSubTab === 'blueprints'
                    ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)]'
                    : 'bg-[var(--bg-paper)] text-[var(--ink-secondary)] border-[var(--rule-hairline)] hover:bg-[var(--bg-recessed)]'
                }`}
              >
                <Award className="w-3.5 h-3.5 text-[#E5B82E]" />
                <span>Q1–Q10 Answer Blueprints</span>
              </button>

              <button
                type="button"
                onClick={() => setTrapSubTab('pacing')}
                className={`px-3 py-1.5 text-xs font-bold rounded-[2px] border inline-flex items-center gap-1.5 ${
                  trapSubTab === 'pacing'
                    ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)]'
                    : 'bg-[var(--bg-paper)] text-[var(--ink-secondary)] border-[var(--rule-hairline)] hover:bg-[var(--bg-recessed)]'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-[var(--div-m2)]" />
                <span>3-Hour FAT Pacing Plan</span>
              </button>
            </div>

            {trapSubTab === 'traps' && (
              <span className="font-mono text-xs text-[var(--ink-muted)] tabular-nums">
                {lockedTrapIds.length === 20 ? (
                  <span className="text-[#4F8A3D] font-bold">✓ 100% Traps Guarded</span>
                ) : (
                  <span>{20 - lockedTrapIds.length} Vulnerabilities Remaining</span>
                )}
              </span>
            )}
          </div>

          {/* TAB A: 20 TRAP BUSTERS */}
          {trapSubTab === 'traps' && (
            <div className="space-y-4">
              {/* Filter and Search Bar */}
              <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[3px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-[var(--ink-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={trapSearchQuery}
                    onChange={(e) => setTrapSearchQuery(e.target.value)}
                    placeholder="Search 20 traps (e.g. 'banker', 'segmentation', 'tlb', 'mutex')..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs font-mono bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px] text-[var(--ink-primary)] focus:outline-none focus:border-[var(--ink-primary)]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
                  {(['all', 'm1', 'm2', 'm3', 'm4', 'm5'] as const).map((tf) => (
                    <button
                      key={tf}
                      type="button"
                      onClick={() => setTrapModuleFilter(tf)}
                      className={`px-2 py-0.5 rounded-[2px] border font-bold uppercase ${
                        trapModuleFilter === tf
                          ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)]'
                          : 'bg-[var(--bg-sheet)] text-[var(--ink-secondary)] border-[var(--rule-hairline)] hover:bg-[var(--bg-recessed)]'
                      }`}
                    >
                      {tf === 'all' ? 'All (20)' : tf}
                    </button>
                  ))}
                </div>
              </div>

              {/* Progress bar of Defused Traps */}
              <div className="bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#4F8A3D]" />
                  <span>
                    Trap Defusal Progress:{' '}
                    <strong className="text-[var(--ink-primary)] tabular-nums">
                      {lockedTrapIds.length} / 20
                    </strong>{' '}
                    ({Math.round((lockedTrapIds.length / 20) * 100)}% Safe from Careless -2M Deductions)
                  </span>
                </div>
                <div className="w-full sm:w-48 bg-[var(--bg-recessed)] h-2 rounded-[2px] overflow-hidden border border-[var(--rule-hairline)]">
                  <div
                    className="bg-[#4F8A3D] h-full transition-all duration-300"
                    style={{ width: `${(lockedTrapIds.length / 20) * 100}%` }}
                  />
                </div>
              </div>

              {/* 20 Trap Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTraps.map((trap) => {
                  const isLocked = lockedTrapIds.includes(trap.id);
                  return (
                    <div
                      key={trap.id}
                      className={`bg-[var(--bg-paper)] border rounded-[3px] p-4 space-y-3 transition-colors ${
                        isLocked
                          ? 'border-[#4F8A3D]/40 bg-[#4F8A3D]/5'
                          : 'border-[var(--rule-hairline)]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 font-mono text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold px-2 py-0.5 rounded-[2px] bg-[var(--bg-board)] border border-[var(--rule-hairline)] text-[var(--ink-primary)]">
                            {trap.moduleCode}
                          </span>
                          <span className="font-bold px-2 py-0.5 rounded-[2px] bg-red-500/10 text-[var(--div-danger)] border border-red-500/20">
                            {trap.penalty} Deduction
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleTrapLock(trap.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[2px] border text-xs font-bold transition-colors ${
                            isLocked
                              ? 'bg-[#4F8A3D] text-[#FAF7F0] border-[#4F8A3D]'
                              : 'bg-[var(--bg-sheet)] text-[var(--ink-secondary)] border-[var(--rule-hairline)] hover:bg-[var(--bg-recessed)]'
                          }`}
                        >
                          {isLocked ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Guarded</span>
                            </>
                          ) : (
                            <span>Mark Guarded</span>
                          )}
                        </button>
                      </div>

                      <h3 className="text-sm font-bold text-[var(--ink-primary)] leading-snug">
                        {trap.title}
                      </h3>

                      {/* Common Mistake Warning */}
                      <div className="p-2.5 rounded-[2px] bg-red-500/5 border border-red-500/20 text-xs space-y-1">
                        <div className="font-mono font-bold text-[var(--div-danger)] flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>Careless Trap Mistake:</span>
                        </div>
                        <p className="text-[var(--ink-secondary)] leading-relaxed pl-4">
                          {trap.mistake}
                        </p>
                      </div>

                      {/* Examiner Golden Rule Fix */}
                      <div className="p-2.5 rounded-[2px] bg-emerald-500/5 border border-emerald-500/20 text-xs space-y-1">
                        <div className="font-mono font-bold text-[#4F8A3D] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Examiner Fix &amp; Golden Rule:</span>
                        </div>
                        <p className="text-[var(--ink-primary)] leading-relaxed pl-4">
                          {trap.fix}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB B: Q1–Q10 ANSWER BLUEPRINTS */}
          {trapSubTab === 'blueprints' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {EXAMINER_BLUEPRINTS.map((bp) => (
                  <div
                    key={bp.qNo}
                    className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[3px] p-4 sm:p-5 space-y-3"
                  >
                    <div className="flex items-center justify-between font-mono text-xs">
                      <span className="font-bold px-2 py-0.5 rounded-[2px] bg-[var(--bg-board)] border border-[var(--rule-hairline)] text-[var(--ink-primary)]">
                        {bp.qNo} · {bp.moduleId.toUpperCase()} · {bp.marks}
                      </span>
                      <span className="text-[var(--ink-muted)]">Bloom: {bp.bloom}</span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-[var(--ink-primary)]">
                      {bp.archetype}
                    </h3>

                    <div className="text-xs space-y-1">
                      <strong className="font-mono text-[var(--ink-muted)] uppercase tracking-wide">
                        Marking Rubric:
                      </strong>
                      <p className="text-[var(--ink-secondary)] leading-relaxed">{bp.markingRubric}</p>
                    </div>

                    <div className="pt-2 border-t border-[var(--rule-hairline)] text-xs space-y-1.5">
                      <strong className="font-mono text-[var(--div-m3)] uppercase tracking-wide">
                        Mandatory Examiner Checkpoints (Must Include):
                      </strong>
                      <ul className="list-disc pl-4 space-y-0.5 text-[var(--ink-primary)]">
                        {bp.mustInclude.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB C: 3-HOUR EXAM PACING PLAN */}
          {trapSubTab === 'pacing' && (
            <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[3px] p-5 space-y-4">
              <h2 className="text-base sm:text-lg font-bold text-[var(--ink-primary)] flex items-center gap-2 border-b border-[var(--rule-hairline)] pb-3">
                <Clock className="w-4 h-4 text-[var(--div-m2)]" />
                3-Hour VIT Chennai FAT Exam Hall Minute-by-Minute Pacing Strategy (180 Mins · 100 Marks)
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-[var(--bg-recessed)] border-b border-[var(--rule-strong)] font-mono text-[var(--ink-primary)]">
                      <th className="px-3 py-2.5">Window</th>
                      <th className="px-3 py-2.5">Phase</th>
                      <th className="px-3 py-2.5">Target</th>
                      <th className="px-3 py-2.5">Execution Tactic</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--rule-hairline)] text-[var(--ink-primary)]">
                    {PACING_PLAN.map((seg) => (
                      <tr key={seg.window} className="hover:bg-[var(--bg-sheet)]">
                        <td className="px-3 py-2.5 font-mono font-bold whitespace-nowrap tabular-nums">
                          {seg.window}
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-[var(--ink-primary)]">
                          {seg.phase}
                        </td>
                        <td className="px-3 py-2.5 text-[var(--ink-secondary)]">{seg.target}</td>
                        <td className="px-3 py-2.5 text-[var(--ink-secondary)]">{seg.tactic}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 4: FORMULA CHEAT SHEET & PRINTABLE PAPER MODE                   */}
      {/* ========================================================================= */}
      {activeTab === 'cheatsheet' && (
        <div className="space-y-6" data-testid="formula-cheat-sheet">
          {/* Controls: Mode Switcher (Interactive vs Printable Paper) + Print Button */}
          <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[3px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFormulaMode('interactive')}
                className={`px-3 py-1.5 text-xs font-bold rounded-[2px] border ${
                  formulaMode === 'interactive'
                    ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)]'
                    : 'bg-[var(--bg-sheet)] text-[var(--ink-secondary)] border-[var(--rule-hairline)] hover:bg-[var(--bg-recessed)]'
                }`}
              >
                Interactive Card View
              </button>
              <button
                type="button"
                onClick={() => setFormulaMode('paper')}
                className={`px-3 py-1.5 text-xs font-bold rounded-[2px] border ${
                  formulaMode === 'paper'
                    ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)]'
                    : 'bg-[var(--bg-sheet)] text-[var(--ink-secondary)] border-[var(--rule-hairline)] hover:bg-[var(--bg-recessed)]'
                }`}
              >
                Printable A4 Paper Preview
              </button>
            </div>

            <button
              type="button"
              onClick={handlePrintCheatSheet}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#1C1B18] bg-[#E5B82E] hover:bg-[#d8ab22] border border-[#1C1B18] rounded-[2px] step-hinge"
            >
              <Printer className="w-4 h-4" />
              <span>Print 2-Page A4 Sheet</span>
            </button>
          </div>

          {/* MODE A: INTERACTIVE SEARCHABLE FORMULA CARDS */}
          {formulaMode === 'interactive' && (
            <div className="space-y-4">
              <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[3px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-[var(--ink-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={formulaSearchQuery}
                    onChange={(e) => setFormulaSearchQuery(e.target.value)}
                    placeholder="Search formulas across M2–M5 (e.g. 'tlb eat', 'banker', 'inode')..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs font-mono bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px] text-[var(--ink-primary)] focus:outline-none focus:border-[var(--ink-primary)]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
                  {(['all', 'm2', 'm3', 'm4', 'm5'] as const).map((mf) => (
                    <button
                      key={mf}
                      type="button"
                      onClick={() => setFormulaModuleFilter(mf)}
                      className={`px-2.5 py-0.5 rounded-[2px] border font-bold uppercase ${
                        formulaModuleFilter === mf
                          ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)]'
                          : 'bg-[var(--bg-sheet)] text-[var(--ink-secondary)] border-[var(--rule-hairline)] hover:bg-[var(--bg-recessed)]'
                      }`}
                    >
                      {mf === 'all' ? 'All (18)' : mf}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredFormulas.map((entry) => {
                  const isCopied = copiedFormulaId === entry.id;
                  return (
                    <div
                      key={entry.id}
                      className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[3px] p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-[2px] text-white"
                            style={{
                              backgroundColor:
                                MODULE_PALETTE[entry.moduleId]?.hex ?? 'var(--ink-primary)',
                            }}
                          >
                            {entry.moduleCode}
                          </span>
                          <h3 className="text-sm font-bold text-[var(--ink-primary)]">
                            {entry.title}
                          </h3>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopyFormula(entry)}
                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-mono rounded-[2px] border transition-colors ${
                            isCopied
                              ? 'bg-[#4F8A3D] text-[#FAF7F0] border-[#4F8A3D]'
                              : 'bg-[var(--bg-sheet)] text-[var(--ink-primary)] border-[var(--rule-hairline)] hover:bg-[var(--bg-recessed)]'
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 text-white" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-[var(--ink-muted)]" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="font-mono text-xs sm:text-sm bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px] px-3 py-2 text-[var(--ink-primary)] overflow-x-auto leading-relaxed">
                        {entry.formula}
                      </div>

                      <div className="text-xs space-y-1">
                        <div className="text-[var(--ink-secondary)]">
                          <strong className="font-mono text-[11px] text-[var(--ink-muted)]">
                            Units / Conditions:{' '}
                          </strong>
                          <span>{entry.unitsOrCondition}</span>
                        </div>
                        <div className="p-2 rounded-[2px] bg-red-500/5 border border-red-500/20 text-[var(--div-danger)]">
                          <strong className="font-mono text-[11px]">Exam Trap:{' '}</strong>
                          <span>{entry.trapNote}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* MODE B: PRINTABLE A4 PAPER PREVIEW */}
          {formulaMode === 'paper' && (
            <div className="space-y-6 max-w-4xl mx-auto font-serif">
              {/* PAGE 1 PREVIEW */}
              <div className="bg-[#FAF7F0] text-[#1C1B18] border-2 border-[#1C1B18] rounded-[3px] p-6 sm:p-8 space-y-4 shadow-lg">
                <div className="flex justify-between items-baseline border-b-2 border-[#1C1B18] pb-2">
                  <div>
                    <h2 className="text-base font-bold font-sans tracking-tight">
                      {COURSE_META.code} · {COURSE_META.title} — Page 1/2
                    </h2>
                    <p className="text-[11px] font-mono text-[#555]">
                      VIT Chennai FAT · Last-Morning Technical Reference
                    </p>
                  </div>
                  <span className="font-mono text-xs font-bold">PAGE 1 / 2</span>
                </div>

                <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-[#1C1B18] border-b border-[#C5BEB0] pb-1">
                  Core Mathematical Formulas (M2–M4)
                </h3>

                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#C5BEB0] bg-[#EAE4D7] font-sans font-bold">
                      <th className="p-1.5 w-10 text-center font-mono">Mod</th>
                      <th className="p-1.5">Concept &amp; Conditions</th>
                      <th className="p-1.5 font-mono">Exact Formula</th>
                      <th className="p-1.5 text-red-800">Exam Trap</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#C5BEB0]">
                    {OS_FORMULAS.slice(0, 10).map((f) => (
                      <tr key={f.id} className="align-top">
                        <td className="p-1.5 font-mono font-bold text-center">{f.moduleCode}</td>
                        <td className="p-1.5">
                          <strong>{f.title}</strong>
                          <div className="text-[10px] text-[#555]">{f.unitsOrCondition}</div>
                        </td>
                        <td className="p-1.5 font-mono text-[11px] bg-black/5">{f.formula}</td>
                        <td className="p-1.5 text-red-800 text-[11px]">{f.trapNote}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* PAGE 2 PREVIEW */}
              <div className="bg-[#FAF7F0] text-[#1C1B18] border-2 border-[#1C1B18] rounded-[3px] p-6 sm:p-8 space-y-4 shadow-lg">
                <div className="flex justify-between items-baseline border-b-2 border-[#1C1B18] pb-2">
                  <div>
                    <h2 className="text-base font-bold font-sans tracking-tight">
                      {COURSE_META.code} · Memory, Disk, RAID &amp; Examiner Traps — Page 2/2
                    </h2>
                    <p className="text-[11px] font-mono text-[#555]">
                      VIT Chennai FAT · Last-Morning Technical Reference
                    </p>
                  </div>
                  <span className="font-mono text-xs font-bold">PAGE 2 / 2</span>
                </div>

                <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-[#1C1B18] border-b border-[#C5BEB0] pb-1">
                  Remaining Storage &amp; Security Formulas (M4–M5)
                </h3>

                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#C5BEB0] bg-[#EAE4D7] font-sans font-bold">
                      <th className="p-1.5 w-10 text-center font-mono">Mod</th>
                      <th className="p-1.5">Concept &amp; Conditions</th>
                      <th className="p-1.5 font-mono">Exact Formula</th>
                      <th className="p-1.5 text-red-800">Exam Trap</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#C5BEB0]">
                    {OS_FORMULAS.slice(10).map((f) => (
                      <tr key={f.id} className="align-top">
                        <td className="p-1.5 font-mono font-bold text-center">{f.moduleCode}</td>
                        <td className="p-1.5">
                          <strong>{f.title}</strong>
                          <div className="text-[10px] text-[#555]">{f.unitsOrCondition}</div>
                        </td>
                        <td className="p-1.5 font-mono text-[11px] bg-black/5">{f.formula}</td>
                        <td className="p-1.5 text-red-800 text-[11px]">{f.trapNote}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-[#1C1B18] border-b border-[#C5BEB0] pb-1 pt-2">
                  Top 12 Careless -2M Examiner Traps to Audit
                </h3>

                <ul className="text-[11px] space-y-1 list-disc pl-4 text-[#1C1B18]">
                  {EXAMINER_TRAPS.slice(0, 12).map((t) => (
                    <li key={t.id}>
                      <strong>[{t.moduleCode}] {t.title}:</strong> {t.fix}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
