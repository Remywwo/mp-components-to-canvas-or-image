import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const packageRoot = '.';
const hostRoot = 'examples/miniprogram';
const packageName = 'mp-components-to-canvas-or-image';

describe('miniapp npm package', () => {
  it('uses the repository root as the npm package', () => {
    expect(existsSync(`${packageRoot}/package.json`)).toBe(true);
    expect(existsSync(`${packageRoot}/components/share-card/share-card.json`)).toBe(true);
    expect(existsSync(`${packageRoot}/components/share-card/share-card.wxml`)).toBe(true);
    expect(existsSync(`${packageRoot}/components/share-card/share-card.wxss`)).toBe(true);
    expect(existsSync(`${packageRoot}/components/share-card/share-card.js`)).toBe(true);
    expect(existsSync(`${packageRoot}/api/share-card.js`)).toBe(true);
    expect(existsSync(`${packageRoot}/assets/cover.svg`)).toBe(true);
    expect(existsSync(`${packageRoot}/runtime/share-card-runtime.js`)).toBe(true);
    expect(existsSync(`${packageRoot}/README.md`)).toBe(true);

    const packageJson = JSON.parse(readFileSync(`${packageRoot}/package.json`, 'utf8'));
    expect(packageJson.name).toBe(packageName);
    expect(packageJson.private).not.toBe(true);
    expect(packageJson.main).toBe('api/share-card.js');
    expect(packageJson.miniprogram).toBe('.');
    expect(packageJson.files).toEqual(expect.arrayContaining(['api', 'assets', 'components', 'runtime', 'README.md']));
    expect(packageJson.scripts.build).toBe('npm run build:npm && tsc --noEmit');
    expect(packageJson.scripts['build:npm']).toBe('node scripts/build-miniapp-runtime.mjs');
    expect(packageJson.scripts['build:plugin']).toBeUndefined();
    expect(packageJson.scripts['build:miniapp-demo']).toBeUndefined();
    expect(packageJson.scripts.capture).toBeUndefined();
    expect(packageJson.scripts['template:read']).toBeUndefined();

    const apiSource = readFileSync(`${packageRoot}/api/share-card.js`, 'utf8');
    expect(apiSource).toContain("../runtime/share-card-runtime");
    expect(apiSource).toContain('createShareCardRenderer');
    expect(apiSource).toContain('renderToCanvas');

    const runtimeSource = readFileSync(`${packageRoot}/runtime/share-card-runtime.js`, 'utf8');
    expect(runtimeSource).toContain('createShareCardRenderer');

    const docs = readFileSync(`${packageRoot}/README.md`, 'utf8');
    expect(docs).toContain('wxml');
    expect(docs).toContain('wxss');
    expect(docs).toContain('renderToCanvas');
    expect(docs).toContain(`miniprogram_npm/${packageName}/components/share-card/share-card`);
  });

  it('keeps the miniapp usage demo under examples', () => {
    expect(existsSync('project.config.json')).toBe(false);
    expect(existsSync('project.private.config.json')).toBe(false);
    expect(existsSync(`${hostRoot}/app.json`)).toBe(true);
    expect(existsSync(`${hostRoot}/app.js`)).toBe(true);
    expect(existsSync(`${hostRoot}/app.wxss`)).toBe(true);
    expect(existsSync(`${hostRoot}/project.config.json`)).toBe(true);
    expect(existsSync(`${hostRoot}/pages/index/index.json`)).toBe(true);
    expect(existsSync(`${hostRoot}/pages/index/index.wxml`)).toBe(true);
    expect(existsSync(`${hostRoot}/pages/index/index.wxss`)).toBe(true);
    expect(existsSync(`${hostRoot}/pages/index/index.js`)).toBe(true);
    expect(existsSync(`${hostRoot}/miniprogram_npm/${packageName}/package.json`)).toBe(true);
    expect(existsSync(`${hostRoot}/miniprogram_npm/${packageName}/components/share-card/share-card.json`)).toBe(true);
    expect(existsSync(`${hostRoot}/miniprogram_npm/${packageName}/api/share-card.js`)).toBe(true);

    const projectConfig = JSON.parse(readFileSync(`${hostRoot}/project.config.json`, 'utf8'));
    expect(projectConfig.compileType).toBe('miniprogram');
    expect(projectConfig.pluginRoot).toBeUndefined();
    expect(projectConfig.miniprogramRoot).toBe('./');
    expect(existsSync('miniprogram-plugin')).toBe(false);
    expect(existsSync('miniprogram-plugin-host')).toBe(false);
    expect(existsSync('miniprogram-demo')).toBe(false);
    expect(existsSync('miniprogram')).toBe(false);
    expect(existsSync('miniprogram-package')).toBe(false);
    expect(existsSync('plugin')).toBe(false);
    expect(existsSync('exports')).toBe(false);

    const appJson = JSON.parse(readFileSync(`${hostRoot}/app.json`, 'utf8'));
    expect(appJson.plugins).toBeUndefined();
    expect(appJson.usingComponents['share-card']).toBe(`/miniprogram_npm/${packageName}/components/share-card/share-card`);

    const pageJson = JSON.parse(readFileSync(`${hostRoot}/pages/index/index.json`, 'utf8'));
    expect(pageJson.usingComponents).toBeUndefined();

    const pageWxml = readFileSync(`${hostRoot}/pages/index/index.wxml`, 'utf8');
    expect(pageWxml).toContain('wx:for="{{demos}}"');
    expect(pageWxml).toContain('bindtap="selectDemo"');
    expect(pageWxml).toContain('selectedIndex === index');
    expect(pageWxml).toContain('<share-card');
    expect(pageWxml).toContain('id="shareCard"');
    expect(pageWxml).toContain('class="share-card"');
    expect(pageWxml).toContain('render-options="{{renderOptions}}"');
    expect(pageWxml).toContain('render-key="{{renderKey}}"');
    expect(pageWxml).toContain('export-key="{{exportKey}}"');
    expect(pageWxml).toContain('bind:ready="onShareCardReady"');
    expect(pageWxml).toContain('bind:rendered="onShareCardRendered"');
    expect(pageWxml).toContain('bind:exported="onShareCardExported"');
    expect(pageWxml).toContain('bind:error="onShareCardError"');
    expect(pageWxml).toContain('</share-card>');
    expect(pageWxml).not.toContain('<share-card id="shareCard" width="{{343}}" height="{{520}}" />');

    const pageSource = readFileSync(`${hostRoot}/pages/index/index.js`, 'utf8');
    expect(pageSource).toContain(`require('../../miniprogram_npm/${packageName}/api/share-card')`);
    expect(pageSource).toContain("cover: '/assets/cover.svg'");
    expect(pageSource).toContain('demoTemplates');
    expect(pageSource).toContain('selectedIndex');
    expect(pageSource).toContain('selectDemo(event)');
    expect(pageSource).toContain('getSelectedTemplate()');
    expect(pageSource).toContain('shareCardPackage.createShareCardRenderer');
    expect(pageSource).not.toContain('getShareCardComponent');
    expect(pageSource).not.toContain('selectComponent');
    expect(pageSource).toContain('renderKey: this.data.renderKey + 1');
    expect(pageSource).toContain('exportKey: this.data.exportKey + 1');
    expect(pageSource).toContain('onShareCardReady');
    expect(pageSource).toContain('onShareCardRendered');
    expect(pageSource).toContain('onShareCardExported');
  });

  it('uses miniapp-safe image resolution and exports by rendered layout size', () => {
    const componentSource = readFileSync(`${packageRoot}/components/share-card/share-card.js`, 'utf8');
    expect(componentSource).toContain('renderOptions');
    expect(componentSource).toContain('renderKey');
    expect(componentSource).toContain('exportKey');
    expect(componentSource).toContain("this.triggerEvent('rendered'");
    expect(componentSource).toContain("this.triggerEvent('exported'");
    expect(componentSource).toContain("this.triggerEvent('error'");
    expect(componentSource).toContain("this.triggerEvent('ready'");
    expect(componentSource).toContain('createCanvasImageResolver');
    expect(componentSource).toContain('canvas.createImage');
    expect(componentSource).toContain('reject(new Error(`图片加载失败');
    expect(componentSource).not.toContain('resolve({ src, drawable: src })');
    expect(componentSource).toContain('_renderSize');
    expect(componentSource).toContain('result.box.height');
    expect(componentSource).toContain('renderCanvasCommands');
  });
});
