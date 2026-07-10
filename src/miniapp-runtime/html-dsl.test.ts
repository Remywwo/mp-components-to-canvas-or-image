import { describe, expect, it } from 'vitest';
import { compileWxmlToHtml } from './html-dsl';

describe('wxml to html dsl', () => {
  it('converts supported WXML tags and WXSS into HTML output', () => {
    const result = compileWxmlToHtml({
      wxml: `
        <view id="poster" class="card">
          <text class="title">{{title}}</text>
          <image class="cover" src="{{cover}}" mode="aspectFill" />
        </view>
      `,
      wxss: `
        .card { width: 750rpx; display: flex; flex-direction: column; }
        .title { font-size: 44rpx; color: #111; }
        .cover { width: 100%; height: 320rpx; object-fit: cover; }
      `,
      data: {
        title: '今日 <分享>',
        cover: 'https://example.com/a.png',
      },
    });

    expect(result.dsl.root).toMatchObject({
      tag: 'div',
      attrs: {
        id: 'poster',
        class: 'card',
        'data-wxml-tag': 'view',
      },
    });
    expect(result.dsl.root.children[0]).toMatchObject({
      tag: 'span',
      text: '今日 <分享>',
      attrs: {
        class: 'title',
        'data-wxml-tag': 'text',
      },
    });
    expect(result.dsl.root.children[1]).toMatchObject({
      tag: 'img',
      attrs: {
        class: 'cover',
        src: 'https://example.com/a.png',
        alt: '',
        'data-wxml-tag': 'image',
        'data-wxml-mode': 'aspectFill',
      },
    });
    expect(result.html).toBe(
      '<div id="poster" class="card" data-wxml-tag="view"><span class="title" data-wxml-tag="text">今日 &lt;分享&gt;</span><img class="cover" src="https://example.com/a.png" alt="" data-wxml-tag="image" data-wxml-mode="aspectFill" /></div>',
    );
    expect(result.css).toContain('.card {');
    expect(result.css).toContain('width: 750rpx;');
    expect(result.css).toContain('object-fit: cover;');
    expect(result.warnings).toEqual([]);
  });

  it('maps inline styles and escapes attribute values', () => {
    const result = compileWxmlToHtml({
      wxml: '<view class="a&quot;b" style="color: #111;"><text>Tom & Jerry</text></view>',
      wxss: '',
      data: {},
    });

    expect(result.html).toBe(
      '<div class="a&amp;quot;b" style="color: #111;" data-wxml-tag="view"><span data-wxml-tag="text">Tom &amp; Jerry</span></div>',
    );
  });

  it('keeps strict and loose diagnostics from the template compiler', () => {
    expect(() =>
      compileWxmlToHtml({
        wxml: '<view bindtap="noop"><text>Hello</text></view>',
        wxss: '',
        data: {},
      }),
    ).toThrow(/Unsupported WXML attribute "bindtap"/);

    const loose = compileWxmlToHtml({
      wxml: '<view bindtap="noop"><custom>Hello</custom><text>World</text></view>',
      wxss: '',
      data: {},
      mode: 'loose',
    });

    expect(loose.html).toBe('<div data-wxml-tag="view"><span data-wxml-tag="text">World</span></div>');
    expect(loose.warnings).toEqual([
      'Unsupported WXML attribute "bindtap" on <view>.',
      'Unsupported WXML tag <custom>.',
    ]);
  });
});
