export type AspectRatioCategory = '16:10' | '16:9' | 'ultrawide' | 'standard';
export type ResolutionTier = '4k' | 'wqxga' | 'qhd' | 'fhd' | 'standard';

export interface AspectRatioProfile {
  ratio: number;
  category: AspectRatioCategory;
  is16x10: boolean;
  is16x9: boolean;
  is2560x1600: boolean;
  resolutionTier: ResolutionTier;
  optimalStageHeight: number;
  optimalShellMaxWidthClass: string;
  optimalContainerClass: string;
}

/**
 * Computes the aspect ratio category and resolution profile deterministically.
 * Supports standard 16:9 (1.78), 16:10 (1.60), and detects 2560×1600 displays.
 */
export function computeAspectRatioProfile(
  viewportWidth: number,
  viewportHeight: number,
  screenWidth: number = viewportWidth,
  screenHeight: number = viewportHeight,
  devicePixelRatio: number = 1
): AspectRatioProfile {
  const safeW = Math.max(1, viewportWidth);
  const safeH = Math.max(1, viewportHeight);
  const ratio = parseFloat((safeW / safeH).toFixed(3));

  // Physical screen pixel dimensions
  const physScreenWidth = Math.round(screenWidth * devicePixelRatio);
  const physScreenHeight = Math.round(screenHeight * devicePixelRatio);

  // Exact 2560×1600 detection (WQXGA 16:10, e.g. Lenovo Legion, MacBook Pro 16", Asus Zephyrus)
  const isPhysical2560x1600 =
    (screenWidth === 2560 && screenHeight === 1600) ||
    (physScreenWidth === 2560 && physScreenHeight === 1600) ||
    (screenWidth === 1600 && screenHeight === 2560); // rotated

  // Logical viewport 2560×1600 (at 100%, 125% [2048×1280], or 150% [1707×1067] scaling)
  const isViewport2560x1600Match =
    (safeW >= 1700 && safeW <= 2600 && ratio >= 1.55 && ratio <= 1.65) ||
    (safeW === 2560 && safeH === 1600);

  const is2560x1600 = isPhysical2560x1600 || isViewport2560x1600Match;

  let category: AspectRatioCategory = 'standard';
  if (ratio >= 1.52 && ratio <= 1.68) {
    category = '16:10';
  } else if (ratio >= 1.69 && ratio <= 1.88) {
    category = '16:9';
  } else if (ratio > 1.88) {
    category = 'ultrawide';
  } else {
    category = 'standard';
  }

  // Resolution tiering
  let resolutionTier: ResolutionTier = 'standard';
  if (safeW >= 3400 || physScreenWidth >= 3800) {
    resolutionTier = '4k';
  } else if (is2560x1600 || safeW >= 2400) {
    resolutionTier = 'wqxga';
  } else if (safeW >= 2000) {
    resolutionTier = 'qhd';
  } else if (safeW >= 1500) {
    resolutionTier = 'fhd';
  }

  // 16:10 has 11% more vertical height than 16:9 at same width.
  // 2560x1600 offers expansive canvas for taller Gantt, Banker's, and Paging matrices.
  let optimalStageHeight = 520;
  if (is2560x1600 || (category === '16:10' && safeW >= 1900)) {
    optimalStageHeight = 680;
  } else if (category === '16:10') {
    optimalStageHeight = 600;
  } else if (category === '16:9' && safeW >= 1900) {
    optimalStageHeight = 580;
  }

  let optimalShellMaxWidthClass = 'max-w-[1600px]';
  let optimalContainerClass = 'max-w-7xl';

  if (is2560x1600 || safeW >= 2400) {
    optimalShellMaxWidthClass = 'max-w-[2400px]';
    optimalContainerClass = 'max-w-[2100px]';
  } else if (safeW >= 1900) {
    optimalShellMaxWidthClass = 'max-w-[1920px]';
    optimalContainerClass = 'max-w-[1750px]';
  }

  return {
    ratio,
    category,
    is16x10: category === '16:10',
    is16x9: category === '16:9',
    is2560x1600,
    resolutionTier,
    optimalStageHeight,
    optimalShellMaxWidthClass,
    optimalContainerClass,
  };
}

/**
 * Injects data attributes onto documentElement so pure CSS selectors can style
 * 16:10, 16:9, and 2560x1600 automatically without repainting.
 */
export function applyAspectRatioToDocument(profile: AspectRatioProfile): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-aspect-ratio', profile.category);
  root.setAttribute('data-is-2560x1600', profile.is2560x1600 ? 'true' : 'false');
  root.setAttribute('data-resolution-tier', profile.resolutionTier);
  root.style.setProperty('--optimal-stage-height', `${profile.optimalStageHeight}px`);
}
