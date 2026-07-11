# mp-components-to-canvas-or-image

mp-components-to-canvas-or-image 是一个微信小程序 npm 包，用于把受控 WXML/WXSS/data 渲染成 Canvas 分享图片。

## 项目结构

仓库包含 npm 包源码和宿主测试小程序：

```text
.
├── package.json
├── api/share-card.js
├── assets/cover.svg
├── components/share-card
├── runtime/share-card-runtime.js
├── examples/miniprogram
│   ├── project.config.json
│   ├── app.json
│   ├── miniprogram_npm/mp-components-to-canvas-or-image
│   └── pages/index
├── src/miniapp-runtime
├── scripts/build-miniapp-runtime.mjs
└── docs/dsl-spec.md
```

关键配置：

- 根目录是 npm 包源码，不再是微信开发者工具项目。
- 小程序 demo 位于 `examples/miniprogram/`。
- demo 的 `project.config.json` 使用 `compileType: miniprogram` 和 `miniprogramRoot: ./`。

## 开发

```bash
npm install
npm run build
npm test
```

在微信开发者工具中打开 `examples/miniprogram/` 即可运行宿主测试小程序。宿主通过 `/miniprogram_npm/mp-components-to-canvas-or-image/components/share-card/share-card` 使用 npm 包组件。

## npm 包入口

npm 包源码位于仓库根目录：

```json
{
  "name": "mp-components-to-canvas-or-image",
  "main": "api/share-card.js",
  "miniprogram": "."
}
```

JS API 位于 `api/share-card.js`，组件位于 `components/share-card/`。

```js
const shareCardPackage = require('/miniprogram_npm/mp-components-to-canvas-or-image/api/share-card');

await shareCardPackage.renderToCanvas({
  wxml: '<view class="card"><text>{{title}}</text></view>',
  wxss: '.card { width: 343px; padding: 24px; background: #fff; }',
  data: { title: '今日分享' },
  viewportWidth: 343,
  context,
});
```

## 组件用法

宿主小程序通过属性触发渲染和导出，通过事件接收结果：

```json
{
  "usingComponents": {
    "share-card": "/miniprogram_npm/mp-components-to-canvas-or-image/components/share-card/share-card"
  }
}
```

```xml
<share-card
  width="{{343}}"
  height="{{520}}"
  render-options="{{renderOptions}}"
  render-key="{{renderKey}}"
  export-key="{{exportKey}}"
  bind:rendered="onRendered"
  bind:exported="onExported"
  bind:error="onError"
/>
```

`renderKey` 每次递增会触发一次渲染；`exportKey` 每次递增会触发一次图片导出。

## 运行时

核心运行时代码在 `src/miniapp-runtime`。构建命令会把运行时打包到根目录 `runtime/`，并同步到 demo 的 `miniprogram_npm`：

```bash
npm run build:npm
```

输出文件：

```text
runtime/share-card-runtime.js
examples/miniprogram/miniprogram_npm/mp-components-to-canvas-or-image/
```

## DSL 支持范围

完整 DSL 契约见 [docs/dsl-spec.md](./docs/dsl-spec.md)。

当前运行时只支持受控子集：

- WXML 标签：`view`、`text`、`image`
- 数据绑定：`{{name}}`、`{{user.name}}`
- WXSS 选择器：标签、类、ID、多 class、后代选择器、逗号选择器
- 布局：基础 Flex、尺寸、内外边距、gap、圆角、背景、文字和图片基础样式
- 图片：通过 Canvas 2D `canvas.createImage()` 加载

不支持完整小程序组件语义、事件、WXS、slot、`wx:for`、`wx:if`、复杂 CSS 布局等能力。
