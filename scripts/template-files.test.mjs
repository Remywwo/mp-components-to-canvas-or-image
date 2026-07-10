import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import {
  readMiniappComponentDirectory,
  readMiniappComponentTree,
  readTemplateFiles,
} from './template-files.mjs';

const fixtureDir = join(tmpdir(), 'generate-sharing-template-files-test');

describe('template files', () => {
  it('reads wxml and wxss files as strings', async () => {
    await rm(fixtureDir, { recursive: true, force: true });
    await mkdir(fixtureDir, { recursive: true });
    const wxmlPath = join(fixtureDir, 'card.wxml');
    const wxssPath = join(fixtureDir, 'card.wxss');

    await writeFile(wxmlPath, '<view class="card">\n  <text>{{title}}</text>\n</view>\n', 'utf8');
    await writeFile(wxssPath, '.card {\n  width: 750rpx;\n}\n', 'utf8');

    await expect(readTemplateFiles({ wxmlPath, wxssPath })).resolves.toEqual({
      wxml: '<view class="card">\n  <text>{{title}}</text>\n</view>\n',
      wxss: '.card {\n  width: 750rpx;\n}\n',
    });
  });

  it('uses empty wxss when wxss path is not provided', async () => {
    await mkdir(fixtureDir, { recursive: true });
    const wxmlPath = join(fixtureDir, 'only-wxml.wxml');
    await writeFile(wxmlPath, '<text>Hello</text>', 'utf8');

    await expect(readTemplateFiles({ wxmlPath })).resolves.toEqual({
      wxml: '<text>Hello</text>',
      wxss: '',
    });
  });

  it('throws a clear error when a file cannot be read', async () => {
    await expect(
      readTemplateFiles({
        wxmlPath: join(fixtureDir, 'missing.wxml'),
        wxssPath: join(fixtureDir, 'missing.wxss'),
      }),
    ).rejects.toThrow(/读取WXML文件失败/);
  });

  it('reads a mini program component directory with index files', async () => {
    const componentDir = join(fixtureDir, 'components', 'share-card');
    await rm(componentDir, { recursive: true, force: true });
    await mkdir(componentDir, { recursive: true });

    await writeFile(join(componentDir, 'index.wxml'), '<view class="card"></view>', 'utf8');
    await writeFile(join(componentDir, 'index.wxss'), '.card { width: 750rpx; }', 'utf8');
    await writeFile(join(componentDir, 'index.js'), 'Component({});', 'utf8');
    await writeFile(join(componentDir, 'index.json'), '{ "component": true }', 'utf8');

    await expect(readMiniappComponentDirectory({ dir: componentDir })).resolves.toEqual({
      dir: componentDir,
      entry: 'index',
      wxml: '<view class="card"></view>',
      wxss: '.card { width: 750rpx; }',
      js: 'Component({});',
      json: '{ "component": true }',
      files: {
        wxml: join(componentDir, 'index.wxml'),
        wxss: join(componentDir, 'index.wxss'),
        js: join(componentDir, 'index.js'),
        json: join(componentDir, 'index.json'),
      },
    });
  });

  it('supports a custom mini program component entry name', async () => {
    const componentDir = join(fixtureDir, 'components', 'avatar');
    await rm(componentDir, { recursive: true, force: true });
    await mkdir(componentDir, { recursive: true });

    await writeFile(join(componentDir, 'avatar.wxml'), '<image src="{{src}}" />', 'utf8');
    await writeFile(join(componentDir, 'avatar.wxss'), 'image { width: 80rpx; }', 'utf8');

    const result = await readMiniappComponentDirectory({ dir: componentDir, entry: 'avatar' });

    expect(result.wxml).toBe('<image src="{{src}}" />');
    expect(result.wxss).toBe('image { width: 80rpx; }');
    expect(result.js).toBe('');
    expect(result.json).toBe('');
  });

  it('throws a clear error when component wxml is missing', async () => {
    const componentDir = join(fixtureDir, 'components', 'missing-wxml');
    await rm(componentDir, { recursive: true, force: true });
    await mkdir(componentDir, { recursive: true });

    await expect(readMiniappComponentDirectory({ dir: componentDir })).rejects.toThrow(/读取组件 WXML文件失败/);
  });

  it('expands nested custom components from usingComponents', async () => {
    const componentsDir = join(fixtureDir, 'nested-components');
    const parentDir = join(componentsDir, 'feature-card');
    const childDir = join(componentsDir, 'info-row');
    await rm(componentsDir, { recursive: true, force: true });
    await mkdir(parentDir, { recursive: true });
    await mkdir(childDir, { recursive: true });

    await writeFile(
      join(parentDir, 'index.wxml'),
      '<view class="feature"><info-row label="作者" value="{{author}}" /></view>',
      'utf8',
    );
    await writeFile(join(parentDir, 'index.wxss'), '.feature { padding: 24rpx; }', 'utf8');
    await writeFile(
      join(parentDir, 'index.json'),
      JSON.stringify({ component: true, usingComponents: { 'info-row': '../info-row/index' } }),
      'utf8',
    );
    await writeFile(
      join(childDir, 'index.wxml'),
      '<view class="info-row"><text>{{label}}</text><text>{{value}}</text></view>',
      'utf8',
    );
    await writeFile(join(childDir, 'index.wxss'), '.info-row { display: flex; }', 'utf8');
    await writeFile(join(childDir, 'index.json'), '{ "component": true }', 'utf8');

    const result = await readMiniappComponentTree({ dir: parentDir });

    expect(result.wxml).toBe(
      '<view class="feature"><view class="info-row"><text>作者</text><text>{{author}}</text></view></view>',
    );
    expect(result.wxss).toContain('.feature { padding: 24rpx; }');
    expect(result.wxss).toContain('.info-row { display: flex; }');
    expect(result.components).toEqual([
      expect.objectContaining({ tag: 'info-row', dir: childDir, entry: 'index' }),
    ]);
  });

  it('rejects cyclic custom component references', async () => {
    const componentsDir = join(fixtureDir, 'cyclic-components');
    const firstDir = join(componentsDir, 'first');
    const secondDir = join(componentsDir, 'second');
    await rm(componentsDir, { recursive: true, force: true });
    await mkdir(firstDir, { recursive: true });
    await mkdir(secondDir, { recursive: true });
    await writeFile(join(firstDir, 'index.wxml'), '<second />', 'utf8');
    await writeFile(
      join(firstDir, 'index.json'),
      JSON.stringify({ component: true, usingComponents: { second: '../second/index' } }),
      'utf8',
    );
    await writeFile(join(secondDir, 'index.wxml'), '<first />', 'utf8');
    await writeFile(
      join(secondDir, 'index.json'),
      JSON.stringify({ component: true, usingComponents: { first: '../first/index' } }),
      'utf8',
    );

    await expect(readMiniappComponentTree({ dir: firstDir })).rejects.toThrow(/循环引用/);
  });
});
