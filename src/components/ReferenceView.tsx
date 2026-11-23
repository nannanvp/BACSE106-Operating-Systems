import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Clock,
  Layers,
  Printer,
  RotateCw,
  ShieldAlert,
} from 'lucide-react';
import {
  COURSE_META,
  EXAMINER_BLUEPRINTS,
  EXAMINER_TRAPS,
  FLASHCARDS,
  MODULES,
  PACING_PLAN,
} from '../data/courseData';
import { buildCheatSheetHtml, printCheatSheetHtml } from '../utils/cheatSheetPrintEngine';
import { OS_FORMULAS } from '../utils/formulaQuickRefEngine';
import {
  SrsCardState,
  SrsProfile,
  SrsRating,
  computeSrsForecast,
  formatIntervalLabel,
  reviewCard,
  sortCardsByDueOrder,
} from '../utils/srsEngine';
import { MarkdownBlock } from './MarkdownBlock';

interface ReferenceViewProps {
  srsStates: Record<string, SrsCardState>;
  srsProfile: SrsProfile;
  onChangeSrsProfile: (profile: SrsProfile) => void;
  onRateCard: (cardId: string, rating: SrsRating) => void;
}

export const ReferenceView: React.FC<ReferenceViewProps> = ({
  srsStates,
  srsProfile,
  onChangeSrsProfile,
  onRateCard,
}) => {
  const [subTab, setSubTab] = useState<'flashcards' | 'playbook'>('flashcards');
  const [moduleFilter, setModuleFilter] = useState<'all' | 'm1' | 'm2' | 'm3' | 'm4' | 'm5'>('all');
  const [trapFilter, setTrapFilter] = useState<'all' | 'm1' | 'm2' | 'm3' | 'm4' | 'm5'>('all');
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const filteredCards = useMemo(() => {
    const base =
      moduleFilter === 'all' ? FLASHCARDS : FLASHCARDS.filter((c) => c.moduleId === moduleFilter);
    return sortCardsByDueOrder(base, srsStates);
  }, [moduleFilter, srsStates]);

  const currentCard = filteredCards[Math.min(cardIdx, Math.max(0, filteredCards.length - 1))];
  const forecast = useMemo(
    () =>
      computeSrsForecast(
        filteredCards.map((c) => c.id),
        srsStates
      ),
    [filteredCards, srsStates]
  );

  // Preview next intervals for 1..4 buttons
  const nextIntervals = useMemo(() => {
    if (!currentCard) return { again: '5m', hard: '20m', good: '45m', easy: '2h' };
    const st = srsStates[currentCard.id];
    const now = Date.now();
    return {
      again: formatIntervalLabel(reviewCard(st, currentCard.id, 'again', srsProfile, now).intervalMs),
      hard: formatIntervalLabel(reviewCard(st, currentCard.id, 'hard', srsProfile, now).intervalMs),
      good: formatIntervalLabel(reviewCard(st, currentCard.id, 'good', srsProfile, now).intervalMs),
      easy: formatIntervalLabel(reviewCard(st, currentCard.id, 'easy', srsProfile, now).intervalMs),
    };
  }, [currentCard, srsStates, srsProfile]);

  const handleRate = (rating: SrsRating) => {
    if (!currentCard) return;
    onRateCard(currentCard.id, rating);
    setFlipped(false);
    setCardIdx((i) => (i + 1 >= filteredCards.length ? 0 : i + 1));
  };

  // Keyboard shortcuts for Rapid Flashcard Deck
  useEffect(() => {
    if (subTab !== 'flashcards' || !currentCard) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag && ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === 'ArrowRight') {
        setFlipped(false);
        setCardIdx((i) => (i + 1) % filteredCards.length);
      } else if (e.key === 'ArrowLeft') {
        setFlipped(false);
        setCardIdx((i) => (i - 1 + filteredCards.length) % filteredCards.length);
      } else if (flipped && ['1', '2', '3', '4'].includes(e.key)) {
        const map: Record<string, SrsRating> = {
          '1': 'again',
          '2': 'hard',
          '3': 'good',
          '4': 'easy',
        };
        handleRate(map[e.key]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [subTab, currentCard, flipped, filteredCards.length]);

  const handlePrintCheatSheet = () => {
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

  const filteredTraps =
    trapFilter === 'all'
      ? EXAMINER_TRAPS
      : EXAMINER_TRAPS.filter((t) => t.moduleId === trapFilter);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 pb-3 border-b border-[var(--rule-strong)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--ink-primary)]">
            Reference Deck &amp; Examiner Playbook
          </h1>
          <p className="font-mono text-xs text-[var(--ink-muted)] mt-1">
            50 SM-2 Spaced-Repetition Flashcards · Q1–Q10 Rubric Blueprints · 20 Examiner Traps ·
            2-Page A4 Print Sheet
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSubTab('flashcards')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-[2px] border inline-flex items-center gap-1.5 ${
              subTab === 'flashcards'
                ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)]'
                : 'bg-[var(--bg-paper)] text-[var(--ink-primary)] border-[var(--rule-strong)]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> SM-2 Flashcards (50)
          </button>
          <button
            type="button"
            onClick={() => setSubTab('playbook')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-[2px] border inline-flex items-center gap-1.5 ${
              subTab === 'playbook'
                ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)]'
                : 'bg-[var(--bg-paper)] text-[var(--ink-primary)] border-[var(--rule-strong)]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" /> Examiner Playbook &amp; Traps
          </button>
          <button
            type="button"
            onClick={handlePrintCheatSheet}
            className="px-3 py-1.5 text-xs font-semibold rounded-[2px] border border-[var(--div-m4)] bg-[var(--bg-paper)] text-[var(--ink-primary)] hover:bg-[var(--bg-recessed)] inline-flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-[var(--div-m4)]" /> Print 2-Page A4 Sheet
          </button>
        </div>
      </div>

      {subTab === 'flashcards' ? (
        <div className="space-y-5">
          {/* Controls + 4-Bucket Forecast */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            <div className="lg:col-span-7 flex flex-wrap items-center gap-1.5">
              {(['all', 'm1', 'm2', 'm3', 'm4', 'm5'] as const).map((mf) => (
                <button
                  key={mf}
                  type="button"
                  onClick={() => {
                    setModuleFilter(mf);
                    setCardIdx(0);
                    setFlipped(false);
                  }}
                  className={`px-2.5 py-1 font-mono text-xs font-semibold rounded-[2px] border uppercase ${
                    moduleFilter === mf
                      ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)]'
                      : 'bg-[var(--bg-paper)] text-[var(--ink-secondary)] border-[var(--rule-hairline)]'
                  }`}
                >
                  {mf === 'all' ? 'All (50)' : mf}
                </button>
              ))}

              <div className="ml-auto inline-flex rounded-[2px] border border-[var(--rule-strong)] overflow-hidden">
                <button
                  type="button"
                  onClick={() => onChangeSrsProfile('fat48h')}
                  className={`px-2.5 py-1 font-mono text-xs font-semibold ${
                    srsProfile === 'fat48h'
                      ? 'bg-[var(--div-m2)] text-white'
                      : 'bg-[var(--bg-paper)] text-[var(--ink-secondary)]'
                  }`}
                >
                  48h FAT Sprint
                </button>
                <button
                  type="button"
                  onClick={() => onChangeSrsProfile('longterm')}
                  className={`px-2.5 py-1 font-mono text-xs font-semibold ${
                    srsProfile === 'longterm'
                      ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)]'
                      : 'bg-[var(--bg-paper)] text-[var(--ink-secondary)]'
                  }`}
                >
                  Long-Term SM-2
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 grid grid-cols-4 gap-2 font-mono text-xs tabular-nums text-center">
              <div className="p-2 bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px]">
                <div className="text-[var(--div-danger)] font-bold text-sm">{forecast.dueNow}</div>
                <div className="text-[10px] text-[var(--ink-muted)]">Due Now</div>
              </div>
              <div className="p-2 bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px]">
                <div className="text-[var(--div-m2)] font-bold text-sm">{forecast.within2h}</div>
                <div className="text-[10px] text-[var(--ink-muted)]">&lt; 2h</div>
              </div>
              <div className="p-2 bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px]">
                <div className="text-[var(--div-m4)] font-bold text-sm">{forecast.within12h}</div>
                <div className="text-[10px] text-[var(--ink-muted)]">&lt; 12h</div>
              </div>
              <div className="p-2 bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px]">
                <div className="text-[var(--div-m3)] font-bold text-sm">{forecast.later}</div>
                <div className="text-[10px] text-[var(--ink-muted)]">Later</div>
              </div>
            </div>
          </div>

          {/* Flashcard Plate */}
          {currentCard && (
            <div className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[2px] p-6 sm:p-8 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--rule-hairline)] font-mono text-xs text-[var(--ink-muted)] tabular-nums">
                <span>
                  {currentCard.moduleId.toUpperCase()} · {currentCard.tag} · Card {cardIdx + 1}/
                  {filteredCards.length}
                </span>
                <span>
                  EF {(srsStates[currentCard.id]?.easeFactor ?? 2.5).toFixed(2)} · Reps{' '}
                  {srsStates[currentCard.id]?.repetitions ?? 0}
                </span>
              </div>

              <div className="min-h-[170px] flex flex-col justify-center">
                <div className="font-mono text-[11px] font-bold text-[var(--ink-muted)] mb-2 uppercase">
                  {flipped ? 'Verified Answer / Rubric Point' : 'Prompt (Press Space to Reveal)'}
                </div>
                <div className="prose-manual text-base sm:text-lg">
                  <MarkdownBlock content={flipped ? currentCard.back : currentCard.front} />
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--rule-hairline)] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFlipped(false);
                      setCardIdx((i) => (i - 1 + filteredCards.length) % filteredCards.length);
                    }}
                    className="px-2.5 py-1.5 text-xs font-mono rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-sheet)] text-[var(--ink-primary)] inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => setFlipped((f) => !f)}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-[2px] border border-[var(--ink-primary)] bg-[var(--ink-primary)] text-[var(--bg-paper)] inline-flex items-center gap-1.5"
                  >
                    <RotateCw className="w-3.5 h-3.5" /> {flipped ? 'Show Prompt' : 'Reveal Answer (Space)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFlipped(false);
                      setCardIdx((i) => (i + 1) % filteredCards.length);
                    }}
                    className="px-2.5 py-1.5 text-xs font-mono rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-sheet)] text-[var(--ink-primary)] inline-flex items-center gap-1"
                  >
                    Next <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {flipped && (
                  <div className="flex flex-wrap items-center gap-2 font-mono text-xs tabular-nums">
                    {(
                      [
                        { key: '1', r: 'again' as SrsRating, label: 'Again', iv: nextIntervals.again, col: 'border-[var(--div-danger)] text-[var(--div-danger)]' },
                        { key: '2', r: 'hard' as SrsRating, label: 'Hard', iv: nextIntervals.hard, col: 'border-[var(--div-m2)] text-[var(--div-m2)]' },
                        { key: '3', r: 'good' as SrsRating, label: 'Good', iv: nextIntervals.good, col: 'border-[var(--div-m4)] text-[var(--div-m4)]' },
                        { key: '4', r: 'easy' as SrsRating, label: 'Easy', iv: nextIntervals.easy, col: 'border-[var(--div-m3)] text-[var(--div-m3)]' },
                      ]
                    ).map((btn) => (
                      <button
                        key={btn.r}
                        type="button"
                        onClick={() => handleRate(btn.r)}
                        className={`px-3 py-1.5 rounded-[2px] border font-semibold bg-[var(--bg-sheet)] hover:bg-[var(--bg-recessed)] ${btn.col}`}
                      >
                        [{btn.key}] {btn.label} ({btn.iv})
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* 3-Hour Exam Hall Pacing Plan */}
          <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-5 space-y-3">
            <h2 className="text-lg font-bold text-[var(--ink-primary)] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--div-m2)]" />
              3-Hour VIT Chennai FAT Pacing Strategy (180 Minutes · 100 Marks)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[var(--bg-recessed)] border-b border-[var(--rule-strong)] font-mono">
                    <th className="px-3 py-2">Window</th>
                    <th className="px-3 py-2">Phase</th>
                    <th className="px-3 py-2">Target</th>
                    <th className="px-3 py-2">Execution Tactic</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--rule-hairline)]">
                  {PACING_PLAN.map((seg) => (
                    <tr key={seg.window}>
                      <td className="px-3 py-2 font-mono font-bold tabular-nums whitespace-nowrap text-[var(--ink-primary)]">
                        {seg.window}
                      </td>
                      <td className="px-3 py-2 font-semibold text-[var(--ink-primary)]">
                        {seg.phase}
                      </td>
                      <td className="px-3 py-2 text-[var(--ink-secondary)]">{seg.target}</td>
                      <td className="px-3 py-2 text-[var(--ink-secondary)]">{seg.tactic}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Q1-Q10 Examiner Blueprints */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-[var(--ink-primary)]">
              Q1 – Q10 FAT Answer-Book Blueprints &amp; Marking Rubrics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {EXAMINER_BLUEPRINTS.map((bp) => (
                <div
                  key={bp.qNo}
                  className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-4 space-y-2"
                >
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="font-bold text-[var(--ink-primary)]">
                      {bp.qNo} · {bp.moduleId.toUpperCase()} · {bp.marks}
                    </span>
                    <span className="text-[var(--ink-muted)]">{bp.bloom}</span>
                  </div>
                  <h3 className="text-sm font-bold text-[var(--ink-primary)]">{bp.archetype}</h3>
                  <p className="text-xs text-[var(--ink-secondary)]">{bp.markingRubric}</p>
                  <ul className="text-xs text-[var(--ink-primary)] list-disc pl-4 space-y-0.5 pt-1">
                    {bp.mustInclude.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* 20 Examiner Traps */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-[var(--ink-primary)] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[var(--div-danger)]" />
                20 Frequent -2M Deduction Traps ({filteredTraps.length})
              </h2>
              <div className="flex flex-wrap items-center gap-1.5">
                {(['all', 'm1', 'm2', 'm3', 'm4', 'm5'] as const).map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => setTrapFilter(tf)}
                    className={`px-2 py-1 font-mono text-xs font-semibold rounded-[2px] border uppercase ${
                      trapFilter === tf
                        ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)]'
                        : 'bg-[var(--bg-paper)] text-[var(--ink-secondary)] border-[var(--rule-hairline)]'
                    }`}
                  >
                    {tf === 'all' ? 'All' : tf}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredTraps.map((trap) => (
                <div
                  key={trap.id}
                  className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-3.5 space-y-1.5"
                >
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="font-bold text-[var(--ink-primary)]">{trap.moduleCode}</span>
                    <span className="font-bold text-[var(--div-danger)]">{trap.penalty}</span>
                  </div>
                  <h3 className="text-sm font-bold text-[var(--ink-primary)]">{trap.title}</h3>
                  <p className="text-xs text-[var(--ink-secondary)]">
                    <strong>Trap:</strong> {trap.mistake}
                  </p>
                  <p className="text-xs text-[var(--div-m3)] font-medium">
                    <strong>Fix:</strong> {trap.fix}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Module Comparison Matrix Reference */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-[var(--ink-primary)]">
              Module Master Comparison Tables
            </h2>
            {MODULES.map((m) => (
              <div
                key={m.id}
                className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-4 space-y-2"
              >
                <h3 className="text-sm font-bold text-[var(--ink-primary)]">
                  {m.code} · {m.comparisonTable.title}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[var(--bg-recessed)] border-b border-[var(--rule-strong)] font-mono">
                        {m.comparisonTable.headers.map((h) => (
                          <th key={h} className="px-2.5 py-1.5">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--rule-hairline)]">
                      {m.comparisonTable.rows.map((row, ri) => (
                        <tr key={ri}>
                          {row.map((cell, ci) => (
                            <td
                              key={ci}
                              className={`px-2.5 py-1.5 text-[var(--ink-secondary)] ${
                                ci === 0 ? 'font-semibold text-[var(--ink-primary)]' : ''
                              }`}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
