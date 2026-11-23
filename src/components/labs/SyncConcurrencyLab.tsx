import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Code,
  Layers,
  Lock,
  RotateCcw,
  Scissors,
  ShieldAlert,
  ShieldCheck,
  SkipBack,
  Unlock,
  Users,
  Utensils,
  Zap,
} from 'lucide-react';
import {
  BoundedBufferState,
  DiningPhilosophersState,
  PetersonState,
  ReadersWritersState,
  SYNC_SOLUTIONS,
  SleepingBarberState,
  SyncScenarioId,
  createBoundedBufferState,
  createDiningPhilosophersState,
  createPetersonState,
  createReadersWritersState,
  createSleepingBarberState,
  stepBoundedBuffer,
  stepDiningPhilosophers,
  stepPeterson,
  stepReadersWriters,
  stepSleepingBarber,
} from '../../utils/syncLabEngine';

const SCENARIOS: Array<{
  id: SyncScenarioId;
  label: string;
  examTag: string;
  badgeColor: string;
}> = [
  {
    id: 'bounded-buffer',
    label: 'Bounded Buffer',
    examTag: 'C2 Q6 Food Ordering (N=5)',
    badgeColor: 'var(--div-m3)',
  },
  {
    id: 'peterson',
    label: "Peterson's Algorithm",
    examTag: 'C2 Q5 Railway Seats=10',
    badgeColor: 'var(--div-m2)',
  },
  {
    id: 'sleeping-barber',
    label: 'Sleeping Barber',
    examTag: 'C1 Set 2-2 Q2 (Chairs=3)',
    badgeColor: 'var(--div-m5)',
  },
  {
    id: 'dining-philosophers',
    label: 'Dining Philosophers',
    examTag: 'Dijkstra Asymmetric Fix',
    badgeColor: 'var(--div-labs)',
  },
  {
    id: 'readers-writers',
    label: 'Readers-Writers',
    examTag: 'Reader-Preference Mutex',
    badgeColor: 'var(--div-m4)',
  },
];

const PHILOSOPHER_NAMES = ['P0: Aristotle', 'P1: Descartes', 'P2: Kant', 'P3: Russell', 'P4: Turing'];

export const SyncConcurrencyLab: React.FC = () => {
  const [scenario, setScenario] = useState<SyncScenarioId>('bounded-buffer');

  // History stacks for step-forward / step-back trace controls
  const [bbHistory, setBbHistory] = useState<BoundedBufferState[]>([createBoundedBufferState(5)]);
  const [bbIndex, setBbIndex] = useState(0);

  const [petHistory, setPetHistory] = useState<PetersonState[]>([createPetersonState(10, 2)]);
  const [petIndex, setPetIndex] = useState(0);

  const [barberHistory, setBarberHistory] = useState<SleepingBarberState[]>([
    createSleepingBarberState(3),
  ]);
  const [barberIndex, setBarberIndex] = useState(0);

  const [dpHistory, setDpHistory] = useState<DiningPhilosophersState[]>([
    createDiningPhilosophersState(false),
  ]);
  const [dpIndex, setDpIndex] = useState(0);

  const [rwHistory, setRwHistory] = useState<ReadersWritersState[]>([createReadersWritersState()]);
  const [rwIndex, setRwIndex] = useState(0);

  // Inspector tab in right column (code vs proofs vs exam traps)
  const [inspectorTab, setInspectorTab] = useState<'code' | 'proofs' | 'traps'>('code');

  // Active state pointers
  const bb = bbHistory[bbIndex];
  const pet = petHistory[petIndex];
  const barber = barberHistory[barberIndex];
  const dp = dpHistory[dpIndex];
  const rw = rwHistory[rwIndex];

  // Push new state into history stack
  const pushBb = (next: BoundedBufferState) => {
    setBbHistory((prev) => [...prev.slice(0, bbIndex + 1), next]);
    setBbIndex((i) => i + 1);
  };

  const pushPet = (next: PetersonState) => {
    setPetHistory((prev) => [...prev.slice(0, petIndex + 1), next]);
    setPetIndex((i) => i + 1);
  };

  const pushBarber = (next: SleepingBarberState) => {
    setBarberHistory((prev) => [...prev.slice(0, barberIndex + 1), next]);
    setBarberIndex((i) => i + 1);
  };

  const pushDp = (next: DiningPhilosophersState) => {
    setDpHistory((prev) => [...prev.slice(0, dpIndex + 1), next]);
    setDpIndex((i) => i + 1);
  };

  const pushRw = (next: ReadersWritersState) => {
    setRwHistory((prev) => [...prev.slice(0, rwIndex + 1), next]);
    setRwIndex((i) => i + 1);
  };

  // Active scenario metadata & history navigation properties
  const activeSolution = SYNC_SOLUTIONS[scenario];

  const currentHistoryLength =
    scenario === 'bounded-buffer'
      ? bbHistory.length
      : scenario === 'peterson'
        ? petHistory.length
        : scenario === 'sleeping-barber'
          ? barberHistory.length
          : scenario === 'dining-philosophers'
            ? dpHistory.length
            : rwHistory.length;

  const currentHistoryIndex =
    scenario === 'bounded-buffer'
      ? bbIndex
      : scenario === 'peterson'
        ? petIndex
        : scenario === 'sleeping-barber'
          ? barberIndex
          : scenario === 'dining-philosophers'
            ? dpIndex
            : rwIndex;

  const canStepBack = currentHistoryIndex > 0;
  const canStepForward = currentHistoryIndex < currentHistoryLength - 1;

  const handleStepBack = () => {
    if (!canStepBack) return;
    if (scenario === 'bounded-buffer') setBbIndex((i) => i - 1);
    else if (scenario === 'peterson') setPetIndex((i) => i - 1);
    else if (scenario === 'sleeping-barber') setBarberIndex((i) => i - 1);
    else if (scenario === 'dining-philosophers') setDpIndex((i) => i - 1);
    else setRwIndex((i) => i - 1);
  };

  const handleStepForward = () => {
    if (!canStepForward) return;
    if (scenario === 'bounded-buffer') setBbIndex((i) => i + 1);
    else if (scenario === 'peterson') setPetIndex((i) => i + 1);
    else if (scenario === 'sleeping-barber') setBarberIndex((i) => i + 1);
    else if (scenario === 'dining-philosophers') setDpIndex((i) => i + 1);
    else setRwIndex((i) => i + 1);
  };

  const handleRewind = () => {
    if (scenario === 'bounded-buffer') setBbIndex(0);
    else if (scenario === 'peterson') setPetIndex(0);
    else if (scenario === 'sleeping-barber') setBarberIndex(0);
    else if (scenario === 'dining-philosophers') setDpIndex(0);
    else setRwIndex(0);
  };

  const handleReset = () => {
    if (scenario === 'bounded-buffer') {
      const init = createBoundedBufferState(5);
      setBbHistory([init]);
      setBbIndex(0);
    } else if (scenario === 'peterson') {
      const init = createPetersonState(10, 2);
      setPetHistory([init]);
      setPetIndex(0);
    } else if (scenario === 'sleeping-barber') {
      const init = createSleepingBarberState(3);
      setBarberHistory([init]);
      setBarberIndex(0);
    } else if (scenario === 'dining-philosophers') {
      const init = createDiningPhilosophersState(dp.asymmetricFix);
      setDpHistory([init]);
      setDpIndex(0);
    } else {
      const init = createReadersWritersState();
      setRwHistory([init]);
      setRwIndex(0);
    }
  };

  const activeLog =
    scenario === 'bounded-buffer'
      ? bb.log
      : scenario === 'peterson'
        ? pet.log
        : scenario === 'sleeping-barber'
          ? barber.log
          : scenario === 'dining-philosophers'
            ? dp.log
            : rw.log;

  // Circular coordinates for Bounded Buffer SVG
  const circularSlots = useMemo(() => {
    const total = bb.capacity;
    const r = 78;
    const cx = 110;
    const cy = 110;
    return Array.from({ length: total }).map((_, i) => {
      const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      return { index: i, x, y, item: bb.slots[i] ?? null };
    });
  }, [bb.capacity, bb.slots]);

  // Dining Philosophers circular coordinates
  const philNodes = useMemo(() => {
    const total = 5;
    const r = 84;
    const cx = 120;
    const cy = 120;
    return Array.from({ length: total }).map((_, i) => {
      const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      return {
        index: i,
        name: PHILOSOPHER_NAMES[i],
        x,
        y,
        state: dp.states[i],
      };
    });
  }, [dp.states]);

  const stickNodes = useMemo(() => {
    const total = 5;
    const r = 52;
    const cx = 120;
    const cy = 120;
    return Array.from({ length: total }).map((_, i) => {
      // Chopstick i sits between Phil i-1 and Phil i
      const angle = ((i + 0.5) / total) * 2 * Math.PI - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      const owner = dp.chopsticks[i];
      return {
        index: i,
        x,
        y,
        owner,
      };
    });
  }, [dp.chopsticks]);

  return (
    <div className="space-y-4">
      {/* Scenario Selector Ribbon */}
      <div className="flex flex-wrap items-center gap-2">
        {SCENARIOS.map((s) => {
          const isActive = scenario === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setScenario(s.id)}
              className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-[2px] border transition-all text-left ${
                isActive
                  ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)] shadow-sm'
                  : 'bg-[var(--bg-paper)] text-[var(--ink-secondary)] border-[var(--rule-hairline)] hover:bg-[var(--bg-recessed)]'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: s.badgeColor }}
                />
                <span>{s.label}</span>
              </div>
              <div className="text-[10px] opacity-75 font-normal tracking-tight mt-0.5">
                {s.examTag}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main 7:5 Asymmetric Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ==================================================================== */}
        {/* LEFT 7 COLUMNS: Interactive Visual Stages                           */}
        {/* ==================================================================== */}
        <div className="lg:col-span-7 space-y-4 lab-stage-canvas">
          {/* 1. Bounded Buffer Stage */}
          {scenario === 'bounded-buffer' && (
            <div className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[2px] p-4.5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--rule-hairline)] pb-2.5">
                <div>
                  <h3 className="font-mono text-xs font-bold text-[var(--ink-primary)] uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[var(--div-m3)]" />
                    Circular Bounded Buffer (C2 Q6 Food Ordering)
                  </h3>
                  <div className="font-mono text-[11px] text-[var(--ink-muted)]">
                    Capacity N = {bb.capacity} · Producer in = {bb.inPointer} · Consumer out ={' '}
                    {bb.outPointer}
                  </div>
                </div>
                {bb.raceCorrupted && (
                  <div className="px-2 py-0.5 rounded-[2px] bg-[var(--div-danger)] text-white font-mono text-[11px] font-bold flex items-center gap-1 animate-pulse">
                    <AlertTriangle className="w-3 h-3" /> RACE CONDITION DETECTED
                  </div>
                )}
              </div>

              {/* Circular Buffer Diagram + Slot Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                {/* Circular Slot Ring */}
                <div className="sm:col-span-6 flex flex-col items-center justify-center p-2 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px]">
                  <div className="text-[10px] font-mono text-[var(--ink-muted)] mb-1 font-bold">
                    CIRCULAR RING TOPOLOGY (in / out % {bb.capacity})
                  </div>
                  <div className="relative w-[220px] h-[220px]">
                    <svg
                      viewBox="0 0 220 220"
                      className="w-full h-full"
                      role="img"
                      aria-label="Circular Bounded Buffer Topology"
                    >
                      {/* Outer track */}
                      <circle
                        cx="110"
                        cy="110"
                        r="78"
                        fill="none"
                        stroke="var(--rule-hairline)"
                        strokeWidth="3"
                        strokeDasharray="4 4"
                      />
                      {/* Hub */}
                      <circle
                        cx="110"
                        cy="110"
                        r="42"
                        fill="var(--bg-paper)"
                        stroke="var(--rule-strong)"
                        strokeWidth="1.5"
                      />
                      <text
                        x="110"
                        y="104"
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="700"
                        fill="var(--ink-primary)"
                        fontFamily="var(--font-mono)"
                      >
                        {bb.full} / {bb.capacity}
                      </text>
                      <text
                        x="110"
                        y="118"
                        textAnchor="middle"
                        fontSize="8.5"
                        fontWeight="600"
                        fill={bb.mutex === 1 ? 'var(--div-m3)' : 'var(--div-danger)'}
                        fontFamily="var(--font-mono)"
                      >
                        {bb.mutex === 1 ? 'MUTEX FREE' : 'MUTEX HELD'}
                      </text>

                      {/* Circular Slot Nodes */}
                      {circularSlots.map((slot) => {
                        const isFilled = slot.item !== null;
                        const isNextIn = bb.inPointer === slot.index;
                        const isNextOut = bb.outPointer === slot.index;
                        return (
                          <g key={slot.index}>
                            <circle
                              cx={slot.x}
                              cy={slot.y}
                              r="17"
                              fill={
                                isFilled
                                  ? 'var(--div-m3)'
                                  : isNextIn
                                    ? 'var(--bg-recessed)'
                                    : 'var(--bg-paper)'
                              }
                              stroke={
                                isNextIn && isNextOut
                                  ? 'var(--div-m2)'
                                  : isNextIn
                                    ? 'var(--div-m4)'
                                    : isNextOut
                                      ? 'var(--div-m5)'
                                      : 'var(--rule-strong)'
                              }
                              strokeWidth={isNextIn || isNextOut ? '2.5' : '1.5'}
                            />
                            <text
                              x={slot.x}
                              y={slot.y - 1}
                              textAnchor="middle"
                              fontSize="8"
                              fontWeight="700"
                              fill={isFilled ? '#ffffff' : 'var(--ink-primary)'}
                              fontFamily="var(--font-mono)"
                            >
                              [{slot.index}]
                            </text>
                            <text
                              x={slot.x}
                              y={slot.y + 9}
                              textAnchor="middle"
                              fontSize="7"
                              fontWeight="600"
                              fill={isFilled ? '#ffffff' : 'var(--ink-muted)'}
                              fontFamily="var(--font-mono)"
                            >
                              {isFilled ? slot.item : 'EMPTY'}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-mono mt-1">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[var(--div-m4)]" /> in={bb.inPointer}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[var(--div-m5)]" /> out={bb.outPointer}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[var(--div-m3)]" /> filled={bb.full}
                    </span>
                  </div>
                </div>

                {/* Linear Array View & Gauges */}
                <div className="sm:col-span-6 space-y-3 font-mono text-xs">
                  <div>
                    <div className="text-[11px] font-bold text-[var(--ink-secondary)] mb-1">
                      Linear Slot Array (buffer[0..{bb.capacity - 1}])
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {Array.from({ length: bb.capacity }).map((_, i) => {
                        const filled = bb.slots[i] !== null;
                        const isNextIn = bb.inPointer === i;
                        const isNextOut = bb.outPointer === i;
                        return (
                          <div
                            key={i}
                            className={`p-2 rounded-[2px] border text-center transition-all ${
                              filled
                                ? 'bg-[var(--div-m3)]/15 border-[var(--div-m3)] text-[var(--ink-primary)] font-bold'
                                : 'bg-[var(--bg-sheet)] border-[var(--rule-hairline)] text-[var(--ink-muted)]'
                            }`}
                          >
                            <div className="text-[10px] opacity-75">#{i}</div>
                            <div className="text-[11px] font-bold truncate">
                              {bb.slots[i] ?? '—'}
                            </div>
                            <div className="text-[9px] mt-0.5">
                              {isNextIn && <span className="text-[var(--div-m4)] font-bold">IN </span>}
                              {isNextOut && <span className="text-[var(--div-m5)] font-bold">OUT</span>}
                              {!isNextIn && !isNextOut && ' '}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Semaphores Gauge Strip */}
                  <div className="p-2.5 rounded-[2px] bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] space-y-2">
                    <div className="text-[11px] font-bold text-[var(--ink-primary)] flex justify-between">
                      <span>Semaphores Invariant Gate</span>
                      <span className="text-[var(--ink-muted)] font-normal">
                        empty ({bb.empty}) + full ({bb.full}) = {bb.capacity}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span>empty (slots available for producer)</span>
                        <span className="font-bold">
                          {bb.empty} / {bb.capacity}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[var(--bg-recessed)] overflow-hidden">
                        <div
                          className="h-full bg-[var(--div-m4)] transition-all"
                          style={{ width: `${(bb.empty / bb.capacity) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span>full (items available for consumer)</span>
                        <span className="font-bold">
                          {bb.full} / {bb.capacity}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[var(--bg-recessed)] overflow-hidden">
                        <div
                          className="h-full bg-[var(--div-m3)] transition-all"
                          style={{ width: `${(bb.full / bb.capacity) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-1 border-t border-[var(--rule-hairline)] flex justify-between text-[11px]">
                      <span>mutex lock:</span>
                      <span className="font-bold text-[var(--div-m3)]">
                        {bb.mutex === 1 ? '1 (UNLOCKED)' : '0 (LOCKED)'}
                      </span>
                    </div>
                  </div>

                  {/* Blocked Queues */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-[2px] bg-[var(--bg-sheet)] border border-[var(--rule-hairline)]">
                      <div className="text-[var(--ink-muted)]">Blocked Producers</div>
                      <div className="text-sm font-bold text-[var(--ink-primary)]">
                        {bb.blockedProducers > 0 ? (
                          <span className="text-[var(--div-danger)]">
                            {bb.blockedProducers} waiting (Buffer Full)
                          </span>
                        ) : (
                          '0 (None)'
                        )}
                      </div>
                    </div>
                    <div className="p-2 rounded-[2px] bg-[var(--bg-sheet)] border border-[var(--rule-hairline)]">
                      <div className="text-[var(--ink-muted)]">Blocked Consumers</div>
                      <div className="text-sm font-bold text-[var(--ink-primary)]">
                        {bb.blockedConsumers > 0 ? (
                          <span className="text-[var(--div-danger)]">
                            {bb.blockedConsumers} waiting (Buffer Empty)
                          </span>
                        ) : (
                          '0 (None)'
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Workstation Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--rule-hairline)]">
                {/* Producer Station */}
                <div className="p-3 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px] space-y-2">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="font-bold text-[var(--ink-primary)] flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[var(--div-m4)]" /> Producer Station
                    </span>
                    <span className="text-[10px] text-[var(--ink-muted)]">
                      Next: ORD#{bb.nextItemId}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-[var(--ink-secondary)]">
                    Executes: <code>wait(empty) -&gt; wait(mutex) -&gt; push() -&gt; signal(mutex) -&gt; signal(full)</code>
                  </p>
                  <button
                    type="button"
                    onClick={() => pushBb(stepBoundedBuffer(bb, 'produce'))}
                    className="w-full py-1.5 px-3 rounded-[2px] bg-[var(--div-m3)] text-white font-mono text-xs font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                  >
                    + Produce Food Order (ORD#{bb.nextItemId})
                  </button>
                </div>

                {/* Consumer Station */}
                <div className="p-3 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px] space-y-2">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="font-bold text-[var(--ink-primary)] flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[var(--div-m5)]" /> Consumer Station
                    </span>
                    <span className="text-[10px] text-[var(--ink-muted)]">
                      Queue: {bb.buffer.length} items
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-[var(--ink-secondary)]">
                    Executes: <code>wait(full) -&gt; wait(mutex) -&gt; pop() -&gt; signal(mutex) -&gt; signal(empty)</code>
                  </p>
                  <button
                    type="button"
                    onClick={() => pushBb(stepBoundedBuffer(bb, 'consume'))}
                    className="w-full py-1.5 px-3 rounded-[2px] bg-[var(--div-m5)] text-white font-mono text-xs font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                  >
                    − Consume &amp; Dispatch Order
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. Peterson's Algorithm Stage */}
          {scenario === 'peterson' && (
            <div className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[2px] p-4.5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--rule-hairline)] pb-2.5">
                <div>
                  <h3 className="font-mono text-xs font-bold text-[var(--ink-primary)] uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-[var(--div-m2)]" />
                    Peterson&apos;s Solution (C2 Q5 Railway Reservation 10 Seats)
                  </h3>
                  <div className="font-mono text-[11px] text-[var(--ink-muted)]">
                    2-Process Software Synchronization · Mutual Exclusion, Progress, &amp; Bounded Waiting
                  </div>
                </div>
                {pet.raceCorrupted && (
                  <div className="px-2 py-0.5 rounded-[2px] bg-[var(--div-danger)] text-white font-mono text-[11px] font-bold flex items-center gap-1 animate-pulse">
                    <AlertTriangle className="w-3 h-3" /> MUTUAL EXCLUSION VIOLATED
                  </div>
                )}
              </div>

              {/* Shared Railway State & Critical Section Chamber */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 font-mono text-xs">
                {/* Shared State Hub */}
                <div className="sm:col-span-6 p-3 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px] space-y-2">
                  <div className="text-[11px] font-bold text-[var(--ink-primary)] flex justify-between">
                    <span>Shared Variables</span>
                    <span className="text-[var(--ink-muted)]">turn = {pet.turn}</span>
                  </div>

                  <div className="flex items-center gap-2 p-2 bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px]">
                    <span className="font-bold">Turn Token:</span>
                    <span
                      className={`px-2 py-0.5 rounded-[2px] font-bold text-white ${
                        pet.turn === 0 ? 'bg-[var(--div-m2)]' : 'bg-[var(--div-m4)]'
                      }`}
                    >
                      P{pet.turn} has tie-breaker priority
                    </span>
                  </div>

                  <div className="p-2 bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] flex justify-between items-center">
                    <div>
                      <span className="text-[var(--ink-muted)]">C2 Q5 Railway Seats:</span>
                      <div className="text-base font-bold text-[var(--ink-primary)]">
                        {pet.sharedSeats} remaining
                      </div>
                    </div>
                    <div className="text-right text-[10px] text-[var(--ink-muted)]">
                      2 seats / booking
                      <br />
                      Initial: 10 seats
                    </div>
                  </div>
                </div>

                {/* Critical Section Shielded Chamber */}
                <div className="sm:col-span-6 p-3 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px] flex flex-col justify-between">
                  <div className="text-[11px] font-bold text-[var(--ink-primary)] flex justify-between">
                    <span>Critical Section Chamber</span>
                    {pet.inCs[0] && pet.inCs[1] ? (
                      <span className="text-[var(--div-danger)] font-bold">RACE VIOLATION!</span>
                    ) : (
                      <span className="text-[var(--div-m3)] font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> Mutex Safe
                      </span>
                    )}
                  </div>

                  <div
                    className={`my-2 p-4 text-center rounded-[2px] border font-bold text-sm transition-all ${
                      pet.inCs[0] && pet.inCs[1]
                        ? 'bg-[var(--div-danger)] text-white border-[var(--div-danger)]'
                        : pet.inCs[0]
                          ? 'bg-[var(--div-m2)]/20 border-[var(--div-m2)] text-[var(--div-m2)]'
                          : pet.inCs[1]
                            ? 'bg-[var(--div-m4)]/20 border-[var(--div-m4)] text-[var(--div-m4)]'
                            : 'bg-[var(--bg-paper)] border-[var(--rule-hairline)] text-[var(--ink-muted)]'
                    }`}
                  >
                    {pet.inCs[0] && pet.inCs[1]
                      ? '!! BOTH P0 & P1 IN CS CONCURRENTLY !!'
                      : pet.inCs[0]
                        ? 'P0 IS EXECUTING INSIDE CS (Reserving 2 Seats)'
                        : pet.inCs[1]
                          ? 'P1 IS EXECUTING INSIDE CS (Reserving 2 Seats)'
                          : '[ CHAMBER EMPTY — CS FREE ]'}
                  </div>

                  <div className="text-[10px] text-[var(--ink-muted)] text-center">
                    Invariant: !(inCs[0] &amp;&amp; inCs[1]) holds strictly in verified mode
                  </div>
                </div>
              </div>

              {/* Dual-Process Interactive Lanes: P0 and P1 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--rule-hairline)]">
                {/* Process 0 */}
                <div className="p-3 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px] space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[var(--div-m2)]">Process P0</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-[2px] font-bold text-[10px] ${
                        pet.flag[0] ? 'bg-[var(--div-m2)] text-white' : 'bg-[var(--bg-recessed)] text-[var(--ink-muted)]'
                      }`}
                    >
                      flag[0] = {String(pet.flag[0])}
                    </span>
                  </div>

                  <div className="p-2 bg-[var(--bg-paper)] border border-[var(--rule-hairline)] text-[11px] space-y-1">
                    <div>
                      <code>while (flag[1] &amp;&amp; turn == 1);</code>
                    </div>
                    <div className="text-[10px] text-[var(--ink-muted)]">
                      Evaluates to:{' '}
                      <strong className={pet.flag[1] && pet.turn === 1 ? 'text-[var(--div-danger)]' : 'text-[var(--div-m3)]'}>
                        {pet.flag[1] && pet.turn === 1 ? 'TRUE (SPIN WAIT)' : 'FALSE (CAN ENTER CS)'}
                      </strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1">
                    <button
                      type="button"
                      onClick={() => pushPet(stepPeterson(pet, 'request-0'))}
                      disabled={pet.flag[0]}
                      className="py-1 px-1.5 rounded-[2px] bg-[var(--div-m2)] text-white font-semibold text-[11px] disabled:opacity-40"
                    >
                      1. Request
                    </button>
                    <button
                      type="button"
                      onClick={() => pushPet(stepPeterson(pet, 'enter-0'))}
                      disabled={!pet.flag[0] || pet.inCs[0]}
                      className="py-1 px-1.5 rounded-[2px] bg-[var(--ink-primary)] text-[var(--bg-paper)] font-semibold text-[11px] disabled:opacity-40"
                    >
                      2. Enter CS
                    </button>
                    <button
                      type="button"
                      onClick={() => pushPet(stepPeterson(pet, 'exit-0'))}
                      disabled={!pet.inCs[0]}
                      className="py-1 px-1.5 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-paper)] font-semibold text-[11px] disabled:opacity-40"
                    >
                      3. Exit CS
                    </button>
                  </div>
                </div>

                {/* Process 1 */}
                <div className="p-3 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px] space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[var(--div-m4)]">Process P1</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-[2px] font-bold text-[10px] ${
                        pet.flag[1] ? 'bg-[var(--div-m4)] text-white' : 'bg-[var(--bg-recessed)] text-[var(--ink-muted)]'
                      }`}
                    >
                      flag[1] = {String(pet.flag[1])}
                    </span>
                  </div>

                  <div className="p-2 bg-[var(--bg-paper)] border border-[var(--rule-hairline)] text-[11px] space-y-1">
                    <div>
                      <code>while (flag[0] &amp;&amp; turn == 0);</code>
                    </div>
                    <div className="text-[10px] text-[var(--ink-muted)]">
                      Evaluates to:{' '}
                      <strong className={pet.flag[0] && pet.turn === 0 ? 'text-[var(--div-danger)]' : 'text-[var(--div-m3)]'}>
                        {pet.flag[0] && pet.turn === 0 ? 'TRUE (SPIN WAIT)' : 'FALSE (CAN ENTER CS)'}
                      </strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1">
                    <button
                      type="button"
                      onClick={() => pushPet(stepPeterson(pet, 'request-1'))}
                      disabled={pet.flag[1]}
                      className="py-1 px-1.5 rounded-[2px] bg-[var(--div-m4)] text-white font-semibold text-[11px] disabled:opacity-40"
                    >
                      1. Request
                    </button>
                    <button
                      type="button"
                      onClick={() => pushPet(stepPeterson(pet, 'enter-1'))}
                      disabled={!pet.flag[1] || pet.inCs[1]}
                      className="py-1 px-1.5 rounded-[2px] bg-[var(--ink-primary)] text-[var(--bg-paper)] font-semibold text-[11px] disabled:opacity-40"
                    >
                      2. Enter CS
                    </button>
                    <button
                      type="button"
                      onClick={() => pushPet(stepPeterson(pet, 'exit-1'))}
                      disabled={!pet.inCs[1]}
                      className="py-1 px-1.5 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-paper)] font-semibold text-[11px] disabled:opacity-40"
                    >
                      3. Exit CS
                    </button>
                  </div>
                </div>
              </div>

              {/* 1-Click Real VIT Exam Trace */}
              <div className="p-2.5 bg-[var(--bg-sheet)] border border-[var(--div-m2)] rounded-[2px] flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
                <div>
                  <strong className="text-[var(--ink-primary)]">1-Click C2 Q5 Simultaneous Preset:</strong>
                  <div className="text-[11px] text-[var(--ink-muted)]">
                    P0 and P1 both set flags. P1 sets turn=0 last -&gt; P0 enters first!
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => pushPet(stepPeterson(pet, 'simultaneous-c2q5'))}
                  className="px-3 py-1.5 rounded-[2px] bg-[var(--div-m2)] text-white font-bold text-xs hover:opacity-90 transition-opacity"
                >
                  Run C2 Q5 Simultaneous Entry
                </button>
              </div>
            </div>
          )}

          {/* 3. Sleeping Barber Stage */}
          {scenario === 'sleeping-barber' && (
            <div className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[2px] p-4.5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--rule-hairline)] pb-2.5">
                <div>
                  <h3 className="font-mono text-xs font-bold text-[var(--ink-primary)] uppercase tracking-wider flex items-center gap-1.5">
                    <Scissors className="w-3.5 h-3.5 text-[var(--div-m5)]" />
                    Sleeping Barber Workbench (C1 Set 2-2 Q2, Chairs = 3)
                  </h3>
                  <div className="font-mono text-[11px] text-[var(--ink-muted)]">
                    Counting Semaphores (customers, barber) + Mutex · Balking on Capacity Exceeded
                  </div>
                </div>
                {barber.lostWakeup && (
                  <div className="px-2 py-0.5 rounded-[2px] bg-[var(--div-danger)] text-white font-mono text-[11px] font-bold flex items-center gap-1 animate-pulse">
                    <AlertTriangle className="w-3 h-3" /> LOST WAKEUP ANOMALY
                  </div>
                )}
              </div>

              {/* Floor Plan: Barber Chair (CS) vs Waiting Chairs (Queue) */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 font-mono text-xs">
                {/* Barber Styling Chair (Critical Section) */}
                <div className="sm:col-span-5 p-3.5 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[var(--ink-primary)] flex items-center gap-1.5">
                      <Scissors className="w-3.5 h-3.5 text-[var(--div-m5)]" /> Barber Styling Room
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded-[2px] font-bold text-[10px] uppercase ${
                        barber.barberStatus === 'cutting'
                          ? 'bg-[var(--div-m3)] text-white animate-pulse'
                          : 'bg-[var(--div-m5)] text-white'
                      }`}
                    >
                      {barber.barberStatus}
                    </span>
                  </div>

                  <div className="my-3 text-center p-3 rounded-[2px] bg-[var(--bg-paper)] border border-[var(--rule-hairline)]">
                    {barber.barberStatus === 'sleeping' ? (
                      <div className="space-y-1">
                        <div className="text-xl">😴 Zzz...</div>
                        <div className="font-bold text-[var(--ink-secondary)]">Barber is Asleep</div>
                        <div className="text-[10px] text-[var(--ink-muted)]">
                          Blocked on wait(customers)
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="text-xl">✂️ 💇</div>
                        <div className="font-bold text-[var(--div-m3)]">
                          Cutting Hair: {barber.activeCustomer}
                        </div>
                        <div className="text-[10px] text-[var(--ink-muted)]">
                          Exclusive styling chair in use
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[var(--rule-hairline)]">
                    <span>Total Served:</span>
                    <strong className="text-[var(--div-m3)]">{barber.servedCount} customers</strong>
                  </div>
                </div>

                {/* Waiting Room Chairs */}
                <div className="sm:col-span-7 p-3.5 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[var(--ink-primary)] flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[var(--ink-secondary)]" /> Waiting Room Chairs (N = {barber.waitingChairs})
                    </span>
                    <span className="text-[11px] font-bold text-[var(--ink-muted)]">
                      {barber.waitingQueue.length} / {barber.waitingChairs} Occupied
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {Array.from({ length: barber.waitingChairs }).map((_, idx) => {
                      const cust = barber.waitingQueue[idx];
                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-[2px] border text-center transition-all ${
                            cust
                              ? 'bg-[var(--div-m5)]/15 border-[var(--div-m5)] text-[var(--ink-primary)] font-bold'
                              : 'bg-[var(--bg-paper)] border-[var(--rule-hairline)] text-[var(--ink-muted)]'
                          }`}
                        >
                          <div className="text-[10px] opacity-75">Chair #{idx + 1}</div>
                          <div className="text-xs font-bold mt-1">
                            {cust ? `🧑 ${cust}` : '🪑 Empty'}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Balking / Turned Away Zone */}
                  <div className="p-2 rounded-[2px] bg-[var(--bg-paper)] border border-[var(--rule-hairline)] flex items-center justify-between text-[11px]">
                    <span className="text-[var(--ink-muted)]">Turned Away (Chairs Full / Balking):</span>
                    <span
                      className={`font-bold ${
                        barber.turnedAway > 0 ? 'text-[var(--div-danger)]' : 'text-[var(--ink-muted)]'
                      }`}
                    >
                      {barber.turnedAway} customer(s)
                    </span>
                  </div>

                  {/* Semaphores Gauge */}
                  <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                    <div className="p-1.5 rounded-[2px] bg-[var(--bg-paper)] border border-[var(--rule-hairline)]">
                      <div className="text-[var(--ink-muted)]">customers</div>
                      <div className="font-bold text-xs">{barber.customersSem}</div>
                    </div>
                    <div className="p-1.5 rounded-[2px] bg-[var(--bg-paper)] border border-[var(--rule-hairline)]">
                      <div className="text-[var(--ink-muted)]">barber</div>
                      <div className="font-bold text-xs">{barber.barberSem}</div>
                    </div>
                    <div className="p-1.5 rounded-[2px] bg-[var(--bg-paper)] border border-[var(--rule-hairline)]">
                      <div className="text-[var(--ink-muted)]">mutex</div>
                      <div className="font-bold text-xs text-[var(--div-m3)]">{barber.mutex}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Barber Shop Operational Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-[var(--rule-hairline)] font-mono text-xs">
                <button
                  type="button"
                  onClick={() => pushBarber(stepSleepingBarber(barber, 'customer-arrive'))}
                  className="py-2 px-3 rounded-[2px] bg-[var(--div-m5)] text-white font-semibold hover:opacity-90 transition-opacity"
                >
                  + Customer Arrives (C{barber.nextCustomerId})
                </button>
                <button
                  type="button"
                  onClick={() => pushBarber(stepSleepingBarber(barber, 'barber-next'))}
                  disabled={barber.activeCustomer !== null || barber.waitingQueue.length === 0}
                  className="py-2 px-3 rounded-[2px] bg-[var(--div-m3)] text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  Barber Calls Next
                </button>
                <button
                  type="button"
                  onClick={() => pushBarber(stepSleepingBarber(barber, 'finish-haircut'))}
                  disabled={barber.activeCustomer === null}
                  className="py-2 px-3 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)] text-[var(--ink-primary)] font-semibold hover:bg-[var(--bg-recessed)] disabled:opacity-40"
                >
                  Finish Haircut
                </button>
              </div>
            </div>
          )}

          {/* 4. Dining Philosophers Stage */}
          {scenario === 'dining-philosophers' && (
            <div className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[2px] p-4.5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--rule-hairline)] pb-2.5">
                <div>
                  <h3 className="font-mono text-xs font-bold text-[var(--ink-primary)] uppercase tracking-wider flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5 text-[var(--div-labs)]" />
                    Dining Philosophers Table Diagram
                  </h3>
                  <div className="font-mono text-[11px] text-[var(--ink-muted)]">
                    5 Philosophers · 5 Shared Chopsticks · Coffman Circular Wait Deadlock vs Asymmetric Fix
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => pushDp(createDiningPhilosophersState(!dp.asymmetricFix))}
                  className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-[2px] border transition-colors ${
                    dp.asymmetricFix
                      ? 'bg-[var(--div-m3)] text-white border-[var(--div-m3)]'
                      : 'bg-[var(--bg-sheet)] text-[var(--ink-primary)] border-[var(--rule-strong)]'
                  }`}
                >
                  Mode: {dp.asymmetricFix ? 'Asymmetric Fix (Safe)' : 'Naive (Deadlockable)'}
                </button>
              </div>

              {/* Deadlock Banner or Asymmetric Status */}
              {dp.deadlocked ? (
                <div className="p-3 rounded-[2px] bg-[var(--div-danger)] text-white font-mono text-xs space-y-1">
                  <div className="font-bold text-sm flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> TOTAL DEADLOCK DETECTED (CIRCULAR WAIT)!
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-95">
                    Every philosopher acquired their left chopstick and is blocked waiting for their right
                    chopstick. All 4 Coffman conditions satisfied: Mutual Exclusion, Hold &amp; Wait, No
                    Preemption, Circular Wait (P0-&gt;C1-&gt;P1-&gt;C2-&gt;P2-&gt;C3-&gt;P3-&gt;C4-&gt;P4-&gt;C0-&gt;P0).
                  </p>
                </div>
              ) : dp.asymmetricFix ? (
                <div className="p-2.5 rounded-[2px] bg-[var(--div-m3)]/15 border border-[var(--div-m3)] font-mono text-xs text-[var(--ink-primary)] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[var(--div-m3)] shrink-0" />
                  <span>
                    <strong>Asymmetric Ordering Enforced:</strong> Odd philosophers grab Left first, Even
                    grab Right first. Circular Wait condition is strictly broken!
                  </span>
                </div>
              ) : null}

              {/* Central Dining Table SVG */}
              <div className="flex flex-col items-center justify-center p-2 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px]">
                <div className="relative w-[260px] h-[260px]">
                  <svg
                    viewBox="0 0 240 240"
                    className="w-full h-full"
                    role="img"
                    aria-label="Dining Philosophers Table Diagram"
                  >
                    {/* Table Surface */}
                    <circle
                      cx="120"
                      cy="120"
                      r="65"
                      fill="var(--bg-paper)"
                      stroke="var(--rule-strong)"
                      strokeWidth="2"
                    />
                    <circle cx="120" cy="120" r="18" fill="var(--bg-recessed)" />
                    <text
                      x="120"
                      y="124"
                      textAnchor="middle"
                      fontSize="14"
                      role="img"
                      aria-label="Bowl"
                    >
                      🍜
                    </text>

                    {/* Chopsticks */}
                    {stickNodes.map((s) => {
                      const isHeld = s.owner !== null;
                      return (
                        <g key={s.index}>
                          <circle
                            cx={s.x}
                            cy={s.y}
                            r="11"
                            fill={isHeld ? 'var(--div-labs)' : 'var(--bg-sheet)'}
                            stroke={isHeld ? 'var(--div-labs)' : 'var(--rule-strong)'}
                            strokeWidth="1.5"
                          />
                          <text
                            x={s.x}
                            y={s.y + 3}
                            textAnchor="middle"
                            fontSize="8"
                            fontWeight="700"
                            fill={isHeld ? '#ffffff' : 'var(--ink-secondary)'}
                            fontFamily="var(--font-mono)"
                          >
                            C{s.index}
                          </text>
                        </g>
                      );
                    })}

                    {/* Philosophers */}
                    {philNodes.map((p) => {
                      const isEating = p.state === 'eating';
                      const isHungry = p.state === 'hungry';
                      return (
                        <g key={p.index}>
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r="20"
                            fill={
                              isEating
                                ? 'var(--div-m3)'
                                : isHungry
                                  ? 'var(--div-danger)'
                                  : 'var(--bg-paper)'
                            }
                            stroke={
                              isEating
                                ? 'var(--div-m3)'
                                : isHungry
                                  ? 'var(--div-danger)'
                                  : 'var(--rule-strong)'
                            }
                            strokeWidth="2"
                          />
                          <text
                            x={p.x}
                            y={p.y - 3}
                            textAnchor="middle"
                            fontSize="9"
                            fontWeight="800"
                            fill={isEating || isHungry ? '#ffffff' : 'var(--ink-primary)'}
                            fontFamily="var(--font-mono)"
                          >
                            P{p.index}
                          </text>
                          <text
                            x={p.x}
                            y={p.y + 8}
                            textAnchor="middle"
                            fontSize="7"
                            fontWeight="700"
                            fill={isEating || isHungry ? '#ffffff' : 'var(--ink-muted)'}
                            fontFamily="var(--font-mono)"
                          >
                            {p.state.toUpperCase()}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* Philosopher Controls */}
              <div className="space-y-2 font-mono text-xs">
                <div className="text-[11px] font-bold text-[var(--ink-secondary)]">
                  Philosophers State &amp; Direct Actions (Click to Toggle Try-Eat):
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {dp.states.map((st, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => pushDp(stepDiningPhilosophers(dp, 'try-eat', idx))}
                      className={`p-2 rounded-[2px] border text-center transition-all ${
                        st === 'eating'
                          ? 'border-[var(--div-m3)] bg-[var(--div-m3)] text-white font-bold'
                          : st === 'hungry'
                            ? 'border-[var(--div-danger)] bg-[var(--div-danger)] text-white font-bold'
                            : 'border-[var(--rule-hairline)] bg-[var(--bg-sheet)] text-[var(--ink-primary)] hover:border-[var(--rule-strong)]'
                      }`}
                    >
                      <div className="font-bold">P{idx}</div>
                      <div className="text-[9px] uppercase mt-0.5">{st}</div>
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--rule-hairline)]">
                  <button
                    type="button"
                    onClick={() => pushDp(stepDiningPhilosophers(dp, 'all-grab-first'))}
                    className="px-3 py-1.5 rounded-[2px] bg-[var(--div-danger)] text-white font-semibold hover:opacity-90 transition-opacity"
                  >
                    Simulate: All Grab 1st Chopstick
                  </button>
                  <button
                    type="button"
                    onClick={() => pushDp(stepDiningPhilosophers(dp, 'release-all'))}
                    className="px-3 py-1.5 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)] text-[var(--ink-secondary)] font-semibold hover:bg-[var(--bg-recessed)]"
                  >
                    Release All Chopsticks
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 5. Readers-Writers Stage */}
          {scenario === 'readers-writers' && (
            <div className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[2px] p-4.5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--rule-hairline)] pb-2.5">
                <div>
                  <h3 className="font-mono text-xs font-bold text-[var(--ink-primary)] uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[var(--div-m4)]" />
                    First Readers-Writers (Reader Preference)
                  </h3>
                  <div className="font-mono text-[11px] text-[var(--ink-muted)]">
                    Concurrent Readers Permitted · Exclusive Writer Lock · Starvation Risk
                  </div>
                </div>
                {rw.raceCorrupted && (
                  <div className="px-2 py-0.5 rounded-[2px] bg-[var(--div-danger)] text-white font-mono text-[11px] font-bold flex items-center gap-1 animate-pulse">
                    <AlertTriangle className="w-3 h-3" /> TORN READ / CORRUPTION
                  </div>
                )}
              </div>

              {/* Shared Database Vault */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 font-mono text-xs">
                {/* Active Readers Room */}
                <div className="sm:col-span-6 p-3 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px] space-y-2">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-[var(--div-m4)]">Readers Chamber</span>
                    <span>readCount = {rw.readCount}</span>
                  </div>
                  <div className="p-3 bg-[var(--bg-paper)] border border-[var(--rule-hairline)] min-h-[70px] rounded-[2px]">
                    <div className="text-[10px] text-[var(--ink-muted)] mb-1">Active Concurrent Readers:</div>
                    {rw.activeReaders.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {rw.activeReaders.map((r) => (
                          <span
                            key={r}
                            className="px-2 py-0.5 rounded-[2px] bg-[var(--div-m4)] text-white font-bold text-xs"
                          >
                            📖 {r}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[var(--ink-muted)] italic text-[11px]">No active readers</div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => pushRw(stepReadersWriters(rw, 'reader-enter'))}
                      className="py-1.5 px-2 rounded-[2px] bg-[var(--div-m4)] text-white font-semibold text-xs"
                    >
                      + Reader Enter
                    </button>
                    <button
                      type="button"
                      onClick={() => pushRw(stepReadersWriters(rw, 'reader-exit'))}
                      disabled={rw.activeReaders.length === 0}
                      className="py-1.5 px-2 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-paper)] font-semibold text-xs disabled:opacity-40"
                    >
                      − Reader Exit
                    </button>
                  </div>
                </div>

                {/* Exclusive Writer Room */}
                <div className="sm:col-span-6 p-3 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px] space-y-2">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-[var(--div-m2)]">Writer Room (Exclusive)</span>
                    <span>rw_mutex = {rw.rwMutex}</span>
                  </div>
                  <div className="p-3 bg-[var(--bg-paper)] border border-[var(--rule-hairline)] min-h-[70px] rounded-[2px]">
                    <div className="text-[10px] text-[var(--ink-muted)] mb-1">Active Writer (Single Owner):</div>
                    {rw.activeWriter ? (
                      <div className="px-2 py-1 rounded-[2px] bg-[var(--div-m2)] text-white font-bold text-xs inline-block">
                        ✍️ {rw.activeWriter} (Exclusive Access)
                      </div>
                    ) : (
                      <div className="text-[var(--ink-muted)] italic text-[11px]">
                        No writer inside database
                      </div>
                    )}
                    {rw.waitingWriters > 0 && (
                      <div className="text-[10px] text-[var(--div-danger)] mt-1 font-bold">
                        {rw.waitingWriters} writer(s) waiting on rw_mutex
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => pushRw(stepReadersWriters(rw, 'writer-enter'))}
                      className="py-1.5 px-2 rounded-[2px] bg-[var(--div-m2)] text-white font-semibold text-xs"
                    >
                      + Writer Enter
                    </button>
                    <button
                      type="button"
                      onClick={() => pushRw(stepReadersWriters(rw, 'writer-exit'))}
                      disabled={!rw.activeWriter}
                      className="py-1.5 px-2 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-paper)] font-semibold text-xs disabled:opacity-40"
                    >
                      − Writer Exit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ==================================================================== */}
        {/* RIGHT 5 COLUMNS: Trace Controls, Race Sim & Verified Solutions       */}
        {/* ==================================================================== */}
        <div className="lg:col-span-5 space-y-4">
          {/* 1. Step-Forward / Step-Back Trace Controls */}
          <div className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[2px] p-3.5 space-y-3">
            <div className="flex items-center justify-between font-mono text-xs border-b border-[var(--rule-hairline)] pb-2">
              <span className="font-bold text-[var(--ink-primary)] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[var(--div-m2)]" /> Trace History Navigator
              </span>
              <span className="text-[11px] font-bold text-[var(--ink-muted)]">
                Step {currentHistoryIndex + 1} / {currentHistoryLength}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 font-mono text-xs">
              <button
                type="button"
                onClick={handleRewind}
                disabled={!canStepBack}
                className="py-1.5 px-2 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)] text-[var(--ink-secondary)] hover:bg-[var(--bg-recessed)] disabled:opacity-40 flex items-center justify-center gap-1"
                aria-label="Rewind to start"
                title="Rewind to start"
              >
                <SkipBack className="w-3.5 h-3.5" /> Start
              </button>
              <button
                type="button"
                onClick={handleStepBack}
                disabled={!canStepBack}
                className="py-1.5 px-2 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)] text-[var(--ink-secondary)] hover:bg-[var(--bg-recessed)] disabled:opacity-40 flex items-center justify-center gap-1"
                aria-label="Step back"
                title="Step back to previous state"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button
                type="button"
                onClick={handleStepForward}
                disabled={!canStepForward}
                className="py-1.5 px-2 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)] text-[var(--ink-secondary)] hover:bg-[var(--bg-recessed)] disabled:opacity-40 flex items-center justify-center gap-1"
                aria-label="Step forward"
                title="Step forward in history"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="py-1.5 px-2 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)] text-[var(--ink-secondary)] hover:bg-[var(--bg-recessed)] flex items-center justify-center gap-1"
                aria-label="Reset scenario"
                title="Reset scenario state"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            </div>
          </div>

          {/* 2. Race Condition Simulation Workbench */}
          <div className="bg-[var(--bg-paper)] border border-[var(--div-danger)] rounded-[2px] p-3.5 space-y-2.5">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="font-bold text-[var(--div-danger)] flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" /> Race Condition Simulator
              </span>
              <span className="text-[10px] uppercase font-bold text-[var(--div-danger)]">
                Flawed Sync Demo
              </span>
            </div>

            <p className="font-mono text-[11px] text-[var(--ink-secondary)] leading-relaxed">
              <strong>{activeSolution.raceConditionRisk.title}:</strong>{' '}
              {activeSolution.raceConditionRisk.description}
            </p>

            <div className="pt-1">
              {scenario === 'bounded-buffer' && (
                <button
                  type="button"
                  onClick={() => pushBb(stepBoundedBuffer(bb, 'race-lost-update'))}
                  className="w-full py-1.5 px-3 rounded-[2px] bg-[var(--div-danger)] text-white font-mono text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5" /> Simulate Lost Update (Without Mutex)
                </button>
              )}

              {scenario === 'peterson' && (
                <button
                  type="button"
                  onClick={() => pushPet(stepPeterson(pet, 'race-both-enter'))}
                  className="w-full py-1.5 px-3 rounded-[2px] bg-[var(--div-danger)] text-white font-mono text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5" /> Bypass Turn (Both Enter CS Concurrently)
                </button>
              )}

              {scenario === 'sleeping-barber' && (
                <button
                  type="button"
                  onClick={() => pushBarber(stepSleepingBarber(barber, 'race-lost-wakeup'))}
                  className="w-full py-1.5 px-3 rounded-[2px] bg-[var(--div-danger)] text-white font-mono text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5" /> Simulate Lost Wakeup Deadlock
                </button>
              )}

              {scenario === 'dining-philosophers' && (
                <button
                  type="button"
                  onClick={() => {
                    const naive = createDiningPhilosophersState(false);
                    pushDp(stepDiningPhilosophers(naive, 'all-grab-first'));
                  }}
                  className="w-full py-1.5 px-3 rounded-[2px] bg-[var(--div-danger)] text-white font-mono text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5" /> Trigger Naive Circular Wait Deadlock
                </button>
              )}

              {scenario === 'readers-writers' && (
                <button
                  type="button"
                  onClick={() => pushRw(stepReadersWriters(rw, 'race-torn-read'))}
                  className="w-full py-1.5 px-3 rounded-[2px] bg-[var(--div-danger)] text-white font-mono text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5" /> Simulate Torn Read / Dirty Read
                </button>
              )}
            </div>
          </div>

          {/* 3. Live Execution Trace Log */}
          <div className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[2px] p-3.5 space-y-2">
            <div className="flex items-center justify-between font-mono text-xs border-b border-[var(--rule-hairline)] pb-1.5">
              <span className="font-bold text-[var(--ink-primary)]">
                Opcode Trace Log ({activeLog.length} steps)
              </span>
              <span className="text-[10px] text-[var(--ink-muted)]">Latest First</span>
            </div>

            <div className="max-h-44 overflow-y-auto space-y-1.5 font-mono text-xs pr-1">
              {[...activeLog].reverse().map((entry) => {
                const isDeadlock = entry.status === 'deadlock';
                const isCritical = entry.status === 'critical';
                const isBlocked = entry.status === 'blocked';
                return (
                  <div
                    key={entry.step}
                    className={`p-2 rounded-[2px] border text-[11px] space-y-0.5 ${
                      isDeadlock
                        ? 'bg-[var(--div-danger)]/15 border-[var(--div-danger)] text-[var(--div-danger)] font-bold'
                        : isCritical
                          ? 'bg-[var(--div-m3)]/15 border-[var(--div-m3)] text-[var(--ink-primary)]'
                          : isBlocked
                            ? 'bg-[var(--div-m2)]/15 border-[var(--div-m2)] text-[var(--ink-primary)]'
                            : 'bg-[var(--bg-sheet)] border-[var(--rule-hairline)] text-[var(--ink-secondary)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[var(--ink-primary)]">
                        #{entry.step} [{entry.actor}]
                      </span>
                      <span
                        className={`text-[9px] uppercase font-bold px-1 py-0.2 rounded-[1px] ${
                          isDeadlock
                            ? 'bg-[var(--div-danger)] text-white'
                            : isCritical
                              ? 'bg-[var(--div-m3)] text-white'
                              : isBlocked
                                ? 'bg-[var(--div-m2)] text-white'
                                : 'bg-[var(--bg-recessed)] text-[var(--ink-muted)]'
                        }`}
                      >
                        {entry.status}
                      </span>
                    </div>
                    <div className="font-semibold text-[10.5px]">{entry.action}</div>
                    <div className="text-[10px] opacity-80">{entry.note}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Verified Deadlock-Free Solutions & Reference Proofs */}
          <div className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[2px] p-3.5 space-y-3">
            <div className="flex items-center justify-between font-mono text-xs border-b border-[var(--rule-hairline)] pb-2">
              <span className="font-bold text-[var(--ink-primary)] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--div-m3)]" /> Verified Solution &amp;
                Proofs
              </span>
            </div>

            {/* Sub-tab picker: Code vs Proofs vs Exam Traps */}
            <div className="grid grid-cols-3 gap-1 font-mono text-xs">
              <button
                type="button"
                onClick={() => setInspectorTab('code')}
                className={`py-1 text-center rounded-[2px] border font-semibold ${
                  inspectorTab === 'code'
                    ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)]'
                    : 'bg-[var(--bg-sheet)] text-[var(--ink-secondary)] border-[var(--rule-hairline)]'
                }`}
              >
                C Code
              </button>
              <button
                type="button"
                onClick={() => setInspectorTab('proofs')}
                className={`py-1 text-center rounded-[2px] border font-semibold ${
                  inspectorTab === 'proofs'
                    ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)]'
                    : 'bg-[var(--bg-sheet)] text-[var(--ink-secondary)] border-[var(--rule-hairline)]'
                }`}
              >
                Proofs
              </button>
              <button
                type="button"
                onClick={() => setInspectorTab('traps')}
                className={`py-1 text-center rounded-[2px] border font-semibold ${
                  inspectorTab === 'traps'
                    ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)]'
                    : 'bg-[var(--bg-sheet)] text-[var(--ink-secondary)] border-[var(--rule-hairline)]'
                }`}
              >
                Exam Traps
              </button>
            </div>

            {/* Inspector Content */}
            <div className="font-mono text-xs">
              {inspectorTab === 'code' && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-[var(--ink-secondary)]">
                    {activeSolution.title} (POSIX / C Synchronization):
                  </div>
                  <pre className="p-2.5 rounded-[2px] bg-[var(--bg-desk)] text-[var(--bg-paper)] text-[10.5px] leading-relaxed overflow-x-auto">
                    <code>{activeSolution.codeSnippet}</code>
                  </pre>
                  <div className="space-y-1 pt-1 text-[10.5px]">
                    <div className="font-bold text-[var(--ink-primary)]">Semaphores Initialized:</div>
                    {activeSolution.semaphores.map((sem) => (
                      <div
                        key={sem.name}
                        className="p-1 rounded-[2px] bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] flex justify-between"
                      >
                        <code>{sem.name} = {sem.init}</code>
                        <span className="text-[var(--ink-muted)] text-[10px]">{sem.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {inspectorTab === 'proofs' && (
                <div className="space-y-2.5 text-[11px] text-[var(--ink-secondary)] leading-relaxed">
                  <div className="p-2 rounded-[2px] bg-[var(--bg-sheet)] border border-[var(--rule-hairline)]">
                    <strong className="text-[var(--ink-primary)] block mb-0.5">
                      1. Mutual Exclusion:
                    </strong>
                    {activeSolution.proofs.mutualExclusion}
                  </div>
                  <div className="p-2 rounded-[2px] bg-[var(--bg-sheet)] border border-[var(--rule-hairline)]">
                    <strong className="text-[var(--ink-primary)] block mb-0.5">2. Progress:</strong>
                    {activeSolution.proofs.progress}
                  </div>
                  <div className="p-2 rounded-[2px] bg-[var(--bg-sheet)] border border-[var(--rule-hairline)]">
                    <strong className="text-[var(--ink-primary)] block mb-0.5">
                      3. Bounded Waiting:
                    </strong>
                    {activeSolution.proofs.boundedWaiting}
                  </div>
                </div>
              )}

              {inspectorTab === 'traps' && (
                <div className="space-y-2 text-[11px] leading-relaxed">
                  <div className="p-2.5 rounded-[2px] bg-[var(--div-m2)]/10 border border-[var(--div-m2)]">
                    <strong className="text-[var(--div-m2)] block mb-1">
                      Exam Reference: {activeSolution.examTag}
                    </strong>
                    <p className="text-[var(--ink-secondary)]">{activeSolution.problemSummary}</p>
                  </div>

                  <div className="p-2.5 rounded-[2px] bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] space-y-1">
                    <strong className="text-[var(--ink-primary)] block">
                      Common VIT Exam Pitfall:
                    </strong>
                    <p className="text-[var(--ink-muted)]">
                      {activeSolution.raceConditionRisk.prevention}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
