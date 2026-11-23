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
  log: SyncStepLog[];
}

export interface PetersonState {
  flag: [boolean, boolean];
  turn: 0 | 1;
  inCs: [boolean, boolean];
  sharedSeats: number;
  seatsPerBooking: number;
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
  log: SyncStepLog[];
}

export interface DiningPhilosophersState {
  count: number;
  asymmetricFix: boolean;
  states: Array<'thinking' | 'hungry' | 'eating'>;
  chopsticks: Array<number | null>; // owner index or null
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
  log: SyncStepLog[];
}

// --- 1. Bounded Buffer (C2 Q6 Food Ordering capacity = 5) ---
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
    log: [
      {
        step: 0,
        actor: 'INIT',
        action: `mutex=1, empty=${capacity}, full=0`,
        note: 'Buffer initialized (C2 Q6 Food Ordering capacity 5).',
        status: 'nominal',
      },
    ],
  };
}

export function stepBoundedBuffer(
  state: BoundedBufferState,
  op: 'produce' | 'consume'
): BoundedBufferState {
  const nextStep = state.log.length;
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
            action: 'wait(empty) -> BLOCKED',
            note: 'Buffer full (empty=0). Producer sleeps on empty queue; no busy-wait.',
            status: 'blocked',
          },
        ],
      };
    }
    const item = `ORD#${state.nextItemId}`;
    const newBuffer = [...state.buffer, item];
    const wokeConsumer = state.blockedConsumers > 0;
    return {
      ...state,
      buffer: newBuffer,
      empty: state.empty - 1,
      full: state.full + 1,
      nextItemId: state.nextItemId + 1,
      blockedConsumers: wokeConsumer ? state.blockedConsumers - 1 : 0,
      log: [
        ...state.log,
        {
          step: nextStep,
          actor: 'Producer',
          action: `wait(empty), wait(mutex), push(${item}), signal(mutex), signal(full)`,
          note: wokeConsumer
            ? `Inserted ${item}. signal(full) woke 1 waiting consumer.`
            : `Inserted ${item}. empty=${state.empty - 1}, full=${state.full + 1}.`,
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
          action: 'wait(full) -> BLOCKED',
          note: 'Buffer empty (full=0). Consumer sleeps on full queue.',
          status: 'blocked',
        },
      ],
    };
  }

  const [removed, ...rest] = state.buffer;
  const wokeProducer = state.blockedProducers > 0;
  return {
    ...state,
    buffer: rest,
    empty: state.empty + 1,
    full: state.full - 1,
    blockedProducers: wokeProducer ? state.blockedProducers - 1 : 0,
    log: [
      ...state.log,
      {
        step: nextStep,
        actor: 'Consumer',
        action: `wait(full), wait(mutex), pop(${removed}), signal(mutex), signal(empty)`,
        note: wokeProducer
          ? `Delivered ${removed}. signal(empty) woke 1 waiting producer.`
          : `Delivered ${removed}. empty=${state.empty + 1}, full=${state.full - 1}.`,
        status: 'nominal',
      },
    ],
  };
}

// --- 2. Peterson's Solution (C1 1-2 Q3 & C2 Q5 Railway Seats=10, reserve 2) ---
export function createPetersonState(sharedSeats = 10, seatsPerBooking = 2): PetersonState {
  return {
    flag: [false, false],
    turn: 0,
    inCs: [false, false],
    sharedSeats,
    seatsPerBooking,
    log: [
      {
        step: 0,
        actor: 'INIT',
        action: `flag=[F,F], turn=0, seats=${sharedSeats}`,
        note: 'C2 Q5 Railway Reservation: 10 seats, each process reserves 2 seats inside CS.',
        status: 'nominal',
      },
    ],
  };
}

export function stepPeterson(
  state: PetersonState,
  action: 'request-0' | 'request-1' | 'enter-0' | 'enter-1' | 'exit-0' | 'exit-1' | 'simultaneous-c2q5'
): PetersonState {
  const nextStep = state.log.length;

  if (action === 'simultaneous-c2q5') {
    // Exact C2 Q5 trace: P0 sets flag[0]=T, turn=1; P1 sets flag[1]=T, turn=0 -> P0 enters first!
    return {
      ...state,
      flag: [true, true],
      turn: 0,
      inCs: [false, false],
      log: [
        ...state.log,
        {
          step: nextStep,
          actor: 'P0 & P1',
          action: 'flag[0]=T, flag[1]=T, turn=0 (P1 wrote turn last)',
          note: 'Both want CS. Since turn==0, P0 exits spin-loop and enters CS first; P1 waits.',
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
      log: [
        ...state.log,
        {
          step: nextStep,
          actor: `P${pid}`,
          action: `flag[${pid}]=true; turn=${other};`,
          note: `P${pid} expresses intent and politely yields turn to P${other}.`,
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
            note: `Run request-${pid} first to execute entry section.`,
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
            note: `Mutual exclusion enforced: P${other} has priority or occupies CS.`,
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
      log: [
        ...state.log,
        {
          step: nextStep,
          actor: `P${pid}`,
          action: `ENTER CS -> seats = ${state.sharedSeats} - ${state.seatsPerBooking} = ${nextSeats}`,
          note: `Safe exclusive access! Mutual exclusion holds (never both in CS).`,
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
    log: [
      ...state.log,
      {
        step: nextStep,
        actor: `P${pid}`,
        action: `EXIT CS -> flag[${pid}]=false`,
        note: `P${pid} releases CS; P${other} can now break out of its spin-loop.`,
        status: 'nominal',
      },
    ],
  };
}

// --- 3. Sleeping Barber (C1 Set 2-2 Q2) ---
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
  op: 'customer-arrive' | 'barber-next' | 'finish-haircut'
): SleepingBarberState {
  const nextStep = state.log.length;
  if (op === 'customer-arrive') {
    const cid = `C${state.nextCustomerId}`;
    if (state.waitingQueue.length >= state.waitingChairs) {
      return {
        ...state,
        turnedAway: state.turnedAway + 1,
        nextCustomerId: state.nextCustomerId + 1,
        log: [
          ...state.log,
          {
            step: nextStep,
            actor: cid,
            action: 'wait(mutex) -> waiting == N -> signal(mutex) -> LEAVE',
            note: `All ${state.waitingChairs} waiting chairs full. ${cid} leaves without deadlock.`,
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
      log: [
        ...state.log,
        {
          step: nextStep,
          actor: cid,
          action: `wait(mutex), sit(${cid}), signal(customers), signal(mutex), wait(barber)`,
          note: `${cid} takes chair #${state.waitingQueue.length + 1}. customers=${state.customersSem + 1}.`,
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
            action: `Still cutting hair for ${state.activeCustomer}`,
            note: 'Finish the current haircut before calling wait(customers).',
            status: 'blocked',
          },
        ],
      };
    }
    if (state.waitingQueue.length === 0) {
      return {
        ...state,
        barberStatus: 'sleeping',
        log: [
          ...state.log,
          {
            step: nextStep,
            actor: 'Barber',
            action: 'wait(customers) -> SLEEPS',
            note: 'No waiting customers (customers=0). Barber sleeps cleanly.',
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
      log: [
        ...state.log,
        {
          step: nextStep,
          actor: 'Barber',
          action: `wait(customers), wait(mutex), call(${nextCust}), signal(barber), signal(mutex)`,
          note: `Barber wakes & cuts ${nextCust}'s hair. Free chairs=${state.waitingChairs - rest.length}.`,
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
    log: [
      ...state.log,
      {
        step: nextStep,
        actor: 'Barber',
        action: `Finished haircut for ${finished}`,
        note: `Total served: ${state.servedCount + 1}. Ready to call next customer or sleep.`,
        status: 'nominal',
      },
    ],
  };
}

// --- 4. Dining Philosophers (Deadlock vs Asymmetric Solution) ---
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
          ? 'Asymmetric order enabled (odd picks left-first, even picks right-first)'
          : 'Naive order (all pick left chopstick i first -> circular wait risk)',
        note: '5 philosophers share 5 chopsticks.',
        status: 'nominal',
      },
    ],
  };
}

export function stepDiningPhilosophers(
  state: DiningPhilosophersState,
  op: 'all-grab-first' | 'try-eat' | 'release-all',
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
          action: 'signal(chopsticks) -> all thinking',
          note: 'All chopsticks released.',
          status: 'nominal',
        },
      ],
    };
  }

  if (op === 'all-grab-first') {
    if (!state.asymmetricFix) {
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
            note: 'DEADLOCK! Every philosopher holds 1 chopstick and blocks forever on chopstick[(i+1)%5].',
            status: 'deadlock',
          },
        ],
      };
    }
    // Asymmetric fix: even grabs right (i+1)%5, odd grabs left i -> breaks circular wait!
    const chopsticks: Array<number | null> = [null, null, null, null, null];
    const states: Array<'thinking' | 'hungry' | 'eating'> = Array(n).fill('hungry');
    // P0 grabs C1, P1 wants C1 (blocked), P2 grabs C3, P3 wants C3 (blocked), P4 grabs C0 then C4 -> eats!
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
          action: 'Circular wait broken -> P4 acquires C0 & C4 and EATS',
          note: 'Deadlock prevented! Breaking circular wait guarantees at least one philosopher completes.',
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
          note: `P${i} finishes eating and signals both neighbors.`,
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
          note: `Both chopsticks free; P${i} enters critical section.`,
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
        action: `Blocked waiting for C${left} or C${right}`,
        note: `Neighbor holds a needed chopstick.`,
        status: 'blocked',
      },
    ],
  };
}

// --- 5. Readers-Writers (First Readers-Writers Problem) ---
export function createReadersWritersState(): ReadersWritersState {
  return {
    readCount: 0,
    mutex: 1,
    rwMutex: 1,
    activeReaders: [],
    activeWriter: null,
    waitingWriters: 0,
    nextActorId: 1,
    log: [
      {
        step: 0,
        actor: 'INIT',
        action: 'read_count=0, mutex=1, rw_mutex=1',
        note: 'First Readers-Writers: concurrent readers allowed; writer requires exclusive rw_mutex.',
        status: 'nominal',
      },
    ],
  };
}

export function stepReadersWriters(
  state: ReadersWritersState,
  op: 'reader-enter' | 'reader-exit' | 'writer-enter' | 'writer-exit'
): ReadersWritersState {
  const nextStep = state.log.length;
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
            note: `Writer ${state.activeWriter} holds exclusive rw_mutex.`,
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
      log: [
        ...state.log,
        {
          step: nextStep,
          actor: rid,
          action:
            newCount === 1
              ? 'read_count=1 -> wait(rw_mutex) -> READING'
              : `read_count=${newCount} -> concurrent READING`,
          note:
            newCount === 1
              ? 'First reader locks out writers via rw_mutex.'
              : 'Subsequent readers bypass rw_mutex (writer starvation risk if stream continues).',
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
      log: [
        ...state.log,
        {
          step: nextStep,
          actor: exiting,
          action:
            newCount === 0
              ? 'read_count=0 -> signal(rw_mutex)'
              : `read_count=${newCount} -> still locked for writers`,
          note:
            newCount === 0
              ? 'Last reader released rw_mutex; waiting writers may proceed.'
              : `${newCount} reader(s) still active.`,
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
      log: [
        ...state.log,
        {
          step: nextStep,
          actor: wid,
          action: 'wait(rw_mutex) -> EXCLUSIVE WRITING',
          note: `${wid} holds rw_mutex; all readers & other writers blocked.`,
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
    log: [
      ...state.log,
      {
        step: nextStep,
        actor: done,
        action: 'signal(rw_mutex) -> EXIT',
        note: `${done} released rw_mutex.`,
        status: 'nominal',
      },
    ],
  };
}
