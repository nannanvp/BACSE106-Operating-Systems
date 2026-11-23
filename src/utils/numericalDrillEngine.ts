import { mulberry32 } from './confettiEngine';
import { runCpuSchedule } from './cpuSchedulerEngine';
import { runPageReplacement, computePagingTlb, runContiguousPlacement } from './memoryPagingEngine';
import { runDiskSchedule } from './diskRaidEngine';

export type DrillArchetype =
  | 'cpu-avg-wt'
  | 'tlb-eat'
  | 'demand-paging-eat'
  | 'page-faults'
  | 'bankers-available'
  | 'disk-movement'
  | 'placement-free';

export interface NumericalDrillProblem {
  id: string;
  archetype: DrillArchetype;
  moduleId: string;
  moduleCode: string;
  topicId: string;
  title: string;
  prompt: string;
  unit: string;
  expectedAnswer: number;
  tolerance: number;
  steps: string[];
}

export const DRILL_ARCHETYPES: Array<{ id: DrillArchetype; label: string; moduleCode: string }> = [
  { id: 'cpu-avg-wt', label: 'CPU Scheduling Avg WT', moduleCode: 'M2' },
  { id: 'bankers-available', label: "Banker's Need/Available Sum", moduleCode: 'M2' },
  { id: 'tlb-eat', label: 'Paging + TLB EAT', moduleCode: 'M4' },
  { id: 'demand-paging-eat', label: 'Demand Paging EAT', moduleCode: 'M4' },
  { id: 'page-faults', label: 'Page Replacement Faults', moduleCode: 'M4' },
  { id: 'placement-free', label: 'Contiguous Placement Free KB', moduleCode: 'M4' },
  { id: 'disk-movement', label: 'Disk Head Movement', moduleCode: 'M5' },
];

export function generateDrillProblem(
  archetype: DrillArchetype,
  seed: number
): NumericalDrillProblem {
  const rng = mulberry32(seed);
  const randInt = (min: number, max: number) => min + Math.floor(rng() * (max - min + 1));

  switch (archetype) {
    case 'cpu-avg-wt': {
      const algos = ['FCFS', 'SJF', 'RR'] as const;
      const algo = algos[randInt(0, algos.length - 1)];
      const q = randInt(3, 6);
      const procs = [
        { id: 'P1', arrival: 0, burst: randInt(4, 10), priority: 2 },
        { id: 'P2', arrival: randInt(1, 3), burst: randInt(3, 9), priority: 1 },
        { id: 'P3', arrival: randInt(2, 5), burst: randInt(2, 8), priority: 3 },
        { id: 'P4', arrival: randInt(4, 7), burst: randInt(3, 7), priority: 2 },
      ];
      const res = runCpuSchedule(procs, algo, q, 0);
      const tableDesc = procs.map((p) => `${p.id}(AT=${p.arrival}, BT=${p.burst})`).join(', ');
      return {
        id: `drill-${archetype}-${seed}`,
        archetype,
        moduleId: 'm2',
        moduleCode: 'M2',
        topicId: algo === 'RR' ? 'm2-preemptive-scheduling' : 'm2-nonpreemptive-scheduling',
        title: `CPU Scheduling (${algo}${algo === 'RR' ? `, q=${q}` : ''}) — Average Waiting Time`,
        prompt: `Compute the Average Waiting Time (ms) for ${tableDesc} using ${algo}${
          algo === 'RR' ? ` with time quantum q = ${q} ms` : ''
        } (0 ms CS overhead). Round to 2 decimals.`,
        unit: 'ms',
        expectedAnswer: res.avgWaiting,
        tolerance: 0.05,
        steps: [
          `Gantt: ${res.gantt.map((g) => `${g.label}[${g.start}–${g.end}]`).join(' -> ')}`,
          ...res.processes.map(
            (p) => `${p.id}: CT=${p.completion}, TAT=${p.turnaround}, WT=${p.waiting}`
          ),
          `Avg WT = (${res.processes.map((p) => p.waiting).join(' + ')}) / ${res.processes.length} = ${res.avgWaiting} ms`,
        ],
      };
    }

    case 'tlb-eat': {
      const tlbNs = randInt(1, 4) * 5; // 5..20 ns
      const ramNs = randInt(8, 16) * 10; // 80..160 ns
      const hitPct = [75, 80, 85, 90, 95][randInt(0, 4)];
      const res = computePagingTlb({
        vasKB: 64,
        ramKB: 16,
        pageSizeKB: 1,
        tlbNs,
        ramNs,
        hitRatioPercent: hitPct,
      });
      return {
        id: `drill-${archetype}-${seed}`,
        archetype,
        moduleId: 'm4',
        moduleCode: 'M4',
        topicId: 'm4-paging-tlb',
        title: 'Paging with TLB — Effective Access Time (EAT)',
        prompt: `A paged memory system has TLB lookup time = ${tlbNs} ns, main memory access time = ${ramNs} ns, and TLB hit ratio = ${hitPct}%. Compute the Effective Access Time (EAT) in ns.`,
        unit: 'ns',
        expectedAnswer: res.eatNs,
        tolerance: 0.1,
        steps: [
          `Hit time = T_tlb + T_mem = ${tlbNs} + ${ramNs} = ${res.hitAccessNs} ns`,
          `Miss time = T_tlb + 2 * T_mem = ${tlbNs} + ${2 * ramNs} = ${res.missAccessNs} ns`,
          `EAT = (${hitPct / 100})(${res.hitAccessNs}) + (${(100 - hitPct) / 100})(${res.missAccessNs}) = ${res.eatNs} ns`,
        ],
      };
    }

    case 'demand-paging-eat': {
      const ma = [100, 120, 150, 200][randInt(0, 3)];
      const pfMs = [4, 5, 8, 10][randInt(0, 3)];
      const pDenom = [10000, 20000, 50000, 100000][randInt(0, 3)];
      const p = 1 / pDenom;
      const pfNs = pfMs * 1_000_000;
      const eat = Number(((1 - p) * ma + p * pfNs).toFixed(2));
      return {
        id: `drill-${archetype}-${seed}`,
        archetype,
        moduleId: 'm4',
        moduleCode: 'M4',
        topicId: 'm4-virtual-memory',
        title: 'Demand Paging — Effective Access Time',
        prompt: `Memory access time ma = ${ma} ns, average page-fault service time = ${pfMs} ms, and 1 out of every ${pDenom.toLocaleString()} memory accesses causes a page fault. Calculate EAT in ns (round to 2 decimals).`,
        unit: 'ns',
        expectedAnswer: eat,
        tolerance: 0.5,
        steps: [
          `Convert page-fault time: ${pfMs} ms = ${pfNs.toLocaleString()} ns`,
          `Fault probability p = 1 / ${pDenom} = ${p}`,
          `EAT = (1 - ${p}) * ${ma} + ${p} * ${pfNs} = ${eat} ns`,
        ],
      };
    }

    case 'page-faults': {
      const algos = ['FIFO', 'LRU', 'OPT'] as const;
      const algo = algos[randInt(0, 2)];
      const frames = randInt(3, 4);
      const refStr = Array.from({ length: 12 }, () => randInt(1, 6));
      const res = runPageReplacement(refStr, frames, algo);
      return {
        id: `drill-${archetype}-${seed}`,
        archetype,
        moduleId: 'm4',
        moduleCode: 'M4',
        topicId: 'm4-page-replacement',
        title: `Page Replacement (${algo}) — Total Page Faults`,
        prompt: `With ${frames} empty frames and reference string [${refStr.join(', ')}], how many total page faults occur under ${algo}${
          algo === 'OPT' ? ' (tie-break: earliest loaded)' : ''
        }?`,
        unit: 'faults',
        expectedAnswer: res.faults,
        tolerance: 0,
        steps: [
          `Trace (H=Hit, F=Fault): ${res.steps.map((s) => `${s.page}:${s.hit ? 'H' : 'F'}`).join(' ')}`,
          `Total Faults = ${res.faults}, Total Hits = ${res.hits} (Fault Rate = ${res.faultRate}%)`,
        ],
      };
    }

    case 'bankers-available': {
      const total = [randInt(8, 12), randInt(6, 10), randInt(7, 11)];
      const alloc = [
        [randInt(1, 2), randInt(0, 2), randInt(1, 2)],
        [randInt(1, 3), randInt(1, 2), randInt(0, 2)],
        [randInt(1, 2), randInt(1, 2), randInt(1, 2)],
        [randInt(0, 2), randInt(0, 1), randInt(1, 2)],
      ];
      const sumAlloc = [0, 1, 2].map((j) => alloc.reduce((acc, row) => acc + row[j], 0));
      const avail = total.map((t, j) => t - sumAlloc[j]);
      const sumAvail = avail.reduce((a, b) => a + b, 0);
      return {
        id: `drill-${archetype}-${seed}`,
        archetype,
        moduleId: 'm2',
        moduleCode: 'M2',
        topicId: 'm2-deadlock-handling',
        title: "Banker's Algorithm — Total Available Units (A+B+C)",
        prompt: `System total resources = (A=${total[0]}, B=${total[1]}, C=${total[2]}). Allocations: P0(${alloc[0].join(',')}), P1(${alloc[1].join(',')}), P2(${alloc[2].join(',')}), P3(${alloc[3].join(',')}). Compute Available = (A,B,C) and enter the SUM A + B + C of available instances.`,
        unit: 'instances',
        expectedAnswer: sumAvail,
        tolerance: 0,
        steps: [
          `Total Allocated = (${sumAlloc.join(', ')})`,
          `Available = Total - Allocated = (${avail.join(', ')})`,
          `Sum of Available instances = ${avail.join(' + ')} = ${sumAvail}`,
        ],
      };
    }

    case 'disk-movement': {
      const algos = ['FCFS', 'SSTF', 'SCAN', 'LOOK', 'C-LOOK'] as const;
      const algo = algos[randInt(0, algos.length - 1)];
      const head = randInt(40, 140);
      const dir = randInt(0, 1) === 0 ? 'up' : 'down';
      const reqs = Array.from({ length: 6 }, () => randInt(10, 190));
      const res = runDiskSchedule({
        algorithm: algo,
        minTrack: 0,
        maxTrack: 199,
        initialHead: head,
        direction: dir,
        requests: reqs,
      });
      return {
        id: `drill-${archetype}-${seed}`,
        archetype,
        moduleId: 'm5',
        moduleCode: 'M5',
        topicId: 'm5-disk-scheduling',
        title: `Disk Scheduling (${algo}) — Total Head Movement`,
        prompt: `Disk cylinders 0–199, initial head at ${head} (moving ${
          dir === 'up' ? 'upward toward 199' : 'downward toward 0'
        }), request queue [${reqs.join(', ')}]. Compute total head movement (cylinders) using ${algo}.`,
        unit: 'cylinders',
        expectedAnswer: res.totalHeadMovement,
        tolerance: 0,
        steps: [
          `Service order: ${res.sequence.join(' -> ')}`,
          `Step distances: ${res.steps.map((s) => `|${s.to}-${s.from}|=${s.distance}`).join(' + ')}`,
          `Total Head Movement = ${res.totalHeadMovement} cylinders`,
        ],
      };
    }

    case 'placement-free': {
      const algos = ['FIRST_FIT', 'BEST_FIT', 'WORST_FIT'] as const;
      const algo = algos[randInt(0, 2)];
      const blocks = [randInt(15, 25) * 10, randInt(30, 50) * 10, randInt(20, 35) * 10, randInt(40, 55) * 10];
      const procs = [
        { id: 'P1', size: randInt(12, 24) * 10 },
        { id: 'P2', size: randInt(25, 40) * 10 },
        { id: 'P3', size: randInt(15, 30) * 10 },
      ];
      const res = runContiguousPlacement(blocks, procs, algo);
      const algoName = algo.replace('_', ' ');
      return {
        id: `drill-${archetype}-${seed}`,
        archetype,
        moduleId: 'm4',
        moduleCode: 'M4',
        topicId: 'm4-contiguous-allocation',
        title: `Contiguous Placement (${algoName}) — Largest Remaining Free Block`,
        prompt: `Free blocks [${blocks.join(', ')}] KB receive requests ${procs
          .map((p) => `${p.id}=${p.size} KB`)
          .join(', ')} using ${algoName} (remainder stays in place). What is the LARGEST remaining contiguous free block (KB)?`,
        unit: 'KB',
        expectedAnswer: res.largestContiguousBlock,
        tolerance: 0,
        steps: [
          ...res.steps.map((s) =>
            s.allocatedBlockIndex !== null
              ? `${s.processId} (${s.processSize} KB) -> Block #${s.allocatedBlockIndex + 1} (${s.blockSizeBefore} KB), rem ${s.remainderAfter} KB`
              : `${s.processId} (${s.processSize} KB) -> UNALLOCATED`
          ),
          `Final free blocks: [${res.finalBlocks.join(', ')}] KB -> Largest = ${res.largestContiguousBlock} KB`,
        ],
      };
    }
  }
}

export function gradeNumericalAnswer(
  userInput: string,
  expected: number,
  tolerance: number
): { validNumber: boolean; correct: boolean; delta: number } {
  const cleaned = userInput.trim().replace(/,/g, '');
  const parsed = Number(cleaned);
  if (!cleaned || !Number.isFinite(parsed)) {
    return { validNumber: false, correct: false, delta: Infinity };
  }
  const delta = Math.abs(parsed - expected);
  return {
    validNumber: true,
    correct: delta <= tolerance + 1e-9,
    delta: Number(delta.toFixed(4)),
  };
}
