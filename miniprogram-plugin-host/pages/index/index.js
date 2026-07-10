const plugin = requirePlugin('generateSharing');

const demoTemplates = [
  {
    id: 'image-card',
    name: '图片卡片',
    wxml: `
    <view class="card">
      <view class="cover">
        <image class="cover-image" src="{{cover}}" mode="aspectFill" />
      </view>
      <view class="content">
        <text class="label">{{label}}</text>
        <text class="title">{{title}}</text>
        <text class="body">{{body}}</text>
        <view class="meta">
          <text>{{author}}</text>
          <text>{{date}}</text>
        </view>
      </view>
    </view>
  `,
    wxss: `
    .card { width: 343px; padding: 16px; border-radius: 12px; background: #111827; }
    .cover { width: 311px; height: 180px; border-radius: 10px; overflow: hidden; background: #dbeafe; }
    .cover-image { width: 311px; height: 180px; border-radius: 10px; }
    .content { padding-top: 18px; }
    .label { display: block; margin-bottom: 8px; color: #93c5fd; font-size: 12px; font-weight: 700; }
    .title { display: block; margin-bottom: 10px; color: #ffffff; font-size: 24px; font-weight: 700; line-height: 32px; }
    .body { display: block; color: #d1d5db; font-size: 14px; line-height: 22px; }
    .meta { display: flex; justify-content: space-between; margin-top: 18px; color: #f9fafb; font-size: 13px; }
  `,
    data: {
      cover: '/assets/plugin-cover.svg',
      label: 'PLUGIN HOST',
      title: '真实插件模式宿主测试',
      body: '当前页面通过 plugin://generateSharing/share-card 引用插件公开组件，并用 requirePlugin 调用插件 JS API。',
      author: 'Generate Sharing',
      date: '2026.07',
    },
  },
  {
    id: 'text-card',
    name: '文本卡片',
    wxml: `
    <view class="text-card">
      <text class="text-kicker">{{kicker}}</text>
      <text class="text-title">{{title}}</text>
      <text class="text-body">{{body}}</text>
      <view class="text-footer">
        <text>{{left}}</text>
        <text>{{right}}</text>
      </view>
    </view>
  `,
    wxss: `
    .text-card { width: 343px; padding: 24px; border-radius: 14px; background: #f8fafc; color: #111827; }
    .text-kicker { display: block; margin-bottom: 10px; color: #0f766e; font-size: 12px; font-weight: 700; }
    .text-title { display: block; margin-bottom: 14px; color: #111827; font-size: 25px; font-weight: 700; line-height: 32px; }
    .text-body { display: block; color: #475569; font-size: 15px; line-height: 24px; }
    .text-footer { display: flex; justify-content: space-between; margin-top: 24px; color: #334155; font-size: 13px; }
  `,
    data: {
      kicker: 'TEXT ONLY',
      title: '纯文本分享卡',
      body: '这个模板不依赖图片资源，用于验证标题、正文、页脚和基础排版。',
      left: 'Generate Sharing',
      right: 'Canvas DSL',
    },
  },
  {
    id: 'stats-card',
    name: '指标卡片',
    wxml: `
    <view class="stats-card">
      <text class="stats-title">{{title}}</text>
      <view class="stat">
        <text class="stat-value">{{firstValue}}</text>
        <text class="stat-label">{{firstLabel}}</text>
      </view>
      <view class="stat highlight">
        <text class="stat-value">{{secondValue}}</text>
        <text class="stat-label">{{secondLabel}}</text>
      </view>
      <text class="stats-note">{{note}}</text>
    </view>
  `,
    wxss: `
    .stats-card { width: 343px; padding: 22px; gap: 12px; display: flex; flex-direction: column; border-radius: 14px; background: #ecfeff; }
    .stats-title { color: #083344; font-size: 23px; font-weight: 700; line-height: 30px; }
    .stat { padding: 16px; border-radius: 10px; background: #ffffff; }
    .stat.highlight { background: #cffafe; }
    .stat-value { display: block; color: #0e7490; font-size: 30px; font-weight: 700; }
    .stat-label { display: block; color: #155e75; font-size: 13px; }
    .stats-note { color: #0f766e; font-size: 13px; line-height: 20px; }
  `,
    data: {
      title: '运行时能力指标',
      firstValue: '3',
      firstLabel: '插件通信方式',
      secondValue: '43',
      secondLabel: '自动化测试',
      note: '用于验证多块内容、gap 和纵向 flex 布局。',
    },
  },
];

Page({
  data: {
    rendering: false,
    apiRendering: false,
    ready: false,
    componentReady: false,
    renderOptions: null,
    renderKey: 0,
    exportKey: 0,
    selectedIndex: 0,
    demos: demoTemplates.map((item) => ({ id: item.id, name: item.name })),
    imagePath: '',
    status: '等待渲染',
  },

  onShareCardReady() {
    this.setData({ componentReady: true, status: '插件组件已挂载' });
  },

  selectDemo(event) {
    const index = Number(event.currentTarget.dataset.index);
    this.setData({
      selectedIndex: Number.isNaN(index) ? 0 : index,
      ready: false,
      imagePath: '',
      status: '已切换组件模板',
    });
  },

  getSelectedTemplate() {
    return demoTemplates[this.data.selectedIndex] || demoTemplates[0];
  },

  async renderByComponent() {
    const template = this.getSelectedTemplate();
    this.setData({
      rendering: true,
      ready: false,
      imagePath: '',
      status: '组件渲染中',
      renderOptions: {
        wxml: template.wxml,
        wxss: template.wxss,
        data: template.data,
        mode: 'strict',
      },
      renderKey: this.data.renderKey + 1,
    });
  },

  onShareCardRendered(event) {
    const result = event.detail;
    this.setData({
      rendering: false,
      ready: true,
      status: `组件渲染完成：${Math.round(result.box.width)} x ${Math.round(result.box.height)}`,
    });
  },

  onShareCardExported(event) {
    this.setData({
      imagePath: event.detail.tempFilePath,
      status: '图片导出完成',
    });
  },

  onShareCardError(event) {
    const message = event.detail && event.detail.message ? event.detail.message : '插件组件执行失败';
    this.setData({
      rendering: false,
      status: message,
    });
    wx.showToast({ title: message, icon: 'none' });
  },

  async renderByPluginApi() {
    const template = this.getSelectedTemplate();
    this.setData({ apiRendering: true, status: '插件 API 编译中' });
    try {
      const renderer = plugin.createShareCardRenderer();
      const result = await renderer.render({
        wxml: template.wxml,
        wxss: template.wxss,
        data: template.data,
        mode: 'strict',
        viewportWidth: 343,
      });
      this.setData({
        status: `插件 API 可用：生成 ${result.commands.length} 条绘制指令`,
      });
    } catch (error) {
      this.setData({ status: error && error.message ? error.message : '插件 API 调用失败' });
      wx.showToast({ title: this.data.status, icon: 'none' });
    } finally {
      this.setData({ apiRendering: false });
    }
  },

  async exportImage() {
    this.setData({
      status: '图片导出中',
      exportKey: this.data.exportKey + 1,
    });
  },
});
