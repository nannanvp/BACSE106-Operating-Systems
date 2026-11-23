export type PomodoroMode = 'focus' | 'short-break' | 'long-break';

export interface PomodoroState {
  mode: PomodoroMode;
  remainingSeconds: number;
  running: boolean;
  completedFocusSessions: number; // resets daily
  cycleFocusCount: number; // 0..3 -> 4th focus triggers long break
  dateKey: string; // YYYY-MM-DD
}

export const POMODORO_DURATIONS: Record<PomodoroMode, number> = {
  focus: 25 * 60,
  'short-break': 5 * 60,
  'long-break': 15 * 60,
};

export function getLocalDateKey(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function createInitialPomodoroState(dateKey = getLocalDateKey()): PomodoroState {
  return {
    mode: 'focus',
    remainingSeconds: POMODORO_DURATIONS.focus,
    running: false,
    completedFocusSessions: 0,
    cycleFocusCount: 0,
    dateKey,
  };
}

export function syncPomodoroDay(state: PomodoroState, currentDateKey: string): PomodoroState {
  if (state.dateKey === currentDateKey) return state;
  return {
    ...state,
    completedFocusSessions: 0,
    cycleFocusCount: 0,
    dateKey: currentDateKey,
  };
}

export function switchPomodoroMode(state: PomodoroState, mode: PomodoroMode): PomodoroState {
  return {
    ...state,
    mode,
    remainingSeconds: POMODORO_DURATIONS[mode],
    running: false,
  };
}

export function tickPomodoro(
  state: PomodoroState,
  currentDateKey = state.dateKey
): { nextState: PomodoroState; phaseCompleted: PomodoroMode | null } {
  const synced = syncPomodoroDay(state, currentDateKey);
  if (!synced.running) {
    return { nextState: synced, phaseCompleted: null };
  }

  if (synced.remainingSeconds > 1) {
    return {
      nextState: {
        ...synced,
        remainingSeconds: synced.remainingSeconds - 1,
      },
      phaseCompleted: null,
    };
  }

  // Phase completed
  if (synced.mode === 'focus') {
    const nextCompleted = synced.completedFocusSessions + 1;
    const nextCycle = synced.cycleFocusCount + 1;
    const isLongBreak = nextCycle >= 4;
    const nextMode: PomodoroMode = isLongBreak ? 'long-break' : 'short-break';
    return {
      phaseCompleted: 'focus',
      nextState: {
        ...synced,
        mode: nextMode,
        remainingSeconds: POMODORO_DURATIONS[nextMode],
        running: false,
        completedFocusSessions: nextCompleted,
        cycleFocusCount: isLongBreak ? 0 : nextCycle,
      },
    };
  }

  return {
    phaseCompleted: synced.mode,
    nextState: {
      ...synced,
      mode: 'focus',
      remainingSeconds: POMODORO_DURATIONS.focus,
      running: false,
    },
  };
}

export function formatMmSs(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const m = String(Math.floor(clamped / 60)).padStart(2, '0');
  const s = String(clamped % 60).padStart(2, '0');
  return `${m}:${s}`;
}
