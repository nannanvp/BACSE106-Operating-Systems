export interface FormulaEntry {
  id: string;
  moduleId: string;
  moduleCode: string;
  title: string;
  formula: string;
  unitsOrCondition: string;
  trapNote: string;
  keywords: string[];
}

export const OS_FORMULAS: FormulaEntry[] = [
  {
    id: 'f-amdahl',
    moduleId: 'm2',
    moduleCode: 'M2',
    title: "Amdahl's Law (Multicore Speedup)",
    formula: 'Speedup <= 1 / (S + (1 - S) / N)',
    unitsOrCondition: 'S = serial fraction (0..1), N = number of cores',
    trapNote: 'As N -> infinity, max speedup is bounded by 1 / S (not N).',
    keywords: ['amdahl', 'speedup', 'serial', 'parallel', 'cores', 'threads'],
  },
  {
    id: 'f-cpu-tat-wt-rt',
    moduleId: 'm2',
    moduleCode: 'M2',
    title: 'CPU Scheduling Metrics (TAT, WT, RT)',
    formula: 'TAT = CT - AT   |   WT = TAT - BT   |   RT = FirstStart - AT',
    unitsOrCondition: 'ms; For non-preemptive scheduling without CS, WT == RT',
    trapNote: 'With 1 ms CS overhead (C1 2-2 Q5), CS time inflates CT, TAT, and WT — never subtract CS from BT.',
    keywords: ['cpu', 'scheduling', 'turnaround', 'waiting', 'response', 'gantt', 'cs', 'overhead'],
  },
  {
    id: 'f-cpu-util',
    moduleId: 'm2',
    moduleCode: 'M2',
    title: 'CPU Utilization & Throughput',
    formula: 'Utilization = (Sum BT / Total Makespan) * 100%   |   Throughput = n / Total Makespan',
    unitsOrCondition: 'Total Makespan includes IDLE and Context Switch (CS) blocks',
    trapNote: 'High CS count drops effective CPU utilization even with 0 idle time.',
    keywords: ['utilization', 'throughput', 'makespan', 'context switch'],
  },
  {
    id: 'f-bankers-need',
    moduleId: 'm2',
    moduleCode: 'M2',
    title: "Banker's Algorithm Need & Available",
    formula: 'Need[i] = Max[i] - Allocation[i]   |   Available = Total - Sum(Allocation)',
    unitsOrCondition: 'Safe iff all n processes satisfy Need[i] <= Work -> Work += Allocation[i]',
    trapNote: 'For Resource Request: check (1) Req <= Need, (2) Req <= Avail, (3) Tentative Safety — ALL three steps required.',
    keywords: ['banker', 'deadlock', 'need', 'available', 'work', 'safety', 'request'],
  },
  {
    id: 'f-peterson',
    moduleId: 'm3',
    moduleCode: 'M3',
    title: "Peterson's Entry Condition",
    formula: 'flag[i] = true; turn = j; while (flag[j] && turn == j) ;',
    unitsOrCondition: 'Strictly 2 processes (P0, P1); satisfies ME, Progress, Bounded Waiting',
    trapNote: 'If flag[0]=T, flag[1]=T, turn=0 -> P0 enters first (because P0 checks turn==1 which is false).',
    keywords: ['peterson', 'flag', 'turn', 'critical section', 'mutual exclusion', 'sync'],
  },
  {
    id: 'f-bounded-buffer',
    moduleId: 'm3',
    moduleCode: 'M3',
    title: 'Bounded Buffer Semaphores (Capacity N)',
    formula: 'mutex = 1, empty = N, full = 0   |   Producer: wait(empty) BEFORE wait(mutex)',
    unitsOrCondition: 'Consumer: wait(full) BEFORE wait(mutex)',
    trapNote: 'Reversing wait(mutex) before wait(empty)/wait(full) causes immediate DEADLOCK when buffer is full/empty!',
    keywords: ['semaphore', 'bounded buffer', 'producer', 'consumer', 'mutex', 'empty', 'full', 'deadlock'],
  },
  {
    id: 'f-paging-bits',
    moduleId: 'm4',
    moduleCode: 'M4',
    title: 'Paging Address Bit Splits',
    formula: 'd = log2(PageSize)  |  p = log2(VAS) - d  |  f = log2(RAM) - d',
    unitsOrCondition: 'Logical bits = p + d; Physical bits = f + d; Pages = 2^p; Frames = 2^f',
    trapNote: 'Page offset d is IDENTICAL in both logical and physical addresses.',
    keywords: ['paging', 'bits', 'offset', 'logical', 'physical', 'frame', 'page table', 'vas'],
  },
  {
    id: 'f-tlb-eat',
    moduleId: 'm4',
    moduleCode: 'M4',
    title: 'TLB Effective Access Time (EAT)',
    formula: 'EAT = alpha * (T_tlb + T_mem) + (1 - alpha) * (T_tlb + 2 * T_mem)',
    unitsOrCondition: 'alpha = TLB hit ratio (0..1); simplifies to T_tlb + (2 - alpha) * T_mem',
    trapNote: 'On a TLB miss, memory is accessed TWICE: once for page table entry, once for actual data.',
    keywords: ['tlb', 'eat', 'effective access time', 'hit ratio', 'miss', 'paging'],
  },
  {
    id: 'f-demand-paging-eat',
    moduleId: 'm4',
    moduleCode: 'M4',
    title: 'Demand Paging Effective Access Time',
    formula: 'EAT = (1 - p) * ma + p * PageFaultTime',
    unitsOrCondition: 'p = page fault rate (0..1), ma = memory access time',
    trapNote: 'Keep units consistent! Convert ms (10^6 ns) to ns before multiplying with ma (ns).',
    keywords: ['demand paging', 'page fault', 'eat', 'virtual memory', 'thrashing'],
  },
  {
    id: 'f-segmentation',
    moduleId: 'm4',
    moduleCode: 'M4',
    title: 'Segmentation Address Translation',
    formula: 'if (offset < limit[s]) PhysAddr = base[s] + offset; else TRAP (Addressing Error)',
    unitsOrCondition: 'Valid offsets are 0 .. (limit - 1) inclusive',
    trapNote: 'Strict inequality! offset == limit is an illegal addressing error (TRAP).',
    keywords: ['segmentation', 'base', 'limit', 'trap', 'offset', 'physical'],
  },
  {
    id: 'f-working-set',
    moduleId: 'm4',
    moduleCode: 'M4',
    title: 'Working-Set Model & Thrashing Condition',
    formula: 'D = Sum(WSS_i)   |   if (D > m) -> Thrashing (suspend/swap out a process)',
    unitsOrCondition: 'WSS_i = distinct pages referenced in most recent Delta (Δ) references; m = total frames',
    trapNote: 'If Δ is too small, misses locality; if Δ is too large, spans multiple localities.',
    keywords: ['working set', 'wss', 'delta', 'thrashing', 'frames', 'locality'],
  },
  {
    id: 'f-inode-max',
    moduleId: 'm4',
    moduleCode: 'M4',
    title: 'Unix Indexed Allocation (Inode) Max File Size',
    formula: 'MaxBlocks = Direct + P + P^2 + P^3   where P = BlockSize / PointerSize',
    unitsOrCondition: 'MaxSize = MaxBlocks * BlockSize (single, double, triple indirect blocks)',
    trapNote: 'Watch pointer byte size (4 B vs 8 B) and exact number of direct pointers (usually 12).',
    keywords: ['inode', 'file', 'indexed', 'indirect', 'unix', 'block', 'pointer', 'max size'],
  },
  {
    id: 'f-disk-latency',
    moduleId: 'm5',
    moduleCode: 'M5',
    title: 'Disk Seek & Average Rotational Latency',
    formula: 'SeekTime = TotalTracks * msPerTrack   |   AvgRotLatency = (60,000 ms / RPM) / 2',
    unitsOrCondition: '6000 RPM -> 10 ms full rotation -> 5 ms average rotational latency',
    trapNote: 'SCAN hits disk boundary (0 or maxTrack) before reversing; LOOK reverses at last request!',
    keywords: ['disk', 'seek', 'rpm', 'rotational', 'scan', 'look', 'sstf', 'c-scan', 'c-look'],
  },
  {
    id: 'f-raid-capacity',
    moduleId: 'm5',
    moduleCode: 'M5',
    title: 'RAID Usable Capacity & Fault Tolerance',
    formula: 'R0: N*C (0 fail) | R1/10: (N/2)*C | R5: (N-1)*C (1 fail) | R6: (N-2)*C (2 fail)',
    unitsOrCondition: 'N = total disks, C = single disk capacity',
    trapNote: 'Minimum disks: RAID 0/1 >= 2, RAID 5 >= 3, RAID 6/10 >= 4.',
    keywords: ['raid', 'parity', 'striping', 'mirroring', 'capacity', 'fault tolerance', 'mttdl'],
  },
  {
    id: 'f-rsa',
    moduleId: 'm5',
    moduleCode: 'M5',
    title: 'RSA Public-Key Encryption & Digital Signature',
    formula: 'n = p*q, phi(n) = (p-1)(q-1), e*d ≡ 1 (mod phi) | Enc: m^e mod n | Sign: H(m)^d mod n',
    unitsOrCondition: 'Confidentiality uses receiver public key; Digital signature uses sender private key',
    trapNote: 'Do not confuse: encrypt with receiver PUBLIC key, sign with sender PRIVATE key.',
    keywords: ['rsa', 'cryptography', 'security', 'public key', 'private key', 'signature', 'hash'],
  },
];

/**
 * Multi-token case-insensitive AND filter across title, formula, moduleCode, trapNote, and keywords.
 */
export function filterFormulas(entries: FormulaEntry[], rawQuery: string): FormulaEntry[] {
  const tokens = rawQuery
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  if (tokens.length === 0) return entries;

  return entries.filter((entry) => {
    const haystack = [
      entry.moduleCode,
      entry.title,
      entry.formula,
      entry.unitsOrCondition,
      entry.trapNote,
      ...entry.keywords,
    ]
      .join(' ')
      .toLowerCase();
    return tokens.every((tok) => haystack.includes(tok));
  });
}
