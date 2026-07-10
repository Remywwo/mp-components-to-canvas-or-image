import { describe, expect, it } from 'vitest';
import { createShareCardRenderer } from './runtime';

describe('share card runtime facade', () => {
  it('compiles, resolves resources, and optionally renders in one call', async () => {
    const calls: unknown[][] = [];
    const context = {
      beginPath: () => calls.push(['beginPath']),
      moveTo: (...args: number[]) => calls.push(['moveTo', ...args]),
      lineTo: (...args: number[]) => calls.push(['lineTo', ...args]),
      quadraticCurveTo: (...args: number[]) => calls.push(['quadraticCurveTo', ...args]),
      closePath: () => calls.push(['closePath']),
      fill: () => calls.push(['fill']),
      fillText: (...args: unknown[]) => calls.push(['fillText', ...args]),
      drawImage: (...args: unknown[]) => calls.push(['drawImage', ...args]),
      save: () => calls.push(['save']),
      restore: () => calls.push(['restore']),
      clip: () => calls.push(['clip']),
      setFillStyle: (value: string) => calls.push(['setFillStyle', value]),
      setFontSize: (value: number) => calls.push(['setFontSize', value]),
      setTextAlign: (value: string) => calls.push(['setTextAlign', value]),
      setTextBaseline: (value: string) => calls.push(['setTextBaseline', value]),
    };
    const renderer = createShareCardRenderer({
      resolveImage: async (src) => ({ src, drawable: `/tmp/${src.split('/').pop()}` }),
    });

    const result = await renderer.render({
      wxml: '<view class="card"><text>{{title}}</text><image src="{{cover}}" mode="aspectFill" /></view>',
      wxss: `
        .card { width: 750rpx; padding: 20rpx; display: flex; flex-direction: column; gap: 10rpx; background: #fff; }
        text { font-size: 32rpx; color: #111; }
        image { width: 100%; height: 200rpx; }
      `,
      data: { title: 'Hello', cover: 'https://example.com/a.png' },
      viewportWidth: 375,
      context,
    });

    expect(result.commands.some((command) => command.type === 'image' && command.src === '/tmp/a.png')).toBe(true);
    expect(result.resources).toEqual([{ kind: 'image', src: 'https://example.com/a.png', drawable: '/tmp/a.png' }]);
    expect(calls).toContainEqual(['drawImage', '/tmp/a.png', 10, 34.2, 355, 100]);
  });

  it('can compile commands without a resource resolver or canvas context', async () => {
    const renderer = createShareCardRenderer();
    const result = await renderer.render({
      wxml: '<text>Hello</text>',
      wxss: 'text { font-size: 20px; color: #222; }',
      data: {},
    });

    expect(result.commands).toHaveLength(1);
    expect(result.resources).toEqual([]);
    expect(result.warnings).toEqual([]);
  });
});
