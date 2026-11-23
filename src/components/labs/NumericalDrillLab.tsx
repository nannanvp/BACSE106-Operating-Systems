import React, { useMemo, useState } from 'react';
import { CheckCircle2, Flame, RefreshCw, XCircle } from 'lucide-react';
import {
  DRILL_ARCHETYPES,
  DrillArchetype,
  generateDrillProblem,
  gradeNumericalAnswer,
} from '../../utils/numericalDrillEngine';
import { WeakTopicSource } from '../../utils/weakTopicsEngine';

interface NumericalDrillLabProps {
  onLogWeakTopic: (payload: {
    topicId: string;
    moduleId: string;
    topicTitle: string;
    source: WeakTopicSource;
  }) => void;
}

export const NumericalDrillLab: React.FC<NumericalDrillLabProps> = ({ onLogWeakTopic }) => {
  const [archetype, setArchetype] = useState<DrillArchetype>('cpu-avg-wt');
  const [seed, setSeed] = useState<number>(10601);
  const [inputValue, setInputValue] = useState('');
  const [submitted, setSubmitted] = useState<{
    validNumber: boolean;
    correct: boolean;
    delta: number;
  } | null>(null);
  const [streak, setStreak] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);

  const problem = useMemo(() => generateDrillProblem(archetype, seed), [archetype, seed]);

  const handleNewProblem = (nextArch?: DrillArchetype) => {
    if (nextArch) setArchetype(nextArch);
    setSeed((s) => s + 37);
    setInputValue('');
    setSubmitted(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    const res = gradeNumericalAnswer(inputValue, problem.expectedAnswer, problem.tolerance);
    setSubmitted(res);
    if (res.validNumber) {
      if (res.correct) {
        setStreak((st) => st + 1);
        setSolvedCount((c) => c + 1);
      } else {
        setStreak(0);
        onLogWeakTopic({
          topicId: problem.topicId,
          moduleId: problem.moduleId,
          topicTitle: problem.title,
          source: 'drill',
        });
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {DRILL_ARCHETYPES.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => handleNewProblem(a.id)}
              className={`px-2.5 py-1 font-mono text-xs font-semibold rounded-[2px] border transition-colors ${
                archetype === a.id
                  ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)]'
                  : 'bg-[var(--bg-paper)] text-[var(--ink-secondary)] border-[var(--rule-hairline)] hover:bg-[var(--bg-recessed)]'
              }`}
            >
              {a.moduleCode} · {a.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 font-mono text-xs tabular-nums">
          <span className="inline-flex items-center gap-1 font-bold text-[var(--div-m2)]">
            <Flame className="w-3.5 h-3.5" /> Streak: {streak}
          </span>
          <span className="text-[var(--ink-muted)]">Solved: {solvedCount}</span>
        </div>
      </div>

      <div className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[2px] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--rule-hairline)] font-mono text-xs text-[var(--ink-muted)]">
          <span>
            {problem.moduleCode} · Seed #{seed} · Tolerance ±{problem.tolerance} {problem.unit}
          </span>
          <button
            type="button"
            onClick={() => handleNewProblem()}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-sheet)] text-[var(--ink-primary)] hover:bg-[var(--bg-recessed)] font-semibold"
          >
            <RefreshCw className="w-3 h-3" /> Next Problem
          </button>
        </div>

        <h3 className="text-base sm:text-lg font-bold text-[var(--ink-primary)]">
          {problem.title}
        </h3>
        <p className="font-mono text-xs sm:text-sm bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px] p-3.5 text-[var(--ink-primary)] leading-relaxed">
          {problem.prompt}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2.5">
          <input
            type="text"
            inputMode="decimal"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Enter value (${problem.unit})...`}
            className="w-56 px-3 py-2 font-mono text-sm bg-[var(--bg-sheet)] border border-[var(--rule-strong)] rounded-[2px] text-[var(--ink-primary)] tabular-nums focus:outline-none"
          />
          <span className="font-mono text-xs text-[var(--ink-muted)]">{problem.unit}</span>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold rounded-[2px] bg-[var(--ink-primary)] text-[var(--bg-paper)] hover:opacity-90"
          >
            Check Answer
          </button>
          <button
            type="button"
            onClick={() =>
              setSubmitted({ validNumber: true, correct: false, delta: Infinity })
            }
            className="px-3 py-2 text-xs font-semibold rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-sheet)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
          >
            Reveal Derivation
          </button>
        </form>

        {submitted && (
          <div className="p-4 bg-[var(--bg-sheet)] border border-[var(--rule-strong)] rounded-[2px] space-y-2.5">
            {!submitted.validNumber ? (
              <div className="font-mono text-xs font-bold text-[var(--div-danger)]">
                Enter a valid numeric value (e.g., 22.50 or 130).
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 font-mono text-xs font-bold">
                  {submitted.correct ? (
                    <span className="inline-flex items-center gap-1.5 text-[var(--div-m3)]">
                      <CheckCircle2 className="w-4 h-4" /> EXACT MATCH · Expected{' '}
                      {problem.expectedAnswer} {problem.unit}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[var(--div-danger)]">
                      <XCircle className="w-4 h-4" /> Expected {problem.expectedAnswer}{' '}
                      {problem.unit} (Logged to Weak Topics Queue)
                    </span>
                  )}
                </div>
                <ol className="list-decimal pl-5 space-y-1 font-mono text-xs text-[var(--ink-secondary)]">
                  {problem.steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
