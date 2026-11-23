export type SrsProfile = 'fat48h' | 'longterm';
export type SrsRating = 'again' | 'hard' | 'good' | 'easy';

export interface SrsCardState {
  cardId: string;
  easeFactor: number; // floor 1.30
  intervalMs: number;
  repetitions: number;
  lapses: number;
  lastReviewedAt: number;
  dueAt: number;
}

export interface SrsForecastBuckets {
  dueNow: number;
  within2h: number;
  within12h: number;
  later: number;
}

const MIN_EF = 1.3;
const DEFAULT_EF = 2.5;
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function createInitialCardState(cardId: string, nowMs = Date.now()): SrsCardState {
  return {
    cardId,
    easeFactor: DEFAULT_EF,
    intervalMs: 0,
    repetitions: 0,
    lapses: 0,
    lastReviewedAt: 0,
    dueAt: nowMs,
  };
}

export function reviewCard(
  prev: SrsCardState | undefined,
  cardId: string,
  rating: SrsRating,
  profile: SrsProfile,
  nowMs = Date.now()
): SrsCardState {
  const base = prev ?? createInitialCardState(cardId, nowMs);
  const quality =
    rating === 'again' ? 1 : rating === 'hard' ? 3 : rating === 'good' ? 4 : 5;

  // Classic SM-2 ease factor update with strict 1.30 floor
  const nextEf = Math.max(
    MIN_EF,
    Number(
      (
        base.easeFactor +
        (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
      ).toFixed(2)
    )
  );

  let nextReps = base.repetitions;
  let nextLapses = base.lapses;
  let intervalMs: number;

  if (rating === 'again') {
    nextReps = 0;
    nextLapses += 1;
    intervalMs = profile === 'fat48h' ? 5 * MINUTE : 10 * MINUTE;
  } else {
    nextReps += 1;
    if (profile === 'fat48h') {
      // Compressed 48-hour FAT exam intervals
      if (nextReps === 1) {
        intervalMs =
          rating === 'hard' ? 20 * MINUTE : rating === 'good' ? 45 * MINUTE : 2 * HOUR;
      } else if (nextReps === 2) {
        intervalMs =
          rating === 'hard' ? 90 * MINUTE : rating === 'good' ? 3 * HOUR : 6 * HOUR;
      } else {
        const multiplier = rating === 'hard' ? 1.2 : rating === 'good' ? nextEf : nextEf * 1.3;
        intervalMs = Math.min(24 * HOUR, Math.round(Math.max(base.intervalMs, 2 * HOUR) * multiplier));
      }
    } else {
      // Standard long-term SM-2 day intervals
      if (nextReps === 1) {
        intervalMs = rating === 'hard' ? 12 * HOUR : rating === 'good' ? 1 * DAY : 3 * DAY;
      } else if (nextReps === 2) {
        intervalMs = rating === 'hard' ? 2 * DAY : rating === 'good' ? 6 * DAY : 10 * DAY;
      } else {
        const multiplier = rating === 'hard' ? 1.2 : rating === 'good' ? nextEf : nextEf * 1.3;
        intervalMs = Math.round(Math.max(base.intervalMs, 1 * DAY) * multiplier);
      }
    }
  }

  return {
    cardId,
    easeFactor: nextEf,
    intervalMs,
    repetitions: nextReps,
    lapses: nextLapses,
    lastReviewedAt: nowMs,
    dueAt: nowMs + intervalMs,
  };
}

export function sortCardsByDueOrder<T extends { id: string }>(
  cards: T[],
  states: Record<string, SrsCardState>,
  nowMs = Date.now()
): T[] {
  return [...cards].sort((a, b) => {
    const sa = states[a.id];
    const sb = states[b.id];
    const aDue = sa ? sa.dueAt : nowMs - 1;
    const bDue = sb ? sb.dueAt : nowMs - 1;
    const aOverdue = aDue <= nowMs;
    const bOverdue = bDue <= nowMs;
    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
    // Unseen cards come after lapsed/overdue reviewed cards, or sorted by dueAt ascending
    return aDue - bDue;
  });
}

export function computeSrsForecast(
  cardIds: string[],
  states: Record<string, SrsCardState>,
  nowMs = Date.now()
): SrsForecastBuckets {
  const buckets: SrsForecastBuckets = {
    dueNow: 0,
    within2h: 0,
    within12h: 0,
    later: 0,
  };

  for (const id of cardIds) {
    const st = states[id];
    if (!st || st.dueAt <= nowMs) {
      buckets.dueNow += 1;
    } else if (st.dueAt <= nowMs + 2 * HOUR) {
      buckets.within2h += 1;
    } else if (st.dueAt <= nowMs + 12 * HOUR) {
      buckets.within12h += 1;
    } else {
      buckets.later += 1;
    }
  }

  return buckets;
}

export function formatIntervalLabel(intervalMs: number): string {
  if (intervalMs < HOUR) {
    return `${Math.max(1, Math.round(intervalMs / MINUTE))}m`;
  }
  if (intervalMs < DAY) {
    return `${Number((intervalMs / HOUR).toFixed(1))}h`;
  }
  return `${Number((intervalMs / DAY).toFixed(1))}d`;
}
