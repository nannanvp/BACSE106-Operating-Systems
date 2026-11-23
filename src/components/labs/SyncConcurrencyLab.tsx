import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import {
  SyncScenarioId,
  createBoundedBufferState,
  createDiningPhilosophersState,
  createPetersonState,
  createReadersWritersState,
  createSleepingBarberState,
  stepBoundedBuffer,
  stepDiningPhilosophers,
  stepPeterson,
  stepReadersWriters,
  stepSleepingBarber,
} from '../../utils/syncLabEngine';

const SCENARIOS: Array<{ id: SyncScenarioId; label: string }> = [
  { id: 'bounded-buffer', label: 'Bounded Buffer (C2 Q6)' },
  { id: 'peterson', label: "Peterson's (C2 Q5)" },
  { id: 'sleeping-barber', label: 'Sleeping Barber (C1 2-2 Q2)' },
  { id: 'dining-philosophers', label: 'Dining Philosophers' },
  { id: 'readers-writers', label: 'Readers-Writers' },
];

export const SyncConcurrencyLab: React.FC = () => {
  const [scenario, setScenario] = useState<SyncScenarioId>('bounded-buffer');

  const [bb, setBb] = useState(() => createBoundedBufferState(5));
  const [pet, setPet] = useState(() => createPetersonState(10, 2));
  const [barber, setBarber] = useState(() => createSleepingBarberState(3));
  const [dp, setDp] = useState(() => createDiningPhilosophersState(false));
  const [rw, setRw] = useState(() => createReadersWritersState());

  const activeLog =
    scenario === 'bounded-buffer'
      ? bb.log
      : scenario === 'peterson'
        ? pet.log
        : scenario === 'sleeping-barber'
          ? barber.log
          : scenario === 'dining-philosophers'
            ? dp.log
            : rw.log;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1.5">
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setScenario(s.id)}
            className={`px-2.5 py-1.5 text-xs font-mono font-semibold rounded-[2px] border ${
              scenario === s.id
                ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)]'
                : 'bg-[var(--bg-paper)] text-[var(--ink-secondary)] border-[var(--rule-hairline)]'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Scenario Stage */}
      <div className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[2px] p-5 space-y-4">
        {scenario === 'bounded-buffer' && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-mono text-xs tabular-nums">
                <strong>Semaphores:</strong> mutex={bb.mutex} · empty={bb.empty} · full={bb.full} ·
                Blocked P={bb.blockedProducers}, C={bb.blockedConsumers}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBb((s) => stepBoundedBuffer(s, 'produce'))}
                  className="px-3 py-1.5 text-xs font-mono font-semibold rounded-[2px] bg-[var(--div-m3)] text-white"
                >
                  + Produce Order
                </button>
                <button
                  type="button"
                  onClick={() => setBb((s) => stepBoundedBuffer(s, 'consume'))}
                  className="px-3 py-1.5 text-xs font-mono font-semibold rounded-[2px] bg-[var(--div-m5)] text-white"
                >
                  − Consume Order
                </button>
                <button
                  type="button"
                  onClick={() => setBb(createBoundedBufferState(5))}
                  className="p-1.5 rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-sheet)]"
                  aria-label="Reset bounded buffer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: bb.capacity }).map((_, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-[2px] border font-mono text-xs text-center ${
                    bb.buffer[i]
                      ? 'bg-[var(--bg-recessed)] border-[var(--div-m3)] font-bold text-[var(--ink-primary)]'
                      : 'bg-[var(--bg-sheet)] border-[var(--rule-hairline)] text-[var(--ink-muted)]'
                  }`}
                >
                  Slot {i}: {bb.buffer[i] ?? 'Empty'}
                </div>
              ))}
            </div>
          </>
        )}

        {scenario === 'peterson' && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-mono text-xs tabular-nums">
                <strong>Shared Seats:</strong> {pet.sharedSeats} · flag[0]={String(pet.flag[0])} ·
                flag[1]={String(pet.flag[1])} · turn={pet.turn} · inCS=[{String(pet.inCs[0])},{' '}
                {String(pet.inCs[1])}]
              </div>
              <button
                type="button"
                onClick={() => setPet(createPetersonState(10, 2))}
                className="p-1.5 rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-sheet)]"
                aria-label="Reset Peterson"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => setPet((s) => stepPeterson(s, 'simultaneous-c2q5'))}
                className="px-2.5 py-1.5 rounded-[2px] bg-[var(--div-m2)] text-white font-semibold"
              >
                1. C2 Q5 Simultaneous (turn=0)
              </button>
              <button
                type="button"
                onClick={() => setPet((s) => stepPeterson(s, 'enter-0'))}
                className="px-2.5 py-1.5 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)]"
              >
                P0 Enter CS
              </button>
              <button
                type="button"
                onClick={() => setPet((s) => stepPeterson(s, 'exit-0'))}
                className="px-2.5 py-1.5 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)]"
              >
                P0 Exit CS (-2 seats)
              </button>
              <button
                type="button"
                onClick={() => setPet((s) => stepPeterson(s, 'enter-1'))}
                className="px-2.5 py-1.5 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)]"
              >
                P1 Enter CS
              </button>
              <button
                type="button"
                onClick={() => setPet((s) => stepPeterson(s, 'exit-1'))}
                className="px-2.5 py-1.5 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)]"
              >
                P1 Exit CS (-2 seats)
              </button>
            </div>
          </>
        )}

        {scenario === 'sleeping-barber' && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs tabular-nums">
              <div>
                Barber: <strong className="uppercase">{barber.barberStatus}</strong> (
                {barber.activeCustomer ?? 'Idle'}) · Waiting: {barber.waitingQueue.length}/
                {barber.waitingChairs} · Served: {barber.servedCount} · Turned Away:{' '}
                {barber.turnedAway}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setBarber((s) => stepSleepingBarber(s, 'customer-arrive'))}
                  className="px-2.5 py-1.5 rounded-[2px] bg-[var(--div-m3)] text-white font-semibold"
                >
                  + Customer Arrives
                </button>
                <button
                  type="button"
                  onClick={() => setBarber((s) => stepSleepingBarber(s, 'barber-next'))}
                  className="px-2.5 py-1.5 rounded-[2px] bg-[var(--div-m5)] text-white font-semibold"
                >
                  Barber Calls Next
                </button>
                <button
                  type="button"
                  onClick={() => setBarber((s) => stepSleepingBarber(s, 'finish-haircut'))}
                  className="px-2.5 py-1.5 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)]"
                >
                  Finish Haircut
                </button>
                <button
                  type="button"
                  onClick={() => setBarber(createSleepingBarberState(3))}
                  className="p-1.5 rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-sheet)]"
                  aria-label="Reset Sleeping Barber"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 font-mono text-xs">
              {Array.from({ length: barber.waitingChairs }).map((_, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-[2px] bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] text-center"
                >
                  Chair {idx + 1}: <strong>{barber.waitingQueue[idx] ?? 'Empty'}</strong>
                </div>
              ))}
            </div>
          </>
        )}

        {scenario === 'dining-philosophers' && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
              <div>
                Mode:{' '}
                <strong>
                  {dp.asymmetricFix ? 'Asymmetric Odd/Even (Deadlock-Free)' : 'Naive Left-First (Deadlockable)'}
                </strong>{' '}
                {dp.deadlocked && <span className="text-[var(--div-danger)] font-bold">· DEADLOCK!</span>}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setDp(createDiningPhilosophersState(!dp.asymmetricFix))}
                  className="px-2.5 py-1.5 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)] font-semibold"
                >
                  Switch to {dp.asymmetricFix ? 'Naive Mode' : 'Asymmetric Fix'}
                </button>
                <button
                  type="button"
                  onClick={() => setDp((s) => stepDiningPhilosophers(s, 'all-grab-first'))}
                  className="px-2.5 py-1.5 rounded-[2px] bg-[var(--div-danger)] text-white font-semibold"
                >
                  All Grab 1st Chopstick
                </button>
                <button
                  type="button"
                  onClick={() => setDp((s) => stepDiningPhilosophers(s, 'try-eat', 0))}
                  className="px-2.5 py-1.5 rounded-[2px] bg-[var(--div-m3)] text-white font-semibold"
                >
                  P0 Try Eat
                </button>
                <button
                  type="button"
                  onClick={() => setDp((s) => stepDiningPhilosophers(s, 'release-all'))}
                  className="px-2.5 py-1.5 rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-sheet)]"
                >
                  Release All
                </button>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2 font-mono text-xs text-center">
              {dp.states.map((st, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-[2px] border ${
                    st === 'eating'
                      ? 'border-[var(--div-m3)] bg-[var(--div-m3)]/15'
                      : st === 'hungry'
                        ? 'border-[var(--div-danger)] bg-[var(--div-danger)]/15'
                        : 'border-[var(--rule-hairline)] bg-[var(--bg-sheet)]'
                  }`}
                >
                  <div className="font-bold">P{idx}</div>
                  <div className="uppercase text-[11px]">{st}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {scenario === 'readers-writers' && (
          <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
            <div>
              readCount={rw.readCount} · rw_mutex={rw.rwMutex} · Active Readers:{' '}
              {rw.activeReaders.join(', ') || 'None'} · Active Writer: {rw.activeWriter ?? 'None'}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setRw((s) => stepReadersWriters(s, 'reader-enter'))}
                className="px-2.5 py-1.5 rounded-[2px] bg-[var(--div-m4)] text-white font-semibold"
              >
                + Reader Enter
              </button>
              <button
                type="button"
                onClick={() => setRw((s) => stepReadersWriters(s, 'reader-exit'))}
                className="px-2.5 py-1.5 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)]"
              >
                − Reader Exit
              </button>
              <button
                type="button"
                onClick={() => setRw((s) => stepReadersWriters(s, 'writer-enter'))}
                className="px-2.5 py-1.5 rounded-[2px] bg-[var(--div-m2)] text-white font-semibold"
              >
                + Writer Enter
              </button>
              <button
                type="button"
                onClick={() => setRw((s) => stepReadersWriters(s, 'writer-exit'))}
                className="px-2.5 py-1.5 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)]"
              >
                − Writer Exit
              </button>
            </div>
          </div>
        )}

        {/* Execution Trace Log */}
        <div className="pt-3 border-t border-[var(--rule-hairline)] space-y-1.5">
          <div className="font-mono text-xs font-bold text-[var(--ink-muted)]">
            Synchronization Trace Log (Latest First)
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1 font-mono text-xs">
            {[...activeLog].reverse().map((entry) => (
              <div
                key={entry.step}
                className="px-3 py-1.5 rounded-[2px] bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] flex flex-wrap justify-between gap-2"
              >
                <span>
                  <strong className="text-[var(--ink-primary)]">#{entry.step} [{entry.actor}]</strong>{' '}
                  {entry.action}
                </span>
                <span className="text-[var(--ink-muted)]">{entry.note}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
