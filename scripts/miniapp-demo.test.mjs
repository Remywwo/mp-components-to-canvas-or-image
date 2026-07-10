import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const demoRoot = 'miniprogram-demo';

describe('miniapp demo', () => {
  it('provides a runnable WeChat mini program demo structure', () => {
    [
      'project.config.json',
      'app.json',
      'app.js',
      'app.wxss',
      'components/share-card/index.json',
      'components/share-card/index.wxml',
      'components/share-card/index.wxss',
      'components/share-card/index.js',
      'pages/index/index.json',
      'pages/index/index.wxml',
      'pages/index/index.wxss',
      'pages/index/index.js',
      'runtime/share-card-runtime.js',
      'templates/share-card.js',
      'templates/index.js',
      'components/manifest.mjs',
      'components/article-card/index.wxml',
      'components/article-card/index.wxss',
      'components/article-card/index.js',
      'components/article-card/index.json',
      'components/profile-card/index.wxml',
      'components/profile-card/index.wxss',
      'components/profile-card/index.js',
      'components/profile-card/index.json',
      'components/product-card/index.wxml',
      'components/product-card/index.wxss',
      'components/product-card/index.js',
      'components/product-card/index.json',
      'components/composite-card/index.wxml',
      'components/composite-card/index.wxss',
      'components/composite-card/index.js',
      'components/composite-card/index.json',
      'components/card-stat/index.wxml',
      'components/card-stat/index.wxss',
      'components/card-stat/index.js',
      'components/card-stat/index.json',
      'components/metrics-card/index.wxml',
      'components/metrics-card/index.wxss',
      'components/metrics-card/index.js',
      'components/metrics-card/index.json',
      'components/deep-nested-card/index.wxml',
      'components/deep-nested-card/index.wxss',
      'components/deep-nested-card/index.js',
      'components/deep-nested-card/index.json',
      'components/card-section/index.wxml',
      'components/card-section/index.wxss',
      'components/card-section/index.js',
      'components/card-section/index.json',
      'components/info-row/index.wxml',
      'components/info-row/index.wxss',
      'components/info-row/index.js',
      'components/info-row/index.json',
      'assets/cover.svg',
      'assets/avatar.svg',
      'README.md',
    ].forEach((file) => {
      expect(existsSync(`${demoRoot}/${file}`), file).toBe(true);
    });

    const appJson = JSON.parse(readFileSync(`${demoRoot}/app.json`, 'utf8'));
    const projectConfig = JSON.parse(readFileSync(`${demoRoot}/project.config.json`, 'utf8'));
    expect(projectConfig.compileType).toBe('miniprogram');
    expect(projectConfig.miniprogramRoot).toBe('./');
    expect(projectConfig.pluginRoot).toBeUndefined();

    expect(appJson.plugins).toBeUndefined();
    expect(appJson.pages).toEqual(['pages/index/index']);

    const pageJson = JSON.parse(readFileSync(`${demoRoot}/pages/index/index.json`, 'utf8'));
    expect(pageJson.usingComponents['share-card']).toBe('/components/share-card/index');

    const pageSource = readFileSync(`${demoRoot}/pages/index/index.js`, 'utf8');
    expect(pageSource).toContain('card.render');
    expect(pageSource).toContain('card.toTempFilePath');
    expect(pageSource).toContain('demoTemplates');
    expect(pageSource).toContain('selectDemo');
    expect(pageSource).not.toContain('onReady()');

    const pageWxml = readFileSync(`${demoRoot}/pages/index/index.wxml`, 'utf8');
    expect(pageWxml).toContain('<share-card id="shareCard" width="{{359}}" height="{{560}}"></share-card>');
    expect(pageWxml).toContain('wx:for="{{demos}}"');

    const componentSource = readFileSync(`${demoRoot}/components/share-card/index.js`, 'utf8');
    expect(componentSource).toContain('../../runtime/share-card-runtime');
    expect(componentSource).toContain('createImage');
    expect(componentSource).toContain('wx.canvasToTempFilePath');

    const templateSource = readFileSync(`${demoRoot}/templates/index.js`, 'utf8');
    const productWxml = readFileSync(`${demoRoot}/components/product-card/index.wxml`, 'utf8');
    const productJson = JSON.parse(readFileSync(`${demoRoot}/components/product-card/index.json`, 'utf8'));
    expect(productJson.component).toBe(true);
    expect(templateSource).toContain('此文件由 scripts/build-miniapp-demo-templates.mjs 生成');
    expect(templateSource).toContain('generatedFrom');
    expect(templateSource).toContain('articleCard');
    expect(templateSource).toContain('profileCard');
    expect(templateSource).toContain('productCard');
    expect(templateSource).toContain('compositeCard');
    expect(templateSource).toContain('metricsCard');
    expect(templateSource).toContain('deepNestedCard');
    expect(templateSource).toContain('generatedComponents');
    expect(templateSource).toContain('class=\\"card-stat\\"');
    expect(templateSource).toContain('class=\\"info-row\\"');
    expect(templateSource).toContain('class=\\"card-section\\"');
    expect(templateSource).not.toContain('<card-stat');
    expect(templateSource).not.toContain('<card-section');
    expect(templateSource).not.toContain('<info-row');
    expect(templateSource).toContain('wxml');
    expect(templateSource).toContain('wxss');
    expect(templateSource).toContain('<image');
    expect(templateSource).toContain(JSON.stringify(productWxml.trim()).slice(1, -1));
  });
});
