import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { runCpuSchedule, CPU_SCHEDULER_PRESETS } from './cpuSchedulerEngine';
import {
  runBankersSafety,
  evaluateResourceRequest,
  analyzeSingleInstanceRag,
  BANKERS_PRESETS,
  RAG_PRESETS,
} from './bankersEngine';
import {
  createBoundedBufferState,
  stepBoundedBuffer,
  createPetersonState,
  stepPeterson,
  createSleepingBarberState,
  stepSleepingBarber,
  createDiningPhilosophersState,
  stepDiningPhilosophers,
  createReadersWritersState,
  stepReadersWriters,
} from './syncLabEngine';
import {
  runPageReplacement,
  evaluateWorkingSet,
  runContiguousPlacement,
  computePagingTlb,
  translateSegmentAddress,
  PAGE_REPLACEMENT_PRESETS,
  PLACEMENT_PRESET_C1_2_2_Q8,
  SEGMENTATION_PRESET_C1_1_2_Q5,
} from './memoryPagingEngine';
import { runDiskSchedule, evaluateRaidLevel, DISK_PRESETS } from './diskRaidEngine';

describe('CPU Scheduling Engine (Real VIT FAT Presets)', () => {
  it('solves C1 Set 2-2 Q5 Preemptive Priority with 1 ms CS overhead consistently', () => {
    const preset = CPU_SCHEDULER_PRESETS.find((p) => p.id === 'c1-2-2-q5')!;
    const res = runCpuSchedule(preset.processes, preset.algorithm, preset.quantum, preset.csOverhead);
    assert.equal(res.processes.length, 10);
    assert.equal(res.totalBurst, 53);
    assert.equal(res.totalIdleTime, 0);
    assert.ok(res.totalCsCount > 0, 'Preemptive Priority must incur context switches');
    assert.equal(res.totalTime, res.totalBurst + res.totalCsTime);
    // Initial dispatch must not have CS at t=0
    assert.equal(res.gantt[0].label, 'P1');
    assert.equal(res.gantt[0].start, 0);
    // Final segment must be a process (no trailing CS)
    assert.equal(res.gantt[res.gantt.length - 1].kind, 'process');
    for (const m of res.processes) {
      assert.equal(m.turnaround, m.completion - m.arrival);
      assert.equal(m.waiting, m.turnaround - m.burst);
      assert.ok(m.waiting >= 0);
      assert.ok(m.response >= 0);
    }
  });

  it('solves C1 Set 1-2 Q2 Non-Preemptive Priority accurately', () => {
    const preset = CPU_SCHEDULER_PRESETS.find((p) => p.id === 'c1-1-2-q2')!;
    const res = runCpuSchedule(preset.processes, 'NP_PRIORITY', 4, 0);
    // P1 runs [0..7], at t=7 P2(pr1), P4(pr2), P3(pr4), P5(pr5) all arrived -> P2[7..12], P4[12..15], P3[15..19], P5[19..25]
    assert.deepEqual(
      res.gantt.map((g) => g.label),
      ['P1', 'P2', 'P4', 'P3', 'P5']
    );
    const byId = Object.fromEntries(res.processes.map((p) => [p.id, p]));
    assert.equal(byId.P1.completion, 7);
    assert.equal(byId.P2.completion, 12);
    assert.equal(byId.P4.completion, 15);
    assert.equal(byId.P3.completion, 19);
    assert.equal(byId.P5.completion, 25);
    assert.equal(res.avgWaiting, 8.4);
    assert.equal(res.avgTurnaround, 13.4);
  });

  it('solves C2 Q3 3D Printer FCFS vs Round Robin (q=10)', () => {
    const rrPreset = CPU_SCHEDULER_PRESETS.find((p) => p.id === 'c2-q3-rr')!;
    const fcfs = runCpuSchedule(rrPreset.processes, 'FCFS', 10, 0);
    const rr = runCpuSchedule(rrPreset.processes, 'RR', 10, 0);
    // FCFS: S1[0..25], S2[25..60], S3[60..75], S4[75..120] -> WT: 0, 20, 50, 60 -> avg 32.5
    assert.equal(fcfs.avgWaiting, 32.5);
    assert.equal(fcfs.avgTurnaround, 62.5);
    assert.equal(rr.totalTime, 120);
    assert.ok(rr.avgResponse < fcfs.avgResponse, 'RR improves average response time over FCFS');
  });

  it('solves Silberschatz Ch 5 SRTF benchmark', () => {
    const preset = CPU_SCHEDULER_PRESETS.find((p) => p.id === 'silberschatz-srtf')!;
    const res = runCpuSchedule(preset.processes, 'SRTF', 4, 0);
    // Known Silberschatz answer: Avg WT = (9 + 0 + 15 + 2) / 4 = 6.5 ms
    assert.equal(res.avgWaiting, 6.5);
  });
});

describe("Banker's Algorithm & RAG Engine (Real VIT FAT Presets)", () => {
  it('solves C1 Set 2-2 Q7 (6 procs, 4 resources) and Request2=(0,0,1,0)', () => {
    const preset = BANKERS_PRESETS.find((p) => p.id === 'c1-2-2-q7')!;
    const safety = runBankersSafety(preset.input);
    assert.deepEqual(safety.totalAllocated, [5, 4, 4, 3]);
    assert.deepEqual(safety.available, [2, 1, 1, 1]);
    assert.equal(safety.isSafe, true);
    assert.equal(safety.safeSequence.length, 6);

    const req = evaluateResourceRequest(preset.input, 2, [0, 0, 1, 0]);
    assert.equal(req.exceedsNeed, false);
    assert.equal(req.exceedsAvailable, false);
    assert.equal(req.granted, false); // Drains Available.C to 0 -> P2..P5 deadlock (unsafe state!)
  });

  it('solves C1 Set 1-2 Q8 (4 procs, 3 resources)', () => {
    const preset = BANKERS_PRESETS.find((p) => p.id === 'c1-1-2-q8')!;
    const safety = runBankersSafety(preset.input);
    assert.deepEqual(safety.available, [3, 2, 2]);
    assert.equal(safety.isSafe, true);
    assert.equal(safety.safeSequence.length, 4);
  });

  it('detects C2 Q4 Healthcare RAG cycle {P1, P2, P3} while excluding P4 from cycle', () => {
    const preset = RAG_PRESETS.find((p) => p.id === 'c2-q4-healthcare')!;
    const res = analyzeSingleInstanceRag(preset.processes, preset.edges);
    assert.equal(res.hasCycle, true);
    assert.deepEqual(res.deadlockedProcesses, ['P1', 'P2', 'P3']);
    assert.deepEqual(res.waitingProcesses, ['P4']);
  });
});

describe('Synchronization Lab Engine', () => {
  it('enforces Bounded Buffer capacity 5 and blocks on full/empty', () => {
    let s = createBoundedBufferState(2);
    s = stepBoundedBuffer(s, 'consume'); // empty -> blocked
    assert.equal(s.blockedConsumers, 1);
    s = stepBoundedBuffer(s, 'produce'); // wakes consumer count
    assert.equal(s.buffer.length, 1);
    s = stepBoundedBuffer(s, 'produce');
    assert.equal(s.empty, 0);
    s = stepBoundedBuffer(s, 'produce'); // full -> blocked
    assert.equal(s.blockedProducers, 1);
  });

  it("verifies C2 Q5 Peterson's simultaneous trace (10 seats -> 6 seats)", () => {
    let s = createPetersonState(10, 2);
    s = stepPeterson(s, 'simultaneous-c2q5');
    // P1 tries to enter -> must spin wait because turn==0
    s = stepPeterson(s, 'enter-1');
    assert.equal(s.inCs[1], false);
    // P0 enters -> seats drop 10 -> 8
    s = stepPeterson(s, 'enter-0');
    assert.equal(s.inCs[0], true);
    assert.equal(s.sharedSeats, 8);
    // P0 exits -> P1 enters -> seats drop 8 -> 6
    s = stepPeterson(s, 'exit-0');
    s = stepPeterson(s, 'enter-1');
    assert.equal(s.inCs[1], true);
    assert.equal(s.sharedSeats, 6);
  });

  it('verifies Sleeping Barber, Dining Philosophers deadlock vs asymmetric fix, and Readers-Writers', () => {
    let sb = createSleepingBarberState(1);
    sb = stepSleepingBarber(sb, 'customer-arrive');
    sb = stepSleepingBarber(sb, 'customer-arrive'); // chair full -> turned away
    assert.equal(sb.turnedAway, 1);
    sb = stepSleepingBarber(sb, 'barber-next');
    assert.equal(sb.barberStatus, 'cutting');

    const dpDead = stepDiningPhilosophers(createDiningPhilosophersState(false), 'all-grab-first');
    assert.equal(dpDead.deadlocked, true);
    const dpSafe = stepDiningPhilosophers(createDiningPhilosophersState(true), 'all-grab-first');
    assert.equal(dpSafe.deadlocked, false);

    let rw = createReadersWritersState();
    rw = stepReadersWriters(rw, 'reader-enter');
    rw = stepReadersWriters(rw, 'reader-enter');
    assert.equal(rw.readCount, 2);
    rw = stepReadersWriters(rw, 'writer-enter');
    assert.equal(rw.activeWriter, null);
    assert.equal(rw.waitingWriters, 1);
  });
});

describe('Memory, Paging, Placement & Segmentation Engine (Real VIT FAT Presets)', () => {
  it("demonstrates Belady's Anomaly on Silberschatz string (3 frames = 9 faults < 4 frames = 10 faults)", () => {
    const preset = PAGE_REPLACEMENT_PRESETS.find((p) => p.id === 'belady-anomaly')!;
    const f3 = runPageReplacement(preset.referenceString, 3, 'FIFO');
    const f4 = runPageReplacement(preset.referenceString, 4, 'FIFO');
    assert.equal(f3.faults, 9);
    assert.equal(f4.faults, 10);
  });

  it('computes C1 Set 2-2 Q6 and C2 Q7 page replacement comparisons with OPT <= LRU', () => {
    const q6 = PAGE_REPLACEMENT_PRESETS.find((p) => p.id === 'c1-2-2-q6')!;
    const fifo6 = runPageReplacement(q6.referenceString, 4, 'FIFO');
    const lru6 = runPageReplacement(q6.referenceString, 4, 'LRU');
    const opt6 = runPageReplacement(q6.referenceString, 4, 'OPT');
    assert.ok(opt6.faults <= lru6.faults && opt6.faults <= fifo6.faults);

    const q7 = PAGE_REPLACEMENT_PRESETS.find((p) => p.id === 'c2-q7')!;
    const fifo7 = runPageReplacement(q7.referenceString, 4, 'FIFO');
    const lru7 = runPageReplacement(q7.referenceString, 4, 'LRU');
    const opt7 = runPageReplacement(q7.referenceString, 4, 'OPT');
    assert.equal(fifo7.faults, 14);
    assert.equal(opt7.faults, 8);
    assert.equal(lru7.faults, 10);
  });

  it('solves C1 Set 1-2 Q6 Working Set snapshots at 8th and 12th references', () => {
    const ws = evaluateWorkingSet([1, 2, 3, 2, 4, 1, 5, 2, 1, 3, 4, 5], 5);
    assert.deepEqual(ws[7].workingSet, [1, 2, 4, 5]); // 8th ref
    assert.deepEqual(ws[11].workingSet, [1, 2, 3, 4, 5]); // 12th ref
  });

  it('solves C2 Q8 Paging + TLB bit splits and EAT (80% -> 130ns, 95% -> 115ns)', () => {
    const r80 = computePagingTlb({
      vasKB: 64,
      ramKB: 16,
      pageSizeKB: 1,
      tlbNs: 10,
      ramNs: 100,
      hitRatioPercent: 80,
    });
    assert.equal(r80.pageNumberBits, 6);
    assert.equal(r80.offsetBits, 10);
    assert.equal(r80.frameNumberBits, 4);
    assert.equal(r80.physicalAddressBits, 14);
    assert.equal(r80.eatNs, 130);

    const r95 = computePagingTlb({
      vasKB: 64,
      ramKB: 16,
      pageSizeKB: 1,
      tlbNs: 10,
      ramNs: 100,
      hitRatioPercent: 95,
    });
    assert.equal(r95.eatNs, 115);
  });

  it('solves C1 Set 1-2 Q5 Segmentation table translations', () => {
    assert.equal(translateSegmentAddress(SEGMENTATION_PRESET_C1_1_2_Q5, 'Code', 250).physicalAddress, 1250);
    assert.equal(translateSegmentAddress(SEGMENTATION_PRESET_C1_1_2_Q5, 'Data', 350).valid, false);
    assert.equal(translateSegmentAddress(SEGMENTATION_PRESET_C1_1_2_Q5, 'Heap', 400).physicalAddress, 4400);
    assert.equal(translateSegmentAddress(SEGMENTATION_PRESET_C1_1_2_Q5, 'Stack', 150).physicalAddress, 6150);
  });

  it('solves C1 Set 2-2 Q8 Contiguous Placement across all 4 strategies', () => {
    const { blocks, processes } = PLACEMENT_PRESET_C1_2_2_Q8;
    const ff = runContiguousPlacement(blocks, processes, 'FIRST_FIT');
    const bf = runContiguousPlacement(blocks, processes, 'BEST_FIT');
    const wf = runContiguousPlacement(blocks, processes, 'WORST_FIT');
    const nf = runContiguousPlacement(blocks, processes, 'NEXT_FIT');
    assert.equal(bf.allocatedCount, 5); // P5=400 unallocated -> demonstrates external fragmentation!
    assert.equal(bf.canFitUnallocatedInTotalFree, true);
    assert.ok(ff.totalFreeMemory > 0 && wf.totalFreeMemory > 0 && nf.totalFreeMemory > 0);
  });
});

describe('Disk Scheduling & RAID Engine (Real VIT FAT Presets)', () => {
  it('solves C2 Q9 LOOK, C-LOOK, and SSTF (0-499, head 215 moving down)', () => {
    const preset = DISK_PRESETS.find((p) => p.id === 'c2-q9')!;
    const look = runDiskSchedule({ ...preset.input, algorithm: 'LOOK' });
    const clook = runDiskSchedule({ ...preset.input, algorithm: 'C-LOOK' });
    const sstf = runDiskSchedule({ ...preset.input, algorithm: 'SSTF' });
    // LOOK down: 215 -> 170 -> 140 -> 125 -> 82 -> 43 -> 230 -> 310 -> 465 => (215-43)+(465-43) = 172+422 = 594
    assert.equal(look.totalHeadMovement, 594);
    assert.ok(clook.totalHeadMovement > 0);
    assert.ok(sstf.totalHeadMovement > 0);
  });

  it('solves C1 Set 1-2 Q9 SSTF, SCAN & 6000 RPM avg rotational latency', () => {
    const preset = DISK_PRESETS.find((p) => p.id === 'c1-1-2-q9')!;
    const sstf = runDiskSchedule({ ...preset.input, algorithm: 'SSTF' });
    const scan = runDiskSchedule({ ...preset.input, algorithm: 'SCAN' });
    assert.equal(sstf.avgRotationalLatencyMs, 5);
    assert.ok(sstf.totalHeadMovement > 0);
    assert.ok(scan.sequence.includes(1), 'SCAN moving down on 1..100 must hit track 1');
  });

  it('evaluates RAID 0 and RAID 6 capacities & fault tolerance (C1 Set 1-2 Q7)', () => {
    const r0 = evaluateRaidLevel('RAID0', 4, 2);
    const r6 = evaluateRaidLevel('RAID6', 6, 2);
    assert.equal(r0.usableCapacityTB, 8);
    assert.equal(r0.maxDiskFailures, 0);
    assert.equal(r6.usableCapacityTB, 8);
    assert.equal(r6.maxDiskFailures, 2);
  });
});
