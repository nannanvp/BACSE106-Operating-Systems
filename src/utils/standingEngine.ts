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
