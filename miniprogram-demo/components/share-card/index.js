const { createShareCardRenderer } = require('../../runtime/share-card-runtime');

Component({
  properties: {
    width: {
      type: Number,
      value: 343,
    },
    height: {
      type: Number,
      value: 600,
    },
  },

  methods: {
    async render(options) {
      const query = this.createSelectorQuery();
      const { canvas, width, height } = await new Promise((resolve, reject) => {
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
              reject(new Error('无法找到分享卡片 Canvas 节点。'));
            }
          });
      });
      const pixelRatio = wx.getSystemInfoSync().pixelRatio || 1;
      canvas.width = width * pixelRatio;
      canvas.height = height * pixelRatio;
      const context = canvas.getContext('2d');
      if (context.scale) {
        context.scale(pixelRatio, pixelRatio);
      }
      this._canvas = canvas;

      const renderer = createShareCardRenderer({
        resolveImage: options.resolveImage || createCanvasImageResolver(canvas),
      });

      return renderer.render({
        wxml: options.wxml,
        wxss: options.wxss,
        data: options.data,
        mode: options.mode,
        viewportWidth: options.viewportWidth || this.data.width,
        context,
      });
    },

    async toTempFilePath(options = {}) {
      if (!this._canvas) {
        throw new Error('请先调用 render 完成卡片渲染。');
      }

      return new Promise((resolve, reject) => {
        wx.canvasToTempFilePath({
          canvas: this._canvas,
          width: options.width || this.data.width,
          height: options.height || this.data.height,
          destWidth: options.destWidth || (options.width || this.data.width) * 2,
          destHeight: options.destHeight || (options.height || this.data.height) * 2,
          fileType: options.fileType || 'png',
          quality: options.quality || 1,
          success: resolve,
          fail: reject,
        });
      });
    },
  },
});

function createCanvasImageResolver(canvas) {
  return function resolveImage(src) {
    return new Promise((resolve) => {
      if (!canvas || typeof canvas.createImage !== 'function') {
        resolve({ src, drawable: src });
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
        resolve({ src, drawable: src });
      };
      image.src = src;
    });
  };
}
