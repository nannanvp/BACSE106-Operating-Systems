import { TopicNote } from './noteTypes';

export const MODULE_3_NOTES: TopicNote[] = [
  {
    topicId: 'm3-ipc',
    moduleId: 'm3',
    title: 'Inter-Process Communication (Shared Memory, Message Passing, Pipes & Sockets)',
    summary:
      'Cooperating processes exchange data either by mapping a Shared Memory segment (maximum speed, user-managed synchronization) or via kernel-mediated Message Passing (simpler sync, works across networks).',
    sourceDecks: ['Silberschatz 10e Ch 3 (§3.4–3.8)', 'OVERDUE GAP — Lab Exp 6'],
    keyPoints: [
      '**Shared Memory** (`shm_open` + `mmap`): kernel intervenes ONLY once to attach memory; subsequent reads/writes run at RAM speed, but processes must handle synchronization explicitly.',
      '**Message Passing** (`send`/`receive`): zero shared-memory race conditions, ideal for small data and distributed hosts; slower because every message requires a kernel syscall copy.',
      '**Communication Links**: Direct vs Indirect (Mailboxes/Ports); Synchronous (**blocking** send/recv = Rendezvous) vs Asynchronous (**non-blocking**); Zero, Bounded, or Unbounded buffer capacity.',
      '**Pipes**: Ordinary pipes are unidirectional & require parent-child ancestry (`pipe(fd)` -> `fd[0]` read, `fd[1]` write); **Named Pipes (FIFOs)** (`mkfifo`) connect unrelated processes.',
    ],
    sections: [
      {
        heading: 'Shared Memory vs Message Passing Architecture',
        body: 'Notice where the kernel sits in the two fundamental IPC models: outside the steady-state data path in Shared Memory, and inside every transfer in Message Passing.',
        diagramId: 'm3-ipc-models',
        table: {
          headers: ['Criterion', 'Shared Memory', 'Message Passing'],
          rows: [
            ['Kernel Calls', 'Only during setup (`shm_open`/`mmap`)', 'Every `send()` and `receive()`'],
            ['Speed / Throughput', 'Fastest (direct RAM access)', 'Slower (kernel buffer copies + syscalls)'],
            ['Synchronization', 'Must be coded by user (semaphores/mutex)', 'Handled inherently by kernel queues'],
            ['Distributed Systems', 'Single shared-RAM machine only', 'Works across networks via Sockets / RPC'],
          ],
        },
      },
      {
        heading: 'Sockets & Remote Procedure Calls (RPC)',
        body: 'A **Socket** is an endpoint `<IP:Port>` (e.g., `161.25.19.8:1625`). **RPC** abstracts network messaging as local function calls using client/server **stubs** that marshal parameters (using XDR/Protobuf) to handle endianness differences.',
      },
    ],
    workedExample: {
      title: 'Blocking vs Non-Blocking Rendezvous',
      problem:
        'What is a "Rendezvous" in message-passing IPC and what buffer capacity enforces it?',
      solution:
        'A **Rendezvous** occurs when BOTH `send()` and `receive()` are **blocking** (synchronous) on a **zero-capacity** link: the sender blocks until the receiver executes `receive()`, ensuring zero-buffer direct handoff.',
    },
    fatQuestionMethods: [
      {
        paperSource: 'Alpha Gap High-Probability Prompt (10M)',
        promptSummary: 'Compare Shared Memory vs Message Passing with diagrams, plus Ordinary Pipes vs Named Pipes (FIFOs) & Sockets.',
        markBreakdown: 'Diagrams (4M) + Comparison table (3M) + Pipes/Sockets/RPC explanation (3M)',
        solutionSteps: [
          'Sketch Process A & B sharing a RAM region vs passing messages through Kernel Space queues.',
          'Contrast ordinary pipes (`pipe(fd)` parent-child only, half-duplex) vs Named Pipes (FIFO in filesystem, unrelated processes).',
        ],
      },
    ],
    selfChecks: [
      {
        id: 'sc-m3-ipc-1',
        question: 'In POSIX `pipe(int fd[2])`, which descriptor is the READ end and which is the WRITE end?',
        options: ['fd[0] = write, fd[1] = read', 'fd[0] = read, fd[1] = write', 'Both are bidirectional', 'fd[0] = stderr, fd[1] = stdin'],
        correctIndex: 1,
        explanation: 'Mnemonic: matches stdin (0 = read) and stdout (1 = write). `fd[0]` is always the read end.',
      },
      {
        id: 'sc-m3-ipc-2',
        question: 'Which IPC model gives higher throughput for transferring gigabytes of video frames between two local processes?',
        options: ['Message Passing via kernel queues', 'Shared Memory (`shm_open` + `mmap`)', 'Sockets over loopback', 'Anonymous Pipe'],
        correctIndex: 1,
        explanation: 'Shared memory avoids repeated kernel copies and system-call overhead once the region is mapped.',
      },
    ],
    examTip: 'Always mention both **synchronization responsibility** (user vs kernel) and **syscall frequency** when comparing Shared Memory vs Message Passing.',
  },
  {
    topicId: 'm3-critical-section-peterson',
    moduleId: 'm3',
    title: 'Race Conditions, Critical Section Criteria, Peterson’s Proof & Bakery Algorithm',
    summary:
      'Concurrent updates to shared state cause race conditions; every valid Critical Section protocol must guarantee Mutual Exclusion, Progress, and Bounded Waiting.',
    sourceDecks: ['Silberschatz 10e Ch 6 (§6.1–6.3)', 'VITC Past Papers: C1 1-2 Q3 & C2 Q5'],
    keyPoints: [
      '**Race Condition**: output depends on the unpredictable interleaving of `load -> increment/decrement -> store` machine instructions (e.g., `seats = seats - 2` losing an update).',
      '3 Critical Section Requirements: **1. Mutual Exclusion**, **2. Progress**, **3. Bounded Waiting**.',
      '**Peterson’s Solution** (2 processes `P0, P1`): uses `boolean flag[2]` (intent) + `int turn` (tie-breaker). Satisfies all 3 criteria under sequential consistency.',
      '**Lamport’s Bakery Algorithm** extends software mutual exclusion to `n` processes using lexicographic ticket ordering `(number[i], i) < (number[j], j)`.',
    ],
    sections: [
      {
        heading: "Peterson's Algorithm & Formal Contradiction Proof (C1 1-2 Q3)",
        body: 'C1 Set 1-2 Q3 and C2 Q5 BOTH tested Peterson’s solution. Memorize the exact 4-line entry/exit protocol AND the contradiction proof.',
        diagramId: 'm3-peterson-flow',
        codeBlock: `// Shared: boolean flag[2] = {false, false}; int turn;
// Process Pi (other process is j = 1 - i):
do {
    flag[i] = true;                 // Express intent to enter CS
    turn = j;                       // Politely yield priority to Pj
    while (flag[j] && turn == j) ;  // Busy wait only if Pj wants CS AND it is Pj's turn
        /* CRITICAL SECTION: e.g., seats = seats - 2; */
    flag[i] = false;                // Exit section: release CS
        /* REMAINDER SECTION */
} while (true);`,
      },
      {
        heading: 'Contradiction Proof of Mutual Exclusion + C2 Q5 Seat Trace',
        body: '**Proof (4M)**: Assume both `P0` and `P1` are inside the CS simultaneously. Then both set `flag[0] = true` and `flag[1] = true` before their `while` loops. For `P0` to pass its `while (flag[1] && turn == 1)`, it must have seen `turn == 0`. For `P1` to pass its `while (flag[0] && turn == 0)`, it must have seen `turn == 1`. Because `turn` is a single shared variable, it **cannot simultaneously equal 0 and 1** — **Contradiction!** The process whose write to `turn` happened *first* enters first (since the second writer overwrote `turn` to point back to the first).',
        table: {
          headers: ['Step (C2 Q5: 10 Seats, Each Books 2)', 'flag[0]', 'flag[1]', 'turn', 'Outcome'],
          rows: [
            ['Initial', 'false', 'false', '0', 'seats = 10'],
            ['P0 executes `flag[0]=T; turn=1;`', 'true', 'false', '1', 'P0 ready to test loop'],
            ['P1 executes `flag[1]=T; turn=0;`', 'true', 'true', '0', 'P1 overwrote `turn = 0`!'],
            ['Both evaluate `while` loop', 'true', 'true', '0', 'P0 checks `(T && 0==1)`=F -> **P0 enters CS!** P1 spins.'],
            ['P0 books 2 seats & exits (`flag[0]=F`)', 'false', 'true', '0', 'seats = 8; P1 exits loop -> **P1 enters CS!**'],
            ['P1 books 2 seats & exits (`flag[1]=F`)', 'false', 'false', '0', '**Final seats = 6** (zero lost updates!)'],
          ],
        },
      },
    ],
    workedExample: {
      title: 'Why Peterson’s Fails Without Memory Barriers on Modern CPUs',
      problem:
        'Modern out-of-order CPUs can reorder `flag[0] = true` and `turn = 1` (independent writes). What breaks?',
      solution:
        'If `P0`’s read of `flag[1]` is reordered before its store `flag[0] = true` becomes visible to `P1`, both `P0` and `P1` read `false` and **violate Mutual Exclusion**. Inserting a **Memory Barrier (Fence)** after `turn = j` forces all stores to become globally visible before testing the `while` condition.',
    },
    fatQuestionMethods: [
      {
        paperSource: 'Slot C1 Set 1-2 Q3 (10M) & Slot C2 Q5 (10M)',
        promptSummary: 'Explain `flag` & `turn` roles (3M), prove Mutual Exclusion by contradiction (4M), trace `flag[0]=T, flag[1]=T, turn=0` -> seats 10->6 (3M).',
        markBreakdown: 'Variables + code (3M) + Contradiction proof (4M) + Step-by-step simultaneous trace (3M)',
        solutionSteps: [
          'State `flag[i]` = readiness/intent of `Pi`; `turn` = tie-breaker yielding to the other process.',
          'Write the exact contradiction proof: both in CS => `flag[0]==flag[1]==true` => `turn` must be both 0 and 1 -> impossible.',
          'Trace C2 Q5: `turn == 0` -> P0 enters first (`10->8`), exits (`flag[0]=false`), then P1 enters (`8->6`). Final seats = `6`.',
        ],
      },
    ],
    selfChecks: [
      {
        id: 'sc-m3-pet-1',
        question: 'In Peterson’s solution, if `flag[0]=true`, `flag[1]=true`, and `turn=1`, which process enters the CS first?',
        options: ['P0', 'P1', 'Both enter together', 'Neither enters (deadlock)'],
        correctIndex: 1,
        explanation: 'P1’s while-condition checks `flag[0] && turn == 0`, which is FALSE because `turn == 1`. Thus P1 enters first.',
      },
      {
        id: 'sc-m3-pet-2',
        question: 'Which property of the Critical Section problem prevents indefinite postponement (starvation) of a process waiting to enter?',
        options: ['Mutual Exclusion', 'Bounded Waiting', 'Atomicity', 'Deadlock Avoidance'],
        correctIndex: 1,
        explanation: 'Bounded Waiting caps how many times other processes may enter the CS after a process has requested entry.',
      },
    ],
    examTip: 'Never forget: if `turn == 0`, **P0** enters first (because P0 spins only while `turn == 1`)!',
  },
  {
    topicId: 'm3-hardware-sync',
    moduleId: 'm3',
    title: 'Hardware Sync: Memory Barriers, Test-and-Set & Bounded-Waiting Compare-and-Swap',
    summary:
      'Modern CPUs provide indivisible atomic instructions (`test_and_set`, `compare_and_swap`) and memory barriers to implement multiprocessor locks without disabling interrupts globally.',
    sourceDecks: ['Silberschatz 10e Ch 6 (§6.4)', 'OVERDUE GAP — 0 Qs across C1 & C2'],
    keyPoints: [
      '**Atomic Instruction**: executes read-modify-write as a single uninterruptible hardware bus cycle across all cores.',
      '**`test_and_set(boolean *target)`**: returns old value of `*target` and sets `*target = true` atomically.',
      '**`compare_and_swap(int *val, int expected, int new_val)`**: returns old `*val`, and sets `*val = new_val` ONLY if `*val == expected`.',
      'Basic TSL/CAS spinlocks satisfy Mutual Exclusion & Progress but **VIOLATE Bounded Waiting**; adding a `waiting[n]` array fixes Bounded Waiting.',
    ],
    sections: [
      {
        heading: 'Critical Section Structure & Bounded-Waiting CAS Pseudocode',
        body: 'Memorize this exact Silberschatz Ch 6 bounded-waiting CAS protocol — it is the #1 overdue M3 gap question.',
        diagramId: 'm3-critical-section',
        codeBlock: `// Shared: boolean waiting[n] = {false}; int lock = 0;
// Bounded-Waiting Mutual Exclusion using Compare-and-Swap (CAS):
do {
    waiting[i] = true;
    int key = 1;
    while (waiting[i] && key == 1)
        key = compare_and_swap(&lock, 0, 1);
    waiting[i] = false;
        /* CRITICAL SECTION */
    int j = (i + 1) % n;
    while ((j != i) && !waiting[j])
        j = (j + 1) % n;
    if (j == i)
        lock = 0;           // No other process waiting -> release global lock
    else
        waiting[j] = false; // Hand off CS directly to next waiting process (<= n-1 wait!)
        /* REMAINDER SECTION */
} while (true);`,
      },
      {
        heading: 'Why Bounded Waiting Holds (`<= n - 1` Turns)',
        body: 'When `P_i` exits the CS, it scans cyclically `(i+1)%n, (i+2)%n, ...` for the first waiting process `P_j` and sets `waiting[j] = false` while keeping `lock = 1`. Thus every waiting process enters in at most **`n - 1` turns** — strictly guaranteeing Bounded Waiting!',
      },
    ],
    workedExample: {
      title: 'Atomic Variable Counter vs Non-Atomic `count++`',
      problem:
        'Why is `atomic_int` (`increment(&seq)` implemented with CAS) safe without a full mutex for a single counter?',
      solution:
        'A CAS loop reads `old = *v`, computes `old + 1`, and retries until `compare_and_swap(v, old, old + 1) == old`. It guarantees indivisible single-variable updates lock-free without context switching.',
    },
    fatQuestionMethods: [
      {
        paperSource: 'Alpha Gap High-Probability Prompt (10M)',
        promptSummary: 'Write atomic Test-and-Set & Compare-and-Swap primitives (4M), explain why naive CAS violates Bounded Waiting (2M), and give Bounded-Waiting CAS code (4M).',
        markBreakdown: 'Atomic definitions (4M) + Starvation explanation (2M) + waiting[n] cyclic handoff code (4M)',
        solutionSteps: [
          'Define `test_and_set` and `compare_and_swap` atomic semantics.',
          'Show basic `while (compare_and_swap(&lock, 0, 1) != 0);` fails Bounded Waiting.',
          'Write the `waiting[n]` cyclic scan `(i+1)%n` algorithm proving at most `n-1` waits.',
        ],
      },
    ],
    selfChecks: [
      {
        id: 'sc-m3-hw-1',
        question: 'In Bounded-Waiting CAS, when `P_i` finds a waiting process `P_j` during its exit scan, what does `P_i` set?',
        options: ['lock = 0', 'waiting[j] = false (keeping lock = 1 so only P_j enters next)', 'waiting[i] = true', 'turn = j'],
        correctIndex: 1,
        explanation: 'Passing `waiting[j] = false` while leaving `lock = 1` grants exclusive handoff directly to `P_j`.',
      },
      {
        id: 'sc-m3-hw-2',
        question: 'What does `compare_and_swap(&val, 0, 1)` return when `val` was initially `0`?',
        options: ['1 (new value)', '0 (original value, and sets val to 1)', '-1', 'true'],
        correctIndex: 1,
        explanation: 'CAS always returns the ORIGINAL value stored at `*val` before the conditional swap.',
      },
    ],
    examTip: 'Never forget to state `if (j == i) lock = 0; else waiting[j] = false;` — that single `if/else` is what enforces Bounded Waiting!',
  },
  {
    topicId: 'm3-mutex-semaphores',
    moduleId: 'm3',
    title: 'Mutex Locks & Semaphores (Binary/Counting, Wait Queues & Priority Inversion)',
    summary:
      'Mutex locks provide owner-bound mutual exclusion, while Semaphores use atomic `wait(S)` and `signal(S)` with kernel wait queues to eliminate busy-waiting and coordinate resource pools.',
    sourceDecks: ['Silberschatz 10e Ch 6 (§6.5–6.6)', 'VITC BACSE106 Module 3'],
    keyPoints: [
      '**Spinlock** (busy-waiting mutex): wastes CPU cycles while spinning, but avoids context-switch cost when locks are held for microseconds on multicore CPUs.',
      '**Counting Semaphore** ranges over an unrestricted integer domain (pool of `N` resources); **Binary Semaphore** ranges over `0` and `1` (behaves like a mutex without ownership).',
      'Blocking Semaphore implementation: `S.value--`; if `S.value < 0`, push PCB onto `S.list` and call `block()`. Magnitude `|S.value|` = number of waiting processes!',
      '**Priority Inversion**: High-priority `H` blocks on lock held by Low `L`, while Medium `M` preempts `L` indefinitely -> solved by **Priority-Inheritance Protocol**.',
    ],
    sections: [
      {
        heading: 'Blocking Semaphore Wait-Queue Architecture',
        body: 'Eliminating busy waiting attaches a FIFO waiting queue to each semaphore so blocked threads yield the CPU via `block()` and resume via `wakeup(P)`.',
        diagramId: 'm3-semaphore-queue',
        codeBlock: `typedef struct {
    int value;
    struct process *list;   // Waiting PCB queue
} semaphore;

void wait(semaphore *S) {   // Atomic P()
    S->value--;
    if (S->value < 0) {
        add_this_process_to(S->list);
        block();            // Move to Waiting state (no CPU burn!)
    }
}

void signal(semaphore *S) { // Atomic V()
    S->value++;
    if (S->value <= 0) {
        P = remove_process_from(S->list);
        wakeup(P);          // Move P from Waiting -> Ready queue
    }
}`,
      },
    ],
    workedExample: {
      title: 'Semaphore Value & Blocked Count Calculation',
      problem:
        'A blocking semaphore starts at `S = 3`. Processes execute 10 `wait(S)` calls and 4 `signal(S)` calls. What is `S.value` and how many processes are currently blocked?',
      solution:
        '`S.value = 3 - 10 + 4 = -3`. Because `S.value < 0`, **3 processes** are currently sleeping in `S->list`.',
    },
    fatQuestionMethods: [
      {
        paperSource: 'High-Yield M3 Theory Component (5M)',
        promptSummary: 'Distinguish Spinlock vs Blocking Semaphore, trace `wait()`/`signal()` with wait queue, and explain Priority Inversion.',
        markBreakdown: 'Struct + wait/signal code (3M) + Priority Inversion & Inheritance (2M)',
        solutionSteps: [
          'Write `semaphore` struct with `value` and PCB `list`, using `S->value < 0` in `wait` and `S->value <= 0` in `signal`.',
          'Explain Mars Pathfinder Priority Inversion (L holds lock, M preempts L, H waits on L) and Priority Inheritance fix.',
        ],
      },
    ],
    selfChecks: [
      {
        id: 'sc-m3-sem-1',
        question: 'In a blocking semaphore, if `S.value == -4`, how many processes are waiting in `S.list`?',
        options: ['0', '1', '4', 'Cannot be determined'],
        correctIndex: 2,
        explanation: 'In the Silberschatz blocking semaphore implementation, a negative value `-k` means exactly `k` processes are blocked.',
      },
      {
        id: 'sc-m3-sem-2',
        question: 'Which protocol resolves Priority Inversion by temporarily boosting a lock-holding low-priority process to the priority of the highest waiting process?',
        options: ['Aging', 'Priority-Inheritance Protocol', 'Banker’s Algorithm', 'Belady’s Protocol'],
        correctIndex: 1,
        explanation: 'Priority Inheritance lets the low-priority lock holder finish quickly without being preempted by medium-priority tasks.',
      },
    ],
    examTip: 'Watch the inequality signs in blocking semaphores: `wait()` checks **`< 0`**, whereas `signal()` checks **`<= 0`**!',
  },
  {
    topicId: 'm3-classical-problems',
    moduleId: 'm3',
    title: 'Classical Sync Problems: Bounded Buffer, Readers-Writers, Dining Philosophers & Sleeping Barber',
    summary:
      'Master all four canonical semaphore synchronization problems — two appeared verbatim in C1 Set 2-2 Q2 (Sleeping Barber) and C2 Q6 (Bounded Buffer), making Readers-Writers and Dining Philosophers prime next-slot targets.',
    sourceDecks: ['Silberschatz 10e Ch 7 (§7.1)', 'VITC Past Papers: C1 2-2 Q2 & C2 Q6'],
    keyPoints: [
      '**Bounded Buffer (`N` slots)**: `mutex=1, empty=N, full=0`. Producer runs `wait(empty)` BEFORE `wait(mutex)`; Consumer runs `wait(full)` BEFORE `wait(mutex)`.',
      '**Sleeping Barber (`N` chairs, C1 2-2 Q2)**: `customers=0, barber=0, mutex=1, waiting=0`. Customer increments `waiting`, signals `customers`, waits on `barber`; if `waiting == N`, customer leaves.',
      '**First Readers-Writers**: `rw_mutex=1, mutex=1, read_count=0`. First reader locks `rw_mutex`, last reader unlocks it -> concurrent readers allowed, **writers may starve**.',
      '**Dining Philosophers**: naive `wait(chopstick[i]); wait(chopstick[(i+1)%5]);` causes circular-wait **deadlock** -> fix via max-4 seating, Monitor both-or-none, or **asymmetric** odd/even pickup order.',
    ],
    sections: [
      {
        heading: 'Bounded Buffer (C2 Q6 Capacity 5) & Sleeping Barber (C1 2-2 Q2)',
        body: 'Test BOTH problems step-by-step in **Lab 3 (Synchronization & Concurrency Lab)** to verify semaphore transitions live.',
        diagramId: 'm3-bounded-buffer',
        codeBlock: `// === 1. BOUNDED BUFFER (C2 Q6: Food Ordering, N = 5) ===
// Init: mutex = 1, empty = 5, full = 0
Producer() {                        Consumer() {
  while (true) {                      while (true) {
    // produce order                    wait(full);   // MUST precede mutex!
    wait(empty);  // MUST precede!      wait(mutex);
    wait(mutex);                        item = remove_order();
    insert_order(item);                 signal(mutex);
    signal(mutex);                      signal(empty);
    signal(full);                     }
  }                                 }
}

// === 2. SLEEPING BARBER (C1 Set 2-2 Q2: N Waiting Chairs) ===
// Init: customers = 0, barber = 0, mutex = 1, waiting = 0
Barber() {                          Customer() {
  while (true) {                      wait(mutex);
    wait(customers); // sleep if 0    if (waiting < N) {
    wait(mutex);                        waiting++;
    waiting--;                          signal(customers); // wake barber
    signal(barber);  // call next       signal(mutex);
    signal(mutex);                      wait(barber);      // get haircut
    cut_hair();                       } else {
  }                                     signal(mutex);     // chairs full -> leave
}                                     }
                                    }`,
      },
      {
        heading: 'Dining Philosophers (Deadlock vs Asymmetric Fix) & Readers-Writers',
        body: 'Readers-Writers and Dining Philosophers were skipped in C1/C2 — high priority for upcoming slots!',
        diagramId: 'm3-dining-philosophers',
        codeBlock: `// === 3. FIRST READERS-WRITERS (mutex=1, rw_mutex=1, read_count=0) ===
Writer() {                          Reader() {
  wait(rw_mutex);                     wait(mutex);
  /* write shared DB */               read_count++;
  signal(rw_mutex);                   if (read_count == 1) wait(rw_mutex);
}                                     signal(mutex);
                                      /* read shared DB concurrently */
                                      wait(mutex);
                                      read_count--;
                                      if (read_count == 0) signal(rw_mutex);
                                      signal(mutex);
                                    }`,
      },
    ],
    workedExample: {
      title: 'Why Sleeping Barber Prevents Race Conditions & Deadlock (C1 2-2 Q2)',
      problem:
        'Explain how the 3 semaphores (`customers`, `barber`, `mutex`) prevent two customers from claiming the last chair simultaneously and prevent the barber from sleeping forever when a customer arrives.',
      solution:
        '(1) `mutex` wraps every read/write of `waiting` so two arriving customers cannot both see `waiting == N-1` and overflow the chairs. (2) Calling `signal(customers)` *before* `wait(barber)` ensures the barber’s `wait(customers)` always wakes up (even if the barber hasn’t called `wait(customers)` yet, the semaphore stores count `+1`).',
    },
    fatQuestionMethods: [
      {
        paperSource: 'Slot C1 Set 2-2 Q2 (10M) & Slot C2 Q6 (10M)',
        promptSummary: 'Sleeping Barber semaphore pseudocode (5M) + race/sync explanation (5M); OR Food Ordering Bounded Buffer capacity 5 (10M).',
        markBreakdown: 'Semaphore initialization (2–3M) + Correct wait/signal pseudocode (5M) + Race/deadlock proof (2–3M)',
        solutionSteps: [
          'List every semaphore name, type (binary vs counting), initial value, and purpose clearly BEFORE writing pseudocode.',
          'Double-check `wait()` order: counting semaphore (`empty`/`full`/`customers`) BEFORE `mutex` so no thread sleeps while holding `mutex`.',
          'Explicitly explain mutual exclusion, buffer overflow/underflow blocking, and deadlock freedom.',
        ],
      },
    ],
    selfChecks: [
      {
        id: 'sc-m3-cp-1',
        question: 'In Sleeping Barber, what happens if a Customer arrives when `waiting == N`?',
        options: ['Blocks on `wait(barber)` forever', 'Releases `mutex` and leaves the shop cleanly without deadlocking', 'Wakes the barber immediately', 'Decrements `customers`'],
        correctIndex: 1,
        explanation: 'The `else` branch calls `signal(mutex)` and exits — forgetting `signal(mutex)` in `else` would deadlock the entire shop!',
      },
      {
        id: 'sc-m3-cp-2',
        question: 'Which Dining Philosophers modification breaks the Circular Wait condition directly?',
        options: ['Giving every philosopher 2 plates', 'Asymmetric pickup: odd philosophers pick left chopstick first, even pick right chopstick first', 'Increasing thinking time', 'Adding a mutex around eating only'],
        correctIndex: 1,
        explanation: 'Reversing pickup order for even/odd philosophers makes a closed circular dependency impossible.',
      },
    ],
    examTip: 'In Sleeping Barber’s `else` branch (shop full), NEVER forget `signal(mutex)` before leaving — forgetting it is an instant deadlock deduction!',
  },
  {
    topicId: 'm3-monitors',
    moduleId: 'm3',
    title: 'Monitors, Condition Variables (Hoare vs Mesa) & Scenario Monitor Design',
    summary:
      'A Monitor is a high-level language ADT that automatically enforces mutual exclusion around its shared data and uses condition variables (`wait`/`signal`) for structured coordination.',
    sourceDecks: ['Silberschatz 10e Ch 6 (§6.7–6.8)', 'VITC Past Paper: C1 Set 1-2 Q4 (10M)'],
    keyPoints: [
      'Only **ONE** process/thread can be active inside a Monitor at any instant (compiler-enforced entry queue).',
      'Condition variables `condition x;` support `x.wait()` (releases monitor lock & suspends) and `x.signal()` (resumes one suspended process; **no-op if none waiting**).',
      '**Hoare semantics** (Signal-and-Wait): signaler suspends immediately so woken process runs right away. **Mesa semantics** (Signal-and-Continue — Java/POSIX): signaler continues, so woken process MUST re-check predicate in a **`while`** loop.',
      'VIT Chennai loves real-world **Scenario Monitors** with priority + anti-starvation threshold (e.g., C1 Set 1-2 Q4 Hospital 3 Operating Theatres).',
    ],
    sections: [
      {
        heading: 'Monitor Internal Architecture (Entry Queue + Condition Queues)',
        body: 'Processes waiting to enter the monitor sit in the **Entry Queue**; processes blocked on a condition variable wait in separate **Condition Queues** until signaled.',
        diagramId: 'm3-monitor-structure',
      },
      {
        heading: 'Solved FAT Blueprint: C1 Set 1-2 Q4 Hospital Operating Theatre Monitor',
        body: '3 theatres, 5 surgical teams, **emergency > scheduled** priority, **waiting-threshold anti-starvation** (`MAX_CONSECUTIVE_EMERG = 2`), and **post-surgery cleaning** before reuse.',
        codeBlock: `monitor OperatingTheatres {
    int freeTheatres = 3;
    int waitingEmergency = 0, waitingScheduled = 0;
    int consecutiveEmergencies = 0;
    const int THRESHOLD = 2; // Prevents scheduled surgery starvation
    condition emergQueue, schedQueue;

    void requestTheatre(bool isEmergency) {
        if (isEmergency) {
            waitingEmergency++;
            while (freeTheatres == 0 ||
                   (waitingScheduled > 0 && consecutiveEmergencies >= THRESHOLD))
                emergQueue.wait();
            waitingEmergency--;
            consecutiveEmergencies++;
        } else {
            waitingScheduled++;
            while (freeTheatres == 0 ||
                   (waitingEmergency > 0 && consecutiveEmergencies < THRESHOLD))
                schedQueue.wait();
            waitingScheduled--;
            consecutiveEmergencies = 0; // Reset aging counter after serving scheduled
        }
        freeTheatres--;
    }

    void releaseTheatre() {
        // Theatre enters cleaning phase (NOT yet added back to freeTheatres!)
        notifyCleaningStaff();
    }

    void completeCleaning() {
        freeTheatres++;
        // Wake according to anti-starvation policy
        if (waitingScheduled > 0 && (waitingEmergency == 0 || consecutiveEmergencies >= THRESHOLD))
            schedQueue.signal();
        else if (waitingEmergency > 0)
            emergQueue.signal();
    }
}`,
      },
    ],
    workedExample: {
      title: 'Implementing a Monitor with Semaphores (Silberschatz §6.7.2)',
      problem:
        'Which semaphores implement Hoare-style `x.wait()` and `x.signal()` inside a Monitor?',
      solution:
        'Use `mutex = 1` (monitor entry), `next = 0` (`next_count = 0` for urgent signaling threads), and per-condition `x_sem = 0` (`x_count = 0`). On `x.signal()`, if `x_count > 0`, increment `next_count`, `signal(x_sem)`, `wait(next)`, decrement `next_count`.',
    },
    fatQuestionMethods: [
      {
        paperSource: 'Slot C1 Set 1-2 Q4 (10M)',
        promptSummary: 'Design Hospital Monitor with `requestTheatre()`, `releaseTheatre()`, `completeCleaning()` (6M) + starvation analysis (4M).',
        markBreakdown: 'State variables + conditions (2M) + 3 methods with while-loops (4M) + Starvation proof & threshold trade-off (4M)',
        solutionSteps: [
          'Keep `freeTheatres` decremented during surgery AND during cleaning; increment ONLY inside `completeCleaning()`.',
          'Use `while` loops (Mesa-safe) and a `consecutiveEmergencies >= THRESHOLD` bound so scheduled teams never starve under continuous emergencies.',
          'Explain why strict priority without the threshold starves scheduled surgeries and how tuning `THRESHOLD` balances urgency vs fairness.',
        ],
      },
    ],
    selfChecks: [
      {
        id: 'sc-m3-mon-1',
        question: 'In the Hospital Monitor (C1 Set 1-2 Q4), which method increments `freeTheatres`?',
        options: ['requestTheatre()', 'releaseTheatre()', 'completeCleaning()', 'Both releaseTheatre() and completeCleaning()'],
        correctIndex: 2,
        explanation: 'A released theatre requires cleaning before another surgical team can enter, so `freeTheatres++` happens only in `completeCleaning()`.',
      },
      {
        id: 'sc-m3-mon-2',
        question: 'How does `x.signal()` on a Monitor condition variable differ from `signal(S)` on a Semaphore?',
        options: ['They are identical', 'Monitor `x.signal()` has NO effect if no process is waiting on `x`, whereas Semaphore `signal(S)` always increments `S`', 'Monitor `x.signal()` decrements `x`', 'Semaphore `signal(S)` never wakes processes'],
        correctIndex: 1,
        explanation: 'Condition variables have no memory/counter; a signal with an empty queue is silently lost.',
      },
    ],
    examTip: 'Always use `while (...) cond.wait();` in every Monitor method and explicitly mention Mesa vs Hoare semantics for bonus rigor.',
  },
];
