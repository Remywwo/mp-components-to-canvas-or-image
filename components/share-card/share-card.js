const { createShareCardRenderer } = require('../../api/share-card');
const { renderCanvasCommands } = require('../../runtime/share-card-runtime');

Component({
  properties: {
    width: {
      type: Number,
      value: 375,
      observer(value) {
        this.setData({ canvasWidth: value || 375 });
      },
    },
    height: {
      type: Number,
      value: 600,
      observer(value) {
        this.setData({ canvasHeight: value || 600 });
      },
    },
    renderOptions: {
      type: Object,
      value: null,
    },
    renderKey: {
      type: Number,
      value: 0,
      observer(value, oldValue) {
        if (value && value !== oldValue) {
          this.renderByProperty();
        }
      },
    },
    exportKey: {
      type: Number,
      value: 0,
      observer(value, oldValue) {
        if (value && value !== oldValue) {
          this.exportByProperty();
        }
      },
    },
  },

  data: {
    canvasWidth: 375,
    canvasHeight: 600,
  },

  lifetimes: {
    attached() {
      this.setData({
        canvasWidth: this.data.width,
        canvasHeight: this.data.height,
      });
      this.triggerEvent('ready', {
        width: this.data.width,
        height: this.data.height,
      });
    },
  },

  methods: {
    async renderByProperty() {
      try {
        const result = await this.render(this.data.renderOptions || {});
        this.triggerEvent('rendered', result);
      } catch (error) {
        this.triggerEvent('error', normalizeError(error, '渲染失败'));
      }
    },

    async exportByProperty() {
      try {
        const result = await this.toTempFilePath();
        this.triggerEvent('exported', result);
      } catch (error) {
        this.triggerEvent('error', normalizeError(error, '导出失败'));
      }
    },

    async render(options = {}) {
      const query = this.createSelectorQuery();
      const { canvas } = await new Promise((resolve, reject) => {
        query
          .select('#share-card-canvas')
          .fields({ node: true, size: true })
          .exec((res) => {
            const result = res && res[0];
            if (result && result.node) {
              resolve({
                canvas: result.node,
                width: result.width,
                height: result.height,
              });
            } else {
              reject(new Error('Unable to find share-card canvas node.'));
            }
          });
      });
      const pixelRatio = wx.getSystemInfoSync().pixelRatio || 1;

      const renderer = createShareCardRenderer({
        runtime: options.runtime,
        resolveImage: options.resolveImage || createCanvasImageResolver(canvas),
      });
      const result = await renderer.render({
        wxml: options.wxml,
        wxss: options.wxss,
        data: options.data,
        mode: options.mode,
        viewportWidth: options.viewportWidth || this.data.width,
      });

      const renderWidth = Math.ceil(result.box.width || options.viewportWidth || this.data.width);
      const renderHeight = Math.ceil(result.box.height || this.data.height);
      this.setData({
        canvasWidth: renderWidth,
        canvasHeight: renderHeight,
      });

      canvas.width = renderWidth * pixelRatio;
      canvas.height = renderHeight * pixelRatio;
      const context = canvas.getContext('2d');
      if (context.scale) {
        context.scale(pixelRatio, pixelRatio);
      }
      renderCanvasCommands(context, result.commands);

      this._canvas = canvas;
      this._renderSize = {
        width: renderWidth,
        height: renderHeight,
        pixelRatio,
      };

      return result;
    },

    async toTempFilePath(options = {}) {
      if (!this._canvas) {
        throw new Error('请先调用 render 完成卡片渲染。');
      }
      const renderSize = this._renderSize || {
        width: this.data.width,
        height: this.data.height,
        pixelRatio: 1,
      };
      const width = options.width || renderSize.width;
      const height = options.height || renderSize.height;
      const scale = options.scale || 2;

      return new Promise((resolve, reject) => {
        wx.canvasToTempFilePath({
          canvas: this._canvas,
          width,
          height,
          destWidth: options.destWidth || width * scale,
          destHeight: options.destHeight || height * scale,
          fileType: options.fileType || 'png',
          quality: options.quality || 1,
          success: resolve,
          fail: reject,
        });
      });
    },
  },
});

function normalizeError(error, fallbackMessage) {
  return {
    message: error && error.message ? error.message : fallbackMessage,
  };
}

function createCanvasImageResolver(canvas) {
  return function resolveImage(src) {
    return new Promise((resolve, reject) => {
      if (!canvas || typeof canvas.createImage !== 'function') {
        reject(new Error('当前 Canvas 节点不支持 createImage，无法加载图片资源'));
        return;
      }

      const image = canvas.createImage();
      image.onload = () => {
        resolve({
          src,
          drawable: image,
          width: image.width,
          height: image.height,
        });
      };
      image.onerror = () => {
        reject(new Error(`图片加载失败：${src}`));
      };
      image.src = src;
    });
  };
}
