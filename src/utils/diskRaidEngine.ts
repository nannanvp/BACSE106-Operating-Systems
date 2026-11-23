export type DiskAlgorithm = 'FCFS' | 'SSTF' | 'SCAN' | 'C-SCAN' | 'LOOK' | 'C-LOOK';
export type DiskDirection = 'up' | 'down';

export interface DiskScheduleInput {
  algorithm: DiskAlgorithm;
  minTrack: number;
  maxTrack: number;
  initialHead: number;
  direction: DiskDirection;
  requests: number[];
  msPerTrack?: number;
  rpm?: number;
}

export interface DiskMoveStep {
  from: number;
  to: number;
  distance: number;
  isBoundary: boolean;
}

export interface DiskScheduleResult {
  algorithm: DiskAlgorithm;
  sequence: number[];
  steps: DiskMoveStep[];
  totalHeadMovement: number;
  seekTimeMs: number;
  avgRotationalLatencyMs: number;
  avgSeekDistance?: number;
  totalAccessTimeMs?: number;
}

export interface DiskPreset {
  id: string;
  label: string;
  source: string;
  input: Omit<DiskScheduleInput, 'algorithm'>;
  defaultAlgorithm: DiskAlgorithm;
  examQuestion?: string;
  examContext?: string;
  solutionNotes?: string;
}

export const DISK_PRESETS: DiskPreset[] = [
  {
    id: 'c2-q9',
    label: 'C2 Q9 — E-Commerce Disk (0–499, Head 215 ← Prev 250)',
    source: 'VIT Chennai FAT Slot C2+TC2 (10M)',
    defaultAlgorithm: 'LOOK',
    examQuestion:
      'Queue: [82, 170, 43, 140, 310, 465, 125, 230]. Head is at cylinder 215, previous cylinder was 250 (moving down towards 0). Total cylinders 0–499. Compare LOOK, C-LOOK, SSTF.',
    examContext:
      'Slot C2+TC2 10-Mark Core Numerical. Moving down from 250 to 215 proves initial direction = "down".',
    solutionNotes:
      'LOOK down serves: 215 → 170 → 140 → 125 → 82 → 43 (reverses at lowest request) → 230 → 310 → 465. Total seek = (215 - 43) + (465 - 43) = 172 + 422 = 594 cylinders.',
    input: {
      minTrack: 0,
      maxTrack: 499,
      initialHead: 215,
      direction: 'down',
      requests: [82, 170, 43, 140, 310, 465, 125, 230],
      msPerTrack: 1,
      rpm: 7200,
    },
  },
  {
    id: 'c1-1-2-q9',
    label: 'C1 Set 1-2 Q9 — Magnetic Disk (1–100, Head 50, 6000 RPM)',
    source: 'VIT Chennai FAT Slot C1 Set 1-2 (15M)',
    defaultAlgorithm: 'SSTF',
    examQuestion:
      'Disk queue with requests: [45, 20, 90, 10, 60, 80, 25, 70]. Current head at 50 moving towards 1. Track range: 1 to 100. Rotational speed: 6000 RPM. Evaluate SSTF, SCAN, and average rotational latency.',
    examContext:
      'Slot C1 Set 1-2 15-Mark Long Numerical. Note platter range begins at track 1 (not 0).',
    solutionNotes:
      'Rotational Latency = 1/2 rotation = (60000 / 6000) / 2 = 5.00 ms. SCAN reaches boundary track 1 before reversing to serve upper tracks.',
    input: {
      minTrack: 1,
      maxTrack: 100,
      initialHead: 50,
      direction: 'down',
      requests: [45, 20, 90, 10, 60, 80, 25, 70],
      msPerTrack: 1,
      rpm: 6000,
    },
  },
  {
    id: 'silberschatz-ch11',
    label: 'Silberschatz Ch 11 — Classic Disk (0–199, Head 53)',
    source: 'Silberschatz 10th Ed. Ch 11 §11.2',
    defaultAlgorithm: 'SCAN',
    examQuestion:
      'Standard textbook benchmark queue: [98, 183, 37, 122, 14, 124, 65, 67]. Head currently at track 53 moving toward 0. Track range: 0 to 199.',
    examContext:
      'Standard textbook reference problem used in university exams for algorithm benchmarking.',
    solutionNotes:
      'SCAN moves down to track 0, then reverses to serve higher tracks up to 183. Total movement = 236 cylinders.',
    input: {
      minTrack: 0,
      maxTrack: 199,
      initialHead: 53,
      direction: 'down',
      requests: [98, 183, 37, 122, 14, 124, 65, 67],
      msPerTrack: 1,
      rpm: 7200,
    },
  },
];

export function runDiskSchedule(input: DiskScheduleInput): DiskScheduleResult {
  const { algorithm, minTrack, maxTrack, initialHead, direction } = input;
  const reqs = input.requests.filter((r) => Number.isFinite(r) && r >= minTrack && r <= maxTrack);
  const sequence: number[] = [initialHead];
  const boundaryPositions = new Set<number>();

  if (algorithm === 'FCFS') {
    sequence.push(...reqs);
  } else if (algorithm === 'SSTF') {
    const remaining = [...reqs];
    let head = initialHead;
    while (remaining.length > 0) {
      let bestIdx = 0;
      let bestDist = Infinity;
      for (let i = 0; i < remaining.length; i += 1) {
        const d = Math.abs(remaining[i] - head);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      }
      head = remaining.splice(bestIdx, 1)[0];
      sequence.push(head);
    }
  } else {
    const lower = reqs.filter((r) => r < initialHead).sort((a, b) => a - b);
    const higher = reqs.filter((r) => r >= initialHead).sort((a, b) => a - b);

    if (algorithm === 'SCAN') {
      if (direction === 'down') {
        sequence.push(...[...lower].reverse());
        if (higher.length > 0) {
          if (sequence[sequence.length - 1] !== minTrack) {
            boundaryPositions.add(sequence.length);
            sequence.push(minTrack);
          }
          sequence.push(...higher);
        }
      } else {
        sequence.push(...higher);
        if (lower.length > 0) {
          if (sequence[sequence.length - 1] !== maxTrack) {
            boundaryPositions.add(sequence.length);
            sequence.push(maxTrack);
          }
          sequence.push(...[...lower].reverse());
        }
      }
    } else if (algorithm === 'C-SCAN') {
      if (direction === 'up') {
        sequence.push(...higher);
        if (lower.length > 0) {
          if (sequence[sequence.length - 1] !== maxTrack) {
            boundaryPositions.add(sequence.length);
            sequence.push(maxTrack);
          }
          boundaryPositions.add(sequence.length);
          sequence.push(minTrack);
          sequence.push(...lower);
        }
      } else {
        sequence.push(...[...lower].reverse());
        if (higher.length > 0) {
          if (sequence[sequence.length - 1] !== minTrack) {
            boundaryPositions.add(sequence.length);
            sequence.push(minTrack);
          }
          boundaryPositions.add(sequence.length);
          sequence.push(maxTrack);
          sequence.push(...[...higher].reverse());
        }
      }
    } else if (algorithm === 'LOOK') {
      if (direction === 'down') {
        sequence.push(...[...lower].reverse());
        sequence.push(...higher);
      } else {
        sequence.push(...higher);
        sequence.push(...[...lower].reverse());
      }
    } else {
      // C-LOOK
      if (direction === 'down') {
        sequence.push(...[...lower].reverse());
        if (higher.length > 0) {
          sequence.push(...[...higher].reverse());
        }
      } else {
        sequence.push(...higher);
        if (lower.length > 0) {
          sequence.push(...lower);
        }
      }
    }
  }

  const steps: DiskMoveStep[] = [];
  let totalHeadMovement = 0;
  for (let i = 1; i < sequence.length; i += 1) {
    const dist = Math.abs(sequence[i] - sequence[i - 1]);
    totalHeadMovement += dist;
    steps.push({
      from: sequence[i - 1],
      to: sequence[i],
      distance: dist,
      isBoundary: boundaryPositions.has(i),
    });
  }

  const msPerTrack = input.msPerTrack ?? 1;
  const rpm = input.rpm ?? 6000;
  const seekTimeMs = Number((totalHeadMovement * msPerTrack).toFixed(2));
  // Average rotational latency = half a rotation = (60_000 ms / rpm) / 2
  const avgRotationalLatencyMs = Number(((60000 / Math.max(1, rpm)) / 2).toFixed(2));
  const avgSeekDistance =
    steps.length > 0 ? Number((totalHeadMovement / steps.length).toFixed(2)) : 0;
  const totalAccessTimeMs = Number((seekTimeMs + avgRotationalLatencyMs).toFixed(2));

  return {
    algorithm,
    sequence,
    steps,
    totalHeadMovement,
    seekTimeMs,
    avgRotationalLatencyMs,
    avgSeekDistance,
    totalAccessTimeMs,
  };
}

export function calculateRotationalLatency(rpm: number) {
  const safeRpm = Math.max(1, rpm);
  const revolutionTimeMs = Number((60000 / safeRpm).toFixed(2));
  const avgLatencyMs = Number((revolutionTimeMs / 2).toFixed(2));
  return {
    rpm: safeRpm,
    revolutionTimeMs,
    avgLatencyMs,
    formula: `(60,000 ms / ${safeRpm} RPM) / 2 = ${avgLatencyMs} ms`,
  };
}

export function compareDiskAlgorithms(
  input: Omit<DiskScheduleInput, 'algorithm'>
): Array<DiskScheduleResult & { rank: number; algorithmName: string }> {
  const algorithms: DiskAlgorithm[] = ['LOOK', 'C-LOOK', 'SSTF', 'SCAN', 'FCFS', 'C-SCAN'];
  const names: Record<DiskAlgorithm, string> = {
    LOOK: 'LOOK (Elevator without edges)',
    'C-LOOK': 'C-LOOK (Circular LOOK)',
    SSTF: 'SSTF (Shortest Seek Time First)',
    SCAN: 'SCAN (Elevator to boundary)',
    'C-SCAN': 'C-SCAN (Circular SCAN)',
    FCFS: 'FCFS (First-Come First-Served)',
  };

  const results = algorithms.map((algo) => runDiskSchedule({ ...input, algorithm: algo }));
  results.sort((a, b) => a.totalHeadMovement - b.totalHeadMovement);
  return results.map((res, idx) => ({
    ...res,
    rank: idx + 1,
    algorithmName: names[res.algorithm],
  }));
}

// --- RAID Level Calculator (C1 Set 1-2 Q7) ---
export type RaidLevel = 'RAID0' | 'RAID1' | 'RAID5' | 'RAID6' | 'RAID10';

export interface RaidDiskBlock {
  stripeIndex: number;
  type: 'data' | 'parity' | 'q-parity' | 'mirror';
  label: string;
}

export interface RaidDiskStripe {
  diskIndex: number;
  diskLabel: string;
  blocks: RaidDiskBlock[];
}

export interface RaidEvaluation {
  level: RaidLevel;
  name: string;
  minDisks: number;
  valid: boolean;
  usableCapacityTB: number;
  storageEfficiencyPercent: number;
  maxDiskFailures: number;
  readPerformance: string;
  writePerformance: string;
  bestUseCase: string;
  rawCapacityTB?: number;
  parityLossTB?: number;
  capacityFormula?: string;
  faultToleranceFormula?: string;
  diskStripes?: RaidDiskStripe[];
}

export function generateRaidStripes(level: RaidLevel, numDisks: number): RaidDiskStripe[] {
  const n = Math.min(12, Math.max(2, Math.floor(numDisks)));
  const rows = 4;
  const stripes: RaidDiskStripe[] = Array.from({ length: n }, (_, dIdx) => ({
    diskIndex: dIdx,
    diskLabel: `Disk ${dIdx}`,
    blocks: [],
  }));

  if (level === 'RAID0') {
    let blockCounter = 0;
    for (let r = 0; r < rows; r += 1) {
      for (let d = 0; d < n; d += 1) {
        stripes[d].blocks.push({
          stripeIndex: r,
          type: 'data',
          label: `D${blockCounter++}`,
        });
      }
    }
  } else if (level === 'RAID1') {
    let blockCounter = 0;
    for (let r = 0; r < rows; r += 1) {
      for (let d = 0; d < n; d += 2) {
        const id = blockCounter++;
        stripes[d].blocks.push({
          stripeIndex: r,
          type: 'data',
          label: `D${id}`,
        });
        if (d + 1 < n) {
          stripes[d + 1].blocks.push({
            stripeIndex: r,
            type: 'mirror',
            label: `M${id}`,
          });
        }
      }
    }
  } else if (level === 'RAID5') {
    let blockCounter = 0;
    for (let r = 0; r < rows; r += 1) {
      const parityDisk = (n - 1 - (r % n) + n) % n;
      for (let d = 0; d < n; d += 1) {
        if (d === parityDisk) {
          stripes[d].blocks.push({
            stripeIndex: r,
            type: 'parity',
            label: `P${r}`,
          });
        } else {
          stripes[d].blocks.push({
            stripeIndex: r,
            type: 'data',
            label: `D${blockCounter++}`,
          });
        }
      }
    }
  } else if (level === 'RAID6') {
    let blockCounter = 0;
    for (let r = 0; r < rows; r += 1) {
      const qDisk = (n - 1 - (r % n) + n) % n;
      const pDisk = (qDisk - 1 + n) % n;
      for (let d = 0; d < n; d += 1) {
        if (d === pDisk) {
          stripes[d].blocks.push({
            stripeIndex: r,
            type: 'parity',
            label: `P${r}`,
          });
        } else if (d === qDisk) {
          stripes[d].blocks.push({
            stripeIndex: r,
            type: 'q-parity',
            label: `Q${r}`,
          });
        } else {
          stripes[d].blocks.push({
            stripeIndex: r,
            type: 'data',
            label: `D${blockCounter++}`,
          });
        }
      }
    }
  } else {
    // RAID 10
    let blockCounter = 0;
    for (let r = 0; r < rows; r += 1) {
      for (let d = 0; d < n; d += 2) {
        const id = blockCounter++;
        stripes[d].blocks.push({
          stripeIndex: r,
          type: 'data',
          label: `D${id}`,
        });
        if (d + 1 < n) {
          stripes[d + 1].blocks.push({
            stripeIndex: r,
            type: 'mirror',
            label: `M${id}`,
          });
        }
      }
    }
  }

  return stripes;
}

export function evaluateRaidLevel(
  level: RaidLevel,
  numDisks: number,
  diskCapacityTB: number
): RaidEvaluation {
  const n = Math.max(1, Math.floor(numDisks));
  const cap = Math.max(0.5, diskCapacityTB);
  const rawCapacityTB = Number((n * cap).toFixed(2));
  const diskStripes = generateRaidStripes(level, n);

  switch (level) {
    case 'RAID0': {
      const usable = Number((n * cap).toFixed(2));
      return {
        level,
        name: 'RAID 0 — Striping (No Redundancy)',
        minDisks: 2,
        valid: n >= 2,
        rawCapacityTB,
        usableCapacityTB: usable,
        parityLossTB: 0,
        storageEfficiencyPercent: 100,
        maxDiskFailures: 0,
        capacityFormula: 'N × C',
        faultToleranceFormula: '0 disks (any failure causes total data loss)',
        readPerformance: `${n}× parallel striped reads`,
        writePerformance: `${n}× parallel striped writes (no parity overhead)`,
        bestUseCase: 'Regenerable multimedia/video scratch rendering (C1 1-2 Q7 Scenario 2)',
        diskStripes,
      };
    }
    case 'RAID1': {
      const valid = n >= 2 && n % 2 === 0;
      const usable = Number(((n / 2) * cap).toFixed(2));
      return {
        level,
        name: 'RAID 1 — Mirroring',
        minDisks: 2,
        valid,
        rawCapacityTB,
        usableCapacityTB: usable,
        parityLossTB: Number((rawCapacityTB - usable).toFixed(2)),
        storageEfficiencyPercent: 50,
        maxDiskFailures: Math.floor(n / 2),
        capacityFormula: '(N / 2) × C',
        faultToleranceFormula: 'Up to N / 2 disks (1 disk per mirror pair)',
        readPerformance: 'High (reads split across mirrors)',
        writePerformance: '1× (must write to both mirrors)',
        bestUseCase: 'Critical OS boot volumes & high-reliability transaction logs',
        diskStripes,
      };
    }
    case 'RAID5': {
      const valid = n >= 3;
      const usable = Number(((n - 1) * cap).toFixed(2));
      return {
        level,
        name: 'RAID 5 — Block-Interleaved Distributed Parity',
        minDisks: 3,
        valid,
        rawCapacityTB,
        usableCapacityTB: usable,
        parityLossTB: Number(cap.toFixed(2)),
        storageEfficiencyPercent: Number((((n - 1) / n) * 100).toFixed(1)),
        maxDiskFailures: 1,
        capacityFormula: '(N - 1) × C',
        faultToleranceFormula: '1 disk failure (distributed parity XOR)',
        readPerformance: `${n - 1}× striped reads`,
        writePerformance: 'Moderate (4-IO read-modify-write parity update penalty)',
        bestUseCase: 'Balanced enterprise file servers tolerating 1 disk failure',
        diskStripes,
      };
    }
    case 'RAID6': {
      const valid = n >= 4;
      const usable = Number(((n - 2) * cap).toFixed(2));
      return {
        level,
        name: 'RAID 6 — P+Q Dual Distributed Parity',
        minDisks: 4,
        valid,
        rawCapacityTB,
        usableCapacityTB: usable,
        parityLossTB: Number((2 * cap).toFixed(2)),
        storageEfficiencyPercent: Number((((n - 2) / n) * 100).toFixed(1)),
        maxDiskFailures: 2,
        capacityFormula: '(N - 2) × C',
        faultToleranceFormula: '2 simultaneous disk failures (dual P+Q Reed-Solomon)',
        readPerformance: `${n - 2}× striped reads`,
        writePerformance: 'Lower (6-IO dual P+Q Reed-Solomon parity calculation penalty)',
        bestUseCase:
          'Mission-critical university data centers tolerating 2 simultaneous failures (C1 1-2 Q7 Scenario 1)',
        diskStripes,
      };
    }
    case 'RAID10': {
      const valid = n >= 4 && n % 2 === 0;
      const usable = Number(((n / 2) * cap).toFixed(2));
      return {
        level,
        name: 'RAID 1+0 (RAID 10) — Stripe of Mirrors',
        minDisks: 4,
        valid,
        rawCapacityTB,
        usableCapacityTB: usable,
        parityLossTB: Number((rawCapacityTB - usable).toFixed(2)),
        storageEfficiencyPercent: 50,
        maxDiskFailures: 1, // guaranteed 1 (up to n/2 if different mirror pairs)
        capacityFormula: '(N / 2) × C',
        faultToleranceFormula: 'Guaranteed 1 disk failure (up to N/2 if in separate mirror pairs)',
        readPerformance: `${n}× parallel reads across all mirrors`,
        writePerformance: `${n / 2}× striped mirror writes (no parity penalty)`,
        bestUseCase: 'High-IOPS OLTP databases needing fast writes + fault tolerance',
        diskStripes,
      };
    }
  }
}
