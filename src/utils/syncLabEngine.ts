export type SyncScenarioId =
  | 'bounded-buffer'
  | 'peterson'
  | 'sleeping-barber'
  | 'dining-philosophers'
  | 'readers-writers';

export interface SyncStepLog {
  step: number;
  actor: string;
  action: string;
  note: string;
  status: 'nominal' | 'blocked' | 'critical' | 'deadlock';
}

export interface BoundedBufferState {
  capacity: number;
  buffer: string[];
  mutex: number;
  empty: number;
  full: number;
  nextItemId: number;
  blockedProducers: number;
  blockedConsumers: number;
  inPointer: number;
  outPointer: number;
  slots: Array<string | null>;
  raceCorrupted?: boolean;
  log: SyncStepLog[];
}

export interface PetersonState {
  flag: [boolean, boolean];
  turn: 0 | 1;
  inCs: [boolean, boolean];
  sharedSeats: number;
  seatsPerBooking: number;
  raceCorrupted?: boolean;
  log: SyncStepLog[];
}

export interface SleepingBarberState {
  waitingChairs: number;
  waitingQueue: string[];
  customersSem: number;
  barberSem: number;
  mutex: number;
  barberStatus: 'sleeping' | 'cutting';
  activeCustomer: string | null;
  turnedAway: number;
  servedCount: number;
  nextCustomerId: number;
  lostWakeup?: boolean;
  log: SyncStepLog[];
}

export interface DiningPhilosophersState {
  count: number;
  asymmetricFix: boolean;
  states: Array<'thinking' | 'hungry' | 'eating'>;
  chopsticks: Array<number | null>; // owner index (0..4) or null
  deadlocked: boolean;
  log: SyncStepLog[];
}

export interface ReadersWritersState {
  readCount: number;
  mutex: number;
  rwMutex: number;
  activeReaders: string[];
  activeWriter: string | null;
  waitingWriters: number;
  nextActorId: number;
  raceCorrupted?: boolean;
  log: SyncStepLog[];
}

// ============================================================================
// 1. Bounded Buffer (C2 Q6 Food Ordering capacity = 5)
// ============================================================================
export function createBoundedBufferState(capacity = 5): BoundedBufferState {
  return {
    capacity,
    buffer: [],
    mutex: 1,
    empty: capacity,
    full: 0,
    nextItemId: 1,
    blockedProducers: 0,
    blockedConsumers: 0,
    inPointer: 0,
    outPointer: 0,
    slots: Array(capacity).fill(null),
    raceCorrupted: false,
    log: [
      {
        step: 0,
        actor: 'INIT',
        action: `mutex=1, empty=${capacity}, full=0`,
        note: `Circular buffer initialized (C2 Q6 Food Ordering capacity ${capacity}).`,
        status: 'nominal',
      },
    ],
  };
}

export function stepBoundedBuffer(
  state: BoundedBufferState,
  op: 'produce' | 'consume' | 'race-lost-update'
): BoundedBufferState {
  const nextStep = state.log.length;

  if (op === 'race-lost-update') {
    // Race Condition: Producer & Consumer access buffer simultaneously WITHOUT wait(mutex)
    // Assembly interleaving causes Lost Update and slot corruption
    const item = `ORD#${state.nextItemId}*`;
    const corruptSlots = [...state.slots];
    // Overwrite slot at inPointer regardless of whether it was empty
    corruptSlots[state.inPointer] = item;
    return {
      ...state,
      slots: corruptSlots,
      raceCorrupted: true,
      log: [
        ...state.log,
        {
          step: nextStep,
          actor: 'RACE CONFLICT',
          action: 'P & C interleave count = count ± 1 without wait(mutex)',
          note: 'RACE CONDITION! Lost update anomaly: count register overwritten during context switch. Slot corrupted!',
          status: 'deadlock',
        },
      ],
    };
  }

  if (op === 'produce') {
    if (state.empty === 0) {
      return {
        ...state,
        blockedProducers: state.blockedProducers + 1,
        log: [
          ...state.log,
          {
            step: nextStep,
            actor: 'Producer',
            action: 'wait(empty) -> BLOCKED (empty == 0)',
            note: 'Buffer full. Producer blocked on empty semaphore queue; no busy-waiting.',
            status: 'blocked',
          },
        ],
      };
    }

    const item = `ORD#${state.nextItemId}`;
    const newBuffer = [...state.buffer, item];
    const newSlots = [...state.slots];
    newSlots[state.inPointer] = item;
    const nextIn = (state.inPointer + 1) % state.capacity;
    const wokeConsumer = state.blockedConsumers > 0;

    return {
      ...state,
      buffer: newBuffer,
      slots: newSlots,
      inPointer: nextIn,
      empty: state.empty - 1,
      full: state.full + 1,
      nextItemId: state.nextItemId + 1,
      blockedConsumers: wokeConsumer ? state.blockedConsumers - 1 : 0,
      raceCorrupted: false,
      log: [
        ...state.log,
        {
          step: nextStep,
          actor: 'Producer',
          action: `wait(empty), wait(mutex), push(${item}) @ slot ${state.inPointer}, signal(mutex), signal(full)`,
          note: wokeConsumer
            ? `Inserted ${item} at slot ${state.inPointer}. signal(full) woke 1 waiting consumer.`
            : `Inserted ${item} at slot ${state.inPointer}. empty=${state.empty - 1}, full=${state.full + 1}.`,
          status: 'critical',
        },
      ],
    };
  }

  // consume
  if (state.full === 0) {
    return {
      ...state,
      blockedConsumers: state.blockedConsumers + 1,
      log: [
        ...state.log,
        {
          step: nextStep,
          actor: 'Consumer',
          action: 'wait(full) -> BLOCKED (full == 0)',
          note: 'Buffer empty. Consumer blocked on full semaphore queue; no busy-waiting.',
          status: 'blocked',
        },
      ],
    };
  }

  const [removed, ...rest] = state.buffer;
  const newSlots = [...state.slots];
  newSlots[state.outPointer] = null;
  const nextOut = (state.outPointer + 1) % state.capacity;
  const wokeProducer = state.blockedProducers > 0;

  return {
    ...state,
    buffer: rest,
    slots: newSlots,
    outPointer: nextOut,
    empty: state.empty + 1,
    full: state.full - 1,
    blockedProducers: wokeProducer ? state.blockedProducers - 1 : 0,
    raceCorrupted: false,
    log: [
      ...state.log,
      {
        step: nextStep,
        actor: 'Consumer',
        action: `wait(full), wait(mutex), pop(${removed ?? `slot ${state.outPointer}`}), signal(mutex), signal(empty)`,
        note: wokeProducer
          ? `Dispatched ${removed ?? `slot ${state.outPointer}`}. signal(empty) woke 1 waiting producer.`
          : `Dispatched ${removed ?? `slot ${state.outPointer}`}. empty=${state.empty + 1}, full=${state.full - 1}.`,
        status: 'nominal',
      },
    ],
  };
}

// ============================================================================
// 2. Peterson's Solution (C1 1-2 Q3 & C2 Q5 Railway Seats=10, reserve 2)
// ============================================================================
export function createPetersonState(sharedSeats = 10, seatsPerBooking = 2): PetersonState {
  return {
    flag: [false, false],
    turn: 0,
    inCs: [false, false],
    sharedSeats,
    seatsPerBooking,
    raceCorrupted: false,
    log: [
      {
        step: 0,
        actor: 'INIT',
        action: `flag=[F,F], turn=0, seats=${sharedSeats}`,
        note: 'C2 Q5 Railway Reservation: 10 seats, each process reserves 2 seats inside Critical Section.',
        status: 'nominal',
      },
    ],
  };
}

export function stepPeterson(
  state: PetersonState,
  action:
    | 'request-0'
    | 'request-1'
    | 'enter-0'
    | 'enter-1'
    | 'exit-0'
    | 'exit-1'
    | 'simultaneous-c2q5'
    | 'race-both-enter'
): PetersonState {
  const nextStep = state.log.length;

  if (action === 'race-both-enter') {
    // Race Condition: Mutual Exclusion is bypassed (turn variable omitted or ignored)
    // Both P0 and P1 concurrently access shared railway seats -> double booking / lost decrement!
    const doubleDebit = Math.max(0, state.sharedSeats - state.seatsPerBooking * 2);
    return {
      ...state,
      inCs: [true, true],
      sharedSeats: doubleDebit,
      raceCorrupted: true,
      log: [
        ...state.log,
        {
          step: nextStep,
          actor: 'P0 & P1 (RACE)',
          action: 'MUTUAL EXCLUSION VIOLATED! Both P0 & P1 inside CS concurrently',
          note: `CRITICAL RACE CONDITION: Without turn verification, both processes debit sharedSeats simultaneously (${state.sharedSeats} -> ${doubleDebit}). Double-booking anomaly!`,
          status: 'deadlock',
        },
      ],
    };
  }

  if (action === 'simultaneous-c2q5') {
    // Exact C2 Q5 trace: P0 sets flag[0]=T, turn=1; P1 sets flag[1]=T, turn=0 -> P0 enters first!
    return {
      ...state,
      flag: [true, true],
      turn: 0,
      inCs: [false, false],
      raceCorrupted: false,
      log: [
        ...state.log,
        {
          step: nextStep,
          actor: 'P0 & P1',
          action: 'flag[0]=T, flag[1]=T, turn=0 (P1 wrote turn last)',
          note: 'Both express intent. Since P1 set turn=0 last, P0 exits spin-loop while P1 spins at while(flag[0] && turn==0). P0 enters first!',
          status: 'blocked',
        },
      ],
    };
  }

  const pid: 0 | 1 = action.endsWith('0') ? 0 : 1;
  const other: 0 | 1 = pid === 0 ? 1 : 0;

  if (action.startsWith('request')) {
    const nextFlag: [boolean, boolean] = [...state.flag] as [boolean, boolean];
    nextFlag[pid] = true;
    return {
      ...state,
      flag: nextFlag,
      turn: other,
      raceCorrupted: false,
      log: [
        ...state.log,
        {
          step: nextStep,
          actor: `P${pid}`,
          action: `flag[${pid}]=true; turn=${other};`,
          note: `P${pid} sets flag[${pid}]=true and politely yields turn=${other} to P${other}.`,
          status: 'nominal',
        },
      ],
    };
  }

  if (action.startsWith('enter')) {
    if (!state.flag[pid]) {
      return {
        ...state,
        log: [
          ...state.log,
          {
            step: nextStep,
            actor: `P${pid}`,
            action: 'Cannot enter CS before setting flag',
            note: `Run request-${pid} first to signal entry intent.`,
            status: 'blocked',
          },
        ],
      };
    }
    const mustWait = state.flag[other] && state.turn === other;
    if (mustWait || state.inCs[other]) {
      return {
        ...state,
        log: [
          ...state.log,
          {
            step: nextStep,
            actor: `P${pid}`,
            action: `while (flag[${other}] && turn == ${other}) -> SPIN WAIT`,
            note: `Mutual exclusion strictly enforced: P${other} has priority or currently occupies CS.`,
            status: 'blocked',
          },
        ],
      };
    }
    const nextInCs: [boolean, boolean] = [...state.inCs] as [boolean, boolean];
    nextInCs[pid] = true;
    const nextSeats = Math.max(0, state.sharedSeats - state.seatsPerBooking);
    return {
      ...state,
      inCs: nextInCs,
      sharedSeats: nextSeats,
      raceCorrupted: false,
      log: [
        ...state.log,
        {
          step: nextStep,
          actor: `P${pid}`,
          action: `ENTER CS -> sharedSeats = ${state.sharedSeats} - ${state.seatsPerBooking} = ${nextSeats}`,
          note: `Safe exclusive access! Mutual exclusion invariant !(inCs[0] && inCs[1]) holds.`,
          status: 'critical',
        },
      ],
    };
  }

  // exit
  const nextFlag: [boolean, boolean] = [...state.flag] as [boolean, boolean];
  const nextInCs: [boolean, boolean] = [...state.inCs] as [boolean, boolean];
  nextFlag[pid] = false;
  nextInCs[pid] = false;
  return {
    ...state,
    flag: nextFlag,
    inCs: nextInCs,
    raceCorrupted: false,
    log: [
      ...state.log,
      {
        step: nextStep,
        actor: `P${pid}`,
        action: `EXIT CS -> flag[${pid}]=false`,
        note: `P${pid} exits CS and clears flag[${pid}]. P${other} can now break spin wait.`,
        status: 'nominal',
      },
    ],
  };
}

// ============================================================================
// 3. Sleeping Barber (C1 Set 2-2 Q2)
// ============================================================================
export function createSleepingBarberState(waitingChairs = 3): SleepingBarberState {
  return {
    waitingChairs,
    waitingQueue: [],
    customersSem: 0,
    barberSem: 0,
    mutex: 1,
    barberStatus: 'sleeping',
    activeCustomer: null,
    turnedAway: 0,
    servedCount: 0,
    nextCustomerId: 1,
    lostWakeup: false,
    log: [
      {
        step: 0,
        actor: 'INIT',
        action: `chairs=${waitingChairs}, customers=0, barber=0, mutex=1`,
        note: 'C1 Set 2-2 Q2: Barber sleeps on wait(customers) until a customer arrives.',
        status: 'nominal',
      },
    ],
  };
}

export function stepSleepingBarber(
  state: SleepingBarberState,
  op: 'customer-arrive' | 'barber-next' | 'finish-haircut' | 'race-lost-wakeup'
): SleepingBarberState {
  const nextStep = state.log.length;

  if (op === 'race-lost-wakeup') {
    // Race Condition: Customer arrives and tests barber status without atomic mutex lock
    // Barber transitions to sleep between customer test and customer wake call -> Lost Wakeup Deadlock!
    const cid = `C${state.nextCustomerId}`;
    return {
      ...state,
      waitingQueue: [...state.waitingQueue, cid],
      nextCustomerId: state.nextCustomerId + 1,
      barberStatus: 'sleeping',
      lostWakeup: true,
      log: [
        ...state.log,
        {
          step: nextStep,
          actor: `${cid} & Barber`,
          action: 'Lost Wakeup Anomaly: signal(customers) lost during context switch',
          note: 'RACE CONDITION DEADLOCK! Without mutex protecting the customer check, the wakeup signal was lost. Barber sleeps forever while customer waits in chair forever!',
          status: 'deadlock',
        },
      ],
    };
  }

  if (op === 'customer-arrive') {
    const cid = `C${state.nextCustomerId}`;
    if (state.waitingQueue.length >= state.waitingChairs) {
      return {
        ...state,
        turnedAway: state.turnedAway + 1,
        nextCustomerId: state.nextCustomerId + 1,
        lostWakeup: false,
        log: [
          ...state.log,
          {
            step: nextStep,
            actor: cid,
            action: 'wait(mutex) -> waiting == N -> signal(mutex) -> LEAVE',
            note: `All ${state.waitingChairs} waiting chairs occupied. ${cid} leaves shop without deadlock (balking).`,
            status: 'blocked',
          },
        ],
      };
    }
    return {
      ...state,
      waitingQueue: [...state.waitingQueue, cid],
      customersSem: state.customersSem + 1,
      nextCustomerId: state.nextCustomerId + 1,
      lostWakeup: false,
      log: [
        ...state.log,
        {
          step: nextStep,
          actor: cid,
          action: `wait(mutex), sit(${cid}), signal(customers), signal(mutex), wait(barber)`,
          note: `${cid} sits in chair #${state.waitingQueue.length + 1}. customers semaphore incremented to ${state.customersSem + 1}.`,
          status: 'nominal',
        },
      ],
    };
  }

  if (op === 'barber-next') {
    if (state.activeCustomer !== null) {
      return {
        ...state,
        log: [
          ...state.log,
          {
            step: nextStep,
            actor: 'Barber',
            action: `Currently cutting hair for ${state.activeCustomer}`,
            note: 'Must finish the current haircut before invoking wait(customers) for the next customer.',
            status: 'blocked',
          },
        ],
      };
    }
    if (state.waitingQueue.length === 0) {
      return {
        ...state,
        barberStatus: 'sleeping',
        lostWakeup: false,
        log: [
          ...state.log,
          {
            step: nextStep,
            actor: 'Barber',
            action: 'wait(customers) -> SLEEPS (customers == 0)',
            note: 'No waiting customers in chairs. Barber falls asleep cleanly awaiting wait(customers).',
            status: 'nominal',
          },
        ],
      };
    }
    const [nextCust, ...rest] = state.waitingQueue;
    return {
      ...state,
      waitingQueue: rest,
      customersSem: Math.max(0, state.customersSem - 1),
      barberStatus: 'cutting',
      activeCustomer: nextCust,
      lostWakeup: false,
      log: [
        ...state.log,
        {
          step: nextStep,
          actor: 'Barber',
          action: `wait(customers), wait(mutex), call(${nextCust}), signal(barber), signal(mutex)`,
          note: `Barber wakes up and seats ${nextCust} in the styling chair. Available chairs = ${state.waitingChairs - rest.length}.`,
          status: 'critical',
        },
      ],
    };
  }

  // finish-haircut
  if (!state.activeCustomer) {
    return state;
  }
  const finished = state.activeCustomer;
  return {
    ...state,
    activeCustomer: null,
    barberStatus: state.waitingQueue.length === 0 ? 'sleeping' : 'sleeping',
    servedCount: state.servedCount + 1,
    lostWakeup: false,
    log: [
      ...state.log,
      {
        step: nextStep,
        actor: 'Barber',
        action: `Finished haircut for ${finished}`,
        note: `Total customers served: ${state.servedCount + 1}. Barber checks waiting queue or returns to sleep.`,
        status: 'nominal',
      },
    ],
  };
}

// ============================================================================
// 4. Dining Philosophers (Deadlock vs Asymmetric Solution)
// ============================================================================
export function createDiningPhilosophersState(asymmetricFix = false): DiningPhilosophersState {
  return {
    count: 5,
    asymmetricFix,
    states: ['thinking', 'thinking', 'thinking', 'thinking', 'thinking'],
    chopsticks: [null, null, null, null, null],
    deadlocked: false,
    log: [
      {
        step: 0,
        actor: 'INIT',
        action: asymmetricFix
          ? 'Asymmetric Order (Odd picks Left-first, Even picks Right-first)'
          : 'Naive Order (All 5 pick Left-first -> circular wait risk)',
        note: '5 philosophers share 5 chopsticks arranged in a circle.',
        status: 'nominal',
      },
    ],
  };
}

export function stepDiningPhilosophers(
  state: DiningPhilosophersState,
  op: 'all-grab-first' | 'try-eat' | 'release-all' | 'step-philosopher',
  philosopherIndex = 0
): DiningPhilosophersState {
  const nextStep = state.log.length;
  const n = state.count;

  if (op === 'release-all') {
    return {
      ...state,
      states: Array(n).fill('thinking'),
      chopsticks: Array(n).fill(null),
      deadlocked: false,
      log: [
        ...state.log,
        {
          step: nextStep,
          actor: 'ALL',
          action: 'signal(chopsticks) -> all return to thinking',
          note: 'All chopsticks released to the table.',
          status: 'nominal',
        },
      ],
    };
  }

  if (op === 'all-grab-first') {
    if (!state.asymmetricFix) {
      // Classic Coffman Circular Wait Deadlock!
      return {
        ...state,
        states: Array(n).fill('hungry'),
        chopsticks: [0, 1, 2, 3, 4],
        deadlocked: true,
        log: [
          ...state.log,
          {
            step: nextStep,
            actor: 'P0..P4',
            action: 'Each P_i acquires left chopstick[i] -> CIRCULAR WAIT',
            note: 'DEADLOCK! Every philosopher holds 1 chopstick and waits indefinitely for chopstick[(i+1)%5]. All 4 Coffman conditions satisfied!',
            status: 'deadlock',
          },
        ],
      };
    }
    // Asymmetric fix: Even grabs Right first, Odd grabs Left first (or P4 grabs Right first)
    // Breaks Coffman's circular wait condition!
    const chopsticks: Array<number | null> = [null, null, null, null, null];
    const states: Array<'thinking' | 'hungry' | 'eating'> = Array(n).fill('hungry');
    chopsticks[1] = 0;
    chopsticks[3] = 2;
    chopsticks[0] = 4;
    chopsticks[4] = 4;
    states[4] = 'eating';
    return {
      ...state,
      states,
      chopsticks,
      deadlocked: false,
      log: [
        ...state.log,
        {
          step: nextStep,
          actor: 'Asymmetric',
          action: 'Circular Wait Broken -> P4 acquires C0 & C4 and EATS',
          note: 'DEADLOCK PREVENTED! Asymmetric order guarantees at least one philosopher acquires both chopsticks and completes eating.',
          status: 'critical',
        },
      ],
    };
  }

  // try-eat for specific philosopher
  const i = ((philosopherIndex % n) + n) % n;
  const left = i;
  const right = (i + 1) % n;
  const nextSticks = [...state.chopsticks];
  const nextStates = [...state.states];

  if (nextStates[i] === 'eating') {
    nextSticks[left] = null;
    nextSticks[right] = null;
    nextStates[i] = 'thinking';
    return {
      ...state,
      states: nextStates,
      chopsticks: nextSticks,
      deadlocked: false,
      log: [
        ...state.log,
        {
          step: nextStep,
          actor: `P${i}`,
          action: `Put down C${left} & C${right} -> thinking`,
          note: `P${i} finishes eating and signals neighbors that chopsticks are free.`,
          status: 'nominal',
        },
      ],
    };
  }

  if (nextSticks[left] === null && nextSticks[right] === null) {
    nextSticks[left] = i;
    nextSticks[right] = i;
    nextStates[i] = 'eating';
    return {
      ...state,
      states: nextStates,
      chopsticks: nextSticks,
      deadlocked: false,
      log: [
        ...state.log,
        {
          step: nextStep,
          actor: `P${i}`,
          action: `Acquired C${left} & C${right} -> EATING`,
          note: `Both adjacent chopsticks free; P${i} enters critical eating section.`,
          status: 'critical',
        },
      ],
    };
  }

  nextStates[i] = 'hungry';
  return {
    ...state,
    states: nextStates,
    log: [
      ...state.log,
      {
        step: nextStep,
        actor: `P${i}`,
        action: `wait(chopsticks) -> BLOCKED (C${left} or C${right} busy)`,
        note: `Neighbor currently holds needed chopstick. P${i} enters hungry wait queue.`,
        status: 'blocked',
      },
    ],
  };
}

// ============================================================================
// 5. Readers-Writers (First Readers-Writers Problem / Reader Preference)
// ============================================================================
export function createReadersWritersState(): ReadersWritersState {
  return {
    readCount: 0,
    mutex: 1,
    rwMutex: 1,
    activeReaders: [],
    activeWriter: null,
    waitingWriters: 0,
    nextActorId: 1,
    raceCorrupted: false,
    log: [
      {
        step: 0,
        actor: 'INIT',
        action: 'readCount=0, mutex=1, rw_mutex=1',
        note: 'First Readers-Writers: multiple concurrent readers permitted; writer requires exclusive rw_mutex.',
        status: 'nominal',
      },
    ],
  };
}

export function stepReadersWriters(
  state: ReadersWritersState,
  op: 'reader-enter' | 'reader-exit' | 'writer-enter' | 'writer-exit' | 'race-torn-read'
): ReadersWritersState {
  const nextStep = state.log.length;

  if (op === 'race-torn-read') {
    // Race Condition: Reader reads while Writer is actively writing without rw_mutex
    return {
      ...state,
      raceCorrupted: true,
      log: [
        ...state.log,
        {
          step: nextStep,
          actor: 'R & W (RACE)',
          action: 'Concurrent Read and Write without rw_mutex',
          note: 'DATA CORRUPTION! Reader observed partially written intermediate state (Dirty Read / Torn Page). Mutual exclusion violation!',
          status: 'deadlock',
        },
      ],
    };
  }

  if (op === 'reader-enter') {
    if (state.activeWriter) {
      return {
        ...state,
        log: [
          ...state.log,
          {
            step: nextStep,
            actor: `R${state.nextActorId}`,
            action: 'wait(rw_mutex) -> BLOCKED by active writer',
            note: `Writer ${state.activeWriter} holds exclusive rw_mutex. Reader must wait.`,
            status: 'blocked',
          },
        ],
      };
    }
    const rid = `R${state.nextActorId}`;
    const newCount = state.readCount + 1;
    return {
      ...state,
      readCount: newCount,
      rwMutex: 0,
      activeReaders: [...state.activeReaders, rid],
      nextActorId: state.nextActorId + 1,
      raceCorrupted: false,
      log: [
        ...state.log,
        {
          step: nextStep,
          actor: rid,
          action:
            newCount === 1
              ? 'readCount=1 -> wait(rw_mutex) -> locks out writers'
              : `readCount=${newCount} -> concurrent shared read`,
          note:
            newCount === 1
              ? 'First reader locks rw_mutex on behalf of all readers.'
              : 'Subsequent readers bypass rw_mutex (writer starvation risk if read stream is continuous).',
          status: 'critical',
        },
      ],
    };
  }

  if (op === 'reader-exit') {
    if (state.activeReaders.length === 0) return state;
    const [exiting, ...rest] = state.activeReaders;
    const newCount = rest.length;
    return {
      ...state,
      readCount: newCount,
      rwMutex: newCount === 0 ? 1 : 0,
      activeReaders: rest,
      raceCorrupted: false,
      log: [
        ...state.log,
        {
          step: nextStep,
          actor: exiting,
          action:
            newCount === 0
              ? 'readCount=0 -> signal(rw_mutex) -> unlocks for writers'
              : `readCount=${newCount} -> still locked for writers`,
          note:
            newCount === 0
              ? 'Last reader released rw_mutex; waiting writers may now contend.'
              : `${newCount} active reader(s) remain inside shared critical section.`,
          status: 'nominal',
        },
      ],
    };
  }

  if (op === 'writer-enter') {
    const wid = `W${state.nextActorId}`;
    if (state.rwMutex === 0 || state.activeWriter || state.readCount > 0) {
      return {
        ...state,
        waitingWriters: state.waitingWriters + 1,
        log: [
          ...state.log,
          {
            step: nextStep,
            actor: wid,
            action: 'wait(rw_mutex) -> BLOCKED',
            note: `Cannot write while ${state.readCount} reader(s) or writer ${state.activeWriter ?? 'none'} active.`,
            status: 'blocked',
          },
        ],
      };
    }
    return {
      ...state,
      rwMutex: 0,
      activeWriter: wid,
      waitingWriters: Math.max(0, state.waitingWriters - 1),
      nextActorId: state.nextActorId + 1,
      raceCorrupted: false,
      log: [
        ...state.log,
        {
          step: nextStep,
          actor: wid,
          action: 'wait(rw_mutex) -> EXCLUSIVE CRITICAL SECTION',
          note: `${wid} acquired rw_mutex; all readers and other writers strictly blocked.`,
          status: 'critical',
        },
      ],
    };
  }

  // writer-exit
  if (!state.activeWriter) return state;
  const done = state.activeWriter;
  return {
    ...state,
    rwMutex: 1,
    activeWriter: null,
    raceCorrupted: false,
    log: [
      ...state.log,
      {
        step: nextStep,
        actor: done,
        action: 'signal(rw_mutex) -> EXIT',
        note: `${done} released rw_mutex. Readers or waiting writers may now proceed.`,
        status: 'nominal',
      },
    ],
  };
}

// ============================================================================
// Verified Deadlock-Free Solutions & Invariant Proofs Reference Data
// ============================================================================
export interface SyncSolutionSpec {
  id: SyncScenarioId;
  title: string;
  examTag: string;
  problemSummary: string;
  semaphores: Array<{
    name: string;
    init: number | string;
    type: 'Counting Semaphore' | 'Binary Mutex' | 'Shared Variable';
    role: string;
  }>;
  codeSnippet: string;
  proofs: {
    mutualExclusion: string;
    progress: string;
    boundedWaiting: string;
  };
  raceConditionRisk: {
    title: string;
    description: string;
    consequence: string;
    prevention: string;
  };
}

export const SYNC_SOLUTIONS: Record<SyncScenarioId, SyncSolutionSpec> = {
  'bounded-buffer': {
    id: 'bounded-buffer',
    title: 'Producer-Consumer (Bounded Buffer)',
    examTag: 'VIT FAT C2 Q6 (Food Ordering, Capacity=5)',
    problemSummary:
      'Producers place items into a fixed circular buffer while consumers retrieve them. Prevent buffer overflow (produce when full) and underflow (consume when empty) without busy-waiting.',
    semaphores: [
      {
        name: 'mutex',
        init: 1,
        type: 'Binary Mutex',
        role: 'Guarantees mutual exclusion during buffer insertion and extraction.',
      },
      {
        name: 'empty',
        init: 'N (Capacity)',
        type: 'Counting Semaphore',
        role: 'Tracks free slots available for producers; blocks when empty == 0.',
      },
      {
        name: 'full',
        init: 0,
        type: 'Counting Semaphore',
        role: 'Tracks filled slots available for consumers; blocks when full == 0.',
      },
    ],
    codeSnippet: `// PRODUCER
do {
    produce_item(&item);
    wait(empty);    // decrement empty slot count
    wait(mutex);    // enter critical section
    buffer[in] = item;
    in = (in + 1) % BUFFER_SIZE;
    signal(mutex);  // exit critical section
    signal(full);   // wake waiting consumer
} while (true);

// CONSUMER
do {
    wait(full);     // wait for available item
    wait(mutex);    // enter critical section
    item = buffer[out];
    out = (out + 1) % BUFFER_SIZE;
    signal(mutex);  // exit critical section
    signal(empty);  // wake waiting producer
    consume_item(item);
} while (true);`,
    proofs: {
      mutualExclusion:
        'Binary semaphore mutex initialized to 1 ensures at most one process modifies buffer, in, or out at any instant.',
      progress:
        'If buffer is not full, a producer can immediately decrement empty and enter. If buffer is not empty, a consumer can immediately decrement full and enter.',
      boundedWaiting:
        'Counting semaphores empty and full act as FIFO wait queues, preventing starvation of both producers and consumers.',
    },
    raceConditionRisk: {
      title: 'Lost Update Anomaly on Count Variable',
      description:
        'If count = count + 1 and count = count - 1 execute without mutex, register level interleaving (R1=count; R1+1; interrupt; R2=count; R2-1; count=R2; count=R1) results in corrupted count values and overwritten slots.',
      consequence: 'Silent data loss, buffer overruns, and process hang.',
      prevention:
        'Always wrap buffer insertion and index modification inside wait(mutex) ... signal(mutex).',
    },
  },

  peterson: {
    id: 'peterson',
    title: "Peterson's 2-Process Algorithm",
    examTag: 'VIT FAT C1 Set 1-2 Q3 & C2 Q5 (Railway Reservation 10 Seats)',
    problemSummary:
      'Classic software-only mutual exclusion algorithm for two processes using shared boolean flag array and integer turn variable without requiring hardware atomic instructions.',
    semaphores: [
      {
        name: 'flag[2]',
        init: '[false, false]',
        type: 'Shared Variable',
        role: 'flag[i]=true expresses intent of process i to enter the critical section.',
      },
      {
        name: 'turn',
        init: '0 or 1',
        type: 'Shared Variable',
        role: 'Yields priority to other process: whichever writes turn last yields the tie-breaker.',
      },
    ],
    codeSnippet: `// PROCESS P_i (where other process is P_j = 1 - i)
do {
    flag[i] = true;
    turn = j;
    while (flag[j] && turn == j) {
        // busy wait spin loop
    }

    /* CRITICAL SECTION (e.g. railwaySeats -= 2) */

    flag[i] = false;

    /* REMAINDER SECTION */
} while (true);`,
    proofs: {
      mutualExclusion:
        'For both P0 and P1 to be in CS simultaneously, flag[0]=true and flag[1]=true. But turn must be either 0 or 1. If turn==0, P1 is spinning; if turn==1, P0 is spinning. Simultaneous entry is mathematically impossible.',
      progress:
        'If P_j does not want CS (flag[j]==false), P_i skips the while loop immediately. If both want CS, the value of turn (0 or 1) determines who enters immediately without indefinite postponement.',
      boundedWaiting:
        'Once P_j exits CS, it resets flag[j]=false, immediately allowing P_i to exit its spin loop. P_i waits at most 1 turn.',
    },
    raceConditionRisk: {
      title: 'Mutual Exclusion Failure if Turn is Omitted',
      description:
        'If only flag[i] is used without turn, both processes can set flag[0]=true and flag[1]=true at the exact same instant, resulting in either livelock/deadlock or simultaneous entry.',
      consequence:
        'In C2 Q5 Railway Reservation, both processes decrement sharedSeats concurrently, causing double-booking.',
      prevention:
        'Both flag and turn variables are strictly required to satisfy all three critical section requirements.',
    },
  },

  'sleeping-barber': {
    id: 'sleeping-barber',
    title: 'Sleeping Barber Problem',
    examTag: 'VIT FAT C1 Set 2-2 Q2 (Chairs=3, Balking on Full)',
    problemSummary:
      'A barber sleeps until a customer arrives. Arriving customers take a waiting chair if available; if all chairs are occupied, they leave (balking). Mutex protects chair count checks.',
    semaphores: [
      {
        name: 'customers',
        init: 0,
        type: 'Counting Semaphore',
        role: 'Counts waiting customers and wakes up the sleeping barber.',
      },
      {
        name: 'barber',
        init: 0,
        type: 'Counting Semaphore',
        role: 'Signals that barber is ready to cut hair for the next customer.',
      },
      {
        name: 'mutex',
        init: 1,
        type: 'Binary Mutex',
        role: 'Provides mutual exclusion when inspecting and modifying the waiting count.',
      },
    ],
    codeSnippet: `// BARBER PROCESS
while (true) {
    wait(customers);  // sleep until customer arrives
    wait(mutex);      // lock waiting chair count
    waiting--;
    signal(barber);   // invite customer to barber chair
    signal(mutex);    // release chair lock
    cut_hair();
}

// CUSTOMER PROCESS
wait(mutex);
if (waiting < CHAIRS) {
    waiting++;
    signal(customers); // notify barber
    signal(mutex);     // release chair lock
    wait(barber);      // wait until barber is ready
    get_haircut();
} else {
    signal(mutex);     // chairs full -> leave shop without haircut
}`,
    proofs: {
      mutualExclusion:
        'mutex protects waiting variable from simultaneous read/write when multiple customers arrive concurrently.',
      progress:
        'If a customer arrives and chairs are available, customers semaphore is incremented, immediately unblocking the barber.',
      boundedWaiting:
        'Customers are served in arrival order (FIFO queue), ensuring bounded waiting.',
    },
    raceConditionRisk: {
      title: 'Lost Wakeup Deadlock Anomaly',
      description:
        'Without mutex protection around the waiting check, a customer may evaluate the condition, context switch occurs, barber goes to sleep, and customer signal is lost forever.',
      consequence: 'Barber sleeps forever while customer waits forever in the chair.',
      prevention:
        'Atomic testing of waiting chair count and signaling inside wait(mutex) ... signal(mutex).',
    },
  },

  'dining-philosophers': {
    id: 'dining-philosophers',
    title: 'Dining Philosophers Problem',
    examTag: 'Dijkstra 1965 / Silberschatz Chapter 7 (Deadlock vs Asymmetric)',
    problemSummary:
      '5 philosophers sit around a table with 5 chopsticks. Each needs both left and right chopsticks to eat. If all grab their left chopstick simultaneously, circular wait deadlock occurs.',
    semaphores: [
      {
        name: 'chopstick[5]',
        init: '[1, 1, 1, 1, 1]',
        type: 'Binary Mutex',
        role: 'Each chopstick is represented by a binary semaphore (1=free, 0=in-use).',
      },
      {
        name: 'asymmetric fix',
        init: 'Odd/Even',
        type: 'Shared Variable',
        role: 'Odd philosophers grab Left then Right; Even philosophers grab Right then Left.',
      },
    ],
    codeSnippet: `// NAIVE SOLUTION (DEADLOCKABLE)
do {
    wait(chopstick[i]);
    wait(chopstick[(i + 1) % 5]);
    eat();
    signal(chopstick[i]);
    signal(chopstick[(i + 1) % 5]);
    think();
} while (true);

// ASYMMETRIC SOLUTION (DEADLOCK-FREE)
do {
    if (i % 2 == 0) {
        wait(chopstick[(i + 1) % 5]); // even picks right first
        wait(chopstick[i]);
    } else {
        wait(chopstick[i]);           // odd picks left first
        wait(chopstick[(i + 1) % 5]);
    }
    eat();
    signal(chopstick[i]);
    signal(chopstick[(i + 1) % 5]);
    think();
} while (true);`,
    proofs: {
      mutualExclusion:
        'Each chopstick is binary semaphore initialized to 1, ensuring no chopstick is held by more than one philosopher simultaneously.',
      progress:
        'Breaking circular wait guarantees that adjacent philosophers do not form a closed cycle of dependency. At least one philosopher can acquire both chopsticks.',
      boundedWaiting:
        'No philosopher starves assuming fair scheduling on individual chopstick semaphores.',
    },
    raceConditionRisk: {
      title: 'Circular Wait Deadlock (Coffman Condition #4)',
      description:
        'In naive symmetric code, all 5 philosophers grab left chopstick i simultaneously. Each philosopher holds 1 chopstick and blocks on chopstick (i+1)%5.',
      consequence: 'Total deadlock: none of the 5 philosophers can ever eat.',
      prevention:
        'Break Circular Wait via Asymmetric Ordering (odd left-first, even right-first) or Resource Hierarchy (always grab lower-numbered chopstick first).',
    },
  },

  'readers-writers': {
    id: 'readers-writers',
    title: 'First Readers-Writers Problem',
    examTag: 'Courtois et al. 1971 / Reader Preference',
    problemSummary:
      'Multiple readers may read a database concurrently without interference. A writer requires exclusive access (no other readers or writers). Reader preference allows writer starvation.',
    semaphores: [
      {
        name: 'rw_mutex',
        init: 1,
        type: 'Binary Mutex',
        role: 'Provides mutual exclusion for writers and the first/last reader.',
      },
      {
        name: 'mutex',
        init: 1,
        type: 'Binary Mutex',
        role: 'Protects the readCount variable during reader entry and exit.',
      },
    ],
    codeSnippet: `// WRITER
do {
    wait(rw_mutex);
    /* writing performed */
    signal(rw_mutex);
} while (true);

// READER
do {
    wait(mutex);
    read_count++;
    if (read_count == 1)
        wait(rw_mutex);  // first reader locks rw_mutex
    signal(mutex);

    /* reading performed */

    wait(mutex);
    read_count--;
    if (read_count == 0)
        signal(rw_mutex); // last reader releases rw_mutex
    signal(mutex);
} while (true);`,
    proofs: {
      mutualExclusion:
        'Writers execute wait(rw_mutex). Since the first reader acquires rw_mutex, no writer can enter while read_count > 0.',
      progress:
        'If no writer is present and read_count==0, either a reader or writer can acquire rw_mutex.',
      boundedWaiting:
        'Reader preference may cause writer starvation if readers continuously arrive. Writer preference solution solves this using an additional queue semaphore.',
    },
    raceConditionRisk: {
      title: 'Torn Reads / Dirty Reads',
      description:
        'If readers do not lock rw_mutex, a writer can modify fields while a reader reads, causing torn data.',
      consequence: 'Inconsistent data reads and memory corruption.',
      prevention:
        'First reader must lock rw_mutex before any reading commences; last reader must release it.',
    },
  },
};
