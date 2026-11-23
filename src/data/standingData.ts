import { StandingQuestion, STANDING_M1 } from './standingM1';
import { STANDING_M2 } from './standingM2';
import { STANDING_M3 } from './standingM3';
import { STANDING_M4 } from './standingM4';
import { STANDING_M5 } from './standingM5';

export type { StandingQuestion };

export interface ModuleRefresher {
  moduleId: 'm1' | 'm2' | 'm3' | 'm4' | 'm5';
  title: string;
  readMinutes: number;
  coreMentalModel: string;
  mustKnowFormulas: string[];
  highYieldBullets: string[];
  fatCheckpoints: string[];
}

export const STANDING_QUESTIONS_BY_MODULE: Record<'m1' | 'm2' | 'm3' | 'm4' | 'm5', StandingQuestion[]> = {
  m1: STANDING_M1,
  m2: STANDING_M2,
  m3: STANDING_M3,
  m4: STANDING_M4,
  m5: STANDING_M5,
};

export const ALL_STANDING_QUESTIONS: StandingQuestion[] = [
  ...STANDING_M1,
  ...STANDING_M2,
  ...STANDING_M3,
  ...STANDING_M4,
  ...STANDING_M5,
];

export const MODULE_REFRESHERS: Record<'m1' | 'm2' | 'm3' | 'm4' | 'm5', ModuleRefresher> = {
  m1: {
    moduleId: 'm1',
    title: 'Module 1 Rapid Refresher — OS Structures, Syscalls, DMA & Booting',
    readMinutes: 4,
    coreMentalModel:
      'Hardware enforces isolation with Dual-Mode (`0=Kernel, 1=User`) and timers; kernel structure decides whether drivers run fast in Ring 0 (Monolithic/LKM) or safely in User Space via IPC (Microkernel).',
    mustKnowFormulas: [
      'Mode bit: 0 = Kernel Mode (privileged), 1 = User Mode',
      'FD Rule: close(1) -> open("report.log") assigns lowest free FD = 1',
      'DMA Interrupts = 1 per block (vs N per byte in byte-level Interrupt I/O)',
    ],
    highYieldBullets: [
      'Monolithic = direct C calls, fast, driver crash panics OS; Microkernel = IPC message passing, fault-isolated, context-switch overhead.',
      'Linux Boot Order: BIOS/UEFI POST -> GRUB Bootloader -> Kernel -> initramfs -> Mount rootfs (/) -> init/systemd (PID 1).',
      'Policy (WHAT, e.g., 20 ms quantum) must stay separate from Mechanism (HOW, e.g., hardware countdown timer).',
      '3 Syscall Parameter-Passing modes: Registers, Memory Block pointer in register (Linux), or Stack.',
    ],
    fatCheckpoints: [
      'Draw the horizontal User/Kernel privilege boundary on EVERY architecture diagram (C1 2-2 Q1).',
      'In shell redirection `./analyzer data.txt > report.log`, `close(1)` + `open()` MUST happen in the forked child before `exec()` (C2 Q1b).',
    ],
  },
  m2: {
    moduleId: 'm2',
    title: 'Module 2 Rapid Refresher — Processes, Threads, CPU Scheduling & Deadlocks',
    readMinutes: 6,
    coreMentalModel:
      'Every M2 15M numerical boils down to disciplined state bookkeeping: Gantt timestamps (including CS blocks), Need/Work vectors in Banker’s, and Wait-For cycle topology.',
    mustKnowFormulas: [
      'TAT = CT - AT   |   WT = TAT - BT   |   RT = FirstStart - AT',
      'Amdahl’s Law: Speedup <= 1 / (S + (1 - S) / N)',
      'Banker’s: Need = Max - Alloc   |   Available = Total - Sum(Alloc)',
      'Unconditional n fork() calls => 2^n total processes (2^n - 1 children)',
    ],
    highYieldBullets: [
      'Threads share Code, Data, Heap & Open Files; private per thread: Stack, Registers, Program Counter.',
      'Preemptive Priority + 1 ms CS (C1 2-2 Q5): exclude CS at t=0 and final completion; equal priority = FCFS; re-check arrivals at `t + CS`.',
      'Banker’s Request Check: (1) Req <= Need, (2) Req <= Avail, (3) Tentative Safety — ALWAYS check Step 3 (C1 2-2 Q7c denies Request2!).',
      'Single-instance RAG cycle = necessary & sufficient for deadlock; Multi-instance cycle = necessary ONLY.',
    ],
    fatCheckpoints: [
      'Sanity-check Gantt makespan: `Total Time == Sum(BT) + Total_CS + Total_Idle`.',
      'Sanity-check Banker’s Safety: `Final Work == Total System Resources`.',
    ],
  },
  m3: {
    moduleId: 'm3',
    title: 'Module 3 Rapid Refresher — IPC, Peterson’s, Hardware CAS, Semaphores & Monitors',
    readMinutes: 5,
    coreMentalModel:
      'Synchronization eliminates race conditions while preserving Mutual Exclusion, Progress, and Bounded Waiting — without slipping into deadlock from reversed lock order.',
    mustKnowFormulas: [
      'Peterson’s: flag[i]=T; turn=j; while(flag[j] && turn==j);',
      'Bounded Buffer (size N): mutex=1, empty=N, full=0',
      'Blocking Semaphore: S.value == -k  <=>  k processes sleeping in S.list',
    ],
    highYieldBullets: [
      'Peterson’s Proof: if both in CS -> both flags true -> `turn` must be both 0 and 1 simultaneously -> Contradiction! Needs memory barriers on modern OoO CPUs.',
      'Naive Test-and-Set / CAS violates Bounded Waiting -> fixed with cyclic `waiting[n]` handoff (`<= n-1` turns).',
      'Bounded Buffer & Sleeping Barber: NEVER acquire `mutex` before blocking on `empty`/`full`/`customers`, and NEVER forget `signal(mutex)` in an `else` branch!',
      'Mesa Monitors (Java/POSIX) require `while (!cond) cv.wait();` — `cv.signal()` with empty queue is a no-op.',
    ],
    fatCheckpoints: [
      'Remember `turn == 0` lets **P0** enter first (C2 Q5: 10 seats -> 8 -> 6).',
      'In Hospital Monitor (C1 1-2 Q4), increment `freeTheatres` ONLY in `completeCleaning()`, not `releaseTheatre()`.',
    ],
  },
  m4: {
    moduleId: 'm4',
    title: 'Module 4 Rapid Refresher — Memory Placement, Paging/TLB, Virtual Memory & File Systems',
    readMinutes: 6,
    coreMentalModel:
      'Paging eliminates external fragmentation with fixed frames and a TLB; Demand Paging loads pages on fault; File Systems (0% tested so far!) mirror memory allocation via Inodes and Bitmaps.',
    mustKnowFormulas: [
      'TLB EAT = α(T_tlb + T_mem) + (1 - α)(T_tlb + 2*T_mem)',
      'Demand Paging EAT = (1 - p)*ma + p*PageFaultTime  (1 ms = 10^6 ns)',
      'Segmentation: valid iff offset < limit (strict!) -> Phys = base + offset',
      'Unix Inode: MaxBlocks = Direct + P + P^2 + P^3  where P = BlockSize / PtrSize',
    ],
    highYieldBullets: [
      'OPT & LRU are Stack Algorithms (zero Belady’s Anomaly); FIFO suffers Belady’s Anomaly (`1,2,3,4,1,2,5,1,2,3,4,5`: 3f=9 < 4f=10).',
      'Working Set `WSS_i(Δ)` = distinct pages in last `Δ` refs; if `D = ΣWSS_i > m` frames -> Thrashing -> suspend/swap out a process.',
      'Contiguous Placement (C1 2-2 Q8): remember Next Fit wraps circularly; check conservation `Initial == Allocated + Final Free`.',
      'OVERDUE GAP: Directory DAG (Hard vs Soft links) + Contiguous/Linked-FAT/Indexed Inode allocation had ZERO questions in C1 & C2!',
    ],
    fatCheckpoints: [
      'Always state OPT tie-break rule (earliest loaded) and check `Faults + Hits == RefString.length`.',
      'Check strict `<` on Segmentation (`offset == limit` is a TRAP!).',
    ],
  },
  m5: {
    moduleId: 'm5',
    title: 'Module 5 Rapid Refresher — Disk Scheduling, RAID, Security, Access Matrix & Virtualization',
    readMinutes: 5,
    coreMentalModel:
      'Disk schedulers trade seek distance against starvation; RAID trades capacity against disk-failure survival; Security/Access Matrix (0% tested so far!) and Containers vs VMs dominate CO5.',
    mustKnowFormulas: [
      'Avg Rotational Latency = (60,000 ms / RPM) / 2   (6000 RPM => 5 ms)',
      'RAID Usable: R0=N*C | R1/10=(N/2)*C | R5=(N-1)*C | R6=(N-2)*C',
      'RSA Confidentiality = Receiver PUBLIC key | Digital Signature = Sender PRIVATE key on H(M)',
    ],
    highYieldBullets: [
      'ALWAYS check disk arm direction from previous request (`prev 250 -> curr 215` => DOWNWARD toward 0 in C2 Q9).',
      'SCAN/C-SCAN touch physical boundary (0/maxTrack); LOOK/C-LOOK reverse at last pending request.',
      'OVERDUE GAP: Stack Buffer Overflow (ASLR, DEP/NX, Stack Canaries), AES vs RSA/TLS, and Access Matrix (ACL=column easy revoke vs Capability=row fast check).',
      'Full VM = unmodified guest OS + hypervisor; Para-Virt = modified guest + hypercalls; Docker Containers = shared Host Kernel + Namespaces + cgroups.',
    ],
    fatCheckpoints: [
      'Never skip naming **Namespaces** and **cgroups** in any Docker/Container question.',
      'On C-LOOK, state clearly whether wrap-around return movement is included in total tracks.',
    ],
  },
};
