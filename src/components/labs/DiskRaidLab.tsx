import React, { useMemo, useState } from 'react';
import {
  DISK_PRESETS,
  DiskAlgorithm,
  DiskDirection,
  RaidLevel,
  evaluateRaidLevel,
  runDiskSchedule,
} from '../../utils/diskRaidEngine';

const DISK_ALGOS: DiskAlgorithm[] = ['FCFS', 'SSTF', 'SCAN', 'C-SCAN', 'LOOK', 'C-LOOK'];
const RAID_LEVELS: RaidLevel[] = ['RAID0', 'RAID1', 'RAID5', 'RAID6', 'RAID10'];

export const DiskRaidLab: React.FC = () => {
  const [presetIdx, setPresetIdx] = useState(0);
  const preset = DISK_PRESETS[presetIdx];

  const [algorithm, setAlgorithm] = useState<DiskAlgorithm>(preset.defaultAlgorithm);
  const [direction, setDirection] = useState<DiskDirection>(preset.input.direction);
  const [initialHead, setInitialHead] = useState<number>(preset.input.initialHead);
  const [minTrack, setMinTrack] = useState<number>(preset.input.minTrack);
  const [maxTrack, setMaxTrack] = useState<number>(preset.input.maxTrack);
  const [requestsInput, setRequestsInput] = useState<string>(preset.input.requests.join(', '));
  const [rpm, setRpm] = useState<number>(preset.input.rpm ?? 6000);

  // RAID Calculator state
  const [raidLevel, setRaidLevel] = useState<RaidLevel>('RAID6');
  const [numDisks, setNumDisks] = useState<number>(6);
  const [diskCapTB, setDiskCapTB] = useState<number>(4);

  const loadPreset = (idx: number) => {
    const p = DISK_PRESETS[idx];
    setPresetIdx(idx);
    setAlgorithm(p.defaultAlgorithm);
    setDirection(p.input.direction);
    setInitialHead(p.input.initialHead);
    setMinTrack(p.input.minTrack);
    setMaxTrack(p.input.maxTrack);
    setRequestsInput(p.input.requests.join(', '));
    setRpm(p.input.rpm ?? 6000);
  };

  const parsedRequests = useMemo(
    () =>
      requestsInput
        .split(/[\s,]+/)
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isFinite(n)),
    [requestsInput]
  );

  const diskResult = useMemo(
    () =>
      runDiskSchedule({
        algorithm,
        minTrack,
        maxTrack,
        initialHead,
        direction,
        requests: parsedRequests,
        msPerTrack: 1,
        rpm,
      }),
    [algorithm, minTrack, maxTrack, initialHead, direction, parsedRequests, rpm]
  );

  const raidResult = useMemo(
    () => evaluateRaidLevel(raidLevel, numDisks, diskCapTB),
    [raidLevel, numDisks, diskCapTB]
  );

  const trackSpan = Math.max(1, maxTrack - minTrack);
  const xForTrack = (t: number) => 28 + ((t - minTrack) / trackSpan) * 624;

  return (
    <div className="space-y-5">
      {/* Disk Presets */}
      <div className="flex flex-wrap items-center gap-1.5">
        {DISK_PRESETS.map((p, idx) => (
          <button
            key={p.id}
            type="button"
            onClick={() => loadPreset(idx)}
            className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-[2px] border ${
              presetIdx === idx
                ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)]'
                : 'bg-[var(--bg-paper)] text-[var(--ink-secondary)] border-[var(--rule-hairline)]'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Disk Controls */}
      <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {DISK_ALGOS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAlgorithm(a)}
                className={`px-2.5 py-1 font-mono text-xs font-semibold rounded-[2px] border ${
                  algorithm === a
                    ? 'bg-[var(--div-m5)] text-white border-[var(--div-m5)]'
                    : 'bg-[var(--bg-sheet)] text-[var(--ink-secondary)] border-[var(--rule-hairline)]'
                }`}
              >
                {a}
              </button>
            ))}
          </div>

          <div className="inline-flex rounded-[2px] border border-[var(--rule-strong)] overflow-hidden font-mono text-xs">
            <button
              type="button"
              onClick={() => setDirection('down')}
              className={`px-2.5 py-1 font-semibold ${
                direction === 'down'
                  ? 'bg-[var(--div-m2)] text-white'
                  : 'bg-[var(--bg-sheet)] text-[var(--ink-secondary)]'
              }`}
            >
              ↓ Toward {minTrack}
            </button>
            <button
              type="button"
              onClick={() => setDirection('up')}
              className={`px-2.5 py-1 font-semibold ${
                direction === 'up'
                  ? 'bg-[var(--div-m2)] text-white'
                  : 'bg-[var(--bg-sheet)] text-[var(--ink-secondary)]'
              }`}
            >
              ↑ Toward {maxTrack}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
          <label className="space-y-1">
            <span>Initial Head</span>
            <input
              type="number"
              value={initialHead}
              onChange={(e) => setInitialHead(Number(e.target.value) || 0)}
              className="w-full px-2 py-1 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)] tabular-nums"
            />
          </label>
          <label className="space-y-1">
            <span>RPM</span>
            <input
              type="number"
              value={rpm}
              onChange={(e) => setRpm(Math.max(1000, Number(e.target.value) || 6000))}
              className="w-full px-2 py-1 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)] tabular-nums"
            />
          </label>
          <label className="col-span-2 space-y-1">
            <span>Cylinder Queue</span>
            <input
              type="text"
              value={requestsInput}
              onChange={(e) => setRequestsInput(e.target.value)}
              className="w-full px-2 py-1 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)] tabular-nums"
            />
          </label>
        </div>

        {/* Summary KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono text-xs tabular-nums">
          <div className="p-3 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px]">
            <div className="text-[var(--ink-muted)]">Total Head Movement</div>
            <div className="text-lg font-bold text-[var(--div-m5)]">
              {diskResult.totalHeadMovement} cylinders
            </div>
          </div>
          <div className="p-3 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px]">
            <div className="text-[var(--ink-muted)]">Seek Time (1 ms/track)</div>
            <div className="text-lg font-bold text-[var(--ink-primary)]">
              {diskResult.seekTimeMs} ms
            </div>
          </div>
          <div className="p-3 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px]">
            <div className="text-[var(--ink-muted)]">Avg Rotational Latency ({rpm} RPM)</div>
            <div className="text-lg font-bold text-[var(--ink-primary)]">
              {diskResult.avgRotationalLatencyMs} ms
            </div>
          </div>
        </div>

        {/* Live SVG Head Movement Diagram */}
        <div className="diagram-canvas-plate p-3 overflow-x-auto">
          <div className="min-w-[540px]">
            <svg
              viewBox={`0 0 680 ${Math.max(150, 46 + diskResult.sequence.length * 22)}`}
              className="w-full h-auto"
              role="img"
              aria-label="Disk head seek trajectory diagram"
            >
              {/* Cylinder axis */}
              <line x1="28" y1="24" x2="652" y2="24" stroke="var(--rule-strong)" strokeWidth="1.5" />
              <text x="28" y="15" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--ink-muted)">
                {minTrack}
              </text>
              <text x="652" y="15" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--ink-muted)">
                {maxTrack}
              </text>

              {/* Path */}
              <polyline
                fill="none"
                stroke="var(--div-m5)"
                strokeWidth="2"
                points={diskResult.sequence
                  .map((trk, i) => `${xForTrack(trk).toFixed(1)},${38 + i * 22}`)
                  .join(' ')}
              />
              {diskResult.sequence.map((trk, i) => {
                const cx = xForTrack(trk);
                const cy = 38 + i * 22;
                return (
                  <g key={`${trk}-${i}`}>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={i === 0 ? 5 : 4}
                      fill={i === 0 ? 'var(--div-m2)' : 'var(--div-m5)'}
                    />
                    <text
                      x={cx + (cx > 580 ? -12 : 10)}
                      y={cy + 3}
                      textAnchor={cx > 580 ? 'end' : 'start'}
                      fontSize="9.5"
                      fontWeight="700"
                      fill="var(--ink-primary)"
                    >
                      {trk}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="font-mono text-[11px] text-[var(--ink-muted)] mt-2 pt-2 border-t border-[var(--rule-hairline)]">
            Order: {diskResult.sequence.join(' → ')}
          </div>
        </div>
      </div>

      {/* RAID Level Calculator (C1 1-2 Q7) */}
      <div className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[2px] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-bold text-[var(--ink-primary)]">
            RAID Capacity &amp; Fault-Tolerance Calculator (C1 Set 1-2 Q7)
          </h4>
          <div className="flex flex-wrap items-center gap-1.5">
            {RAID_LEVELS.map((rl) => (
              <button
                key={rl}
                type="button"
                onClick={() => setRaidLevel(rl)}
                className={`px-2.5 py-1 font-mono text-xs font-semibold rounded-[2px] border ${
                  raidLevel === rl
                    ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)]'
                    : 'bg-[var(--bg-sheet)] text-[var(--ink-secondary)] border-[var(--rule-hairline)]'
                }`}
              >
                {rl}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 font-mono text-xs">
          <label className="inline-flex items-center gap-1.5">
            Disks (N):
            <input
              type="number"
              min={2}
              max={24}
              value={numDisks}
              onChange={(e) => setNumDisks(Math.max(2, Number(e.target.value) || 2))}
              className="w-16 px-2 py-1 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)] tabular-nums"
            />
          </label>
          <label className="inline-flex items-center gap-1.5">
            Disk Size (TB):
            <input
              type="number"
              min={1}
              max={24}
              value={diskCapTB}
              onChange={(e) => setDiskCapTB(Math.max(1, Number(e.target.value) || 1))}
              className="w-16 px-2 py-1 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)] tabular-nums"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono text-xs tabular-nums">
          <div className="p-3 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px]">
            <div className="text-[var(--ink-muted)]">Usable Capacity</div>
            <div className="text-base font-bold text-[var(--ink-primary)]">
              {raidResult.valid
                ? `${raidResult.usableCapacityTB} TB (${raidResult.storageEfficiencyPercent}%)`
                : `Needs min ${raidResult.minDisks} disks`}
            </div>
          </div>
          <div className="p-3 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px]">
            <div className="text-[var(--ink-muted)]">Max Simultaneous Disk Failures</div>
            <div className="text-base font-bold text-[var(--div-m3)]">
              {raidResult.maxDiskFailures} disk{raidResult.maxDiskFailures === 1 ? '' : 's'}
            </div>
          </div>
          <div className="p-3 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px]">
            <div className="text-[var(--ink-muted)]">Write Profile</div>
            <div className="text-xs font-semibold text-[var(--ink-primary)] mt-1">
              {raidResult.writePerformance}
            </div>
          </div>
        </div>
        <div className="text-xs text-[var(--ink-secondary)]">
          <strong>Exam Justification ({raidResult.name}):</strong> {raidResult.bestUseCase}
        </div>
      </div>
    </div>
  );
};
