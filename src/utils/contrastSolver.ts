/**
 * Contrast Solver for Acetate Division Tints (WCAG AA compliant).
 * Dynamically computes safe `--leaf-tint-alpha` so text over acetate-tinted paper
 * maintains >= target contrast ratio across both Light and OKLCH Dark stocks.
 */

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(hex: string): RgbColor {
  const clean = hex.replace('#', '').trim();
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return { r: 244, g: 239, b: 228 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function relativeLuminance({ r, g, b }: RgbColor): number {
  const linear = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

export function contrastRatio(c1: RgbColor, c2: RgbColor): number {
  const l1 = relativeLuminance(c1);
  const l2 = relativeLuminance(c2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function blendOver(fg: RgbColor, bg: RgbColor, alpha: number): RgbColor {
  const a = Math.max(0, Math.min(1, alpha));
  return {
    r: Math.round(fg.r * a + bg.r * (1 - a)),
    g: Math.round(fg.g * a + bg.g * (1 - a)),
    b: Math.round(fg.b * a + bg.b * (1 - a)),
  };
}

/**
 * Solves maximum acetate tint alpha in [minAlpha, maxAlpha] such that
 * `inkHex` achieves at least `targetRatio` contrast against `accentHex` blended onto `paperHex`.
 */
export function solveLeafAlpha(
  accentHex: string,
  paperHex: string,
  inkHex: string,
  targetRatio = 7.0,
  minAlpha = 0.08,
  maxAlpha = 0.28
): number {
  const accent = hexToRgb(accentHex);
  const paper = hexToRgb(paperHex);
  const ink = hexToRgb(inkHex);

  let best = minAlpha;
  const steps = 40;
  for (let i = 0; i <= steps; i += 1) {
    const alpha = minAlpha + ((maxAlpha - minAlpha) * i) / steps;
    const blended = blendOver(accent, paper, alpha);
    if (contrastRatio(ink, blended) >= targetRatio) {
      best = alpha;
    }
  }
  return Number(best.toFixed(3));
}
