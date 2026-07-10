import { readFile } from 'node:fs/promises';
import { basename, dirname, extname, isAbsolute, join, resolve } from 'node:path';

export async function readTemplateFiles({ wxmlPath, wxssPath }) {
  if (!wxmlPath) {
    throw new Error('必须提供 WXML 文件路径。');
  }

  const wxml = await readTemplateFile(wxmlPath, 'WXML');
  const wxss = wxssPath ? await readTemplateFile(wxssPath, 'WXSS') : '';

  return {
    wxml,
    wxss,
  };
}

export async function readMiniappComponentDirectory({ dir, entry = 'index' }) {
  if (!dir) {
    throw new Error('必须提供小程序组件目录路径。');
  }

  const files = {
    wxml: join(dir, `${entry}.wxml`),
    wxss: join(dir, `${entry}.wxss`),
    js: join(dir, `${entry}.js`),
    json: join(dir, `${entry}.json`),
  };

  const wxml = await readTemplateFile(files.wxml, '组件 WXML');
  const wxss = await readOptionalTemplateFile(files.wxss, '组件 WXSS');
  const js = await readOptionalTemplateFile(files.js, '组件 JS');
  const json = await readOptionalTemplateFile(files.json, '组件 JSON');

  return {
    dir,
    entry,
    wxml,
    wxss,
    js,
    json,
    files,
  };
}

export async function readMiniappComponentTree({ dir, entry = 'index', projectRoot, ancestors = [] }) {
  const componentKey = resolve(dir, entry);
  if (ancestors.includes(componentKey)) {
    throw new Error(`小程序自定义组件存在循环引用：${[...ancestors, componentKey].join(' -> ')}`);
  }

  const source = await readMiniappComponentDirectory({ dir, entry });
  const config = parseComponentJson(source.json, source.files.json);
  const usingComponents = config.usingComponents ?? {};
  const components = [];
  let wxml = source.wxml;
  const wxssParts = [source.wxss];

  for (const [tag, reference] of Object.entries(usingComponents)) {
    const location = resolveComponentReference(reference, dir, projectRoot);
    const child = await readMiniappComponentTree({
      ...location,
      projectRoot,
      ancestors: [...ancestors, componentKey],
    });
    wxml = expandComponentTag(wxml, tag, child.wxml);
    wxssParts.push(child.wxss);
    components.push({
      tag,
      dir: location.dir,
      entry: location.entry,
      components: child.components,
    });
  }

  return {
    ...source,
    wxml,
    wxss: wxssParts.filter(Boolean).join('\n'),
    components,
  };
}

function parseComponentJson(json, filePath) {
  if (!json.trim()) {
    return {};
  }
  try {
    return JSON.parse(json);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`解析组件 JSON 文件失败：${filePath}。${reason}`);
  }
}

function resolveComponentReference(reference, parentDir, projectRoot) {
  if (typeof reference !== 'string' || reference.startsWith('plugin://')) {
    throw new Error(`暂不支持的小程序组件引用：${String(reference)}`);
  }
  const target = reference.startsWith('/')
    ? resolve(projectRoot ?? parentDir, `.${reference}`)
    : resolve(parentDir, reference);
  const extension = extname(target);
  const normalizedTarget = extension ? target.slice(0, -extension.length) : target;
  return {
    dir: dirname(normalizedTarget),
    entry: basename(normalizedTarget),
  };
}

function expandComponentTag(wxml, tag, childWxml) {
  const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const selfClosingPattern = new RegExp(`<${escapedTag}\\b([^>]*)\\/>`, 'g');
  const pairedPattern = new RegExp(`<${escapedTag}\\b([^>]*)>[\\s\\S]*?<\\/${escapedTag}>`, 'g');
  const replace = (_match, rawAttrs) => applyComponentProperties(childWxml, parseRawAttributes(rawAttrs));
  return wxml.replace(selfClosingPattern, replace).replace(pairedPattern, replace);
}

function parseRawAttributes(rawAttrs) {
  const attrs = {};
  const attrPattern = /([:@\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>/]+)))?/g;
  let match;
  while ((match = attrPattern.exec(rawAttrs))) {
    attrs[match[1]] = match[2] ?? match[3] ?? match[4] ?? 'true';
  }
  return attrs;
}

function applyComponentProperties(wxml, attrs) {
  return wxml.replace(/{{\s*([A-Za-z_$][\w$]*)\s*}}/g, (expression, name) => attrs[name] ?? expression);
}

async function readTemplateFile(filePath, label) {
  try {
    return await readFile(filePath, 'utf8');
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`读取${label}文件失败：${filePath}。${reason}`);
  }
}

async function readOptionalTemplateFile(filePath, label) {
  try {
    return await readFile(filePath, 'utf8');
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return '';
    }
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`读取${label}文件失败：${filePath}。${reason}`);
  }
}
