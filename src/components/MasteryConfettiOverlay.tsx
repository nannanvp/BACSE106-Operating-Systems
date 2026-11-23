import React, { useEffect } from 'react';
import { ConfettiParticle } from '../utils/confettiEngine';

interface MasteryConfettiOverlayProps {
  particles: ConfettiParticle[];
  onDone: () => void;
}

export const MasteryConfettiOverlay: React.FC<MasteryConfettiOverlayProps> = ({
  particles,
  onDone,
}) => {
  useEffect(() => {
    if (particles.length === 0) return;
    const maxDur = Math.max(...particles.map((p) => p.durationMs), 900);
    const id = window.setTimeout(onDone, maxDur + 80);
    return () => window.clearTimeout(id);
  }, [particles, onDone]);

  if (particles.length === 0) return null;

  return (
    <div aria-hidden="true" className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          className="confetti-piece rounded-[1px]"
          style={
            {
              left: `${p.x}px`,
              top: `${p.y}px`,
              width: `${p.size}px`,
              height: `${Math.max(4, Math.round(p.size * 0.65))}px`,
              backgroundColor: p.color,
              '--tx': `${p.tx}px`,
              '--ty': `${p.ty}px`,
              '--rot': `${p.rot}deg`,
              '--dur': `${p.durationMs}ms`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
};
