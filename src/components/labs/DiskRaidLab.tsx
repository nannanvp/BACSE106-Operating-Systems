import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Database,
  Gauge,
  HardDrive,
  Info,
  Layers,
  Pause,
  Play,
  Plus,
  ShieldCheck,
  Shuffle,
  Sparkles,
} from 'lucide-react';
import {
  DISK_PRESETS,
  DiskAlgorithm,
  DiskDirection,
  DiskPreset,
  RaidLevel,
  calculateRotationalLatency,
  compareDiskAlgorithms,
  evaluateRaidLevel,
  runDiskSchedule,
} from '../../utils/diskRaidEngine';

const DISK_ALGOS: Array<{ id: DiskAlgorithm; label: string; desc: string }> = [
  { id: 'LOOK', label: 'LOOK', desc: 'Reverses at last pending request (no edge travel)' },
  { id: 'C-LOOK', label: 'C-LOOK', desc: 'Circular LOOK: fast non-servicing return to lowest request' },
  { id: 'SSTF', label: 'SSTF', desc: 'Shortest Seek Time First: greedy local minimum (starvation risk)' },
  { id: 'SCAN', label: 'SCAN', desc: 'Elevator: travels to platter boundary (0 or max) then reverses' },
  { id: 'FCFS', label: 'FCFS', desc: 'First-Come First-Served: strictly in order, zero starvation' },
  { id: 'C-SCAN', label: 'C-SCAN', desc: 'Circular SCAN: travels to boundary, wraps to opposite boundary' },
];

const RAID_LEVELS: Array<{ id: RaidLevel; label: string; title: string }> = [
  { id: 'RAID0', label: 'RAID 0', title: 'Striping (No Redundancy)' },
  { id: 'RAID1', label: 'RAID 1', title: 'Mirroring (50% Overhead)' },
  { id: 'RAID5', label: 'RAID 5', title: 'Single Distributed Parity' },
  { id: 'RAID6', label: 'RAID 6', title: 'Dual P+Q Distributed Parity' },
  { id: 'RAID10', label: 'RAID 10', title: 'Stripe of Mirrors' },
];

const RPM_PRESETS = [
  { rpm: 3600, label: '3600 RPM (Legacy)' },
  { rpm: 5400, label: '5400 RPM (Laptop 2.5")' },
  { rpm: 6000, label: '6000 RPM (C1 Set 1-2 Q9 FAT)' },
  { rpm: 7200, label: '7200 RPM (Desktop 3.5")' },
  { rpm: 10000, label: '10000 RPM (Enterprise)' },
  { rpm: 15000, label: '15000 RPM (SAS Server)' },
];

export const DiskRaidLab: React.FC = () => {
  const [presetIdx, setPresetIdx] = useState<number>(0);
  const activePreset: DiskPreset = DISK_PRESETS[presetIdx] || DISK_PRESETS[0];

  // Head and queue configuration
  const [algorithm, setAlgorithm] = useState<DiskAlgorithm>(activePreset.defaultAlgorithm);
  const [direction, setDirection] = useState<DiskDirection>(activePreset.input.direction);
  const [initialHead, setInitialHead] = useState<number>(activePreset.input.initialHead);
  const [minTrack, setMinTrack] = useState<number>(activePreset.input.minTrack);
  const [maxTrack, setMaxTrack] = useState<number>(activePreset.input.maxTrack);
  const [requestsInput, setRequestsInput] = useState<string>(activePreset.input.requests.join(', '));
  const [rpm, setRpm] = useState<number>(activePreset.input.rpm ?? 7200);
  const [msPerTrack, setMsPerTrack] = useState<number>(activePreset.input.msPerTrack ?? 1);
  const [newTrackInput, setNewTrackInput] = useState<string>('');
  const [showExamDetails, setShowExamDetails] = useState<boolean>(true);

  // Playback / Step cursor state for Seek Trajectory Graph
  const [playbackStep, setPlaybackStep] = useState<number>(-1); // -1 = show all
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const playTimerRef = useRef<number | null>(null);

  // RAID Calculator state
  const [raidLevel, setRaidLevel] = useState<RaidLevel>('RAID6');
  const [numDisks, setNumDisks] = useState<number>(6);
  const [diskCapTB, setDiskCapTB] = useState<number>(2);

  // Parse requests safely
  const parsedRequests = useMemo(() => {
    return requestsInput
      .split(/[\s,]+/)
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n));
  }, [requestsInput]);

  // Out of bounds requests
  const outOfBoundsRequests = useMemo(() => {
    return parsedRequests.filter((r) => r < minTrack || r > maxTrack);
  }, [parsedRequests, minTrack, maxTrack]);

  // Valid requests in track range
  const validRequests = useMemo(() => {
    return parsedRequests.filter((r) => r >= minTrack && r <= maxTrack);
  }, [parsedRequests, minTrack, maxTrack]);

  // Run the disk schedule engine
  const diskResult = useMemo(() => {
    return runDiskSchedule({
      algorithm,
      minTrack,
      maxTrack,
      initialHead,
      direction,
      requests: validRequests,
      msPerTrack,
      rpm,
    });
  }, [algorithm, minTrack, maxTrack, initialHead, direction, validRequests, msPerTrack, rpm]);

  // Algorithm comparison ranking
  const comparisonResults = useMemo(() => {
    return compareDiskAlgorithms({
      minTrack,
      maxTrack,
      initialHead,
      direction,
      requests: validRequests,
      msPerTrack,
      rpm,
    });
  }, [minTrack, maxTrack, initialHead, direction, validRequests, msPerTrack, rpm]);

  // Rotational latency calculator details
  const rotationalDetails = useMemo(() => {
    return calculateRotationalLatency(rpm);
  }, [rpm]);

  // RAID evaluation
  const raidResult = useMemo(() => {
    return evaluateRaidLevel(raidLevel, numDisks, diskCapTB);
  }, [raidLevel, numDisks, diskCapTB]);

  // Load a preset
  const loadPreset = (idx: number) => {
    const p = DISK_PRESETS[idx];
    if (!p) return;
    setPresetIdx(idx);
    setAlgorithm(p.defaultAlgorithm);
    setDirection(p.input.direction);
    setInitialHead(p.input.initialHead);
    setMinTrack(p.input.minTrack);
    setMaxTrack(p.input.maxTrack);
    setRequestsInput(p.input.requests.join(', '));
    setRpm(p.input.rpm ?? 6000);
    setMsPerTrack(p.input.msPerTrack ?? 1);
    setPlaybackStep(-1);
    setIsPlaying(false);
  };

  // Step playback handling
  const stopPlayback = useCallback(() => {
    if (playTimerRef.current !== null) {
      window.clearInterval(playTimerRef.current);
      playTimerRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const startPlayback = useCallback(() => {
    stopPlayback();
    setIsPlaying(true);
    setPlaybackStep((prev) => {
      if (prev >= diskResult.sequence.length - 1 || prev < 0) return 0;
      return prev;
    });

    playTimerRef.current = window.setInterval(() => {
      setPlaybackStep((curr) => {
        if (curr >= diskResult.sequence.length - 1) {
          stopPlayback();
          return diskResult.sequence.length - 1;
        }
        return curr + 1;
      });
    }, 450);
  }, [diskResult.sequence.length, stopPlayback]);

  useEffect(() => {
    return () => {
      if (playTimerRef.current !== null) {
        window.clearInterval(playTimerRef.current);
      }
    };
  }, []);

  // Track manipulation helpers
  const removeRequest = (index: number) => {
    const updated = [...parsedRequests];
    updated.splice(index, 1);
    setRequestsInput(updated.join(', '));
  };

  const addTrack = () => {
    const val = Number(newTrackInput.trim());
    if (Number.isFinite(val)) {
      setRequestsInput((prev) => (prev.trim() ? `${prev.trim()}, ${val}` : `${val}`));
      setNewTrackInput('');
    }
  };

  const sortRequestsAscending = () => {
    const sorted = [...parsedRequests].sort((a, b) => a - b);
    setRequestsInput(sorted.join(', '));
  };

  const reverseRequests = () => {
    const reversed = [...parsedRequests].reverse();
    setRequestsInput(reversed.join(', '));
  };

  const shuffleRequests = () => {
    const shuffled = [...parsedRequests].sort(() => Math.random() - 0.5);
    setRequestsInput(shuffled.join(', '));
  };

  // SVG coordinate mapping
  const trackSpan = Math.max(1, maxTrack - minTrack);
  const xForTrack = (t: number) => 36 + ((t - minTrack) / trackSpan) * 628;

  // Active sequence for playback cursor
  const visibleSequence =
    playbackStep >= 0 ? diskResult.sequence.slice(0, playbackStep + 1) : diskResult.sequence;
  const currentHeadPos =
    playbackStep >= 0
      ? diskResult.sequence[playbackStep]
      : diskResult.sequence[diskResult.sequence.length - 1] ?? initialHead;

  // RAID quick scenarios
  const applyRaidScenario = (scenario: 'university' | 'video') => {
    if (scenario === 'university') {
      setRaidLevel('RAID6');
      setNumDisks(6);
      setDiskCapTB(2);
    } else {
      setRaidLevel('RAID0');
      setNumDisks(4);
      setDiskCapTB(2);
    }
  };

  return (
    <div className="space-y-4">
      {/* Real Exam Presets Top Bar */}
      <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-bold text-[var(--ink-secondary)] flex items-center gap-1.5 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[var(--div-m2)]" />
            Exam Presets:
          </span>
          {DISK_PRESETS.map((p, idx) => (
            <button
              key={p.id}
              type="button"
              onClick={() => loadPreset(idx)}
              className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-[2px] border transition-colors ${
                presetIdx === idx
                  ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)] shadow-xs'
                  : 'bg-[var(--bg-sheet)] text-[var(--ink-secondary)] border-[var(--rule-hairline)] hover:bg-[var(--bg-recessed)]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowExamDetails((prev) => !prev)}
          className="text-xs font-mono font-semibold text-[var(--ink-muted)] hover:text-[var(--ink-primary)] flex items-center gap-1"
        >
          <Info className="w-3.5 h-3.5" />
          {showExamDetails ? 'Hide Exam Note' : 'Show Exam Note'}
        </button>
      </div>

      {/* Exam Details Callout */}
      {showExamDetails && activePreset.examQuestion && (
        <div className="bg-[var(--bg-sheet)] border-l-4 border-[var(--div-m5)] p-3 text-xs rounded-r-[2px] space-y-1.5 font-mono">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-bold text-[var(--div-m5)]">{activePreset.source}</span>
            <span className="text-[var(--ink-muted)]">Benchmark Preset: {activePreset.defaultAlgorithm}</span>
          </div>
          <div className="text-[var(--ink-primary)] leading-relaxed">
            <strong>Problem Statement:</strong> {activePreset.examQuestion}
          </div>
          {activePreset.solutionNotes && (
            <div className="text-[var(--ink-secondary)] text-[11px] pt-1 border-t border-[var(--rule-hairline)]">
              <strong>Forensic Derivation:</strong> {activePreset.solutionNotes}
            </div>
          )}
        </div>
      )}

      {/* Strict 7:5 Asymmetric Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* =========================================================================
            LEFT 7 COLUMNS: Visual Cylinder Track Seek Graph, KPIs, Rotational Latency, RAID
            ========================================================================= */}
        <div className="lg:col-span-7 space-y-4">
          {/* Visual Cylinder Track Seek Graph */}
          <div className="diagram-canvas-plate p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--rule-hairline)] pb-2.5">
              <div>
                <h3 className="text-sm font-bold text-[var(--ink-primary)] flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-[var(--div-m5)]" />
                  Cylinder Track Seek Trajectory
                  <span className="font-mono text-xs font-normal text-[var(--ink-muted)]">
                    ({minTrack}–{maxTrack} cylinders)
                  </span>
                </h3>
                <div className="font-mono text-[11px] text-[var(--ink-muted)]">
                  Algorithm: <strong>{algorithm}</strong> · Head Start: <strong>{initialHead}</strong> · Direction: <strong>{direction.toUpperCase()}</strong>
                </div>
              </div>

              {/* Playback & Scrubber Controls */}
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <button
                  type="button"
                  onClick={isPlaying ? stopPlayback : startPlayback}
                  className={`px-2.5 py-1 rounded-[2px] font-semibold flex items-center gap-1 border ${
                    isPlaying
                      ? 'bg-[var(--div-danger)] text-white border-[var(--div-danger)]'
                      : 'bg-[var(--div-m3)] text-white border-[var(--div-m3)]'
                  }`}
                  title={isPlaying ? 'Pause Arm Motion' : 'Play Head Seek Sequence'}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {isPlaying ? 'Pause' : 'Animate'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    stopPlayback();
                    setPlaybackStep((prev) => Math.max(0, (prev < 0 ? diskResult.sequence.length - 1 : prev) - 1));
                  }}
                  disabled={playbackStep === 0}
                  className="p-1 rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-sheet)] text-[var(--ink-primary)] disabled:opacity-40"
                  title="Previous Step"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <span className="px-1.5 py-0.5 text-[11px] text-[var(--ink-secondary)] tabular-nums">
                  {playbackStep < 0 ? 'All' : `${playbackStep + 1}/${diskResult.sequence.length}`}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    stopPlayback();
                    setPlaybackStep((prev) =>
                      prev < 0 ? 0 : Math.min(diskResult.sequence.length - 1, prev + 1)
                    );
                  }}
                  disabled={playbackStep >= diskResult.sequence.length - 1}
                  className="p-1 rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-sheet)] text-[var(--ink-primary)] disabled:opacity-40"
                  title="Next Step"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    stopPlayback();
                    setPlaybackStep(-1);
                  }}
                  className="px-2 py-1 text-[11px] rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-sheet)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                  title="Show Complete Trajectory"
                >
                  Show All
                </button>
              </div>
            </div>

            {/* SVG Visual Graph */}
            <div className="overflow-x-auto">
              <div className="min-w-[620px]">
                <svg
                  viewBox={`0 0 700 ${Math.max(180, 56 + diskResult.sequence.length * 24)}`}
                  className="w-full h-auto select-none"
                  role="img"
                  aria-label="Disk head seek trajectory diagram"
                >
                  {/* Cylinder Axis Baseline */}
                  <line x1="36" y1="30" x2="664" y2="30" stroke="var(--rule-strong)" strokeWidth="2" />

                  {/* Axis Ticks & Numerical Labels */}
                  {[
                    minTrack,
                    Math.round(minTrack + trackSpan * 0.25),
                    Math.round(minTrack + trackSpan * 0.5),
                    Math.round(minTrack + trackSpan * 0.75),
                    maxTrack,
                  ].map((tickVal) => {
                    const tx = xForTrack(tickVal);
                    return (
                      <g key={`axis-tick-${tickVal}`}>
                        <line x1={tx} y1="24" x2={tx} y2="36" stroke="var(--rule-strong)" strokeWidth="1.5" />
                        <text
                          x={tx}
                          y="18"
                          textAnchor="middle"
                          fontSize="10"
                          fontWeight="700"
                          fill="var(--ink-muted)"
                        >
                          {tickVal}
                        </text>
                      </g>
                    );
                  })}

                  {/* Initial Head guideline */}
                  <line
                    x1={xForTrack(initialHead)}
                    y1="30"
                    x2={xForTrack(initialHead)}
                    y2={46 + diskResult.sequence.length * 24}
                    stroke="var(--div-m2)"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    opacity="0.4"
                  />

                  {/* Full ghost trajectory (faded behind) */}
                  <polyline
                    fill="none"
                    stroke="var(--rule-hairline)"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                    points={diskResult.sequence
                      .map((trk, i) => `${xForTrack(trk).toFixed(1)},${46 + i * 24}`)
                      .join(' ')}
                  />

                  {/* Active Seek Polyline */}
                  <polyline
                    fill="none"
                    stroke="var(--div-m5)"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    points={visibleSequence
                      .map((trk, i) => `${xForTrack(trk).toFixed(1)},${46 + i * 24}`)
                      .join(' ')}
                  />

                  {/* Step Segments, Delta Badges & Turnarounds */}
                  {diskResult.steps.map((st, i) => {
                    if (playbackStep >= 0 && i >= playbackStep) return null;
                    const fromX = xForTrack(st.from);
                    const toX = xForTrack(st.to);
                    const fromY = 46 + i * 24;
                    const toY = 46 + (i + 1) * 24;
                    const midX = (fromX + toX) / 2;
                    const midY = (fromY + toY) / 2;

                    return (
                      <g key={`step-${i}-${st.from}-${st.to}`}>
                        {/* If boundary or non-servicing wrap, show indicator */}
                        {st.isBoundary && (
                          <rect
                            x={toX - 28}
                            y={toY - 9}
                            width="56"
                            height="18"
                            rx="2"
                            fill="var(--bg-sheet)"
                            stroke="var(--div-m2)"
                            strokeWidth="1"
                          />
                        )}

                        {/* Delta distance pill text */}
                        <rect
                          x={midX - 16}
                          y={midY - 7}
                          width="32"
                          height="14"
                          rx="2"
                          fill="var(--bg-paper)"
                          stroke="var(--rule-hairline)"
                          strokeWidth="0.8"
                          opacity="0.92"
                        />
                        <text
                          x={midX}
                          y={midY + 3.5}
                          textAnchor="middle"
                          fontSize="8.5"
                          fontWeight="700"
                          fill="var(--ink-secondary)"
                        >
                          {st.distance}
                        </text>
                      </g>
                    );
                  })}

                  {/* Nodes for each visited cylinder */}
                  {diskResult.sequence.map((trk, i) => {
                    const isVisible = playbackStep < 0 || i <= playbackStep;
                    const isCurrent = playbackStep >= 0 ? i === playbackStep : i === diskResult.sequence.length - 1;
                    const cx = xForTrack(trk);
                    const cy = 46 + i * 24;
                    const isStart = i === 0;

                    return (
                      <g
                        key={`node-${trk}-${i}`}
                        className="cursor-pointer transition-opacity"
                        opacity={isVisible ? 1 : 0.25}
                        onClick={() => setPlaybackStep(i)}
                      >
                        {/* Active ring indicator */}
                        {isCurrent && (
                          <circle
                            cx={cx}
                            cy={cy}
                            r="9"
                            fill="none"
                            stroke="var(--div-m2)"
                            strokeWidth="1.5"
                            strokeDasharray="2 2"
                            className="animate-pulse"
                          />
                        )}

                        {/* Node circle */}
                        <circle
                          cx={cx}
                          cy={cy}
                          r={isStart ? 6 : 4.5}
                          fill={
                            isStart
                              ? 'var(--div-m2)'
                              : isCurrent
                                ? 'var(--div-m5)'
                                : 'var(--bg-paper)'
                          }
                          stroke={isStart ? 'var(--div-m2)' : 'var(--div-m5)'}
                          strokeWidth={isStart ? 2 : 2}
                        />

                        {/* Numerical track label */}
                        <text
                          x={cx + (cx > 580 ? -12 : 12)}
                          y={cy + 3.5}
                          textAnchor={cx > 580 ? 'end' : 'start'}
                          fontSize="9.5"
                          fontWeight={isStart || isCurrent ? '800' : '600'}
                          fill={isStart ? 'var(--div-m2)' : 'var(--ink-primary)'}
                        >
                          {isStart ? `Head ${trk}` : `${trk} (#${i})`}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Trajectory Sequence Text Footer */}
            <div className="pt-2 border-t border-[var(--rule-hairline)] flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
              <div className="flex items-center gap-1.5 text-[var(--ink-secondary)]">
                <span className="font-bold text-[var(--ink-primary)]">Seek Trajectory:</span>
                <span className="text-[var(--ink-muted)]">
                  {diskResult.sequence.join(' → ')}
                </span>
              </div>
              <div className="text-[11px] text-[var(--ink-muted)]">
                Current Head Position: <strong className="text-[var(--div-m5)]">{currentHeadPos}</strong>
              </div>
            </div>
          </div>

          {/* Summary KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs tabular-nums">
            <div className="p-3 bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] shadow-xs">
              <div className="text-[var(--ink-muted)] text-[11px]">Total Head Movement</div>
              <div className="text-xl font-bold text-[var(--div-m5)] mt-0.5">
                {diskResult.totalHeadMovement}
                <span className="text-xs font-normal text-[var(--ink-muted)] ml-1">cyl</span>
              </div>
              <div className="text-[10px] text-[var(--ink-muted)] mt-0.5">
                Avg: {diskResult.avgSeekDistance ?? (diskResult.totalHeadMovement / Math.max(1, diskResult.steps.length)).toFixed(1)} cyl/seek
              </div>
            </div>

            <div className="p-3 bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] shadow-xs">
              <div className="text-[var(--ink-muted)] text-[11px]">Seek Time ({msPerTrack} ms/trk)</div>
              <div className="text-xl font-bold text-[var(--ink-primary)] mt-0.5">
                {diskResult.seekTimeMs}
                <span className="text-xs font-normal text-[var(--ink-muted)] ml-1">ms</span>
              </div>
              <div className="text-[10px] text-[var(--ink-muted)] mt-0.5">
                T_seek = Seek Dist × {msPerTrack}ms
              </div>
            </div>

            <div className="p-3 bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] shadow-xs">
              <div className="text-[var(--ink-muted)] text-[11px]">Avg Rotational Latency</div>
              <div className="text-xl font-bold text-[var(--div-m2)] mt-0.5">
                {diskResult.avgRotationalLatencyMs}
                <span className="text-xs font-normal text-[var(--ink-muted)] ml-1">ms</span>
              </div>
              <div className="text-[10px] text-[var(--ink-muted)] mt-0.5">
                @ {rpm} RPM (1/2 rev)
              </div>
            </div>

            <div className="p-3 bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] shadow-xs">
              <div className="text-[var(--ink-muted)] text-[11px]">Total Access Time</div>
              <div className="text-xl font-bold text-[var(--div-m3)] mt-0.5">
                {diskResult.totalAccessTimeMs ?? Number((diskResult.seekTimeMs + diskResult.avgRotationalLatencyMs).toFixed(2))}
                <span className="text-xs font-normal text-[var(--ink-muted)] ml-1">ms</span>
              </div>
              <div className="text-[10px] text-[var(--ink-muted)] mt-0.5">
                T_seek + T_rotational
              </div>
            </div>
          </div>

          {/* Rotational Latency Calculator (RPM) */}
          <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--rule-hairline)] pb-2">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-[var(--div-m2)]" />
                <h4 className="text-sm font-bold text-[var(--ink-primary)]">
                  Rotational Latency Calculator (RPM)
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded-[2px] bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] font-mono text-[11px] text-[var(--ink-secondary)]">
                FAT C1 Set 1-2 Q9 Reference: 6000 RPM → 5.00 ms
              </span>
            </div>

            {/* Standard RPM Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              {RPM_PRESETS.map((p) => (
                <button
                  key={p.rpm}
                  type="button"
                  onClick={() => setRpm(p.rpm)}
                  className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-[2px] border transition-colors ${
                    rpm === p.rpm
                      ? 'bg-[var(--div-m2)] text-white border-[var(--div-m2)]'
                      : 'bg-[var(--bg-sheet)] text-[var(--ink-secondary)] border-[var(--rule-hairline)] hover:bg-[var(--bg-recessed)]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Interactive RPM Slider + Numeric Field */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center font-mono text-xs">
              <div className="sm:col-span-2 space-y-1">
                <div className="flex justify-between text-[11px] text-[var(--ink-muted)]">
                  <span>Custom RPM Slider:</span>
                  <span className="font-bold text-[var(--ink-primary)]">{rpm} RPM</span>
                </div>
                <input
                  type="range"
                  min="1200"
                  max="15000"
                  step="300"
                  value={rpm}
                  onChange={(e) => setRpm(Number(e.target.value))}
                  className="w-full accent-[var(--div-m2)] cursor-pointer"
                />
              </div>

              <div>
                <label className="space-y-1 block">
                  <span className="text-[11px] text-[var(--ink-muted)]">Spindle Speed (RPM):</span>
                  <input
                    type="number"
                    min="600"
                    max="30000"
                    step="100"
                    value={rpm}
                    onChange={(e) => setRpm(Math.max(100, Number(e.target.value) || 6000))}
                    className="w-full px-2 py-1.5 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)] text-xs tabular-nums font-semibold"
                  />
                </label>
              </div>
            </div>

            {/* Mathematical Derivation Box */}
            <div className="bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px] p-3 font-mono text-xs space-y-1.5">
              <div className="text-[var(--ink-primary)] font-semibold flex items-center justify-between">
                <span>Rotational Physics &amp; Formula:</span>
                <span className="text-[var(--div-m2)]">
                  Avg Latency = {rotationalDetails.avgLatencyMs} ms
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[var(--ink-secondary)]">
                <div>
                  • Full Rotation Time (T_rev): <br />
                  <code className="text-[var(--ink-primary)] font-bold">
                    60,000 ms / {rpm} RPM = {rotationalDetails.revolutionTimeMs} ms
                  </code>
                </div>
                <div>
                  • Average Rotational Latency (T_rot = 1/2 T_rev): <br />
                  <code className="text-[var(--ink-primary)] font-bold">
                    {rotationalDetails.revolutionTimeMs} ms / 2 = {rotationalDetails.avgLatencyMs} ms
                  </code>
                </div>
              </div>
            </div>
          </div>

          {/* RAID 0/1/5/6 Capacity & Fault Tolerance Evaluator (C1 Set 1-2 Q7) */}
          <div className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[2px] p-4 space-y-3.5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--rule-hairline)] pb-2.5">
              <div>
                <h4 className="text-sm font-bold text-[var(--ink-primary)] flex items-center gap-2">
                  <Database className="w-4 h-4 text-[var(--div-m4)]" />
                  RAID 0/1/5/6 Capacity &amp; Fault Tolerance Evaluator
                </h4>
                <div className="font-mono text-[11px] text-[var(--ink-muted)]">
                  VIT FAT C1 Set 1-2 Q7 (University DC vs Multimedia Scratch)
                </div>
              </div>

              {/* Real Exam Scenario 1-Click Buttons */}
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => applyRaidScenario('university')}
                  className={`px-2 py-1 rounded-[2px] border text-[11px] font-semibold transition-colors ${
                    raidLevel === 'RAID6' && numDisks === 6 && diskCapTB === 2
                      ? 'bg-[var(--div-m4)] text-white border-[var(--div-m4)]'
                      : 'bg-[var(--bg-sheet)] text-[var(--ink-secondary)] border-[var(--rule-hairline)] hover:bg-[var(--bg-recessed)]'
                  }`}
                  title="6 Disks × 2TB RAID 6 (tolerates 2 disk failures)"
                >
                  Scenario 1: Univ DC
                </button>
                <button
                  type="button"
                  onClick={() => applyRaidScenario('video')}
                  className={`px-2 py-1 rounded-[2px] border text-[11px] font-semibold transition-colors ${
                    raidLevel === 'RAID0' && numDisks === 4 && diskCapTB === 2
                      ? 'bg-[var(--div-m4)] text-white border-[var(--div-m4)]'
                      : 'bg-[var(--bg-sheet)] text-[var(--ink-secondary)] border-[var(--rule-hairline)] hover:bg-[var(--bg-recessed)]'
                  }`}
                  title="4 Disks × 2TB RAID 0 (100% capacity, no redundancy)"
                >
                  Scenario 2: Video Scratch
                </button>
              </div>
            </div>

            {/* RAID Level Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {RAID_LEVELS.map((rl) => (
                <button
                  key={rl.id}
                  type="button"
                  onClick={() => setRaidLevel(rl.id)}
                  className={`px-3 py-1 font-mono text-xs font-semibold rounded-[2px] border transition-colors ${
                    raidLevel === rl.id
                      ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)] shadow-xs'
                      : 'bg-[var(--bg-sheet)] text-[var(--ink-secondary)] border-[var(--rule-hairline)] hover:bg-[var(--bg-recessed)]'
                  }`}
                >
                  {rl.label}
                </button>
              ))}
            </div>

            {/* Inputs: Disks N and Capacity per disk */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <label className="space-y-1">
                <span className="text-[var(--ink-muted)]">Drive Count (N):</span>
                <input
                  type="number"
                  min={raidResult.minDisks}
                  max={24}
                  value={numDisks}
                  onChange={(e) => setNumDisks(Math.max(2, Number(e.target.value) || 2))}
                  className="w-full px-2 py-1.5 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)] tabular-nums font-semibold"
                />
              </label>

              <label className="space-y-1">
                <span className="text-[var(--ink-muted)]">Disk Size (TB):</span>
                <input
                  type="number"
                  min={0.5}
                  max={64}
                  step={0.5}
                  value={diskCapTB}
                  onChange={(e) => setDiskCapTB(Math.max(0.5, Number(e.target.value) || 1))}
                  className="w-full px-2 py-1.5 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)] tabular-nums font-semibold"
                />
              </label>

              <div className="space-y-1">
                <span className="text-[var(--ink-muted)]">Raw Capacity:</span>
                <div className="px-2 py-1.5 rounded-[2px] bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] font-bold text-[var(--ink-primary)] tabular-nums">
                  {raidResult.rawCapacityTB ?? (numDisks * diskCapTB).toFixed(1)} TB
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[var(--ink-muted)]">Parity Formula:</span>
                <div className="px-2 py-1.5 rounded-[2px] bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] font-bold text-[var(--div-m4)] tabular-nums truncate">
                  {raidResult.capacityFormula ?? 'Formula'}
                </div>
              </div>
            </div>

            {/* RAID Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono text-xs tabular-nums">
              <div className="p-3 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px]">
                <div className="text-[var(--ink-muted)] text-[11px]">Usable Storage Capacity</div>
                <div className="text-lg font-bold text-[var(--ink-primary)] mt-0.5">
                  {raidResult.valid ? `${raidResult.usableCapacityTB} TB` : 'Invalid Array'}
                </div>
                <div className="text-[10px] text-[var(--ink-muted)] mt-0.5">
                  Efficiency: {raidResult.storageEfficiencyPercent}% of raw pool
                </div>
              </div>

              <div className="p-3 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px]">
                <div className="text-[var(--ink-muted)] text-[11px]">Max Simultaneous Failures</div>
                <div className="text-lg font-bold text-[var(--div-danger)] mt-0.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[var(--div-m3)]" />
                  {raidResult.maxDiskFailures} Disk{raidResult.maxDiskFailures === 1 ? '' : 's'}
                </div>
                <div className="text-[10px] text-[var(--ink-muted)] mt-0.5">
                  {raidResult.faultToleranceFormula ?? 'Fault Tolerance Limit'}
                </div>
              </div>

              <div className="p-3 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px]">
                <div className="text-[var(--ink-muted)] text-[11px]">Performance Profile</div>
                <div className="text-xs font-bold text-[var(--ink-primary)] mt-1">
                  Read: {raidResult.readPerformance}
                </div>
                <div className="text-[10px] text-[var(--ink-secondary)] mt-0.5">
                  Write: {raidResult.writePerformance}
                </div>
              </div>
            </div>

            {/* Visual Disk Array Stripes Diagram */}
            {raidResult.diskStripes && raidResult.diskStripes.length > 0 && (
              <div className="pt-2 border-t border-[var(--rule-hairline)] space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-[var(--ink-primary)] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[var(--div-m4)]" />
                    Disk Stripe Allocation Matrix ({raidResult.name})
                  </span>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-xs bg-[var(--div-m5)]" /> Data (D)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-xs bg-[var(--div-m2)]" /> Parity (P)
                    </span>
                    {raidLevel === 'RAID6' && (
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-xs bg-[var(--div-labs)]" /> Dual Q
                      </span>
                    )}
                    {(raidLevel === 'RAID1' || raidLevel === 'RAID10') && (
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-xs bg-[var(--div-m3)]" /> Mirror (M)
                      </span>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto pb-1">
                  <div className="flex items-center gap-2 min-w-[480px]">
                    {raidResult.diskStripes.map((d) => (
                      <div
                        key={`disk-col-${d.diskIndex}`}
                        className="flex-1 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px] p-2 text-center font-mono"
                      >
                        <div className="text-[11px] font-bold text-[var(--ink-primary)] border-b border-[var(--rule-hairline)] pb-1 mb-1.5 flex items-center justify-center gap-1">
                          <HardDrive className="w-3 h-3 text-[var(--ink-muted)]" />
                          {d.diskLabel}
                        </div>
                        <div className="space-y-1">
                          {d.blocks.map((blk, bIdx) => {
                            const bg =
                              blk.type === 'data'
                                ? 'bg-[var(--div-m5)] text-white'
                                : blk.type === 'parity'
                                  ? 'bg-[var(--div-m2)] text-white'
                                  : blk.type === 'q-parity'
                                    ? 'bg-[var(--div-labs)] text-white'
                                    : 'bg-[var(--div-m3)] text-white';
                            return (
                              <div
                                key={`blk-${d.diskIndex}-${bIdx}`}
                                className={`py-1 px-1 rounded-xs text-[10px] font-bold ${bg}`}
                              >
                                {blk.label}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Exam Justification */}
            <div className="text-xs text-[var(--ink-secondary)] bg-[var(--bg-sheet)] p-2.5 rounded-[2px] border border-[var(--rule-hairline)]">
              <strong className="text-[var(--ink-primary)]">Exam Justification ({raidResult.name}):</strong>{' '}
              {raidResult.bestUseCase}
            </div>
          </div>
        </div>

        {/* =========================================================================
            RIGHT 5 COLUMNS: Algorithm Selector, Initial Head & Direction, Queue, Comparison
            ========================================================================= */}
        <div className="lg:col-span-5 space-y-4">
          {/* Algorithm Selector */}
          <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-[var(--rule-hairline)] pb-2">
              <h4 className="text-sm font-bold text-[var(--ink-primary)] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[var(--div-m5)]" />
                Scheduling Algorithm
              </h4>
              <span className="font-mono text-xs font-bold text-[var(--div-m5)]">
                Active: {algorithm}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {DISK_ALGOS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    setAlgorithm(a.id);
                    setPlaybackStep(-1);
                    stopPlayback();
                  }}
                  className={`p-2 text-left font-mono rounded-[2px] border transition-all ${
                    algorithm === a.id
                      ? 'bg-[var(--div-m5)] text-white border-[var(--div-m5)] shadow-xs'
                      : 'bg-[var(--bg-sheet)] text-[var(--ink-primary)] border-[var(--rule-hairline)] hover:bg-[var(--bg-recessed)]'
                  }`}
                >
                  <div className="text-xs font-bold">{a.label}</div>
                  <div
                    className={`text-[10px] mt-0.5 line-clamp-1 leading-tight ${
                      algorithm === a.id ? 'text-blue-100' : 'text-[var(--ink-muted)]'
                    }`}
                  >
                    {a.desc}
                  </div>
                </button>
              ))}
            </div>

            <div className="text-[11px] font-mono text-[var(--ink-muted)] bg-[var(--bg-sheet)] p-2 rounded-[2px] border border-[var(--rule-hairline)]">
              <strong>{algorithm} Behavior:</strong>{' '}
              {DISK_ALGOS.find((a) => a.id === algorithm)?.desc}
            </div>
          </div>

          {/* Initial Head Position, Direction & Track Range */}
          <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-4 space-y-3.5 shadow-xs">
            <h4 className="text-sm font-bold text-[var(--ink-primary)] border-b border-[var(--rule-hairline)] pb-2">
              Head Position &amp; Direction
            </h4>

            {/* Direction Buttons */}
            <div className="space-y-1">
              <span className="font-mono text-xs text-[var(--ink-muted)]">Initial Head Movement Direction:</span>
              <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setDirection('down')}
                  className={`py-2 px-3 rounded-[2px] font-semibold border flex items-center justify-center gap-1.5 transition-colors ${
                    direction === 'down'
                      ? 'bg-[var(--div-m2)] text-white border-[var(--div-m2)] shadow-xs'
                      : 'bg-[var(--bg-sheet)] text-[var(--ink-secondary)] border-[var(--rule-hairline)] hover:bg-[var(--bg-recessed)]'
                  }`}
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                  ↓ Down (Toward {minTrack})
                </button>

                <button
                  type="button"
                  onClick={() => setDirection('up')}
                  className={`py-2 px-3 rounded-[2px] font-semibold border flex items-center justify-center gap-1.5 transition-colors ${
                    direction === 'up'
                      ? 'bg-[var(--div-m2)] text-white border-[var(--div-m2)] shadow-xs'
                      : 'bg-[var(--bg-sheet)] text-[var(--ink-secondary)] border-[var(--rule-hairline)] hover:bg-[var(--bg-recessed)]'
                  }`}
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                  ↑ Up (Toward {maxTrack})
                </button>
              </div>
            </div>

            {/* Initial Head Slider + Input */}
            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[var(--ink-muted)]">Initial Head Cylinder:</span>
                <span className="font-bold text-[var(--div-m2)]">{initialHead}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={minTrack}
                  max={maxTrack}
                  value={initialHead}
                  onChange={(e) => setInitialHead(Number(e.target.value))}
                  className="flex-1 accent-[var(--div-m2)] cursor-pointer"
                />
                <input
                  type="number"
                  min={minTrack}
                  max={maxTrack}
                  value={initialHead}
                  onChange={(e) => setInitialHead(Number(e.target.value) || minTrack)}
                  className="w-16 px-2 py-1 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)] text-xs tabular-nums text-center font-bold"
                />
              </div>
            </div>

            {/* Cylinder Range (minTrack and maxTrack) */}
            <div className="grid grid-cols-2 gap-2.5 font-mono text-xs pt-1 border-t border-[var(--rule-hairline)]">
              <label className="space-y-1">
                <span className="text-[var(--ink-muted)]">Platter Min Track:</span>
                <input
                  type="number"
                  value={minTrack}
                  onChange={(e) => setMinTrack(Number(e.target.value) || 0)}
                  className="w-full px-2 py-1 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)] text-xs tabular-nums"
                />
              </label>

              <label className="space-y-1">
                <span className="text-[var(--ink-muted)]">Platter Max Track:</span>
                <input
                  type="number"
                  value={maxTrack}
                  onChange={(e) => setMaxTrack(Number(e.target.value) || 199)}
                  className="w-full px-2 py-1 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)] text-xs tabular-nums"
                />
              </label>
            </div>
          </div>

          {/* Track Request Queue Editor */}
          <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-[var(--rule-hairline)] pb-2">
              <h4 className="text-sm font-bold text-[var(--ink-primary)]">
                Track Request Queue ({validRequests.length} requests)
              </h4>
              <div className="flex items-center gap-1 font-mono text-[11px]">
                <button
                  type="button"
                  onClick={sortRequestsAscending}
                  className="px-2 py-0.5 rounded-[2px] bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] hover:bg-[var(--bg-recessed)]"
                  title="Sort Ascending"
                >
                  Sort
                </button>
                <button
                  type="button"
                  onClick={reverseRequests}
                  className="px-2 py-0.5 rounded-[2px] bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] hover:bg-[var(--bg-recessed)]"
                  title="Reverse Order"
                >
                  Rev
                </button>
                <button
                  type="button"
                  onClick={shuffleRequests}
                  className="px-1.5 py-0.5 rounded-[2px] bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] hover:bg-[var(--bg-recessed)]"
                  title="Shuffle"
                >
                  <Shuffle className="w-3 h-3 text-[var(--ink-muted)]" />
                </button>
              </div>
            </div>

            {/* Quick Add Track Field */}
            <div className="flex items-center gap-2 font-mono text-xs">
              <input
                type="number"
                placeholder={`Cylinder (${minTrack}–${maxTrack})`}
                value={newTrackInput}
                onChange={(e) => setNewTrackInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTrack();
                  }
                }}
                className="flex-1 px-2.5 py-1.5 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)] tabular-nums"
              />
              <button
                type="button"
                onClick={addTrack}
                className="px-3 py-1.5 rounded-[2px] bg-[var(--div-m5)] text-white font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>

            {/* Textarea for bulk comma editing */}
            <div className="space-y-1">
              <span className="font-mono text-[11px] text-[var(--ink-muted)]">
                Comma / Space Delimited Queue:
              </span>
              <textarea
                rows={2}
                value={requestsInput}
                onChange={(e) => setRequestsInput(e.target.value)}
                className="w-full p-2 font-mono text-xs rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)] tabular-nums focus:outline-none focus:border-[var(--div-m5)] resize-none"
              />
            </div>

            {/* Out of bounds alert */}
            {outOfBoundsRequests.length > 0 && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-2 rounded-[2px] font-mono text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>
                  Ignored out-of-bounds tracks [{outOfBoundsRequests.join(', ')}]. Platter bounds: [{minTrack}–{maxTrack}].
                </span>
              </div>
            )}

            {/* Interactive Request Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {parsedRequests.map((req, idx) => {
                const isValid = req >= minTrack && req <= maxTrack;
                return (
                  <span
                    key={`req-chip-${idx}-${req}`}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] font-mono text-xs border ${
                      isValid
                        ? 'bg-[var(--bg-sheet)] border-[var(--rule-hairline)] text-[var(--ink-primary)]'
                        : 'bg-red-100 border-red-300 text-red-700'
                    }`}
                  >
                    <span>{req}</span>
                    <button
                      type="button"
                      onClick={() => removeRequest(idx)}
                      className="text-[var(--ink-muted)] hover:text-[var(--div-danger)]"
                      title="Remove track"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          </div>

          {/* All-Algorithm Head-to-Head Comparison Table */}
          <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-[var(--rule-hairline)] pb-2">
              <h4 className="text-sm font-bold text-[var(--ink-primary)]">
                Algorithm Head-to-Head Comparison
              </h4>
              <span className="font-mono text-[11px] text-[var(--ink-muted)]">
                Tested on Current Queue
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs tabular-nums border-collapse">
                <thead>
                  <tr className="border-b border-[var(--rule-strong)] text-[var(--ink-muted)] text-[11px]">
                    <th className="py-1 px-1.5">Rank</th>
                    <th className="py-1 px-1.5">Algorithm</th>
                    <th className="py-1 px-1.5 text-right">Head Seek</th>
                    <th className="py-1 px-1.5 text-right">Seek Time</th>
                    <th className="py-1 px-1.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonResults.map((row) => {
                    const isSelected = row.algorithm === algorithm;
                    return (
                      <tr
                        key={row.algorithm}
                        className={`border-b border-[var(--rule-hairline)] transition-colors ${
                          isSelected
                            ? 'bg-[var(--div-m5)]/10 font-bold'
                            : 'hover:bg-[var(--bg-sheet)]'
                        }`}
                      >
                        <td className="py-1.5 px-1.5">
                          {row.rank === 1 ? (
                            <span className="px-1.5 py-0.5 rounded-xs bg-[var(--div-m3)] text-white text-[10px]">
                              #1 Best
                            </span>
                          ) : (
                            <span className="text-[var(--ink-muted)]">#{row.rank}</span>
                          )}
                        </td>
                        <td className="py-1.5 px-1.5">
                          <span className={isSelected ? 'text-[var(--div-m5)]' : 'text-[var(--ink-primary)]'}>
                            {row.algorithm}
                          </span>
                        </td>
                        <td className="py-1.5 px-1.5 text-right font-bold text-[var(--ink-primary)]">
                          {row.totalHeadMovement} cyl
                        </td>
                        <td className="py-1.5 px-1.5 text-right text-[var(--ink-secondary)]">
                          {row.seekTimeMs} ms
                        </td>
                        <td className="py-1.5 px-1.5 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setAlgorithm(row.algorithm);
                              setPlaybackStep(-1);
                              stopPlayback();
                            }}
                            className={`px-2 py-0.5 text-[10px] rounded-[2px] border ${
                              isSelected
                                ? 'bg-[var(--div-m5)] text-white border-[var(--div-m5)]'
                                : 'bg-[var(--bg-sheet)] text-[var(--ink-secondary)] border-[var(--rule-hairline)] hover:bg-[var(--bg-recessed)]'
                            }`}
                          >
                            {isSelected ? 'Active' : 'Select'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Step-by-Step Seek Execution Table */}
          <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-4 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between border-b border-[var(--rule-hairline)] pb-2">
              <h4 className="text-sm font-bold text-[var(--ink-primary)]">
                Seek Traversal Step Breakdown
              </h4>
              <span className="font-mono text-[11px] text-[var(--ink-muted)]">
                {diskResult.steps.length} Seek Steps
              </span>
            </div>

            <div className="max-h-56 overflow-y-auto">
              <table className="w-full text-left font-mono text-xs tabular-nums border-collapse">
                <thead className="sticky top-0 bg-[var(--bg-paper)] border-b border-[var(--rule-strong)] text-[var(--ink-muted)] text-[11px]">
                  <tr>
                    <th className="py-1 px-1.5">Step</th>
                    <th className="py-1 px-1.5">Movement</th>
                    <th className="py-1 px-1.5 text-right">Seek |Δ|</th>
                    <th className="py-1 px-1.5 text-right">Cumulative</th>
                  </tr>
                </thead>
                <tbody>
                  {diskResult.steps.map((st, sIdx) => {
                    const cumulative = diskResult.steps
                      .slice(0, sIdx + 1)
                      .reduce((acc, step) => acc + step.distance, 0);
                    const isStepActive = playbackStep === sIdx + 1;
                    return (
                      <tr
                        key={`step-row-${sIdx}`}
                        onClick={() => setPlaybackStep(sIdx + 1)}
                        className={`border-b border-[var(--rule-hairline)] cursor-pointer transition-colors ${
                          isStepActive
                            ? 'bg-[var(--div-m2)]/15 font-bold'
                            : 'hover:bg-[var(--bg-sheet)]'
                        }`}
                      >
                        <td className="py-1 px-1.5 text-[var(--ink-muted)]">#{sIdx + 1}</td>
                        <td className="py-1 px-1.5">
                          <span className="font-semibold text-[var(--ink-primary)]">
                            {st.from} → {st.to}
                          </span>
                          {st.isBoundary && (
                            <span className="ml-1.5 px-1 py-0.2 rounded-xs bg-amber-100 text-amber-800 text-[9.5px]">
                              Boundary
                            </span>
                          )}
                        </td>
                        <td className="py-1 px-1.5 text-right font-bold text-[var(--div-m5)]">
                          {st.distance} cyl
                        </td>
                        <td className="py-1 px-1.5 text-right text-[var(--ink-secondary)]">
                          {cumulative} cyl
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
