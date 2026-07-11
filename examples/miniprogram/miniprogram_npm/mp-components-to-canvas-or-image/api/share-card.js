function createShareCardRenderer(options = {}) {
  const runtime = options.runtime || require('../runtime/share-card-runtime');

  if (typeof runtime.createShareCardRenderer === 'function') {
    return runtime.createShareCardRenderer(options);
  }

  return {
    async render() {
      throw new Error(
        'Share card runtime is not bundled yet. Build or inject src/miniapp-runtime before using createShareCardRenderer.',
      );
    },
  };
}

async function renderToCanvas(options) {
  const renderer = createShareCardRenderer({
    runtime: options.runtime,
    resolveImage: options.resolveImage,
  });

  return renderer.render({
    wxml: options.wxml,
    wxss: options.wxss,
    data: options.data,
    mode: options.mode,
    viewportWidth: options.viewportWidth,
    context: options.context,
  });
}

module.exports = {
  createShareCardRenderer,
  renderToCanvas,
};
