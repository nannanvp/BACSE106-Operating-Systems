export type ExamPhase =
  | 'pre-sprint' // > 48h before exam
  | 'sprint-48h' // 24h..48h before exam
  | 'final-24h' // 3h..24h before exam
  | 'exam-morning' // 0..3h before exam
  | 'in-exam' // during exam window
  | 'completed'; // after exam end

export interface CountdownSnapshot {
  phase: ExamPhase;
  phaseLabel: string;
  guidance: string;
  remainingMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  progressPct: number; // progress through 48h sprint or 3h exam
}

const HOUR = 60 * 60 * 1000;

export function computeExamCountdown(
  examStartIso: string,
  durationMinutes: number,
  nowMs = Date.now()
): CountdownSnapshot {
  const startMs = Date.parse(examStartIso);
  const endMs = startMs + durationMinutes * 60 * 1000;
  const diffToStart = startMs - nowMs;

  if (nowMs >= endMs) {
    return {
      phase: 'completed',
      phaseLabel: 'EXAM CONCLUDED',
      guidance: 'BACSE106 FAT window has finished. Great work — keep notes archived for viva/interviews.',
      remainingMs: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      progressPct: 100,
    };
  }

  if (nowMs >= startMs && nowMs < endMs) {
    const rem = endMs - nowMs;
    const total = endMs - startMs;
    const hours = Math.floor(rem / HOUR);
    const minutes = Math.floor((rem % HOUR) / 60000);
    const seconds = Math.floor((rem % 60000) / 1000);
    return {
      phase: 'in-exam',
      phaseLabel: 'EXAM IN PROGRESS',
      guidance: 'Pace 10M questions at 15 min and 15M numericals at 22 min. Reserve final 15 min for audit.',
      remainingMs: rem,
      days: 0,
      hours,
      minutes,
      seconds,
      progressPct: Math.min(100, Math.round(((total - rem) / total) * 100)),
    };
  }

  const days = Math.floor(diffToStart / (24 * HOUR));
  const hours = Math.floor((diffToStart % (24 * HOUR)) / HOUR);
  const minutes = Math.floor((diffToStart % HOUR) / 60000);
  const seconds = Math.floor((diffToStart % 60000) / 1000);

  let phase: ExamPhase;
  let phaseLabel: string;
  let guidance: string;

  if (diffToStart > 48 * HOUR) {
    phase = 'pre-sprint';
    phaseLabel: 'PRE-SPRINT PREP';
    phaseLabel = 'PRE-SPRINT PREP';
    guidance = 'Run all 5 Standing Diagnostics first so your 48-hour sprint targets actual weak COs.';
  } else if (diffToStart > 24 * HOUR) {
    phase = 'sprint-48h';
    phaseLabel = '48-HOUR SPRINT · DAY 1';
    guidance = 'Lock down M2 (CPU/Banker’s) and M4 (Paging/Placement/Files) — together ~45% of every FAT paper.';
  } else if (diffToStart > 3 * HOUR) {
    phase = 'final-24h';
    phaseLabel = 'FINAL 24 HOURS · DAY 2';
    guidance = 'Complete M3 Sync & M5 Disk/Security/Virtualization, then run one full timed 100M paper.';
  } else {
    phase = 'exam-morning';
    phaseLabel = 'EXAM MORNING · FINAL CHECK';
    guidance = 'No new theory. Scan the 2-Page A4 Formula Sheet, 20 Examiner Traps, and Weak Topics Queue.';
  }

  const sprintWindow = 48 * HOUR;
  const progressPct =
    diffToStart >= sprintWindow
      ? 0
      : Math.min(100, Math.round(((sprintWindow - diffToStart) / sprintWindow) * 100));

  return {
    phase,
    phaseLabel,
    guidance,
    remainingMs: diffToStart,
    days,
    hours,
    minutes,
    seconds,
    progressPct,
  };
}
