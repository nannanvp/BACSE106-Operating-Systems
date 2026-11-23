import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { COURSE_META } from '../data/courseData';
import { computeExamCountdown } from '../utils/countdownEngine';

interface ExamCountdownProps {
  variant?: 'compact' | 'hero';
}

export const ExamCountdown: React.FC<ExamCountdownProps> = ({ variant = 'hero' }) => {
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const snap = computeExamCountdown(COURSE_META.examStartIso, COURSE_META.durationMinutes, nowMs);
  const pad = (n: number) => String(n).padStart(2, '0');

  if (variant === 'compact') {
    const timeStr =
      snap.phase === 'completed'
        ? 'CONCLUDED'
        : snap.days > 0
          ? `${snap.days}d ${pad(snap.hours)}:${pad(snap.minutes)}:${pad(snap.seconds)}`
          : `${pad(snap.hours)}:${pad(snap.minutes)}:${pad(snap.seconds)}`;

    return (
      <div
        className="flex items-center gap-1.5 font-mono text-xs tabular-nums text-[var(--ink-primary)] px-2 py-1 rounded-[2px] bg-[var(--bg-recessed)] border border-[var(--rule-hairline)]"
        title={`${COURSE_META.examDateDisplay} · ${snap.phaseLabel}`}
      >
        <Clock className="w-3.5 h-3.5 text-[var(--div-m2)] shrink-0" />
        <span className="font-semibold">{timeStr}</span>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--rule-hairline)]">
        <h3 className="text-base font-bold text-[var(--ink-primary)]">
          FAT Exam Countdown · {COURSE_META.examDateDisplay}
        </h3>
        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-[2px] bg-[var(--bg-recessed)] border border-[var(--rule-hairline)] text-[var(--ink-primary)]">
          {snap.phaseLabel}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:gap-3 my-4">
        {[
          { label: 'Days', value: pad(snap.days) },
          { label: 'Hours', value: pad(snap.hours) },
          { label: 'Minutes', value: pad(snap.minutes) },
          { label: 'Seconds', value: pad(snap.seconds) },
        ].map((unit) => (
          <div
            key={unit.label}
            className="bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px] py-2.5 px-2 text-center"
          >
            <div className="font-mono text-2xl sm:text-3xl font-bold tabular-nums text-[var(--ink-primary)]">
              {unit.value}
            </div>
            <div className="font-mono text-[11px] text-[var(--ink-muted)] mt-0.5">
              {unit.label}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between font-mono text-xs text-[var(--ink-muted)] tabular-nums">
          <span>48-Hour Sprint Window Elapsed</span>
          <span>{snap.progressPct}%</span>
        </div>
        <div className="h-1.5 w-full bg-[var(--bg-recessed)] rounded-[1px] overflow-hidden">
          <div
            className="h-full bg-[var(--div-m2)] transition-all duration-300"
            style={{ width: `${snap.progressPct}%` }}
          />
        </div>
        <p className="text-sm text-[var(--ink-secondary)] pt-1">{snap.guidance}</p>
      </div>
    </div>
  );
};
