import React, { useMemo, useState } from 'react';
import {
  PAGE_REPLACEMENT_PRESETS,
  PLACEMENT_PRESET_C1_2_2_Q8,
  PageReplacementAlgo,
  PlacementAlgo,
  SEGMENTATION_PRESET_C1_1_2_Q5,
  computePagingTlb,
  runContiguousPlacement,
  runPageReplacement,
  translateSegmentAddress,
} from '../../utils/memoryPagingEngine';

export const MemoryPagingLab: React.FC = () => {
  const [subTab, setSubTab] = useState<'replacement' | 'placement' | 'tlb-seg'>('replacement');

  // Page Replacement State
  const [presetIdx, setPresetIdx] = useState(0);
  const [frameCount, setFrameCount] = useState(PAGE_REPLACEMENT_PRESETS[0].frameCount);
  const [refInput, setRefInput] = useState(PAGE_REPLACEMENT_PRESETS[0].referenceString.join(', '));
  const [pageAlgo, setPageAlgo] = useState<PageReplacementAlgo>('LRU');

  // Placement State
  const [placeAlgo, setPlaceAlgo] = useState<PlacementAlgo>('BEST_FIT');

  // Paging + TLB + Segmentation State
  const [tlbNs, setTlbNs] = useState(10);
  const [ramNs, setRamNs] = useState(100);
  const [hitRatio, setHitRatio] = useState(80);
  const [segName, setSegName] = useState('Data');
  const [segOffset, setSegOffset] = useState(350);

  const parsedRefs = useMemo(
    () =>
      refInput
        .split(/[\s,]+/)
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isFinite(n) && n >= 0),
    [refInput]
  );

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
  const activePageRes = pageAlgo === 'FIFO' ? fifoRes : pageAlgo === 'LRU' ? lruRes : optRes;

  const placementRes = useMemo(
    () =>
      runContiguousPlacement(
        PLACEMENT_PRESET_C1_2_2_Q8.blocks,
        PLACEMENT_PRESET_C1_2_2_Q8.processes,
        placeAlgo
      ),
    [placeAlgo]
  );

  const tlbRes = useMemo(
    () =>
      computePagingTlb({
        vasKB: 64,
        ramKB: 16,
        pageSizeKB: 1,
        tlbNs,
        ramNs,
        hitRatioPercent: hitRatio,
      }),
    [tlbNs, ramNs, hitRatio]
  );

  const segRes = useMemo(
    () => translateSegmentAddress(SEGMENTATION_PRESET_C1_1_2_Q5, segName, segOffset),
    [segName, segOffset]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1.5">
        {(
          [
            { id: 'replacement', label: 'Page Replacement (C1 2-2 Q6 & C2 Q7)' },
            { id: 'placement', label: 'Contiguous Placement (C1 2-2 Q8)' },
            { id: 'tlb-seg', label: 'Paging+TLB EAT & Segmentation (C2 Q8 & C1 1-2 Q5)' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSubTab(t.id)}
            className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-[2px] border ${
              subTab === t.id
                ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)]'
                : 'bg-[var(--bg-paper)] text-[var(--ink-secondary)] border-[var(--rule-hairline)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === 'replacement' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {PAGE_REPLACEMENT_PRESETS.map((p, idx) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setPresetIdx(idx);
                  setFrameCount(p.frameCount);
                  setRefInput(p.referenceString.join(', '));
                }}
                className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-[2px] border ${
                  presetIdx === idx
                    ? 'bg-[var(--div-m4)] text-white border-[var(--div-m4)]'
                    : 'bg-[var(--bg-paper)] text-[var(--ink-secondary)] border-[var(--rule-hairline)]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
              <label className="inline-flex items-center gap-1.5">
                Frames:
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={frameCount}
                  onChange={(e) => setFrameCount(Math.max(1, Math.min(8, Number(e.target.value) || 1)))}
                  className="w-16 px-2 py-1 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)] tabular-nums"
                />
              </label>
              <label className="flex-1 min-w-[240px] flex items-center gap-1.5">
                Refs:
                <input
                  type="text"
                  value={refInput}
                  onChange={(e) => setRefInput(e.target.value)}
                  className="w-full px-2 py-1 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)] tabular-nums"
                />
              </label>
            </div>

            {/* 3-Algorithm Fault Comparison Strip */}
            <div className="grid grid-cols-3 gap-2.5 font-mono text-xs tabular-nums">
              {(
                [
                  { id: 'FIFO' as const, r: fifoRes },
                  { id: 'LRU' as const, r: lruRes },
                  { id: 'OPT' as const, r: optRes },
                ]
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPageAlgo(item.id)}
                  className={`p-3 text-left rounded-[2px] border transition-colors ${
                    pageAlgo === item.id
                      ? 'bg-[var(--bg-recessed)] border-[var(--ink-primary)]'
                      : 'bg-[var(--bg-sheet)] border-[var(--rule-hairline)]'
                  }`}
                >
                  <div className="font-bold text-[var(--ink-primary)]">{item.id}</div>
                  <div className="text-base font-bold text-[var(--div-m4)] mt-0.5">
                    {item.r.faults} Faults · {item.r.hits} Hits
                  </div>
                  <div className="text-[11px] text-[var(--ink-muted)]">
                    Hit Ratio: {(item.r.hitRatio * 100).toFixed(1)}%
                  </div>
                </button>
              ))}
            </div>

            {/* Step-by-Step Frame Matrix */}
            <div className="overflow-x-auto border border-[var(--rule-hairline)] rounded-[2px]">
              <table className="w-full text-center border-collapse font-mono text-xs tabular-nums">
                <thead>
                  <tr className="bg-[var(--bg-recessed)] border-b border-[var(--rule-strong)]">
                    <th className="px-2 py-1.5 text-left">Ref</th>
                    {activePageRes.steps.map((s) => (
                      <th key={s.step} className="px-2 py-1.5 font-bold">
                        {s.page}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--rule-hairline)]">
                  {Array.from({ length: frameCount }).map((_, fi) => (
                    <tr key={fi}>
                      <td className="px-2 py-1 text-left text-[var(--ink-muted)]">F{fi}</td>
                      {activePageRes.steps.map((s) => (
                        <td key={s.step} className="px-2 py-1">
                          {s.frames[fi] ?? '·'}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="bg-[var(--bg-sheet)] font-bold">
                    <td className="px-2 py-1.5 text-left">Status</td>
                    {activePageRes.steps.map((s) => (
                      <td
                        key={s.step}
                        className={`px-2 py-1.5 ${
                          s.hit ? 'text-[var(--div-m3)]' : 'text-[var(--div-danger)]'
                        }`}
                      >
                        {s.hit ? 'H' : 'F'}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {subTab === 'placement' && (
        <div className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[2px] p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="font-mono text-xs font-bold text-[var(--ink-primary)]">
              {PLACEMENT_PRESET_C1_2_2_Q8.label} · Initial Free: [
              {PLACEMENT_PRESET_C1_2_2_Q8.blocks.join(', ')}] KB
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {(['FIRST_FIT', 'BEST_FIT', 'NEXT_FIT', 'WORST_FIT'] as const).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setPlaceAlgo(a)}
                  className={`px-2.5 py-1 font-mono text-xs font-semibold rounded-[2px] border ${
                    placeAlgo === a
                      ? 'bg-[var(--div-m4)] text-white border-[var(--div-m4)]'
                      : 'bg-[var(--bg-sheet)] text-[var(--ink-secondary)] border-[var(--rule-hairline)]'
                  }`}
                >
                  {a.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono text-xs tabular-nums">
            <div className="p-3 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px]">
              Allocated: <strong>{placementRes.allocatedCount}/6</strong> (Unallocated:{' '}
              <span className="text-[var(--div-danger)] font-bold">
                {placementRes.unallocatedProcesses.join(', ') || 'None'}
              </span>
              )
            </div>
            <div className="p-3 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px]">
              Total Free Memory: <strong>{placementRes.totalFreeMemory} KB</strong>
            </div>
            <div className="p-3 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px]">
              Largest Contiguous Hole: <strong>{placementRes.largestContiguousBlock} KB</strong>
            </div>
          </div>

          <div className="space-y-1.5 font-mono text-xs tabular-nums">
            {placementRes.steps.map((st) => (
              <div
                key={st.processId}
                className="px-3 py-1.5 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px] flex flex-wrap justify-between gap-2"
              >
                <span>
                  <strong>
                    {st.processId} ({st.processSize} KB)
                  </strong>{' '}
                  →{' '}
                  {st.allocatedBlockIndex !== null
                    ? `Block #${st.allocatedBlockIndex + 1} (${st.blockSizeBefore} KB) · Remainder ${st.remainderAfter} KB`
                    : 'UNALLOCATED (External Fragmentation!)'}
                </span>
                {st.wrapped && <span className="text-[var(--div-m2)]">Wrapped circularly</span>}
              </div>
            ))}
          </div>
          <div className="font-mono text-xs text-[var(--ink-muted)]">
            Final Free Blocks: [{placementRes.finalBlocks.join(', ')}] KB
          </div>
        </div>
      )}

      {subTab === 'tlb-seg' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[2px] p-4 space-y-3">
            <h4 className="text-sm font-bold text-[var(--ink-primary)]">
              Paging + TLB Effective Access Time (C2 Q8)
            </h4>
            <div className="grid grid-cols-3 gap-2 font-mono text-xs">
              <label className="space-y-1">
                <span>TLB (ns)</span>
                <input
                  type="number"
                  value={tlbNs}
                  onChange={(e) => setTlbNs(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full px-2 py-1 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)] tabular-nums"
                />
              </label>
              <label className="space-y-1">
                <span>RAM (ns)</span>
                <input
                  type="number"
                  value={ramNs}
                  onChange={(e) => setRamNs(Math.max(10, Number(e.target.value) || 10))}
                  className="w-full px-2 py-1 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)] tabular-nums"
                />
              </label>
              <label className="space-y-1">
                <span>Hit % (α)</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={hitRatio}
                  onChange={(e) => setHitRatio(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                  className="w-full px-2 py-1 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)] tabular-nums"
                />
              </label>
            </div>
            <div className="p-3 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px] font-mono text-xs tabular-nums space-y-1">
              <div>
                VAS 64 KB / Page 1 KB → <strong>{tlbRes.logicalAddressBits}-bit logical</strong> (p=
                {tlbRes.pageNumberBits}b, d={tlbRes.offsetBits}b)
              </div>
              <div>
                Hit = {tlbRes.hitAccessNs} ns · Miss = {tlbRes.missAccessNs} ns
              </div>
              <div className="text-base font-bold text-[var(--div-m4)] pt-1">
                EAT = {tlbRes.eatNs} ns
              </div>
            </div>
          </div>

          <div className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[2px] p-4 space-y-3">
            <h4 className="text-sm font-bold text-[var(--ink-primary)]">
              Segmentation Translator (C1 Set 1-2 Q5)
            </h4>
            <div className="flex items-center gap-3 font-mono text-xs">
              <select
                value={segName}
                onChange={(e) => setSegName(e.target.value)}
                className="px-2 py-1.5 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)]"
              >
                {SEGMENTATION_PRESET_C1_1_2_Q5.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name} (Base {s.base}, Lim {s.limit})
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={segOffset}
                onChange={(e) => setSegOffset(Number(e.target.value) || 0)}
                className="w-24 px-2 py-1.5 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)] tabular-nums"
              />
            </div>
            <div
              className={`p-3 rounded-[2px] border font-mono text-xs font-bold ${
                segRes.valid
                  ? 'bg-[var(--bg-sheet)] border-[var(--div-m3)] text-[var(--div-m3)]'
                  : 'bg-[var(--bg-sheet)] border-[var(--div-danger)] text-[var(--div-danger)]'
              }`}
            >
              {segRes.message}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
