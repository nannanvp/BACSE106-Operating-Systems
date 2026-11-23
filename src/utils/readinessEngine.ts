export interface ReadinessModuleInfo {
  id: string;
  code: string;
  title: string;
  hours: number;
  topicIds: string[];
}

export interface ReadinessInput {
  modules: ReadinessModuleInfo[];
  masteredTopicIds: string[];
  completedSprintBlockIds: string[];
  totalSprintBlocks: number;
  standingScoresByModule: Record<string, { score: number; total: number } | undefined>;
  flashcardReviewedCount: number;
  totalFlashcards: number;
  mcqCorrectCount: number;
  mcqAttemptedCount: number;
  totalMcqs: number;
  weakTopicsCount: number;
}

export interface ReadinessBreakdown {
  syllabusPct: number; // 25% weight
  sprintPct: number; // 15% weight
  standingPct: number; // 25% weight
  flashcardsPct: number; // 20% weight
  mcqPct: number; // 15% weight
}

export interface ReadinessAction {
  id: string;
  title: string;
  detail: string;
  targetView: 'standing' | 'sprint' | 'syllabus' | 'reference' | 'prediction' | 'labs' | 'mock';
  targetModuleId?: string;
}

export interface ReadinessResult {
  overallScore: number; // 0..100
  band: 'Exam Ready' | 'On Track' | 'Needs Focus' | 'Critical Sprint';
  breakdown: ReadinessBreakdown;
  weakestModule: {
    id: string;
    code: string;
    title: string;
    hours: number;
    readinessPct: number;
  } | null;
  topActions: ReadinessAction[];
}

function clampPct(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function computeReadiness(input: ReadinessInput): ReadinessResult {
  const allTopics = input.modules.flatMap((m) => m.topicIds);
  const masteredSet = new Set(input.masteredTopicIds);
  const masteredCount = allTopics.filter((id) => masteredSet.has(id)).length;

  const syllabusPct = allTopics.length > 0 ? clampPct((masteredCount / allTopics.length) * 100) : 0;
  const sprintPct =
    input.totalSprintBlocks > 0
      ? clampPct((input.completedSprintBlockIds.length / input.totalSprintBlocks) * 100)
      : 0;

  // Standing diagnostic average across all 5 modules (unattempted modules count as 0)
  let standingSum = 0;
  for (const mod of input.modules) {
    const rec = input.standingScoresByModule[mod.id];
    if (rec && rec.total > 0) {
      standingSum += (rec.score / rec.total) * 100;
    }
  }
  const standingPct =
    input.modules.length > 0 ? clampPct(standingSum / input.modules.length) : 0;

  const flashcardsPct =
    input.totalFlashcards > 0
      ? clampPct((input.flashcardReviewedCount / input.totalFlashcards) * 100)
      : 0;

  // MCQ component blends coverage (40%) + accuracy (60%)
  const mcqCoverage = input.totalMcqs > 0 ? Math.min(1, input.mcqAttemptedCount / input.totalMcqs) : 0;
  const mcqAccuracy = input.mcqAttemptedCount > 0 ? input.mcqCorrectCount / input.mcqAttemptedCount : 0;
  const mcqPct = clampPct((mcqCoverage * 0.4 + mcqAccuracy * 0.6) * 100);

  // Exact weights: 25% syllabus, 15% sprint, 25% standing, 20% flashcards, 15% mcq
  const overallScore = clampPct(
    syllabusPct * 0.25 +
      sprintPct * 0.15 +
      standingPct * 0.25 +
      flashcardsPct * 0.2 +
      mcqPct * 0.15
  );

  let band: ReadinessResult['band'] = 'Critical Sprint';
  if (overallScore >= 82) band = 'Exam Ready';
  else if (overallScore >= 60) band = 'On Track';
  else if (overallScore >= 35) band = 'Needs Focus';

  // Identify weakest module (ties broken by higher syllabus lecture hours!)
  let weakestModule: ReadinessResult['weakestModule'] = null;
  for (const mod of input.modules) {
    const modMastered = mod.topicIds.filter((id) => masteredSet.has(id)).length;
    const modTopicPct = mod.topicIds.length > 0 ? (modMastered / mod.topicIds.length) * 100 : 0;
    const rec = input.standingScoresByModule[mod.id];
    const modStandingPct = rec && rec.total > 0 ? (rec.score / rec.total) * 100 : 0;
    const modScore = Math.round(modTopicPct * 0.5 + modStandingPct * 0.5);

    if (
      !weakestModule ||
      modScore < weakestModule.readinessPct ||
      (modScore === weakestModule.readinessPct && mod.hours > weakestModule.hours)
    ) {
      weakestModule = {
        id: mod.id,
        code: mod.code,
        title: mod.title,
        hours: mod.hours,
        readinessPct: modScore,
      };
    }
  }

  // Deterministic Top-3 Prescriptive Actions
  const actions: ReadinessAction[] = [];
  const untestedMod = input.modules.find((m) => !input.standingScoresByModule[m.id]);

  if (untestedMod) {
    actions.push({
      id: 'diag-untested',
      title: `Run ${untestedMod.code} Diagnostic Standing`,
      detail: `Take the 30-question tiered check for ${untestedMod.title} to map Foundation vs Analysis gaps.`,
      targetView: 'standing',
      targetModuleId: untestedMod.id,
    });
  }

  if (input.weakTopicsCount > 0) {
    actions.push({
      id: 'clear-weak',
      title: `Clear ${input.weakTopicsCount} Weak Topic(s) in Queue`,
      detail: 'Review missed concepts from diagnostics, MCQs, and self-checks before timed paper runs.',
      targetView: 'mock',
    });
  }

  if (weakestModule) {
    actions.push({
      id: 'study-weakest',
      title: `Master ${weakestModule.code} (${weakestModule.title})`,
      detail: `Lowest composite readiness (${weakestModule.readinessPct}%) with ${weakestModule.hours}h syllabus weight.`,
      targetView: 'syllabus',
      targetModuleId: weakestModule.id,
    });
  }

  if (flashcardsPct < 60) {
    actions.push({
      id: 'srs-deck',
      title: 'Run 48-Hour SM-2 Flashcard Sprint',
      detail: `${input.flashcardReviewedCount}/${input.totalFlashcards} high-yield OS cards reviewed so far.`,
      targetView: 'reference',
    });
  }

  if (mcqPct < 50) {
    actions.push({
      id: 'lab-drill',
      title: 'Practice C1/C2 Numerical Presets in OS Labs',
      detail: 'Verify Preemptive Priority + CS, Banker’s, Page Replacement, and Disk Seek calculations.',
      targetView: 'labs',
    });
  }

  return {
    overallScore,
    band,
    breakdown: {
      syllabusPct,
      sprintPct,
      standingPct,
      flashcardsPct,
      mcqPct,
    },
    weakestModule,
    topActions: actions.slice(0, 3),
  };
}
