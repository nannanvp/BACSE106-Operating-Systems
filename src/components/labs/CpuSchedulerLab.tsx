import React, { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  CPU_SCHEDULER_PRESETS,
  ProcessInput,
  SchedulingAlgorithm,
  runCpuSchedule,
} from '../../utils/cpuSchedulerEngine';

const ALGOS: Array<{ id: SchedulingAlgorithm; label: string }> = [
  { id: 'FCFS', label: 'FCFS' },
  { id: 'SJF', label: 'SJF (NP)' },
  { id: 'SRTF', label: 'SRTF (Preemptive)' },
  { id: 'NP_PRIORITY', label: 'Priority (NP)' },
  { id: 'P_PRIORITY', label: 'Priority (Preemptive)' },
  { id: 'RR', label: 'Round Robin' },
];

const PROC_COLORS = [
  'var(--div-m1)',
  'var(--div-m2)',
  'var(--div-m3)',
  'var(--div-m4)',
  'var(--div-m5)',
  'var(--div-labs)',
  'var(--div-mock)',
  'var(--div-standing)',
];

export const CpuSchedulerLab: React.FC = () => {
  const defaultPreset = CPU_SCHEDULER_PRESETS[0];
  const [algorithm, setAlgorithm] = useState<SchedulingAlgorithm>(defaultPreset.algorithm);
  const [quantum, setQuantum] = useState<number>(defaultPreset.quantum);
  const [csOverhead, setCsOverhead] = useState<number>(defaultPreset.csOverhead);
  const [processes, setProcesses] = useState<ProcessInput[]>(defaultPreset.processes);
  const [activePresetLabel, setActivePresetLabel] = useState<string>(defaultPreset.label);

  const result = useMemo(
    () => runCpuSchedule(processes, algorithm, quantum, csOverhead),
    [processes, algorithm, quantum, csOverhead]
  );

  const loadPreset = (presetId: string) => {
    const p = CPU_SCHEDULER_PRESETS.find((x) => x.id === presetId);
    if (!p) return;
    setAlgorithm(p.algorithm);
    setQuantum(p.quantum);
    setCsOverhead(p.csOverhead);
    setProcesses(p.processes.map((row) => ({ ...row })));
    setActivePresetLabel(p.label);
  };

  const updateRow = (idx: number, field: keyof ProcessInput, val: string) => {
    setProcesses((prev) =>
      prev.map((row, i) =>
        i !== idx
          ? row
          : field === 'id'
            ? { ...row, id: val }
            : { ...row, [field]: Math.max(field === 'burst' ? 1 : 0, Number(val) || 0) }
      )
    );
  };

  const addProcess = () => {
    setProcesses((prev) => [
      ...prev,
      { id: `P${prev.length + 1}`, arrival: 0, burst: 4, priority: 3 },
    ]);
  };

  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    processes.forEach((p, idx) => {
      map[p.id] = PROC_COLORS[idx % PROC_COLORS.length];
    });
    return map;
  }, [processes]);

  const ganttTotal = Math.max(1, result.totalTime);

  return (
    <div className="space-y-4">
      {/* Real VIT Paper Presets */}
      <div className="flex flex-wrap items-center gap-1.5">
        {CPU_SCHEDULER_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => loadPreset(preset.id)}
            className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-[2px] border transition-colors ${
              activePresetLabel === preset.label
                ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)]'
                : 'bg-[var(--bg-paper)] text-[var(--ink-secondary)] border-[var(--rule-hairline)] hover:bg-[var(--bg-recessed)]'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Controls Bar */}
      <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-3.5 flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {ALGOS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAlgorithm(a.id)}
              className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-[2px] border ${
                algorithm === a.id
                  ? 'bg-[var(--div-m2)] text-white border-[var(--div-m2)]'
                  : 'bg-[var(--bg-sheet)] text-[var(--ink-secondary)] border-[var(--rule-hairline)]'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 font-mono text-xs ml-auto">
          {algorithm === 'RR' && (
            <label className="inline-flex items-center gap-1.5 text-[var(--ink-primary)]">
              Quantum (q):
              <input
                type="number"
                min={1}
                max={50}
                value={quantum}
                onChange={(e) => setQuantum(Math.max(1, Number(e.target.value) || 1))}
                className="w-16 px-2 py-1 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)] tabular-nums"
              />
            </label>
          )}
          <label className="inline-flex items-center gap-1.5 text-[var(--ink-primary)]">
            CS Overhead (ms):
            <input
              type="number"
              min={0}
              max={10}
              value={csOverhead}
              onChange={(e) => setCsOverhead(Math.max(0, Number(e.target.value) || 0))}
              className="w-16 px-2 py-1 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)] tabular-nums"
            />
          </label>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 font-mono tabular-nums">
        {[
          { label: 'Avg Turnaround', val: `${result.avgTurnaround} ms` },
          { label: 'Avg Waiting', val: `${result.avgWaiting} ms` },
          { label: 'Avg Response', val: `${result.avgResponse} ms` },
          { label: 'Makespan / CS', val: `${result.totalTime} ms (${result.totalCsCount} CS)` },
          { label: 'CPU Utilization', val: `${result.cpuUtilization}%` },
        ].map((m) => (
          <div
            key={m.label}
            className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-3"
          >
            <div className="text-[11px] text-[var(--ink-muted)]">{m.label}</div>
            <div className="text-base font-bold text-[var(--ink-primary)] mt-0.5">{m.val}</div>
          </div>
        ))}
      </div>

      {/* Live SVG Gantt Chart */}
      <div className="diagram-canvas-plate p-4 overflow-x-auto space-y-2">
        <div className="font-mono text-xs font-bold text-[var(--ink-primary)] flex justify-between">
          <span>
            Live Gantt Chart ({algorithm} · Total = {result.totalTime} ms · CS = {result.totalCsTime} ms)
          </span>
          <span className="text-[var(--ink-muted)]">Lower priority # = Higher priority</span>
        </div>
        <div className="min-w-[640px]">
          <svg
            viewBox="0 0 800 84"
            className="w-full h-auto"
            role="img"
            aria-label="CPU Scheduling Gantt Chart"
          >
            {result.gantt.map((seg, i) => {
              const x = 10 + (seg.start / ganttTotal) * 780;
              const w = Math.max(2, ((seg.end - seg.start) / ganttTotal) * 780);
              const fill =
                seg.kind === 'cs'
                  ? 'var(--bg-recessed)'
                  : seg.kind === 'idle'
                    ? 'var(--bg-sheet)'
                    : colorMap[seg.label] ?? 'var(--div-m2)';
              const textFill = seg.kind === 'process' ? '#ffffff' : 'var(--ink-secondary)';
              return (
                <g key={`${seg.label}-${seg.start}-${i}`}>
                  <rect
                    x={x}
                    y={14}
                    width={w}
                    height={36}
                    fill={fill}
                    stroke="var(--bg-paper)"
                    strokeWidth="1"
                  />
                  {w >= 18 && (
                    <text
                      x={x + w / 2}
                      y={36}
                      textAnchor="middle"
                      fontSize="9.5"
                      fontWeight="700"
                      fill={textFill}
                    >
                      {seg.label}
                    </text>
                  )}
                  {(i === 0 || w >= 22) && (
                    <text
                      x={x}
                      y={66}
                      textAnchor="middle"
                      fontSize="8.5"
                      fill="var(--ink-muted)"
                    >
                      {seg.start}
                    </text>
                  )}
                </g>
              );
            })}
            <text x="790" y="66" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="var(--ink-primary)">
              {result.totalTime}
            </text>
          </svg>
        </div>
      </div>

      {/* Editable Process Table + Computed CT/TAT/WT/RT */}
      <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] overflow-x-auto">
        <div className="px-3.5 py-2.5 bg-[var(--bg-board)] border-b border-[var(--rule-hairline)] flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-[var(--ink-primary)]">
            Process Table &amp; Verified Metrics (Sanity: ΣBT {result.totalBurst} + CS {result.totalCsTime} + Idle {result.totalIdleTime} = {result.totalTime} ms)
          </span>
          <button
            type="button"
            onClick={addProcess}
            className="px-2.5 py-1 text-xs font-mono font-semibold rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-paper)] text-[var(--ink-primary)] inline-flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add Process
          </button>
        </div>
        <table className="w-full text-left border-collapse font-mono text-xs tabular-nums">
          <thead>
            <tr className="bg-[var(--bg-recessed)] border-b border-[var(--rule-strong)]">
              <th className="px-2.5 py-2">PID</th>
              <th className="px-2.5 py-2">AT</th>
              <th className="px-2.5 py-2">BT</th>
              <th className="px-2.5 py-2">Prio</th>
              <th className="px-2.5 py-2">CT</th>
              <th className="px-2.5 py-2">TAT</th>
              <th className="px-2.5 py-2">WT</th>
              <th className="px-2.5 py-2">RT</th>
              <th className="px-2.5 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--rule-hairline)]">
            {processes.map((row, idx) => {
              const m = result.processes.find((p) => p.id === row.id);
              return (
                <tr key={idx}>
                  <td className="px-2.5 py-1.5 font-bold">{row.id}</td>
                  <td className="px-2.5 py-1.5">
                    <input
                      type="number"
                      min={0}
                      value={row.arrival}
                      onChange={(e) => updateRow(idx, 'arrival', e.target.value)}
                      className="w-14 px-1.5 py-0.5 rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-sheet)]"
                    />
                  </td>
                  <td className="px-2.5 py-1.5">
                    <input
                      type="number"
                      min={1}
                      value={row.burst}
                      onChange={(e) => updateRow(idx, 'burst', e.target.value)}
                      className="w-14 px-1.5 py-0.5 rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-sheet)]"
                    />
                  </td>
                  <td className="px-2.5 py-1.5">
                    <input
                      type="number"
                      min={1}
                      value={row.priority}
                      onChange={(e) => updateRow(idx, 'priority', e.target.value)}
                      className="w-14 px-1.5 py-0.5 rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-sheet)]"
                    />
                  </td>
                  <td className="px-2.5 py-1.5 font-semibold">{m?.completion ?? '—'}</td>
                  <td className="px-2.5 py-1.5">{m?.turnaround ?? '—'}</td>
                  <td className="px-2.5 py-1.5 font-bold text-[var(--div-m2)]">{m?.waiting ?? '—'}</td>
                  <td className="px-2.5 py-1.5">{m?.response ?? '—'}</td>
                  <td className="px-2.5 py-1.5 text-right">
                    {processes.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setProcesses((p) => p.filter((_, i) => i !== idx))}
                        className="p-1 text-[var(--ink-muted)] hover:text-[var(--div-danger)]"
                        aria-label={`Remove ${row.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
