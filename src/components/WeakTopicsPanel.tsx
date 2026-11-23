import React from 'react';
import { AlertTriangle, BookOpen, CheckCircle2, RotateCcw } from 'lucide-react';
import { AnnotatedWeakTopic } from '../utils/weakTopicsEngine';

interface WeakTopicsPanelProps {
  topics: AnnotatedWeakTopic[];
  onOpenTopicInSyllabus: (moduleId: string, topicId: string) => void;
  onMarkReviewed: (topicId: string, resolve: boolean) => void;
}

export const WeakTopicsPanel: React.FC<WeakTopicsPanelProps> = ({
  topics,
  onOpenTopicInSyllabus,
  onMarkReviewed,
}) => {
  if (topics.length === 0) {
    return (
      <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-6 text-center">
        <CheckCircle2 className="w-7 h-7 mx-auto text-[var(--div-m3)] mb-2" />
        <h3 className="text-base font-bold text-[var(--ink-primary)]">Weak Topics Queue Clear</h3>
        <p className="text-sm text-[var(--ink-secondary)] mt-1 max-w-md mx-auto">
          Missed questions from Standing Diagnostics, Syllabus Self-Checks, MCQ Drills, and the
          Numerical Drill Arena automatically collect here for targeted recovery.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {topics.map((item) => (
        <div
          key={item.topicId}
          className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded-[2px] bg-[var(--bg-recessed)] border border-[var(--rule-hairline)] text-[var(--ink-primary)] uppercase">
                {item.moduleId}
              </span>
              <h4 className="text-sm font-bold text-[var(--ink-primary)]">{item.topicTitle}</h4>
              {item.isPinnedUrgent && (
                <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-[var(--div-danger)]">
                  <AlertTriangle className="w-3.5 h-3.5" /> URGENT PINNED
                </span>
              )}
              {item.isRecentlyReviewed && (
                <span className="font-mono text-[11px] font-semibold text-[var(--div-m3)]">
                  · Reviewed &lt;1h ago
                </span>
              )}
            </div>
            <div className="font-mono text-xs text-[var(--ink-muted)] tabular-nums">
              {item.missCount} miss{item.missCount === 1 ? '' : 'es'} · Sources:{' '}
              {item.sources.join(', ')}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onOpenTopicInSyllabus(item.moduleId, item.topicId)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] text-xs font-semibold bg-[var(--ink-primary)] text-[var(--bg-paper)] hover:opacity-90 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Study Note
            </button>
            <button
              type="button"
              onClick={() => onMarkReviewed(item.topicId, false)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[2px] text-xs font-medium border border-[var(--rule-hairline)] bg-[var(--bg-sheet)] text-[var(--ink-secondary)] hover:bg-[var(--bg-recessed)] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reviewed
            </button>
            <button
              type="button"
              onClick={() => onMarkReviewed(item.topicId, true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[2px] text-xs font-medium border border-[var(--div-m3)] text-[var(--div-m3)] hover:bg-[var(--bg-recessed)] cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Resolve
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
