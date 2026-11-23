import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  BookmarkCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Cpu,
  Info,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Sliders,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  CPU_SCHEDULER_PRESETS,
  ProcessInput,
  SchedulingAlgorithm,
  formatGanttSegmentLabel,
  getTimelineState,
  runCpuSchedule,
} from '../../utils/cpuSchedulerEngine';

interface AlgoOption {
  id: SchedulingAlgorithm;
  label: string;
  badge: string;
  description: string;
}

const ALGOS: AlgoOption[] = [
  {
    id: 'P_PRIORITY',
    label: 'Preemptive Priority',
    badge: 'Preemptive · CS',
    description:
      'Lower number = higher priority. Preempts running process immediately when a higher priority process arrives. Incurs 1ms CS overhead on process transitions.',
  },
  {
    id: 'NP_PRIORITY',
    label: 'Non-Preemptive Priority',
    badge: 'Non-Preemptive',
    description:
      'Once dispatched, holds CPU until burst completes. Next process chosen from ready queue by lowest priority number (ties broken by arrival order).',
  },
  {
    id: 'RR',
    label: 'Round Robin',
    badge: 'Time-Sliced · Preemptive',
    description:
      'Each ready process receives a CPU time slice equal to quantum q. Newly arriving processes join queue before the preempted process re-enters.',
  },
  {
    id: 'SRTF',
    label: 'SRTF (Preemptive SJF)',
    badge: 'Shortest Remaining',
    description:
      'Preemptive Shortest-Job-First. At every arrival, process with minimum remaining burst runs. Ties broken by arrival time (FCFS).',
  },
  {
    id: 'FCFS',
    label: 'FCFS',
    badge: 'First-Come First-Served',
    description:
      'Strictly non-preemptive in arrival order. Simple FIFO dispatcher; vulnerable to the Convoy Effect when large burst processes arrive first.',
  },
  {
    id: 'SJF',
    label: 'SJF (Non-Preemptive)',
    badge: 'Shortest Job First',
    description:
      'Non-preemptive: dispatches the ready process with the smallest initial burst time. Minimizes average waiting time for simultaneous arrivals.',
  },
];

const PROC_COLORS = [
  '#e06d2b', // var(--div-m2)
  '#22559c', // var(--div-m5)
  '#4f8a3d', // var(--div-m3)
  '#147e7b', // var(--div-m4)
  '#8b3a62', // var(--div-labs)
  '#e5b82e', // var(--div-m1)
  '#3b4d7a', // var(--div-mock)
  '#2e6f5e', // var(--div-standing)
  '#c46493',
  '#d97706',
];

export const CpuSchedulerLab: React.FC = () => {
  const defaultPreset = CPU_SCHEDULER_PRESETS[0];
  const [algorithm, setAlgorithm] = useState<SchedulingAlgorithm>(defaultPreset.algorithm);
  const [quantum, setQuantum] = useState<number>(defaultPreset.quantum);
  const [csOverhead, setCsOverhead] = useState<number>(defaultPreset.csOverhead);
  const [processes, setProcesses] = useState<ProcessInput[]>(defaultPreset.processes);
  const [activePresetId, setActivePresetId] = useState<string>(defaultPreset.id);

  // Timeline playback state
  const [cursorTime, setCursorTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playSpeed, setPlaySpeed] = useState<number>(1); // 1 = 500ms, 2 = 250ms

  const svgRef = useRef<SVGSVGElement | null>(null);

  const result = useMemo(
    () => runCpuSchedule(processes, algorithm, quantum, csOverhead),
    [processes, algorithm, quantum, csOverhead]
  );

  // Auto-clamp cursor when result totalTime changes
  useEffect(() => {
    if (cursorTime > result.totalTime) {
      setCursorTime(result.totalTime);
    }
  }, [result.totalTime, cursorTime]);

  // Timeline playback tick
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCursorTime((prev) => {
        if (prev >= result.totalTime) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, Math.round(500 / playSpeed));
    return () => clearInterval(interval);
  }, [isPlaying, result.totalTime, playSpeed]);

  const timeline = useMemo(
    () => getTimelineState(result, cursorTime, processes),
    [result, cursorTime, processes]
  );

  const loadPreset = (presetId: string) => {
    const p = CPU_SCHEDULER_PRESETS.find((x) => x.id === presetId);
    if (!p) return;
    setIsPlaying(false);
    setAlgorithm(p.algorithm);
    setQuantum(p.quantum);
    setCsOverhead(p.csOverhead);
    setProcesses(p.processes.map((row) => ({ ...row })));
    setActivePresetId(p.id);
    setCursorTime(0);
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

  const removeProcess = (idx: number) => {
    if (processes.length <= 2) return;
    setProcesses((prev) => prev.filter((_, i) => i !== idx));
  };

  const resetCurrentPreset = () => {
    const p = CPU_SCHEDULER_PRESETS.find((x) => x.id === activePresetId) ?? CPU_SCHEDULER_PRESETS[0];
    loadPreset(p.id);
  };

  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    processes.forEach((p, idx) => {
      map[p.id] = PROC_COLORS[idx % PROC_COLORS.length];
    });
    return map;
  }, [processes]);

  const ganttTotal = Math.max(1, result.totalTime);

  // SVG dimensions
  const SVG_WIDTH = 840;
  const SVG_HEIGHT = 92;
  const PLOT_X = 24;
  const PLOT_WIDTH = 792;
  const BAR_Y = 22;
  const BAR_HEIGHT = 42;

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const normX = (clickX / rect.width) * SVG_WIDTH;
    const clampedPlotX = Math.max(PLOT_X, Math.min(PLOT_X + PLOT_WIDTH, normX));
    const pct = (clampedPlotX - PLOT_X) / PLOT_WIDTH;
    const newTime = Math.round(pct * ganttTotal);
    setCursorTime(Math.max(0, Math.min(ganttTotal, newTime)));
  };

  const cursorX = PLOT_X + (cursorTime / ganttTotal) * PLOT_WIDTH;

  // Filter context switch segments for explicit CS review
  const csSegments = useMemo(
    () => result.gantt.filter((seg) => seg.kind === 'cs'),
    [result.gantt]
  );

  const activeAlgoMeta = ALGOS.find((a) => a.id === algorithm) ?? ALGOS[0];

  return (
    <div className="space-y-6">
      {/* Title Header with VIT Exam Reference */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 border-b border-[var(--rule-strong)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-[2px] bg-[var(--div-m2)] text-white">
              Module 2 Workbench
            </span>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-[2px] bg-[var(--bg-recessed)] text-[var(--ink-secondary)]">
              Strict 7:5 Architecture
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--ink-primary)] mt-1.5 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[var(--div-m2)]" />
            CPU Scheduler &amp; Context-Switch Simulator
          </h2>
          <p className="font-mono text-xs text-[var(--ink-muted)] mt-0.5">
            Real FAT Exam Benchmarks: C1 Set 2-2 Q5 (10-Process 1ms CS Preemptive Priority) &amp; C2 Q3 (3D Printer Round Robin q=10)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetCurrentPreset}
            className="px-3 py-1.5 text-xs font-mono font-semibold rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-paper)] text-[var(--ink-secondary)] hover:bg-[var(--bg-recessed)] inline-flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Workbench
          </button>
        </div>
      </div>

      {/* STRICT 7:5 ASYMMETRIC WORKBENCH GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================================= */}
        {/* LEFT 7 COLUMNS: Interactive Gantt Chart, CS Blocks, Metrics, Timeline   */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 space-y-5 lab-stage-canvas">
          {/* 5-Metric Quick Readout Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 font-mono tabular-nums">
            <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-3">
              <div className="text-[10.5px] uppercase font-bold text-[var(--ink-muted)]">Avg Turnaround</div>
              <div className="text-lg font-bold text-[var(--ink-primary)] mt-0.5">
                {result.avgTurnaround} <span className="text-xs font-normal text-[var(--ink-muted)]">ms</span>
              </div>
              <div className="text-[10px] text-[var(--ink-muted)] mt-0.5">CT − AT</div>
            </div>

            <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-3">
              <div className="text-[10.5px] uppercase font-bold text-[var(--ink-muted)]">Avg Waiting</div>
              <div className="text-lg font-bold text-[var(--div-m2)] mt-0.5">
                {result.avgWaiting} <span className="text-xs font-normal text-[var(--ink-muted)]">ms</span>
              </div>
              <div className="text-[10px] text-[var(--ink-muted)] mt-0.5">TAT − BT</div>
            </div>

            <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-3">
              <div className="text-[10.5px] uppercase font-bold text-[var(--ink-muted)]">Avg Response</div>
              <div className="text-lg font-bold text-[var(--div-m4)] mt-0.5">
                {result.avgResponse} <span className="text-xs font-normal text-[var(--ink-muted)]">ms</span>
              </div>
              <div className="text-[10px] text-[var(--ink-muted)] mt-0.5">FirstStart − AT</div>
            </div>

            <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-3">
              <div className="text-[10.5px] uppercase font-bold text-[var(--ink-muted)]">CPU Utilization</div>
              <div className="text-lg font-bold text-[var(--div-standing)] mt-0.5">
                {result.cpuUtilization}%
              </div>
              <div className="text-[10px] text-[var(--ink-muted)] mt-0.5">ΣBT / Makespan</div>
            </div>

            <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-3">
              <div className="text-[10.5px] uppercase font-bold text-[var(--ink-muted)]">Makespan / CS</div>
              <div className="text-lg font-bold text-[var(--ink-primary)] mt-0.5">
                {result.totalTime} <span className="text-xs font-normal text-[var(--ink-muted)]">ms</span>
              </div>
              <div className="text-[10px] text-[var(--ink-muted)] mt-0.5">
                {result.totalCsCount} CS ({result.totalCsTime}ms)
              </div>
            </div>
          </div>

          {/* Interactive Timeline Cursor Scrubber & Transport Bar */}
          <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--rule-hairline)] pb-2.5">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[var(--ink-muted)]" />
                <span className="font-mono text-xs font-bold text-[var(--ink-primary)]">
                  Timeline Cursor:
                </span>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-[2px] bg-[var(--bg-recessed)] text-[var(--ink-primary)] tabular-nums">
                  t = {cursorTime} / {result.totalTime} ms
                </span>
              </div>

              {/* Status Readout at Cursor Time t */}
              <div className="font-mono text-xs flex items-center gap-2">
                {timeline.cpuState === 'PROCESS' && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] bg-emerald-100 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    RUNNING {timeline.runningProcessId} (Burst remaining:{' '}
                    {timeline.processStatuses.find((p) => p.id === timeline.runningProcessId)?.remainingBurst ?? 0} ms)
                  </span>
                )}
                {timeline.cpuState === 'CS' && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-200 border border-amber-300 dark:border-amber-700 font-bold">
                    <Activity className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                    DISPATCHER {timeline.csBlockLabel ?? 'CS'} (1ms PCB Switch Overhead)
                  </span>
                )}
                {timeline.cpuState === 'IDLE' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] bg-[var(--bg-recessed)] text-[var(--ink-secondary)] border border-[var(--rule-hairline)] font-medium">
                    CPU IDLE (Waiting for Arrival)
                  </span>
                )}
                {timeline.cpuState === 'COMPLETED' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] bg-blue-100 text-blue-900 dark:bg-blue-950/70 dark:text-blue-200 border border-blue-300 dark:border-blue-800 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    COMPLETED (Makespan {result.totalTime} ms reached)
                  </span>
                )}
              </div>
            </div>

            {/* Scrubber Controls */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className={`px-3 py-1 text-xs font-mono font-bold rounded-[2px] border inline-flex items-center gap-1.5 transition-colors ${
                  isPlaying
                    ? 'bg-amber-600 text-white border-amber-600 hover:bg-amber-700'
                    : 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)] hover:opacity-90'
                }`}
                title={isPlaying ? 'Pause timeline playback' : 'Play timeline forward'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {isPlaying ? 'Pause' : 'Play'}
              </button>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsPlaying(false);
                    setCursorTime(0);
                  }}
                  className="p-1 rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-sheet)] text-[var(--ink-secondary)] hover:bg-[var(--bg-recessed)]"
                  title="Jump to Start (0 ms)"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPlaying(false);
                    setCursorTime((t) => Math.max(0, t - 1));
                  }}
                  className="p-1 rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-sheet)] text-[var(--ink-secondary)] hover:bg-[var(--bg-recessed)]"
                  title="Step Backward (-1 ms)"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPlaying(false);
                    setCursorTime((t) => Math.min(result.totalTime, t + 1));
                  }}
                  className="p-1 rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-sheet)] text-[var(--ink-secondary)] hover:bg-[var(--bg-recessed)]"
                  title="Step Forward (+1 ms)"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Slider Scrubber */}
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={Math.max(1, result.totalTime)}
                  value={cursorTime}
                  onChange={(e) => {
                    setIsPlaying(false);
                    setCursorTime(Number(e.target.value));
                  }}
                  className="w-full accent-[var(--div-m2)] cursor-pointer h-2 bg-[var(--bg-recessed)] rounded-[2px]"
                />
              </div>

              {/* Playback speed toggle */}
              <div className="flex items-center gap-1 font-mono text-[11px]">
                <button
                  type="button"
                  onClick={() => setPlaySpeed(1)}
                  className={`px-1.5 py-0.5 rounded-[2px] border ${
                    playSpeed === 1
                      ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)]'
                      : 'border-[var(--rule-hairline)] bg-[var(--bg-sheet)] text-[var(--ink-secondary)]'
                  }`}
                >
                  1x
                </button>
                <button
                  type="button"
                  onClick={() => setPlaySpeed(2)}
                  className={`px-1.5 py-0.5 rounded-[2px] border ${
                    playSpeed === 2
                      ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)]'
                      : 'border-[var(--rule-hairline)] bg-[var(--bg-sheet)] text-[var(--ink-secondary)]'
                  }`}
                >
                  2x
                </button>
              </div>
            </div>

            {/* Ready Queue Readout at Cursor Time t */}
            <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs text-[var(--ink-secondary)]">
              <span className="font-semibold text-[var(--ink-primary)]">Ready Queue at t={cursorTime}:</span>
              {timeline.readyQueue.length === 0 ? (
                <span className="text-[var(--ink-muted)] italic">(Queue Empty — all arrived jobs running or finished)</span>
              ) : (
                <div className="flex items-center gap-1.5">
                  {timeline.readyQueue.map((pid) => (
                    <span
                      key={pid}
                      className="px-2 py-0.5 rounded-[2px] font-bold text-white text-[11px]"
                      style={{ backgroundColor: colorMap[pid] ?? 'var(--div-m2)' }}
                    >
                      {pid}
                    </span>
                  ))}
                </div>
              )}
              <span className="ml-auto text-[11px] text-[var(--ink-muted)]">
                CS count so far: <strong className="text-[var(--ink-primary)]">{timeline.csCountSoFar}</strong>
              </span>
            </div>
          </div>

          {/* Live Interactive Gantt Chart with Explicit CS[t1-t2] Blocks */}
          <div className="diagram-canvas-plate p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-mono text-xs font-bold text-[var(--ink-primary)] flex items-center gap-2">
                <span>Live Interactive Gantt Chart</span>
                <span className="px-1.5 py-0.5 text-[10px] rounded-[2px] bg-[var(--bg-recessed)] text-[var(--ink-secondary)]">
                  Click chart to scrub
                </span>
              </div>
              <div className="font-mono text-[11px] text-[var(--ink-muted)]">
                Total Time: <strong className="text-[var(--ink-primary)]">{result.totalTime} ms</strong> · Context Switches:{' '}
                <strong className="text-[var(--div-m2)]">{result.totalCsCount}</strong>
              </div>
            </div>

            {/* SVG Interactive Canvas */}
            <div className="overflow-x-auto">
              <svg
                ref={svgRef}
                viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
                className="w-full h-auto cursor-crosshair select-none"
                role="img"
                aria-label="CPU Scheduling Interactive Gantt Chart"
                onClick={handleSvgClick}
              >
                <defs>
                  {/* Amber Hazard Diagonal Pattern for Explicit Context Switches */}
                  <pattern
                    id="cs-diagonal-stripes"
                    width="8"
                    height="8"
                    patternUnits="userSpaceOnUse"
                    patternTransform="rotate(45)"
                  >
                    <rect width="4" height="8" fill="#d97706" />
                    <rect x="4" width="4" height="8" fill="#f59e0b" />
                  </pattern>

                  {/* IDLE Stipple Pattern */}
                  <pattern
                    id="idle-dots"
                    width="6"
                    height="6"
                    patternUnits="userSpaceOnUse"
                  >
                    <rect width="6" height="6" fill="var(--bg-sheet)" />
                    <circle cx="3" cy="3" r="0.8" fill="var(--rule-strong)" />
                  </pattern>
                </defs>

                {/* Base Plot Background Plate */}
                <rect
                  x={PLOT_X}
                  y={BAR_Y}
                  width={PLOT_WIDTH}
                  height={BAR_HEIGHT}
                  fill="var(--bg-sheet)"
                  stroke="var(--rule-hairline)"
                  strokeWidth="1"
                />

                {/* Gantt Segments */}
                {result.gantt.map((seg, i) => {
                  const startPct = seg.start / ganttTotal;
                  const endPct = seg.end / ganttTotal;
                  const x = PLOT_X + startPct * PLOT_WIDTH;
                  const w = Math.max(1.5, (endPct - startPct) * PLOT_WIDTH);

                  const isCs = seg.kind === 'cs';
                  const isIdle = seg.kind === 'idle';

                  const fill = isCs
                    ? 'url(#cs-diagonal-stripes)'
                    : isIdle
                      ? 'url(#idle-dots)'
                      : colorMap[seg.label] ?? 'var(--div-m2)';

                  const stroke = isCs ? '#b45309' : 'var(--bg-paper)';
                  const strokeWidth = isCs ? '1.5' : '1';

                  const labelText = isCs
                    ? `CS[${seg.start}-${seg.end}]`
                    : seg.label;

                  return (
                    <g key={`${seg.label}-${seg.start}-${seg.end}-${i}`}>
                      <title>
                        {isCs
                          ? `Explicit Context Switch: CS[${seg.start}-${seg.end}] (Duration: ${seg.end - seg.start}ms)`
                          : isIdle
                            ? `CPU Idle: [${seg.start}-${seg.end}]`
                            : `Process ${seg.label}: [${seg.start}-${seg.end}] (${seg.end - seg.start}ms)`}
                      </title>

                      <rect
                        x={x}
                        y={BAR_Y}
                        width={w}
                        height={BAR_HEIGHT}
                        fill={fill}
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                        opacity={
                          timeline.activeSegment &&
                          timeline.activeSegment.start === seg.start &&
                          timeline.activeSegment.end === seg.end
                            ? 1
                            : 0.92
                        }
                      />

                      {/* Explicit Text Label */}
                      {isCs ? (
                        // CS Segment Label
                        w >= 48 ? (
                          <text
                            x={x + w / 2}
                            y={BAR_Y + 25}
                            textAnchor="middle"
                            fontSize="9"
                            fontWeight="800"
                            fill="#1c1917"
                            stroke="#ffffff"
                            strokeWidth="1.5"
                            paintOrder="stroke"
                          >
                            {labelText}
                          </text>
                        ) : w >= 16 ? (
                          <text
                            x={x + w / 2}
                            y={BAR_Y + 25}
                            textAnchor="middle"
                            fontSize="8"
                            fontWeight="800"
                            fill="#1c1917"
                            stroke="#ffffff"
                            strokeWidth="1.5"
                            paintOrder="stroke"
                          >
                            CS
                          </text>
                        ) : null
                      ) : (
                        // Process / Idle Segment Label
                        w >= 18 && (
                          <text
                            x={x + w / 2}
                            y={BAR_Y + 25}
                            textAnchor="middle"
                            fontSize={w >= 40 ? '11' : '9'}
                            fontWeight="700"
                            fill={isIdle ? 'var(--ink-secondary)' : '#ffffff'}
                          >
                            {labelText}
                          </text>
                        )
                      )}

                      {/* Start Tick Marker */}
                      {(i === 0 || w >= 22) && (
                        <text
                          x={x}
                          y={BAR_Y + BAR_HEIGHT + 14}
                          textAnchor="middle"
                          fontSize="8.5"
                          fontFamily="var(--font-mono)"
                          fill="var(--ink-muted)"
                        >
                          {seg.start}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Final End Time Tick */}
                <text
                  x={PLOT_X + PLOT_WIDTH}
                  y={BAR_Y + BAR_HEIGHT + 14}
                  textAnchor="middle"
                  fontSize="8.5"
                  fontWeight="700"
                  fontFamily="var(--font-mono)"
                  fill="var(--ink-primary)"
                >
                  {result.totalTime}
                </text>

                {/* Vertical Interactive Timeline Cursor Line */}
                <line
                  x1={cursorX}
                  y1={BAR_Y - 8}
                  x2={cursorX}
                  y2={BAR_Y + BAR_HEIGHT + 4}
                  stroke="#ef4444"
                  strokeWidth="2.2"
                  strokeDasharray="4 2"
                />

                {/* Cursor Indicator Triangle */}
                <polygon
                  points={`${cursorX - 4.5},${BAR_Y - 9} ${cursorX + 4.5},${BAR_Y - 9} ${cursorX},${BAR_Y - 2}`}
                  fill="#ef4444"
                />

                {/* Cursor Time Flag Badge */}
                <rect
                  x={Math.max(PLOT_X, Math.min(PLOT_X + PLOT_WIDTH - 44, cursorX - 22))}
                  y={2}
                  width="44"
                  height="12"
                  rx="2"
                  fill="#ef4444"
                />
                <text
                  x={Math.max(PLOT_X + 22, Math.min(PLOT_X + PLOT_WIDTH - 22, cursorX))}
                  y={11}
                  textAnchor="middle"
                  fontSize="8"
                  fontWeight="800"
                  fontFamily="var(--font-mono)"
                  fill="#ffffff"
                >
                  {cursorTime} ms
                </text>
              </svg>
            </div>

            {/* Explicit Context-Switch Overhead (CS[t1-t2]) Breakdown Strip */}
            <div className="bg-[var(--bg-paper)] border border-amber-300 dark:border-amber-900/60 rounded-[2px] p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-[var(--ink-primary)]">
                <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                  <Activity className="w-3.5 h-3.5" />
                  Explicit 1ms Context-Switch Overhead Blocks (CS[t1-t2])
                </span>
                <span className="text-[11px] font-normal text-[var(--ink-muted)]">
                  Total Overhead = {result.totalCsTime} ms ({result.totalCsCount} switches)
                </span>
              </div>

              {csSegments.length === 0 ? (
                <div className="font-mono text-xs text-[var(--ink-muted)]">
                  Zero context-switch overhead configured (idealized execution with instantaneous dispatch).
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-1.5">
                  {csSegments.map((cs, idx) => {
                    const label = formatGanttSegmentLabel(cs);
                    const isActive = cursorTime >= cs.start && cursorTime <= cs.end;
                    return (
                      <button
                        key={`${label}-${idx}`}
                        type="button"
                        onClick={() => {
                          setIsPlaying(false);
                          setCursorTime(cs.start);
                        }}
                        className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded-[2px] border transition-colors inline-flex items-center gap-1 ${
                          isActive
                            ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800 hover:bg-amber-100'
                        }`}
                        title={`Click to jump timeline cursor to ${label}`}
                      >
                        <span>{label}</span>
                        <span className="text-[9px] opacity-75">1ms</span>
                      </button>
                    );
                  })}
                </div>
              )}

              <p className="font-mono text-[11px] text-[var(--ink-muted)] leading-relaxed">
                As tested in <strong className="text-[var(--ink-primary)]">C1 Set 2-2 Q5</strong>, each preemption/dispatch across differing processes incurs an explicit 1 ms CS block. During this time, the CPU is occupied saving registers and restoring the incoming process PCB.
              </p>
            </div>
          </div>

          {/* Process Metrics Table (CT, TAT, WT, RT, CPU Utilization) */}
          <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] overflow-hidden">
            <div className="px-3.5 py-2.5 bg-[var(--bg-board)] border-b border-[var(--rule-hairline)] flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-[var(--ink-primary)]">
                Process Metrics Table &amp; Analytical Verification
              </span>
              <span className="font-mono text-[11px] text-[var(--ink-muted)]">
                Lower priority number = Higher priority
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-xs tabular-nums">
                <thead>
                  <tr className="bg-[var(--bg-recessed)] border-b border-[var(--rule-strong)] text-[var(--ink-primary)]">
                    <th className="px-3 py-2">PID</th>
                    <th className="px-2.5 py-2">AT (ms)</th>
                    <th className="px-2.5 py-2">BT (ms)</th>
                    <th className="px-2.5 py-2">Priority</th>
                    <th className="px-2.5 py-2 font-bold">CT (ms)</th>
                    <th className="px-2.5 py-2 font-bold">TAT (ms)</th>
                    <th className="px-2.5 py-2 font-bold text-[var(--div-m2)]">WT (ms)</th>
                    <th className="px-2.5 py-2 font-bold text-[var(--div-m4)]">RT (ms)</th>
                    <th className="px-3 py-2">Status @ t={cursorTime}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--rule-hairline)]">
                  {processes.map((row) => {
                    const m = result.processes.find((p) => p.id === row.id);
                    const pStatus = timeline.processStatuses.find((p) => p.id === row.id);
                    const isRunning = pStatus?.status === 'RUNNING';

                    return (
                      <tr
                        key={row.id}
                        className={`transition-colors ${
                          isRunning
                            ? 'bg-amber-50/80 dark:bg-amber-950/30 font-semibold'
                            : 'hover:bg-[var(--bg-recessed)]/40'
                        }`}
                      >
                        <td className="px-3 py-2 font-bold flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block"
                            style={{ backgroundColor: colorMap[row.id] ?? 'var(--div-m2)' }}
                          />
                          {row.id}
                        </td>
                        <td className="px-2.5 py-2">{row.arrival}</td>
                        <td className="px-2.5 py-2">{row.burst}</td>
                        <td className="px-2.5 py-2">{row.priority}</td>
                        <td className="px-2.5 py-2 font-bold text-[var(--ink-primary)]">
                          {m?.completion ?? '—'}
                        </td>
                        <td className="px-2.5 py-2 font-bold">{m?.turnaround ?? '—'}</td>
                        <td className="px-2.5 py-2 font-bold text-[var(--div-m2)]">{m?.waiting ?? '—'}</td>
                        <td className="px-2.5 py-2 font-bold text-[var(--div-m4)]">{m?.response ?? '—'}</td>
                        <td className="px-3 py-2 text-[11px]">
                          {pStatus?.status === 'NOT_ARRIVED' && (
                            <span className="text-[var(--ink-muted)]">Arrives at t={row.arrival}ms</span>
                          )}
                          {pStatus?.status === 'READY' && (
                            <span className="px-1.5 py-0.5 rounded-[2px] bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200">
                              Ready (Rem: {pStatus.remainingBurst}ms)
                            </span>
                          )}
                          {pStatus?.status === 'RUNNING' && (
                            <span className="px-1.5 py-0.5 rounded-[2px] bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 font-bold animate-pulse">
                              Running (Rem: {pStatus.remainingBurst}ms)
                            </span>
                          )}
                          {pStatus?.status === 'COMPLETED' && (
                            <span className="px-1.5 py-0.5 rounded-[2px] bg-[var(--bg-recessed)] text-[var(--ink-secondary)]">
                              Finished @ t={m?.completion}ms
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-[var(--bg-sheet)] border-t-2 border-[var(--rule-strong)] font-bold text-[var(--ink-primary)]">
                    <td className="px-3 py-2" colSpan={4}>
                      Averages (N = {processes.length} Processes)
                    </td>
                    <td className="px-2.5 py-2">—</td>
                    <td className="px-2.5 py-2 text-[var(--ink-primary)]">{result.avgTurnaround} ms</td>
                    <td className="px-2.5 py-2 text-[var(--div-m2)]">{result.avgWaiting} ms</td>
                    <td className="px-2.5 py-2 text-[var(--div-m4)]">{result.avgResponse} ms</td>
                    <td className="px-3 py-2 text-[var(--div-standing)] font-bold">
                      {result.cpuUtilization}% Util
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Conservation of Time Formula Sanity Proof */}
            <div className="p-3 bg-[var(--bg-sheet)] border-t border-[var(--rule-hairline)] font-mono text-xs space-y-1.5">
              <div className="flex flex-wrap items-center justify-between text-[var(--ink-primary)]">
                <span className="font-bold">Conservation of Execution Time:</span>
                <span className="text-[var(--ink-secondary)]">
                  Total Makespan = ΣBurst ({result.totalBurst}ms) + ΣCS ({result.totalCsTime}ms) + ΣIdle ({result.totalIdleTime}ms) ={' '}
                  <strong className="text-[var(--ink-primary)]">{result.totalTime} ms</strong>
                </span>
              </div>
              <div className="text-[11px] text-[var(--ink-muted)]">
                CPU Utilization = (Total Process Burst / Total Makespan) × 100% = ({result.totalBurst} / {result.totalTime}) × 100% ={' '}
                <strong className="text-[var(--div-standing)]">{result.cpuUtilization}%</strong>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT 5 COLUMNS: Presets, Algorithm Picker, Parameter Workbench           */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 space-y-5">
          {/* 1-Click Real Exam Presets */}
          <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--rule-hairline)] pb-2">
              <span className="font-mono text-xs font-bold text-[var(--ink-primary)] flex items-center gap-1.5">
                <BookmarkCheck className="w-4 h-4 text-[var(--div-m2)]" />
                1-Click Real Exam Presets
              </span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-[2px] bg-[var(--bg-recessed)] text-[var(--ink-secondary)]">
                Official VIT Papers
              </span>
            </div>

            <div className="space-y-2">
              {CPU_SCHEDULER_PRESETS.map((preset) => {
                const isSelected = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => loadPreset(preset.id)}
                    className={`w-full text-left p-2.5 rounded-[2px] border transition-all ${
                      isSelected
                        ? 'bg-[var(--bg-recessed)] border-[var(--ink-primary)] shadow-sm'
                        : 'bg-[var(--bg-paper)] border-[var(--rule-hairline)] hover:bg-[var(--bg-sheet)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-[var(--ink-primary)]">
                        {preset.label}
                      </span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-[2px] bg-[var(--div-m2)] text-white font-semibold">
                        {preset.algorithm}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-1 font-mono text-[10.5px] text-[var(--ink-muted)]">
                      <span>{preset.source}</span>
                      <span>
                        {preset.processes.length} Procs {preset.csOverhead > 0 && `· ${preset.csOverhead}ms CS`}
                        {preset.algorithm === 'RR' && `· q=${preset.quantum}`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Algorithm Picker & Dispatcher Parameters */}
          <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-4 space-y-3.5">
            <div className="flex items-center justify-between border-b border-[var(--rule-hairline)] pb-2">
              <span className="font-mono text-xs font-bold text-[var(--ink-primary)] flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-[var(--div-m2)]" />
                Algorithm &amp; Dispatcher Settings
              </span>
              <span className="font-mono text-[11px] text-[var(--ink-muted)]">
                Active: <strong className="text-[var(--ink-primary)]">{activeAlgoMeta.label}</strong>
              </span>
            </div>

            {/* Algorithm Grid */}
            <div className="grid grid-cols-2 gap-1.5">
              {ALGOS.map((algo) => {
                const isActive = algorithm === algo.id;
                return (
                  <button
                    key={algo.id}
                    type="button"
                    onClick={() => {
                      setAlgorithm(algo.id);
                      setCursorTime(0);
                    }}
                    className={`p-2 text-left rounded-[2px] border font-mono transition-colors ${
                      isActive
                        ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)] font-bold'
                        : 'bg-[var(--bg-sheet)] text-[var(--ink-secondary)] border-[var(--rule-hairline)] hover:bg-[var(--bg-recessed)]'
                    }`}
                  >
                    <div className="text-xs leading-tight">{algo.label}</div>
                    <div className="text-[9.5px] opacity-75 mt-0.5">{algo.badge}</div>
                  </button>
                );
              })}
            </div>

            {/* Dynamic Algorithm Description Note */}
            <div className="p-2.5 rounded-[2px] bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] font-mono text-[11px] text-[var(--ink-secondary)] leading-relaxed">
              <div className="flex items-center gap-1 font-bold text-[var(--ink-primary)] mb-0.5">
                <Info className="w-3.5 h-3.5 text-[var(--div-m2)]" />
                Scheduling Rule:
              </div>
              {activeAlgoMeta.description}
            </div>

            {/* Round Robin Quantum Slider */}
            {algorithm === 'RR' && (
              <div className="p-3 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px] space-y-2">
                <div className="flex items-center justify-between font-mono text-xs">
                  <label htmlFor="quantum-input" className="font-bold text-[var(--ink-primary)]">
                    Round Robin Quantum (q):
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      id="quantum-input"
                      type="number"
                      min={1}
                      max={50}
                      value={quantum}
                      onChange={(e) => {
                        setQuantum(Math.max(1, Number(e.target.value) || 1));
                        setCursorTime(0);
                      }}
                      className="w-14 px-1.5 py-0.5 font-mono text-xs rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-paper)] tabular-nums text-right font-bold"
                    />
                    <span className="text-[var(--ink-muted)]">ms</span>
                  </div>
                </div>

                <input
                  type="range"
                  min={1}
                  max={50}
                  value={quantum}
                  onChange={(e) => {
                    setQuantum(Number(e.target.value));
                    setCursorTime(0);
                  }}
                  className="w-full accent-[var(--div-m2)] cursor-pointer h-2 bg-[var(--bg-recessed)] rounded-[2px]"
                />

                <div className="flex items-center gap-1.5 font-mono text-[10.5px]">
                  <span className="text-[var(--ink-muted)]">Quick:</span>
                  {[2, 4, 10, 20].map((qVal) => (
                    <button
                      key={qVal}
                      type="button"
                      onClick={() => {
                        setQuantum(qVal);
                        setCursorTime(0);
                      }}
                      className={`px-2 py-0.5 rounded-[2px] border ${
                        quantum === qVal
                          ? 'bg-[var(--div-m2)] text-white border-[var(--div-m2)] font-bold'
                          : 'border-[var(--rule-hairline)] bg-[var(--bg-paper)] text-[var(--ink-secondary)]'
                      }`}
                    >
                      q={qVal}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Explicit Context-Switch Overhead Control */}
            <div className="p-3 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px] space-y-2">
              <div className="flex items-center justify-between font-mono text-xs">
                <label htmlFor="cs-overhead-input" className="font-bold text-[var(--ink-primary)] flex items-center gap-1">
                  Context-Switch Overhead:
                  <span className="text-[10px] font-normal text-[var(--ink-muted)]">(CS[t1-t2])</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="cs-overhead-input"
                    type="number"
                    min={0}
                    max={10}
                    value={csOverhead}
                    onChange={(e) => {
                      setCsOverhead(Math.max(0, Number(e.target.value) || 0));
                      setCursorTime(0);
                    }}
                    className="w-14 px-1.5 py-0.5 font-mono text-xs rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-paper)] tabular-nums text-right font-bold"
                  />
                  <span className="text-[var(--ink-muted)]">ms</span>
                </div>
              </div>

              <input
                type="range"
                min={0}
                max={5}
                value={csOverhead}
                onChange={(e) => {
                  setCsOverhead(Number(e.target.value));
                  setCursorTime(0);
                }}
                className="w-full accent-amber-600 cursor-pointer h-2 bg-[var(--bg-recessed)] rounded-[2px]"
              />

              <div className="flex items-center gap-1.5 font-mono text-[10.5px]">
                <span className="text-[var(--ink-muted)]">Presets:</span>
                {[
                  { label: '0 ms (Ideal)', val: 0 },
                  { label: '1 ms (C1 Exam Standard)', val: 1 },
                  { label: '2 ms', val: 2 },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => {
                      setCsOverhead(item.val);
                      setCursorTime(0);
                    }}
                    className={`px-2 py-0.5 rounded-[2px] border ${
                      csOverhead === item.val
                        ? 'bg-amber-600 text-white border-amber-600 font-bold'
                        : 'border-[var(--rule-hairline)] bg-[var(--bg-paper)] text-[var(--ink-secondary)]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Parameter Input Workbench (Arrival, Burst, Priority) */}
          <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--rule-hairline)] pb-2">
              <span className="font-mono text-xs font-bold text-[var(--ink-primary)] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[var(--div-m2)]" />
                Parameter Input Workbench
              </span>
              <button
                type="button"
                onClick={addProcess}
                className="px-2.5 py-1 text-xs font-mono font-semibold rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-paper)] text-[var(--ink-primary)] inline-flex items-center gap-1 hover:bg-[var(--bg-recessed)] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Process
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-xs tabular-nums">
                <thead>
                  <tr className="bg-[var(--bg-recessed)] border-b border-[var(--rule-strong)] text-[var(--ink-primary)]">
                    <th className="px-2 py-1.5">PID</th>
                    <th className="px-2 py-1.5">Arrival (AT)</th>
                    <th className="px-2 py-1.5">Burst (BT)</th>
                    <th className="px-2 py-1.5">Priority</th>
                    <th className="px-2 py-1.5 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--rule-hairline)]">
                  {processes.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[var(--bg-sheet)]">
                      <td className="px-2 py-1.5 font-bold flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: colorMap[row.id] ?? 'var(--div-m2)' }}
                        />
                        <input
                          type="text"
                          value={row.id}
                          onChange={(e) => updateRow(idx, 'id', e.target.value)}
                          className="w-12 px-1 py-0.5 rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-sheet)] font-bold text-[var(--ink-primary)]"
                        />
                      </td>

                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          min={0}
                          value={row.arrival}
                          onChange={(e) => updateRow(idx, 'arrival', e.target.value)}
                          className="w-16 px-1.5 py-0.5 rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-sheet)] tabular-nums"
                        />
                      </td>

                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          min={1}
                          value={row.burst}
                          onChange={(e) => updateRow(idx, 'burst', e.target.value)}
                          className="w-16 px-1.5 py-0.5 rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-sheet)] tabular-nums font-bold"
                        />
                      </td>

                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          min={1}
                          value={row.priority}
                          onChange={(e) => updateRow(idx, 'priority', e.target.value)}
                          className="w-16 px-1.5 py-0.5 rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-sheet)] tabular-nums"
                        />
                      </td>

                      <td className="px-2 py-1.5 text-right">
                        {processes.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeProcess(idx)}
                            className="p-1 text-[var(--ink-muted)] hover:text-red-600 transition-colors"
                            aria-label={`Remove ${row.id}`}
                            title={`Delete process ${row.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="font-mono text-[11px] text-[var(--ink-muted)] pt-1">
              * Priority: 1 represents the highest priority. Total processes currently configured: {processes.length}.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
