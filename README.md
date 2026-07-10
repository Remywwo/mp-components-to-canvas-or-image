# Generate Sharing

Generate Sharing 是一个面向微信小程序插件的分享卡片生成运行时，用于把受控 WXML/WXSS 模板渲染为小程序 Canvas 分享图片。

## 功能

- 小程序模板运行时：将 WXML/WXSS 字符串编译为 Canvas 渲染器可消费的模板模型
- 小程序插件：在微信小程序中把 WXML/WXSS/data 渲染到 Canvas
- 小程序 demo：直接读取 `miniprogram-demo/components` 下的真实组件目录生成 demo 模板
- CLI 截图工具：独立调试工具，可对指定页面区域截图

## 技术栈

- TypeScript
- Playwright
- Vitest

## 快速开始

```bash
npm install
npm run build
```

微信开发者工具中打开仓库根目录可运行真实插件模式工程；打开 `miniprogram-demo/` 可运行普通小程序 demo。

## 验证

```bash
npm run test
npm run build
```

## 小程序模板运行时

目标平台是微信小程序插件。由于小程序运行时不能像 Web 一样选中任意 DOM 并直接截图，也无法让 Canvas 完美还原完整 WXML/WXSS，本项目采用受控子集方案：

1. 调用方传入 WXML 字符串、WXSS 字符串和数据。
2. 运行时解析 WXML/WXSS，并对不支持的标签、属性、样式做诊断。
3. 输出稳定的模板模型，后续由小程序 Canvas 渲染器按同一套模型绘制图片。

当前已实现完整 DSL 管线：

```text
WXML/WXSS 字符串
  -> 模板 AST + 样式规则
  -> 带计算样式的渲染 DSL
  -> 布局盒子树
  -> Canvas 绘制命令
  -> 小程序 Canvas 渲染适配器
```

```ts
import { compileCanvasCommands, renderCanvasCommands } from './src/miniapp-runtime';

const result = compileCanvasCommands({
  wxml: `
    <view class="card">
      <text class="title">{{title}}</text>
      <image class="cover" src="{{coverUrl}}" mode="aspectFill" />
    </view>
  `,
  wxss: `
    .card { width: 750rpx; padding: 48rpx; display: flex; flex-direction: column; }
    .title { font-size: 44rpx; font-weight: 700; color: #161616; }
    .cover { width: 100%; height: 320rpx; object-fit: cover; }
  `,
  data: {
    title: '今日分享',
    coverUrl: 'https://example.com/cover.png',
  },
  mode: 'strict',
  viewportWidth: 375,
});

renderCanvasCommands(canvasContext, result.commands);
```

### 当前支持范围

- WXML 标签：`view`、`text`、`image`
- WXML 属性：`id`、`class`、`style`、`src`、`mode` 以及少量 `text` 基础属性
- 数据绑定：`{{name}}`、`{{user.name}}`
- WXSS 选择器：标签、类、ID、多 class、后代选择器
- WXSS 属性：尺寸、内外边距、Flex 基础属性、定位、背景、颜色、透明度、边框、圆角、阴影、文字基础样式、图片 `object-fit`
- 单位：`px`、`rpx`、`%`
- 布局：纵向/横向 Flex、padding、gap、固定宽高、文本高度估算
- Canvas 命令：背景矩形、圆角、文本、图片
- 诊断模式：`strict` 遇到不支持能力直接抛错，`loose` 输出 warnings 并跳过不支持内容

### 暂不支持

- `wx:for`、`wx:if`、`template`、`include`、`import`
- 运行时直接传入的自定义组件标签、事件、WXS、复杂表达式
- 完整 CSS 布局能力，如 `grid`、`float`、`table`、`filter`
- 小程序原生 WXML 编译器能力
- 复杂文本排版，如富文本、逐字换行测量、自动省略号
- 图片资源下载和域名校验，调用方需要先把远程图片转换为可绘制资源

完整 DSL 契约见 [docs/dsl-spec.md](./docs/dsl-spec.md)。

### 小程序插件构建

```bash
npm run build:miniapp
```

构建产物会写入 `miniprogram-plugin/runtime/share-card-runtime.js`，插件 API 位于 `miniprogram-plugin/api/share-card.js`。

### 微信插件模式工程

仓库根目录已经按微信小程序插件模式配置：

- `project.config.json`：微信开发者工具项目配置，`compileType` 为 `plugin`
- `miniprogram-plugin/`：插件源码目录，对应 `pluginRoot`
- `miniprogram-plugin-host/`：宿主测试小程序，对应 `miniprogramRoot`
- `miniprogram-plugin/plugin.json`：插件公开 API 和公开组件声明

在微信开发者工具中打开仓库根目录，即可用“插件模式”运行宿主测试小程序。宿主页面通过下面的真实插件引用使用组件：

```json
{
  "usingComponents": {
    "share-card": "plugin://generateSharing/share-card"
  }
}
```

宿主 `app.json` 中的插件版本为 `dev`，只适用于插件模式开发调试。普通小程序模式不能使用 `version: "dev"`；如果要以普通小程序方式查看 demo，请打开 `miniprogram-demo/` 目录。

插件组件默认会使用当前 Canvas 节点的 `canvas.createImage()` 解析图片资源，并按运行时计算出的实际布局高度调整 Canvas 和导出尺寸。调用方仍需保证远程图片满足小程序下载域名和 Canvas 绘制要求。

### WXML 转 HTML DSL

如果需要在 Web 侧预览同一份模板，可以使用独立的 HTML DSL：

```ts
import { compileWxmlToHtml } from './src/miniapp-runtime';

const result = compileWxmlToHtml({ wxml, wxss, data });

previewRoot.innerHTML = result.html;
styleElement.textContent = result.css;
```

该能力复用同一套 WXML/WXSS 支持范围，会把 `view`、`text`、`image` 分别映射为 `div`、`span`、`img`。

### 读取 WXML/WXSS 文件

本地工具方法可以把 `.wxml` 和 `.wxss` 文件读取为字符串，方便传入 Canvas DSL 或 HTML DSL：

```js
import { readTemplateFiles } from './scripts/template-files.mjs';

const { wxml, wxss } = await readTemplateFiles({
  wxmlPath: './templates/card.wxml',
  wxssPath: './templates/card.wxss',
});
```

也可以直接使用命令行输出 JSON：

```bash
npm run template:read -- --wxml ./templates/card.wxml --wxss ./templates/card.wxss
```

如果输入是小程序组件目录，默认会读取 `index.wxml`、`index.wxss`、`index.js`、`index.json`：

```js
import { readMiniappComponentDirectory } from './scripts/template-files.mjs';

const component = await readMiniappComponentDirectory({
  dir: './components/share-card',
});
```

命令行：

```bash
npm run template:read -- --dir ./components/share-card
```

如果组件入口不是 `index`，可以指定入口名前缀：

```bash
npm run template:read -- --dir ./components/avatar --entry avatar
```

### 读取包含自定义组件的目录

构建工具支持读取组件 `index.json` 中的 `usingComponents`，递归展开本地自定义组件：

```js
import { readMiniappComponentTree } from './scripts/template-files.mjs';

const component = await readMiniappComponentTree({
  dir: './miniprogram-demo/components/composite-card',
  projectRoot: './miniprogram-demo',
});

// component.wxml 已展开自定义组件标签
// component.wxss 已合并父、子组件样式
```

属性传值支持静态字符串和简单数据绑定，例如 `label="作者"`、`value="{{author}}"`。当前仅在构建阶段展开本地路径组件，不支持 `plugin://` 组件、slot、组件生命周期行为或完整的小程序组件语义。

## CLI 截图

CLI 使用 Playwright 的真实浏览器渲染截图，支持 Web、小程序调试页面、Electron/客户端 WebView 调试页面，以及本地 HTML 文件。

### 小程序或移动端页面

如果目标能通过浏览器或开发者工具页面打开，可以使用移动端预设：

```bash
npm run capture -- --url http://127.0.0.1:5173/ --device miniapp --selector '[data-capture-target="share-card"]'
```

如果目标区域没有稳定 DOM 选择器，可以用坐标区域截图：

```bash
npm run capture -- --device miniapp --clip 0,0,375,812 --output exports/miniapp-card.png
```

### 客户端或 WebView

Electron、桌面客户端或移动端 WebView 如果开放了 Chromium 远程调试端口，可以连接已有页面截图：

```bash
npm run capture -- --mode cdp --cdp http://127.0.0.1:9222 --selector '[data-capture-target="share-card"]'
```

可用参数：

- `--mode`：截图模式，支持 `web`、`file`、`cdp`，默认 `web`
- `--url`：页面地址，默认 `http://127.0.0.1:5173/`
- `--selector`：需要截图的 DOM 选择器，默认 `[data-capture-target="share-card"]`
- `--clip`：按坐标截图，格式 `x,y,width,height`，适合无 DOM 选择器的画布、WebView、小程序场景
- `--output`：输出图片路径，默认 `exports/share-card.png`
- `--device`：设备预设，支持 `desktop`、`mobile`、`miniapp`、`tablet`
- `--width`：浏览器视口宽度，默认 `1440`
- `--height`：浏览器视口高度，默认 `1400`
- `--cdp`：CDP 调试地址，仅 `--mode cdp` 使用
- `--file`：本地 HTML 文件路径，仅 `--mode file` 使用

## 目录结构

```text
.
├── src
│   └── miniapp-runtime
├── scripts
│   ├── build-miniapp-demo-templates.mjs
│   ├── build-miniapp-runtime.mjs
│   ├── capture-element.mjs
│   └── template-files.mjs
├── miniprogram-demo
├── miniprogram-plugin-host
├── miniprogram-plugin
├── project.config.json
├── package.json
├── tsconfig.json
└── README.md
```
