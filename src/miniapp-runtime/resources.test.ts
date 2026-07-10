import { describe, expect, it } from 'vitest';
import { resolveCanvasResources } from './resources';
import type { CanvasCommand } from './canvas';

const commands: CanvasCommand[] = [
  { type: 'rect', x: 0, y: 0, width: 100, height: 100, fill: '#fff', radius: 0 },
  {
    type: 'image',
    src: 'https://example.com/a.png',
    x: 0,
    y: 0,
    width: 100,
    height: 80,
    objectFit: 'cover',
    radius: 0,
  },
  {
    type: 'image',
    src: '/local/b.png',
    x: 0,
    y: 80,
    width: 100,
    height: 80,
    objectFit: 'contain',
    radius: 0,
  },
];

describe('miniapp canvas resources', () => {
  it('resolves image command sources through an injected resolver', async () => {
    const result = await resolveCanvasResources(commands, {
      resolveImage: async (src) => ({
        src,
        drawable: src.startsWith('https://') ? `/tmp/${src.split('/').pop()}` : src,
        width: 1200,
        height: 800,
      }),
    });

    expect(result.resources).toEqual([
      {
        kind: 'image',
        src: 'https://example.com/a.png',
        drawable: '/tmp/a.png',
        width: 1200,
        height: 800,
      },
      {
        kind: 'image',
        src: '/local/b.png',
        drawable: '/local/b.png',
        width: 1200,
        height: 800,
      },
    ]);
    expect(result.commands[1]).toMatchObject({
      type: 'image',
      src: '/tmp/a.png',
      source: 'https://example.com/a.png',
      intrinsicWidth: 1200,
      intrinsicHeight: 800,
    });
    expect(result.warnings).toEqual([]);
  });

  it('deduplicates repeated image urls', async () => {
    let callCount = 0;
    const result = await resolveCanvasResources([commands[1], commands[1]], {
      resolveImage: async (src) => {
        callCount += 1;
        return { src, drawable: '/tmp/a.png' };
      },
    });

    expect(callCount).toBe(1);
    expect(result.commands).toHaveLength(2);
    expect(result.commands[0]).toMatchObject({ src: '/tmp/a.png' });
    expect(result.commands[1]).toMatchObject({ src: '/tmp/a.png' });
  });

  it('throws in strict mode and warns in loose mode when a resource cannot resolve', async () => {
    await expect(
      resolveCanvasResources([commands[1]], {
        resolveImage: async () => {
          throw new Error('download failed');
        },
      }),
    ).rejects.toThrow(/Failed to resolve image "https:\/\/example.com\/a.png"/);

    const loose = await resolveCanvasResources([commands[1]], {
      mode: 'loose',
      resolveImage: async () => {
        throw new Error('download failed');
      },
    });

    expect(loose.commands[0]).toMatchObject(commands[1]);
    expect(loose.resources).toEqual([]);
    expect(loose.warnings).toEqual(['Failed to resolve image "https://example.com/a.png": download failed']);
  });
});
