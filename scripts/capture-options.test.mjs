import { describe, expect, it } from 'vitest';
import { parseCaptureOptions, parseClip } from './capture-options.mjs';

describe('capture options', () => {
  it('uses desktop web defaults', () => {
    const options = parseCaptureOptions([]);

    expect(options.mode).toBe('web');
    expect(options.viewportWidth).toBe('1440');
    expect(options.selector).toBe('[data-capture-target="share-card"]');
  });

  it('applies miniapp device preset', () => {
    const options = parseCaptureOptions(['--device', 'miniapp']);

    expect(options.viewportWidth).toBe('375');
    expect(options.viewportHeight).toBe('812');
    expect(options.isMobile).toBe('true');
  });

  it('allows explicit viewport to override device preset', () => {
    const options = parseCaptureOptions(['--device', 'mobile', '--width', '430', '--height', '932']);

    expect(options.viewportWidth).toBe('430');
    expect(options.viewportHeight).toBe('932');
  });

  it('parses clip rectangles', () => {
    expect(parseClip('10,20,300,400')).toEqual({ x: 10, y: 20, width: 300, height: 400 });
  });
});
