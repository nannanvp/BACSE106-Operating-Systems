export type WeakTopicSource = 'standing' | 'mcq' | 'self-check' | 'drill';

export interface WeakTopicRecord {
  topicId: string;
  moduleId: string;
  topicTitle: string;
  missCount: number;
  sources: WeakTopicSource[];
  lastMissedAt: number;
  lastReviewedAt: number | null;
  resolved: boolean;
}

export interface AnnotatedWeakTopic extends WeakTopicRecord {
  isPinnedUrgent: boolean; // >=3 misses AND >=2h since last review (or never reviewed & >=2h old)
  isRecentlyReviewed: boolean; // reviewed within last 1h
}

const HOUR = 60 * 60 * 1000;

export function recordWeakTopicMiss(
  records: Record<string, WeakTopicRecord>,
  payload: {
    topicId: string;
    moduleId: string;
    topicTitle: string;
    source: WeakTopicSource;
  },
  nowMs = Date.now()
): Record<string, WeakTopicRecord> {
  const existing = records[payload.topicId];
  if (existing) {
    const sources = existing.sources.includes(payload.source)
      ? existing.sources
      : [...existing.sources, payload.source];
    return {
      ...records,
      [payload.topicId]: {
        ...existing,
        topicTitle: payload.topicTitle || existing.topicTitle,
        missCount: existing.missCount + 1,
        sources,
        lastMissedAt: nowMs,
        resolved: false,
      },
    };
  }

  return {
    ...records,
    [payload.topicId]: {
      topicId: payload.topicId,
      moduleId: payload.moduleId,
      topicTitle: payload.topicTitle,
      missCount: 1,
      sources: [payload.source],
      lastMissedAt: nowMs,
      lastReviewedAt: null,
      resolved: false,
    },
  };
}

export function markWeakTopicReviewed(
  records: Record<string, WeakTopicRecord>,
  topicId: string,
  resolve = false,
  nowMs = Date.now()
): Record<string, WeakTopicRecord> {
  const existing = records[topicId];
  if (!existing) return records;
  return {
    ...records,
    [topicId]: {
      ...existing,
      lastReviewedAt: nowMs,
      resolved: resolve,
    },
  };
}

export function getSortedWeakTopics(
  records: Record<string, WeakTopicRecord>,
  nowMs = Date.now(),
  includeResolved = false
): AnnotatedWeakTopic[] {
  const list = Object.values(records)
    .filter((r) => includeResolved || !r.resolved)
    .map((r): AnnotatedWeakTopic => {
      const refTime = r.lastReviewedAt ?? r.lastMissedAt;
      const overdue2h = nowMs - refTime >= 2 * HOUR;
      const isPinnedUrgent = !r.resolved && r.missCount >= 3 && overdue2h;
      const isRecentlyReviewed =
        r.lastReviewedAt !== null && nowMs - r.lastReviewedAt < 1 * HOUR;
      return {
        ...r,
        isPinnedUrgent,
        isRecentlyReviewed,
      };
    });

  return list.sort((a, b) => {
    if (a.isPinnedUrgent !== b.isPinnedUrgent) return a.isPinnedUrgent ? -1 : 1;
    if (a.missCount !== b.missCount) return b.missCount - a.missCount;
    return b.lastMissedAt - a.lastMissedAt;
  });
}
