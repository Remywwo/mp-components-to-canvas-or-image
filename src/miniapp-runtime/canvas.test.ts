import { describe, expect, it } from 'vitest';
import { compileCanvasCommands } from './canvas';

describe('miniapp canvas command DSL', () => {
  it('turns a laid out template into deterministic canvas commands', () => {
    const result = compileCanvasCommands({
      wxml: `
        <view class="card">
          <text class="title">Hello</text>
          <image class="cover" src="https://example.com/a.png" mode="aspectFill" />
        </view>
      `,
      wxss: `
        .card { width: 750rpx; padding: 32rpx; display: flex; flex-direction: column; gap: 16rpx; background: #ffffff; border-radius: 24rpx; }
        .title { font-size: 40rpx; line-height: 1.2; color: #111111; font-weight: 700; }
        .cover { width: 100%; height: 240rpx; object-fit: cover; border-radius: 16rpx; }
      `,
      data: {},
      viewportWidth: 375,
    });

    expect(result.commands).toEqual([
      {
        type: 'rect',
        x: 0,
        y: 0,
        width: 375,
        height: 184,
        fill: '#ffffff',
        radius: 12,
      },
      {
        type: 'text',
        text: 'Hello',
        lines: ['Hello'],
        x: 16,
        y: 16,
        width: 343,
        height: 24,
        color: '#111111',
        fontSize: 20,
        fontWeight: 700,
        lineHeight: 24,
        fontFamily: 'sans-serif',
        textAlign: 'left',
      },
      {
        type: 'image',
        src: 'https://example.com/a.png',
        x: 16,
        y: 48,
        width: 343,
        height: 120,
        objectFit: 'cover',
        radius: 8,
      },
    ]);
  });

  it('precomputes wrapped text lines for the renderer', () => {
    const result = compileCanvasCommands({
      wxml: '<text class="body">abcdefghij</text>',
      wxss: '.body { width: 50px; font-size: 10px; line-height: 1.2; }',
      data: {},
      viewportWidth: 375,
    });

    expect(result.commands[0]).toMatchObject({
      type: 'text',
      lines: ['abcdefgh', 'ij'],
      height: 24,
      lineHeight: 12,
    });
  });

  it('wraps CJK text by full-width character estimates', () => {
    const result = compileCanvasCommands({
      wxml: '<text class="body">包含封面图标签标题说明</text>',
      wxss: '.body { width: 100px; font-size: 20px; line-height: 1.2; }',
      data: {},
      viewportWidth: 375,
    });

    expect(result.commands[0]).toMatchObject({
      type: 'text',
      lines: ['包含封面图', '标签标题说', '明'],
      height: 72,
      lineHeight: 24,
    });
  });

  it('uses image mode as object-fit fallback', () => {
    const result = compileCanvasCommands({
      wxml: '<image src="/a.png" mode="aspectFit" />',
      wxss: 'image { width: 200px; height: 100px; }',
      data: {},
    });

    expect(result.commands[0]).toMatchObject({
      type: 'image',
      objectFit: 'contain',
    });
  });
});
