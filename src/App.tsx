import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  CalendarClock,
  ClipboardCheck,
  Compass,
  FileCheck2,
  FlaskConical,
  Gauge,
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
import { applyAspectRatioToDocument, computeAspectRatioProfile } from './utils/aspectRatioEngine';

export type AppView = 'standing' | 'sprint' | 'syllabus' | 'reference' | 'prediction' | 'labs' | 'mock';
export type ModuleId = 'm1' | 'm2' | 'm3' | 'm4' | 'm5';

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

const NAV_ITEMS: Array<{
  id: AppView;
  label: string;
  isStanding?: boolean;
  isMock?: boolean;
  icon: React.FC<{ className?: string }>;
}> = [
  { id: 'standing', label: 'Standing', isStanding: true, icon: Gauge },
  { id: 'sprint', label: 'Sprint', icon: CalendarClock },
  { id: 'syllabus', label: 'Syllabus', icon: BookOpen },
  { id: 'reference', label: 'Reference', icon: Layers },
  { id: 'prediction', label: 'Prediction', icon: Compass },
  { id: 'labs', label: 'OS Labs', icon: FlaskConical },
  { id: 'mock', label: 'FAT Mock', isMock: true, icon: FileCheck2 },
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

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (event: MediaQueryListEvent) => {
      try {
        const stored = localStorage.getItem(DARK_MODE_STORAGE_KEY);
        if (!stored) {
          setDarkMode(event.matches);
        }
      } catch {
        setDarkMode(event.matches);
      }
    };
    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, []);

  const handleToggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(DARK_MODE_STORAGE_KEY, next ? 'dark' : 'light');
      } catch {
        // ignore
      }
      return next;
    });
  };

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

  // Scroll to top on view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [activeView]);

  // Runtime contrast-solved acetate alpha & active division accent
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
    const entry = DIVISION_WHEEL[wheelKey] ?? DIVISION_WHEEL.standing;
    const accentHex = darkMode ? entry.darkHex : entry.hex;
    const baseSheetHex = darkMode ? '#1d1b18' : '#f4efe4';
    const inkHex = darkMode ? '#ebe7df' : '#1c1b18';
    const alpha = solveLeafAlpha(accentHex, baseSheetHex, inkHex, 7.0, 0.08, darkMode ? 0.22 : 0.16);
    document.documentElement.style.setProperty('--leaf-tint-alpha', String(alpha));
    document.documentElement.style.setProperty('--active-accent', accentHex);
    document.documentElement.style.setProperty('--division-accent', accentHex);
    document.documentElement.style.setProperty('--leaf-alpha', String(alpha));
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

  // Automatic Aspect Ratio & 2560x1600 Display Engine Hook
  useEffect(() => {
    const handleAspect = () => {
      const profile = computeAspectRatioProfile(
        window.innerWidth,
        window.innerHeight,
        window.screen ? window.screen.width : window.innerWidth,
        window.screen ? window.screen.height : window.innerHeight,
        window.devicePixelRatio || 1
      );
      applyAspectRatioToDocument(profile);
    };

    handleAspect();
    window.addEventListener('resize', handleAspect, { passive: true });
    return () => window.removeEventListener('resize', handleAspect);
  }, []);

  const isFullWidthSyllabus = activeView === 'syllabus';
  const containerClass = isFullWidthSyllabus
    ? 'w-full px-4 sm:px-7 lg:px-9 2xl:px-12'
    : 'w-full max-w-[1600px] 2xl:max-w-[2100px] mx-auto px-4 sm:px-6 2xl:px-8';

  // 7-Division Fore-Edge Tab Rail with proportional tab heights scaled to module lecture hours
  // M1: 6h (h-20 = 80px), M2: 10h (h-32 = 128px), M3: 10h (h-32 = 128px), M4: 10h (h-32 = 128px), M5: 9h (h-28 = 112px), LABS: h-20, MOCK: h-20
  const foreEdgeTabs = useMemo(
    () => [
      {
        id: 'm1',
        label: 'M1 · 6H',
        hex: '#E5B82E',
        darkHex: '#F0C94F',
        lightText: false,
        heightClass: 'h-20',
        isActive: (activeView === 'syllabus' || activeView === 'reference') && activeModuleId === 'm1',
        onClick: () => {
          setActiveModuleId('m1');
          setFocusedTopicId(null);
          if (activeView !== 'reference') setActiveView('syllabus');
        },
      },
      {
        id: 'm2',
        label: 'M2 · 10H',
        hex: '#E06D2B',
        darkHex: '#EF8347',
        lightText: false,
        heightClass: 'h-32',
        isActive: (activeView === 'syllabus' || activeView === 'reference') && activeModuleId === 'm2',
        onClick: () => {
          setActiveModuleId('m2');
          setFocusedTopicId(null);
          if (activeView !== 'reference') setActiveView('syllabus');
        },
      },
      {
        id: 'm3',
        label: 'M3 · 10H',
        hex: '#4F8A3D',
        darkHex: '#6CB057',
        lightText: true,
        heightClass: 'h-32',
        isActive: (activeView === 'syllabus' || activeView === 'reference') && activeModuleId === 'm3',
        onClick: () => {
          setActiveModuleId('m3');
          setFocusedTopicId(null);
          if (activeView !== 'reference') setActiveView('syllabus');
        },
      },
      {
        id: 'm4',
        label: 'M4 · 10H',
        hex: '#147E7B',
        darkHex: '#2CA5A1',
        lightText: true,
        heightClass: 'h-32',
        isActive: (activeView === 'syllabus' || activeView === 'reference') && activeModuleId === 'm4',
        onClick: () => {
          setActiveModuleId('m4');
          setFocusedTopicId(null);
          if (activeView !== 'reference') setActiveView('syllabus');
        },
      },
      {
        id: 'm5',
        label: 'M5 · 9H',
        hex: '#22559C',
        darkHex: '#4F85D1',
        lightText: true,
        heightClass: 'h-28',
        isActive: (activeView === 'syllabus' || activeView === 'reference') && activeModuleId === 'm5',
        onClick: () => {
          setActiveModuleId('m5');
          setFocusedTopicId(null);
          if (activeView !== 'reference') setActiveView('syllabus');
        },
      },
      {
        id: 'labs',
        label: 'LABS',
        hex: '#6F539B',
        darkHex: '#C46493',
        lightText: true,
        heightClass: 'h-20',
        isActive: activeView === 'labs',
        onClick: () => setActiveView('labs'),
      },
      {
        id: 'mock',
        label: '100M FAT',
        hex: '#854D2B',
        darkHex: '#6E85BD',
        lightText: true,
        heightClass: 'h-20',
        isActive: activeView === 'mock',
        onClick: () => setActiveView('mock'),
      },
    ],
    [activeView, activeModuleId]
  );

  const activeAccentEntry = useMemo(() => {
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
    return DIVISION_WHEEL[wheelKey] ?? DIVISION_WHEEL.standing;
  }, [activeView, activeModuleId]);

  const activeAccentHex = darkMode ? activeAccentEntry.darkHex : activeAccentEntry.hex;

  return (
    <div className="min-h-screen flex bg-[#26231E] dark:bg-[#100F0D] text-[#1C1B18] dark:text-[#E6E2DA] p-0 xl:p-3 transition-colors duration-200">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2.5 focus:left-4 focus:z-50 focus:px-3.5 focus:py-2 focus:bg-[#E5B82E] focus:text-[#1C1B18] focus:border focus:border-[#1C1B18] focus:text-xs focus:font-mono focus:font-semibold focus:rounded-[4px]"
      >
        Skip to main content
      </a>

      {/* Open Manual Section Board */}
      <div className="flex-1 flex bg-[#EAE4D7] dark:bg-[#171613] border border-[#1C1B18] dark:border-[#312E29] rounded-none xl:rounded-l-[6px] min-w-0 transition-colors duration-200">
        {/* Left Punched Ring-Binder Spine Margin (3 Circular Punches + Vertical Rotated Folio Stamp) */}
        <aside
          aria-hidden="true"
          className="binder-spine-margin hidden xl:flex flex-col items-center justify-between py-12 w-11 border-r border-[#C5BEB0] dark:border-[#312E29] bg-[#E5DEC9]/60 dark:bg-[#1C1A16] shrink-0 select-none transition-colors duration-200"
        >
          <div className="binder-hole" />
          <div className="binder-hole" />
          <div
            className="font-mono text-[10px] tracking-[0.22em] text-[#6E695D] dark:text-[#8F897D] uppercase whitespace-nowrap"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            BACSE106 · OPERATING SYSTEMS · VIT CHENNAI
          </div>
          <div className="binder-hole" />
        </aside>

        {/* Primary Manual Sheet Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Manual Specification Header (Strict 3-Zone Contract) */}
          <header className="sticky top-0 z-30 bg-[#EAE4D7]/95 dark:bg-[#171613]/95 backdrop-blur-xs border-b border-[#1C1B18] dark:border-[#312E29] transition-colors duration-200">
            <div className="w-full px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-2 sm:gap-4 lg:gap-6">
              {/* Zone 1: Course Identity Stamp */}
              <button
                type="button"
                onClick={() => handleNavigateView('standing')}
                className="flex items-center gap-2 sm:gap-2.5 text-left shrink-0 group rounded-[3px] focus:outline-none focus:ring-1 focus:ring-[#1C1B18]"
                title="Return to Diagnostic Standing"
              >
                <span
                  className="w-2 sm:w-2.5 h-6 sm:h-7 rounded-[2px] shrink-0 border border-[#1C1B18]/30 dark:border-[#312E29]"
                  style={{ backgroundColor: activeAccentHex }}
                  aria-hidden="true"
                />
                <span className="text-sm sm:text-base lg:text-lg font-display font-extrabold tracking-[0.05em] sm:tracking-[0.08em] uppercase text-[#1C1B18] dark:text-[#E6E2DA] whitespace-nowrap">
                  BACSE106 Sprint
                </span>
              </button>

              {/* Zone 2: Mode Navigation Bar (Desktop lg+) */}
              <nav aria-label="Primary manual sections" className="hidden lg:flex items-center gap-1.5 xl:gap-3">
                {NAV_ITEMS.map((item) => {
                  const isActive = activeView === item.id;
                  const activeBorder = item.isStanding
                    ? 'text-[#2E6F5E] dark:text-[#4CA38C] font-bold border-[#2E6F5E] dark:border-[#4CA38C]'
                    : 'text-[#1C1B18] dark:text-[#FAF7F0] font-semibold border-[#1C1B18] dark:border-[#FAF7F0]';
                  const idleStyle = item.isStanding
                    ? 'text-[#2E6F5E] dark:text-[#4CA38C] border-transparent hover:border-[#2E6F5E]/50 font-semibold'
                    : 'text-[#434038] dark:text-[#B5AEA0] border-transparent hover:text-[#1C1B18] dark:hover:text-[#FAF7F0]';

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavigateView(item.id)}
                      aria-current={isActive ? 'page' : undefined}
                      aria-label={
                        item.isMock && sortedWeakTopics.length > 0
                          ? `FAT Mock (${sortedWeakTopics.length} unresolved weak topics)`
                          : undefined
                      }
                      title={
                        item.isMock && sortedWeakTopics.length > 0
                          ? `FAT Mock (${sortedWeakTopics.length} unresolved weak topics)`
                          : undefined
                      }
                      className={`inline-flex items-center ${
                        item.isMock && sortedWeakTopics.length > 0 ? 'gap-2' : 'gap-1.5'
                      } py-1 text-xs font-mono uppercase tracking-[0.08em] step-hinge whitespace-nowrap shrink-0 border-b-2 ${
                        isActive ? activeBorder : idleStyle
                      }`}
                    >
                      {item.isStanding && (
                        <Gauge className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      )}
                      {item.isMock && (
                        <span className="relative inline-flex items-center shrink-0">
                          <ClipboardCheck className="w-3.5 h-3.5" aria-hidden="true" />
                          {sortedWeakTopics.length > 0 && (
                            <span
                              data-testid="nav-weak-topics-badge"
                              aria-hidden="true"
                              className="absolute -top-2 -right-2.5 min-w-[16px] h-[16px] px-1 rounded-full bg-rose-600 text-white text-[9px] font-mono font-extrabold leading-none inline-flex items-center justify-center border border-[#FAF7F0] tabular-nums"
                            >
                              {sortedWeakTopics.length}
                            </span>
                          )}
                        </span>
                      )}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Zone 3: Live Countdown Timer, Formula (^K) Trigger, Theme Toggle & Primary CTA */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <div className="hidden xl:block shrink-0">
                  <ExamCountdown variant="compact" />
                </div>

                {/* Formula (^K) Modal Trigger */}
                <button
                  type="button"
                  data-testid="formula-quickref-trigger"
                  onClick={() => setFormulaDrawerOpen(true)}
                  title="Open Formula Quick-Reference (Ctrl+K / Cmd+K)"
                  aria-label="Open Formula Quick-Reference"
                  className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-mono font-semibold uppercase tracking-[0.05em] bg-[#FAF7F0] dark:bg-[#201E1A] hover:bg-[#F4EFE4] dark:hover:bg-[#2A2722] text-[#1C1B18] dark:text-[#E6E2DA] border border-[#1C1B18] dark:border-[#3A3731] rounded-[4px] step-hinge shrink-0"
                >
                  <Sigma className="w-3.5 h-3.5 text-[#E06D2B] dark:text-[#EF8347] shrink-0" aria-hidden="true" />
                  <span className="hidden sm:inline">Formulas</span>
                  <kbd className="hidden sm:inline px-1 py-0.2 bg-[#EAE4D7] dark:bg-[#171613] border border-[#C5BEB0] dark:border-[#312E29] rounded-[2px] text-[10px] text-[#6E695D] dark:text-[#8F897D]">
                    ^K
                  </kbd>
                </button>

                {/* Theme Toggle */}
                <button
                  type="button"
                  data-testid="dark-mode-toggle"
                  onClick={handleToggleDarkMode}
                  aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                  aria-pressed={darkMode}
                  title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                  className="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 bg-[#FAF7F0] dark:bg-[#201E1A] hover:bg-[#F4EFE4] dark:hover:bg-[#2A2722] border border-[#1C1B18] dark:border-[#3A3731] rounded-[4px] step-hinge shrink-0"
                >
                  {darkMode ? (
                    <Sun className="w-4 h-4 text-[#E5B82E]" aria-hidden="true" />
                  ) : (
                    <Moon className="w-4 h-4 text-[#1C1B18]" aria-hidden="true" />
                  )}
                </button>

                {/* Primary FAT Mock CTA */}
                <button
                  type="button"
                  onClick={() => {
                    setMockSubView(sortedWeakTopics.length > 0 ? 'weak' : 'mcq');
                    handleNavigateView('mock');
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-mono font-semibold uppercase tracking-[0.05em] sm:tracking-[0.06em] text-[#1C1B18] bg-[#E5B82E] hover:bg-[#d8aa22] border border-[#1C1B18] dark:border-[#3A3731] rounded-[4px] step-hinge whitespace-nowrap shrink-0"
                >
                  <span>Start FAT Mock →</span>
                  {sortedWeakTopics.length > 0 && (
                    <span
                      data-testid="header-weak-topics-badge"
                      aria-hidden="true"
                      className="min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-mono font-extrabold leading-none inline-flex items-center justify-center tabular-nums"
                    >
                      {sortedWeakTopics.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </header>

            {/* Mobile / Tablet Scrollable Navigation Bar */}
            <nav
              aria-label="Mobile manual sections"
              className="lg:hidden bg-[#F4EFE4] dark:bg-[#1A1815] border-b border-[#1C1B18] dark:border-[#312E29] px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-print"
            >
              {NAV_ITEMS.map((item) => {
                const isActive = activeView === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavigateView(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono uppercase tracking-wider rounded-[3px] whitespace-nowrap shrink-0 border ${
                      isActive
                        ? item.isStanding
                          ? 'bg-[#2E6F5E] dark:bg-[#4CA38C] text-[#FAF7F0] border-[#1C1B18] dark:border-[#312E29] font-semibold'
                          : 'bg-[#E5B82E] text-[#1C1B18] border-[#1C1B18] dark:border-[#312E29] font-semibold'
                        : item.isStanding
                          ? 'bg-transparent text-[#2E6F5E] dark:text-[#4CA38C] border-[#2E6F5E]/40 dark:border-[#4CA38C]/40 font-semibold'
                          : 'bg-transparent text-[#434038] dark:text-[#B5AEA0] border-transparent hover:border-[#C5BEB0]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                    {item.isMock && sortedWeakTopics.length > 0 && (
                      <span
                        data-testid="mobile-nav-weak-topics-badge"
                        aria-hidden="true"
                        className="min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-mono font-extrabold leading-none inline-flex items-center justify-center tabular-nums"
                      >
                        {sortedWeakTopics.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Main Manual Body Content */}
            <main
              id="main-content"
              className={`flex-1 ${containerClass} py-6 sm:py-8`}
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

            {/* Technical Reference Manual Footer */}
            <footer className="border-t border-[#1C1B18] dark:border-[#312E29] bg-[#E5DEC9]/70 dark:bg-[#1A1815] transition-colors duration-200">
              <div
                className={`${containerClass} py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono text-[#434038] dark:text-[#8F897D]`}
              >
                <span>
                  {COURSE_META.code} {COURSE_META.title} · {COURSE_META.institution} · {COURSE_META.examDateDisplay}
                </span>
                <span>TECHNICAL REFERENCE MANUAL (MODULES 1–5 · 45 LECTURE HOURS)</span>
              </div>
            </footer>
          </div>
        </div>

        {/* Right Stepped Fore-Edge Division Tab Rail (Proportional Heights Scaled to Module Lecture Hours) */}
        <aside
          aria-label="Manual division tab rail"
          className="fore-edge-tab-rail hidden xl:flex flex-col w-9 pt-14 shrink-0 select-none no-print"
        >
          {foreEdgeTabs.map((tab) => {
            const bg = darkMode ? tab.darkHex : tab.hex;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={tab.onClick}
                title={`Switch to ${tab.label}`}
                style={{ backgroundColor: bg }}
                className={`fore-edge-tab ${tab.heightClass} relative flex flex-col items-center justify-between py-2.5 border-y border-r border-[#1C1B18] dark:border-[#312E29] rounded-r-[6px] step-hinge ${
                  tab.isActive ? 'w-9 -ml-px z-10 font-bold' : 'w-7 opacity-90 hover:w-8 hover:opacity-100'
                } ${tab.lightText ? 'text-[#FAF7F0]' : 'text-[#1C1B18]'}`}
              >
                {/* Punched Eyelet Circle */}
                <span
                  className="w-2 h-2 rounded-full bg-[#FAF7F0] border border-[#1C1B18]/40 shrink-0"
                  aria-hidden="true"
                />
                <span
                  className="font-mono text-[10px] tracking-[0.14em] uppercase whitespace-nowrap tabular-nums"
                  style={{ writingMode: 'vertical-rl' }}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </aside>

      {/* Global Floating Formula Quick Reference Widget (Ctrl+K / Cmd+K) */}
      <FormulaQuickRef
        open={formulaDrawerOpen}
        onClose={() => setFormulaDrawerOpen(false)}
        onJumpToModule={(modId) => {
          setFormulaDrawerOpen(false);
          handleNavigateView('syllabus', { moduleId: modId });
        }}
      />

      {/* Confetti Overlay for Topic Mastery Celebrations */}
      <MasteryConfettiOverlay
        particles={confettiParticles}
        onDone={() => setConfettiParticles([])}
      />
    </div>
  );
}
