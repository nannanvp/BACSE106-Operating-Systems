export interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  rot: number;
  size: number;
  color: string;
  durationMs: number;
}

export const CONFETTI_PALETTE = [
  '#E5B82E', // M1 Chrome Yellow
  '#E06D2B', // M2 Oxide Orange
  '#4F8A3D', // M3 Grass Green
  '#147E7B', // M4 Teal
  '#22559C', // M5 Ultramarine
];

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generates deterministic compositor-only confetti particles.
 * Automatically flips vertical spray direction downward if origin is near top of viewport.
 */
export function generateConfettiParticles(
  originX: number,
  originY: number,
  seed: number,
  count = 26,
  viewportHeight = 900
): ConfettiParticle[] {
  const rng = mulberry32(seed);
  const shootDownward = originY < Math.min(200, viewportHeight * 0.28);
  const particles: ConfettiParticle[] = [];

  for (let i = 0; i < count; i += 1) {
    const spreadX = (rng() - 0.5) * 260;
    const magnitudeY = 85 + rng() * 145;
    const ty = shootDownward ? magnitudeY : -magnitudeY;
    const rot = Math.round((rng() - 0.5) * 540);
    const size = Math.round(5 + rng() * 5);
    const color = CONFETTI_PALETTE[Math.floor(rng() * CONFETTI_PALETTE.length)];
    const durationMs = Math.round(680 + rng() * 440);

    particles.push({
      id: i,
      x: Math.round(originX),
      y: Math.round(originY),
      tx: Math.round(spreadX),
      ty: Math.round(ty),
      rot,
      size,
      color,
      durationMs,
    });
  }

  return particles;
}
