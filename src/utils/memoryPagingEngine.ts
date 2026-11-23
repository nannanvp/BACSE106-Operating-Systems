export type PageReplacementAlgo = 'FIFO' | 'LRU' | 'OPT' | 'CLOCK' | 'SECOND_CHANCE';

export interface PageStepRow {
  step: number;
  page: number;
  frames: Array<number | null>;
  hit: boolean;
  evicted: number | null;
  refBits?: number[];
  clockHand?: number;
}

export interface PageReplacementResult {
  algorithm: PageReplacementAlgo;
  frameCount: number;
  referenceString: number[];
  steps: PageStepRow[];
  faults: number;
  hits: number;
  faultRate: number;
  hitRatio: number;
}

export interface PageReplacementPreset {
  id: string;
  label: string;
  source: string;
  frameCount: number;
  referenceString: number[];
}

export const PAGE_REPLACEMENT_PRESETS: PageReplacementPreset[] = [
  {
    id: 'c1-2-2-q6',
    label: 'C1 Set 2-2 Q6 — 4 Frames, 25-Ref String',
    source: 'VIT Chennai FAT Slot C1+TC1 Set 2-2 (15M)',
    frameCount: 4,
    referenceString: [1, 2, 3, 4, 2, 1, 5, 2, 1, 6, 3, 2, 1, 4, 2, 5, 1, 2, 7, 1, 3, 2, 4, 1, 2],
  },
  {
    id: 'c2-q7',
    label: 'C2 Q7 — Traffic System 4 Frames, 20-Ref String',
    source: 'VIT Chennai FAT Slot C2+TC2 (10M)',
    frameCount: 4,
    referenceString: [1, 2, 3, 4, 2, 1, 5, 6, 2, 1, 2, 3, 7, 6, 3, 2, 1, 2, 3, 6],
  },
  {
    id: 'belady-anomaly',
    label: "Silberschatz Ch 10 — Belady's Anomaly (Try 3 vs 4 Frames)",
    source: 'Silberschatz 10th Ed. Ch 10 §10.4.2',
    frameCount: 3,
    referenceString: [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5],
  },
  {
    id: 'c1-1-2-q6-ws',
    label: 'C1 Set 1-2 Q6 — Working Set Window String (Δ=5)',
    source: 'VIT Chennai FAT Slot C1 Set 1-2 (10M)',
    frameCount: 4,
    referenceString: [1, 2, 3, 2, 4, 1, 5, 2, 1, 3, 4, 5],
  },
];

export function runPageReplacement(
  referenceString: number[],
  frameCount: number,
  algorithm: PageReplacementAlgo
): PageReplacementResult {
  const cap = Math.max(1, Math.min(10, Math.floor(frameCount)));
  const frames: Array<number | null> = Array(cap).fill(null);
  const loadedAt: number[] = Array(cap).fill(-1);
  const lastUsedAt: number[] = Array(cap).fill(-1);
  const refBits: number[] = Array(cap).fill(0);
  let clockHand = 0;

  const steps: PageStepRow[] = [];
  let faults = 0;
  let hits = 0;

  for (let i = 0; i < referenceString.length; i += 1) {
    const page = referenceString[i];
    const hitIdx = frames.indexOf(page);

    if (hitIdx !== -1) {
      hits += 1;
      lastUsedAt[hitIdx] = i;
      refBits[hitIdx] = 1;
      steps.push({
        step: i + 1,
        page,
        frames: [...frames],
        hit: true,
        evicted: null,
        refBits: [...refBits],
        clockHand,
      });
      continue;
    }

    faults += 1;
    const emptyIdx = frames.indexOf(null);
    if (emptyIdx !== -1) {
      frames[emptyIdx] = page;
      loadedAt[emptyIdx] = i;
      lastUsedAt[emptyIdx] = i;
      refBits[emptyIdx] = 1;
      steps.push({
        step: i + 1,
        page,
        frames: [...frames],
        hit: false,
        evicted: null,
        refBits: [...refBits],
        clockHand,
      });
      continue;
    }

    // Choose victim slot
    let victimIdx = 0;
    if (algorithm === 'FIFO') {
      let oldestLoad = Infinity;
      for (let f = 0; f < cap; f += 1) {
        if (loadedAt[f] < oldestLoad) {
          oldestLoad = loadedAt[f];
          victimIdx = f;
        }
      }
    } else if (algorithm === 'LRU') {
      let oldestUse = Infinity;
      for (let f = 0; f < cap; f += 1) {
        if (lastUsedAt[f] < oldestUse) {
          oldestUse = lastUsedAt[f];
          victimIdx = f;
        }
      }
    } else if (algorithm === 'CLOCK' || algorithm === 'SECOND_CHANCE') {
      while (true) {
        if (refBits[clockHand] === 0) {
          victimIdx = clockHand;
          clockHand = (clockHand + 1) % cap;
          break;
        }
        refBits[clockHand] = 0;
        clockHand = (clockHand + 1) % cap;
      }
    } else {
      // OPT with explicit C1 Set 2-2 Q6 tie-break: earliest loaded (FIFO tie-break)
      let farthestNextUse = -1;
      let tieEarliestLoad = Infinity;
      for (let f = 0; f < cap; f += 1) {
        const candidate = frames[f]!;
        let nextUse = Infinity;
        for (let k = i + 1; k < referenceString.length; k += 1) {
          if (referenceString[k] === candidate) {
            nextUse = k;
            break;
          }
        }
        if (
          nextUse > farthestNextUse ||
          (nextUse === farthestNextUse && loadedAt[f] < tieEarliestLoad)
        ) {
          farthestNextUse = nextUse;
          tieEarliestLoad = loadedAt[f];
          victimIdx = f;
        }
      }
    }

    const evicted = frames[victimIdx];
    frames[victimIdx] = page;
    loadedAt[victimIdx] = i;
    lastUsedAt[victimIdx] = i;
    refBits[victimIdx] = 1;

    steps.push({
      step: i + 1,
      page,
      frames: [...frames],
      hit: false,
      evicted,
      refBits: [...refBits],
      clockHand,
    });
  }

  const total = referenceString.length;
  return {
    algorithm,
    frameCount: cap,
    referenceString,
    steps,
    faults,
    hits,
    faultRate: total > 0 ? Number(((faults / total) * 100).toFixed(2)) : 0,
    hitRatio: total > 0 ? Number(((hits / total) * 100).toFixed(2)) : 0,
  };
}

// --- Working Set Evaluator (C1 Set 1-2 Q6) ---
export interface WorkingSetSnapshot {
  index: number; // 1-based reference position
  page: number;
  window: number[];
  workingSet: number[];
  wss: number;
}

export function evaluateWorkingSet(referenceString: number[], delta: number): WorkingSetSnapshot[] {
  const d = Math.max(1, Math.floor(delta));
  return referenceString.map((page, i) => {
    const start = Math.max(0, i - d + 1);
    const window = referenceString.slice(start, i + 1);
    const workingSet = Array.from(new Set(window)).sort((a, b) => a - b);
    return {
      index: i + 1,
      page,
      window,
      workingSet,
      wss: workingSet.length,
    };
  });
}

// --- Contiguous Memory Placement (C1 Set 2-2 Q8) ---
export type PlacementAlgo = 'FIRST_FIT' | 'BEST_FIT' | 'WORST_FIT' | 'NEXT_FIT';

export interface PlacementStep {
  processId: string;
  processSize: number;
  allocatedBlockIndex: number | null; // 0-based
  blockSizeBefore: number | null;
  remainderAfter: number | null;
  pointerAfter: number;
  wrapped: boolean;
}

export interface PlacementResult {
  algorithm: PlacementAlgo;
  initialBlocks: number[];
  finalBlocks: number[];
  steps: PlacementStep[];
  allocatedCount: number;
  unallocatedProcesses: string[];
  totalFreeMemory: number;
  largestContiguousBlock: number;
  canFitUnallocatedInTotalFree: boolean;
}

export const PLACEMENT_PRESET_C1_2_2_Q8 = {
  label: 'C1 Set 2-2 Q8 — 7 Free Blocks, 6 Processes',
  source: 'VIT Chennai FAT Slot C1+TC1 Set 2-2 (15M)',
  blocks: [180, 420, 260, 500, 320, 380, 220],
  processes: [
    { id: 'P1', size: 100 },
    { id: 'P2', size: 410 },
    { id: 'P3', size: 390 },
    { id: 'P4', size: 350 },
    { id: 'P5', size: 400 },
    { id: 'P6', size: 240 },
  ],
};

export function runContiguousPlacement(
  initialBlocks: number[],
  processes: Array<{ id: string; size: number }>,
  algorithm: PlacementAlgo
): PlacementResult {
  const blocks = [...initialBlocks];
  const steps: PlacementStep[] = [];
  const unallocatedProcesses: string[] = [];
  let pointer = 0;

  for (const proc of processes) {
    let chosenIdx: number | null = null;
    let wrapped = false;

    if (algorithm === 'FIRST_FIT') {
      for (let i = 0; i < blocks.length; i += 1) {
        if (blocks[i] >= proc.size) {
          chosenIdx = i;
          break;
        }
      }
    } else if (algorithm === 'BEST_FIT') {
      let bestWaste = Infinity;
      for (let i = 0; i < blocks.length; i += 1) {
        if (blocks[i] >= proc.size) {
          const waste = blocks[i] - proc.size;
          if (waste < bestWaste) {
            bestWaste = waste;
            chosenIdx = i;
          }
        }
      }
    } else if (algorithm === 'WORST_FIT') {
      let largest = -1;
      for (let i = 0; i < blocks.length; i += 1) {
        if (blocks[i] >= proc.size && blocks[i] > largest) {
          largest = blocks[i];
          chosenIdx = i;
        }
      }
    } else {
      // NEXT_FIT: search circularly starting from current pointer; remainder stays in place
      const n = blocks.length;
      for (let offset = 0; offset < n; offset += 1) {
        const idx = (pointer + offset) % n;
        if (offset > 0 && idx < pointer) wrapped = true;
        if (blocks[idx] >= proc.size) {
          chosenIdx = idx;
          break;
        }
      }
    }

    if (chosenIdx !== null) {
      const before = blocks[chosenIdx];
      const rem = before - proc.size;
      blocks[chosenIdx] = rem;
      if (algorithm === 'NEXT_FIT') {
        // Next Fit pointer stays at the remainder block if >0 or advances to next block;
        // textbook Silberschatz / standard VIT convention advances pointer to (chosenIdx + 1) % n when scanning next
        pointer = (chosenIdx + 1) % blocks.length;
      }
      steps.push({
        processId: proc.id,
        processSize: proc.size,
        allocatedBlockIndex: chosenIdx,
        blockSizeBefore: before,
        remainderAfter: rem,
        pointerAfter: pointer,
        wrapped,
      });
    } else {
      unallocatedProcesses.push(proc.id);
      steps.push({
        processId: proc.id,
        processSize: proc.size,
        allocatedBlockIndex: null,
        blockSizeBefore: null,
        remainderAfter: null,
        pointerAfter: pointer,
        wrapped,
      });
    }
  }

  const totalFreeMemory = blocks.reduce((a, b) => a + b, 0);
  const largestContiguousBlock = blocks.length > 0 ? Math.max(...blocks) : 0;
  const minUnallocatedSize =
    unallocatedProcesses.length > 0
      ? Math.min(
          ...processes
            .filter((p) => unallocatedProcesses.includes(p.id))
            .map((p) => p.size)
        )
      : Infinity;

  return {
    algorithm,
    initialBlocks: [...initialBlocks],
    finalBlocks: blocks,
    steps,
    allocatedCount: processes.length - unallocatedProcesses.length,
    unallocatedProcesses,
    totalFreeMemory,
    largestContiguousBlock,
    canFitUnallocatedInTotalFree:
      unallocatedProcesses.length > 0 && totalFreeMemory >= minUnallocatedSize,
  };
}

// --- Paging + TLB Effective Access Time (C2 Q8) ---
export interface PagingTlbInput {
  vasKB: number;
  ramKB: number;
  pageSizeKB: number;
  tlbNs: number;
  ramNs: number;
  hitRatioPercent: number;
}

export interface PagingTlbResult {
  logicalAddressBits: number;
  physicalAddressBits: number;
  pageNumberBits: number;
  offsetBits: number;
  frameNumberBits: number;
  numPages: number;
  numFrames: number;
  hitAccessNs: number;
  missAccessNs: number;
  eatNs: number;
}

export function computePagingTlb(input: PagingTlbInput): PagingTlbResult {
  const vasBytes = Math.max(1024, input.vasKB * 1024);
  const ramBytes = Math.max(1024, input.ramKB * 1024);
  const pageBytes = Math.max(256, input.pageSizeKB * 1024);

  const logicalAddressBits = Math.round(Math.log2(vasBytes));
  const physicalAddressBits = Math.round(Math.log2(ramBytes));
  const offsetBits = Math.round(Math.log2(pageBytes));
  const pageNumberBits = Math.max(1, logicalAddressBits - offsetBits);
  const frameNumberBits = Math.max(1, physicalAddressBits - offsetBits);
  const numPages = Math.round(vasBytes / pageBytes);
  const numFrames = Math.round(ramBytes / pageBytes);

  const alpha = Math.max(0, Math.min(1, input.hitRatioPercent / 100));
  const hitAccessNs = input.tlbNs + input.ramNs;
  const missAccessNs = input.tlbNs + 2 * input.ramNs;
  const eatNs = Number((alpha * hitAccessNs + (1 - alpha) * missAccessNs).toFixed(2));

  return {
    logicalAddressBits,
    physicalAddressBits,
    pageNumberBits,
    offsetBits,
    frameNumberBits,
    numPages,
    numFrames,
    hitAccessNs,
    missAccessNs,
    eatNs,
  };
}

// --- Segmentation Translator (C1 Set 1-2 Q5) ---
export interface SegmentEntry {
  name: string;
  base: number;
  limit: number;
}

export interface SegmentTranslation {
  segment: string;
  offset: number;
  valid: boolean;
  physicalAddress: number | null;
  message: string;
}

export const SEGMENTATION_PRESET_C1_1_2_Q5: SegmentEntry[] = [
  { name: 'Code', base: 1000, limit: 400 },
  { name: 'Data', base: 2500, limit: 300 },
  { name: 'Heap', base: 4000, limit: 500 },
  { name: 'Stack', base: 6000, limit: 200 },
];

export function translateSegmentAddress(
  table: SegmentEntry[],
  segment: string,
  offset: number
): SegmentTranslation {
  const entry = table.find((s) => s.name.toLowerCase() === segment.toLowerCase());
  if (!entry) {
    return {
      segment,
      offset,
      valid: false,
      physicalAddress: null,
      message: `TRAP: Segment "${segment}" not found in segment table.`,
    };
  }
  if (offset < 0 || offset >= entry.limit) {
    return {
      segment: entry.name,
      offset,
      valid: false,
      physicalAddress: null,
      message: `TRAP (Addressing Error): offset ${offset} is not < limit ${entry.limit}.`,
    };
  }
  const phys = entry.base + offset;
  return {
    segment: entry.name,
    offset,
    valid: true,
    physicalAddress: phys,
    message: `Valid (${offset} < ${entry.limit}): ${entry.base} + ${offset} = ${phys}`,
  };
}

// --- Belady's Anomaly Forensic Evaluator ---
export interface BeladyComparisonResult {
  referenceString: number[];
  f3: PageReplacementResult;
  f4: PageReplacementResult;
  isAnomaly: boolean;
  faultDiff: number;
  explanation: string;
}

export function evaluateBeladyAnomaly(
  customRefs?: number[]
): BeladyComparisonResult {
  const refs =
    customRefs && customRefs.length > 0
      ? customRefs
      : [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5];
  const f3 = runPageReplacement(refs, 3, 'FIFO');
  const f4 = runPageReplacement(refs, 4, 'FIFO');
  const isAnomaly = f4.faults > f3.faults;
  const faultDiff = f4.faults - f3.faults;
  return {
    referenceString: refs,
    f3,
    f4,
    isAnomaly,
    faultDiff,
    explanation: isAnomaly
      ? `Belady's Anomaly detected! 3 frames yielded ${f3.faults} faults, whereas 4 frames increased faults to ${f4.faults} (+${faultDiff} faults) under FIFO.`
      : `No Belady Anomaly for this sequence under FIFO (3 frames = ${f3.faults} faults, 4 frames = ${f4.faults} faults).`,
  };
}

// --- Demand Paging EAT Evaluator ---
export interface DemandPagingEatInput {
  memoryAccessNs: number;
  pageFaultServiceMs: number;
  pageFaultRate: number;
}

export interface DemandPagingEatResult {
  memoryAccessNs: number;
  pageFaultServiceNs: number;
  pageFaultRate: number;
  eatNs: number;
  formula: string;
}

export function computeDemandPagingEat(input: DemandPagingEatInput): DemandPagingEatResult {
  const pfNs = input.pageFaultServiceMs * 1_000_000;
  const p = Math.max(0, Math.min(1, input.pageFaultRate));
  const eatNs = Number(((1 - p) * input.memoryAccessNs + p * pfNs).toFixed(2));
  return {
    memoryAccessNs: input.memoryAccessNs,
    pageFaultServiceNs: pfNs,
    pageFaultRate: p,
    eatNs,
    formula: `EAT = (1 - p) × ma + p × pfTime = (1 - ${p}) × ${input.memoryAccessNs} + ${p} × ${pfNs} = ${eatNs} ns`,
  };
}
