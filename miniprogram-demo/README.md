# Generate Sharing 小程序 Demo

这是一个用于微信开发者工具的示例小程序，演示在小程序模式中读取真实小程序组件目录，把组件的 WXML/WXSS 转成模板字符串后渲染到 Canvas，并导出图片。

## 使用方式

1. 执行构建：

```bash
npm run build
```

2. 在微信开发者工具中导入 `miniprogram-demo` 目录。

该 demo 使用普通小程序模式，`project.config.json` 中已经配置：

```json
{
  "compileType": "miniprogram",
  "miniprogramRoot": "./"
}
```

3. 打开首页，选择一个 demo，点击“渲染卡片”和“导出图片”。

## 组件源目录

demo 的源模板不是手写对象，而是真实小程序组件目录：

```text
miniprogram-demo/components/
  share-card/
  article-card/
    index.wxml
    index.wxss
    index.js
    index.json
  profile-card/
  product-card/
  composite-card/
    index.wxml
    index.wxss
    index.js
    index.json
  card-stat/
```

其中 `composite-card` 通过 `index.json` 的 `usingComponents` 引用 `card-stat`，用于演示组件内部包含自定义组件的场景。

组件元信息和 demo 数据位于：

```text
miniprogram-demo/components/manifest.mjs
```

构建时会调用 `readMiniappComponentTree` 读取每个组件目录。遇到本地自定义组件时，会递归读取依赖、展开子组件 WXML、映射传入属性并合并 WXSS，最终生成：

```text
miniprogram-demo/templates/index.js
```

这个文件是生成产物，请不要手写修改。需要新增 demo 时，在 `components` 下新增一个组件目录，并在 `components/manifest.mjs` 中登记即可。循环组件引用和 `plugin://` 外部组件会在构建阶段报错。

示例图片资源位于：

```text
miniprogram-demo/assets/
```

## 本地组件

demo 使用本地渲染组件：

```text
miniprogram-demo/components/share-card/
```

执行 `npm run build` 会把核心运行时打包到：

```text
miniprogram-demo/runtime/share-card-runtime.js
```

同时会重新生成：

```text
miniprogram-demo/templates/index.js
```
