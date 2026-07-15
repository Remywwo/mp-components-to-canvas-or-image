# mp-components-to-canvas-or-image

微信小程序 npm 包：把受控 WXML/WXSS/data 渲染到 Canvas，并可通过组件导出为图片临时文件。

## 安装

```bash
npm install mp-components-to-canvas-or-image
```

安装后，在微信开发者工具中执行“工具 -> 构建 npm”。构建完成后，小程序会生成：

```text
miniprogram_npm/mp-components-to-canvas-or-image/
```

## 组件 API

组件方式适合业务页面直接生成分享图。它内部会完成 Canvas 节点挂载、渲染、图片加载和导出。

在页面或全局配置中注册组件：

```json
{
  "usingComponents": {
    "share-card": "/miniprogram_npm/mp-components-to-canvas-or-image/components/share-card/share-card"
  }
}
```

页面 WXML：

```xml
<share-card
  width="{{343}}"
  height="{{520}}"
  render-options="{{renderOptions}}"
  render-key="{{renderKey}}"
  export-key="{{exportKey}}"
  bind:ready="onReady"
  bind:rendered="onRendered"
  bind:exported="onExported"
  bind:error="onError"
/>
```

页面 JS：

```js
Page({
  data: {
    renderOptions: null,
    renderKey: 0,
    exportKey: 0,
    imagePath: '',
  },

  renderCard() {
    this.setData({
      renderOptions: {
        wxml: '<view class="card"><text class="title">{{title}}</text></view>',
        wxss: '.card { width: 343px; padding: 24px; background: #fff; border-radius: 12px; } .title { color: #111827; font-size: 24px; font-weight: 700; }',
        data: { title: '今日分享' },
        mode: 'strict',
        viewportWidth: 343,
      },
      renderKey: this.data.renderKey + 1,
    });
  },

  exportCard() {
    this.setData({
      exportKey: this.data.exportKey + 1,
    });
  },

  onReady(event) {
    console.log('组件已挂载', event.detail);
  },

  onRendered(event) {
    console.log('渲染完成', event.detail.box);
  },

  onExported(event) {
    this.setData({
      imagePath: event.detail.tempFilePath,
    });
  },

  onError(event) {
    wx.showToast({
      title: event.detail.message,
      icon: 'none',
    });
  },
});
```

组件属性：

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `width` | `Number` | `375` | 初始 Canvas 宽度，单位 px。 |
| `height` | `Number` | `600` | 初始 Canvas 高度，单位 px。 |
| `render-options` | `Object` | `null` | 渲染参数。 |
| `render-key` | `Number` | `0` | 每次递增都会触发一次渲染。 |
| `export-key` | `Number` | `0` | 每次递增都会触发一次图片导出。 |

组件事件：

| 事件 | 说明 |
| --- | --- |
| `bind:ready` | 组件挂载完成。 |
| `bind:rendered` | Canvas 渲染完成，返回布局结果。 |
| `bind:exported` | 图片导出完成，返回 `tempFilePath`。 |
| `bind:error` | 渲染或导出失败，返回 `{ message }`。 |

`render-options` 参数：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `wxml` | `String` | 是 | 受控 WXML 字符串。 |
| `wxss` | `String` | 否 | 受控 WXSS 字符串。 |
| `data` | `Object` | 否 | 模板变量数据，支持 `{{name}}`、`{{user.name}}`。 |
| `mode` | `String` | 否 | `strict` 表示严格模式。 |
| `viewportWidth` | `Number` | 否 | 布局视口宽度。 |
| `resolveImage` | `Function` | 否 | 自定义图片解析函数。 |

组件导出图片时内部使用微信小程序 API：

```js
wx.canvasToTempFilePath({
  canvas,
  width,
  height,
  destWidth,
  destHeight,
  fileType: 'png',
  quality: 1,
});
```

## JS API

JS API 只负责渲染到 Canvas，不负责导出图片。适合你已经自己管理 Canvas 2D context 的场景。

```js
const shareCardPackage = require('/miniprogram_npm/mp-components-to-canvas-or-image/api/share-card');

await shareCardPackage.renderToCanvas({
  wxml: '<view class="card"><text>{{title}}</text></view>',
  wxss: '.card { width: 343px; padding: 24px; background: #fff; } text { font-size: 24px; }',
  data: { title: '今日分享' },
  viewportWidth: 343,
  context,
  resolveImage,
});
```

也可以复用 renderer：

```js
const renderer = shareCardPackage.createShareCardRenderer({
  resolveImage,
});

const result = await renderer.render({
  wxml,
  wxss,
  data,
  viewportWidth: 343,
  context,
});
```

## 支持范围

具体可查看 [docs/dsl-spec.md](./docs/dsl-spec.md) 文档。
