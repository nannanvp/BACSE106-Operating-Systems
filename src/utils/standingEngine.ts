export type StandingTier = 'foundation' | 'application' | 'analysis';
export type StandingBand = 'A' | 'B' | 'C' | 'D';

export interface StandingQuestionLite {
  id: string;
  moduleId: string;
  topicId: string;
  tier: StandingTier;
  correctIndex: number;
}

export interface StandingModuleResult {
  moduleId: string;
  score: number;
  total: number;
  band: StandingBand;
  bandLabel: string;
  foundation: { correct: number; total: number; pct: number };
  application: { correct: number; total: number; pct: number };
  analysis: { correct: number; total: number; pct: number };
  missedQuestionIds: string[];
  missedTopicIds: string[];
  prescriptiveAdvice: string;
  completedAt: number;
}

export const MODULE_ORDER: ('m1' | 'm2' | 'm3' | 'm4' | 'm5')[] = ['m1', 'm2', 'm3', 'm4', 'm5'];

export const TIER_META: Record<
  StandingTier,
  {
    label: string;
    shortLabel: string;
    subtitle: string;
    stars: string;
    colorHex: string;
    cssVar: string;
    description: string;
  }
> = {
  foundation: {
    label: 'Tier 1: Foundation',
    shortLabel: 'Foundation (K1–K2)',
    subtitle: 'Definitions, Invariants & Modes',
    stars: '★☆☆',
    colorHex: '#10B981',
    cssVar: '--div-m3',
    description: 'Do you remember it? Core architectural boundaries, syscall modes, and invariants.',
  },
  application: {
    label: 'Tier 2: Application',
    shortLabel: 'Application (K3)',
    subtitle: 'Numerical Traces & Calculations',
    stars: '★★☆',
    colorHex: '#F59E0B',
    cssVar: '--div-m2',
    description: 'Can you use it? Gantt charts, Banker’s vectors, EAT calculations, and cylinder seeks.',
  },
  analysis: {
    label: 'Tier 3: Analysis',
    shortLabel: 'Analysis (K4–K5)',
    subtitle: '15M Multi-Step Synthesis & Traps',
    stars: '★★★',
    colorHex: '#F43F5E',
    cssVar: '--div-m5',
    description: 'Can you reason about it? Examiner traps, Belady anomalies, Peterson proofs, and security models.',
  },
};

export function getStandingBand(score: number): { band: StandingBand; label: string } {
  if (score >= 25) return { band: 'A', label: 'Band A · Exam-Ready Mastery (25–30)' };
  if (score >= 18) return { band: 'B', label: 'Band B · Solid — Drill Edge Cases (18–24)' };
  if (score >= 10) return { band: 'C', label: 'Band C · Partial — Study Notes Needed (10–17)' };
  return { band: 'D', label: 'Band D · Critical Gap — Start Refresher (0–9)' };
}

export function evaluateStandingModule(
  moduleId: string,
  questions: StandingQuestionLite[],
  answersByQuestionId: Record<string, number>,
  nowMs = Date.now()
): StandingModuleResult {
  const tiers: Record<StandingTier, { correct: number; total: number }> = {
    foundation: { correct: 0, total: 0 },
    application: { correct: 0, total: 0 },
    analysis: { correct: 0, total: 0 },
  };

  let score = 0;
  const missedQuestionIds: string[] = [];
  const missedTopicSet = new Set<string>();

  for (const q of questions) {
    tiers[q.tier].total += 1;
    const chosen = answersByQuestionId[q.id];
    if (chosen === q.correctIndex) {
      score += 1;
      tiers[q.tier].correct += 1;
    } else {
      missedQuestionIds.push(q.id);
      missedTopicSet.add(q.topicId);
    }
  }

  const pct = (c: number, t: number) => (t > 0 ? Math.round((c / t) * 100) : 0);
  const foundation = {
    ...tiers.foundation,
    pct: pct(tiers.foundation.correct, tiers.foundation.total),
  };
  const application = {
    ...tiers.application,
    pct: pct(tiers.application.correct, tiers.application.total),
  };
  const analysis = {
    ...tiers.analysis,
    pct: pct(tiers.analysis.correct, tiers.analysis.total),
  };

  const { band, label: bandLabel } = getStandingBand(score);

  let prescriptiveAdvice: string;
  if (foundation.pct < 60) {
    prescriptiveAdvice =
      'Core definitions and invariants are leaking marks. Read the Module Refresher sheet and Syllabus Notes before attempting timed papers.';
  } else if (application.pct < 60) {
    prescriptiveAdvice =
      'Concepts are clear, but multi-step calculations/traces need drill. Run the Interactive OS Labs and C1/C2 worked presets.';
  } else if (analysis.pct < 60) {
    prescriptiveAdvice =
      'Strong fundamentals and mechanics — push 15M synthesis by reviewing Examiner Traps and scenario justification rubrics.';
  } else if (band === 'A') {
    prescriptiveAdvice =
      'High-reliability module! Maintain via 48-hour SM-2 flashcards and allocate deep study hours to weaker modules.';
  } else {
    prescriptiveAdvice =
      'Solid baseline. Close the remaining missed topics in the Weak Topics Queue to lock in Band A before exam morning.';
  }

  return {
    moduleId,
    score,
    total: questions.length,
    band,
    bandLabel,
    foundation,
    application,
    analysis,
    missedQuestionIds,
    missedTopicIds: Array.from(missedTopicSet),
    prescriptiveAdvice,
    completedAt: nowMs,
  };
}

export interface RadarAxisPoint {
  moduleId: string;
  code: string;
  label: string;
  foundationPct: number;
  applicationPct: number;
  analysisPct: number;
  overallPct: number;
  band: StandingBand | null;
}

export function buildStandingRadarData(
  modules: Array<{ id: string; code: string; shortTitle: string }>,
  resultsByModule: Record<string, StandingModuleResult | undefined>
): RadarAxisPoint[] {
  return modules.map((m) => {
    const r = resultsByModule[m.id];
    if (!r) {
      return {
        moduleId: m.id,
        code: m.code,
        label: m.shortTitle,
        foundationPct: 0,
        applicationPct: 0,
        analysisPct: 0,
        overallPct: 0,
        band: null,
      };
    }
    return {
      moduleId: m.id,
      code: m.code,
      label: m.shortTitle,
      foundationPct: r.foundation.pct,
      applicationPct: r.application.pct,
      analysisPct: r.analysis.pct,
      overallPct: r.total > 0 ? Math.round((r.score / r.total) * 100) : 0,
      band: r.band,
    };
  });
}

// ----------------------------------------------------------------------------
// Geometry for 5-Axis Competency Radar Chart
// ----------------------------------------------------------------------------
export interface RadarPoint {
  x: number;
  y: number;
}

export function computeRadarPoint(
  axisIndex: number,
  axisCount: number,
  normalizedValue: number,
  radius: number,
  cx: number,
  cy: number
): RadarPoint {
  const clamped = Math.max(0, Math.min(1, normalizedValue));
  const angle = -Math.PI / 2 + (axisIndex * 2 * Math.PI) / axisCount;
  return {
    x: Number((cx + Math.cos(angle) * radius * clamped).toFixed(2)),
    y: Number((cy + Math.sin(angle) * radius * clamped).toFixed(2)),
  };
}

export function computeRadarPolygonPath(
  valuesOutOfHundred: number[],
  radius: number,
  cx: number,
  cy: number
): string {
  const n = valuesOutOfHundred.length;
  if (n === 0) return '';
  return (
    valuesOutOfHundred
      .map((v, i) => {
        const pt = computeRadarPoint(i, n, v / 100, radius, cx, cy);
        return `${i === 0 ? 'M' : 'L'}${pt.x},${pt.y}`;
      })
      .join(' ') + ' Z'
  );
}

// ----------------------------------------------------------------------------
// 95+ Readiness Band Assessment
// ----------------------------------------------------------------------------
export type Readiness95Band = '95_LOCK' | 'BAND_A' | 'BAND_B' | 'BAND_C' | 'BAND_D';

export interface Readiness95Assessment {
  band: Readiness95Band;
  badge: string;
  label: string;
  percent: number;
  targetScore95: number;
  currentScore: number;
  maxScore: number;
  gapTo95: number;
  assessedCount: number;
  isFullyAssessed: boolean;
  verdict: string;
  projectedFatMarks: string;
  recommendedAction: string;
  priorityView: 'standing' | 'sprint' | 'syllabus' | 'reference' | 'prediction' | 'labs' | 'mock';
}

export function evaluate95Readiness(
  standingResults: Record<string, StandingModuleResult | undefined>,
  totalModulesExpected = 5
): Readiness95Assessment {
  let totalScore = 0;
  let assessedCount = 0;
  const maxScore = totalModulesExpected * 30; // 150 points total
  const targetScore95 = Math.round(maxScore * 0.95); // 142/150 points

  for (const mId of MODULE_ORDER) {
    const res = standingResults[mId];
    if (res) {
      assessedCount += 1;
      totalScore += res.score;
    }
  }

  const effectiveMax = assessedCount > 0 ? assessedCount * 30 : maxScore;
  const percent = assessedCount > 0 ? Math.round((totalScore / effectiveMax) * 100) : 0;
  const gapTo95 = Math.max(0, targetScore95 - totalScore);
  const isFullyAssessed = assessedCount >= totalModulesExpected;

  if (assessedCount === 0) {
    return {
      band: 'BAND_D',
      badge: 'Unassessed',
      label: 'Zero Diagnostic Data · Start M1 Diagnostic',
      percent: 0,
      targetScore95,
      currentScore: 0,
      maxScore,
      gapTo95: targetScore95,
      assessedCount: 0,
      isFullyAssessed: false,
      verdict: 'No modules assessed yet. Begin with the Module 1 Diagnostic to map your baseline.',
      projectedFatMarks: 'Uncalibrated',
      recommendedAction: 'Start M1 Diagnostic (30 Qs) with pre-test Refresher Sheet.',
      priorityView: 'standing',
    };
  }

  if (isFullyAssessed && totalScore >= targetScore95) {
    return {
      band: '95_LOCK',
      badge: '95+ Locked',
      label: 'FAT 95+ Mastery Lock · Exceptional Consistency',
      percent,
      targetScore95,
      currentScore: totalScore,
      maxScore,
      gapTo95: 0,
      assessedCount,
      isFullyAssessed: true,
      verdict: `You have scored ${totalScore}/150 (${percent}%), clearing the 95+ threshold across all 5 modules! Maintain peak recall using SM-2 flashcard intervals and speed drill runs.`,
      projectedFatMarks: '95–100 Marks',
      recommendedAction: 'Run 1-click speed drills and 48-Hour SM-2 flashcards to maintain latency under 20s.',
      priorityView: 'labs',
    };
  }

  if (percent >= 85) {
    return {
      band: 'BAND_A',
      badge: 'Honors Band A',
      label: 'High Honors Baseline (85–94%) · Target Remaining 15M Analysis Gaps',
      percent,
      targetScore95,
      currentScore: totalScore,
      maxScore,
      gapTo95,
      assessedCount,
      isFullyAssessed,
      verdict: `Strong performance (${totalScore}/${effectiveMax} points, ${percent}%). Close the remaining ${gapTo95} marks by polishing Analysis (Tier 3) questions and examiner trap cases to lock in 95+.`,
      projectedFatMarks: '88–94 Marks',
      recommendedAction: 'Target missed Analysis questions in Weak Topics and inspect FAT Traps.',
      priorityView: 'reference',
    };
  }

  if (percent >= 70) {
    return {
      band: 'BAND_B',
      badge: 'Solid Band B',
      label: 'Solid Foundation (70–84%) · Multi-Step Numerical Calculations Need Lab Drill',
      percent,
      targetScore95,
      currentScore: totalScore,
      maxScore,
      gapTo95,
      assessedCount,
      isFullyAssessed,
      verdict: `Good baseline (${percent}%), but numerical trace mechanics (Tier 2 Application) are losing marks in C1/C2 archetypes. Dedicated lab practice will push you into the 90s.`,
      projectedFatMarks: '75–87 Marks',
      recommendedAction: 'Run Interactive OS Labs (Banker’s, Paging TLB, Disk LOOK, Peterson).',
      priorityView: 'labs',
    };
  }

  if (percent >= 50) {
    return {
      band: 'BAND_C',
      badge: 'Developing Band C',
      label: 'Developing Understanding (50–69%) · Structured Sprint Review Needed',
      percent,
      targetScore95,
      currentScore: totalScore,
      maxScore,
      gapTo95,
      assessedCount,
      isFullyAssessed,
      verdict: `Significant conceptual leaks in Application and Analysis tiers. Follow the 48-Hour Sprint Planner to systematically rebuild high-weight topics before exam hall time.`,
      projectedFatMarks: '60–74 Marks',
      recommendedAction: 'Execute 48h Sprint Planner blocks and review Syllabus Notes.',
      priorityView: 'sprint',
    };
  }

  return {
    band: 'BAND_D',
    badge: 'Critical Gaps',
    label: 'Critical Gaps Detected (<50%) · Immediate Refresher Required',
    percent,
    targetScore95,
    currentScore: totalScore,
    maxScore,
    gapTo95,
    assessedCount,
    isFullyAssessed,
    verdict: `Core invariants and definitions are dropping points across multiple axes. Step through the 5-minute Module Refreshers and review key invariants.`,
    projectedFatMarks: '<60 Marks',
    recommendedAction: 'Read Module Refreshers and master core definitions.',
    priorityView: 'syllabus',
  };
}

// ----------------------------------------------------------------------------
// Module Weak Spot Analysis & 1-Click Drill Recommendations
// ----------------------------------------------------------------------------
export interface DrillPresetTarget {
  labName: string;
  labAction: string;
  view: 'labs' | 'syllabus' | 'reference' | 'prediction';
  moduleId: string;
  topicId?: string;
}

export interface ModuleWeakSpot {
  moduleId: string;
  moduleCode: string;
  moduleTitle: string;
  hours: number;
  score: number;
  total: number;
  pct: number;
  lowestTier: StandingTier;
  lowestTierPct: number;
  weakTierLabel: string;
  missedTopicIds: string[];
  drillPreset: DrillPresetTarget;
}

export function getModuleDrillPreset(moduleId: string, topicId?: string): DrillPresetTarget {
  switch (moduleId) {
    case 'm1':
      return {
        labName: 'OS Architecture & Syscall Traps',
        labAction: 'Review Syscall FD Redirection & Monolithic vs Microkernel in Notes',
        view: 'syllabus',
        moduleId: 'm1',
        topicId: topicId ?? 'm1-os-structures',
      };
    case 'm2':
      return {
        labName: 'Banker’s Safety & CPU Gantt Simulator',
        labAction: 'Launch Banker’s & RAG Workbench (C1 2-2 Q7 6-proc preset)',
        view: 'labs',
        moduleId: 'm2',
        topicId: topicId ?? 'm2-deadlocks',
      };
    case 'm3':
      return {
        labName: 'Concurrency & Synchronization Simulator',
        labAction: 'Step through Peterson’s Algorithm & Bounded Buffer Mutex Lab',
        view: 'labs',
        moduleId: 'm3',
        topicId: topicId ?? 'm3-sync-primitives',
      };
    case 'm4':
      return {
        labName: 'Memory & Paging Interactive Lab',
        labAction: 'Run Belady’s Anomaly & 25-Reference String TLB EAT Evaluator',
        view: 'labs',
        moduleId: 'm4',
        topicId: topicId ?? 'm4-paging-tlb',
      };
    case 'm5':
      return {
        labName: 'Disk Scheduling & RAID Lab',
        labAction: 'Simulate C2 Q9 LOOK/C-LOOK Cylinder Seek graph & RAID 6 parity',
        view: 'labs',
        moduleId: 'm5',
        topicId: topicId ?? 'm5-disk-scheduling',
      };
    default:
      return {
        labName: 'Numerical Drill Arena',
        labAction: 'Open Unlimited Deterministic Drill Problems',
        view: 'labs',
        moduleId,
      };
  }
}

export function analyzeModuleWeakSpots(
  standingResults: Record<string, StandingModuleResult | undefined>,
  modules: Array<{ id: string; code: string; title: string; hours: number }>
): {
  weakestModule: ModuleWeakSpot | null;
  allModuleSpots: ModuleWeakSpot[];
  tierGaps: Record<StandingTier, { correct: number; total: number; pct: number }>;
} {
  const tierGaps: Record<StandingTier, { correct: number; total: number; pct: number }> = {
    foundation: { correct: 0, total: 0, pct: 0 },
    application: { correct: 0, total: 0, pct: 0 },
    analysis: { correct: 0, total: 0, pct: 0 },
  };

  const spots: ModuleWeakSpot[] = [];

  for (const m of modules) {
    const res = standingResults[m.id];
    if (!res) continue;

    tierGaps.foundation.correct += res.foundation.correct;
    tierGaps.foundation.total += res.foundation.total;
    tierGaps.application.correct += res.application.correct;
    tierGaps.application.total += res.application.total;
    tierGaps.analysis.correct += res.analysis.correct;
    tierGaps.analysis.total += res.analysis.total;

    // Find lowest tier
    const fPct = res.foundation.pct;
    const aPct = res.application.pct;
    const nPct = res.analysis.pct;

    let lowestTier: StandingTier = 'analysis';
    let lowestTierPct = nPct;
    let weakTierLabel = 'Analysis (K4–K5)';

    if (fPct <= aPct && fPct <= nPct) {
      lowestTier = 'foundation';
      lowestTierPct = fPct;
      weakTierLabel = 'Foundation (Definitions & Invariants)';
    } else if (aPct <= fPct && aPct <= nPct) {
      lowestTier = 'application';
      lowestTierPct = aPct;
      weakTierLabel = 'Application (Calculations & Traces)';
    }

    spots.push({
      moduleId: m.id,
      moduleCode: m.code,
      moduleTitle: m.title,
      hours: m.hours,
      score: res.score,
      total: res.total,
      pct: res.total > 0 ? Math.round((res.score / res.total) * 100) : 0,
      lowestTier,
      lowestTierPct,
      weakTierLabel,
      missedTopicIds: res.missedTopicIds,
      drillPreset: getModuleDrillPreset(m.id, res.missedTopicIds[0]),
    });
  }

  const calcPct = (c: number, t: number) => (t > 0 ? Math.round((c / t) * 100) : 0);
  tierGaps.foundation.pct = calcPct(tierGaps.foundation.correct, tierGaps.foundation.total);
  tierGaps.application.pct = calcPct(tierGaps.application.correct, tierGaps.application.total);
  tierGaps.analysis.pct = calcPct(tierGaps.analysis.correct, tierGaps.analysis.total);

  if (spots.length === 0) {
    return { weakestModule: null, allModuleSpots: [], tierGaps };
  }

  // Sort by lowest percentage first; if tied, break tie by higher lecture hours (more exam weight)
  const sorted = [...spots].sort((a, b) => {
    if (a.pct !== b.pct) return a.pct - b.pct;
    return b.hours - a.hours;
  });

  return {
    weakestModule: sorted[0] ?? null,
    allModuleSpots: sorted,
    tierGaps,
  };
}
