import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CalendarClock,
  ClipboardCheck,
  Compass,
  FileCheck2,
  FlaskConical,
  Layers,
  Moon,
  Sigma,
  Sun,
} from 'lucide-react';
import { ExamCountdown } from './components/ExamCountdown';
import { FatMockView, MockSubView } from './components/FatMockView';
import { FormulaQuickRef } from './components/FormulaQuickRef';
import { InteractiveLabsView, LabTabId } from './components/InteractiveLabsView';
import { MasteryConfettiOverlay } from './components/MasteryConfettiOverlay';
import { PredictionView } from './components/PredictionView';
import { ReferenceView } from './components/ReferenceView';
import { SprintPlannerView } from './components/SprintPlannerView';
import { StandingView } from './components/StandingView';
import { SyllabusView } from './components/SyllabusView';
import {
  COURSE_META,
  DIVISION_WHEEL,
  FLASHCARDS,
  MOCK_MCQS,
  MODULES,
  SPRINT_BLOCKS,
} from './data/courseData';
import { ConfettiParticle, generateConfettiParticles } from './utils/confettiEngine';
import { solveLeafAlpha } from './utils/contrastSolver';
import {
  DARK_MODE_STORAGE_KEY,
  resolveInitialTheme,
} from './utils/darkModeEngine';
import { computeReadiness } from './utils/readinessEngine';
import { SrsCardState, SrsProfile, SrsRating, reviewCard } from './utils/srsEngine';
import { StandingModuleResult } from './utils/standingEngine';
import {
  WeakTopicRecord,
  WeakTopicSource,
  getSortedWeakTopics,
  markWeakTopicReviewed,
  recordWeakTopicMiss,
} from './utils/weakTopicsEngine';

type AppView = 'standing' | 'sprint' | 'syllabus' | 'reference' | 'prediction' | 'labs' | 'mock';
type ModuleId = 'm1' | 'm2' | 'm3' | 'm4' | 'm5';

const KEYS = {
  activeView: 'bacse106_active_view_v1',
  activeModule: 'bacse106_active_module_v1',
  masteredTopics: 'bacse106_mastered_topics_v1',
  sprintBlocks: 'bacse106_sprint_blocks_v1',
  highYield: 'bacse106_high_yield_v1',
  standing: 'bacse106_standing_v1',
  srsStates: 'bacse106_srs_states_v1',
  srsProfile: 'bacse106_srs_profile_v1',
  mcqAnswers: 'bacse106_mcq_answers_v1',
  rubricScores: 'bacse106_rubric_scores_v1',
  weakTopics: 'bacse106_weak_topics_v1',
} as const;

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

const NAV_ITEMS: Array<{ id: AppView; label: string; icon: React.FC<{ className?: string }> }> = [
  { id: 'standing', label: 'Standing', icon: ClipboardCheck },
  { id: 'sprint', label: 'Sprint', icon: CalendarClock },
  { id: 'syllabus', label: 'Syllabus', icon: BookOpen },
  { id: 'reference', label: 'Reference', icon: Layers },
  { id: 'prediction', label: 'Prediction', icon: Compass },
  { id: 'labs', label: 'OS Labs', icon: FlaskConical },
  { id: 'mock', label: 'FAT Mock', icon: FileCheck2 },
];

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const stored = (() => {
      try {
        return localStorage.getItem(DARK_MODE_STORAGE_KEY);
      } catch {
        return null;
      }
    })();
    const prefersDark =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    return resolveInitialTheme(stored, prefersDark) === 'dark';
  });

  const [activeView, setActiveView] = useState<AppView>(() =>
    loadJson<AppView>(KEYS.activeView, 'standing')
  );
  const [activeModuleId, setActiveModuleId] = useState<ModuleId>(() =>
    loadJson<ModuleId>(KEYS.activeModule, 'm1')
  );
  const [focusedTopicId, setFocusedTopicId] = useState<string | null>(null);
  const [labPresetTab, setLabPresetTab] = useState<LabTabId | undefined>(undefined);
  const [mockSubView, setMockSubView] = useState<MockSubView | undefined>(undefined);

  const [masteredTopicIds, setMasteredTopicIds] = useState<string[]>(() =>
    loadJson<string[]>(KEYS.masteredTopics, [])
  );
  const [completedSprintBlockIds, setCompletedSprintBlockIds] = useState<string[]>(() =>
    loadJson<string[]>(KEYS.sprintBlocks, [])
  );
  const [highYieldOnly, setHighYieldOnly] = useState<boolean>(() =>
    loadJson<boolean>(KEYS.highYield, false)
  );
  const [standingResults, setStandingResults] = useState<Record<string, StandingModuleResult>>(() =>
    loadJson<Record<string, StandingModuleResult>>(KEYS.standing, {})
  );
  const [srsStates, setSrsStates] = useState<Record<string, SrsCardState>>(() =>
    loadJson<Record<string, SrsCardState>>(KEYS.srsStates, {})
  );
  const [srsProfile, setSrsProfile] = useState<SrsProfile>(() =>
    loadJson<SrsProfile>(KEYS.srsProfile, 'fat48h')
  );
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, number>>(() =>
    loadJson<Record<string, number>>(KEYS.mcqAnswers, {})
  );
  const [rubricScores, setRubricScores] = useState<Record<string, Record<string, number>>>(() =>
    loadJson<Record<string, Record<string, number>>>(KEYS.rubricScores, {})
  );
  const [weakTopicsMap, setWeakTopicsMap] = useState<Record<string, WeakTopicRecord>>(() =>
    loadJson<Record<string, WeakTopicRecord>>(KEYS.weakTopics, {})
  );

  const [formulaDrawerOpen, setFormulaDrawerOpen] = useState(false);
  const [confettiParticles, setConfettiParticles] = useState<ConfettiParticle[]>([]);

  // Persist dark mode & apply root class
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    try {
      localStorage.setItem(DARK_MODE_STORAGE_KEY, darkMode ? 'dark' : 'light');
    } catch {
      // ignore
    }
  }, [darkMode]);

  // Persist all user state
  useEffect(() => saveJson(KEYS.activeView, activeView), [activeView]);
  useEffect(() => saveJson(KEYS.activeModule, activeModuleId), [activeModuleId]);
  useEffect(() => saveJson(KEYS.masteredTopics, masteredTopicIds), [masteredTopicIds]);
  useEffect(() => saveJson(KEYS.sprintBlocks, completedSprintBlockIds), [completedSprintBlockIds]);
  useEffect(() => saveJson(KEYS.highYield, highYieldOnly), [highYieldOnly]);
  useEffect(() => saveJson(KEYS.standing, standingResults), [standingResults]);
  useEffect(() => saveJson(KEYS.srsStates, srsStates), [srsStates]);
  useEffect(() => saveJson(KEYS.srsProfile, srsProfile), [srsProfile]);
  useEffect(() => saveJson(KEYS.mcqAnswers, mcqAnswers), [mcqAnswers]);
  useEffect(() => saveJson(KEYS.rubricScores, rubricScores), [rubricScores]);
  useEffect(() => saveJson(KEYS.weakTopics, weakTopicsMap), [weakTopicsMap]);

  // Runtime contrast-solved acetate alpha (--leaf-tint-alpha & --active-accent)
  useEffect(() => {
    const wheelKey =
      activeView === 'syllabus'
        ? activeModuleId
        : activeView === 'labs'
          ? 'labs'
          : activeView === 'mock'
            ? 'mock'
            : activeView === 'standing'
              ? 'standing'
              : activeModuleId;
    const entry = DIVISION_WHEEL.find((d) => d.id === wheelKey) ?? DIVISION_WHEEL[0];
    const accentHex = darkMode ? entry.darkHex : entry.hex;
    const baseSheetHex = darkMode ? '#1d1b18' : '#f4efe4';
    const inkHex = darkMode ? '#ebe7df' : '#1c1b18';
    const alpha = solveLeafAlpha(accentHex, baseSheetHex, inkHex, 7.0, 0.08, darkMode ? 0.22 : 0.16);
    document.documentElement.style.setProperty('--leaf-tint-alpha', String(alpha));
    document.documentElement.style.setProperty('--active-accent', accentHex);
  }, [activeView, activeModuleId, darkMode]);

  // Global Ctrl+K / Cmd+K Formula Quick-Reference Drawer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setFormulaDrawerOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const sortedWeakTopics = useMemo(() => getSortedWeakTopics(weakTopicsMap), [weakTopicsMap]);

  const readiness = useMemo(() => {
    const standingMap: Record<string, { score: number; total: number } | undefined> = {};
    for (const [k, v] of Object.entries(standingResults)) {
      standingMap[k] = { score: v.score, total: v.total };
    }
    let mcqCorrect = 0;
    let mcqAttempted = 0;
    for (const q of MOCK_MCQS) {
      if (mcqAnswers[q.id] !== undefined) {
        mcqAttempted += 1;
        if (mcqAnswers[q.id] === q.correctIndex) mcqCorrect += 1;
      }
    }
    return computeReadiness({
      modules: MODULES.map((m) => ({
        id: m.id,
        code: m.code,
        title: m.title,
        hours: m.hours,
        topicIds: m.topics.map((t) => t.id),
      })),
      masteredTopicIds,
      completedSprintBlockIds,
      totalSprintBlocks: SPRINT_BLOCKS.length,
      standingScoresByModule: standingMap,
      flashcardReviewedCount: Object.keys(srsStates).length,
      totalFlashcards: FLASHCARDS.length,
      mcqCorrectCount: mcqCorrect,
      mcqAttemptedCount: mcqAttempted,
      totalMcqs: MOCK_MCQS.length,
      weakTopicsCount: sortedWeakTopics.length,
    });
  }, [
    standingResults,
    masteredTopicIds,
    completedSprintBlockIds,
    srsStates,
    mcqAnswers,
    sortedWeakTopics.length,
  ]);

  const handleLogWeakTopic = useCallback(
    (payload: { topicId: string; moduleId: string; topicTitle: string; source: WeakTopicSource }) => {
      setWeakTopicsMap((prev) => recordWeakTopicMiss(prev, payload));
    },
    []
  );

  const handleNavigateView = useCallback(
    (view: AppView, opts?: { moduleId?: string; topicId?: string }) => {
      if (opts?.moduleId && ['m1', 'm2', 'm3', 'm4', 'm5'].includes(opts.moduleId)) {
        setActiveModuleId(opts.moduleId as ModuleId);
      }
      if (opts?.topicId) {
        setFocusedTopicId(opts.topicId);
      }
      setActiveView(view);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    []
  );

  const handleToggleMastered = useCallback(
    (topicId: string, rect?: { x: number; y: number }) => {
      setMasteredTopicIds((prev) => {
        const exists = prev.includes(topicId);
        if (exists) return prev.filter((id) => id !== topicId);
        if (rect && typeof window !== 'undefined') {
          const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
          if (!reduced) {
            setConfettiParticles(
              generateConfettiParticles(
                rect.x,
                rect.y,
                Date.now() % 100000,
                26,
                window.innerHeight
              )
            );
          }
        }
        return [...prev, topicId];
      });
    },
    []
  );

  const handleRateSrsCard = useCallback(
    (cardId: string, rating: SrsRating) => {
      setSrsStates((prev) => ({
        ...prev,
        [cardId]: reviewCard(prev[cardId], cardId, rating, srsProfile),
      }));
    },
    [srsProfile]
  );

  return (
    <div className="min-h-screen bg-[var(--bg-desk)] text-[var(--ink-primary)] flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-1.5 focus:bg-[var(--ink-primary)] focus:text-[var(--bg-paper)] focus:rounded-[2px]"
      >
        Skip to content
      </a>

      {/* Strict 3-Zone Sticky Header */}
      <header className="sticky top-0 z-40 bg-[var(--bg-board)] border-b border-[var(--rule-strong)] no-print">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-5 h-14 flex items-center justify-between gap-3">
          {/* Zone 1: Brand */}
          <button
            type="button"
            onClick={() => handleNavigateView('standing')}
            className="flex items-center gap-2.5 text-left shrink-0"
          >
            <span
              className="w-2.5 h-7 rounded-[1px] shrink-0"
              style={{ backgroundColor: 'var(--active-accent)' }}
              aria-hidden="true"
            />
            <div>
              <div className="font-mono text-xs font-bold leading-none text-[var(--ink-primary)]">
                {COURSE_META.code} · FAT SPRINT
              </div>
              <div className="text-xs font-semibold text-[var(--ink-secondary)] leading-tight">
                Operating Systems · VITC
              </div>
            </div>
          </button>

          {/* Zone 2: Desktop 7-View Primary Nav */}
          <nav aria-label="Primary manual sections" className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavigateView(item.id)}
                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-[2px] border inline-flex items-center gap-1.5 transition-colors ${
                    active
                      ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)]'
                      : 'bg-transparent text-[var(--ink-secondary)] border-transparent hover:bg-[var(--bg-recessed)] hover:text-[var(--ink-primary)]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Utilities */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="hidden sm:block">
              <ExamCountdown variant="compact" />
            </div>

            {sortedWeakTopics.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setMockSubView('weak');
                  handleNavigateView('mock');
                }}
                className="px-2 py-1 text-xs font-mono font-bold rounded-[2px] border border-[var(--div-danger)] bg-[var(--bg-paper)] text-[var(--div-danger)] inline-flex items-center gap-1 tabular-nums"
                title="Open Weak Topics Recovery Queue"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                {sortedWeakTopics.length}
              </button>
            )}

            <button
              type="button"
              onClick={() => setFormulaDrawerOpen(true)}
              className="px-2 py-1 text-xs font-mono font-semibold rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-paper)] text-[var(--ink-primary)] hover:bg-[var(--bg-recessed)] inline-flex items-center gap-1"
              title="Open Formula Quick-Reference (Ctrl+K)"
            >
              <Sigma className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Formulas</span>
              <kbd className="hidden xl:inline text-[10px] text-[var(--ink-muted)]">^K</kbd>
            </button>

            <button
              type="button"
              onClick={() => setDarkMode((d) => !d)}
              className="p-1.5 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-paper)] text-[var(--ink-primary)] hover:bg-[var(--bg-recessed)]"
              aria-label={darkMode ? 'Switch to light manual paper mode' : 'Switch to dark warm-obsidian mode'}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Scrollable View Bar */}
        <nav
          aria-label="Mobile manual sections"
          className="lg:hidden flex items-center gap-1 overflow-x-auto px-3 py-1.5 border-t border-[var(--rule-hairline)] bg-[var(--bg-sheet)]"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigateView(item.id)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-[2px] border inline-flex items-center gap-1 whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)]'
                    : 'bg-[var(--bg-paper)] text-[var(--ink-secondary)] border-[var(--rule-hairline)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Physical 3-Column Reference Binder Frame */}
      <div className="flex-1 w-full max-w-[1440px] mx-auto px-0 sm:px-4 py-0 sm:py-5 flex">
        {/* Column 1: 44px Punched Binder Spine (lg+) */}
        <aside
          aria-hidden="true"
          className="hidden lg:flex flex-col items-center justify-between py-16 w-[44px] shrink-0 binder-spine rounded-l-[3px] border-y border-l border-[var(--rule-strong)]"
        >
          <div className="binder-hole" />
          <div className="binder-hole" />
          <div className="binder-hole" />
        </aside>

        {/* Column 2: Main Manual Sheet */}
        <main
          id="main-content"
          className="flex-1 min-w-0 bg-[var(--bg-sheet)] border-y sm:border border-[var(--rule-strong)] px-4 sm:px-7 py-6 shadow-xl"
          style={{
            backgroundImage:
              'linear-gradient(to bottom, color-mix(in srgb, var(--active-accent) calc(var(--leaf-tint-alpha) * 100%), transparent) 0px, transparent 140px)',
          }}
        >
          {activeView === 'standing' && (
            <StandingView
              standingResults={standingResults}
              onSaveModuleResult={(res) =>
                setStandingResults((prev) => ({ ...prev, [res.moduleId]: res }))
              }
              onLogWeakTopic={handleLogWeakTopic}
              onNavigateView={handleNavigateView}
            />
          )}

          {activeView === 'sprint' && (
            <SprintPlannerView
              readiness={readiness}
              masteredTopicIds={masteredTopicIds}
              completedSprintBlockIds={completedSprintBlockIds}
              highYieldOnly={highYieldOnly}
              onToggleHighYield={() => setHighYieldOnly((v) => !v)}
              onToggleSprintBlock={(id) =>
                setCompletedSprintBlockIds((prev) =>
                  prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                )
              }
              onResetSprintBlocks={() => setCompletedSprintBlockIds([])}
              onNavigateView={handleNavigateView}
            />
          )}

          {activeView === 'syllabus' && (
            <SyllabusView
              activeModuleId={activeModuleId}
              focusedTopicId={focusedTopicId}
              masteredTopicIds={masteredTopicIds}
              onSelectModule={(m) => {
                setActiveModuleId(m);
                setFocusedTopicId(null);
              }}
              onToggleMastered={handleToggleMastered}
              onLogWeakTopic={handleLogWeakTopic}
            />
          )}

          {activeView === 'reference' && (
            <ReferenceView
              srsStates={srsStates}
              srsProfile={srsProfile}
              onChangeSrsProfile={setSrsProfile}
              onRateCard={handleRateSrsCard}
            />
          )}

          {activeView === 'prediction' && (
            <PredictionView
              onOpenTopicInSyllabus={(mId, tId) =>
                handleNavigateView('syllabus', { moduleId: mId, topicId: tId })
              }
            />
          )}

          {activeView === 'labs' && (
            <InteractiveLabsView
              initialLabTab={labPresetTab}
              onLogWeakTopic={handleLogWeakTopic}
            />
          )}

          {activeView === 'mock' && (
            <FatMockView
              initialSubView={mockSubView}
              rubricScores={rubricScores}
              onUpdateRubricScore={(paperId, subPartId, score) =>
                setRubricScores((prev) => ({
                  ...prev,
                  [paperId]: { ...(prev[paperId] ?? {}), [subPartId]: score },
                }))
              }
              mcqAnswers={mcqAnswers}
              onAnswerMcq={(mcqId, chosenIndex) =>
                setMcqAnswers((prev) => ({ ...prev, [mcqId]: chosenIndex }))
              }
              onResetMcq={() => setMcqAnswers({})}
              weakTopics={sortedWeakTopics}
              onLogWeakTopic={handleLogWeakTopic}
              onMarkWeakReviewed={(topicId, resolve) =>
                setWeakTopicsMap((prev) => markWeakTopicReviewed(prev, topicId, resolve))
              }
              onOpenTopicInSyllabus={(mId, tId) =>
                handleNavigateView('syllabus', { moduleId: mId, topicId: tId })
              }
              onOpenLabPreset={(tab) => {
                setLabPresetTab(tab);
                handleNavigateView('labs');
              }}
            />
          )}
        </main>

        {/* Column 3: 36px Stepped Fore-Edge Acetate Division Rail (xl+) */}
        <aside
          aria-label="Binder division fore-edge tabs"
          className="hidden xl:flex flex-col gap-1.5 pt-4 w-[36px] shrink-0 no-print"
        >
          {DIVISION_WHEEL.filter((d) => d.id !== 'standing').map((tab) => {
            const isModule = ['m1', 'm2', 'm3', 'm4', 'm5'].includes(tab.id);
            const isActive =
              (isModule && activeView === 'syllabus' && activeModuleId === tab.id) ||
              (tab.id === 'labs' && activeView === 'labs') ||
              (tab.id === 'mock' && activeView === 'mock');
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  if (isModule) {
                    handleNavigateView('syllabus', { moduleId: tab.id });
                  } else if (tab.id === 'labs') {
                    handleNavigateView('labs');
                  } else if (tab.id === 'mock') {
                    handleNavigateView('mock');
                  }
                }}
                style={{
                  backgroundColor: isActive
                    ? darkMode
                      ? tab.darkHex
                      : tab.hex
                    : 'var(--bg-board)',
                  color: isActive ? '#111111' : 'var(--ink-secondary)',
                }}
                className="fore-edge-tab h-20 w-[34px] rounded-r-[3px] border-y border-r border-[var(--rule-strong)] font-mono text-[10px] font-bold flex items-center justify-center tracking-wide hover:translate-x-0.5"
                title={tab.label}
              >
                {tab.code}
              </button>
            );
          })}
        </aside>
      </div>

      {/* Global Overlays */}
      <FormulaQuickRef
        open={formulaDrawerOpen}
        onClose={() => setFormulaDrawerOpen(false)}
        onJumpToModule={(modId) => {
          setFormulaDrawerOpen(false);
          handleNavigateView('syllabus', { moduleId: modId });
        }}
      />

      <MasteryConfettiOverlay
        particles={confettiParticles}
        onDone={() => setConfettiParticles([])}
      />
    </div>
  );
}
