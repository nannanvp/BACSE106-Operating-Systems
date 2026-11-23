import React, { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { OS_FORMULAS, filterFormulas } from '../utils/formulaQuickRefEngine';

interface FormulaQuickRefProps {
  open: boolean;
  onClose: () => void;
  onJumpToModule?: (moduleId: string) => void;
}

export const FormulaQuickRef: React.FC<FormulaQuickRefProps> = ({
  open,
  onClose,
  onJumpToModule,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    const t = window.setTimeout(() => inputRef.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const filtered = filterFormulas(OS_FORMULAS, query);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-14 sm:pt-20"
      role="dialog"
      aria-modal="true"
      aria-labelledby="formula-quickref-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[2px] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[var(--rule-hairline)] bg-[var(--bg-board)]">
          <div>
            <h2 id="formula-quickref-title" className="text-base font-bold text-[var(--ink-primary)]">
              BACSE106 Formula Quick-Reference
            </h2>
            <p className="font-mono text-xs text-[var(--ink-muted)]">
              Multi-token search (e.g., "tlb eat", "banker", "inode", "raid") · Esc to close
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close formula quick reference"
            className="p-1.5 rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-paper)] text-[var(--ink-primary)] hover:bg-[var(--bg-recessed)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 border-b border-[var(--rule-hairline)] bg-[var(--bg-sheet)]">
          <div className="relative">
            <Search className="w-4 h-4 text-[var(--ink-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter formulas across M2–M5..."
              aria-label="Search OS formulas"
              className="w-full pl-9 pr-3 py-2 text-sm font-mono bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] text-[var(--ink-primary)] focus:outline-none focus:border-[var(--ink-primary)]"
            />
          </div>
        </div>

        <div className="overflow-y-auto p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-8 font-mono text-sm text-[var(--ink-muted)]">
              No formulas match "{query}". Try "eat", "cpu", "peterson", "inode", or "disk".
            </div>
          ) : (
            filtered.map((entry) => (
              <div
                key={entry.id}
                className="bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px] p-3.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded-[2px] bg-[var(--bg-recessed)] border border-[var(--rule-hairline)] text-[var(--ink-primary)]">
                      {entry.moduleCode}
                    </span>
                    <h3 className="text-sm font-bold text-[var(--ink-primary)]">{entry.title}</h3>
                  </div>
                  {onJumpToModule && (
                    <button
                      type="button"
                      onClick={() => {
                        onJumpToModule(entry.moduleId);
                        onClose();
                      }}
                      className="font-mono text-xs underline text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] cursor-pointer"
                    >
                      Open {entry.moduleCode} Notes
                    </button>
                  )}
                </div>
                <div className="font-mono text-xs sm:text-sm bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] px-3 py-2 text-[var(--ink-primary)] overflow-x-auto">
                  {entry.formula}
                </div>
                <div className="mt-2 text-xs text-[var(--ink-secondary)] space-y-1">
                  <div>
                    <span className="font-mono font-semibold text-[var(--ink-muted)]">Conditions: </span>
                    {entry.unitsOrCondition}
                  </div>
                  <div className="text-[var(--div-danger)]">
                    <span className="font-mono font-semibold">Exam Trap: </span>
                    {entry.trapNote}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
