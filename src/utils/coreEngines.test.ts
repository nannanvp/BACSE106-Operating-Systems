import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { solveLeafAlpha } from './contrastSolver';
import { computeReadiness } from './readinessEngine';
import { reviewCard, sortCardsByDueOrder, computeSrsForecast } from './srsEngine';
import {
  evaluateStandingModule,
  getStandingBand,
  buildStandingRadarData,
  computeRadarPoint,
  computeRadarPolygonPath,
  evaluate95Readiness,
  analyzeModuleWeakSpots,
  getModuleDrillPreset,
} from './standingEngine';
import {
  recordWeakTopicMiss,
  markWeakTopicReviewed,
  getSortedWeakTopics,
} from './weakTopicsEngine';
import { computeExamCountdown } from './countdownEngine';
import {
  createInitialPomodoroState,
  tickPomodoro,
  syncPomodoroDay,
  formatMmSs,
} from './pomodoroEngine';
import { generateConfettiParticles } from './confettiEngine';
import { resolveInitialTheme, toggleThemeMode } from './darkModeEngine';
import { OS_FORMULAS, filterFormulas } from './formulaQuickRefEngine';
import { buildCheatSheetHtml } from './cheatSheetPrintEngine';
import { buildPredictionModels } from './predictionEngine';
import {
  DRILL_ARCHETYPES,
  generateDrillProblem,
  gradeNumericalAnswer,
} from './numericalDrillEngine';

describe('Core Application Engines', () => {
  it('contrastSolver returns valid WCAG-safe alpha within [0.08, 0.28]', () => {
    const alpha = solveLeafAlpha('#E5B82E', '#F4EFE4', '#1C1B18', 7.0);
    assert.ok(alpha >= 0.08 && alpha <= 0.28);
  });

  it('readinessEngine applies exact 25/15/25/20/15 weights and breaks weakest-module ties by lecture hours', () => {
    const res = computeReadiness({
      modules: [
        { id: 'm1', code: 'M1', title: 'OS Structure', hours: 6, topicIds: ['t1'] },
        { id: 'm2', code: 'M2', title: 'Processes', hours: 10, topicIds: ['t2'] },
      ],
      masteredTopicIds: ['t1', 't2'], // 100% syllabus -> 25
      completedSprintBlockIds: ['b1'],
      totalSprintBlocks: 1, // 100% sprint -> 15
      standingScoresByModule: {
        m1: { score: 15, total: 30 }, // 50%
        m2: { score: 15, total: 30 }, // 50% -> tie, M2 has 10h > 6h!
      }, // avg 50% -> 12.5
      flashcardReviewedCount: 0,
      totalFlashcards: 50, // 0% -> 0
      mcqCorrectCount: 0,
      mcqAttemptedCount: 0,
      totalMcqs: 50, // 0% -> 0
      weakTopicsCount: 2,
    });
    assert.equal(res.overallScore, 53); // Math.round(25 + 15 + 12.5) = 53
    assert.equal(res.weakestModule?.id, 'm2');
    assert.ok(res.topActions.length >= 2 && res.topActions.length <= 3);
  });

  it('srsEngine enforces EF floor 1.30, supports fat48h vs longterm, sorts overdue first, and computes 4 buckets', () => {
    const now = 1_700_000_000_000;
    let st = reviewCard(undefined, 'c1', 'again', 'fat48h', now);
    for (let i = 0; i < 10; i += 1) {
      st = reviewCard(st, 'c1', 'again', 'fat48h', now + i * 1000);
    }
    assert.ok(st.easeFactor >= 1.3);
    const longSt = reviewCard(undefined, 'c2', 'good', 'longterm', now);
    const fastSt = reviewCard(undefined, 'c3', 'good', 'fat48h', now);
    assert.ok(longSt.intervalMs > fastSt.intervalMs);

    const sorted = sortCardsByDueOrder(
      [{ id: 'c2' }, { id: 'c1' }],
      { c1: { ...st, dueAt: now - 5000 }, c2: { ...longSt, dueAt: now + 999999 } },
      now
    );
    assert.equal(sorted[0].id, 'c1');

    const forecast = computeSrsForecast(['c1', 'c2', 'c3'], { c1: st, c2: longSt, c3: fastSt }, now);
    assert.equal(forecast.dueNow + forecast.within2h + forecast.within12h + forecast.later, 3);
  });

  it('standingEngine applies A/B/C/D cutoffs (25/18/10) and generates 5-axis radar', () => {
    assert.equal(getStandingBand(25).band, 'A');
    assert.equal(getStandingBand(24).band, 'B');
    assert.equal(getStandingBand(18).band, 'B');
    assert.equal(getStandingBand(17).band, 'C');
    assert.equal(getStandingBand(10).band, 'C');
    assert.equal(getStandingBand(9).band, 'D');

    const qs = Array.from({ length: 30 }, (_, i) => ({
      id: `q${i}`,
      moduleId: 'm1',
      topicId: 'm1-t1',
      tier: (i < 10 ? 'foundation' : i < 20 ? 'application' : 'analysis') as
        | 'foundation'
        | 'application'
        | 'analysis',
      correctIndex: 0,
    }));
    const ans: Record<string, number> = {};
    qs.forEach((q, idx) => {
      ans[q.id] = idx < 26 ? 0 : 1;
    });
    const res = evaluateStandingModule('m1', qs, ans);
    assert.equal(res.score, 26);
    assert.equal(res.band, 'A');

    const radar = buildStandingRadarData([{ id: 'm1', code: 'M1', shortTitle: 'OS' }], { m1: res });
    assert.equal(radar[0].foundationPct, 100);
    assert.equal(radar[0].analysisPct, 60);

    // Geometry helpers
    const pt0 = computeRadarPoint(0, 5, 1, 100, 200, 200);
    assert.equal(pt0.x, 200);
    assert.equal(pt0.y, 100);
    const path = computeRadarPolygonPath([100, 50, 50, 50, 50], 100, 200, 200);
    assert.ok(path.startsWith('M200,100'));
    assert.ok(path.endsWith('Z'));

    // 95+ Readiness Assessment
    const unassessed = evaluate95Readiness({});
    assert.equal(unassessed.band, 'BAND_D');
    assert.equal(unassessed.assessedCount, 0);

    const standing5 = {
      m1: { ...res, score: 29 },
      m2: { ...res, score: 29 },
      m3: { ...res, score: 28 },
      m4: { ...res, score: 29 },
      m5: { ...res, score: 29 },
    };
    const ready95 = evaluate95Readiness(standing5);
    assert.equal(ready95.band, '95_LOCK');
    assert.equal(ready95.currentScore, 144);
    assert.equal(ready95.gapTo95, 0);

    // Module Weak Spot Analysis
    const spots = analyzeModuleWeakSpots(
      {
        m1: { ...res, score: 28, foundation: { correct: 10, total: 10, pct: 100 }, application: { correct: 10, total: 10, pct: 100 }, analysis: { correct: 8, total: 10, pct: 80 } },
        m2: { ...res, score: 18, foundation: { correct: 8, total: 10, pct: 80 }, application: { correct: 4, total: 10, pct: 40 }, analysis: { correct: 6, total: 10, pct: 60 } },
      },
      [
        { id: 'm1', code: 'M1', title: 'OS Structures', hours: 6 },
        { id: 'm2', code: 'M2', title: 'Processes & Deadlocks', hours: 10 },
      ]
    );
    assert.equal(spots.weakestModule?.moduleId, 'm2');
    assert.equal(spots.weakestModule?.lowestTier, 'application');
    assert.equal(getModuleDrillPreset('m2').view, 'labs');
    assert.equal(getModuleDrillPreset('m4').view, 'labs');
  });

  it('weakTopicsEngine pins topics with >=3 misses and >=2h overdue and marks <1h reviewed', () => {
    const t0 = 1_700_000_000_000;
    let map = recordWeakTopicMiss({}, { topicId: 't1', moduleId: 'm2', topicTitle: 'Bankers', source: 'standing' }, t0);
    map = recordWeakTopicMiss(map, { topicId: 't1', moduleId: 'm2', topicTitle: 'Bankers', source: 'mcq' }, t0 + 1000);
    map = recordWeakTopicMiss(map, { topicId: 't1', moduleId: 'm2', topicTitle: 'Bankers', source: 'drill' }, t0 + 2000);

    const later3h = t0 + 3 * 3600 * 1000;
    const sorted = getSortedWeakTopics(map, later3h);
    assert.equal(sorted[0].isPinnedUrgent, true);

    const reviewed = markWeakTopicReviewed(map, 't1', false, later3h);
    const afterReview = getSortedWeakTopics(reviewed, later3h + 10 * 60 * 1000);
    assert.equal(afterReview[0].isPinnedUrgent, false);
    assert.equal(afterReview[0].isRecentlyReviewed, true);
  });

  it('countdownEngine detects all 6 phases independent of machine timezone', () => {
    const examIso = '2026-11-25T09:00:00+05:30';
    const startMs = Date.parse(examIso);
    assert.equal(computeExamCountdown(examIso, 180, startMs - 72 * 3600 * 1000).phase, 'pre-sprint');
    assert.equal(computeExamCountdown(examIso, 180, startMs - 36 * 3600 * 1000).phase, 'sprint-48h');
    assert.equal(computeExamCountdown(examIso, 180, startMs - 10 * 3600 * 1000).phase, 'final-24h');
    assert.equal(computeExamCountdown(examIso, 180, startMs - 1 * 3600 * 1000).phase, 'exam-morning');
    assert.equal(computeExamCountdown(examIso, 180, startMs + 30 * 60 * 1000).phase, 'in-exam');
    assert.equal(computeExamCountdown(examIso, 180, startMs + 200 * 60 * 1000).phase, 'completed');
  });

  it('pomodoroEngine triggers long-break on 4th focus completion and resets on new day', () => {
    let st = createInitialPomodoroState('2026-11-23');
    st = { ...st, running: true, remainingSeconds: 1, cycleFocusCount: 3 };
    const { nextState, phaseCompleted } = tickPomodoro(st, '2026-11-23');
    assert.equal(phaseCompleted, 'focus');
    assert.equal(nextState.mode, 'long-break');
    assert.equal(nextState.remainingSeconds, 15 * 60);
    assert.equal(nextState.completedFocusSessions, 1);

    const nextDay = syncPomodoroDay(nextState, '2026-11-24');
    assert.equal(nextDay.completedFocusSessions, 0);
    assert.equal(formatMmSs(125), '02:05');
  });

  it('confettiEngine is deterministic and flips downward near top of viewport', () => {
    const p1 = generateConfettiParticles(400, 80, 42, 16, 900);
    const p2 = generateConfettiParticles(400, 80, 42, 16, 900);
    assert.deepEqual(p1, p2);
    assert.ok(p1.every((p) => p.ty > 0), 'Near top edge should spray downward');

    const pBottom = generateConfettiParticles(400, 700, 42, 16, 900);
    assert.ok(pBottom.every((p) => p.ty < 0), 'Lower viewport should spray upward');
  });

  it('darkModeEngine, formulaQuickRefEngine, cheatSheetPrintEngine, predictionEngine, and numericalDrillEngine work accurately', () => {
    assert.equal(resolveInitialTheme(null, true), 'dark');
    assert.equal(toggleThemeMode('dark'), 'light');

    const hits = filterFormulas(OS_FORMULAS, 'tlb eat');
    assert.ok(hits.some((f) => f.id === 'f-tlb-eat'));

    const html = buildCheatSheetHtml({
      courseCode: 'BACSE106',
      courseTitle: 'Operating Systems',
      examDateLabel: '25 Nov 2026',
      formulas: OS_FORMULAS,
      examinerTraps: [{ title: 'Reverse mutex', fix: 'Wait empty before mutex', moduleCode: 'M3' }],
      comparisonRows: [{ label: 'VM vs Container', summary: 'Hypervisor vs shared host kernel' }],
    });
    assert.ok(html.includes('Page 1/2') && html.includes('Page 2/2'));

    const pred = buildPredictionModels(
      [
        { moduleId: 'm1', moduleCode: 'M1', topicId: 'm1-os-structures', topicTitle: 'OS Structures' },
        { moduleId: 'm4', moduleCode: 'M4', topicId: 'm4-file-allocation', topicTitle: 'File Allocation' },
      ],
      [
        {
          slotId: 'c1-2-2',
          slotLabel: 'C1 Set 2-2',
          questionNumber: 'Q1',
          marks: 10,
          moduleId: 'm1',
          topicId: 'm1-os-structures',
          topicTitle: 'OS Structures',
          bloom: 'K2',
          archetype: 'Architecture',
        },
      ]
    );
    assert.equal(pred.alphaGapPaper.totalMarks, 100);
    assert.equal(pred.betaRotationPaper.totalMarks, 100);
    assert.equal(pred.gammaConsensusPaper.totalMarks, 100);

    for (const arch of DRILL_ARCHETYPES) {
      const prob = generateDrillProblem(arch.id, 101);
      assert.ok(Number.isFinite(prob.expectedAnswer));
      const graded = gradeNumericalAnswer(String(prob.expectedAnswer), prob.expectedAnswer, prob.tolerance);
      assert.equal(graded.correct, true);
    }
  });

  it('numericalDrillEngine generates all 6 OS archetypes deterministically with tolerance parsing and rubric steps', () => {
    const requiredArchetypes = [
      'cpu-avg-wt',
      'bankers-need',
      'demand-paging-eat',
      'working-set-window',
      'unix-inode-max-file-size',
      'disk-rotational-latency',
    ] as const;

    assert.equal(DRILL_ARCHETYPES.length, 6);
    for (const archId of requiredArchetypes) {
      assert.ok(DRILL_ARCHETYPES.some((a) => a.id === archId), `Must include archetype ${archId}`);
      for (const seed of [1, 42, 106, 999]) {
        const prob = generateDrillProblem(archId, seed);
        assert.ok(Number.isFinite(prob.expectedAnswer));
        assert.ok(prob.rubricSteps.length >= 3);
        assert.ok(prob.givenBlock.length > 0);
        assert.ok(prob.targetSeconds >= 60);

        const exactGrade = gradeNumericalAnswer(String(prob.expectedAnswer), prob.expectedAnswer, prob.tolerance);
        assert.equal(exactGrade.correct, true);

        const unitGrade = gradeNumericalAnswer(`${prob.expectedAnswer} ${prob.unit}`, prob.expectedAnswer, prob.tolerance);
        assert.equal(unitGrade.correct, true);
      }
    }

    const badGrade = gradeNumericalAnswer('not-a-number', 42, 0.1);
    assert.equal(badGrade.validNumber, false);
    assert.equal(badGrade.correct, false);
  });
});
