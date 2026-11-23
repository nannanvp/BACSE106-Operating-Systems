import React, { useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import {
  PomodoroMode,
  PomodoroState,
  createInitialPomodoroState,
  formatMmSs,
  getLocalDateKey,
  switchPomodoroMode,
  syncPomodoroDay,
  tickPomodoro,
} from '../utils/pomodoroEngine';

const STORAGE_KEY = 'bacse106_pomodoro_v1';

function playWebAudioChime(): void {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5 - E5 - G5 clean chord arpeggio
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);
      gain.gain.setValueAtTime(0.12, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.46);
    });
  } catch {
    // AudioContext blocked or unavailable; silently ignore
  }
}

export const PomodoroTimer: React.FC = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [state, setState] = useState<PomodoroState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PomodoroState;
        return syncPomodoroDay({ ...parsed, running: false }, getLocalDateKey());
      }
    } catch {
      // ignore corrupted storage
    }
    return createInitialPomodoroState(getLocalDateKey());
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore storage quota
    }
  }, [state]);

  useEffect(() => {
    if (!state.running) return;
    const id = window.setInterval(() => {
      setState((prev) => {
        const { nextState, phaseCompleted } = tickPomodoro(prev, getLocalDateKey());
        if (phaseCompleted && soundEnabled) {
          playWebAudioChime();
        }
        return nextState;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [state.running, soundEnabled]);

  const modes: Array<{ id: PomodoroMode; label: string }> = [
    { id: 'focus', label: 'Focus 25m' },
    { id: 'short-break', label: 'Short 5m' },
    { id: 'long-break', label: 'Long 15m' },
  ];

  return (
    <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-4">
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[var(--rule-hairline)]">
        <h3 className="text-sm font-bold text-[var(--ink-primary)]">
          Sprint Pomodoro Clock
        </h3>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-[var(--ink-muted)] tabular-nums">
            Today: {state.completedFocusSessions} · Cycle {state.cycleFocusCount}/4
          </span>
          <button
            type="button"
            onClick={() => setSoundEnabled((s) => !s)}
            aria-label={soundEnabled ? 'Mute chime' : 'Enable chime'}
            className="p-1 rounded-[2px] border border-[var(--rule-hairline)] text-[var(--ink-secondary)] hover:bg-[var(--bg-recessed)] cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 mt-3">
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setState((prev) => switchPomodoroMode(prev, m.id))}
            className={`flex-1 font-mono text-xs py-1.5 px-2 rounded-[2px] border transition-colors cursor-pointer ${
              state.mode === m.id
                ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)] font-semibold'
                : 'bg-[var(--bg-sheet)] text-[var(--ink-secondary)] border-[var(--rule-hairline)] hover:bg-[var(--bg-recessed)]'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4 mt-4">
        <div className="font-mono text-3xl font-bold tabular-nums text-[var(--ink-primary)]">
          {formatMmSs(state.remainingSeconds)}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setState((prev) => ({ ...prev, running: !prev.running }))}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] text-xs font-semibold bg-[var(--div-standing)] text-white hover:opacity-90 cursor-pointer"
          >
            {state.running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {state.running ? 'Pause' : 'Start'}
          </button>
          <button
            type="button"
            onClick={() => setState((prev) => switchPomodoroMode(prev, prev.mode))}
            aria-label="Reset current timer"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[2px] text-xs font-medium border border-[var(--rule-hairline)] bg-[var(--bg-sheet)] text-[var(--ink-secondary)] hover:bg-[var(--bg-recessed)] cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};
