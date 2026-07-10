# Generate Sharing 小程序插件

微信小程序插件入口，用于把调用方传入的 WXML/WXSS 字符串渲染成分享卡片 Canvas。

## 工程结构

仓库根目录的 `project.config.json` 是微信开发者工具插件模式项目：

- `pluginRoot`: `miniprogram-plugin/`
- `miniprogramRoot`: `miniprogram-plugin-host/`
- `compileType`: `plugin`

开发插件时请在微信开发者工具中打开仓库根目录。`miniprogram-plugin-host/` 是宿主测试小程序，页面使用 `plugin://generateSharing/share-card` 引用本插件公开组件，并通过 `requirePlugin('generateSharing')` 验证插件 JS API。

## API

```js
const plugin = requirePlugin('generateSharing');

await plugin.renderToCanvas({
  wxml: '<view class="card"><text>{{title}}</text></view>',
  wxss: '.card { width: 750rpx; padding: 48rpx; background: #fff; } text { font-size: 36rpx; }',
  data: { title: '今日分享' },
  viewportWidth: 375,
  context,
  resolveImage: async (src) => {
    const result = await wx.downloadFile({ url: src });
    return { src, drawable: result.tempFilePath };
  },
});
```

## Component

```xml
<share-card id="card" width="{{375}}" height="{{600}}" />
```

```js
const card = this.selectComponent('#card');
await card.render({
  wxml,
  wxss,
  data,
  runtime,
  resolveImage,
});

const image = await card.toTempFilePath();
```

组件默认会使用 `canvas.createImage()` 解析图片，并按实际渲染布局尺寸导出。如果调用方需要自行处理鉴权、缓存或下载，可以传入 `resolveImage` 覆盖默认图片解析逻辑。

核心 DSL runtime 位于 `src/miniapp-runtime`，执行 `npm run build:miniapp` 会打包到 `miniprogram-plugin/runtime/share-card-runtime.js`。

完整 DSL 支持范围见项目根目录 `docs/dsl-spec.md`。

插件 runtime 同时导出 `compileWxmlToHtml`，可用于 Web 调试页把 WXML/WXSS 转成 HTML DSL 进行预览。
