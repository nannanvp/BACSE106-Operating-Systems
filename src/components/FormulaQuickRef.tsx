import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy, Printer, Search, X } from 'lucide-react';
import { COURSE_META, EXAMINER_TRAPS } from '../data/courseData';
import { buildCheatSheetHtml, printCheatSheetHtml } from '../utils/cheatSheetPrintEngine';
import { FormulaEntry, OS_FORMULAS, filterFormulas } from '../utils/formulaQuickRefEngine';

interface FormulaQuickRefProps {
  open: boolean;
  onClose: () => void;
  onJumpToModule?: (moduleId: string) => void;
}

const MODULE_PALETTE: Record<string, { label: string; bg: string; text: string }> = {
  m2: { label: 'M2 · CPU & Deadlocks', bg: 'var(--div-m2)', text: '#ffffff' },
  m3: { label: 'M3 · Synchronization', bg: 'var(--div-m3)', text: '#ffffff' },
  m4: { label: 'M4 · Memory & Paging', bg: 'var(--div-m4)', text: '#ffffff' },
  m5: { label: 'M5 · Disk, RAID & Sec', bg: 'var(--div-m5)', text: '#ffffff' },
};

export const FormulaQuickRef: React.FC<FormulaQuickRefProps> = ({
  open,
  onClose,
  onJumpToModule,
}) => {
  const [query, setQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<'all' | 'm2' | 'm3' | 'm4' | 'm5'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setSelectedModule('all');
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [open]);

  const filtered = useMemo(() => {
    const list =
      selectedModule === 'all'
        ? OS_FORMULAS
        : OS_FORMULAS.filter((f) => f.moduleId === selectedModule);
    return filterFormulas(list, query);
  }, [selectedModule, query]);

  const handleCopy = (entry: FormulaEntry) => {
    navigator.clipboard?.writeText?.(entry.formula);
    setCopiedId(entry.id);
    setTimeout(() => {
      setCopiedId((curr) => (curr === entry.id ? null : curr));
    }, 1800);
  };

  const handlePrint = () => {
    const html = buildCheatSheetHtml({
      courseCode: COURSE_META.code,
      courseTitle: COURSE_META.title,
      examDateLabel: COURSE_META.examDateDisplay,
      formulas: OS_FORMULAS,
      examinerTraps: EXAMINER_TRAPS.map((t) => ({
        title: t.title,
        fix: t.fix,
        moduleCode: t.moduleCode,
      })),
      comparisonRows: [
        {
          label: 'Monolithic vs Microkernel',
          summary:
            'Monolithic: Ring-0 direct C calls, fastest, driver crash panics OS. Microkernel: Ring-3 servers + IPC message passing, fault-isolated, higher context-switch cost.',
        },
        {
          label: 'Paging vs Segmentation',
          summary:
            'Paging: fixed frames, zero external fragmentation, slight internal frag. Segmentation: logical variable regions, external frag, strict offset < limit check.',
        },
        {
          label: 'OPT / LRU vs FIFO',
          summary:
            'OPT & LRU are Stack Algorithms (zero Belady anomaly). FIFO suffers Belady anomaly (more frames -> more faults on 1,2,3,4,1,2,5,1,2,3,4,5).',
        },
        {
          label: 'SCAN vs LOOK',
          summary:
            'SCAN/C-SCAN travel all the way to physical boundary cylinders (0/maxTrack). LOOK/C-LOOK reverse immediately at the furthest pending request.',
        },
        {
          label: 'ACL vs Capability List',
          summary:
            'ACL = column of Access Matrix stored per object (easy revocation, slower check). Capability = row stored per domain (fast unforgeable token, hard global revoke).',
        },
        {
          label: 'VMs vs Containers',
          summary:
            'VMs run full Guest OS atop Hypervisor (strong kernel isolation, GB RAM). Containers share Host Kernel via Namespaces + cgroups (ms boot, MB RAM).',
        },
      ],
    });
    printCheatSheetHtml(html);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/65 backdrop-blur-[2px] p-3 sm:p-5 pt-10 sm:pt-16"
      role="dialog"
      aria-modal="true"
      aria-labelledby="formula-quickref-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[3px] shadow-2xl overflow-hidden flex flex-col max-h-[86vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-[var(--rule-hairline)] bg-[var(--bg-board)]">
          <div>
            <h2 id="formula-quickref-title" className="text-base sm:text-lg font-bold text-[var(--ink-primary)]">
              {COURSE_META.code} Operating Systems Formula Quick-Reference
            </h2>
            <p className="font-mono text-xs text-[var(--ink-muted)]">
              Searchable formulas across M2–M5 with units, conditions &amp; examiner traps · Esc to close
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-semibold rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-paper)] text-[var(--ink-primary)] hover:bg-[var(--bg-recessed)] step-hinge"
              title="Print 2-Page A4 Cheat Sheet"
            >
              <Printer className="w-3.5 h-3.5 text-[var(--div-m4)]" />
              <span>Print A4</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close formula quick reference"
              className="p-1.5 rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-paper)] text-[var(--ink-primary)] hover:bg-[var(--bg-recessed)] cursor-pointer step-hinge"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-3 sm:p-4 border-b border-[var(--rule-hairline)] bg-[var(--bg-sheet)] space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-[var(--ink-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Multi-token search (e.g. 'tlb eat', 'banker', 'inode', 'disk', 'peterson')..."
              aria-label="Search OS formulas"
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm font-mono bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--ink-primary)]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] hover:text-[var(--ink-primary)] p-0.5"
                aria-label="Clear search query"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
              {(['all', 'm2', 'm3', 'm4', 'm5'] as const).map((mId) => {
                const active = selectedModule === mId;
                return (
                  <button
                    key={mId}
                    type="button"
                    onClick={() => setSelectedModule(mId)}
                    className={`px-2 py-0.5 rounded-[2px] border font-bold uppercase transition-colors ${
                      active
                        ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)]'
                        : 'bg-[var(--bg-paper)] text-[var(--ink-secondary)] border-[var(--rule-hairline)] hover:bg-[var(--bg-recessed)]'
                    }`}
                  >
                    {mId === 'all' ? 'All (18)' : mId}
                  </button>
                );
              })}
            </div>

            <span className="font-mono text-xs text-[var(--ink-muted)] tabular-nums">
              {filtered.length} {filtered.length === 1 ? 'formula' : 'formulas'} matching
            </span>
          </div>
        </div>

        {/* Scrollable Formula List */}
        <div className="overflow-y-auto p-3 sm:p-5 space-y-3.5 divide-y divide-[var(--rule-hairline)]">
          {filtered.length === 0 ? (
            <div className="text-center py-12 font-mono text-xs sm:text-sm text-[var(--ink-muted)] space-y-2">
              <p>No formulas match "{query}".</p>
              <p className="text-[11px] text-[var(--ink-secondary)]">
                Try searching keywords like "eat", "tlb", "cpu", "banker", "peterson", "inode", "raid", or "look".
              </p>
            </div>
          ) : (
            filtered.map((entry) => {
              const pal = MODULE_PALETTE[entry.moduleId] ?? {
                label: entry.moduleCode,
                bg: 'var(--ink-primary)',
                text: '#ffffff',
              };
              const isCopied = copiedId === entry.id;

              return (
                <div
                  key={entry.id}
                  className="pt-3.5 first:pt-0 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-[2px] tracking-wide"
                        style={{ backgroundColor: pal.bg, color: pal.text }}
                      >
                        {entry.moduleCode}
                      </span>
                      <h3 className="text-sm font-bold text-[var(--ink-primary)]">
                        {entry.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopy(entry)}
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-mono rounded-[2px] border transition-colors ${
                          isCopied
                            ? 'bg-[#4F8A3D] text-[#FAF7F0] border-[#4F8A3D]'
                            : 'bg-[var(--bg-paper)] text-[var(--ink-primary)] border-[var(--rule-hairline)] hover:bg-[var(--bg-recessed)]'
                        }`}
                        title="Copy formula text to clipboard"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3 h-3 text-[#FAF7F0]" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-[var(--ink-muted)]" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      {onJumpToModule && (
                        <button
                          type="button"
                          onClick={() => {
                            onJumpToModule(entry.moduleId);
                            onClose();
                          }}
                          className="font-mono text-xs underline text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] cursor-pointer"
                        >
                          Notes &rarr;
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Formula expression plate */}
                  <div className="font-mono text-xs sm:text-sm bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px] px-3.5 py-2.5 text-[var(--ink-primary)] overflow-x-auto leading-relaxed">
                    {entry.formula}
                  </div>

                  {/* Meta: Conditions & Exam Trap */}
                  <div className="text-xs space-y-1 pt-0.5">
                    <div className="text-[var(--ink-secondary)] leading-snug">
                      <strong className="font-mono text-[11px] text-[var(--ink-muted)] uppercase tracking-wide">
                        Conditions &amp; Units:{' '}
                      </strong>
                      <span>{entry.unitsOrCondition}</span>
                    </div>

                    <div className="text-[var(--div-danger)] leading-snug bg-red-500/5 p-2 rounded-[2px] border border-red-500/20">
                      <strong className="font-mono text-[11px] uppercase tracking-wide">
                        Examiner Trap:{' '}
                      </strong>
                      <span>{entry.trapNote}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-5 py-2.5 border-t border-[var(--rule-hairline)] bg-[var(--bg-board)] flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-[var(--ink-muted)]">
          <span>Formula Reference · BACSE106 Operating Systems</span>
          <span>Tip: Press [Esc] or click outside to close</span>
        </div>
      </div>
    </div>
  );
};
