import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Calculator,
  CheckCircle2,
  Clock,
  Layers,
  MemoryStick,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  Sliders,
  Sparkles,
} from 'lucide-react';
import {
  PAGE_REPLACEMENT_PRESETS,
  PLACEMENT_PRESET_C1_2_2_Q8,
  PageReplacementAlgo,
  PlacementAlgo,
  SEGMENTATION_PRESET_C1_1_2_Q5,
  computeDemandPagingEat,
  computePagingTlb,
  evaluateBeladyAnomaly,
  runContiguousPlacement,
  runPageReplacement,
  translateSegmentAddress,
} from '../../utils/memoryPagingEngine';

export type MemoryWorkbenchMode = 'replacement' | 'belady' | 'tlb' | 'placement' | 'segmentation';

const ALGO_DESCRIPTIONS: Record<
  'FIFO' | 'LRU' | 'OPT' | 'CLOCK',
  { name: string; tag: string; rule: string; complexity: string; beladySafe: boolean }
> = {
  FIFO: {
    name: 'First-In First-Out',
    tag: 'Arrival Queue',
    rule: 'Evicts the page that has been in memory the longest (earliest loadedAt timestamp).',
    complexity: 'O(1) queue / pointer',
    beladySafe: false,
  },
  LRU: {
    name: 'Least Recently Used',
    tag: 'Recency Stack',
    rule: 'Evicts the page that has not been referenced for the longest time (earliest lastUsedAt timestamp).',
    complexity: 'O(1) with doubly linked list + hash map, or hardware counter',
    beladySafe: true,
  },
  OPT: {
    name: "Optimal (Belady's Min)",
    tag: 'Future Knowledge Oracle',
    rule: 'Evicts the page that will not be used for the longest period of time in the future. Earliest loaded tie-break.',
    complexity: 'Theoretical benchmark (requires oracle / full future trace)',
    beladySafe: true,
  },
  CLOCK: {
    name: 'Second-Chance (Clock)',
    tag: 'Circular FIFO + Ref Bit',
    rule: 'Circular scan of frames inspecting reference bit R. If R=1, clear to 0 and advance hand; evict first frame with R=0.',
    complexity: 'O(1) circular buffer, practical hardware LRU approximation',
    beladySafe: false,
  },
};

export const MemoryPagingLab: React.FC = () => {
  const [mode, setMode] = useState<MemoryWorkbenchMode>('replacement');

  // Page Replacement & Matrix State
  const [presetIdx, setPresetIdx] = useState(0);
  const [pageAlgo, setPageAlgo] = useState<'FIFO' | 'LRU' | 'OPT' | 'CLOCK'>('LRU');
  const [frameCount, setFrameCount] = useState<number>(PAGE_REPLACEMENT_PRESETS[0].frameCount);
  const [refInput, setRefInput] = useState<string>(
    PAGE_REPLACEMENT_PRESETS[0].referenceString.join(', ')
  );
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [beladyCompareOpen, setBeladyCompareOpen] = useState<boolean>(false);

  // TLB & Demand Paging EAT State
  const [tlbNs, setTlbNs] = useState<number>(10);
  const [ramNs, setRamNs] = useState<number>(100);
  const [hitRatio, setHitRatio] = useState<number>(80);
  const [vasKB, setVasKB] = useState<number>(64);
  const [ramKB, setRamKB] = useState<number>(16);
  const [pageSizeKB, setPageSizeKB] = useState<number>(1);
  const [dpPfMs, setDpPfMs] = useState<number>(8);
  const [dpPfDenom, setDpPfDenom] = useState<number>(10000);

  // Placement State
  const [placeAlgo, setPlaceAlgo] = useState<PlacementAlgo>('BEST_FIT');

  // Segmentation State
  const [segName, setSegName] = useState<string>('Data');
  const [segOffset, setSegOffset] = useState<number>(350);

  // Parse reference string
  const parsedRefs = useMemo(
    () =>
      refInput
        .split(/[\s,]+/)
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isFinite(n) && n >= 0),
    [refInput]
  );

  // Active step bounds check
  useEffect(() => {
    if (activeStep > parsedRefs.length) {
      setActiveStep(Math.max(1, parsedRefs.length));
    }
  }, [parsedRefs.length, activeStep]);

  // Auto-play scrubber
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setActiveStep((curr) => {
        if (curr >= parsedRefs.length) {
          setIsPlaying(false);
          return curr;
        }
        return curr + 1;
      });
    }, 700);
    return () => clearInterval(timer);
  }, [isPlaying, parsedRefs.length]);

  // Run all 4 algorithms for comparative telemetry
  const fifoRes = useMemo(
    () => runPageReplacement(parsedRefs, frameCount, 'FIFO'),
    [parsedRefs, frameCount]
  );
  const lruRes = useMemo(
    () => runPageReplacement(parsedRefs, frameCount, 'LRU'),
    [parsedRefs, frameCount]
  );
  const optRes = useMemo(
    () => runPageReplacement(parsedRefs, frameCount, 'OPT'),
    [parsedRefs, frameCount]
  );
  const clockRes = useMemo(
    () => runPageReplacement(parsedRefs, frameCount, 'CLOCK'),
    [parsedRefs, frameCount]
  );

  const activeResult =
    pageAlgo === 'FIFO'
      ? fifoRes
      : pageAlgo === 'LRU'
        ? lruRes
        : pageAlgo === 'OPT'
          ? optRes
          : clockRes;

  // Belady comparison data
  const beladySilberschatz = useMemo(() => evaluateBeladyAnomaly(), []);
  const beladyActiveCustom = useMemo(
    () => evaluateBeladyAnomaly(parsedRefs),
    [parsedRefs]
  );

  // Contiguous placement evaluation
  const placementRes = useMemo(
    () =>
      runContiguousPlacement(
        PLACEMENT_PRESET_C1_2_2_Q8.blocks,
        PLACEMENT_PRESET_C1_2_2_Q8.processes,
        placeAlgo
      ),
    [placeAlgo]
  );

  // TLB & EAT calculations
  const tlbRes = useMemo(
    () =>
      computePagingTlb({
        vasKB,
        ramKB,
        pageSizeKB,
        tlbNs,
        ramNs,
        hitRatioPercent: hitRatio,
      }),
    [vasKB, ramKB, pageSizeKB, tlbNs, ramNs, hitRatio]
  );

  const dpEatRes = useMemo(
    () =>
      computeDemandPagingEat({
        memoryAccessNs: ramNs,
        pageFaultServiceMs: dpPfMs,
        pageFaultRate: 1 / Math.max(1, dpPfDenom),
      }),
    [ramNs, dpPfMs, dpPfDenom]
  );

  // Segmentation evaluation
  const segRes = useMemo(
    () => translateSegmentAddress(SEGMENTATION_PRESET_C1_1_2_Q5, segName, segOffset),
    [segName, segOffset]
  );

  // Current scrubbed step details
  const currentStepData = activeResult.steps[activeStep - 1];

  const loadPreset = (idx: number) => {
    setPresetIdx(idx);
    const p = PAGE_REPLACEMENT_PRESETS[idx];
    setFrameCount(p.frameCount);
    setRefInput(p.referenceString.join(', '));
    setActiveStep(1);
    setIsPlaying(false);
  };

  const handleRandomizeRefs = () => {
    const randomSeq = Array.from({ length: 25 }, () => Math.floor(Math.random() * 7) + 1);
    setRefInput(randomSeq.join(', '));
    setActiveStep(1);
    setIsPlaying(false);
  };

  return (
    <div className="space-y-4">
      {/* 5-Mode Sub-Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-[var(--rule-hairline)]">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'replacement' as const, label: '25-Ref Matrix & Paging', icon: MemoryStick },
              { id: 'belady' as const, label: "Belady's Anomaly (3 vs 4)", icon: AlertTriangle },
              { id: 'tlb' as const, label: 'TLB & Demand Paging EAT', icon: Calculator },
              { id: 'placement' as const, label: 'Contiguous Placement', icon: Layers },
              { id: 'segmentation' as const, label: 'Segmentation Table', icon: BookOpen },
            ] as const
          ).map((t) => {
            const Icon = t.icon;
            const active = mode === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setMode(t.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold rounded-[2px] border transition-colors ${
                  active
                    ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)] shadow-xs'
                    : 'bg-[var(--bg-paper)] text-[var(--ink-secondary)] border-[var(--rule-hairline)] hover:bg-[var(--bg-recessed)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-[var(--ink-muted)]">
          <span className="w-2 h-2 rounded-full bg-[var(--div-m4)] inline-block" />
          <span>7:5 Asymmetric Workbench · Module 4 OS Lab</span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODE 1: 25-Reference Frame Allocation Matrix (Hero Mode)       */}
      {/* ============================================================== */}
      {mode === 'replacement' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left 7 Columns: Interactive Allocation Matrix & Visual Stage */}
          <div className="lg:col-span-7 space-y-4 min-w-0 lab-stage-canvas">
            {/* 4-Algorithm Comparative Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs tabular-nums">
              {(
                [
                  { id: 'FIFO' as const, res: fifoRes, label: 'FIFO' },
                  { id: 'LRU' as const, res: lruRes, label: 'LRU' },
                  { id: 'OPT' as const, res: optRes, label: 'OPT' },
                  { id: 'CLOCK' as const, res: clockRes, label: 'Clock' },
                ] as const
              ).map((item) => {
                const isSelected = pageAlgo === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPageAlgo(item.id)}
                    className={`p-2.5 text-left rounded-[2px] border transition-all ${
                      isSelected
                        ? 'bg-[var(--bg-recessed)] border-[var(--ink-primary)] ring-1 ring-[var(--ink-primary)]'
                        : 'bg-[var(--bg-paper)] border-[var(--rule-hairline)] hover:bg-[var(--bg-sheet)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[var(--ink-primary)]">{item.label}</span>
                      {isSelected && (
                        <span className="text-[10px] uppercase font-bold text-[var(--div-m4)]">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-base font-bold text-[var(--div-m4)] mt-0.5">
                      {item.res.faults} <span className="text-[11px] font-normal text-[var(--ink-muted)]">PF</span> · {item.res.hits} <span className="text-[11px] font-normal text-[var(--ink-muted)]">Hits</span>
                    </div>
                    <div className="text-[11px] text-[var(--ink-secondary)]">
                      Hit: {(item.res.hitRatio).toFixed(1)}%
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Interactive 25-Reference String Matrix Canvas */}
            <div className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[2px] p-3.5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--rule-hairline)]">
                <div>
                  <h3 className="font-mono text-xs font-bold text-[var(--ink-primary)] flex items-center gap-1.5">
                    <MemoryStick className="w-4 h-4 text-[var(--div-m4)]" />
                    <span>
                      25-Reference String Frame Matrix ({pageAlgo} · {frameCount} Frames · {parsedRefs.length} References)
                    </span>
                  </h3>
                  <p className="text-[11px] text-[var(--ink-muted)] font-mono mt-0.5">
                    Click any column to scrub to step. Active step: <strong>#{activeStep}</strong> (Page {parsedRefs[activeStep - 1] ?? '–'})
                  </p>
                </div>

                {/* Scrubber Controls */}
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveStep(1)}
                    disabled={activeStep <= 1}
                    className="p-1.5 rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-sheet)] disabled:opacity-40"
                    title="Jump to Start"
                  >
                    <SkipBack className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStep((c) => Math.max(1, c - 1))}
                    disabled={activeStep <= 1}
                    className="p-1.5 rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-sheet)] disabled:opacity-40"
                    title="Previous Step"
                  >
                    <SkipBack className="w-3.5 h-3.5 rotate-180 scale-x-[-1]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="px-2.5 py-1 rounded-[2px] bg-[var(--div-m4)] text-white font-bold flex items-center gap-1"
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isPlaying ? 'Pause' : 'Play'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStep((c) => Math.min(parsedRefs.length, c + 1))}
                    disabled={activeStep >= parsedRefs.length}
                    className="p-1.5 rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-sheet)] disabled:opacity-40"
                    title="Next Step"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveStep(1);
                      setIsPlaying(false);
                    }}
                    className="p-1.5 rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-sheet)]"
                    title="Reset Scrubber"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Horizontal Scrollable Table Matrix (Responsive on 16:10 / 2560x1600) */}
              <div className="overflow-x-auto wqxga-frame-matrix-scroll border border-[var(--rule-hairline)] rounded-[2px] max-w-full">
                <table className="w-full text-center border-collapse font-mono text-xs tabular-nums select-none">
                  <thead>
                    <tr className="bg-[var(--bg-recessed)] border-b border-[var(--rule-strong)]">
                      <th className="sticky left-0 z-10 bg-[var(--bg-recessed)] px-2.5 py-2 text-left font-bold border-r border-[var(--rule-hairline)] min-w-[70px]">
                        Step / Ref
                      </th>
                      {activeResult.steps.map((st) => {
                        const isCurrent = st.step === activeStep;
                        return (
                          <th
                            key={st.step}
                            onClick={() => {
                              setActiveStep(st.step);
                              setIsPlaying(false);
                            }}
                            className={`px-2 py-1.5 cursor-pointer transition-colors border-r border-[var(--rule-hairline)] min-w-[34px] ${
                              isCurrent
                                ? 'bg-[var(--div-m4)] text-white font-bold'
                                : 'hover:bg-[var(--bg-sheet)]'
                            }`}
                          >
                            <div className="text-[10px] opacity-75">{st.step}</div>
                            <div className="text-sm font-bold">{st.page}</div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--rule-hairline)]">
                    {/* Frame Rows F0..F(k-1) */}
                    {Array.from({ length: frameCount }).map((_, fIdx) => (
                      <tr key={fIdx}>
                        <td className="sticky left-0 z-10 bg-[var(--bg-paper)] px-2.5 py-1.5 text-left font-bold text-[var(--ink-secondary)] border-r border-[var(--rule-hairline)]">
                          Frame {fIdx}
                        </td>
                        {activeResult.steps.map((st) => {
                          const val = st.frames[fIdx];
                          const isCurrent = st.step === activeStep;
                          const wasJustLoaded =
                            !st.hit &&
                            val !== null &&
                            (st.step === 1 || activeResult.steps[st.step - 2]?.frames[fIdx] !== val);

                          return (
                            <td
                              key={st.step}
                              onClick={() => {
                                setActiveStep(st.step);
                                setIsPlaying(false);
                              }}
                              className={`px-2 py-1.5 cursor-pointer border-r border-[var(--rule-hairline)] ${
                                isCurrent
                                  ? 'bg-[var(--div-m4)]/10 font-bold'
                                  : wasJustLoaded
                                    ? 'bg-[var(--bg-recessed)]'
                                    : ''
                              }`}
                            >
                              {val !== null ? (
                                <span
                                  className={`inline-block px-1 rounded-[2px] ${
                                    wasJustLoaded
                                      ? 'text-[var(--div-m4)] font-bold underline decoration-dotted'
                                      : 'text-[var(--ink-primary)]'
                                  }`}
                                >
                                  {val}
                                </span>
                              ) : (
                                <span className="text-[var(--ink-muted)] opacity-40">·</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}

                    {/* Status Row (Hit / Fault) */}
                    <tr className="bg-[var(--bg-sheet)] font-bold border-t border-[var(--rule-strong)]">
                      <td className="sticky left-0 z-10 bg-[var(--bg-sheet)] px-2.5 py-2 text-left font-bold text-[var(--ink-primary)] border-r border-[var(--rule-hairline)]">
                        Status
                      </td>
                      {activeResult.steps.map((st) => {
                        const isCurrent = st.step === activeStep;
                        return (
                          <td
                            key={st.step}
                            onClick={() => {
                              setActiveStep(st.step);
                              setIsPlaying(false);
                            }}
                            className={`px-2 py-1.5 cursor-pointer border-r border-[var(--rule-hairline)] ${
                              isCurrent ? 'bg-[var(--div-m4)]/15' : ''
                            }`}
                          >
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold ${
                                st.hit
                                  ? 'bg-[var(--div-m3)]/20 text-[var(--div-m3)] border border-[var(--div-m3)]/40'
                                  : 'bg-[var(--div-danger)]/15 text-[var(--div-danger)] border border-[var(--div-danger)]/30'
                              }`}
                            >
                              {st.hit ? 'H' : 'F'}
                            </span>
                          </td>
                        );
                      })}
                    </tr>

                    {/* Eviction Row */}
                    <tr className="text-[10px] text-[var(--ink-muted)] bg-[var(--bg-paper)]">
                      <td className="sticky left-0 z-10 bg-[var(--bg-paper)] px-2.5 py-1.5 text-left font-semibold border-r border-[var(--rule-hairline)]">
                        Evicted
                      </td>
                      {activeResult.steps.map((st) => (
                        <td
                          key={st.step}
                          className="px-2 py-1 border-r border-[var(--rule-hairline)]"
                        >
                          {st.evicted !== null ? (
                            <span className="text-[var(--div-danger)] font-bold">
                              P{st.evicted}
                            </span>
                          ) : (
                            <span>–</span>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Clock Specific Row: Reference Bits & Hand */}
                    {pageAlgo === 'CLOCK' && (
                      <tr className="text-[10px] text-[var(--ink-secondary)] bg-[var(--bg-recessed)]">
                        <td className="sticky left-0 z-10 bg-[var(--bg-recessed)] px-2.5 py-1.5 text-left font-semibold border-r border-[var(--rule-hairline)]">
                          Clock Hand
                        </td>
                        {activeResult.steps.map((st) => (
                          <td
                            key={st.step}
                            className="px-2 py-1 border-r border-[var(--rule-hairline)] font-mono"
                          >
                            <span>F{st.clockHand}</span>
                          </td>
                        ))}
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Active Step Forensic Callout */}
              {currentStepData && (
                <div className="p-3 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px] font-mono text-xs flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-[var(--ink-primary)]">
                      Step #{currentStepData.step}:
                    </span>{' '}
                    Page Request <strong className="text-[var(--div-m4)]">{currentStepData.page}</strong> →{' '}
                    <span
                      className={`font-bold ${
                        currentStepData.hit
                          ? 'text-[var(--div-m3)]'
                          : 'text-[var(--div-danger)]'
                      }`}
                    >
                      {currentStepData.hit ? 'PAGE HIT' : 'PAGE FAULT'}
                    </span>
                    {currentStepData.evicted !== null
                      ? ` (Evicted Page ${currentStepData.evicted})`
                      : currentStepData.hit
                        ? ' (Page already in frame)'
                        : ' (Loaded into free frame)'}
                  </div>
                  {pageAlgo === 'CLOCK' && currentStepData.refBits && (
                    <div className="text-[11px] text-[var(--ink-muted)]">
                      Clock Hand at F{currentStepData.clockHand} · Ref Bits: [
                      {currentStepData.refBits.join(', ')}]
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Belady's Anomaly Toggle Comparison Strip */}
            <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-3.5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[var(--div-m2)]" />
                  <span className="font-mono text-xs font-bold text-[var(--ink-primary)]">
                    Belady's Anomaly Comparison (3 Frames vs 4 Frames on FIFO)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setBeladyCompareOpen(!beladyCompareOpen)}
                  className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-[2px] border transition-colors ${
                    beladyCompareOpen
                      ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)]'
                      : 'bg-[var(--bg-sheet)] text-[var(--ink-secondary)] border-[var(--rule-hairline)]'
                  }`}
                >
                  {beladyCompareOpen ? 'Hide Comparison' : 'Compare 3 vs 4 Frames'}
                </button>
              </div>

              {beladyCompareOpen && (
                <div className="p-3 bg-[var(--bg-recessed)] border border-[var(--rule-hairline)] rounded-[2px] space-y-3 font-mono text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-2.5 bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px]">
                      <div className="text-[var(--ink-muted)] font-bold">3 Frames (FIFO)</div>
                      <div className="text-lg font-bold text-[var(--ink-primary)] mt-0.5">
                        {beladySilberschatz.f3.faults} Faults
                      </div>
                      <div className="text-[11px] text-[var(--ink-secondary)]">
                        Hit Ratio: {(beladySilberschatz.f3.hitRatio).toFixed(1)}% ({beladySilberschatz.f3.hits} hits)
                      </div>
                    </div>
                    <div className="p-2.5 bg-[var(--bg-paper)] border border-[var(--div-danger)] rounded-[2px]">
                      <div className="text-[var(--div-danger)] font-bold flex items-center justify-between">
                        <span>4 Frames (FIFO)</span>
                        <span className="text-[10px] uppercase bg-[var(--div-danger)]/15 px-1 py-0.5 rounded-[2px]">
                          +1 Fault Anomaly!
                        </span>
                      </div>
                      <div className="text-lg font-bold text-[var(--div-danger)] mt-0.5">
                        {beladySilberschatz.f4.faults} Faults
                      </div>
                      <div className="text-[11px] text-[var(--ink-secondary)]">
                        Hit Ratio: {(beladySilberschatz.f4.hitRatio).toFixed(1)}% ({beladySilberschatz.f4.hits} hits)
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-[var(--ink-secondary)] leading-relaxed">
                    <strong>Theoretical Basis:</strong> FIFO is <em>not</em> a stack algorithm.
                    Adding frame capacity does not preserve subset inclusion ($S(t, n) \not\subseteq S(t, n+1)$).
                    Conversely, <strong>LRU</strong> and <strong>OPT</strong> satisfy the inclusion property and are mathematically immune to Belady&apos;s Anomaly.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right 5 Columns: Control Workbench & Parameters */}
          <div className="lg:col-span-5 space-y-4">
            {/* Algorithm Selector */}
            <div className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[2px] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-mono text-xs font-bold text-[var(--ink-primary)] flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[var(--div-m4)]" />
                  <span>Algorithm Selector</span>
                </h4>
                <span className="font-mono text-[10px] text-[var(--ink-muted)]">
                  {ALGO_DESCRIPTIONS[pageAlgo].complexity}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {(['FIFO', 'LRU', 'OPT', 'CLOCK'] as const).map((algoKey) => {
                  const info = ALGO_DESCRIPTIONS[algoKey];
                  const isSelected = pageAlgo === algoKey;
                  return (
                    <button
                      key={algoKey}
                      type="button"
                      onClick={() => setPageAlgo(algoKey)}
                      className={`p-2.5 text-left rounded-[2px] border transition-colors ${
                        isSelected
                          ? 'bg-[var(--div-m4)] text-white border-[var(--div-m4)] shadow-xs'
                          : 'bg-[var(--bg-sheet)] text-[var(--ink-primary)] border-[var(--rule-hairline)] hover:bg-[var(--bg-recessed)]'
                      }`}
                    >
                      <div className="font-mono text-xs font-bold">{algoKey}</div>
                      <div className="text-[10px] opacity-90 truncate">{info.tag}</div>
                    </button>
                  );
                })}
              </div>

              <div className="p-2.5 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px] font-mono text-[11px] space-y-1">
                <div className="font-bold text-[var(--ink-primary)]">
                  {ALGO_DESCRIPTIONS[pageAlgo].name}
                </div>
                <div className="text-[var(--ink-secondary)]">
                  {ALGO_DESCRIPTIONS[pageAlgo].rule}
                </div>
                <div className="flex items-center gap-2 pt-1 text-[10px]">
                  <span
                    className={`px-1 py-0.5 rounded-[2px] font-semibold ${
                      ALGO_DESCRIPTIONS[pageAlgo].beladySafe
                        ? 'bg-[var(--div-m3)]/15 text-[var(--div-m3)]'
                        : 'bg-[var(--div-m2)]/15 text-[var(--div-m2)]'
                    }`}
                  >
                    {ALGO_DESCRIPTIONS[pageAlgo].beladySafe
                      ? 'Stack Algorithm (Belady Immune)'
                      : "Subject to Belady's Anomaly"}
                  </span>
                </div>
              </div>
            </div>

            {/* Frame Count Slider (2 to 8) */}
            <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-4 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <label htmlFor="frame-slider" className="font-bold text-[var(--ink-primary)]">
                  Physical Frame Count (Allocated RAM)
                </label>
                <span className="px-2 py-0.5 bg-[var(--bg-recessed)] border border-[var(--rule-hairline)] rounded-[2px] font-bold text-sm text-[var(--div-m4)] tabular-nums">
                  {frameCount} Frames
                </span>
              </div>
              <input
                id="frame-slider"
                type="range"
                min={2}
                max={8}
                step={1}
                value={frameCount}
                onChange={(e) => {
                  setFrameCount(Number(e.target.value));
                  setActiveStep(1);
                  setIsPlaying(false);
                }}
                className="w-full accent-[var(--div-m4)] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[var(--ink-muted)]">
                <span>2 Frames</span>
                <span>3 Frames (Belady)</span>
                <span>4 Frames (VIT FAT)</span>
                <span>8 Frames</span>
              </div>
            </div>

            {/* Real Exam Reference String Presets */}
            <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-4 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[var(--ink-primary)]">Reference String Presets</span>
                <span className="text-[10px] text-[var(--ink-muted)]">VIT FAT Papers</span>
              </div>

              <div className="space-y-1.5">
                {PAGE_REPLACEMENT_PRESETS.map((p, idx) => {
                  const isCurrent = presetIdx === idx;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => loadPreset(idx)}
                      className={`w-full p-2 text-left rounded-[2px] border transition-colors ${
                        isCurrent
                          ? 'bg-[var(--bg-recessed)] border-[var(--ink-primary)]'
                          : 'bg-[var(--bg-sheet)] border-[var(--rule-hairline)] hover:bg-[var(--bg-recessed)]'
                      }`}
                    >
                      <div className="font-bold text-[var(--ink-primary)]">{p.label}</div>
                      <div className="text-[10px] text-[var(--ink-muted)] truncate">{p.source}</div>
                    </button>
                  );
                })}
              </div>

              {/* Custom Input */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[var(--ink-muted)]">Custom String ({parsedRefs.length} refs):</span>
                  <button
                    type="button"
                    onClick={handleRandomizeRefs}
                    className="text-[10px] text-[var(--div-m4)] underline"
                  >
                    Generate Random 25
                  </button>
                </div>
                <input
                  type="text"
                  value={refInput}
                  onChange={(e) => {
                    setRefInput(e.target.value);
                    setActiveStep(1);
                    setIsPlaying(false);
                  }}
                  placeholder="e.g. 1, 2, 3, 4, 1, 2, 5"
                  className="w-full px-2.5 py-1.5 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)] text-xs tabular-nums"
                />
              </div>
            </div>

            {/* Execution Telemetry Summary Card */}
            <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-4 font-mono text-xs space-y-2 tabular-nums">
              <div className="font-bold text-[var(--ink-primary)] border-b border-[var(--rule-hairline)] pb-1 flex justify-between">
                <span>Telemetry Summary</span>
                <span>{pageAlgo} ({frameCount}F)</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>Total References: <strong>{parsedRefs.length}</strong></div>
                <div>Page Faults: <strong className="text-[var(--div-danger)]">{activeResult.faults}</strong></div>
                <div>Page Hits: <strong className="text-[var(--div-m3)]">{activeResult.hits}</strong></div>
                <div>Hit Ratio: <strong>{(activeResult.hitRatio).toFixed(1)}%</strong></div>
                <div>Fault Rate: <strong>{(activeResult.faultRate).toFixed(1)}%</strong></div>
                <div>Evictions: <strong>{Math.max(0, activeResult.faults - frameCount)}</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODE 2: Belady's Anomaly Forensic Mode (3 vs 4 Frames)        */}
      {/* ============================================================== */}
      {mode === 'belady' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left 7 Columns: Side-by-side matrices */}
          <div className="lg:col-span-7 space-y-4 min-w-0">
            <div className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[2px] p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--rule-hairline)]">
                <div>
                  <h3 className="font-mono text-xs font-bold text-[var(--ink-primary)] flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-[var(--div-m2)]" />
                    <span>Silberschatz Belady Anomaly Proof (FIFO)</span>
                  </h3>
                  <p className="font-mono text-[11px] text-[var(--ink-muted)]">
                    String: [{beladySilberschatz.referenceString.join(', ')}]
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-[2px] font-mono text-[11px] font-bold bg-[var(--div-danger)]/15 text-[var(--div-danger)] border border-[var(--div-danger)]/30">
                  Anomaly Confirmed
                </span>
              </div>

              {/* 3-Frame Matrix */}
              <div className="space-y-1">
                <div className="font-mono text-[11px] font-bold text-[var(--ink-secondary)]">
                  3 Frames FIFO → {beladySilberschatz.f3.faults} Faults, {beladySilberschatz.f3.hits} Hits (Hit Ratio {(beladySilberschatz.f3.hitRatio).toFixed(1)}%)
                </div>
                <div className="overflow-x-auto border border-[var(--rule-hairline)] rounded-[2px]">
                  <table className="w-full text-center border-collapse font-mono text-xs tabular-nums">
                    <thead>
                      <tr className="bg-[var(--bg-recessed)]">
                        <th className="px-2 py-1 text-left">Ref</th>
                        {beladySilberschatz.f3.steps.map((s) => (
                          <th key={s.step} className="px-2 py-1">{s.page}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--rule-hairline)]">
                      {[0, 1, 2].map((fi) => (
                        <tr key={fi}>
                          <td className="px-2 py-1 text-left text-[var(--ink-muted)]">F{fi}</td>
                          {beladySilberschatz.f3.steps.map((s) => (
                            <td key={s.step} className="px-2 py-1">{s.frames[fi] ?? '·'}</td>
                          ))}
                        </tr>
                      ))}
                      <tr className="bg-[var(--bg-sheet)] font-bold">
                        <td className="px-2 py-1 text-left">Hit/Fault</td>
                        {beladySilberschatz.f3.steps.map((s) => (
                          <td key={s.step} className={s.hit ? 'text-[var(--div-m3)]' : 'text-[var(--div-danger)]'}>
                            {s.hit ? 'H' : 'F'}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4-Frame Matrix */}
              <div className="space-y-1 pt-2">
                <div className="font-mono text-[11px] font-bold text-[var(--div-danger)]">
                  4 Frames FIFO → {beladySilberschatz.f4.faults} Faults (+1 Fault anomaly!), {beladySilberschatz.f4.hits} Hits
                </div>
                <div className="overflow-x-auto border border-[var(--rule-hairline)] rounded-[2px]">
                  <table className="w-full text-center border-collapse font-mono text-xs tabular-nums">
                    <thead>
                      <tr className="bg-[var(--bg-recessed)]">
                        <th className="px-2 py-1 text-left">Ref</th>
                        {beladySilberschatz.f4.steps.map((s) => (
                          <th key={s.step} className="px-2 py-1">{s.page}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--rule-hairline)]">
                      {[0, 1, 2, 3].map((fi) => (
                        <tr key={fi}>
                          <td className="px-2 py-1 text-left text-[var(--ink-muted)]">F{fi}</td>
                          {beladySilberschatz.f4.steps.map((s) => (
                            <td key={s.step} className="px-2 py-1">{s.frames[fi] ?? '·'}</td>
                          ))}
                        </tr>
                      ))}
                      <tr className="bg-[var(--bg-sheet)] font-bold">
                        <td className="px-2 py-1 text-left">Hit/Fault</td>
                        {beladySilberschatz.f4.steps.map((s) => (
                          <td key={s.step} className={s.hit ? 'text-[var(--div-m3)]' : 'text-[var(--div-danger)]'}>
                            {s.hit ? 'H' : 'F'}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Right 5 Columns: Theory & Stack Algorithm Immunity */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[2px] p-4 space-y-3 font-mono text-xs">
              <h4 className="font-bold text-[var(--ink-primary)]">Why Belady's Anomaly Occurs</h4>
              <p className="text-[var(--ink-secondary)] leading-relaxed text-[11px]">
                Under FIFO, adding frame capacity does not preserve memory inclusion. At reference 5,
                the 4-frame system evicts page 1 (which is immediately needed next!), whereas the 3-frame
                system had already rotated past it.
              </p>
              <div className="p-3 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px] space-y-2">
                <div className="font-bold text-[var(--ink-primary)]">Inclusion Property Formula:</div>
                <div className="text-[var(--div-m4)] font-bold">
                  S(t, n) ⊆ S(t, n+1)
                </div>
                <div className="text-[10px] text-[var(--ink-muted)]">
                  Where S(t, n) is the set of pages in an n-frame memory at time t. Stack algorithms
                  guarantee this subset condition holds at all times.
                </div>
              </div>
            </div>

            <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-4 space-y-2 font-mono text-xs">
              <div className="font-bold text-[var(--ink-primary)]">Algorithm Immunity Matrix</div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between items-center p-2 bg-[var(--bg-sheet)] rounded-[2px]">
                  <span>LRU (Stack Algorithm)</span>
                  <span className="text-[var(--div-m3)] font-bold">Immune</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-[var(--bg-sheet)] rounded-[2px]">
                  <span>OPT / MIN (Stack Algorithm)</span>
                  <span className="text-[var(--div-m3)] font-bold">Immune</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-[var(--bg-sheet)] rounded-[2px]">
                  <span>FIFO</span>
                  <span className="text-[var(--div-danger)] font-bold">Vulnerable</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-[var(--bg-sheet)] rounded-[2px]">
                  <span>Second-Chance (Clock)</span>
                  <span className="text-[var(--div-danger)] font-bold">Vulnerable</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODE 3: TLB & Demand Paging EAT Calculator (C2 Q8)             */}
      {/* ============================================================== */}
      {mode === 'tlb' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left 7 Columns: Architectural Blueprint & Math Resolution */}
          <div className="lg:col-span-7 space-y-4 min-w-0">
            {/* Address Bit-Split Card */}
            <div className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[2px] p-4 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--rule-hairline)]">
                <span className="font-bold text-[var(--ink-primary)]">
                  Paging Address Blueprint (VAS {vasKB} KB · RAM {ramKB} KB · Page {pageSizeKB} KB)
                </span>
                <span className="text-[10px] text-[var(--ink-muted)]">VIT C2 Q8 FAT Pattern</span>
              </div>

              {/* Bit Breakdown Visualization */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 tabular-nums">
                <div className="p-3 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px] space-y-1">
                  <div className="text-[var(--ink-muted)] font-bold text-[11px]">
                    Logical Address ({tlbRes.logicalAddressBits} bits)
                  </div>
                  <div className="flex gap-1 pt-1">
                    <div className="flex-1 p-2 bg-[var(--div-m4)] text-white text-center rounded-[2px]">
                      <div className="text-xs font-bold">p = {tlbRes.pageNumberBits} bits</div>
                      <div className="text-[10px] opacity-80">Page # ({tlbRes.numPages} pages)</div>
                    </div>
                    <div className="flex-1 p-2 bg-[var(--bg-recessed)] text-[var(--ink-primary)] text-center rounded-[2px] border border-[var(--rule-hairline)]">
                      <div className="text-xs font-bold">d = {tlbRes.offsetBits} bits</div>
                      <div className="text-[10px] opacity-75">Offset ({pageSizeKB * 1024} B)</div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px] space-y-1">
                  <div className="text-[var(--ink-muted)] font-bold text-[11px]">
                    Physical Address ({tlbRes.physicalAddressBits} bits)
                  </div>
                  <div className="flex gap-1 pt-1">
                    <div className="flex-1 p-2 bg-[var(--div-m5)] text-white text-center rounded-[2px]">
                      <div className="text-xs font-bold">f = {tlbRes.frameNumberBits} bits</div>
                      <div className="text-[10px] opacity-80">Frame # ({tlbRes.numFrames} frames)</div>
                    </div>
                    <div className="flex-1 p-2 bg-[var(--bg-recessed)] text-[var(--ink-primary)] text-center rounded-[2px] border border-[var(--rule-hairline)]">
                      <div className="text-xs font-bold">d = {tlbRes.offsetBits} bits</div>
                      <div className="text-[10px] opacity-75">Offset ({pageSizeKB * 1024} B)</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Translation Flow Timings */}
              <div className="p-3 bg-[var(--bg-recessed)] border border-[var(--rule-hairline)] rounded-[2px] space-y-2 text-[11px]">
                <div className="font-bold text-[var(--ink-primary)]">Access Time Breakdown:</div>
                <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-[var(--bg-paper)] rounded-[2px] border border-[var(--rule-hairline)]">
                  <div>
                    <strong className="text-[var(--div-m3)]">TLB Hit Path (α):</strong> T_tlb + T_ram = {tlbNs} + {ramNs}
                  </div>
                  <div className="font-bold text-sm text-[var(--div-m3)]">{tlbRes.hitAccessNs} ns</div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-[var(--bg-paper)] rounded-[2px] border border-[var(--rule-hairline)]">
                  <div>
                    <strong className="text-[var(--div-danger)]">TLB Miss Path (1 - α):</strong> T_tlb + 2 × T_ram = {tlbNs} + 2({ramNs})
                  </div>
                  <div className="font-bold text-sm text-[var(--div-danger)]">{tlbRes.missAccessNs} ns</div>
                </div>
              </div>

              {/* Step-by-Step EAT Formula Card */}
              <div className="p-3 bg-[var(--bg-sheet)] border border-[var(--rule-strong)] rounded-[2px] space-y-1.5">
                <div className="text-xs font-bold text-[var(--ink-primary)]">
                  Mathematical Resolution:
                </div>
                <div className="text-sm font-bold text-[var(--div-m4)]">
                  EAT = α(T_tlb + T_ram) + (1 - α)(T_tlb + 2 × T_ram)
                </div>
                <div className="text-[11px] text-[var(--ink-secondary)]">
                  = ({hitRatio / 100})({tlbRes.hitAccessNs} ns) + ({(100 - hitRatio) / 100})({tlbRes.missAccessNs} ns)
                </div>
                <div className="text-base font-bold text-[var(--ink-primary)] pt-1 border-t border-[var(--rule-hairline)] flex justify-between items-center">
                  <span>Effective Access Time (EAT):</span>
                  <span className="text-[var(--div-m4)] text-lg">{tlbRes.eatNs} ns</span>
                </div>
              </div>
            </div>

            {/* Demand Paging EAT Formula (with Page Fault Penalty) */}
            <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-4 space-y-2 font-mono text-xs">
              <div className="font-bold text-[var(--ink-primary)]">
                Demand Paging Effective Access Time (Page Fault Penalty)
              </div>
              <div className="p-3 bg-[var(--bg-sheet)] rounded-[2px] border border-[var(--rule-hairline)] space-y-1 text-[11px]">
                <div>{dpEatRes.formula}</div>
                <div className="text-sm font-bold text-[var(--div-m4)] pt-1">
                  Demand Paging EAT = {dpEatRes.eatNs.toLocaleString()} ns ({((dpEatRes.eatNs / ramNs) * 100).toFixed(0)}% of raw memory speed)
                </div>
              </div>
            </div>
          </div>

          {/* Right 5 Columns: Parameter Inputs & Sliders */}
          <div className="lg:col-span-5 space-y-4 font-mono text-xs">
            <div className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[2px] p-4 space-y-4">
              <div className="font-bold text-[var(--ink-primary)] flex items-center justify-between border-b border-[var(--rule-hairline)] pb-1">
                <span>TLB Parameters</span>
                <span className="text-[10px] text-[var(--ink-muted)]">Interactive Sliders</span>
              </div>

              {/* Hit Ratio Slider */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>TLB Hit Ratio (α):</span>
                  <strong className="text-[var(--div-m4)]">{hitRatio}%</strong>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={hitRatio}
                  onChange={(e) => setHitRatio(Number(e.target.value))}
                  className="w-full accent-[var(--div-m4)]"
                />
              </div>

              {/* TLB Lookup Time Slider */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>TLB Lookup Time (T_tlb):</span>
                  <strong>{tlbNs} ns</strong>
                </div>
                <input
                  type="range"
                  min={2}
                  max={50}
                  step={2}
                  value={tlbNs}
                  onChange={(e) => setTlbNs(Number(e.target.value))}
                  className="w-full accent-[var(--div-m4)]"
                />
              </div>

              {/* Main Memory Access Time Slider */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>RAM Access Time (T_ram):</span>
                  <strong>{ramNs} ns</strong>
                </div>
                <input
                  type="range"
                  min={20}
                  max={200}
                  step={10}
                  value={ramNs}
                  onChange={(e) => setRamNs(Number(e.target.value))}
                  className="w-full accent-[var(--div-m4)]"
                />
              </div>

              {/* Exam Presets */}
              <div className="pt-2 border-t border-[var(--rule-hairline)] space-y-1.5">
                <div className="text-[10px] text-[var(--ink-muted)] font-bold">Real Exam FAT Benchmarks:</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTlbNs(10);
                      setRamNs(100);
                      setHitRatio(80);
                    }}
                    className="p-2 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px] text-left hover:bg-[var(--bg-recessed)]"
                  >
                    <div className="font-bold text-[var(--ink-primary)]">C2 Q8 (80% Hit)</div>
                    <div className="text-[10px] text-[var(--div-m4)]">EAT = 130 ns</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTlbNs(10);
                      setRamNs(100);
                      setHitRatio(95);
                    }}
                    className="p-2 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px] text-left hover:bg-[var(--bg-recessed)]"
                  >
                    <div className="font-bold text-[var(--ink-primary)]">C2 Q8 (95% Hit)</div>
                    <div className="text-[10px] text-[var(--div-m4)]">EAT = 115 ns</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Demand Paging Fault Inputs */}
            <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-4 space-y-3">
              <div className="font-bold text-[var(--ink-primary)] border-b border-[var(--rule-hairline)] pb-1">
                Demand Paging Page Fault Inputs
              </div>
              <div className="space-y-2 text-[11px]">
                <label className="block space-y-1">
                  <span>Page Fault Service Time (ms):</span>
                  <input
                    type="number"
                    min={1}
                    max={25}
                    value={dpPfMs}
                    onChange={(e) => setDpPfMs(Number(e.target.value) || 1)}
                    className="w-full px-2 py-1 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)] tabular-nums"
                  />
                </label>
                <label className="block space-y-1">
                  <span>1 fault per N accesses (1 / N):</span>
                  <input
                    type="number"
                    min={100}
                    max={1000000}
                    step={1000}
                    value={dpPfDenom}
                    onChange={(e) => setDpPfDenom(Number(e.target.value) || 1000)}
                    className="w-full px-2 py-1 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)] tabular-nums"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODE 4: Contiguous Memory Placement (C1 Set 2-2 Q8)            */}
      {/* ============================================================== */}
      {mode === 'placement' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left 7 Columns: Partition Visual Blocks & Step Trace */}
          <div className="lg:col-span-7 space-y-4 min-w-0">
            <div className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[2px] p-4 space-y-3 font-mono text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--rule-hairline)]">
                <div>
                  <h3 className="font-bold text-[var(--ink-primary)]">
                    {PLACEMENT_PRESET_C1_2_2_Q8.label}
                  </h3>
                  <p className="text-[11px] text-[var(--ink-muted)]">
                    Algorithm: <strong className="text-[var(--div-m4)]">{placeAlgo.replace('_', ' ')}</strong>
                  </p>
                </div>
                <div className="text-[11px] text-[var(--ink-muted)] tabular-nums">
                  Total Initial Free: 2,380 KB
                </div>
              </div>

              {/* Visual Partition Block Strip */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-[var(--ink-secondary)]">
                  Memory Partitions State (Allocated / Free Remainder):
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-7 gap-1.5 text-center">
                  {PLACEMENT_PRESET_C1_2_2_Q8.blocks.map((origSize, bIdx) => {
                    const finalRem = placementRes.finalBlocks[bIdx];
                    const allocatedProc = placementRes.steps.find((s) => s.allocatedBlockIndex === bIdx);
                    return (
                      <div
                        key={bIdx}
                        className={`p-2 rounded-[2px] border text-[11px] flex flex-col justify-between min-h-[74px] ${
                          allocatedProc
                            ? 'bg-[var(--bg-sheet)] border-[var(--div-m4)]'
                            : 'bg-[var(--bg-recessed)] border-[var(--rule-hairline)]'
                        }`}
                      >
                        <div className="font-bold text-[10px] text-[var(--ink-muted)]">
                          Block #{bIdx + 1}
                        </div>
                        {allocatedProc ? (
                          <div className="my-1">
                            <span className="font-bold text-[var(--div-m4)]">
                              {allocatedProc.processId}
                            </span>
                            <div className="text-[10px] text-[var(--ink-secondary)]">
                              {allocatedProc.processSize} KB
                            </div>
                          </div>
                        ) : (
                          <div className="my-1 text-[10px] text-[var(--ink-muted)] italic">
                            Unused
                          </div>
                        )}
                        <div className="text-[10px] text-[var(--ink-muted)] border-t border-[var(--rule-hairline)] pt-0.5">
                          Rem: {finalRem} KB
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step-by-Step Allocation Sequence */}
              <div className="space-y-1.5 pt-2">
                <div className="text-[11px] font-bold text-[var(--ink-secondary)]">
                  Allocation Execution Trace:
                </div>
                <div className="space-y-1 text-[11px] tabular-nums">
                  {placementRes.steps.map((st) => (
                    <div
                      key={st.processId}
                      className={`px-3 py-1.5 rounded-[2px] border flex flex-wrap items-center justify-between gap-2 ${
                        st.allocatedBlockIndex !== null
                          ? 'bg-[var(--bg-sheet)] border-[var(--rule-hairline)]'
                          : 'bg-[var(--div-danger)]/10 border-[var(--div-danger)]/40'
                      }`}
                    >
                      <span>
                        <strong>{st.processId}</strong> ({st.processSize} KB) →{' '}
                        {st.allocatedBlockIndex !== null ? (
                          <span>
                            Allocated in <strong>Block #{st.allocatedBlockIndex + 1}</strong> (Orig {st.blockSizeBefore} KB) · Remainder {st.remainderAfter} KB
                          </span>
                        ) : (
                          <span className="text-[var(--div-danger)] font-bold">
                            FAILED TO ALLOCATE (External Fragmentation!)
                          </span>
                        )}
                      </span>
                      {st.wrapped && (
                        <span className="text-[10px] text-[var(--div-m2)] font-semibold">
                          Wrapped Circularly
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* External Fragmentation Proof Card */}
              {placementRes.unallocatedProcesses.length > 0 && (
                <div className="p-3 bg-[var(--bg-recessed)] border border-[var(--div-danger)] rounded-[2px] space-y-1 text-[11px]">
                  <div className="font-bold text-[var(--div-danger)] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>External Fragmentation Proof</span>
                  </div>
                  <div className="text-[var(--ink-secondary)] leading-relaxed">
                    Processes <strong className="text-[var(--div-danger)]">{placementRes.unallocatedProcesses.join(', ')}</strong> cannot be allocated.
                    Notice that total free memory is <strong>{placementRes.totalFreeMemory} KB</strong> (sufficient for P5 = 400 KB), but the largest contiguous hole is only <strong>{placementRes.largestContiguousBlock} KB</strong>!
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right 5 Columns: Strategy Switcher & Telemetry */}
          <div className="lg:col-span-5 space-y-4 font-mono text-xs">
            <div className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[2px] p-4 space-y-3">
              <div className="font-bold text-[var(--ink-primary)] border-b border-[var(--rule-hairline)] pb-1">
                Placement Strategy Selector
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(['FIRST_FIT', 'BEST_FIT', 'NEXT_FIT', 'WORST_FIT'] as const).map((a) => {
                  const isSelected = placeAlgo === a;
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setPlaceAlgo(a)}
                      className={`p-2.5 text-left rounded-[2px] border transition-colors ${
                        isSelected
                          ? 'bg-[var(--div-m4)] text-white border-[var(--div-m4)] shadow-xs'
                          : 'bg-[var(--bg-sheet)] text-[var(--ink-primary)] border-[var(--rule-hairline)] hover:bg-[var(--bg-recessed)]'
                      }`}
                    >
                      <div className="font-bold">{a.replace('_', ' ')}</div>
                      <div className="text-[10px] opacity-80">
                        {a === 'FIRST_FIT'
                          ? 'First big enough'
                          : a === 'BEST_FIT'
                            ? 'Smallest remainder'
                            : a === 'NEXT_FIT'
                              ? 'Circular scan'
                              : 'Largest hole'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fragmentation Telemetry */}
            <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-4 space-y-2 tabular-nums">
              <div className="font-bold text-[var(--ink-primary)] border-b border-[var(--rule-hairline)] pb-1">
                Telemetry & Summary
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span>Processes Allocated:</span>
                  <strong>{placementRes.allocatedCount} / {PLACEMENT_PRESET_C1_2_2_Q8.processes.length}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Total Free Memory:</span>
                  <strong>{placementRes.totalFreeMemory} KB</strong>
                </div>
                <div className="flex justify-between">
                  <span>Largest Single Hole:</span>
                  <strong>{placementRes.largestContiguousBlock} KB</strong>
                </div>
                <div className="flex justify-between">
                  <span>External Fragmentation:</span>
                  <span
                    className={`font-bold ${
                      placementRes.canFitUnallocatedInTotalFree
                        ? 'text-[var(--div-danger)]'
                        : 'text-[var(--div-m3)]'
                    }`}
                  >
                    {placementRes.canFitUnallocatedInTotalFree ? 'Yes (Holes Fragmented)' : 'None'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODE 5: Segmentation Translator (C1 Set 1-2 Q5)                */}
      {/* ============================================================== */}
      {mode === 'segmentation' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start font-mono text-xs">
          {/* Left 7 Columns: Segment Table & Translation Logic */}
          <div className="lg:col-span-7 space-y-4 min-w-0">
            <div className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[2px] p-4 space-y-3">
              <div className="font-bold text-[var(--ink-primary)] border-b border-[var(--rule-hairline)] pb-1 flex justify-between">
                <span>Segment Table (VIT C1 Set 1-2 Q5)</span>
                <span className="text-[10px] text-[var(--ink-muted)]">Check: Offset &lt; Limit</span>
              </div>

              <div className="overflow-x-auto border border-[var(--rule-hairline)] rounded-[2px]">
                <table className="w-full text-left border-collapse tabular-nums">
                  <thead>
                    <tr className="bg-[var(--bg-recessed)] border-b border-[var(--rule-strong)]">
                      <th className="px-3 py-1.5">Segment</th>
                      <th className="px-3 py-1.5">Base Address</th>
                      <th className="px-3 py-1.5">Limit (Length)</th>
                      <th className="px-3 py-1.5">Valid Range</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--rule-hairline)]">
                    {SEGMENTATION_PRESET_C1_1_2_Q5.map((s) => (
                      <tr key={s.name}>
                        <td className="px-3 py-2 font-bold text-[var(--ink-primary)]">{s.name}</td>
                        <td className="px-3 py-2">{s.base}</td>
                        <td className="px-3 py-2">{s.limit}</td>
                        <td className="px-3 py-2 text-[var(--ink-muted)]">
                          [{s.base} — {s.base + s.limit - 1}]
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Translation Outcome Box */}
              <div
                className={`p-3.5 rounded-[2px] border font-bold space-y-1 ${
                  segRes.valid
                    ? 'bg-[var(--bg-sheet)] border-[var(--div-m3)] text-[var(--div-m3)]'
                    : 'bg-[var(--div-danger)]/10 border-[var(--div-danger)] text-[var(--div-danger)]'
                }`}
              >
                <div className="flex items-center gap-2 text-sm">
                  {segRes.valid ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  <span>{segRes.valid ? 'VALID PHYSICAL ADDRESS TRANSLATION' : 'TRAP: ADDRESSING ERROR'}</span>
                </div>
                <div className="text-xs text-[var(--ink-primary)] font-normal pt-1">
                  {segRes.message}
                </div>
              </div>
            </div>
          </div>

          {/* Right 5 Columns: Inputs & Exam Cases */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[2px] p-4 space-y-3">
              <div className="font-bold text-[var(--ink-primary)] border-b border-[var(--rule-hairline)] pb-1">
                Translate Logical Address (s, d)
              </div>
              <div className="space-y-2">
                <label className="block space-y-1">
                  <span>Segment Name:</span>
                  <select
                    value={segName}
                    onChange={(e) => setSegName(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)]"
                  >
                    {SEGMENTATION_PRESET_C1_1_2_Q5.map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.name} (Base {s.base}, Limit {s.limit})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1">
                  <span>Byte Offset (d):</span>
                  <input
                    type="number"
                    value={segOffset}
                    onChange={(e) => setSegOffset(Number(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)] tabular-nums"
                  />
                </label>
              </div>

              {/* Real Exam Test Cases */}
              <div className="pt-2 border-t border-[var(--rule-hairline)] space-y-1.5">
                <div className="text-[10px] text-[var(--ink-muted)] font-bold">FAT Exam Test Cases:</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { seg: 'Code', off: 250, label: 'Code 250 (1250)' },
                    { seg: 'Data', off: 350, label: 'Data 350 (TRAP)' },
                    { seg: 'Heap', off: 400, label: 'Heap 400 (4400)' },
                    { seg: 'Stack', off: 150, label: 'Stack 150 (6150)' },
                  ].map((tc) => (
                    <button
                      key={tc.label}
                      type="button"
                      onClick={() => {
                        setSegName(tc.seg);
                        setSegOffset(tc.off);
                      }}
                      className="p-1.5 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px] text-left hover:bg-[var(--bg-recessed)]"
                    >
                      <div className="font-bold text-[10px] text-[var(--ink-primary)]">{tc.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
