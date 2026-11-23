export interface BankersInput {
  resourceNames: string[];
  totalResources: number[];
  processIds: string[];
  allocation: number[][];
  max: number[][];
}

export interface SafetyTraceStep {
  step: number;
  processIndex: number;
  processId: string;
  need: number[];
  workBefore: number[];
  allocation: number[];
  workAfter: number[];
}

export interface BankersSafetyResult {
  totalAllocated: number[];
  available: number[];
  need: number[][];
  isSafe: boolean;
  safeSequence: string[];
  trace: SafetyTraceStep[];
  unfinishedProcesses: string[];
  error?: string;
}

export interface ResourceRequestResult {
  processIndex: number;
  processId: string;
  request: number[];
  exceedsNeed: boolean;
  exceedsAvailable: boolean;
  granted: boolean;
  reason: string;
  postRequestSafety?: BankersSafetyResult;
  step1Pass?: boolean;
  step2Pass?: boolean;
  step3Pass?: boolean;
}

export interface RagEdge {
  from: string;
  to: string;
  type: 'request' | 'assignment'; // P->R is request, R->P is assignment
}

export interface RagAnalysisResult {
  waitForEdges: Array<{ from: string; to: string; viaResource: string }>;
  hasCycle: boolean;
  cycleNodes: string[];
  deadlockedProcesses: string[];
  waitingProcesses: string[];
}

export interface BankersPreset {
  id: string;
  label: string;
  source: string;
  input: BankersInput;
  sampleRequest?: { processIndex: number; request: number[]; label: string };
}

export const BANKERS_PRESETS: BankersPreset[] = [
  {
    id: 'c1-2-2-q7',
    label: 'C1 Set 2-2 Q7 — 6 Processes, 4 Resources (A–D)',
    source: 'VIT Chennai FAT Slot C1+TC1 Set 2-2 (15M)',
    input: {
      resourceNames: ['A', 'B', 'C', 'D'],
      totalResources: [7, 5, 5, 4],
      processIds: ['P0', 'P1', 'P2', 'P3', 'P4', 'P5'],
      allocation: [
        [1, 0, 0, 1],
        [1, 1, 0, 0],
        [1, 1, 1, 0],
        [0, 1, 1, 1],
        [2, 0, 0, 1],
        [0, 1, 2, 0],
      ],
      max: [
        [2, 1, 0, 2],
        [2, 2, 0, 1],
        [2, 2, 3, 1],
        [1, 2, 2, 2],
        [3, 1, 1, 2],
        [1, 2, 3, 1],
      ],
    },
    sampleRequest: {
      processIndex: 2,
      request: [0, 0, 1, 0],
      label: 'Q7(c): Request2 = (0, 0, 1, 0)',
    },
  },
  {
    id: 'c1-1-2-q8',
    label: 'C1 Set 1-2 Q8 — 4 Processes, 3 Resources (A–C)',
    source: 'VIT Chennai FAT Slot C1 Set 1-2 (15M)',
    input: {
      resourceNames: ['A', 'B', 'C'],
      totalResources: [6, 4, 5],
      processIds: ['P0', 'P1', 'P2', 'P3'],
      allocation: [
        [1, 0, 1],
        [1, 1, 0],
        [1, 1, 1],
        [0, 0, 1],
      ],
      max: [
        [3, 2, 2],
        [2, 2, 1],
        [4, 2, 2],
        [2, 1, 2],
      ],
    },
    sampleRequest: {
      processIndex: 0,
      request: [1, 0, 0],
      label: 'Test Request0 = (1, 0, 0)',
    },
  },
  {
    id: 'silberschatz-ch8',
    label: 'Silberschatz Ch 8 — Classic 5 Processes (A=10, B=5, C=7)',
    source: 'Silberschatz 10th Ed. Ch 8 §8.6.3',
    input: {
      resourceNames: ['A', 'B', 'C'],
      totalResources: [10, 5, 7],
      processIds: ['P0', 'P1', 'P2', 'P3', 'P4'],
      allocation: [
        [0, 1, 0],
        [2, 0, 0],
        [3, 0, 2],
        [2, 1, 1],
        [0, 0, 2],
      ],
      max: [
        [7, 5, 3],
        [3, 2, 2],
        [9, 0, 2],
        [2, 2, 2],
        [4, 3, 3],
      ],
    },
    sampleRequest: {
      processIndex: 1,
      request: [1, 0, 2],
      label: 'Silberschatz Example: Request1 = (1, 0, 2)',
    },
  },
  {
    id: 'deadlock-unsafe-demo',
    label: 'Deadlock / Unsafe State Demo — 4 Processes, 3 Resources',
    source: 'Silberschatz Deadlock Avoidance Boundary Condition',
    input: {
      resourceNames: ['A', 'B', 'C'],
      totalResources: [6, 5, 5],
      processIds: ['P0', 'P1', 'P2', 'P3'],
      allocation: [
        [2, 1, 1],
        [1, 2, 1],
        [2, 1, 2],
        [1, 1, 1],
      ],
      max: [
        [4, 3, 3],
        [3, 4, 2],
        [4, 2, 4],
        [2, 3, 3],
      ],
    },
    sampleRequest: {
      processIndex: 0,
      request: [1, 0, 0],
      label: 'Request0 = (1, 0, 0)',
    },
  },
];

export interface RagPreset {
  id: string;
  label: string;
  source: string;
  processes: string[];
  resources: string[];
  edges: RagEdge[];
}

export const RAG_PRESETS: RagPreset[] = [
  {
    id: 'c2-q4-healthcare',
    label: 'C2 Q4 — Healthcare Single-Instance RAG (Deadlock Cycle)',
    source: 'VIT Chennai FAT Slot C2+TC2 Q4 (10M)',
    processes: ['P1', 'P2', 'P3', 'P4'],
    resources: ['R1', 'R2', 'R3'],
    edges: [
      { from: 'R1', to: 'P1', type: 'assignment' },
      { from: 'P1', to: 'R2', type: 'request' },
      { from: 'R2', to: 'P2', type: 'assignment' },
      { from: 'P2', to: 'R3', type: 'request' },
      { from: 'R3', to: 'P3', type: 'assignment' },
      { from: 'P3', to: 'R1', type: 'request' },
      { from: 'P4', to: 'R2', type: 'request' },
    ],
  },
  {
    id: 'c1-1-2-q8-wfg',
    label: 'C1 Set 1-2 Q8(d) — Safe Acyclic Wait-For Graph',
    source: 'VIT Chennai FAT Slot C1 Set 1-2 Q8(d)',
    processes: ['P0', 'P1', 'P2', 'P3'],
    resources: ['R1', 'R2', 'R3'],
    edges: [
      { from: 'R1', to: 'P0', type: 'assignment' },
      { from: 'P1', to: 'R1', type: 'request' },
      { from: 'R2', to: 'P1', type: 'assignment' },
      { from: 'P2', to: 'R2', type: 'request' },
      { from: 'R3', to: 'P3', type: 'assignment' },
    ],
  },
];

function vecLeq(a: number[], b: number[]): boolean {
  for (let j = 0; j < a.length; j += 1) {
    if (a[j] > b[j]) return false;
  }
  return true;
}

export function runBankersSafety(input: BankersInput): BankersSafetyResult {
  const n = input.processIds.length;
  const m = input.resourceNames.length;

  const totalAllocated = Array.from({ length: m }, (_, j) =>
    input.allocation.reduce((sum, row) => sum + (row[j] ?? 0), 0)
  );
  const available = input.totalResources.map((tot, j) => tot - totalAllocated[j]);
  const need = input.max.map((maxRow, i) =>
    maxRow.map((maxVal, j) => maxVal - (input.allocation[i]?.[j] ?? 0))
  );

  if (available.some((v) => v < 0)) {
    return {
      totalAllocated,
      available,
      need,
      isSafe: false,
      safeSequence: [],
      trace: [],
      unfinishedProcesses: [...input.processIds],
      error: 'Total allocated exceeds total system instances for at least one resource.',
    };
  }

  if (need.some((row) => row.some((v) => v < 0))) {
    return {
      totalAllocated,
      available,
      need,
      isSafe: false,
      safeSequence: [],
      trace: [],
      unfinishedProcesses: [...input.processIds],
      error: 'Allocation exceeds Max claim for at least one process.',
    };
  }

  const work = [...available];
  const finish = new Array<boolean>(n).fill(false);
  const trace: SafetyTraceStep[] = [];
  const safeSequence: string[] = [];

  let progressed = true;
  while (progressed) {
    progressed = false;
    for (let i = 0; i < n; i += 1) {
      if (!finish[i] && vecLeq(need[i], work)) {
        const workBefore = [...work];
        for (let j = 0; j < m; j += 1) {
          work[j] += input.allocation[i][j];
        }
        finish[i] = true;
        safeSequence.push(input.processIds[i]);
        trace.push({
          step: trace.length + 1,
          processIndex: i,
          processId: input.processIds[i],
          need: [...need[i]],
          workBefore,
          allocation: [...input.allocation[i]],
          workAfter: [...work],
        });
        progressed = true;
      }
    }
  }

  const unfinishedProcesses = input.processIds.filter((_, i) => !finish[i]);
  return {
    totalAllocated,
    available,
    need,
    isSafe: unfinishedProcesses.length === 0,
    safeSequence,
    trace,
    unfinishedProcesses,
  };
}

export interface BankersValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateBankersInput(input: BankersInput): BankersValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const m = input.resourceNames.length;
  const n = input.processIds.length;

  if (m === 0) errors.push('At least one resource must be defined.');
  if (n === 0) errors.push('At least one process must be defined.');

  const totalAllocated = Array.from({ length: m }, (_, j) =>
    input.allocation.reduce((sum, row) => sum + (row[j] ?? 0), 0)
  );

  totalAllocated.forEach((alloc, j) => {
    const tot = input.totalResources[j] ?? 0;
    const rName = input.resourceNames[j] ?? `R${j}`;
    if (alloc > tot) {
      errors.push(`Resource ${rName}: Total allocated (${alloc}) exceeds total system instances (${tot}). Available would be negative (${tot - alloc}).`);
    }
  });

  input.processIds.forEach((pid, i) => {
    input.resourceNames.forEach((rName, j) => {
      const a = input.allocation[i]?.[j] ?? 0;
      const mx = input.max[i]?.[j] ?? 0;
      if (a > mx) {
        errors.push(`Process ${pid}, Resource ${rName}: Allocation (${a}) exceeds declared Max claim (${mx}).`);
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function evaluateResourceRequest(
  input: BankersInput,
  processIndex: number,
  request: number[]
): ResourceRequestResult {
  const base = runBankersSafety(input);
  const processId = input.processIds[processIndex] ?? `P${processIndex}`;
  const procNeed = base.need[processIndex] ?? [];

  const exceedsNeed = !vecLeq(request, procNeed);
  if (exceedsNeed) {
    return {
      processIndex,
      processId,
      request,
      exceedsNeed: true,
      exceedsAvailable: false,
      granted: false,
      reason: `Error: Request (${request.join(', ')}) exceeds Need[${processId}] (${procNeed.join(', ')}).`,
      step1Pass: false,
      step2Pass: false,
      step3Pass: false,
    };
  }

  const exceedsAvailable = !vecLeq(request, base.available);
  if (exceedsAvailable) {
    return {
      processIndex,
      processId,
      request,
      exceedsNeed: false,
      exceedsAvailable: true,
      granted: false,
      reason: `Must wait: Request (${request.join(', ')}) exceeds Available (${base.available.join(', ')}).`,
      step1Pass: true,
      step2Pass: false,
      step3Pass: false,
    };
  }

  const nextAllocation = input.allocation.map((row, i) =>
    i === processIndex ? row.map((v, j) => v + request[j]) : [...row]
  );

  const postSafety = runBankersSafety({
    ...input,
    allocation: nextAllocation,
  });

  if (postSafety.isSafe) {
    return {
      processIndex,
      processId,
      request,
      exceedsNeed: false,
      exceedsAvailable: false,
      granted: true,
      reason: `GRANTED safely. New Available = (${postSafety.available.join(', ')}); safe sequence: <${postSafety.safeSequence.join(', ')}>.`,
      postRequestSafety: postSafety,
      step1Pass: true,
      step2Pass: true,
      step3Pass: true,
    };
  }

  return {
    processIndex,
    processId,
    request,
    exceedsNeed: false,
    exceedsAvailable: false,
    granted: false,
    reason: `DENIED (unsafe state). Tentatively granting leaves Available = (${postSafety.available.join(', ')}) with unfinished processes: ${postSafety.unfinishedProcesses.join(', ')}.`,
    postRequestSafety: postSafety,
    step1Pass: true,
    step2Pass: true,
    step3Pass: false,
  };
}

export function analyzeSingleInstanceRag(
  processes: string[],
  edges: RagEdge[]
): RagAnalysisResult {
  // Build owner map: resource -> process holding it
  const heldBy = new Map<string, string[]>();
  for (const e of edges) {
    if (e.type === 'assignment') {
      const list = heldBy.get(e.from) ?? [];
      list.push(e.to);
      heldBy.set(e.from, list);
    }
  }

  // Convert RAG to Wait-For Graph: P_i -> P_j if P_i requests R_k and R_k is assigned to P_j
  const waitForEdges: Array<{ from: string; to: string; viaResource: string }> = [];
  const adj = new Map<string, string[]>();
  for (const p of processes) adj.set(p, []);

  for (const e of edges) {
    if (e.type === 'request') {
      const holders = heldBy.get(e.to) ?? [];
      for (const h of holders) {
        if (h !== e.from) {
          waitForEdges.push({ from: e.from, to: h, viaResource: e.to });
          const list = adj.get(e.from) ?? [];
          if (!list.includes(h)) list.push(h);
          adj.set(e.from, list);
        }
      }
    }
  }

  // Find all cycle nodes using Tarjan/DFS path tracking
  const visited = new Set<string>();
  const onStack = new Set<string>();
  const path: string[] = [];
  const cycleSet = new Set<string>();
  let firstCycle: string[] = [];

  const dfs = (node: string) => {
    visited.add(node);
    onStack.add(node);
    path.push(node);

    for (const next of adj.get(node) ?? []) {
      if (!visited.has(next)) {
        dfs(next);
      } else if (onStack.has(next)) {
        const idx = path.indexOf(next);
        if (idx !== -1) {
          const cyc = path.slice(idx);
          if (firstCycle.length === 0) firstCycle = cyc;
          for (const c of cyc) cycleSet.add(c);
        }
      }
    }

    path.pop();
    onStack.delete(node);
  };

  for (const p of processes) {
    if (!visited.has(p)) dfs(p);
  }

  const deadlockedProcesses = processes.filter((p) => cycleSet.has(p));
  const waitingProcesses = processes.filter(
    (p) => !cycleSet.has(p) && (adj.get(p) ?? []).some((target) => cycleSet.has(target))
  );

  return {
    waitForEdges,
    hasCycle: cycleSet.size > 0,
    cycleNodes: firstCycle,
    deadlockedProcesses,
    waitingProcesses,
  };
}
