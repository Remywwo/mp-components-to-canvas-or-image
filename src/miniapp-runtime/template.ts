type CompileMode = 'strict' | 'loose';
type SupportedTag = 'view' | 'text' | 'image';

export type TemplateLength = {
  value: number;
  unit: 'px' | 'rpx' | '%';
};

export type TemplateStyleValue = TemplateLength | TemplateLength[] | string | number;

export type TemplateStyleRule = {
  selector: string;
  declarations: Record<string, TemplateStyleValue>;
};

export type TemplateNode = {
  tag: SupportedTag;
  attrs: Record<string, string>;
  children: TemplateNode[];
  text?: string;
};

export type CompileTemplateInput = {
  wxml: string;
  wxss: string;
  data?: Record<string, unknown>;
  mode?: CompileMode;
};

export type CompileTemplateResult = {
  root: TemplateNode;
  styles: TemplateStyleRule[];
  warnings: string[];
};

type InternalNode = TemplateNode & {
  unsupported?: boolean;
};

type CompilerContext = {
  data: Record<string, unknown>;
  mode: CompileMode;
  warnings: string[];
};

const supportedTags = new Set(['view', 'text', 'image']);
const selfClosingTags = new Set(['image']);

const supportedAttributes: Record<SupportedTag, Set<string>> = {
  view: new Set(['id', 'class', 'style']),
  text: new Set(['id', 'class', 'style', 'selectable', 'space', 'decode']),
  image: new Set(['id', 'class', 'style', 'src', 'mode']),
};

const propertyMap: Record<string, string> = {
  width: 'width',
  height: 'height',
  'min-width': 'minWidth',
  'min-height': 'minHeight',
  'max-width': 'maxWidth',
  'max-height': 'maxHeight',
  padding: 'padding',
  'padding-top': 'paddingTop',
  'padding-right': 'paddingRight',
  'padding-bottom': 'paddingBottom',
  'padding-left': 'paddingLeft',
  margin: 'margin',
  'margin-top': 'marginTop',
  'margin-right': 'marginRight',
  'margin-bottom': 'marginBottom',
  'margin-left': 'marginLeft',
  gap: 'gap',
  display: 'display',
  'flex-direction': 'flexDirection',
  'justify-content': 'justifyContent',
  'align-items': 'alignItems',
  'align-self': 'alignSelf',
  'flex-grow': 'flexGrow',
  'flex-shrink': 'flexShrink',
  'flex-basis': 'flexBasis',
  position: 'position',
  top: 'top',
  right: 'right',
  bottom: 'bottom',
  left: 'left',
  background: 'background',
  'background-color': 'backgroundColor',
  color: 'color',
  opacity: 'opacity',
  'border-radius': 'borderRadius',
  'border-width': 'borderWidth',
  'border-color': 'borderColor',
  'border-style': 'borderStyle',
  'box-shadow': 'boxShadow',
  overflow: 'overflow',
  'font-size': 'fontSize',
  'font-family': 'fontFamily',
  'font-weight': 'fontWeight',
  'font-style': 'fontStyle',
  'line-height': 'lineHeight',
  'text-align': 'textAlign',
  'letter-spacing': 'letterSpacing',
  'object-fit': 'objectFit',
};

const enumValues: Record<string, Set<string>> = {
  display: new Set(['flex', 'block', 'inline-block', 'none']),
  flexDirection: new Set(['row', 'row-reverse', 'column', 'column-reverse']),
  justifyContent: new Set(['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly']),
  alignItems: new Set(['stretch', 'flex-start', 'flex-end', 'center', 'baseline']),
  alignSelf: new Set(['auto', 'stretch', 'flex-start', 'flex-end', 'center', 'baseline']),
  position: new Set(['static', 'relative', 'absolute', 'fixed']),
  borderStyle: new Set(['solid', 'dashed', 'dotted', 'none']),
  overflow: new Set(['hidden', 'visible']),
  fontStyle: new Set(['normal', 'italic']),
  textAlign: new Set(['left', 'center', 'right']),
  objectFit: new Set(['cover', 'contain', 'fill']),
};

export function compileTemplate(input: CompileTemplateInput): CompileTemplateResult {
  const context: CompilerContext = {
    data: input.data ?? {},
    mode: input.mode ?? 'strict',
    warnings: [],
  };

  return {
    root: parseWxml(input.wxml, context),
    styles: parseWxss(input.wxss, context),
    warnings: context.warnings,
  };
}

function parseWxml(wxml: string, context: CompilerContext): TemplateNode {
  const roots: InternalNode[] = [];
  const stack: InternalNode[] = [];
  const tokenPattern = /<!--[\s\S]*?-->|<\/?[a-zA-Z][\w:-]*(?:\s+[^<>]*?)?\s*\/?>|[^<]+/g;
  let lastIndex = 0;
  let unsupportedDepth = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenPattern.exec(wxml))) {
    if (match.index !== lastIndex && wxml.slice(lastIndex, match.index).trim()) {
      fail(context, 'Malformed WXML near unsupported markup.');
    }
    lastIndex = tokenPattern.lastIndex;

    const token = match[0];
    if (token.startsWith('<!--')) {
      continue;
    }

    if (unsupportedDepth > 0) {
      if (token.startsWith('</')) {
        unsupportedDepth -= 1;
      } else if (token.startsWith('<') && !token.endsWith('/>')) {
        unsupportedDepth += 1;
      }
      continue;
    }

    if (token.startsWith('</')) {
      const tag = token.slice(2, -1).trim();
      closeTag(tag, stack, context);
      continue;
    }

    if (token.startsWith('<')) {
      const isSelfClosing = token.endsWith('/>');
      const tagMatch = token.match(/^<([a-zA-Z][\w:-]*)([\s\S]*?)\/?>$/);
      if (!tagMatch) {
        fail(context, 'Malformed WXML tag.');
        continue;
      }
      const [, tagName, rawAttrs] = tagMatch;
      if (!supportedTags.has(tagName) && context.mode === 'loose') {
        fail(context, `Unsupported WXML tag <${tagName}>.`);
        if (!isSelfClosing) {
          unsupportedDepth = 1;
        }
        continue;
      }
      const node = createNode(tagName, rawAttrs, context);
      if (!node) {
        continue;
      }
      appendNode(node, stack, roots);
      if (!isSelfClosing && !selfClosingTags.has(node.tag)) {
        stack.push(node);
      }
      continue;
    }

    appendText(token, stack, context);
  }

  if (lastIndex !== wxml.length && wxml.slice(lastIndex).trim()) {
    fail(context, 'Malformed WXML near trailing content.');
  }
  if (stack.length > 0) {
    fail(context, `Unclosed WXML tag <${stack[stack.length - 1].tag}>.`);
  }
  if (roots.length !== 1) {
    fail(context, 'WXML template must contain exactly one root node.');
  }

  return roots[0];
}

function closeTag(tag: string, stack: InternalNode[], context: CompilerContext) {
  const current = stack.pop();
  if (!current || current.tag !== tag) {
    fail(context, `Mismatched closing tag </${tag}>.`);
  }
}

function createNode(tagName: string, rawAttrs: string, context: CompilerContext): InternalNode | null {
  if (!supportedTags.has(tagName)) {
    fail(context, `Unsupported WXML tag <${tagName}>.`);
    return null;
  }

  const tag = tagName as SupportedTag;
  const attrs = parseAttributes(rawAttrs, tag, context);
  return {
    tag,
    attrs,
    children: [],
  };
}

function parseAttributes(rawAttrs: string, tag: SupportedTag, context: CompilerContext): Record<string, string> {
  const attrs: Record<string, string> = {};
  const attrPattern = /([:@\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>/]+)))?/g;
  let match: RegExpExecArray | null;

  while ((match = attrPattern.exec(rawAttrs))) {
    const name = match[1];
    const value = match[2] ?? match[3] ?? match[4] ?? 'true';
    if (!supportedAttributes[tag].has(name)) {
      fail(context, `Unsupported WXML attribute "${name}" on <${tag}>.`);
      continue;
    }
    attrs[name] = resolveBindings(value, context.data);
  }

  return attrs;
}

function appendNode(node: InternalNode, stack: InternalNode[], roots: InternalNode[]) {
  const parent = stack[stack.length - 1];
  if (parent) {
    parent.children.push(node);
    return;
  }
  roots.push(node);
}

function appendText(rawText: string, stack: InternalNode[], context: CompilerContext) {
  const text = resolveBindings(rawText, context.data).replace(/\s+/g, ' ').trim();
  if (!text) {
    return;
  }

  const parent = stack[stack.length - 1];
  if (!parent) {
    fail(context, 'Text content must be inside a supported WXML node.');
    return;
  }

  if (parent.tag === 'text') {
    parent.text = parent.text ? `${parent.text}${text}` : text;
    return;
  }

  parent.children.push({
    tag: 'text',
    attrs: {},
    children: [],
    text,
  });
}

function parseWxss(wxss: string, context: CompilerContext): TemplateStyleRule[] {
  const rules: TemplateStyleRule[] = [];
  const source = wxss.replace(/\/\*[\s\S]*?\*\//g, '');
  const rulePattern = /([^{}]+)\{([^{}]*)\}/g;
  let match: RegExpExecArray | null;

  while ((match = rulePattern.exec(source))) {
    const selector = match[1].trim().replace(/\s+/g, ' ');
    if (!selector) {
      continue;
    }
    rules.push({
      selector,
      declarations: parseDeclarations(selector, match[2], context),
    });
  }

  return rules;
}

function parseDeclarations(
  selector: string,
  body: string,
  context: CompilerContext,
): Record<string, TemplateStyleValue> {
  const declarations: Record<string, TemplateStyleValue> = {};

  for (const declaration of body.split(';')) {
    const [rawProperty, ...rawValueParts] = declaration.split(':');
    const property = rawProperty?.trim();
    const rawValue = rawValueParts.join(':').trim();
    if (!property || !rawValue) {
      continue;
    }

    const normalizedProperty = property.toLowerCase();
    const outputProperty = propertyMap[normalizedProperty];
    if (!outputProperty) {
      fail(context, `Unsupported WXSS property "${normalizedProperty}" in selector "${selector}".`);
      continue;
    }

    const parsedValue = parseStyleValue(outputProperty, rawValue, selector, context);
    if (parsedValue !== undefined) {
      declarations[outputProperty] = parsedValue;
    }
  }

  return declarations;
}

function parseStyleValue(
  property: string,
  rawValue: string,
  selector: string,
  context: CompilerContext,
): TemplateStyleValue | undefined {
  const value = rawValue.trim();
  const allowedEnum = enumValues[property];
  if (allowedEnum) {
    if (!allowedEnum.has(value)) {
      fail(context, `Unsupported WXSS value "${value}" for "${toKebabCase(property)}" in selector "${selector}".`);
      return undefined;
    }
    return value;
  }

  if (property === 'fontWeight') {
    const numericWeight = Number(value);
    return Number.isNaN(numericWeight) ? value : numericWeight;
  }

  if (property === 'opacity' || property === 'flexGrow' || property === 'flexShrink' || property === 'lineHeight') {
    const numericValue = Number(value);
    if (!Number.isNaN(numericValue)) {
      return numericValue;
    }
  }

  if (property === 'padding' || property === 'margin') {
    const lengths = value.split(/\s+/).map(parseLength);
    if (lengths.every(Boolean) && lengths.length >= 1 && lengths.length <= 4) {
      return lengths as TemplateLength[];
    }
  }

  const length = parseLength(value);
  if (length) {
    return length;
  }

  return value;
}

function parseLength(value: string): TemplateLength | null {
  const match = value.match(/^(-?\d+(?:\.\d+)?)(px|rpx|%)$/);
  if (!match) {
    return null;
  }

  return {
    value: Number(match[1]),
    unit: match[2] as TemplateLength['unit'],
  };
}

function resolveBindings(value: string, data: Record<string, unknown>): string {
  return value.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path: string) => {
    const resolved = path.split('.').reduce<unknown>((current, key) => {
      if (current && typeof current === 'object' && key in current) {
        return (current as Record<string, unknown>)[key];
      }
      return '';
    }, data);
    return resolved == null ? '' : String(resolved);
  });
}

function fail(context: CompilerContext, message: string): never | void {
  if (context.mode === 'strict') {
    throw new Error(message);
  }
  context.warnings.push(message);
}

function toKebabCase(value: string) {
  return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}
