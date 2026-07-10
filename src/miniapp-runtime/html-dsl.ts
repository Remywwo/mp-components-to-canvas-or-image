import {
  compileTemplate,
  type CompileTemplateInput,
  type TemplateNode,
  type TemplateStyleRule,
  type TemplateStyleValue,
} from './template';

export type HtmlDslNode = {
  tag: 'div' | 'span' | 'img';
  attrs: Record<string, string>;
  children: HtmlDslNode[];
  text?: string;
};

export type HtmlDsl = {
  root: HtmlDslNode;
  css: string;
};

export type CompileWxmlToHtmlResult = {
  dsl: HtmlDsl;
  html: string;
  css: string;
  warnings: string[];
};

const tagMap: Record<TemplateNode['tag'], HtmlDslNode['tag']> = {
  view: 'div',
  text: 'span',
  image: 'img',
};

export function compileWxmlToHtml(input: CompileTemplateInput): CompileWxmlToHtmlResult {
  const template = compileTemplate(input);
  const css = renderCss(template.styles);
  const root = toHtmlNode(template.root);
  const html = renderHtml(root);

  return {
    dsl: {
      root,
      css,
    },
    html,
    css,
    warnings: template.warnings,
  };
}

function toHtmlNode(node: TemplateNode): HtmlDslNode {
  const tag = tagMap[node.tag];
  const attrs = mapAttrs(node);

  return {
    tag,
    attrs,
    text: node.text,
    children: node.children.map(toHtmlNode),
  };
}

function mapAttrs(node: TemplateNode): Record<string, string> {
  const attrs: Record<string, string> = {};
  let mode: string | undefined;
  for (const [name, value] of Object.entries(node.attrs)) {
    if (name === 'mode') {
      mode = value;
      continue;
    }
    attrs[name] = value;
  }

  if (node.tag === 'image') {
    attrs.alt = attrs.alt ?? '';
  }

  attrs['data-wxml-tag'] = node.tag;
  if (mode) {
    attrs['data-wxml-mode'] = mode;
  }
  return attrs;
}

function renderHtml(node: HtmlDslNode): string {
  const attrs = renderAttrs(node.attrs);
  if (node.tag === 'img') {
    return `<img${attrs} />`;
  }

  const text = node.text ? escapeHtml(node.text) : '';
  const children = node.children.map(renderHtml).join('');
  return `<${node.tag}${attrs}>${text}${children}</${node.tag}>`;
}

function renderAttrs(attrs: Record<string, string>) {
  const rendered = Object.entries(attrs)
    .filter(([, value]) => value !== undefined)
    .map(([name, value]) => `${name}="${escapeAttr(value)}"`);
  return rendered.length > 0 ? ` ${rendered.join(' ')}` : '';
}

function renderCss(rules: TemplateStyleRule[]) {
  return rules
    .map((rule) => {
      const declarations = Object.entries(rule.declarations)
        .map(([property, value]) => `  ${toKebabCase(property)}: ${renderStyleValue(value)};`)
        .join('\n');
      return declarations ? `${rule.selector} {\n${declarations}\n}` : '';
    })
    .filter(Boolean)
    .join('\n\n');
}

function renderStyleValue(value: TemplateStyleValue): string {
  if (Array.isArray(value)) {
    return value.map(renderStyleValue).join(' ');
  }
  if (typeof value === 'object' && value !== null && 'value' in value && 'unit' in value) {
    return `${value.value}${value.unit}`;
  }
  return String(value);
}

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(value: string) {
  return escapeHtml(value).replace(/"/g, '&quot;');
}

function toKebabCase(value: string) {
  return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}
