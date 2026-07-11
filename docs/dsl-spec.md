# mp-components-to-canvas-or-image DSL 规格

本文档定义 `mp-components-to-canvas-or-image` 使用的受控 WXML/WXSS 子集，以及从小程序模板转换到 Canvas 绘制命令的 DSL 流程。

目标不是完整执行小程序渲染引擎，而是定义一套可预测、可测试、可落地到 Canvas 的受控语法。调用方仍然编写接近原生的 WXML/WXSS 字符串，但只能使用本文档列出的标签、属性、选择器和样式能力。

## 处理流程

```text
WXML 字符串 + WXSS 字符串 + data
  -> 1. WXML 解析：生成模板 AST
  -> 2. 数据绑定：把 {{path}} 替换为 data 中的值
  -> 3. WXSS 解析：生成样式规则列表
  -> 4. 选择器匹配：把样式规则匹配到 AST 节点
  -> 5. 样式计算：合并默认样式、继承样式、WXSS、inline style
  -> 6. 渲染 DSL：生成带计算样式的中间节点树
  -> 7. 布局计算：生成布局盒子树
  -> 8. 资源解析：加载 image 资源并记录原始尺寸
  -> 9. 绘制命令：生成 rect/text/image 命令
  -> 10. Canvas 渲染：在小程序 Canvas 2D 上绘制
```

核心原则：

- WXML/WXSS 负责表达结构和样式。
- DSL 负责把结构和样式转换为 Canvas 可执行的数据结构。
- Canvas 只消费最终绘制命令，不再理解 WXML/WXSS。
- 严格模式下遇到不支持语法直接报错，避免生成与预期不一致的图片。

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

绑定规则：

- 只支持完整占位符或文本中的简单路径替换。
- 路径按 `.` 访问对象属性，例如 `{{user.name}}` 会读取 `data.user.name`。
- 找不到路径时，严格模式报错；宽松模式保留空字符串并记录 warning。
- 不执行 JS 表达式，不支持三元表达式、函数调用、数组下标和过滤器。

示例：

```xml
<view class="card">
  <text class="title">{{title}}</text>
  <text class="desc">作者：{{author.name}}</text>
  <image class="cover" src="{{cover}}" mode="aspectFill" />
</view>
```

```js
{
  title: '今日分享',
  author: { name: 'Alice' },
  cover: '/assets/cover.png'
}
```

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

### 选择器匹配

WXSS 会先被解析成规则列表：

```ts
type StyleRule = {
  selector: string;
  declarations: Record<string, string>;
  specificity: [number, number, number];
  order: number;
};
```

匹配规则：

- 标签选择器匹配节点标签，例如 `text` 匹配 `<text />`。
- 类选择器匹配节点 `class` 列表，例如 `.title`。
- ID 选择器匹配节点 `id`。
- 多 class 组合要求同时命中，例如 `.title.large`。
- 后代选择器从当前节点向祖先链查找，例如 `.card .title`。
- 逗号选择器会拆分成多条独立规则，例如 `.author, .date`。

样式冲突按以下优先级合并：

```text
默认样式 < 继承样式 < WXSS 低优先级规则 < WXSS 高优先级规则 < inline style
```

其中 WXSS 规则按 CSS specificity 和出现顺序排序：

- ID 数量优先级最高。
- class 数量次之。
- 标签数量最低。
- specificity 相同时，后出现的规则覆盖先出现的规则。

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

### 样式标准化

样式进入布局前会被标准化为可计算值：

```ts
type ComputedStyle = {
  width?: number | Percent;
  height?: number | Percent;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  display: 'flex' | 'block' | 'inline';
  flexDirection: 'row' | 'column';
  justifyContent: 'flex-start' | 'center' | 'flex-end' | 'space-between';
  alignItems: 'stretch' | 'flex-start' | 'center' | 'flex-end';
  color?: string;
  backgroundColor?: string;
  fontSize: number;
  fontFamily?: string;
  fontWeight?: string | number;
  fontStyle?: 'normal' | 'italic';
  lineHeight: number;
  borderRadius: number;
  objectFit?: 'cover' | 'contain' | 'fill';
};
```

标准化规则：

- `padding`、`margin` 会展开为四个方向。
- `background` 只提取纯色背景，不解析渐变和图片背景。
- `border` 类能力只使用颜色、宽度、圆角等 Canvas 可表达部分。
- 文本相关样式会从父节点继承到子文本节点。
- `%` 宽度相对父节点内容宽度计算。
- `rpx` 按当前 `viewportWidth` 换算成 px。

示例：

```css
.card {
  width: 686rpx;
  padding: 32rpx;
  background: #ffffff;
}
```

当 `viewportWidth = 343` 时：

```text
686rpx -> 313.646px
32rpx  -> 14.634px
```

## 渲染 DSL

WXML AST 和计算样式合并后，会生成渲染 DSL。DSL 是 Canvas 渲染前的核心中间结构。

```ts
type RenderNode = {
  type: 'view' | 'text' | 'image';
  id?: string;
  className?: string;
  attrs: Record<string, string>;
  text?: string;
  style: ComputedStyle;
  children: RenderNode[];
};
```

示例输入：

```xml
<view class="card">
  <text class="title">{{title}}</text>
</view>
```

```css
.card { width: 343px; padding: 24px; background: #fff; }
.title { font-size: 24px; color: #111827; }
```

```js
{ title: '今日分享' }
```

生成 DSL 的概念结构：

```js
{
  type: 'view',
  className: 'card',
  style: {
    width: 343,
    paddingTop: 24,
    paddingRight: 24,
    paddingBottom: 24,
    paddingLeft: 24,
    backgroundColor: '#fff'
  },
  children: [
    {
      type: 'text',
      className: 'title',
      text: '今日分享',
      style: {
        fontSize: 24,
        color: '#111827'
      },
      children: []
    }
  ]
}
```

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

### 布局盒子

布局阶段会把 `RenderNode` 转换成带坐标和尺寸的盒子树：

```ts
type LayoutBox = {
  node: RenderNode;
  x: number;
  y: number;
  width: number;
  height: number;
  contentX: number;
  contentY: number;
  contentWidth: number;
  contentHeight: number;
  children: LayoutBox[];
};
```

布局规则：

- 根节点从 `(0, 0)` 开始布局。
- 显式 `width` 优先；未设置时使用父级可用内容宽度。
- 显式 `height` 优先；未设置时根据子节点高度、padding、gap 自动撑开。
- `display: flex` 按 `flex-direction` 排列子节点。
- `gap` 只作用于 flex 子节点之间。
- `text` 节点会根据可用宽度做文本测量和换行估算。
- `image` 节点需要明确宽高；未能确定尺寸时在严格模式报错。

最终根盒子的 `width` 和 `height` 会作为 Canvas 真实渲染尺寸，并用于图片导出。

## Canvas 绘制命令

渲染器消费确定性的绘制命令：

- `rect`：背景矩形，可带圆角
- `text`：已经换行的文本行，包含字体和行高
- `image`：图片目标区域、资源、原始尺寸、圆角和填充模式

远程图片必须在绘制前完成解析。调用方需要提供 `resolveImage`，把 URL 转换成本地可绘制路径或图片对象。

命令结构示意：

```ts
type DrawCommand =
  | {
      type: 'rect';
      x: number;
      y: number;
      width: number;
      height: number;
      fill: string;
      radius?: number;
    }
  | {
      type: 'text';
      x: number;
      y: number;
      text: string;
      color: string;
      font: string;
      lineHeight: number;
      textAlign?: CanvasTextAlign;
    }
  | {
      type: 'image';
      x: number;
      y: number;
      width: number;
      height: number;
      src: string;
      drawable: unknown;
      mode: 'cover' | 'contain' | 'fill';
      radius?: number;
    };
```

生成顺序：

1. 先生成父节点背景命令。
2. 再生成子节点命令。
3. 文本节点按换行结果生成多条 `text` 命令。
4. 图片节点在资源解析完成后生成 `image` 命令。

Canvas 渲染器只负责消费命令：

- `rect` 调用 `fillRect` 或圆角路径填充。
- `text` 设置字体、颜色、对齐方式后调用 `fillText`。
- `image` 根据 `mode` 计算源裁剪区域和目标绘制区域，再调用 `drawImage`。

## 图片资源转换

图片节点不会直接把 `src` 交给 `drawImage`。绘制前必须转换成 Canvas 可绘制资源：

```ts
type ImageResource = {
  src: string;
  drawable: unknown;
  width?: number;
  height?: number;
};
```

组件模式默认使用小程序 Canvas 节点提供的 `canvas.createImage()`：

```js
const image = canvas.createImage();
image.onload = () => {
  resolve({
    src,
    drawable: image,
    width: image.width,
    height: image.height,
  });
};
image.src = src;
```

如果业务图片需要下载、鉴权、缓存或转换，可以传入 `resolveImage`：

```js
resolveImage: async (src) => {
  const result = await wx.downloadFile({ url: src });
  return {
    src,
    drawable: result.tempFilePath,
  };
}
```

注意：`drawImage` 最终能接受什么类型，取决于小程序 Canvas 2D 的运行环境。组件默认路径使用 `canvas.createImage()`，这是最稳妥的方式。

## 严格模式和宽松模式

`mode` 用于控制不支持语法的处理方式：

- `strict`：遇到不支持的标签、属性、选择器、样式值或缺失数据时立即抛错。
- `loose`：尽量继续转换，并把问题记录到 warnings 中。

生产生成图片建议使用 `strict`，因为静默降级会导致最终图片和预览预期不一致。

常见错误：

- `Unsupported WXML tag`
- `Unsupported WXSS selector`
- `Unsupported WXSS property`
- `Unsupported WXSS value`
- `Missing template variable`
- `Image resource resolve failed`

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

HTML 输出会转义文本和属性值，避免用户输入破坏预览结构。该能力仅用于调试，不替代小程序 Canvas 渲染管线。
