import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pluginRoot = 'miniprogram-plugin';
const hostRoot = 'miniprogram-plugin-host';

describe('miniapp plugin package', () => {
  it('provides plugin manifest, component, api entry, and usage docs', () => {
    expect(existsSync(`${pluginRoot}/plugin.json`)).toBe(true);
    expect(existsSync(`${pluginRoot}/components/share-card/share-card.json`)).toBe(true);
    expect(existsSync(`${pluginRoot}/components/share-card/share-card.wxml`)).toBe(true);
    expect(existsSync(`${pluginRoot}/components/share-card/share-card.wxss`)).toBe(true);
    expect(existsSync(`${pluginRoot}/components/share-card/share-card.js`)).toBe(true);
    expect(existsSync(`${pluginRoot}/api/share-card.js`)).toBe(true);
    expect(existsSync(`${pluginRoot}/assets/plugin-cover.svg`)).toBe(true);
    expect(existsSync(`${pluginRoot}/runtime/share-card-runtime.js`)).toBe(true);
    expect(existsSync(`${pluginRoot}/README.md`)).toBe(true);

    const pluginJson = JSON.parse(readFileSync(`${pluginRoot}/plugin.json`, 'utf8'));
    expect(pluginJson.publicComponents).toHaveProperty('share-card');
    expect(pluginJson.publicComponents['share-card']).toBe('components/share-card/share-card');
    expect(pluginJson.main).toBe('api/share-card.js');

    const apiSource = readFileSync(`${pluginRoot}/api/share-card.js`, 'utf8');
    expect(apiSource).toContain("../runtime/share-card-runtime");
    expect(apiSource).toContain('createShareCardRenderer');
    expect(apiSource).toContain('renderToCanvas');

    const runtimeSource = readFileSync(`${pluginRoot}/runtime/share-card-runtime.js`, 'utf8');
    expect(runtimeSource).toContain('createShareCardRenderer');

    const docs = readFileSync(`${pluginRoot}/README.md`, 'utf8');
    expect(docs).toContain('wxml');
    expect(docs).toContain('wxss');
    expect(docs).toContain('renderToCanvas');
  });

  it('provides a real WeChat plugin-mode project with a host miniapp', () => {
    expect(existsSync('project.config.json')).toBe(true);
    expect(existsSync(`${hostRoot}/app.json`)).toBe(true);
    expect(existsSync(`${hostRoot}/app.js`)).toBe(true);
    expect(existsSync(`${hostRoot}/app.wxss`)).toBe(true);
    expect(existsSync(`${hostRoot}/pages/index/index.json`)).toBe(true);
    expect(existsSync(`${hostRoot}/pages/index/index.wxml`)).toBe(true);
    expect(existsSync(`${hostRoot}/pages/index/index.wxss`)).toBe(true);
    expect(existsSync(`${hostRoot}/pages/index/index.js`)).toBe(true);

    const projectConfig = JSON.parse(readFileSync('project.config.json', 'utf8'));
    expect(projectConfig.compileType).toBe('plugin');
    expect(projectConfig.pluginRoot).toBe('miniprogram-plugin/');
    expect(projectConfig.miniprogramRoot).toBe('miniprogram-plugin-host/');

    const appJson = JSON.parse(readFileSync(`${hostRoot}/app.json`, 'utf8'));
    expect(appJson.plugins.generateSharing.version).toBe('dev');
    expect(appJson.plugins.generateSharing.provider).toBe(projectConfig.appid);
    expect(appJson.plugins['generate-sharing']).toBeUndefined();
    expect(appJson.usingComponents['share-card']).toBe('plugin://generateSharing/share-card');

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
    expect(pageSource).toContain("requirePlugin('generateSharing')");
    expect(pageSource).toContain("cover: '/assets/plugin-cover.svg'");
    expect(pageSource).toContain('demoTemplates');
    expect(pageSource).toContain('selectedIndex');
    expect(pageSource).toContain('selectDemo(event)');
    expect(pageSource).toContain('getSelectedTemplate()');
    expect(pageSource).toContain('plugin.createShareCardRenderer');
    expect(pageSource).not.toContain('getShareCardComponent');
    expect(pageSource).not.toContain('selectComponent');
    expect(pageSource).toContain('renderKey: this.data.renderKey + 1');
    expect(pageSource).toContain('exportKey: this.data.exportKey + 1');
    expect(pageSource).toContain('onShareCardReady');
    expect(pageSource).toContain('onShareCardRendered');
    expect(pageSource).toContain('onShareCardExported');
  });

  it('uses plugin-safe image resolution and exports by rendered layout size', () => {
    const componentSource = readFileSync(`${pluginRoot}/components/share-card/share-card.js`, 'utf8');
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
