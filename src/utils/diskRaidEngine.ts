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
}

export interface DiskPreset {
  id: string;
  label: string;
  source: string;
  input: Omit<DiskScheduleInput, 'algorithm'>;
  defaultAlgorithm: DiskAlgorithm;
}

export const DISK_PRESETS: DiskPreset[] = [
  {
    id: 'c2-q9',
    label: 'C2 Q9 — E-Commerce Disk (0–499, Head 215 ← Prev 250)',
    source: 'VIT Chennai FAT Slot C2+TC2 (10M)',
    defaultAlgorithm: 'LOOK',
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

  return {
    algorithm,
    sequence,
    steps,
    totalHeadMovement,
    seekTimeMs,
    avgRotationalLatencyMs,
  };
}

// --- RAID Level Calculator (C1 Set 1-2 Q7) ---
export type RaidLevel = 'RAID0' | 'RAID1' | 'RAID5' | 'RAID6' | 'RAID10';

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
}

export function evaluateRaidLevel(
  level: RaidLevel,
  numDisks: number,
  diskCapacityTB: number
): RaidEvaluation {
  const n = Math.max(1, Math.floor(numDisks));
  const cap = Math.max(0.5, diskCapacityTB);

  switch (level) {
    case 'RAID0':
      return {
        level,
        name: 'RAID 0 — Striping (No Redundancy)',
        minDisks: 2,
        valid: n >= 2,
        usableCapacityTB: Number((n * cap).toFixed(2)),
        storageEfficiencyPercent: 100,
        maxDiskFailures: 0,
        readPerformance: `${n}× parallel striped reads`,
        writePerformance: `${n}× parallel striped writes (no parity overhead)`,
        bestUseCase: 'Regenerable multimedia/video scratch rendering (C1 1-2 Q7 Scenario 2)',
      };
    case 'RAID1':
      return {
        level,
        name: 'RAID 1 — Mirroring',
        minDisks: 2,
        valid: n >= 2 && n % 2 === 0,
        usableCapacityTB: Number(((n / 2) * cap).toFixed(2)),
        storageEfficiencyPercent: 50,
        maxDiskFailures: Math.floor(n / 2),
        readPerformance: 'High (reads split across mirrors)',
        writePerformance: '1× (must write to both mirrors)',
        bestUseCase: 'Critical OS boot volumes & high-reliability transaction logs',
      };
    case 'RAID5':
      return {
        level,
        name: 'RAID 5 — Block-Interleaved Distributed Parity',
        minDisks: 3,
        valid: n >= 3,
        usableCapacityTB: Number(((n - 1) * cap).toFixed(2)),
        storageEfficiencyPercent: Number((((n - 1) / n) * 100).toFixed(1)),
        maxDiskFailures: 1,
        readPerformance: `${n - 1}× striped reads`,
        writePerformance: 'Moderate (read-modify-write parity update)',
        bestUseCase: 'Balanced enterprise file servers tolerating 1 disk failure',
      };
    case 'RAID6':
      return {
        level,
        name: 'RAID 6 — P+Q Dual Distributed Parity',
        minDisks: 4,
        valid: n >= 4,
        usableCapacityTB: Number(((n - 2) * cap).toFixed(2)),
        storageEfficiencyPercent: Number((((n - 2) / n) * 100).toFixed(1)),
        maxDiskFailures: 2,
        readPerformance: `${n - 2}× striped reads`,
        writePerformance: 'Lower (dual P+Q Reed-Solomon parity calculation)',
        bestUseCase: 'Mission-critical university data centers tolerating 2 simultaneous failures (C1 1-2 Q7 Scenario 1)',
      };
    case 'RAID10':
      return {
        level,
        name: 'RAID 1+0 (RAID 10) — Stripe of Mirrors',
        minDisks: 4,
        valid: n >= 4 && n % 2 === 0,
        usableCapacityTB: Number(((n / 2) * cap).toFixed(2)),
        storageEfficiencyPercent: 50,
        maxDiskFailures: 1, // guaranteed 1 (up to n/2 if different mirror pairs)
        readPerformance: `${n}× parallel reads across all mirrors`,
        writePerformance: `${n / 2}× striped mirror writes (no parity penalty)`,
        bestUseCase: 'High-IOPS OLTP databases needing fast writes + fault tolerance',
      };
  }
}
