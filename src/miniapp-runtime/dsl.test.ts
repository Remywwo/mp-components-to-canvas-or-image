import { describe, expect, it } from 'vitest';
import { compileDsl } from './dsl';

describe('miniapp render DSL', () => {
  it('cascades WXSS rules into a styled render tree', () => {
    const result = compileDsl({
      wxml: `
        <view id="poster" class="card featured" style="padding: 40rpx; background-color: #ffffff;">
          <view class="body">
            <text class="title">Hello</text>
          </view>
          <image class="cover" src="https://example.com/a.png" mode="aspectFill" />
        </view>
      `,
      wxss: `
        view { color: #111111; }
        .card { width: 750rpx; padding: 24rpx; display: flex; flex-direction: column; }
        .featured .title { color: #ff0055; font-size: 48rpx; }
        #poster .title { font-weight: 700; }
        .cover { width: 100%; height: 320rpx; object-fit: cover; }
      `,
      data: {},
      viewportWidth: 375,
    });

    expect(result.tree.style).toMatchObject({
      width: 375,
      padding: 20,
      backgroundColor: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
    });
    expect(result.tree.children[0].children[0].style).toMatchObject({
      color: '#ff0055',
      fontSize: 24,
      fontWeight: 700,
    });
    expect(result.tree.children[1].style).toMatchObject({
      width: '100%',
      height: 160,
      objectFit: 'cover',
    });
  });

  it('preserves unsupported selector diagnostics in strict and loose modes', () => {
    expect(() =>
      compileDsl({
        wxml: '<view class="card"><text>hello</text></view>',
        wxss: '.card > text { color: #111111; }',
        data: {},
      }),
    ).toThrow(/Unsupported WXSS selector/);

    const loose = compileDsl({
      wxml: '<view class="card"><text>hello</text></view>',
      wxss: '.card > text { color: #111111; }',
      data: {},
      mode: 'loose',
    });

    expect(loose.warnings).toEqual(['Unsupported WXSS selector ".card > text".']);
    expect(loose.tree.children[0].style).toEqual({});
  });

  it('keeps declaration order when specificity is equal', () => {
    const result = compileDsl({
      wxml: '<view class="card primary"><text class="title">hello</text></view>',
      wxss: `
        .title { color: #111111; font-size: 24px; }
        .title { color: #333333; }
      `,
      data: {},
      viewportWidth: 375,
    });

    expect(result.tree.children[0].style).toMatchObject({
      color: '#333333',
      fontSize: 24,
    });
  });

  it('supports comma-separated selector lists', () => {
    const result = compileDsl({
      wxml: `
        <view>
          <text class="author">Codex</text>
          <text class="date">2026.07</text>
        </view>
      `,
      wxss: `
        .author,
        .date {
          font-size: 24rpx;
          color: #64748b;
        }
      `,
      data: {},
      viewportWidth: 375,
    });

    expect(result.tree.children[0].style).toMatchObject({
      fontSize: 12,
      color: '#64748b',
    });
    expect(result.tree.children[1].style).toMatchObject({
      fontSize: 12,
      color: '#64748b',
    });
    expect(result.warnings).toEqual([]);
  });
});
