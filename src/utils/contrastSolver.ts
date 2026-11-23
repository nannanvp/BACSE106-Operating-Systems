/**
 * Contrast Solver for Acetate Division Tints (WCAG AAA compliant >= 9.5:1).
 * Dynamically computes safe `--leaf-tint-alpha` / `--leaf-alpha` so text over acetate-tinted paper
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
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
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
 * 12-iteration binary search solveLeafAlpha contrast solver for WCAG AAA (>=9.5:1).
 * Solves maximum acetate tint alpha in [minAlpha, maxAlpha] such that
 * `inkHex` achieves at least `targetRatio` contrast against `accentHex` blended onto `paperHex`.
 */
export function solveLeafAlpha(
  accentHex: string,
  paperHex: string = '#F4EFE4',
  inkHex: string = '#1C1B18',
  targetRatio: number = 9.5,
  minAlpha: number = 0.08,
  maxAlpha: number = 0.28
): number {
  const accent = hexToRgb(accentHex);
  const paper = hexToRgb(paperHex);
  const ink = hexToRgb(inkHex);

  const crMin = contrastRatio(ink, blendOver(accent, paper, minAlpha));
  const crMax = contrastRatio(ink, blendOver(accent, paper, maxAlpha));

  // If contrast decreases as alpha increases (typical when blending colored accent over light paper against dark ink)
  if (crMin >= crMax) {
    if (crMin < targetRatio) return minAlpha;
    if (crMax >= targetRatio) return maxAlpha;

    let low = minAlpha;
    let high = maxAlpha;

    for (let step = 0; step < 12; step++) {
      const mid = (low + high) / 2;
      const blended = blendOver(accent, paper, mid);
      if (contrastRatio(ink, blended) >= targetRatio) {
        low = mid;
      } else {
        high = mid;
      }
    }
    return Number(low.toFixed(3));
  } else {
    // If contrast increases as alpha increases
    if (crMax < targetRatio) return minAlpha;
    if (crMin >= targetRatio) return maxAlpha;

    let low = minAlpha;
    let high = maxAlpha;

    for (let step = 0; step < 12; step++) {
      const mid = (low + high) / 2;
      const blended = blendOver(accent, paper, mid);
      if (contrastRatio(ink, blended) >= targetRatio) {
        high = mid;
      } else {
        low = mid;
      }
    }
    return Number(high.toFixed(3));
  }
}
