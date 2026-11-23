import { mulberry32 } from './confettiEngine';
import { runCpuSchedule } from './cpuSchedulerEngine';
import { runBankersSafety } from './bankersEngine';
import {
  runPageReplacement,
  computePagingTlb,
  runContiguousPlacement,
  evaluateWorkingSet,
} from './memoryPagingEngine';
import { runDiskSchedule } from './diskRaidEngine';

export type DrillArchetype =
  | 'cpu-avg-wt'
  | 'bankers-need'
  | 'demand-paging-eat'
  | 'working-set-window'
  | 'unix-inode-max-file-size'
  | 'disk-rotational-latency'
  | 'bankers-need-vector'
  | 'tlb-eat'
  | 'page-faults'
  | 'bankers-available'
  | 'disk-movement'
  | 'placement-free';

export type DrillCategory = DrillArchetype;

export interface DrillArchetypeMeta {
  id: DrillArchetype;
  label: string;
  moduleCode: string;
  moduleId: 'm1' | 'm2' | 'm3' | 'm4' | 'm5';
  fatTag: string;
  targetSeconds: number;
  matchingLab: 'cpu' | 'bankers' | 'sync' | 'memory' | 'disk';
}

export interface NumericalDrillProblem {
  id: string;
  seed: number;
  archetype: DrillArchetype;
  category: DrillArchetype;
  categoryLabel: string;
  moduleId: 'm1' | 'm2' | 'm3' | 'm4' | 'm5';
  moduleCode: string;
  moduleLabel: string;
  topicId: string;
  fatTag: string;
  targetSeconds: number;
  title: string;
  prompt: string;
  givenBlock: string;
  questionLine: string;
  unit: string;
  unitHint?: string;
  expectedAnswer: number;
  expectedDisplay: string;
  tolerance: number;
  rubricSteps: string[];
  steps: string[];
  matchingLab: 'cpu' | 'bankers' | 'sync' | 'memory' | 'disk';
  inputKind: 'number' | 'text' | 'choice';
  choices?: string[];
}

export interface NumericalGradeResult {
  validNumber: boolean;
  correct: boolean;
  delta: number;
  normalizedInput: string;
  expectedDisplay: string;
  feedback: string;
}

export type DrillGradeResult = NumericalGradeResult;

export const DRILL_ARCHETYPES: DrillArchetypeMeta[] = [
  {
    id: 'cpu-avg-wt',
    label: 'CPU Average Waiting Time',
    moduleCode: 'M2',
    moduleId: 'm2',
    fatTag: 'C1 Set 2-2 Q5 · 10M Gantt Trace',
    targetSeconds: 150,
    matchingLab: 'cpu',
  },
  {
    id: 'bankers-need',
    label: "Banker's Need Vector",
    moduleCode: 'M2',
    moduleId: 'm2',
    fatTag: 'C1 Set 1-2 Q8 · 15M Safety Matrix',
    targetSeconds: 120,
    matchingLab: 'bankers',
  },
  {
    id: 'demand-paging-eat',
    label: 'Demand Paging EAT',
    moduleCode: 'M4',
    moduleId: 'm4',
    fatTag: 'C2 Q8 · 10M Effective Access Time',
    targetSeconds: 120,
    matchingLab: 'memory',
  },
  {
    id: 'working-set-window',
    label: 'Working Set Window',
    moduleCode: 'M4',
    moduleId: 'm4',
    fatTag: 'C1 Set 1-2 Q6 · 10M Thrashing Model',
    targetSeconds: 90,
    matchingLab: 'memory',
  },
  {
    id: 'unix-inode-max-file-size',
    label: 'Unix Inode Max File Size',
    moduleCode: 'M4',
    moduleId: 'm4',
    fatTag: 'FAT Q28 · 10M Multi-Level Inode',
    targetSeconds: 120,
    matchingLab: 'memory',
  },
  {
    id: 'disk-rotational-latency',
    label: 'Disk Rotational Latency',
    moduleCode: 'M5',
    moduleId: 'm5',
    fatTag: 'C1 Set 1-2 Q9 · 15M Geometry & Latency',
    targetSeconds: 90,
    matchingLab: 'disk',
  },
];

export const DRILL_CATEGORIES = DRILL_ARCHETYPES;

function pick<T>(rng: () => number, items: readonly T[]): T {
  const idx = Math.floor(rng() * items.length);
  return items[Math.min(idx, items.length - 1)];
}

export function generateDrillProblem(
  archetype: DrillArchetype,
  seed: number
): NumericalDrillProblem {
  const rng = mulberry32(seed * 7919 + 17);
  const randInt = (min: number, max: number) => min + Math.floor(rng() * (max - min + 1));

  switch (archetype) {
    case 'cpu-avg-wt': {
      const algos = ['FCFS', 'SJF', 'RR'] as const;
      const algo = algos[randInt(0, algos.length - 1)];
      const q = randInt(2, 4);
      const procs = [
        { id: 'P1', arrival: 0, burst: randInt(4, 8), priority: 2 },
        { id: 'P2', arrival: randInt(1, 3), burst: randInt(3, 7), priority: 1 },
        { id: 'P3', arrival: randInt(2, 4), burst: randInt(2, 6), priority: 3 },
        { id: 'P4', arrival: randInt(3, 6), burst: randInt(3, 8), priority: 2 },
      ];
      const res = runCpuSchedule(procs, algo, q, 0);
      const given = [
        `Algorithm            : ${algo}${algo === 'RR' ? ` (Quantum q = ${q} ms)` : ''}`,
        `Context Switch Cost  : 0 ms overhead`,
        '',
        'Process | Arrival Time (AT) | Burst Time (BT)',
        '---------------------------------------------',
        ...procs.map((p) => `${p.id.padEnd(7)} | ${String(p.arrival).padEnd(17)} | ${p.burst} ms`),
      ].join('\n');

      const steps = [
        `[2M] Gantt Chart Order: ${res.gantt.map((g) => `${g.label}[${g.start}–${g.end}ms]`).join(' → ')}`,
        `[3M] Completion Times (CT): ${res.processes.map((p) => `${p.id}: CT=${p.completion}`).join(', ')}`,
        `[2M] Turnaround Times (TAT = CT - AT): ${res.processes.map((p) => `${p.id}: ${p.completion}-${p.arrival}=${p.turnaround}ms`).join(', ')}`,
        `[2M] Waiting Times (WT = TAT - BT): ${res.processes.map((p) => `${p.id}: ${p.turnaround}-${p.burst}=${p.waiting}ms`).join(', ')}`,
        `[1M] Average WT = (${res.processes.map((p) => p.waiting).join(' + ')}) / ${res.processes.length} = ${res.avgWaiting} ms`,
      ];

      return {
        id: `drill-cpu-avg-wt-${seed}`,
        seed,
        archetype: 'cpu-avg-wt',
        category: 'cpu-avg-wt',
        categoryLabel: 'CPU Average Waiting Time',
        moduleId: 'm2',
        moduleCode: 'M2',
        moduleLabel: 'Module 2',
        topicId: algo === 'RR' ? 'm2-preemptive-scheduling' : 'm2-nonpreemptive-scheduling',
        fatTag: 'C1 Set 2-2 Q5 · 10M Gantt Trace',
        targetSeconds: 150,
        title: `CPU Scheduling (${algo}${algo === 'RR' ? `, q=${q}ms` : ''}) — Average Waiting Time`,
        prompt: `Compute the Average Waiting Time (ms) for the 4 processes scheduled using ${algo}${
          algo === 'RR' ? ` with time quantum q = ${q} ms` : ''
        } under 0 ms context switch overhead. Round to 2 decimal places.`,
        givenBlock: given,
        questionLine: 'Compute the Average Waiting Time (ms) of the schedule. Round to 2 decimals.',
        unit: 'ms',
        unitHint: 'Average Waiting Time in ms',
        expectedAnswer: res.avgWaiting,
        expectedDisplay: `${res.avgWaiting} ms`,
        tolerance: 0.05,
        rubricSteps: steps,
        steps,
        matchingLab: 'cpu',
        inputKind: 'number',
      };
    }

    case 'bankers-need':
    case 'bankers-need-vector': {
      const resourceNames = ['A', 'B', 'C'];
      const processIds = ['P0', 'P1', 'P2', 'P3'];
      const allocation = [
        [randInt(1, 3), randInt(0, 2), randInt(1, 2)],
        [randInt(1, 2), randInt(1, 3), randInt(0, 2)],
        [randInt(2, 4), randInt(1, 2), randInt(1, 3)],
        [randInt(0, 2), randInt(0, 2), randInt(1, 2)],
      ];
      const max = allocation.map((row) => row.map((a) => a + randInt(1, 4)));
      const totalResources = [randInt(10, 14), randInt(8, 12), randInt(9, 14)];

      const safety = runBankersSafety({
        resourceNames,
        totalResources,
        processIds,
        allocation,
        max,
      });

      const targetIdx = randInt(0, processIds.length - 1);
      const targetPid = processIds[targetIdx];
      const targetNeed = safety.need[targetIdx];
      const sumNeed = targetNeed.reduce((acc, v) => acc + v, 0);

      const given = [
        'System Configuration: 4 Processes (P0–P3), 3 Resource Types (A, B, C)',
        '',
        'Process | Allocation (A B C) | Max Demand (A B C)',
        '------------------------------------------------',
        ...processIds.map(
          (pid, idx) =>
            `${pid.padEnd(7)} | ${allocation[idx].join(' ')}                | ${max[idx].join(' ')}`
        ),
      ].join('\n');

      const steps = [
        `[3M] Banker's Need Vector formula: Need[i][j] = Max[i][j] - Allocation[i][j] for every resource j.`,
        `[4M] Full Need Matrix computed for all processes:`,
        ...processIds.map(
          (pid, idx) =>
            `     ${pid}: [${max[idx].join(', ')}] - [${allocation[idx].join(', ')}] = [${safety.need[idx].join(', ')}]`
        ),
        `[2M] Target process ${targetPid} Need Vector = [${targetNeed.join(', ')}] (Need_A=${targetNeed[0]}, Need_B=${targetNeed[1]}, Need_C=${targetNeed[2]}).`,
        `[1M] Sum of Need vector components for ${targetPid} = ${targetNeed[0]} + ${targetNeed[1]} + ${targetNeed[2]} = ${sumNeed} instances.`,
      ];

      return {
        id: `drill-bankers-need-${seed}`,
        seed,
        archetype: 'bankers-need',
        category: 'bankers-need',
        categoryLabel: "Banker's Need Vector",
        moduleId: 'm2',
        moduleCode: 'M2',
        moduleLabel: 'Module 2',
        topicId: 'm2-deadlock-handling',
        fatTag: 'C1 Set 1-2 Q8 · 15M Safety Matrix',
        targetSeconds: 120,
        title: `Banker's Algorithm — Need Vector Calculation for ${targetPid}`,
        prompt: `Calculate the Need Matrix for the given processes (Need = Max - Allocation). Determine the Need Vector for process ${targetPid} and enter the SUM of its components (Need_A + Need_B + Need_C).`,
        givenBlock: given,
        questionLine: `For process ${targetPid}, calculate its Need Vector [Need_A, Need_B, Need_C] and enter the sum: Need_A + Need_B + Need_C.`,
        unit: 'instances',
        unitHint: `Sum of Need vector for ${targetPid} (integer)`,
        expectedAnswer: sumNeed,
        expectedDisplay: `${sumNeed} instances (Need: [${targetNeed.join(', ')}])`,
        tolerance: 0,
        rubricSteps: steps,
        steps,
        matchingLab: 'bankers',
        inputKind: 'number',
      };
    }

    case 'demand-paging-eat': {
      const ma = pick(rng, [80, 100, 120, 150, 200]);
      const pfMs = pick(rng, [4, 5, 8, 10]);
      const pDenom = pick(rng, [10000, 20000, 50000, 100000]);
      const p = 1 / pDenom;
      const pfNs = pfMs * 1_000_000;
      const eat = Number(((1 - p) * ma + p * pfNs).toFixed(2));

      const given = [
        `Normal Memory Access Time (ma)    = ${ma} ns`,
        `Page Fault Service Time (PFST)     = ${pfMs} ms (${pfNs.toLocaleString()} ns)`,
        `Page Fault Rate (p)                = 1 fault per ${pDenom.toLocaleString()} accesses (p = ${p})`,
      ].join('\n');

      const steps = [
        `[2M] Identify Demand Paging EAT formula: EAT = (1 - p) * ma + p * PFST.`,
        `[2M] Standardize units to nanoseconds (ns): ${pfMs} ms = ${pfMs} * 10^6 ns = ${pfNs.toLocaleString()} ns.`,
        `[2M] Fault probability: p = 1 / ${pDenom.toLocaleString()} = ${p}.`,
        `[2M] Substitute values: EAT = (1 - ${p}) * ${ma} + (${p}) * ${pfNs.toLocaleString()} ns.`,
        `[2M] Evaluation: Normal hit access = ${((1 - p) * ma).toFixed(3)} ns, Fault penalty = ${(p * pfNs).toFixed(3)} ns ⇒ EAT = ${eat} ns.`,
      ];

      return {
        id: `drill-demand-paging-eat-${seed}`,
        seed,
        archetype: 'demand-paging-eat',
        category: 'demand-paging-eat',
        categoryLabel: 'Demand Paging EAT',
        moduleId: 'm4',
        moduleCode: 'M4',
        moduleLabel: 'Module 4',
        topicId: 'm4-virtual-memory',
        fatTag: 'C2 Q8 · 10M Effective Access Time',
        targetSeconds: 120,
        title: 'Demand Paging — Effective Access Time (EAT) Calculation',
        prompt: `A virtual memory system using demand paging has memory access time ma = ${ma} ns, page-fault service time = ${pfMs} ms, and 1 out of every ${pDenom.toLocaleString()} memory accesses causes a page fault. Calculate the Effective Access Time (EAT) in nanoseconds (ns).`,
        givenBlock: given,
        questionLine: 'Compute the Effective Access Time (EAT) in ns. Round to 2 decimal places.',
        unit: 'ns',
        unitHint: 'EAT in ns',
        expectedAnswer: eat,
        expectedDisplay: `${eat} ns`,
        tolerance: 0.5,
        rubricSteps: steps,
        steps,
        matchingLab: 'memory',
        inputKind: 'number',
      };
    }

    case 'working-set-window': {
      const delta = pick(rng, [3, 4, 5, 6]);
      const refStr = Array.from({ length: 14 }, () => randInt(1, 6));
      const t = randInt(delta + 2, refStr.length);
      const wsSnapshots = evaluateWorkingSet(refStr, delta);
      const snap = wsSnapshots[t - 1];
      const wss = snap.wss;

      const given = [
        'Reference Sequence (1-based index : Page):',
        refStr.map((page, idx) => `${String(idx + 1).padStart(2)}: P${page}`).join('  |  '),
        '',
        `Working-Set Window Delta (Δ) : ${delta} references`,
        `Evaluation Time Point (t)     : Reference #${t} (Page ${refStr[t - 1]})`,
      ].join('\n');

      const steps = [
        `[3M] Define Working Set Window at t = ${t} with Δ = ${delta}: interval [max(1, ${t} - ${delta} + 1), ${t}] = [${Math.max(1, t - delta + 1)}, ${t}].`,
        `[3M] Pages referenced in window slice: [${snap.window.join(', ')}].`,
        `[2M] Distinct pages in the working set: WS(${t}) = {${snap.workingSet.join(', ')}}.`,
        `[2M] Working Set Size WSS(${t}) = |WS(${t})| = ${wss} distinct pages.`,
      ];

      return {
        id: `drill-working-set-window-${seed}`,
        seed,
        archetype: 'working-set-window',
        category: 'working-set-window',
        categoryLabel: 'Working Set Window',
        moduleId: 'm4',
        moduleCode: 'M4',
        moduleLabel: 'Module 4',
        topicId: 'm4-thrashing-ws',
        fatTag: 'C1 Set 1-2 Q6 · 10M Thrashing Model',
        targetSeconds: 90,
        title: `Working-Set Model — Working Set Size WSS(t = ${t})`,
        prompt: `Under Peter Denning's working-set model with parameter Δ = ${delta}, determine the Working Set Size WSS(t) at reference time t = ${t} for the given page reference string.`,
        givenBlock: given,
        questionLine: `What is the Working Set Size WSS at reference #${t} (number of distinct pages in window of size Δ = ${delta})?`,
        unit: 'pages',
        unitHint: 'Number of distinct pages (integer)',
        expectedAnswer: wss,
        expectedDisplay: `${wss} pages ({${snap.workingSet.join(', ')}})`,
        tolerance: 0,
        rubricSteps: steps,
        steps,
        matchingLab: 'memory',
        inputKind: 'number',
      };
    }

    case 'unix-inode-max-file-size': {
      const blockSizeBytes = pick(rng, [2048, 4096, 8192]);
      const pointerSizeBytes = 4;
      const directPointers = 12;
      const k = blockSizeBytes / pointerSizeBytes;
      const askType = pick(rng, ['double_gb', 'single_mb', 'pointers_k'] as const);

      const blockSizeKB = blockSizeBytes / 1024;
      const singleIndirectKB = k * blockSizeKB;
      const singleIndirectMB = singleIndirectKB / 1024;
      const doubleIndirectKB = k * k * blockSizeKB;
      const doubleIndirectGB = doubleIndirectKB / (1024 * 1024);

      const given = [
        'Unix Combined Multi-Level Inode Architecture:',
        `  Direct Block Pointers           : ${directPointers}`,
        '  Single Indirect Pointer         : 1',
        '  Double Indirect Pointer         : 1',
        '  Triple Indirect Pointer         : 1',
        `  Disk Block Size (B)             : ${blockSizeBytes} bytes (${blockSizeKB} KB)`,
        `  Disk Block Pointer Size (P)     : ${pointerSizeBytes} bytes`,
      ].join('\n');

      let questionLine = '';
      let expectedAnswer = 0;
      let unit = '';
      let unitHint = '';
      let expectedDisplay = '';
      let steps: string[] = [];

      if (askType === 'double_gb') {
        questionLine = `Compute the maximum data storage capacity (in Gigabytes, GB) addressed SOLELY through the 1 Double Indirect pointer.`;
        expectedAnswer = doubleIndirectGB;
        unit = 'GB';
        unitHint = 'Capacity in GB (e.g. 4 or 32)';
        expectedDisplay = `${doubleIndirectGB} GB`;
        steps = [
          `[3M] Pointers per disk block K = BlockSize / PointerSize = ${blockSizeBytes} B / ${pointerSizeBytes} B = ${k} pointers (2^${Math.log2(k)}).`,
          `[2M] Double Indirect block contains ${k} block pointers, each pointing to an indirect block of ${k} data pointers.`,
          `[3M] Total data blocks addressed = K^2 = ${k}^2 = ${(k * k).toLocaleString()} blocks.`,
          `[2M] Data capacity in GB = (${(k * k).toLocaleString()} blocks * ${blockSizeKB} KB) / (1024 * 1024 KB/GB) = ${doubleIndirectGB} GB.`,
        ];
      } else if (askType === 'single_mb') {
        questionLine = `Compute the maximum data storage capacity (in Megabytes, MB) addressed SOLELY through the 1 Single Indirect pointer.`;
        expectedAnswer = singleIndirectMB;
        unit = 'MB';
        unitHint = 'Capacity in MB (e.g. 1, 4, 16)';
        expectedDisplay = `${singleIndirectMB} MB`;
        steps = [
          `[3M] Pointers per disk block K = BlockSize / PointerSize = ${blockSizeBytes} B / ${pointerSizeBytes} B = ${k} pointers.`,
          `[3M] Single Indirect block directly addresses K = ${k} data blocks.`,
          `[2M] Data capacity in KB = ${k} * ${blockSizeKB} KB = ${singleIndirectKB.toLocaleString()} KB.`,
          `[2M] Data capacity in MB = ${singleIndirectKB.toLocaleString()} KB / 1024 KB/MB = ${singleIndirectMB} MB.`,
        ];
      } else {
        questionLine = `Compute the number of disk block pointers (K) that fit in a single disk block (K = BlockSize / PointerSize).`;
        expectedAnswer = k;
        unit = 'pointers';
        unitHint = 'Number of pointers (integer)';
        expectedDisplay = `${k} pointers`;
        steps = [
          `[4M] Formula: Block pointer capacity K = Disk Block Size (B) / Pointer Size (P).`,
          `[4M] Calculation: K = ${blockSizeBytes} bytes / ${pointerSizeBytes} bytes = ${k} pointers per block.`,
          `[2M] Conclude: K = ${k} pointers (allowing single indirect = ${k} blocks, double indirect = ${k}^2 = ${(k * k).toLocaleString()} blocks).`,
        ];
      }

      return {
        id: `drill-unix-inode-${seed}`,
        seed,
        archetype: 'unix-inode-max-file-size',
        category: 'unix-inode-max-file-size',
        categoryLabel: 'Unix Inode Max File Size',
        moduleId: 'm4',
        moduleCode: 'M4',
        moduleLabel: 'Module 4',
        topicId: 'm4-file-allocation',
        fatTag: 'FAT Q28 · 10M Multi-Level Inode',
        targetSeconds: 120,
        title: 'Unix Inode Multi-Level Indexing — Capacity Calculation',
        prompt: `Analyze the Unix inode combined indexing scheme (12 direct + single + double + triple indirect) with ${blockSizeKB} KB blocks and ${pointerSizeBytes}-byte disk addresses.`,
        givenBlock: given,
        questionLine,
        unit,
        unitHint,
        expectedAnswer,
        expectedDisplay,
        tolerance: 0,
        rubricSteps: steps,
        steps,
        matchingLab: 'memory',
        inputKind: 'number',
      };
    }

    case 'disk-rotational-latency': {
      const rpm = pick(rng, [3600, 4800, 5400, 6000, 7200, 10000, 15000]);
      const seekMs = pick(rng, [4, 5, 6, 8, 9]);
      const askKind = pick(rng, ['latency_only', 'access_time'] as const);

      const fullRotMs = 60000 / rpm;
      const rotLatencyMs = Number((fullRotMs / 2).toFixed(2));
      const avgAccessMs = Number((seekMs + rotLatencyMs).toFixed(2));

      const given = [
        'Magnetic Hard Disk Geometry & Timing Specifications:',
        `  Spindle Rotational Speed        : ${rpm.toLocaleString()} RPM`,
        `  Average Head Seek Time          : ${seekMs} ms`,
        '  Track Data Transfer Time        : negligible (0 ms)',
      ].join('\n');

      let questionLine = '';
      let expectedAnswer = 0;
      let expectedDisplay = '';
      let steps: string[] = [];

      if (askKind === 'latency_only') {
        questionLine = `Compute the Average Rotational Latency (ms) for this hard disk platter spinning at ${rpm.toLocaleString()} RPM. Round to 2 decimal places.`;
        expectedAnswer = rotLatencyMs;
        expectedDisplay = `${rotLatencyMs} ms`;
        steps = [
          `[3M] Rotational frequency: ${rpm.toLocaleString()} RPM / 60 = ${(rpm / 60).toFixed(2)} revolutions per second.`,
          `[3M] Time for one full 360° spindle revolution: T_rev = 60,000 ms / ${rpm.toLocaleString()} RPM = ${fullRotMs.toFixed(3)} ms.`,
          `[2M] Average rotational latency is half of one revolution (180° average delay): Latency = T_rev / 2 = 30,000 / ${rpm.toLocaleString()} = ${rotLatencyMs} ms.`,
          `[2M] Final Answer: Average Rotational Latency = ${rotLatencyMs} ms.`,
        ];
      } else {
        questionLine = `Compute the Total Average Disk Access Time (Seek Time + Average Rotational Latency) in milliseconds (ms). Round to 2 decimal places.`;
        expectedAnswer = avgAccessMs;
        expectedDisplay = `${avgAccessMs} ms`;
        steps = [
          `[3M] Full rotation time: T_rev = 60,000 ms / ${rpm.toLocaleString()} RPM = ${fullRotMs.toFixed(3)} ms.`,
          `[2M] Average Rotational Latency = T_rev / 2 = ${rotLatencyMs} ms.`,
          `[3M] Average Seek Time = ${seekMs} ms.`,
          `[2M] Total Average Access Time = Seek Time + Rotational Latency = ${seekMs} ms + ${rotLatencyMs} ms = ${avgAccessMs} ms.`,
        ];
      }

      return {
        id: `drill-disk-rotational-latency-${seed}`,
        seed,
        archetype: 'disk-rotational-latency',
        category: 'disk-rotational-latency',
        categoryLabel: 'Disk Rotational Latency',
        moduleId: 'm5',
        moduleCode: 'M5',
        moduleLabel: 'Module 5',
        topicId: 'm5-disk-scheduling',
        fatTag: 'C1 Set 1-2 Q9 · 15M Geometry & Latency',
        targetSeconds: 90,
        title: `Magnetic Disk Drive — Rotational Latency & Access Time (${rpm} RPM)`,
        prompt: `Given a hard disk drive with spindle speed ${rpm.toLocaleString()} RPM and average seek time ${seekMs} ms, calculate the precise timing metric.`,
        givenBlock: given,
        questionLine,
        unit: 'ms',
        unitHint: 'Time in ms (e.g. 5.00 or 10.17)',
        expectedAnswer,
        expectedDisplay,
        tolerance: 0.05,
        rubricSteps: steps,
        steps,
        matchingLab: 'disk',
        inputKind: 'number',
      };
    }

    // Retain legacy archetypes for full backwards compatibility
    case 'tlb-eat': {
      const tlbNs = randInt(1, 4) * 5;
      const ramNs = randInt(8, 16) * 10;
      const hitPct = [75, 80, 85, 90, 95][randInt(0, 4)];
      const res = computePagingTlb({
        vasKB: 64,
        ramKB: 16,
        pageSizeKB: 1,
        tlbNs,
        ramNs,
        hitRatioPercent: hitPct,
      });
      const steps = [
        `Hit time = T_tlb + T_mem = ${tlbNs} + ${ramNs} = ${res.hitAccessNs} ns`,
        `Miss time = T_tlb + 2 * T_mem = ${tlbNs} + ${2 * ramNs} = ${res.missAccessNs} ns`,
        `EAT = (${hitPct / 100})(${res.hitAccessNs}) + (${(100 - hitPct) / 100})(${res.missAccessNs}) = ${res.eatNs} ns`,
      ];
      return {
        id: `drill-${archetype}-${seed}`,
        seed,
        archetype,
        category: archetype,
        categoryLabel: 'Paging + TLB EAT',
        moduleId: 'm4',
        moduleCode: 'M4',
        moduleLabel: 'Module 4',
        topicId: 'm4-paging-tlb',
        fatTag: 'C2 Q8 · 10M Paging & TLB',
        targetSeconds: 120,
        title: 'Paging with TLB — Effective Access Time (EAT)',
        prompt: `A paged memory system has TLB lookup time = ${tlbNs} ns, main memory access time = ${ramNs} ns, and TLB hit ratio = ${hitPct}%. Compute the Effective Access Time (EAT) in ns.`,
        givenBlock: `TLB Lookup Time = ${tlbNs} ns\nRAM Access Time = ${ramNs} ns\nTLB Hit Ratio = ${hitPct}%`,
        questionLine: 'Compute EAT in ns.',
        unit: 'ns',
        unitHint: 'EAT in ns',
        expectedAnswer: res.eatNs,
        expectedDisplay: `${res.eatNs} ns`,
        tolerance: 0.1,
        rubricSteps: steps,
        steps,
        matchingLab: 'memory',
        inputKind: 'number',
      };
    }

    case 'page-faults': {
      const algos = ['FIFO', 'LRU', 'OPT'] as const;
      const algo = algos[randInt(0, 2)];
      const frames = randInt(3, 4);
      const refStr = Array.from({ length: 12 }, () => randInt(1, 6));
      const res = runPageReplacement(refStr, frames, algo);
      const steps = [
        `Trace (H=Hit, F=Fault): ${res.steps.map((s) => `${s.page}:${s.hit ? 'H' : 'F'}`).join(' ')}`,
        `Total Faults = ${res.faults}, Total Hits = ${res.hits} (Fault Rate = ${res.faultRate}%)`,
      ];
      return {
        id: `drill-${archetype}-${seed}`,
        seed,
        archetype,
        category: archetype,
        categoryLabel: 'Page Replacement Faults',
        moduleId: 'm4',
        moduleCode: 'M4',
        moduleLabel: 'Module 4',
        topicId: 'm4-page-replacement',
        fatTag: 'C1 Set 2-2 Q6 · 10M Page Replacement',
        targetSeconds: 150,
        title: `Page Replacement (${algo}) — Total Page Faults`,
        prompt: `With ${frames} empty frames and reference string [${refStr.join(', ')}], how many total page faults occur under ${algo}${
          algo === 'OPT' ? ' (tie-break: earliest loaded)' : ''
        }?`,
        givenBlock: `Algorithm = ${algo}\nFrames = ${frames}\nReference String = [${refStr.join(', ')}]`,
        questionLine: `Enter total page faults under ${algo}.`,
        unit: 'faults',
        unitHint: 'Total page faults (integer)',
        expectedAnswer: res.faults,
        expectedDisplay: `${res.faults} faults`,
        tolerance: 0,
        rubricSteps: steps,
        steps,
        matchingLab: 'memory',
        inputKind: 'number',
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
      const steps = [
        `Total Allocated = (${sumAlloc.join(', ')})`,
        `Available = Total - Allocated = (${avail.join(', ')})`,
        `Sum of Available instances = ${avail.join(' + ')} = ${sumAvail}`,
      ];
      return {
        id: `drill-${archetype}-${seed}`,
        seed,
        archetype,
        category: archetype,
        categoryLabel: "Banker's Available Sum",
        moduleId: 'm2',
        moduleCode: 'M2',
        moduleLabel: 'Module 2',
        topicId: 'm2-deadlock-handling',
        fatTag: 'C1 Set 1-2 Q8 · 15M Safety Matrix',
        targetSeconds: 120,
        title: "Banker's Algorithm — Total Available Units (A+B+C)",
        prompt: `System total resources = (A=${total[0]}, B=${total[1]}, C=${total[2]}). Allocations: P0(${alloc[0].join(',')}), P1(${alloc[1].join(',')}), P2(${alloc[2].join(',')}), P3(${alloc[3].join(',')}). Compute Available = (A,B,C) and enter the SUM A + B + C of available instances.`,
        givenBlock: `Total: (${total.join(', ')})\nP0: (${alloc[0].join(', ')})\nP1: (${alloc[1].join(', ')})\nP2: (${alloc[2].join(', ')})\nP3: (${alloc[3].join(', ')})`,
        questionLine: 'Compute the sum of available instances A + B + C.',
        unit: 'instances',
        unitHint: 'Available instances sum (integer)',
        expectedAnswer: sumAvail,
        expectedDisplay: `${sumAvail} instances`,
        tolerance: 0,
        rubricSteps: steps,
        steps,
        matchingLab: 'bankers',
        inputKind: 'number',
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
      const steps = [
        `Service order: ${res.sequence.join(' -> ')}`,
        `Step distances: ${res.steps.map((s) => `|${s.to}-${s.from}|=${s.distance}`).join(' + ')}`,
        `Total Head Movement = ${res.totalHeadMovement} cylinders`,
      ];
      return {
        id: `drill-${archetype}-${seed}`,
        seed,
        archetype,
        category: archetype,
        categoryLabel: 'Disk Head Movement',
        moduleId: 'm5',
        moduleCode: 'M5',
        moduleLabel: 'Module 5',
        topicId: 'm5-disk-scheduling',
        fatTag: 'C2 Q9 · 10M Disk Scheduling',
        targetSeconds: 120,
        title: `Disk Scheduling (${algo}) — Total Head Movement`,
        prompt: `Disk cylinders 0–199, initial head at ${head} (moving ${
          dir === 'up' ? 'upward toward 199' : 'downward toward 0'
        }), request queue [${reqs.join(', ')}]. Compute total head movement (cylinders) using ${algo}.`,
        givenBlock: `Initial Head = ${head} (${dir})\nRequests = [${reqs.join(', ')}]`,
        questionLine: `Compute total head movement in cylinders.`,
        unit: 'cylinders',
        unitHint: 'Head movement (cylinders)',
        expectedAnswer: res.totalHeadMovement,
        expectedDisplay: `${res.totalHeadMovement} cylinders`,
        tolerance: 0,
        rubricSteps: steps,
        steps,
        matchingLab: 'disk',
        inputKind: 'number',
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
      const steps = [
        ...res.steps.map((s) =>
          s.allocatedBlockIndex !== null
            ? `${s.processId} (${s.processSize} KB) -> Block #${s.allocatedBlockIndex + 1} (${s.blockSizeBefore} KB), rem ${s.remainderAfter} KB`
            : `${s.processId} (${s.processSize} KB) -> UNALLOCATED`
        ),
        `Final free blocks: [${res.finalBlocks.join(', ')}] KB -> Largest = ${res.largestContiguousBlock} KB`,
      ];
      return {
        id: `drill-${archetype}-${seed}`,
        seed,
        archetype,
        category: archetype,
        categoryLabel: 'Contiguous Placement',
        moduleId: 'm4',
        moduleCode: 'M4',
        moduleLabel: 'Module 4',
        topicId: 'm4-contiguous-allocation',
        fatTag: 'C1 Set 2-2 Q8 · 10M Contiguous Allocation',
        targetSeconds: 120,
        title: `Contiguous Placement (${algoName}) — Largest Remaining Free Block`,
        prompt: `Free blocks [${blocks.join(', ')}] KB receive requests ${procs
          .map((p) => `${p.id}=${p.size} KB`)
          .join(', ')} using ${algoName} (remainder stays in place). What is the LARGEST remaining contiguous free block (KB)?`,
        givenBlock: `Blocks = [${blocks.join(', ')}] KB\nRequests = ${procs.map((p) => `${p.id}:${p.size}KB`).join(', ')}`,
        questionLine: 'What is the LARGEST remaining contiguous free block in KB?',
        unit: 'KB',
        unitHint: 'Largest block (KB)',
        expectedAnswer: res.largestContiguousBlock,
        expectedDisplay: `${res.largestContiguousBlock} KB`,
        tolerance: 0,
        rubricSteps: steps,
        steps,
        matchingLab: 'memory',
        inputKind: 'number',
      };
    }
  }
}

export function gradeNumericalAnswer(
  userInput: string,
  expected: number,
  tolerance: number,
  unitHint?: string
): NumericalGradeResult {
  let cleaned = (userInput ?? '').trim().replace(/,/g, '');
  cleaned = cleaned.replace(/[a-zA-Z%]+$/, '').trim();
  const parsed = Number(cleaned);

  const unitSuffix = unitHint ? ` ${unitHint}` : '';
  const expectedDisplay = `${expected}${unitSuffix}`;

  if (!cleaned || !Number.isFinite(parsed)) {
    return {
      validNumber: false,
      correct: false,
      delta: Infinity,
      normalizedInput: (userInput ?? '').trim(),
      expectedDisplay,
      feedback: 'Please enter a valid numeric value (e.g. 12.5 or 4).',
    };
  }

  const delta = Math.abs(parsed - expected);
  const correct = delta <= tolerance + 1e-9;

  return {
    validNumber: true,
    correct,
    delta: Number(delta.toFixed(4)),
    normalizedInput: String(parsed),
    expectedDisplay,
    feedback: correct
      ? `FULL MARKS — EXACT MATCH within tolerance (±${tolerance}${unitSuffix}). Entered ${parsed}${unitSuffix}, expected ${expected}${unitSuffix}.`
      : `CHECK STEPS — Entered ${parsed}${unitSuffix}, expected ${expected}${unitSuffix} (delta: ${delta.toFixed(4)}, tolerance: ±${tolerance}). Review the derivation steps below!`,
  };
}

export function gradeDrillAnswer(
  problem: NumericalDrillProblem,
  userInput: string
): NumericalGradeResult {
  return gradeNumericalAnswer(
    userInput,
    problem.expectedAnswer,
    problem.tolerance,
    problem.unit
  );
}

export const generateNumericalProblem = generateDrillProblem;
