import { TopicNote } from './noteTypes';

export const MODULE_4_NOTES: TopicNote[] = [
  {
    topicId: 'm4-contiguous-allocation',
    moduleId: 'm4',
    title: 'MMU Address Binding, Fragmentation & Contiguous Placement (FF, BF, WF, NF)',
    summary:
      'The MMU translates logical addresses to physical RAM via relocation/limit registers; contiguous dynamic partitioning trades search speed against external fragmentation across First, Best, Worst, and Next Fit.',
    sourceDecks: ['Silberschatz 10e Ch 9 (§9.1–9.2)', 'VITC Past Paper: C1 Set 2-2 Q8 (15M)'],
    keyPoints: [
      'Address binding times: **Compile-time** (absolute code), **Load-time** (relocatable code), **Execution-time** (requires hardware **MMU** with Relocation + Limit registers).',
      '**Internal Fragmentation**: wasted bytes *inside* an allocated partition/frame. **External Fragmentation**: enough total free RAM exists, but split into non-contiguous holes too small for the request.',
      '4 Contiguous Strategies: **First Fit** (fastest, 50%-rule frag), **Next Fit** (resumes from last pointer with wrap-around), **Best Fit** (smallest sufficient hole -> tiny leftover slivers), **Worst Fit** (largest hole -> preserves medium leftovers).',
      'External fragmentation remedies: **Compaction** (only possible with execution-time relocation; expensive copying) or **Non-Contiguous Paging**.',
    ],
    sections: [
      {
        heading: 'MMU Hardware Relocation & Limit Protection',
        body: 'The CPU emits a logical address `L`. Hardware checks `L < Limit Register` (else raises an Addressing Error trap) and adds `Relocation (Base) Register` to produce physical address `P = Base + L`.',
        diagramId: 'm4-mmu-relocation',
      },
      {
        heading: 'Verified 15M FAT Masterpiece: C1 Set 2-2 Q8 (7 Blocks, 6 Processes)',
        body: 'Free blocks `[180, 420, 260, 500, 320, 380, 220]` KB (total = `2280 KB`). Requests: `P1=100, P2=410, P3=390, P4=350, P5=400, P6=240` (sum = `1890 KB`). Remainder stays in place. Verify step-by-step in **Lab 4 (Memory & Paging Lab)**!',
        table: {
          headers: ['Strategy', 'Allocated Count', 'Unallocated', 'Total Free KB', 'Largest Free Hole', 'Final Block Remainders (KB)'],
          rows: [
            ['First Fit', '5 / 6', 'P5 (400 KB)', '790 KB', '320 KB', '[80, 10, 20, 110, 320, 30, 220]'],
            ['Best Fit', '5 / 6', 'P5 (400 KB)', '790 KB', '320 KB', '[80, 10, 20, 110, 320, 30, 220]'],
            ['Next Fit', '5 / 6', 'P5 (400 KB)', '790 KB', '320 KB', '[80, 10, 20, 110, 320, 30, 220] (wraps on P5/P6)'],
            ['Worst Fit', '5 / 6', 'P5 (400 KB)', '790 KB', '260 KB', '[180, 10, 260, 10, 80, 30, 220]'],
          ],
        },
      },
    ],
    workedExample: {
      title: 'Why External Fragmentation Rejects P5 (400 KB) in C1 2-2 Q8',
      problem:
        'After allocating P1, P2, P3, P4 (1250 KB total), 1030 KB remains free before P5 arrives (and 790 KB remains after P6). Why does P5 (400 KB) fail across ALL four strategies?',
      solution:
        'Total free RAM (`790 KB` at end, `1030 KB` when P5 arrives) easily exceeds `400 KB`, **yet no single contiguous hole is >= 400 KB** (largest hole is `320 KB` in FF/BF/NF and `260 KB` in WF). This is the textbook definition of **External Fragmentation**.',
    },
    fatQuestionMethods: [
      {
        paperSource: 'Slot C1+TC1 Set 2-2 Q8 (15M)',
        promptSummary: 'First Fit & Best Fit (4M), Next Fit w/ pointer wrap (4M), Worst Fit (4M), comparison & external fragmentation (3M).',
        markBreakdown: 'FF+BF traces (4M) + Next Fit wrap-around trace (4M) + Worst Fit trace (4M) + Summary table + External Frag (3M)',
        solutionSteps: [
          'Show the array of 7 blocks after EVERY process `P1..P6` so partial credit is guaranteed even if one line slips.',
          'For Next Fit, explicitly annotate the pointer index after every allocation and note the circular wrap-around when searching for `P5` and `P6`.',
          'Conclude with exact comparison metrics: `5/6` allocated, `790 KB` total free, `320 KB` vs `260 KB` largest hole -> external fragmentation.',
        ],
      },
    ],
    selfChecks: [
      {
        id: 'sc-m4-ca-1',
        question: 'Which address-binding stage is REQUIRED to perform runtime memory compaction?',
        options: ['Compile-time binding', 'Load-time binding', 'Execution-time binding (with MMU)', 'Assembler macro binding'],
        correctIndex: 2,
        explanation: 'Compaction moves live processes in physical RAM at runtime, which is only possible with execution-time relocation hardware.',
      },
      {
        id: 'sc-m4-ca-2',
        question: 'Which contiguous strategy tends to produce the smallest, most unusable leftover memory slivers?',
        options: ['First Fit', 'Best Fit', 'Worst Fit', 'Paging'],
        correctIndex: 1,
        explanation: 'Best Fit chooses the tightest-fitting hole, leaving tiny slivers too small for future requests.',
      },
    ],
    examTip: 'Always check total memory conservation: `Sum(Initial Blocks) == Sum(Allocated Processes) + Sum(Final Free Blocks)` (`2280 = 1490 + 790`)!',
  },
  {
    topicId: 'm4-paging-tlb',
    moduleId: 'm4',
    title: 'Paging, TLB Effective Access Time (EAT), Multi-Level/Hashed/Inverted Tables & Segmentation',
    summary:
      'Paging eliminates external fragmentation by mapping fixed-size virtual pages to physical frames accelerated by an associative TLB; Segmentation exposes logical variable-size code/data/stack regions with base-limit protection.',
    sourceDecks: ['Silberschatz 10e Ch 9 (§9.3–9.6)', 'VITC Past Papers: C2 Q8 & C1 1-2 Q5'],
    keyPoints: [
      'Bit splits: `d = log2(PageSize)`, `p = log2(VAS) - d`, `f = log2(RAM) - d`. Offset `d` is **identical** in logical and physical addresses.',
      '**TLB EAT**: `EAT = α * (T_tlb + T_mem) + (1 - α) * (T_tlb + 2 * T_mem) = T_tlb + (2 - α) * T_mem`.',
      'Large-VAS Page Table structures: **Hierarchical (Multi-level)** (pages the page table), **Hashed** (common for 64-bit sparse VAS), **Inverted** (1 global entry per physical RAM frame `<pid, p>`).',
      '**Segmentation**: `<segment, offset>` checks STRICT **`offset < limit`**; if valid `Phys = base + offset`, else **TRAP (Addressing Error)**.',
    ],
    sections: [
      {
        heading: 'Paging Hardware with Associative TLB',
        body: 'On a TLB hit, the frame number `f` is retrieved in parallel in `~10 ns` (1 RAM access total). On a TLB miss, the CPU must read the Page Table in RAM first, update the TLB, and then access the actual data word (2 RAM accesses total).',
        diagramId: 'm4-paging-tlb',
        table: {
          headers: ['C2 Q8 Parameter', 'Calculation', 'Exact Answer'],
          rows: [
            ['VAS = 64 KB, Page = 1 KB', '64 KB = 2^16, 1 KB = 2^10', 'Logical = 16 bits (`p = 6`, `d = 10`), 64 pages'],
            ['RAM = 16 KB, Frame = 1 KB', '16 KB = 2^14, 1 KB = 2^10', 'Physical = 14 bits (`f = 4`, `d = 10`), 16 frames'],
            ['EAT at 80% TLB Hit (TLB=10ns, RAM=100ns)', '0.80(10+100) + 0.20(10+200)', '**130 ns**'],
            ['EAT at 95% TLB Hit', '0.95(110) + 0.05(210)', '**115 ns** (`15 ns` / `11.54%` faster!)'],
          ],
        },
      },
      {
        heading: 'Segmentation Hardware & C1 Set 1-2 Q5 Translation Table',
        body: 'Segments reflect programmer views (Code, Data, Heap, Stack). Remember: Segmentation eliminates internal fragmentation but **re-introduces external fragmentation** (solved by Paged Segmentation or Compaction).',
        diagramId: 'm4-segmentation-hw',
        table: {
          headers: ['Logical Address (C1 1-2 Q5)', 'Base', 'Limit', 'Check (`offset < limit`)', 'Physical Address'],
          rows: [
            ['(Code, 250)', '1000', '400', '250 < 400 (Valid)', '`1000 + 250 = 1250`'],
            ['(Data, 350)', '2500', '300', '350 < 300 (FALSE!)', '**TRAP: Addressing Error**'],
            ['(Heap, 400)', '4000', '500', '400 < 500 (Valid)', '`4000 + 400 = 4400`'],
            ['(Stack, 150)', '6000', '200', '150 < 200 (Valid)', '`6000 + 150 = 6150`'],
          ],
        },
      },
    ],
    workedExample: {
      title: 'Why Inverted Page Tables Save Gigabytes on 64-Bit Systems',
      problem:
        'A 64-bit system has 4 KB pages and 16 GB of physical RAM. Compare 1-level page table entries per process vs Inverted Page Table entries system-wide.',
      solution:
        '1-level table requires `2^64 / 2^12 = 2^52` entries per process (impossible!). An **Inverted Page Table** needs only `16 GB / 4 KB = 2^34 / 2^12 = 2^22 = 4,194,304` entries **total for the entire machine**, regardless of how many processes run (trade-off: slower lookup requiring hash table & harder shared memory).',
    },
    fatQuestionMethods: [
      {
        paperSource: 'Slot C2+TC2 Q8 (10M) & Slot C1 Set 1-2 Q5 (10M)',
        promptSummary: 'C2 Q8: Paging bit splits (3M), EAT 80% (3M), EAT 95% speedup (2M), Why TLB helps (2M). C1 1-2 Q5: Segmentation translation (4M) + Fragmentation (6M).',
        markBreakdown: 'Bit formula + powers of 2 (3M) + EAT formula & substitution (5M) + 2-RAM-access insight (2M)',
        solutionSteps: [
          'Always convert KB/MB to exact powers of 2 first (`64 KB = 2^16`, `16 KB = 2^14`, `1 KB = 2^10`).',
          'Show both `Hit = T_tlb + T_mem` and `Miss = T_tlb + 2*T_mem` explicitly before plugging `α`.',
          'For Segmentation, write the explicit boolean check `offset < limit` on every row before adding `base + offset`.',
        ],
      },
    ],
    selfChecks: [
      {
        id: 'sc-m4-pt-1',
        question: 'If a logical address space is 1 MB (`2^20` B) and page size is 4 KB (`2^12` B), how many bits form the Page Number `p` and Offset `d`?',
        options: ['p = 12, d = 8', 'p = 8, d = 12', 'p = 10, d = 10', 'p = 16, d = 4'],
        correctIndex: 1,
        explanation: 'Offset `d = log2(4096) = 12` bits; Page number `p = 20 - 12 = 8` bits (256 pages).',
      },
      {
        id: 'sc-m4-pt-2',
        question: 'In Segmentation, if segment `S` has `base = 2000` and `limit = 300`, what happens for `(S, 300)`?',
        options: ['Maps to physical address 2300', 'Raises an Addressing Error TRAP because valid offsets are 0..299', 'Maps to 2299', 'Triggers Copy-on-Write'],
        correctIndex: 1,
        explanation: 'The hardware check is strictly `offset < limit`. `300 < 300` is false -> TRAP!',
      },
    ],
    examTip: 'Never forget the second memory access on a TLB miss (`T_tlb + 2 * T_mem`) — writing `+ T_mem` instead of `+ 2 * T_mem` is one of the top -2M FAT errors!',
  },
  {
    topicId: 'm4-virtual-memory',
    moduleId: 'm4',
    title: 'Virtual Memory, Demand Paging Fault Cycle, Copy-on-Write & Fault-Rate EAT',
    summary:
      'Demand paging loads pages into RAM lazily only when referenced via a 6-step hardware/OS page-fault handler, enabling processes larger than physical RAM and ultra-fast `fork()` via Copy-on-Write.',
    sourceDecks: ['Silberschatz 10e Ch 10 (§10.1–10.3)', 'VITC BACSE106 Module 4'],
    keyPoints: [
      'Each Page Table Entry carries a **Valid–Invalid bit**: `v` = page is legal & resident in RAM; `i` = either illegal address OR legal page currently on disk (backing store).',
      '6-Step Page Fault Sequence: **1. Trap to OS -> 2. Validate reference & find disk block -> 3. Locate free frame -> 4. Disk I/O read into frame -> 5. Update PTE (`valid=v`) -> 6. Restart instruction**.',
      '**Demand Paging EAT**: `EAT = (1 - p) * ma + p * PageFaultTime`. Because disk/SSD I/O is orders of magnitude slower than RAM (`ms` vs `ns`), `p` must stay `< 10^-5` to avoid severe slowdown!',
      '**Copy-on-Write (COW)**: `fork()` shares pages read-only between parent and child; physical copy occurs ONLY when one modifies a shared page.',
    ],
    sections: [
      {
        heading: '6-Step Hardware/OS Page Fault Handling Cycle',
        body: 'Pure demand paging starts a process with zero pages in RAM and faults them in on first touch. A **modify (dirty) bit** avoids writing unmodified victim pages back to disk on eviction, cutting page-fault I/O in half.',
        diagramId: 'm4-demand-paging-fault',
      },
      {
        heading: 'Calculating Maximum Tolerable Page-Fault Rate `p`',
        body: 'Watch units rigorously! Convert `ms` to `ns` (`1 ms = 1,000,000 ns`) BEFORE solving for `p`.',
        codeBlock: `Given: ma = 200 ns, Page Fault Service Time = 8 ms = 8,000,000 ns.
Find max fault rate p for <= 10% performance degradation (EAT <= 220 ns):
  220 >= (1 - p)(200) + p(8,000,000)
  220 >= 200 + 7,999,800 * p
   20 >= 7,999,800 * p
    p <= 20 / 7,999,800 ≈ 0.0000025  (at most 1 fault per 400,000 accesses!)`,
      },
    ],
    workedExample: {
      title: 'Dirty-Bit Savings in Page Fault Service Time',
      problem:
        'Memory access = `100 ns`. Page replacement takes `8 ms` if the victim page is clean (read-only) and `20 ms` if dirty (70% of evicted pages are dirty). Compute average page-fault service time and EAT for `p = 0.0001`.',
      solution:
        'Avg Page Fault Time = `0.30(8 ms) + 0.70(20 ms) = 2.4 + 14.0 = 16.4 ms = 16,400,000 ns`. `EAT = 0.9999(100) + 0.0001(16,400,000) = 99.99 + 1640 = 1739.99 ns` (17.4× slowdown!).',
    },
    fatQuestionMethods: [
      {
        paperSource: 'Alpha Gap / High-Yield M4 Numerical (10M)',
        promptSummary: 'Diagram the 6-step Page Fault handler (5M) and compute Demand Paging EAT / max fault rate `p` with dirty-bit weight (5M).',
        markBreakdown: '6-step numbered diagram (5M) + Unit conversion + EAT equation & final p (5M)',
        solutionSteps: [
          'Draw the 6 numbered arrows connecting Page Table -> Trap -> OS -> Backing Store -> Free Frame -> Restart Instruction.',
          'Convert all times to nanoseconds FIRST (`1 ms = 10^6 ns`), then solve `EAT = (1-p)*ma + p*PFT`.',
        ],
      },
    ],
    selfChecks: [
      {
        id: 'sc-m4-vm-1',
        question: 'What is the purpose of the Modify (Dirty) bit in a Page Table Entry?',
        options: ['Indicates whether the page is encrypted', 'Avoids writing an evicted victim page back to disk if it was never modified in RAM', 'Prevents Belady’s anomaly', 'Replaces the TLB'],
        correctIndex: 1,
        explanation: 'Clean pages already match their copy on disk and can be overwritten directly without a swap-out disk write.',
      },
      {
        id: 'sc-m4-vm-2',
        question: 'With `ma = 100 ns`, `PageFaultTime = 10 ms`, and `p = 0.00001` (`10^-5`), what is the EAT?',
        options: ['100.1 ns', '200 ns', '1,100 ns', '10,100 ns'],
        correctIndex: 1,
        explanation: '`10 ms = 10,000,000 ns`. `p * PFT = 10^-5 * 10^7 = 100 ns`. `EAT ≈ 100 + 100 = 200 ns` (2× slowdown from just 0.001% faults!).',
      },
    ],
    examTip: 'Always double-check `ms -> ns` (`× 10^6`) and `μs -> ns` (`× 10^3`) before computing Demand Paging EAT!',
  },
  {
    topicId: 'm4-page-replacement',
    moduleId: 'm4',
    title: 'Page Replacement Algorithms (FIFO, Belady’s Anomaly, OPT, LRU, Second-Chance Clock)',
    summary:
      'When physical frames are full, page replacement selects a victim frame; Optimal sets the theoretical lower bound, LRU approximates it using past locality, and FIFO risks Belady’s Anomaly.',
    sourceDecks: ['Silberschatz 10e Ch 10 (§10.4)', 'VITC Past Papers: C1 2-2 Q6 (15M) & C2 Q7 (10M)'],
    keyPoints: [
      '**FIFO**: evicts the oldest *loaded* page (ignores recent hits). Suffers from **Belady’s Anomaly** (more frames -> more faults, e.g., `1,2,3,4,1,2,5,1,2,3,4,5`: 3 frames=9 faults vs 4 frames=10 faults).',
      '**Optimal (OPT / Belady)**: evicts the resident page NOT used for the longest time in the *future*. Provably minimal faults; unimplementable in real OSes (requires future knowledge); tie-break = earliest loaded.',
      '**LRU (Least Recently Used)**: evicts the resident page unused for the longest time in the *past*. Stack algorithm (immune to Belady’s Anomaly), implemented via hardware counters or doubly-linked stack.',
      '**Second-Chance (Clock)**: circular FIFO queue with a **Reference Bit (`R`)** — if `R == 1`, clear `R = 0` and advance clock hand; evict first frame with `R == 0`.',
    ],
    sections: [
      {
        heading: 'Verified Real FAT Results: C1 Set 2-2 Q6 (15M) & C2 Q7 (10M)',
        body: 'Verify every single frame-by-frame column interactively in **Lab 4 (Memory & Paging Lab)**! Notice how both papers test exact 4-frame comparisons across FIFO, LRU, and OPT.',
        table: {
          headers: ['VIT FAT Paper', 'Reference String & Frames', 'FIFO Faults', 'LRU Faults', 'OPT Faults'],
          rows: [
            ['C1 Set 2-2 Q6 (15M)', '4 frames · 25 refs (`1,2,3,4,2,1,5,2,1,6,3,2,1,4,2,5,1,2,7,1,3,2,4,1,2`)', '**17** (68%)', '**12** (48%)', '**10** (40%)'],
            ['C2+TC2 Q7 (10M)', '4 frames · 20 refs (`1,2,3,4,2,1,5,6,2,1,2,3,7,6,3,2,1,2,3,6`)', '**14** (70%)', '**10** (50%)', '**8** (40%)'],
            ['Belady Benchmark', '`1,2,3,4,1,2,5,1,2,3,4,5` (3 vs 4 frames)', '3f=**9**, 4f=**10**!', '3f=10, 4f=8', '3f=7, 4f=6'],
          ],
        },
      },
      {
        heading: 'Why LRU & OPT Are Immune to Belady’s Anomaly (Stack Property)',
        body: 'An algorithm satisfies the **Inclusion (Stack) Property** if the set of pages resident in `k` frames is ALWAYS a subset of the pages resident in `k + 1` frames at every timestamp `t`. Therefore adding frames can never turn a hit into a miss for **OPT** or **LRU**, whereas FIFO violates inclusion.',
      },
    ],
    workedExample: {
      title: 'OPT Tie-Breaking Rule (C1 Set 2-2 Q6)',
      problem:
        'Suppose 4 frames hold `{1, 2, 5, 6}` and neither `5` nor `6` ever appears again in the remaining reference string. Which page should OPT evict?',
      solution:
        'Both have next-use distance `∞`. By the explicit C1 Set 2-2 Q6 rule (**earliest loaded / FIFO tie-break**), evict whichever of `5` or `6` entered RAM earlier — and write that tie-break rule right above your OPT grid.',
    },
    fatQuestionMethods: [
      {
        paperSource: 'Slot C1 Set 2-2 Q6 (15M) & Slot C2 Q7 (10M)',
        promptSummary: 'Trace FIFO, LRU, and OPT grids for 4 frames and compare fault counts, hit ratios, and practical trade-offs.',
        markBreakdown: 'FIFO grid (3–4M) + LRU grid (3–4M) + OPT grid (3–4M) + Comparison table & insight (1–3M)',
        solutionSteps: [
          'Draw a clean horizontal grid with 1 column per reference, 4 frame rows, and a bottom `H / F` row.',
          'For hits, copy frames straight across (or leave unchanged with `H`) — NEVER count a hit as a fault, and remember LRU updates recency on hits while FIFO does NOT!',
          'Conclude with exact Fault Count, Hit Count, Fault Rate %, and why LRU is the practical sweet spot (near-OPT without future oracle).',
        ],
      },
    ],
    selfChecks: [
      {
        id: 'sc-m4-pr-1',
        question: 'On a page HIT in RAM, which algorithm updates its replacement priority metadata?',
        options: ['FIFO only', 'LRU (updates most-recently-used recency)', 'Neither FIFO nor LRU', 'FIFO moves the page to the tail'],
        correctIndex: 1,
        explanation: 'FIFO ignores hits (evicts strictly by load time), whereas LRU refreshes the hit page to Most Recently Used.',
      },
      {
        id: 'sc-m4-pr-2',
        question: 'What happens in Second-Chance (Clock) replacement when the clock hand inspects a frame with Reference bit `R = 1`?',
        options: ['Evicts it immediately', 'Clears `R = 0`, gives it a second chance, and advances the clock hand', 'Sets Dirty bit = 1', 'Doubles its frame count'],
        correctIndex: 1,
        explanation: 'Clock clears `R` from 1 to 0 and moves on, evicting the first encountered frame whose `R` bit is already 0.',
      },
    ],
    examTip: 'Always double-check `Faults + Hits == Length of Reference String` (`17 + 8 = 25` in C1 2-2 Q6 FIFO, `14 + 6 = 20` in C2 Q7 FIFO)!',
  },
  {
    topicId: 'm4-thrashing-ws',
    moduleId: 'm4',
    title: 'Frame Allocation, Thrashing Curve, Working-Set Model (Δ) & Page-Fault Frequency',
    summary:
      'Thrashing occurs when processes lack enough frames to hold their active locality, causing paging overhead to collapse CPU utilization; the Working-Set Model and Page-Fault Frequency (PFF) prevent it.',
    sourceDecks: ['Silberschatz 10e Ch 10 (§10.5–10.6)', 'VITC Past Papers: C1 2-2 Q3 & C1 1-2 Q6'],
    keyPoints: [
      'Frame allocation policies: **Equal** (`m/n`), **Proportional** (`s_i/S * m`), **Local Replacement** (isolates thrashing to one process) vs **Global Replacement** (allows one process to steal frames and trigger system-wide thrashing).',
      '**Thrashing Feedback Loop**: low CPU utilization -> global scheduler admits MORE processes -> fewer frames per process -> massive page faults -> processes queue on swap disk -> CPU utilization plunges near 0%.',
      '**Working-Set Model (`Δ`)**: `WSS_i` = count of distinct pages referenced in the last `Δ` references. Total demand `D = Σ WSS_i`. If **`D > m`** (total physical frames), **suspend/swap out** a process!',
      '**Page-Fault Frequency (PFF)**: set upper & lower fault-rate bounds — above upper bound -> allocate another frame; below lower bound -> reclaim a frame.',
    ],
    sections: [
      {
        heading: 'Thrashing Curve (CPU Utilization vs Degree of Multiprogramming)',
        body: 'Draw this signature bell-like curve on every Thrashing question (C1 Set 2-2 Q3 gives 5M for underlying cause + illustrations!). CPU utilization climbs steadily until total frame demand exceeds physical RAM, at which point it falls off a cliff.',
        diagramId: 'm4-thrashing-curve',
      },
      {
        heading: 'Verified FAT Benchmark: C1 Set 1-2 Q6 (Working-Set Window `Δ = 5`)',
        body: 'Reference string (12 refs): `1, 2, 3, 2, 4, 1, 5, 2, 1, 3, 4, 5` with `Δ = 5`.',
        table: {
          headers: ['Sub-Part (C1 1-2 Q6)', 'Given / Window', 'Exact Answer & Reasoning'],
          rows: [
            ['(a) At 8th reference (`2`)', 'Last 5 refs `[2, 4, 1, 5, 2]`', 'Working Set = **`{1, 2, 4, 5}`**, `WSS = 4` frames'],
            ['(a) At 12th reference (`5`)', 'Last 5 refs `[2, 1, 3, 4, 5]`', 'Working Set = **`{1, 2, 3, 4, 5}`**, `WSS = 5` frames'],
            ['(b) Process needs 4, allocated 3', '`WSS (4) > allocated (3)`', 'Continuous page faults -> **Thrashing** (cannot hold current locality)'],
            ['(c) 20 frames; 3 procs WSS = 6, 8, 7', '`D = 6 + 8 + 7 = 21 > 20`', '**Suspend/swap out 1 process** (e.g., lowest priority/smallest) and give its frames to remaining 2 so `D <= 20`'],
          ],
        },
      },
    ],
    workedExample: {
      title: 'Choosing Working-Set Window Size `Δ`',
      problem:
        'What goes wrong if `Δ` is chosen too small vs too large?',
      solution:
        'If `Δ` is **too small**, it fails to capture the entire active locality -> under-allocation & thrashing. If `Δ` is **too large**, it spans multiple past localities -> over-allocation & unnecessarily low multiprogramming degree.',
    },
    fatQuestionMethods: [
      {
        paperSource: 'Slot C1 Set 2-2 Q3 (10M) & Slot C1 Set 1-2 Q6 (10M)',
        promptSummary: 'C1 2-2 Q3: Thrashing cause + diagram (5M) + overcoming techniques (5M). C1 1-2 Q6: Working-set Δ=5 calculation & D>m remedy (10M).',
        markBreakdown: 'Cause + Thrashing curve (5M) + Local replacement, Working Set, PFF, Swap-out (5M)',
        solutionSteps: [
          'Define thrashing (more time paging than executing) and trace the global-replacement positive feedback loop.',
          'Sketch CPU Utilization vs Degree of Multiprogramming with the exact thrashing cliff labeled.',
          'Detail 3 concrete fixes: (1) Local/Priority page replacement, (2) Working-Set model (`D = ΣWSS_i <= m`), (3) Page-Fault Frequency (PFF) bounds.',
        ],
      },
    ],
    selfChecks: [
      {
        id: 'sc-m4-th-1',
        question: 'Which replacement scope prevents a thrashing process from stealing frames from healthy processes?',
        options: ['Global replacement', 'Local replacement', 'FIFO replacement', 'Belady replacement'],
        correctIndex: 1,
        explanation: 'Local replacement restricts each process to evicting only from its own allocated frame pool.',
      },
      {
        id: 'sc-m4-th-2',
        question: 'If total physical RAM has `m = 24` frames and 4 processes have `WSS = 7, 8, 6, 5`, what is `D` and the required OS action?',
        options: ['D = 26 <= 24 (nominal)', 'D = 26 > 24 -> suspend/swap out one process to prevent thrashing', 'D = 20 -> admit two more processes', 'Switch to FCFS CPU scheduling'],
        correctIndex: 1,
        explanation: '`D = 7+8+6+5 = 26 > 24` exceeds physical frames -> OS must suspend a process so remaining processes fit in 24 frames.',
      },
    ],
    examTip: 'Always state the Locality Model (temporal + spatial locality) when explaining WHY the Working-Set model works!',
  },
  {
    topicId: 'm4-file-directories',
    moduleId: 'm4',
    title: 'File Concepts, Access Methods & Directory Structures (Tree, DAG, General Graph)',
    summary:
      'File systems organize persistent storage via logical files, access methods (Sequential, Direct, Indexed), and hierarchical/DAG directory graphs — a major untested M4 gap across C1 and C2.',
    sourceDecks: ['Silberschatz 10e Ch 13 (§13.1–13.3)', 'OVERDUE GAP — 0 File System Qs in C1/C2!'],
    keyPoints: [
      'Access Methods: **Sequential** (tape-like read/write next), **Direct/Relative** (O(1) random block `n` access for databases), **Indexed** (index table of key -> block pointer, e.g., ISAM/B+Tree).',
      '5 Directory Structures: **Single-Level** (naming collisions), **Two-Level** (MFD + UFD per user, no grouping), **Tree-Structured** (absolute vs relative paths, no file sharing), **Acyclic-Graph / DAG** (shared files via Hard/Soft links), **General Graph** (allows cycles -> requires garbage collection / cycle detection).',
      '**Hard Link**: directory entry pointing directly to same inode (reference count incremented; file freed only when count == 0).',
      '**Symbolic (Soft) Link**: special file storing target pathname (can cross filesystems, leaves **dangling pointer** if target deleted).',
    ],
    sections: [
      {
        heading: 'Directory Structure Evolution (Single-Level to General Graph)',
        body: 'Draw clean tree vs DAG diagrams showing shared files via links — remember that DAGs forbid cycles so traversal never loops infinitely.',
        diagramId: 'm4-directory-trees',
        table: {
          headers: ['Structure', 'Same Filename Allowed?', 'Grouping?', 'File Sharing?', 'Key Issue'],
          rows: [
            ['Single-Level', 'No', 'No', 'All flat', 'Name collision across users'],
            ['Two-Level', 'Yes (different users)', 'No', 'Hard', 'Users cannot create subfolders'],
            ['Tree-Structured', 'Yes', 'Yes (subdirectories)', 'No', 'Duplication needed to share'],
            ['Acyclic Graph (DAG)', 'Yes', 'Yes', 'Yes (Hard/Soft links)', 'Dangling pointers (soft) / multi-path traversal'],
            ['General Graph', 'Yes', 'Yes', 'Yes (cycles allowed)', 'Infinite search loops; needs GC + cycle check'],
          ],
        },
      },
      {
        heading: 'Directory Implementation: Linear List vs Hash Table',
        body: '**Linear List** of `<filename, inode_ptr>` is simple to code but requires **O(n)** search time (slow for directories with 50,000 files). **Hash Table** delivers **O(1)** lookup, trading fixed size/collision handling (chaining) for speed.',
      },
    ],
    workedExample: {
      title: 'Dangling Pointer vs Reference Counting on File Deletion in a DAG',
      problem:
        'Users A and B share file `notes.pdf` in a DAG directory. Compare what happens when User A deletes `notes.pdf` under Hard Links vs Symbolic Links.',
      solution:
        'Under **Hard Links**, the inode’s `link_count` decrements from `2` to `1` — the data blocks stay intact for User B until B also deletes it (`count == 0`). Under **Symbolic Links**, if A owns the real file and deletes it, B’s soft link becomes a **dangling pointer** (`No such file or directory`).',
    },
    fatQuestionMethods: [
      {
        paperSource: 'Alpha Gap High-Probability Prompt (10M)',
        promptSummary: 'Compare all 5 directory structures with diagrams (6M) and analyze Hard vs Soft links, dangling pointers, and cycle prevention (4M).',
        markBreakdown: 'Diagrams (3M) + 5-structure comparison table (3M) + Hard vs Soft links & GC vs ref-count (4M)',
        solutionSteps: [
          'Sketch Tree vs Acyclic-Graph (two directory entries pointing to 1 shared file node) vs General Graph (cycle arrow).',
          'Explain why reference counting fails when cycles exist in a General Graph (self-referencing cycle keeps `count >= 1` forever -> requires mark-and-sweep Garbage Collection).',
        ],
      },
    ],
    selfChecks: [
      {
        id: 'sc-m4-fd-1',
        question: 'Why does simple reference counting fail to reclaim unreachable directories in a General Graph directory structure?',
        options: ['Inodes cannot store integers', 'Cycles keep reference counts >= 1 even when disconnected from root, requiring Garbage Collection', 'Hard links cannot point to files', 'Hash tables forbid cycles'],
        correctIndex: 1,
        explanation: 'A disconnected cycle references itself, so reference counts never reach 0; garbage collection or cycle avoidance is required.',
      },
      {
        id: 'sc-m4-fd-2',
        question: 'Which link type can cross different mounted disk partitions/filesystems?',
        options: ['Hard Link', 'Symbolic (Soft) Link', 'Direct Inode Pointer', 'FAT entry'],
        correctIndex: 1,
        explanation: 'Symbolic links store a string pathname, so they can reference targets on different filesystems; hard links are bound to local inode numbers.',
      },
    ],
    examTip: 'File Systems had **ZERO** questions across C1 Set 2-2, C1 Set 1-2, and C2 — mastering Directories + File Allocation gives you a huge edge on overdue-gap papers!',
  },
  {
    topicId: 'm4-file-allocation',
    moduleId: 'm4',
    title: 'File Allocation Methods (Contiguous, Linked/FAT, Unix Inode) & Free-Space Management',
    summary:
      'Disk block allocation determines random-access speed, fragmentation, and max file size — with Unix Combined Indexed Allocation (Inode) calculations being the signature M4 file-system numerical.',
    sourceDecks: ['Silberschatz 10e Ch 14 (§14.3–14.5)', 'OVERDUE GAP — 0 File Allocation Qs in C1/C2!'],
    keyPoints: [
      '**Contiguous Allocation**: directory stores `(start_block, length)` -> fastest sequential & O(1) random access, but severe **external fragmentation** and hard file growth.',
      '**Linked Allocation**: each block stores pointer to next block -> zero external fragmentation, easy growth, but **O(n) random access** and fragile pointers. **FAT (File Allocation Table)** caches pointers in RAM for fast seeks.',
      '**Indexed Allocation (Unix Inode)**: per-file inode holds **Direct** pointers + **Single, Double, Triple Indirect** pointers -> fast O(1) random access, zero external fragmentation, scales from tiny files to multi-terabyte files.',
      '**Free-Space Management**: **Bit Vector (Bitmap)** (`1 bit/block`, fast contiguous search via CPU bit-scan), **Linked Free List**, **Grouping**, and **Counting** `(start, run_length)`.',
    ],
    sections: [
      {
        heading: 'Contiguous vs Linked/FAT vs Unix Inode Indexed Architecture',
        body: 'Understand the exact pointer fan-out inside a Unix inode: every indirect block holds `P = BlockSize / PointerSize` block addresses.',
        diagramId: 'm4-file-allocation-inode',
        table: {
          headers: ['Method', 'External Frag?', 'Random Access', 'Reliability', 'Overhead'],
          rows: [
            ['Contiguous', 'Yes (severe)', 'O(1) (`start + offset`)', 'High', 'Minimal (2 fields in dir)'],
            ['Linked', 'No', 'O(n) disk reads', 'Low (1 bad ptr breaks chain)', '4–8 bytes per data block'],
            ['FAT (Cached Linked)', 'No', 'O(1) in RAM cache', 'Moderate (single FAT copy risk)', 'FAT table occupies RAM'],
            ['Indexed (Unix Inode)', 'No', 'O(1) (1–4 disk reads max)', 'High', 'Index block(s) per file'],
          ],
        },
      },
      {
        heading: 'Master Formula: Unix Inode Maximum File Size Calculation',
        body: 'Memorize this clean 3-line derivation so any block size / pointer size combination takes 60 seconds in the exam.',
        codeBlock: `Given: BlockSize = 4 KB (4096 B), PointerSize = 4 B,
       12 Direct + 1 Single-Indirect + 1 Double-Indirect + 1 Triple-Indirect pointers.

Step 1: Pointers per index block:  P = 4096 / 4 = 1024 = 2^10
Step 2: Total addressable data blocks:
  Direct:          12 blocks                   = 48 KB
  Single Indirect: P     = 2^10 blocks         = 4 MB
  Double Indirect: P^2   = 2^20 blocks         = 4 GB
  Triple Indirect: P^3   = 2^30 blocks         = 4 TB
Step 3: Max File Size = (12 + 2^10 + 2^20 + 2^30) * 4 KB ≈ 4.004 TB!`,
      },
    ],
    workedExample: {
      title: 'Free-Space Bitmap Size Calculation',
      problem:
        'A 1 TB (`2^40` B) disk uses 4 KB (`2^12` B) blocks. How many megabytes does a Free-Space Bit Vector require?',
      solution:
        'Total blocks = `2^40 / 2^12 = 2^28` blocks -> `2^28` bits = `2^25` bytes = **`32 MB`** (fits easily in modern RAM!).',
    },
    fatQuestionMethods: [
      {
        paperSource: 'Alpha & Gamma Model High-Probability Prompt (10M)',
        promptSummary: 'Compare Contiguous, Linked/FAT, and Indexed allocation (5M) + compute Unix Inode max file size (5M).',
        markBreakdown: 'Diagrams & comparison table (5M) + P = BlockSize/PointerSize & Direct+P+P^2+P^3 calculation (5M)',
        solutionSteps: [
          'Sketch Contiguous, Linked/FAT, and Unix Inode (direct + 1x/2x/3x indirect tree) cleanly.',
          'Compute `P = BlockSize / PointerSize` explicitly in powers of 2, then multiply each level by `BlockSize`.',
        ],
      },
    ],
    selfChecks: [
      {
        id: 'sc-m4-fa-1',
        question: 'With 2 KB (`2048 B`) disk blocks and 4-byte pointers, how many pointers fit inside a single indirect block (`P`)?',
        options: ['256', '512', '1024', '2048'],
        correctIndex: 1,
        explanation: '`P = 2048 / 4 = 512` block pointers per index block.',
      },
      {
        id: 'sc-m4-fa-2',
        question: 'Which free-space management technique makes finding `n` consecutive free disk blocks fastest using hardware bit-scan instructions?',
        options: ['Linked Free List', 'Bit Vector (Bitmap)', 'Single-Level Directory', 'Direct Access'],
        correctIndex: 1,
        explanation: 'A bit vector packs block availability densely (`0/1` per bit), allowing CPU word-level bit scans to spot contiguous free runs.',
      },
    ],
    examTip: 'Always double-check whether the problem includes **triple-indirect** or stops at **double-indirect** pointers before summing!',
  },
];
