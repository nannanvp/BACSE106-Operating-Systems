export type SchedulingAlgorithm =
  | 'FCFS'
  | 'SJF'
  | 'SRTF'
  | 'NP_PRIORITY'
  | 'P_PRIORITY'
  | 'RR';

export interface ProcessInput {
  id: string;
  arrival: number;
  burst: number;
  priority: number; // 1 = highest priority
}

export interface GanttSegment {
  label: string; // process id, 'CS', or 'IDLE'
  kind: 'process' | 'cs' | 'idle';
  start: number;
  end: number;
}

export interface ProcessMetrics {
  id: string;
  arrival: number;
  burst: number;
  priority: number;
  firstStart: number;
  completion: number;
  turnaround: number;
  waiting: number;
  response: number;
}

export interface CpuScheduleResult {
  algorithm: SchedulingAlgorithm;
  quantum: number;
  csOverhead: number;
  gantt: GanttSegment[];
  processes: ProcessMetrics[];
  avgTurnaround: number;
  avgWaiting: number;
  avgResponse: number;
  totalTime: number;
  totalBurst: number;
  totalCsTime: number;
  totalCsCount: number;
  totalIdleTime: number;
  cpuUtilization: number;
}

export interface CpuSchedulerPreset {
  id: string;
  label: string;
  source: string;
  algorithm: SchedulingAlgorithm;
  quantum: number;
  csOverhead: number;
  processes: ProcessInput[];
}

export const CPU_SCHEDULER_PRESETS: CpuSchedulerPreset[] = [
  {
    id: 'c1-2-2-q5',
    label: 'C1 Set 2-2 Q5 — Preemptive Priority (1 ms CS)',
    source: 'VIT Chennai FAT Slot C1+TC1 Set 2-2 (15M)',
    algorithm: 'P_PRIORITY',
    quantum: 4,
    csOverhead: 1,
    processes: [
      { id: 'P1', arrival: 0, burst: 9, priority: 6 },
      { id: 'P2', arrival: 1, burst: 5, priority: 4 },
      { id: 'P3', arrival: 3, burst: 8, priority: 7 },
      { id: 'P4', arrival: 4, burst: 4, priority: 2 },
      { id: 'P5', arrival: 6, burst: 6, priority: 5 },
      { id: 'P6', arrival: 8, burst: 3, priority: 1 },
      { id: 'P7', arrival: 10, burst: 7, priority: 3 },
      { id: 'P8', arrival: 12, burst: 5, priority: 4 },
      { id: 'P9', arrival: 19, burst: 2, priority: 1 },
      { id: 'P10', arrival: 17, burst: 4, priority: 2 },
    ],
  },
  {
    id: 'c1-1-2-q2',
    label: 'C1 Set 1-2 Q2 — Non-Preemptive Priority',
    source: 'VIT Chennai FAT Slot C1 Set 1-2 (10M)',
    algorithm: 'NP_PRIORITY',
    quantum: 4,
    csOverhead: 0,
    processes: [
      { id: 'P1', arrival: 0, burst: 7, priority: 3 },
      { id: 'P2', arrival: 1, burst: 5, priority: 1 },
      { id: 'P3', arrival: 2, burst: 4, priority: 4 },
      { id: 'P4', arrival: 3, burst: 3, priority: 2 },
      { id: 'P5', arrival: 5, burst: 6, priority: 5 },
    ],
  },
  {
    id: 'c2-q3-rr',
    label: 'C2 Q3 — 3D Printer Round Robin (q = 10)',
    source: 'VIT Chennai FAT Slot C2+TC2 (10M)',
    algorithm: 'RR',
    quantum: 10,
    csOverhead: 0,
    processes: [
      { id: 'S1', arrival: 0, burst: 25, priority: 1 },
      { id: 'S2', arrival: 5, burst: 35, priority: 1 },
      { id: 'S3', arrival: 10, burst: 15, priority: 1 },
      { id: 'S4', arrival: 15, burst: 45, priority: 1 },
    ],
  },
  {
    id: 'c2-q3-fcfs',
    label: 'C2 Q3 — 3D Printer FCFS Comparison',
    source: 'VIT Chennai FAT Slot C2+TC2 (10M)',
    algorithm: 'FCFS',
    quantum: 10,
    csOverhead: 0,
    processes: [
      { id: 'S1', arrival: 0, burst: 25, priority: 1 },
      { id: 'S2', arrival: 5, burst: 35, priority: 1 },
      { id: 'S3', arrival: 10, burst: 15, priority: 1 },
      { id: 'S4', arrival: 15, burst: 45, priority: 1 },
    ],
  },
  {
    id: 'silberschatz-srtf',
    label: 'Silberschatz Ch 5 — SRTF Preemptive SJF',
    source: 'Silberschatz 10th Ed. Ch 5 Benchmark',
    algorithm: 'SRTF',
    quantum: 4,
    csOverhead: 0,
    processes: [
      { id: 'P1', arrival: 0, burst: 8, priority: 2 },
      { id: 'P2', arrival: 1, burst: 4, priority: 1 },
      { id: 'P3', arrival: 2, burst: 9, priority: 3 },
      { id: 'P4', arrival: 3, burst: 5, priority: 2 },
    ],
  },
];

function pushSegment(gantt: GanttSegment[], seg: GanttSegment): void {
  if (seg.end <= seg.start) return;
  const last = gantt[gantt.length - 1];
  if (last && last.kind === seg.kind && last.label === seg.label && last.end === seg.start) {
    last.end = seg.end;
  } else {
    gantt.push({ ...seg });
  }
}

export function runCpuSchedule(
  inputs: ProcessInput[],
  algorithm: SchedulingAlgorithm,
  quantum = 4,
  csOverhead = 0
): CpuScheduleResult {
  const safeQuantum = Math.max(1, Math.floor(quantum));
  const safeCs = Math.max(0, Math.floor(csOverhead));

  if (inputs.length === 0) {
    return {
      algorithm,
      quantum: safeQuantum,
      csOverhead: safeCs,
      gantt: [],
      processes: [],
      avgTurnaround: 0,
      avgWaiting: 0,
      avgResponse: 0,
      totalTime: 0,
      totalBurst: 0,
      totalCsTime: 0,
      totalCsCount: 0,
      totalIdleTime: 0,
      cpuUtilization: 0,
    };
  }

  interface RuntimeProc extends ProcessInput {
    order: number;
    remaining: number;
    firstStart: number | null;
    completion: number;
  }

  const procs: RuntimeProc[] = inputs.map((p, idx) => ({
    ...p,
    arrival: Math.max(0, Math.floor(p.arrival)),
    burst: Math.max(1, Math.floor(p.burst)),
    priority: Math.max(1, Math.floor(p.priority)),
    order: idx,
    remaining: Math.max(1, Math.floor(p.burst)),
    firstStart: null,
    completion: 0,
  }));

  const gantt: GanttSegment[] = [];
  let time = 0;
  let completed = 0;
  let totalCsTime = 0;
  let totalCsCount = 0;
  let totalIdleTime = 0;
  let lastProcessId: string | null = null;
  let wasIdle = true;

  const pickNonPreemptive = (ready: RuntimeProc[]): RuntimeProc => {
    const sorted = [...ready].sort((a, b) => {
      if (algorithm === 'FCFS') {
        return a.arrival - b.arrival || a.order - b.order;
      }
      if (algorithm === 'SJF') {
        return a.burst - b.burst || a.arrival - b.arrival || a.order - b.order;
      }
      // NP_PRIORITY: lower priority number = higher priority; equal priority -> FCFS
      return a.priority - b.priority || a.arrival - b.arrival || a.order - b.order;
    });
    return sorted[0];
  };

  if (algorithm === 'FCFS' || algorithm === 'SJF' || algorithm === 'NP_PRIORITY') {
    while (completed < procs.length) {
      const ready = procs.filter((p) => p.remaining > 0 && p.arrival <= time);
      if (ready.length === 0) {
        const nextArrival = Math.min(...procs.filter((p) => p.remaining > 0).map((p) => p.arrival));
        pushSegment(gantt, { label: 'IDLE', kind: 'idle', start: time, end: nextArrival });
        totalIdleTime += nextArrival - time;
        time = nextArrival;
        wasIdle = true;
        continue;
      }
      const next = pickNonPreemptive(ready);
      if (safeCs > 0 && !wasIdle && lastProcessId !== null && lastProcessId !== next.id) {
        pushSegment(gantt, { label: 'CS', kind: 'cs', start: time, end: time + safeCs });
        totalCsTime += safeCs;
        totalCsCount += 1;
        time += safeCs;
      }
      if (next.firstStart === null) next.firstStart = time;
      pushSegment(gantt, { label: next.id, kind: 'process', start: time, end: time + next.remaining });
      time += next.remaining;
      next.remaining = 0;
      next.completion = time;
      completed += 1;
      lastProcessId = next.id;
      wasIdle = false;
    }
  } else if (algorithm === 'RR') {
    const queue: RuntimeProc[] = [];
    const arrivedSet = new Set<string>();
    const byArrival = [...procs].sort((a, b) => a.arrival - b.arrival || a.order - b.order);

    const enqueueArrived = (upToTime: number) => {
      for (const p of byArrival) {
        if (p.arrival <= upToTime && !arrivedSet.has(p.id)) {
          queue.push(p);
          arrivedSet.add(p.id);
        }
      }
    };

    enqueueArrived(time);

    while (completed < procs.length) {
      if (queue.length === 0) {
        const nextArrival = Math.min(...procs.filter((p) => p.remaining > 0).map((p) => p.arrival));
        pushSegment(gantt, { label: 'IDLE', kind: 'idle', start: time, end: nextArrival });
        totalIdleTime += nextArrival - time;
        time = nextArrival;
        wasIdle = true;
        enqueueArrived(time);
        continue;
      }

      const current = queue.shift()!;

      if (safeCs > 0 && !wasIdle && lastProcessId !== null && lastProcessId !== current.id) {
        pushSegment(gantt, { label: 'CS', kind: 'cs', start: time, end: time + safeCs });
        totalCsTime += safeCs;
        totalCsCount += 1;
        time += safeCs;
        enqueueArrived(time);
      }

      if (current.firstStart === null) current.firstStart = time;
      const slice = Math.min(safeQuantum, current.remaining);
      pushSegment(gantt, { label: current.id, kind: 'process', start: time, end: time + slice });
      time += slice;
      current.remaining -= slice;

      // Standard RR rule: newly arrived processes at or before `time` join queue before preempted process re-enters
      enqueueArrived(time);

      if (current.remaining === 0) {
        current.completion = time;
        completed += 1;
      } else {
        queue.push(current);
      }
      lastProcessId = current.id;
      wasIdle = false;
    }
  } else {
    // Preemptive: SRTF or P_PRIORITY
    // Explicit discrete event/tick simulation (1-unit ticks) cleanly handles CS overhead
    // and guarantees arrivals during CS are considered when dispatching next process.
    let current: RuntimeProc | null = null;

    const pickPreemptive = (ready: RuntimeProc[], running: RuntimeProc | null): RuntimeProc => {
      const sorted = [...ready].sort((a, b) => {
        if (algorithm === 'SRTF') {
          return a.remaining - b.remaining || a.arrival - b.arrival || a.order - b.order;
        }
        // P_PRIORITY: lower priority number = higher priority; equal priority -> FCFS (no preemption)
        return a.priority - b.priority || a.arrival - b.arrival || a.order - b.order;
      });
      const best = sorted[0];
      // Do not preempt if running process ties the best metric (equal priority / equal remaining)
      if (running && running.remaining > 0) {
        if (algorithm === 'P_PRIORITY' && best.priority === running.priority) {
          return running;
        }
        if (algorithm === 'SRTF' && best.remaining === running.remaining) {
          return running;
        }
      }
      return best;
    };

    while (completed < procs.length) {
      const ready = procs.filter((p) => p.remaining > 0 && p.arrival <= time);
      if (ready.length === 0) {
        const nextArrival = Math.min(...procs.filter((p) => p.remaining > 0).map((p) => p.arrival));
        pushSegment(gantt, { label: 'IDLE', kind: 'idle', start: time, end: nextArrival });
        totalIdleTime += nextArrival - time;
        time = nextArrival;
        current = null;
        wasIdle = true;
        continue;
      }

      let chosen = pickPreemptive(ready, current);

      // Context switch occurs when transitioning from a previous process to a different process
      // (excluded for initial dispatch and when waking from IDLE; final completion exits loop).
      if (safeCs > 0 && !wasIdle && lastProcessId !== null && chosen.id !== lastProcessId) {
        pushSegment(gantt, { label: 'CS', kind: 'cs', start: time, end: time + safeCs });
        totalCsTime += safeCs;
        totalCsCount += 1;
        time += safeCs;
        current = null;
        // Re-evaluate ready queue AFTER CS finishes ("arrivals during CS are considered")
        const readyAfterCs = procs.filter((p) => p.remaining > 0 && p.arrival <= time);
        chosen = pickPreemptive(readyAfterCs, null);
      }

      current = chosen;
      if (current.firstStart === null) current.firstStart = time;

      // Run for 1 time unit so preemptions on exact arrival ticks are detected immediately
      pushSegment(gantt, { label: current.id, kind: 'process', start: time, end: time + 1 });
      time += 1;
      current.remaining -= 1;
      lastProcessId = current.id;
      wasIdle = false;

      if (current.remaining === 0) {
        current.completion = time;
        completed += 1;
        current = null;
      }
    }
  }

  const metrics: ProcessMetrics[] = procs.map((p) => {
    const firstStart = p.firstStart ?? p.arrival;
    const turnaround = p.completion - p.arrival;
    const waiting = turnaround - p.burst;
    const response = firstStart - p.arrival;
    return {
      id: p.id,
      arrival: p.arrival,
      burst: p.burst,
      priority: p.priority,
      firstStart,
      completion: p.completion,
      turnaround,
      waiting,
      response,
    };
  });

  const n = metrics.length;
  const totalBurst = metrics.reduce((acc, m) => acc + m.burst, 0);
  const avgTurnaround = Number((metrics.reduce((acc, m) => acc + m.turnaround, 0) / n).toFixed(2));
  const avgWaiting = Number((metrics.reduce((acc, m) => acc + m.waiting, 0) / n).toFixed(2));
  const avgResponse = Number((metrics.reduce((acc, m) => acc + m.response, 0) / n).toFixed(2));
  const totalTime = gantt.length > 0 ? gantt[gantt.length - 1].end : 0;
  const cpuUtilization = totalTime > 0 ? Number(((totalBurst / totalTime) * 100).toFixed(2)) : 0;

  return {
    algorithm,
    quantum: safeQuantum,
    csOverhead: safeCs,
    gantt,
    processes: metrics,
    avgTurnaround,
    avgWaiting,
    avgResponse,
    totalTime,
    totalBurst,
    totalCsTime,
    totalCsCount,
    totalIdleTime,
    cpuUtilization,
  };
}
