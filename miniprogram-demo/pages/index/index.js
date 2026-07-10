const { demoTemplates } = require('../../templates/index');

Page({
  data: {
    rendering: false,
    ready: false,
    imagePath: '',
    selectedIndex: 0,
    demos: demoTemplates.map((item) => ({ id: item.id, name: item.name })),
  },

  selectDemo(event) {
    const index = Number(event.currentTarget.dataset.index);
    this.setData({
      selectedIndex: index,
      ready: false,
      imagePath: '',
    });
  },

  async renderCard() {
    this.setData({ rendering: true });
    try {
      const card = this.selectComponent('#shareCard');
      if (!card) {
        throw new Error('分享卡片组件未就绪');
      }
      const template = demoTemplates[this.data.selectedIndex];
      await card.render({
        wxml: template.wxml,
        wxss: template.wxss,
        data: template.data,
        mode: 'strict',
      });
      this.setData({ ready: true });
    } catch (error) {
      wx.showToast({
        title: error && error.message ? error.message : '渲染失败',
        icon: 'none',
      });
    } finally {
      this.setData({ rendering: false });
    }
  },

  async exportImage() {
    try {
      const card = this.selectComponent('#shareCard');
      if (!card) {
        throw new Error('分享卡片组件未就绪');
      }
      const result = await card.toTempFilePath({
        width: 375,
        height: 560,
        destWidth: 750,
        destHeight: 1120,
      });
      this.setData({ imagePath: result.tempFilePath });
    } catch (error) {
      wx.showToast({
        title: error && error.message ? error.message : '导出失败',
        icon: 'none',
      });
    }
  },
});
