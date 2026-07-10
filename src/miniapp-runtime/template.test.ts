import { describe, expect, it } from 'vitest';
import { compileTemplate } from './template';

const cardWxml = `
<view class="card featured" id="poster">
  <text class="title">{{title}}</text>
  <view class="body">
    <text>{{content}}</text>
  </view>
  <image class="cover" src="{{coverUrl}}" mode="aspectFill" />
</view>
`;

const cardWxss = `
.card {
  width: 750rpx;
  min-height: 980rpx;
  padding: 64rpx 48rpx;
  background: #f8f1e7;
  border-radius: 32rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.title {
  font-size: 44rpx;
  font-weight: 700;
  line-height: 1.2;
  color: #161616;
}

.body text {
  font-size: 28rpx;
  line-height: 1.7;
  color: rgba(22, 22, 22, 0.82);
}

#poster.featured .cover {
  width: 100%;
  height: 320rpx;
  object-fit: cover;
}
`;

describe('miniapp template compiler', () => {
  it('compiles WXML and WXSS strings into a canvas-ready template model', () => {
    const result = compileTemplate({
      wxml: cardWxml,
      wxss: cardWxss,
      data: {
        title: '今日分享',
        content: '用一套受控样式集生成稳定的分享卡片。',
        coverUrl: 'https://example.com/cover.png',
      },
    });

    expect(result.warnings).toEqual([]);
    expect(result.root.tag).toBe('view');
    expect(result.root.attrs).toMatchObject({
      id: 'poster',
      class: 'card featured',
    });
    expect(result.root.children[0]).toMatchObject({
      tag: 'text',
      text: '今日分享',
    });
    expect(result.root.children[1].children[0].text).toBe('用一套受控样式集生成稳定的分享卡片。');
    expect(result.root.children[2].attrs.src).toBe('https://example.com/cover.png');
    expect(result.styles).toHaveLength(4);
    expect(result.styles[0]).toMatchObject({
      selector: '.card',
      declarations: {
        width: { value: 750, unit: 'rpx' },
        padding: [
          { value: 64, unit: 'rpx' },
          { value: 48, unit: 'rpx' },
        ],
        display: 'flex',
        flexDirection: 'column',
      },
    });
    expect(result.styles[3].selector).toBe('#poster.featured .cover');
    expect(result.styles[3].declarations.objectFit).toBe('cover');
  });

  it('reports unsupported WXML features in strict mode', () => {
    expect(() =>
      compileTemplate({
        wxml: '<view wx:for="{{items}}"><text>{{item.name}}</text></view>',
        wxss: '',
        data: { items: [] },
      }),
    ).toThrow(/Unsupported WXML attribute "wx:for"/);
  });

  it('reports unsupported WXSS declarations in strict mode', () => {
    expect(() =>
      compileTemplate({
        wxml: '<view class="card"><text>hello</text></view>',
        wxss: '.card { filter: blur(10px); display: grid; }',
        data: {},
      }),
    ).toThrow(/Unsupported WXSS property "filter"/);
  });

  it('supports overflow hidden for clipping containers', () => {
    const result = compileTemplate({
      wxml: '<view class="cover"><image src="/assets/a.png" /></view>',
      wxss: '.cover { overflow: hidden; border-radius: 10px; }',
      data: {},
    });

    expect(result.styles[0].declarations).toMatchObject({
      overflow: 'hidden',
      borderRadius: { value: 10, unit: 'px' },
    });
  });

  it('supports display block for text-like nodes', () => {
    const result = compileTemplate({
      wxml: '<view><text class="label">Label</text></view>',
      wxss: '.label { display: block; font-size: 12px; }',
      data: {},
    });

    expect(result.styles[0].declarations).toMatchObject({
      display: 'block',
      fontSize: { value: 12, unit: 'px' },
    });
  });

  it('keeps unsupported features as warnings in loose mode', () => {
    const result = compileTemplate({
      wxml: '<view bindtap="noop" class="card"><custom-node>hello</custom-node></view>',
      wxss: '.card { position: sticky; display: grid; }',
      data: {},
      mode: 'loose',
    });

    expect(result.root.tag).toBe('view');
    expect(result.root.children).toEqual([]);
    expect(result.styles[0].declarations).toEqual({});
    expect(result.warnings).toEqual([
      'Unsupported WXML attribute "bindtap" on <view>.',
      'Unsupported WXML tag <custom-node>.',
      'Unsupported WXSS value "sticky" for "position" in selector ".card".',
      'Unsupported WXSS value "grid" for "display" in selector ".card".',
    ]);
  });

  it('fails when WXML has multiple roots or malformed nesting', () => {
    expect(() =>
      compileTemplate({
        wxml: '<view></view><text></text>',
        wxss: '',
        data: {},
      }),
    ).toThrow(/exactly one root/);

    expect(() =>
      compileTemplate({
        wxml: '<view><text></view>',
        wxss: '',
        data: {},
      }),
    ).toThrow(/Mismatched closing tag/);
  });
});
