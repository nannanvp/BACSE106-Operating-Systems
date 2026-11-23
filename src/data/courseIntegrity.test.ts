import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { MODULES, SPRINT_BLOCKS, FLASHCARDS, MOCK_MCQS, EXAMINER_TRAPS } from './courseData';
import { ALL_TOPIC_NOTES, TOPIC_NOTES_BY_ID } from './topicNotes';
import { EXAM_PAPERS, SLOT_FORENSIC_ITEMS } from './slotPaperAnalysis';
import { STANDING_QUESTIONS_BY_MODULE, ALL_STANDING_QUESTIONS, MODULE_REFRESHERS } from './standingData';
import { buildPredictionModels } from '../utils/predictionEngine';

describe('BACSE106 Course Data Integrity Gate', () => {
  const validModuleIds = new Set(MODULES.map((m) => m.id));
  const validTopicIds = new Set(MODULES.flatMap((m) => m.topics.map((t) => t.id)));

  it('has 5 modules covering 26+ syllabus topics with unique IDs and matching TopicNote entries', () => {
    assert.equal(MODULES.length, 5);
    assert.ok(validTopicIds.size >= 25);
    assert.equal(ALL_TOPIC_NOTES.length, validTopicIds.size);

    for (const topicId of validTopicIds) {
      const note = TOPIC_NOTES_BY_ID[topicId];
      assert.ok(note, `Missing TopicNote for topicId=${topicId}`);
      assert.ok(note.keyPoints.length >= 4, `${topicId} needs >=4 keyPoints`);
      assert.ok(note.sections.length >= 1, `${topicId} needs >=1 section`);
      assert.ok(note.selfChecks.length >= 2, `${topicId} needs >=2 selfChecks`);
      for (const sc of note.selfChecks) {
        assert.equal(sc.options.length, 4);
        assert.ok(sc.correctIndex >= 0 && sc.correctIndex <= 3);
      }
    }
  });

  it('has exactly 30 tiered Standing questions per module (10 Foundation + 10 Application + 10 Analysis = 150)', () => {
    assert.equal(ALL_STANDING_QUESTIONS.length, 150);
    const seenIds = new Set<string>();

    for (const mod of MODULES) {
      const qs = STANDING_QUESTIONS_BY_MODULE[mod.id];
      assert.equal(qs.length, 30, `${mod.id} must have 30 questions`);
      assert.ok(MODULE_REFRESHERS[mod.id], `Missing refresher for ${mod.id}`);

      const counts = { foundation: 0, application: 0, analysis: 0 };
      for (const q of qs) {
        assert.ok(!seenIds.has(q.id), `Duplicate standing question id: ${q.id}`);
        seenIds.add(q.id);
        assert.equal(q.moduleId, mod.id);
        assert.ok(validTopicIds.has(q.topicId), `Invalid topicId ${q.topicId} in ${q.id}`);
        assert.equal(q.options.length, 4);
        assert.ok(q.correctIndex >= 0 && q.correctIndex <= 3);
        counts[q.tier] += 1;
      }
      assert.deepEqual(counts, { foundation: 10, application: 10, analysis: 10 });
    }
  });

  it('validates all 4 Exam Papers sum strictly to 100 marks (both question sum and sub-part sum)', () => {
    assert.equal(EXAM_PAPERS.length, 4);
    const seenPaperIds = new Set<string>();

    for (const paper of EXAM_PAPERS) {
      assert.ok(!seenPaperIds.has(paper.id));
      seenPaperIds.add(paper.id);
      assert.equal(paper.totalMarks, 100);

      let qSum = 0;
      for (const q of paper.questions) {
        assert.ok(validModuleIds.has(q.moduleId));
        assert.ok(validTopicIds.has(q.topicId), `Invalid topicId ${q.topicId} in ${paper.id} ${q.qNo}`);
        const subSum = q.subParts.reduce((acc, sp) => acc + sp.maxMarks, 0);
        assert.equal(subSum, q.marks, `${paper.id} ${q.qNo} subParts (${subSum}) != marks (${q.marks})`);
        qSum += q.marks;
      }
      assert.equal(qSum, 100, `Paper ${paper.id} sums to ${qSum} instead of 100`);
    }
  });

  it('validates 50 Flashcards, 50 MCQs, 15 Sprint Blocks, 20 Traps, and Prediction 100M models', () => {
    assert.equal(FLASHCARDS.length, 50);
    assert.equal(MOCK_MCQS.length, 50);
    assert.equal(SPRINT_BLOCKS.length, 15);
    assert.equal(EXAMINER_TRAPS.length, 20);

    for (const fc of FLASHCARDS) {
      assert.ok(validModuleIds.has(fc.moduleId));
      assert.ok(validTopicIds.has(fc.topicId), `Invalid flashcard topicId: ${fc.topicId}`);
    }

    for (const mcq of MOCK_MCQS) {
      assert.ok(validModuleIds.has(mcq.moduleId));
      assert.ok(validTopicIds.has(mcq.topicId), `Invalid MCQ topicId: ${mcq.topicId}`);
      assert.equal(mcq.options.length, 4);
      assert.ok(mcq.correctIndex >= 0 && mcq.correctIndex <= 3);
    }

    for (const item of SLOT_FORENSIC_ITEMS) {
      assert.ok(validTopicIds.has(item.topicId), `Invalid forensic topicId: ${item.topicId}`);
    }

    const flatTopics = MODULES.flatMap((m) =>
      m.topics.map((t) => ({
        moduleId: m.id,
        moduleCode: m.code,
        topicId: t.id,
        topicTitle: t.title,
      }))
    );
    const pred = buildPredictionModels(flatTopics, SLOT_FORENSIC_ITEMS);
    assert.equal(pred.alphaGapPaper.totalMarks, 100);
    assert.equal(pred.betaRotationPaper.totalMarks, 100);
    assert.equal(pred.gammaConsensusPaper.totalMarks, 100);
    assert.ok(pred.untestedTopicsCount >= 5, 'Should surface real untested syllabus gaps (Files + Security)');
  });
});
