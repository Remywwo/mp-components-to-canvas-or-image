import { describe, expect, it } from 'vitest';
import { compileLayout } from './layout';

describe('miniapp layout DSL', () => {
  it('lays out a vertical share card with padding and gap', () => {
    const result = compileLayout({
      wxml: `
        <view class="card">
          <text class="title">Hello DSL</text>
          <text class="body">This renderer keeps preview and exported image aligned.</text>
          <image class="cover" src="https://example.com/a.png" mode="aspectFill" />
        </view>
      `,
      wxss: `
        .card { width: 750rpx; padding: 40rpx 32rpx; display: flex; flex-direction: column; gap: 20rpx; background: #fff; }
        .title { font-size: 48rpx; line-height: 1.2; font-weight: 700; }
        .body { font-size: 28rpx; line-height: 1.6; }
        .cover { width: 100%; height: 300rpx; object-fit: cover; border-radius: 20rpx; }
      `,
      data: {},
      viewportWidth: 375,
    });

    expect(result.box).toMatchObject({
      x: 0,
      y: 0,
      width: 375,
      height: 283.6,
    });
    expect(result.box.children[0]).toMatchObject({
      tag: 'text',
      x: 16,
      y: 20,
      width: 343,
      height: 28.8,
    });
    expect(result.box.children[1]).toMatchObject({
      tag: 'text',
      x: 16,
      y: 58.8,
      width: 343,
      height: 44.8,
    });
    expect(result.box.children[2]).toMatchObject({
      tag: 'image',
      x: 16,
      y: 113.6,
      width: 343,
      height: 150,
    });
  });

  it('uses explicit root height and centers row children', () => {
    const result = compileLayout({
      wxml: '<view class="row"><text>A</text><text>B</text></view>',
      wxss: `
        .row { width: 300px; height: 80px; padding: 10px; display: flex; flex-direction: row; gap: 8px; align-items: center; }
        text { font-size: 20px; line-height: 1; width: 40px; }
      `,
      data: {},
      viewportWidth: 375,
    });

    expect(result.box).toMatchObject({
      width: 300,
      height: 80,
    });
    expect(result.box.children[0]).toMatchObject({
      x: 10,
      y: 30,
      width: 40,
      height: 20,
    });
    expect(result.box.children[1]).toMatchObject({
      x: 58,
      y: 30,
      width: 40,
      height: 20,
    });
  });
});
