// 此文件由 scripts/build-miniapp-demo-templates.mjs 生成，请勿手写修改。
const articleCard = {
  "id": "article",
  "name": "文章摘要卡",
  "data": {
    "eyebrow": "GENERATE SHARING",
    "title": "用 WXML/WXSS 生成分享卡片",
    "body": "这个 demo 在小程序中读取真实组件目录，通过 API 转成模板字符串，再由 DSL 渲染到 Canvas。",
    "author": "Codex",
    "date": "2026.07"
  },
  "generatedFrom": {
    "dir": "miniprogram-demo/components/article-card",
    "entry": "index",
    "files": {
      "wxml": "miniprogram-demo/components/article-card/index.wxml",
      "wxss": "miniprogram-demo/components/article-card/index.wxss",
      "js": "miniprogram-demo/components/article-card/index.js",
      "json": "miniprogram-demo/components/article-card/index.json"
    },
    "components": []
  },
  "generatedComponents": [],
  "wxml": "<view class=\"card article-card\">\n  <text class=\"eyebrow\">{{eyebrow}}</text>\n  <text class=\"title\">{{title}}</text>\n  <text class=\"body\">{{body}}</text>\n  <view class=\"footer\">\n    <text class=\"author\">{{author}}</text>\n    <text class=\"date\">{{date}}</text>\n  </view>\n</view>",
  "wxss": ".card {\n  width: 750rpx;\n  padding: 64rpx 52rpx;\n  display: flex;\n  flex-direction: column;\n  gap: 28rpx;\n  background: #ffffff;\n  border-radius: 32rpx;\n}\n\n.eyebrow {\n  font-size: 24rpx;\n  line-height: 1.2;\n  color: #64748b;\n  font-weight: 700;\n}\n\n.title {\n  font-size: 56rpx;\n  line-height: 1.18;\n  color: #111827;\n  font-weight: 700;\n}\n\n.body {\n  font-size: 30rpx;\n  line-height: 1.7;\n  color: #334155;\n}\n\n.footer {\n  display: flex;\n  flex-direction: row;\n  align-items: center;\n  gap: 24rpx;\n}\n\n.author,\n.date {\n  font-size: 24rpx;\n  line-height: 1.2;\n  color: #64748b;\n}",
  "js": "Component({\n  options: {\n    styleIsolation: 'isolated',\n  },\n  properties: {\n    eyebrow: String,\n    title: String,\n    body: String,\n    author: String,\n    date: String,\n  },\n});",
  "json": "{\n  \"component\": true\n}"
};

const profileCard = {
  "id": "profile",
  "name": "头像资料卡",
  "data": {
    "avatar": "/assets/avatar.svg",
    "name": "Tempest",
    "role": "小程序模板作者",
    "summary": "真实组件可以先在构建期读取 index.wxml 和 index.wxss，再交给小程序端 runtime 绘制。",
    "badge": "PRO"
  },
  "generatedFrom": {
    "dir": "miniprogram-demo/components/profile-card",
    "entry": "index",
    "files": {
      "wxml": "miniprogram-demo/components/profile-card/index.wxml",
      "wxss": "miniprogram-demo/components/profile-card/index.wxss",
      "js": "miniprogram-demo/components/profile-card/index.js",
      "json": "miniprogram-demo/components/profile-card/index.json"
    },
    "components": []
  },
  "generatedComponents": [],
  "wxml": "<view class=\"profile-card\">\n  <view class=\"profile-head\">\n    <image class=\"avatar\" src=\"{{avatar}}\" mode=\"aspectFill\" />\n    <view class=\"identity\">\n      <text class=\"name\">{{name}}</text>\n      <text class=\"role\">{{role}}</text>\n    </view>\n    <text class=\"badge\">{{badge}}</text>\n  </view>\n  <text class=\"summary\">{{summary}}</text>\n</view>",
  "wxss": ".profile-card {\n  width: 750rpx;\n  padding: 52rpx;\n  display: flex;\n  flex-direction: column;\n  gap: 40rpx;\n  background: #f8fafc;\n  border-radius: 32rpx;\n}\n\n.profile-head {\n  display: flex;\n  flex-direction: row;\n  align-items: center;\n  gap: 28rpx;\n}\n\n.avatar {\n  width: 116rpx;\n  height: 116rpx;\n  border-radius: 58rpx;\n  object-fit: cover;\n}\n\n.identity {\n  display: flex;\n  flex-direction: column;\n  gap: 10rpx;\n}\n\n.name {\n  font-size: 42rpx;\n  line-height: 1.2;\n  color: #0f172a;\n  font-weight: 700;\n}\n\n.role {\n  font-size: 26rpx;\n  line-height: 1.2;\n  color: #64748b;\n}\n\n.badge {\n  font-size: 24rpx;\n  line-height: 1.2;\n  color: #2563eb;\n  font-weight: 700;\n}\n\n.summary {\n  font-size: 30rpx;\n  line-height: 1.7;\n  color: #334155;\n}",
  "js": "Component({\n  options: {\n    styleIsolation: 'isolated',\n  },\n  properties: {\n    avatar: String,\n    name: String,\n    role: String,\n    summary: String,\n    badge: String,\n  },\n});",
  "json": "{\n  \"component\": true\n}"
};

const compositeCard = {
  "id": "composite",
  "name": "嵌套组件卡",
  "data": {
    "title": "组件组合能力",
    "summary": "父组件通过 usingComponents 引用统计子组件，构建时递归展开后交给 Canvas DSL。",
    "firstLabel": "模板节点",
    "firstValue": "18",
    "secondLabel": "渲染指令",
    "secondValue": "42"
  },
  "generatedFrom": {
    "dir": "miniprogram-demo/components/composite-card",
    "entry": "index",
    "files": {
      "wxml": "miniprogram-demo/components/composite-card/index.wxml",
      "wxss": "miniprogram-demo/components/composite-card/index.wxss",
      "js": "miniprogram-demo/components/composite-card/index.js",
      "json": "miniprogram-demo/components/composite-card/index.json"
    },
    "components": [
      {
        "tag": "card-stat",
        "dir": "/Users/tempest/tempest/Generate-sharing/miniprogram-demo/components/card-stat",
        "entry": "index",
        "components": []
      }
    ]
  },
  "generatedComponents": [
    {
      "tag": "card-stat",
      "dir": "/Users/tempest/tempest/Generate-sharing/miniprogram-demo/components/card-stat",
      "entry": "index",
      "components": []
    }
  ],
  "wxml": "<view class=\"composite-card\">\n  <text class=\"composite-eyebrow\">CUSTOM COMPONENT</text>\n  <text class=\"composite-title\">{{title}}</text>\n  <text class=\"composite-summary\">{{summary}}</text>\n  <view class=\"composite-stats\">\n    <view class=\"card-stat\">\n  <text class=\"card-stat-value\">{{firstValue}}</text>\n  <text class=\"card-stat-label\">{{firstLabel}}</text>\n</view>\n\n    <view class=\"card-stat\">\n  <text class=\"card-stat-value\">{{secondValue}}</text>\n  <text class=\"card-stat-label\">{{secondLabel}}</text>\n</view>\n\n  </view>\n  <text class=\"composite-note\">usingComponents -> WXML/WXSS -> Canvas</text>\n</view>",
  "wxss": ".composite-card {\n  width: 686rpx;\n  min-height: 760rpx;\n  padding: 48rpx;\n  gap: 28rpx;\n  display: flex;\n  flex-direction: column;\n  background-color: #132238;\n  border-radius: 28rpx;\n  color: #f8fafc;\n}\n\n.composite-eyebrow { color: #5eead4; font-size: 22rpx; font-weight: 700; }\n.composite-title { font-size: 52rpx; line-height: 1.2; font-weight: 700; }\n.composite-summary { color: #cbd5e1; font-size: 28rpx; line-height: 1.6; }\n.composite-stats { display: flex; flex-direction: row; gap: 20rpx; }\n.composite-note { color: #94a3b8; font-size: 22rpx; }\n\n.card-stat {\n  width: 270rpx;\n  padding: 28rpx;\n  gap: 8rpx;\n  display: flex;\n  flex-direction: column;\n  background-color: #f8fafc;\n  border-radius: 16rpx;\n}\n\n.card-stat-value { color: #0f766e; font-size: 44rpx; font-weight: 700; }\n.card-stat-label { color: #475569; font-size: 24rpx; }",
  "js": "Component({});",
  "json": "{\n  \"component\": true,\n  \"usingComponents\": {\n    \"card-stat\": \"../card-stat/index\"\n  }\n}"
};

const metricsCard = {
  "id": "metrics",
  "name": "数据指标卡",
  "data": {
    "kicker": "DASHBOARD",
    "title": "关键指标一屏展示",
    "primaryLabel": "生成模板",
    "primaryValue": "7",
    "secondLabel": "图片资源",
    "secondValue": "2",
    "thirdLabel": "组件层级",
    "thirdValue": "3",
    "note": "用于验证纵向信息密度、重复模块和文本行高。"
  },
  "generatedFrom": {
    "dir": "miniprogram-demo/components/metrics-card",
    "entry": "index",
    "files": {
      "wxml": "miniprogram-demo/components/metrics-card/index.wxml",
      "wxss": "miniprogram-demo/components/metrics-card/index.wxss",
      "js": "miniprogram-demo/components/metrics-card/index.js",
      "json": "miniprogram-demo/components/metrics-card/index.json"
    },
    "components": []
  },
  "generatedComponents": [],
  "wxml": "<view class=\"metrics-card\">\n  <text class=\"metrics-kicker\">{{kicker}}</text>\n  <text class=\"metrics-title\">{{title}}</text>\n  <view class=\"metrics-grid\">\n    <view class=\"metric-item\">\n      <text class=\"metric-value\">{{primaryValue}}</text>\n      <text class=\"metric-label\">{{primaryLabel}}</text>\n    </view>\n    <view class=\"metric-item accent\">\n      <text class=\"metric-value\">{{secondValue}}</text>\n      <text class=\"metric-label\">{{secondLabel}}</text>\n    </view>\n    <view class=\"metric-item\">\n      <text class=\"metric-value\">{{thirdValue}}</text>\n      <text class=\"metric-label\">{{thirdLabel}}</text>\n    </view>\n  </view>\n  <text class=\"metrics-note\">{{note}}</text>\n</view>",
  "wxss": ".metrics-card {\n  width: 686rpx;\n  min-height: 700rpx;\n  padding: 44rpx;\n  gap: 28rpx;\n  display: flex;\n  flex-direction: column;\n  background-color: #f8fafc;\n  border-radius: 28rpx;\n  color: #0f172a;\n}\n\n.metrics-kicker {\n  color: #0369a1;\n  font-size: 22rpx;\n  font-weight: 700;\n}\n\n.metrics-title {\n  font-size: 44rpx;\n  line-height: 1.25;\n  font-weight: 700;\n}\n\n.metrics-grid {\n  display: flex;\n  flex-direction: column;\n  gap: 18rpx;\n}\n\n.metric-item {\n  padding: 28rpx;\n  gap: 8rpx;\n  display: flex;\n  flex-direction: column;\n  background-color: #e2e8f0;\n  border-radius: 18rpx;\n}\n\n.metric-item.accent {\n  background-color: #dbeafe;\n}\n\n.metric-value {\n  color: #0f172a;\n  font-size: 46rpx;\n  font-weight: 700;\n}\n\n.metric-label {\n  color: #475569;\n  font-size: 24rpx;\n}\n\n.metrics-note {\n  color: #64748b;\n  font-size: 24rpx;\n  line-height: 1.5;\n}",
  "js": "Component({});",
  "json": "{\n  \"component\": true\n}"
};

const deepNestedCard = {
  "id": "deep-nested",
  "name": "多层嵌套组件卡",
  "data": {
    "title": "父组件 -> 区块组件 -> 信息行",
    "description": "这个 demo 包含两层 usingComponents，用于验证构建工具递归展开本地自定义组件。",
    "sectionTitle": "展开结果",
    "firstLabel": "父组件",
    "firstValue": "deep-card",
    "secondLabel": "子组件",
    "secondValue": "info-row",
    "footer": "所有自定义标签会在构建期展开为 view/text。"
  },
  "generatedFrom": {
    "dir": "miniprogram-demo/components/deep-nested-card",
    "entry": "index",
    "files": {
      "wxml": "miniprogram-demo/components/deep-nested-card/index.wxml",
      "wxss": "miniprogram-demo/components/deep-nested-card/index.wxss",
      "js": "miniprogram-demo/components/deep-nested-card/index.js",
      "json": "miniprogram-demo/components/deep-nested-card/index.json"
    },
    "components": [
      {
        "tag": "card-section",
        "dir": "/Users/tempest/tempest/Generate-sharing/miniprogram-demo/components/card-section",
        "entry": "index",
        "components": [
          {
            "tag": "info-row",
            "dir": "/Users/tempest/tempest/Generate-sharing/miniprogram-demo/components/info-row",
            "entry": "index",
            "components": []
          }
        ]
      }
    ]
  },
  "generatedComponents": [
    {
      "tag": "card-section",
      "dir": "/Users/tempest/tempest/Generate-sharing/miniprogram-demo/components/card-section",
      "entry": "index",
      "components": [
        {
          "tag": "info-row",
          "dir": "/Users/tempest/tempest/Generate-sharing/miniprogram-demo/components/info-row",
          "entry": "index",
          "components": []
        }
      ]
    }
  ],
  "wxml": "<view class=\"deep-card\">\n  <text class=\"deep-eyebrow\">DEEP COMPONENT</text>\n  <text class=\"deep-title\">{{title}}</text>\n  <text class=\"deep-desc\">{{description}}</text>\n  <view class=\"card-section\">\n  <text class=\"card-section-title\">{{sectionTitle}}</text>\n  <view class=\"info-row\">\n  <text class=\"info-row-label\">{{firstLabel}}</text>\n  <text class=\"info-row-value\">{{firstValue}}</text>\n</view>\n\n  <view class=\"info-row\">\n  <text class=\"info-row-label\">{{secondLabel}}</text>\n  <text class=\"info-row-value\">{{secondValue}}</text>\n</view>\n\n</view>\n\n  <text class=\"deep-footer\">{{footer}}</text>\n</view>",
  "wxss": ".deep-card {\n  width: 686rpx;\n  min-height: 780rpx;\n  padding: 44rpx;\n  gap: 24rpx;\n  display: flex;\n  flex-direction: column;\n  background-color: #ecfeff;\n  border-radius: 30rpx;\n  color: #164e63;\n}\n\n.deep-eyebrow {\n  color: #0891b2;\n  font-size: 22rpx;\n  font-weight: 700;\n}\n\n.deep-title {\n  color: #083344;\n  font-size: 48rpx;\n  line-height: 1.2;\n  font-weight: 700;\n}\n\n.deep-desc {\n  color: #155e75;\n  font-size: 27rpx;\n  line-height: 1.55;\n}\n\n.deep-footer {\n  color: #0e7490;\n  font-size: 23rpx;\n}\n\n.card-section {\n  padding: 28rpx;\n  gap: 8rpx;\n  display: flex;\n  flex-direction: column;\n  background-color: #ffffff;\n  border-radius: 18rpx;\n}\n\n.card-section-title {\n  color: #111827;\n  font-size: 30rpx;\n  font-weight: 700;\n}\n\n.info-row {\n  padding: 20rpx 0;\n  display: flex;\n  flex-direction: row;\n  justify-content: space-between;\n  border-bottom-width: 1rpx;\n  border-bottom-style: solid;\n  border-bottom-color: #e5e7eb;\n}\n\n.info-row-label {\n  color: #6b7280;\n  font-size: 24rpx;\n}\n\n.info-row-value {\n  color: #111827;\n  font-size: 26rpx;\n  font-weight: 700;\n}",
  "js": "Component({});",
  "json": "{\n  \"component\": true,\n  \"usingComponents\": {\n    \"card-section\": \"../card-section/index\"\n  }\n}"
};

const productCard = {
  "id": "product",
  "name": "图片商品卡",
  "data": {
    "cover": "/assets/cover.svg",
    "label": "NEW TEMPLATE",
    "title": "复杂图片分享卡",
    "description": "包含封面图、标签、标题、说明和价格信息，适合验证 image、嵌套 view 和横向布局。",
    "price": "¥ 128",
    "note": "Canvas DSL Demo"
  },
  "generatedFrom": {
    "dir": "miniprogram-demo/components/product-card",
    "entry": "index",
    "files": {
      "wxml": "miniprogram-demo/components/product-card/index.wxml",
      "wxss": "miniprogram-demo/components/product-card/index.wxss",
      "js": "miniprogram-demo/components/product-card/index.js",
      "json": "miniprogram-demo/components/product-card/index.json"
    },
    "components": []
  },
  "generatedComponents": [],
  "wxml": "<view class=\"product-card\">\n  <image class=\"cover\" src=\"{{cover}}\" mode=\"aspectFill\" />\n  <view class=\"content\">\n    <text class=\"label\">{{label}}</text>\n    <text class=\"title\">{{title}}</text>\n    <text class=\"description\">{{description}}</text>\n    <view class=\"meta\">\n      <text class=\"price\">{{price}}</text>\n      <text class=\"note\">{{note}}</text>\n    </view>\n  </view>\n</view>",
  "wxss": ".product-card {\n  width: 750rpx;\n  padding: 36rpx;\n  display: flex;\n  flex-direction: column;\n  gap: 30rpx;\n  background: #111827;\n  border-radius: 32rpx;\n}\n\n.cover {\n  width: 100%;\n  height: 360rpx;\n  border-radius: 24rpx;\n  object-fit: cover;\n}\n\n.content {\n  display: flex;\n  flex-direction: column;\n  gap: 20rpx;\n}\n\n.label {\n  font-size: 22rpx;\n  line-height: 1.2;\n  color: #93c5fd;\n  font-weight: 700;\n}\n\n.title {\n  font-size: 48rpx;\n  line-height: 1.16;\n  color: #ffffff;\n  font-weight: 700;\n}\n\n.description {\n  font-size: 28rpx;\n  line-height: 1.6;\n  color: #cbd5e1;\n}\n\n.meta {\n  display: flex;\n  flex-direction: row;\n  align-items: center;\n  gap: 24rpx;\n}\n\n.price {\n  font-size: 38rpx;\n  line-height: 1.2;\n  color: #ffffff;\n  font-weight: 700;\n}\n\n.note {\n  font-size: 24rpx;\n  line-height: 1.2;\n  color: #94a3b8;\n}",
  "js": "Component({\n  options: {\n    styleIsolation: 'isolated',\n  },\n  properties: {\n    cover: String,\n    label: String,\n    title: String,\n    description: String,\n    price: String,\n    note: String,\n  },\n});",
  "json": "{\n  \"component\": true\n}"
};

const demoTemplates = [articleCard, profileCard, compositeCard, metricsCard, deepNestedCard, productCard];

module.exports = {
  articleCard,
  profileCard,
  compositeCard,
  metricsCard,
  deepNestedCard,
  productCard,
  demoTemplates,
};
