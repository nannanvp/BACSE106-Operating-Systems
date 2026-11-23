import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MODULES } from '../data/courseData';
import {
  ALPHA_F2_BLUEPRINT,
  BETA_F2_BLUEPRINT,
  C1_TO_C2_SHIFT_PATTERNS,
  F1_SLOT_QUESTIONS,
  GAMMA_F2_BLUEPRINT,
  GAMMA_SYNTHESIS_ROWS,
  buildCoverageMatrix,
  buildPredictionModels,
  buildTopicPredictionMatrix,
  computePredictionStats,
  filterPredictionMatrix,
  getSlotQuestionLink,
} from './predictionEngine';
import { SLOT_FORENSIC_ITEMS } from '../data/slotPaperAnalysis';

describe('Prediction Engine & 4-Lens Forensic Workbench', () => {
  it('buildTopicPredictionMatrix returns all 30 syllabus topics in exact Module 1 -> Module 5 order', () => {
    const matrix = buildTopicPredictionMatrix();
    const expectedIds = MODULES.flatMap((m) => m.topics.map((t) => t.id));

    assert.equal(matrix.length, 30, 'Should have exactly 30 topics');
    assert.deepEqual(
      matrix.map((e) => e.topicId),
      expectedIds,
      'Matrix topics must match MODULES topic IDs in order'
    );

    matrix.forEach((entry, idx) => {
      assert.equal(entry.topicOrder, idx + 1);
      assert.ok(entry.testedDetail.trim().length > 5, `Missing testedDetail on ${entry.topicId}`);
      assert.ok(entry.untestedGap.trim().length > 5, `Missing untestedGap on ${entry.topicId}`);
      assert.ok(entry.likelyQuestionTypes.length >= 1, `Missing likelyQuestionTypes on ${entry.topicId}`);

      if (entry.status === 'untested') {
        assert.equal(
          entry.c122Refs.length + entry.c112Refs.length + entry.c2Refs.length + entry.f1Refs.length,
          0,
          `Untested topic ${entry.topicId} should have no slot references`
        );
      } else {
        const totalRefs =
          entry.c122Refs.length + entry.c112Refs.length + entry.c2Refs.length + entry.f1Refs.length;
        assert.ok(totalRefs >= 1, `Tested/partial topic ${entry.topicId} must have at least 1 slot reference`);
      }

      for (const ql of entry.questionLinks) {
        assert.ok(ql.title.length > 5, `Missing title on question link ${ql.id}`);
        assert.ok(ql.stem.length > 10, `Missing stem on question link ${ql.id}`);
        assert.ok(ql.subParts.length >= 1, `Missing subParts on question link ${ql.id}`);
        assert.ok(ql.workedSolution.length > 10, `Missing workedSolution on question link ${ql.id}`);
      }
    });
  });

  it('computes prediction telemetry and partitions topics cleanly across statuses and modules', () => {
    const matrix = buildTopicPredictionMatrix();
    const stats = computePredictionStats(matrix);

    assert.equal(stats.totalTopics, 30);
    assert.equal(stats.untestedCount + stats.partialCount + stats.testedCount, 30);
    assert.ok(stats.untestedCount >= 10, `Expected >= 10 untested gaps, got ${stats.untestedCount}`);
    assert.ok(stats.testedCount >= 10, `Expected >= 10 tested topics, got ${stats.testedCount}`);
    assert.equal(stats.alphaTotalMarks, 100);
    assert.equal(stats.betaTotalMarks, 100);
    assert.equal(stats.gammaTotalMarks, 100);
    assert.ok(stats.betaRotationCount >= 4, 'Expected >= 4 sibling rotations');
    assert.ok(stats.betaRepeatCount >= 3, 'Expected >= 3 anchor repeats');
    assert.ok(stats.gammaUnanimousCount >= 3, 'Expected >= 3 unanimous locks in Gamma');
    assert.ok(stats.gammaTopicCoverageCount >= 12, 'Expected >= 12 topics covered in Gamma');

    // Filtering checks
    assert.equal(filterPredictionMatrix(matrix, 'all', 'all').length, 30);
    assert.equal(filterPredictionMatrix(matrix, 'untested', 'all').length, stats.untestedCount);
    assert.equal(filterPredictionMatrix(matrix, 'partial', 'all').length, stats.partialCount);
    assert.equal(filterPredictionMatrix(matrix, 'tested', 'all').length, stats.testedCount);
    assert.equal(filterPredictionMatrix(matrix, 'all', 'm1').length, 5);
    assert.equal(filterPredictionMatrix(matrix, 'all', 'm2').length, 7);
    assert.equal(filterPredictionMatrix(matrix, 'all', 'm3').length, 6);
    assert.equal(filterPredictionMatrix(matrix, 'all', 'm4').length, 7);
    assert.equal(filterPredictionMatrix(matrix, 'all', 'm5').length, 5);

    // Search term filtering
    const searchHits = filterPredictionMatrix(matrix, 'all', 'all', 'Banker');
    assert.ok(searchHits.length >= 1, 'Search for "Banker" should yield results');
    assert.ok(searchHits.some((h) => h.topicId === 'm2-deadlock-handling'));
  });

  it('validates Empirical Shift Pattern Table (C1 -> C2 progression applied to F1 to project F2)', () => {
    assert.ok(C1_TO_C2_SHIFT_PATTERNS.length >= 6, 'Should have at least 6 shift patterns');

    const cpuShift = C1_TO_C2_SHIFT_PATTERNS.find((p) => p.id === 'shift-cpu-scheduling');
    assert.ok(cpuShift, 'Must include shift-cpu-scheduling');
    assert.ok(cpuShift.c1Asked.includes('Preemptive Priority') || cpuShift.c1Asked.includes('Priority'));
    assert.ok(cpuShift.c2Asked.includes('Round Robin'));
    assert.ok(cpuShift.betaF2Projection.includes('Round Robin') || cpuShift.betaF2Projection.includes('SRTF'));

    const deadlockShift = C1_TO_C2_SHIFT_PATTERNS.find((p) => p.id === 'shift-deadlocks');
    assert.ok(deadlockShift, 'Must include shift-deadlocks');
    assert.ok(deadlockShift.c1Asked.includes("Banker's"));
    assert.ok(deadlockShift.c2Asked.includes('RAG'));

    const pagingShift = C1_TO_C2_SHIFT_PATTERNS.find((p) => p.id === 'shift-page-replacement');
    assert.ok(pagingShift, 'Must include shift-page-replacement');
    assert.ok(pagingShift.c1Asked.includes('Page Replacement'));
    assert.ok(pagingShift.c2Asked.includes('TLB'));

    for (const pattern of C1_TO_C2_SHIFT_PATTERNS) {
      assert.ok(pattern.empiricalRule.length > 20, `Missing empirical rule on ${pattern.id}`);
      assert.ok(pattern.f1Baseline.length > 5, `Missing f1Baseline on ${pattern.id}`);
      assert.ok(pattern.betaF2Projection.length > 10, `Missing betaF2Projection on ${pattern.id}`);
    }
  });

  it('Alpha F2, Beta F2, and Gamma F2 blueprints strictly conform to 100M structure (7×10M + 2×15M = 100M)', () => {
    const validTopicIds = new Set(MODULES.flatMap((m) => m.topics.map((t) => t.id)));

    for (const [name, blueprint] of [
      ['ALPHA_F2_BLUEPRINT', ALPHA_F2_BLUEPRINT],
      ['BETA_F2_BLUEPRINT', BETA_F2_BLUEPRINT],
      ['GAMMA_F2_BLUEPRINT', GAMMA_F2_BLUEPRINT],
    ] as const) {
      assert.equal(blueprint.length, 9, `${name} must have exactly 9 questions`);

      const totalMarks = blueprint.reduce((sum, q) => sum + q.marks, 0);
      assert.equal(totalMarks, 100, `${name} total marks must be exactly 100`);

      blueprint.forEach((q, idx) => {
        assert.equal(q.qNo, `Q${idx + 1}`, `${name} question ordering must be Q1..Q9`);
        const expectedMarks = idx < 7 ? 10 : 15;
        assert.equal(q.marks, expectedMarks, `${name} ${q.qNo} must be ${expectedMarks}M`);

        const subSum = q.subQuestions.reduce((s, sq) => s + sq.marks, 0);
        assert.equal(subSum, q.marks, `${name} ${q.qNo} sub-questions must sum to ${q.marks}`);

        assert.ok(q.targetTopicIds.length >= 1, `${name} ${q.qNo} must target at least 1 topic`);
        for (const tid of q.targetTopicIds) {
          assert.ok(validTopicIds.has(tid), `${name} ${q.qNo} references invalid topic ${tid}`);
        }
      });
    }
  });

  it('validates Gamma synthesis arbitration rows (Q1..Q9) with confidence and consensus decisions', () => {
    assert.equal(GAMMA_SYNTHESIS_ROWS.length, 9, 'Must have 9 synthesis rows');

    GAMMA_SYNTHESIS_ROWS.forEach((row, idx) => {
      assert.equal(row.qNo, `Q${idx + 1}`);
      assert.equal(row.marks, idx < 7 ? 10 : 15);
      assert.ok(['Unanimous Lock', 'Consensus + Split', 'Arbitrated Anchor'].includes(row.consensusType));
      assert.ok(row.confidencePct >= 80 && row.confidencePct <= 100);
      assert.ok(row.gammaDecision.length > 20, `Missing decision detail on row ${row.id}`);
      assert.ok(row.alphaPick.length > 5, `Missing alphaPick on row ${row.id}`);
      assert.ok(row.betaPick.length > 5, `Missing betaPick on row ${row.id}`);
    });
  });

  it('resolves real slot question links across C1 Set 2-2, C1 Set 1-2, C2, and F1 slot', () => {
    assert.equal(F1_SLOT_QUESTIONS.length, 10, 'F1 slot must have 10 questions');
    const f1Sum = F1_SLOT_QUESTIONS.reduce((s, q) => s + q.marks, 0);
    assert.equal(f1Sum, 100, 'F1 slot must total 100 marks');

    const f1Q1 = getSlotQuestionLink('f1', 'Q1');
    assert.ok(f1Q1, 'Should resolve F1 Q1');
    assert.equal(f1Q1.marks, 10);
    assert.ok(f1Q1.title.includes('Dual-Mode'));

    const c122Q5 = getSlotQuestionLink('c1-2-2', 'Q5');
    assert.ok(c122Q5, 'Should resolve C1 Set 2-2 Q5');
    assert.equal(c122Q5.marks, 15);
    assert.ok(c122Q5.title.includes('Preemptive Priority'));

    const c2Q8 = getSlotQuestionLink('c2', 'Q8');
    assert.ok(c2Q8, 'Should resolve C2 Q8');
    assert.equal(c2Q8.marks, 10);
    assert.ok(c2Q8.title.includes('TLB'));
  });

  it('buildCoverageMatrix and buildPredictionModels backward compatibility', () => {
    const flatTopics = MODULES.flatMap((m) =>
      m.topics.map((t) => ({
        moduleId: m.id,
        moduleCode: m.code,
        topicId: t.id,
        topicTitle: t.title,
      }))
    );

    const matrix = buildCoverageMatrix(flatTopics, SLOT_FORENSIC_ITEMS);
    assert.equal(matrix.length, 30);

    const models = buildPredictionModels(flatTopics, SLOT_FORENSIC_ITEMS);
    assert.equal(models.alphaGapPaper.totalMarks, 100);
    assert.equal(models.betaRotationPaper.totalMarks, 100);
    assert.equal(models.gammaConsensusPaper.totalMarks, 100);
    assert.ok(models.untestedTopicsCount >= 5);
  });
});
