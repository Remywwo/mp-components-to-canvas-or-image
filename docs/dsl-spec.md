# Generate Sharing DSL 规格

本文档定义 Generate Sharing 使用的受控 WXML/WXSS 子集，用于在微信小程序 Canvas 中稳定渲染分享卡片。

## 处理流程

```text
WXML 字符串 + WXSS 字符串 + 数据
  -> 模板 AST
  -> 样式规则
  -> 带计算样式的渲染 DSL
  -> 布局盒子树
  -> Canvas 绘制命令
  -> 小程序 Canvas 渲染器
```

## 对外 API

```ts
createShareCardRenderer({
  resolveImage?: async (src) => ({ src, drawable, width, height }),
}).render({
  wxml,
  wxss,
  data,
  mode: 'strict' | 'loose',
  viewportWidth,
  context,
});
```

生产模板建议使用 `strict`。模板编辑器或调试场景可以使用 `loose`，用 warnings 收集问题而不是立即中断。

## 支持的 WXML

标签：

- `view`
- `text`
- `image`

属性：

- 通用属性：`id`、`class`、`style`
- `image`: `src`, `mode`
- `text`: `selectable`, `space`, `decode`

数据绑定：

- `{{name}}`
- `{{user.name}}`

暂不支持：

- `wx:for`, `wx:if`
- `template`, `include`, `import`
- 自定义组件
- 事件和 WXS
- 数据绑定中的任意表达式

## 支持的 WXSS

选择器：

- 标签选择器，例如 `text`
- 类选择器，例如 `.title`
- ID 选择器，例如 `#poster`
- 组合选择器，例如 `#poster.featured`
- 后代选择器，例如 `.card .title`
- 选择器列表，例如 `.author, .date`

暂不支持子选择器、兄弟选择器、伪类、伪元素、属性选择器和通配选择器。

属性：

- 盒模型：`width`、`height`、`min-width`、`min-height`、`max-width`、`max-height`
- 间距：`padding`、`padding-*`、`margin`、`margin-*`、`gap`
- 弹性布局：`display`、`flex-direction`、`justify-content`、`align-items`、`align-self`、`flex-grow`、`flex-shrink`、`flex-basis`
- 定位：`position`、`top`、`right`、`bottom`、`left`
- 绘制：`background`、`background-color`、`color`、`opacity`、`box-shadow`
- 边框：`border-radius`、`border-width`、`border-color`、`border-style`
- 文本：`font-size`、`font-family`、`font-weight`、`font-style`、`line-height`、`text-align`、`letter-spacing`
- 图片：`object-fit`

单位：

- `px`
- `rpx`
- `%`

`rpx` 按 `750rpx = viewportWidth` 换算。

## 布局模型

布局引擎面向分享卡片场景实现受控模型：

- 纵向和横向弹性布局
- `padding` 和 `gap`
- 显式宽高
- 相对父级内容宽度的百分比宽度
- 可继承文本样式
- 文本换行估算
- 图片 `cover`、`contain` 和 `fill`

它不承诺完整兼容浏览器或小程序原生布局。模板必须保持在本文档定义的子集内。

## Canvas 绘制命令

渲染器消费确定性的绘制命令：

- `rect`：背景矩形，可带圆角
- `text`：已经换行的文本行，包含字体和行高
- `image`：图片目标区域、资源、原始尺寸、圆角和填充模式

远程图片必须在绘制前完成解析。调用方需要提供 `resolveImage`，把 URL 转换成本地可绘制路径或图片对象。

## WXML 转 HTML DSL

除了 Canvas 渲染管线，运行时还提供独立的 WXML 转 HTML DSL：

```ts
const result = compileWxmlToHtml({
  wxml,
  wxss,
  data,
  mode: 'strict',
});
```

输出结构：

- `dsl.root`：HTML DSL 节点树
- `html`：可直接插入 Web 预览容器的 HTML 字符串
- `css`：由 WXSS 子集转换出的 CSS 字符串
- `warnings`：宽松模式下收集的诊断信息

标签映射：

- `view` -> `div`
- `text` -> `span`
- `image` -> `img`

属性映射：

- 保留 `id`、`class`、`style`、`src`
- `mode` 转为 `data-wxml-mode`
- 所有节点都会添加 `data-wxml-tag`
- `image` 默认补充空 `alt`

HTML 输出会转义文本和属性值，避免用户输入破坏 Web 预览结构。该能力用于 Web 预览与调试，不替代小程序 Canvas 渲染管线。

## 小程序插件

构建运行时：

```bash
npm run build:miniapp
```

插件产物：

```text
miniprogram-plugin/
  plugin.json
  api/share-card.js
  runtime/share-card-runtime.js
  components/share-card/
```

可以使用插件 API 的 `renderToCanvas`，也可以调用 `<share-card />` 组件的 `render` 方法。
