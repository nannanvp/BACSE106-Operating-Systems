import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeAspectRatioProfile } from './aspectRatioEngine';

describe('Aspect Ratio & 2560x1600 Resolution Engine', () => {
  it('correctly detects native 2560x1600 as 16:10 and WQXGA tier', () => {
    const profile = computeAspectRatioProfile(2560, 1600, 2560, 1600, 1);
    assert.strictEqual(profile.category, '16:10');
    assert.strictEqual(profile.is16x10, true);
    assert.strictEqual(profile.is16x9, false);
    assert.strictEqual(profile.is2560x1600, true);
    assert.strictEqual(profile.resolutionTier, 'wqxga');
    assert.strictEqual(profile.ratio, 1.6);
    assert.strictEqual(profile.optimalStageHeight, 680);
    assert.strictEqual(profile.optimalShellMaxWidthClass, 'max-w-[2400px]');
  });

  it('correctly detects 2560x1600 display at 125% scaling (2048x1280)', () => {
    const profile = computeAspectRatioProfile(2048, 1280, 2048, 1280, 1.25);
    assert.strictEqual(profile.category, '16:10');
    assert.strictEqual(profile.is16x10, true);
    assert.strictEqual(profile.is2560x1600, true);
    assert.strictEqual(profile.optimalStageHeight, 680);
  });

  it('correctly detects standard 1920x1080 as 16:9', () => {
    const profile = computeAspectRatioProfile(1920, 1080);
    assert.strictEqual(profile.category, '16:9');
    assert.strictEqual(profile.is16x9, true);
    assert.strictEqual(profile.is16x10, false);
    assert.strictEqual(profile.is2560x1600, false);
    assert.strictEqual(profile.optimalStageHeight, 580);
  });

  it('correctly detects 2560x1440 (QHD) as 16:9', () => {
    const profile = computeAspectRatioProfile(2560, 1440);
    assert.strictEqual(profile.category, '16:9');
    assert.strictEqual(profile.is16x9, true);
    assert.strictEqual(profile.is2560x1600, false);
    assert.strictEqual(profile.resolutionTier, 'wqxga');
  });

  it('handles ultrawide ratios (e.g. 3440x1440)', () => {
    const profile = computeAspectRatioProfile(3440, 1440);
    assert.strictEqual(profile.category, 'ultrawide');
    assert.strictEqual(profile.is16x10, false);
    assert.strictEqual(profile.is16x9, false);
  });
});
