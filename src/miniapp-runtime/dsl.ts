import {
  compileTemplate,
  type CompileTemplateInput,
  type TemplateLength,
  type TemplateNode,
  type TemplateStyleRule,
  type TemplateStyleValue,
} from './template';

export type DslStyleValue = string | number | Array<string | number>;

export type RenderDslNode = {
  tag: TemplateNode['tag'];
  attrs: Record<string, string>;
  text?: string;
  style: Record<string, DslStyleValue>;
  children: RenderDslNode[];
};

export type CompileDslInput = CompileTemplateInput & {
  viewportWidth?: number;
};

export type CompileDslResult = {
  tree: RenderDslNode;
  warnings: string[];
};

type CompileMode = NonNullable<CompileTemplateInput['mode']>;

type CascadeContext = {
  mode: CompileMode;
  viewportWidth: number;
  warnings: string[];
};

type SelectorPart = {
  tag?: string;
  id?: string;
  classes: string[];
};

type ParsedSelector = {
  raw: string;
  parts: SelectorPart[];
  specificity: [number, number, number];
  order: number;
  declarations: Record<string, TemplateStyleValue>;
};

const inheritedProperties = new Set([
  'color',
  'fontSize',
  'fontFamily',
  'fontWeight',
  'fontStyle',
  'lineHeight',
  'letterSpacing',
  'textAlign',
]);

export function compileDsl(input: CompileDslInput): CompileDslResult {
  const compiled = compileTemplate(input);
  const context: CascadeContext = {
    mode: input.mode ?? 'strict',
    viewportWidth: input.viewportWidth ?? 375,
    warnings: [...compiled.warnings],
  };
  const selectors = compiled.styles
    .flatMap((rule, index) => parseSelectorList(rule, index, context))
    .filter((selector): selector is ParsedSelector => selector !== null);

  return {
    tree: buildRenderNode(compiled.root, [], {}, selectors, context),
    warnings: context.warnings,
  };
}

function buildRenderNode(
  node: TemplateNode,
  ancestors: TemplateNode[],
  inheritedStyle: Record<string, DslStyleValue>,
  selectors: ParsedSelector[],
  context: CascadeContext,
): RenderDslNode {
  const style = computeStyle(node, ancestors, inheritedStyle, selectors, context);
  const childInheritedStyle = pickInheritedStyle(style);

  return {
    tag: node.tag,
    attrs: node.attrs,
    text: node.text,
    style,
    children: node.children.map((child) =>
      buildRenderNode(child, [...ancestors, node], childInheritedStyle, selectors, context),
    ),
  };
}

function computeStyle(
  node: TemplateNode,
  ancestors: TemplateNode[],
  inheritedStyle: Record<string, DslStyleValue>,
  selectors: ParsedSelector[],
  context: CascadeContext,
): Record<string, DslStyleValue> {
  const winning = new Map<
    string,
    {
      value: TemplateStyleValue;
      specificity: [number, number, number];
      order: number;
    }
  >();

  for (const selector of selectors) {
    if (!matchesSelector(node, ancestors, selector.parts)) {
      continue;
    }
    for (const [property, value] of Object.entries(selector.declarations)) {
      const current = winning.get(property);
      if (!current || compareSpecificity(selector.specificity, current.specificity) >= 0) {
        winning.set(property, {
          value,
          specificity: selector.specificity,
          order: selector.order,
        });
      } else if (compareSpecificity(selector.specificity, current.specificity) === 0 && selector.order > current.order) {
        winning.set(property, {
          value,
          specificity: selector.specificity,
          order: selector.order,
        });
      }
    }
  }

  const inlineStyle = node.attrs.style ? parseInlineStyle(node.attrs.style, context) : {};
  for (const [property, value] of Object.entries(inlineStyle)) {
    winning.set(property, {
      value,
      specificity: [1, 0, 0],
      order: Number.MAX_SAFE_INTEGER,
    });
  }

  const style: Record<string, DslStyleValue> = { ...inheritedStyle };
  for (const [property, entry] of winning.entries()) {
    style[property] = normalizeStyleValue(entry.value, context);
  }

  return style;
}

function parseSelectorList(rule: TemplateStyleRule, order: number, context: CascadeContext): Array<ParsedSelector | null> {
  return rule.selector
    .split(',')
    .map((selector) => selector.trim())
    .filter(Boolean)
    .map((selector) => parseSelector(selector, rule, order, context));
}

function parseSelector(
  selector: string,
  rule: TemplateStyleRule,
  order: number,
  context: CascadeContext,
): ParsedSelector | null {
  if (!selector || /[>+~:[\]*]/.test(selector)) {
    fail(context, `Unsupported WXSS selector "${selector}".`);
    return null;
  }

  const parts = selector.split(/\s+/).map((part) => parseSelectorPart(part, context));
  if (parts.some((part) => part === null)) {
    return null;
  }

  return {
    raw: selector,
    parts: parts as SelectorPart[],
    specificity: calculateSpecificity(parts as SelectorPart[]),
    order,
    declarations: rule.declarations,
  };
}

function parseSelectorPart(rawPart: string, context: CascadeContext): SelectorPart | null {
  const tagMatch = rawPart.match(/^[a-zA-Z][\w-]*/);
  const idMatches = [...rawPart.matchAll(/#([\w-]+)/g)].map((match) => match[1]);
  const classMatches = [...rawPart.matchAll(/\.([\w-]+)/g)].map((match) => match[1]);
  const consumed = `${tagMatch?.[0] ?? ''}${idMatches.map((id) => `#${id}`).join('')}${classMatches
    .map((className) => `.${className}`)
    .join('')}`;

  if (!rawPart || consumed.length !== rawPart.length || idMatches.length > 1) {
    fail(context, `Unsupported WXSS selector "${rawPart}".`);
    return null;
  }

  return {
    tag: tagMatch?.[0],
    id: idMatches[0],
    classes: classMatches,
  };
}

function matchesSelector(node: TemplateNode, ancestors: TemplateNode[], parts: SelectorPart[]) {
  if (!matchesPart(node, parts[parts.length - 1])) {
    return false;
  }

  let ancestorIndex = ancestors.length - 1;
  for (let partIndex = parts.length - 2; partIndex >= 0; partIndex -= 1) {
    let found = false;
    while (ancestorIndex >= 0) {
      if (matchesPart(ancestors[ancestorIndex], parts[partIndex])) {
        found = true;
        ancestorIndex -= 1;
        break;
      }
      ancestorIndex -= 1;
    }
    if (!found) {
      return false;
    }
  }

  return true;
}

function matchesPart(node: TemplateNode, part: SelectorPart) {
  const nodeClasses = new Set((node.attrs.class ?? '').split(/\s+/).filter(Boolean));
  return (
    (!part.tag || node.tag === part.tag) &&
    (!part.id || node.attrs.id === part.id) &&
    part.classes.every((className) => nodeClasses.has(className))
  );
}

function calculateSpecificity(parts: SelectorPart[]): [number, number, number] {
  return parts.reduce<[number, number, number]>(
    (specificity, part) => [
      specificity[0] + (part.id ? 1 : 0),
      specificity[1] + part.classes.length,
      specificity[2] + (part.tag ? 1 : 0),
    ],
    [0, 0, 0],
  );
}

function compareSpecificity(left: [number, number, number], right: [number, number, number]) {
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return left[index] - right[index];
    }
  }
  return 0;
}

function parseInlineStyle(style: string, context: CascadeContext): Record<string, TemplateStyleValue> {
  const declarations: Record<string, TemplateStyleValue> = {};
  for (const declaration of style.split(';')) {
    const [rawProperty, ...rawValueParts] = declaration.split(':');
    const property = normalizeProperty(rawProperty?.trim());
    const value = rawValueParts.join(':').trim();
    if (!property || !value) {
      continue;
    }
    declarations[property] = parseInlineValue(value);
  }
  return declarations;
}

function normalizeProperty(property: string | undefined) {
  if (!property) {
    return '';
  }
  return property.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function parseInlineValue(value: string): TemplateStyleValue {
  const length = parseLength(value);
  if (length) {
    return length;
  }
  const lengths = value.split(/\s+/).map(parseLength);
  if (lengths.length > 1 && lengths.every(Boolean)) {
    return lengths as TemplateLength[];
  }
  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? value : numericValue;
}

function normalizeStyleValue(value: TemplateStyleValue, context: CascadeContext): DslStyleValue {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeLength(item, context));
  }
  if (isLength(value)) {
    return normalizeLength(value, context);
  }
  return value;
}

function normalizeLength(length: TemplateLength, context: CascadeContext) {
  if (length.unit === 'rpx') {
    return (length.value / 750) * context.viewportWidth;
  }
  if (length.unit === '%') {
    return `${length.value}%`;
  }
  return length.value;
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

function isLength(value: TemplateStyleValue): value is TemplateLength {
  return typeof value === 'object' && value !== null && 'value' in value && 'unit' in value;
}

function pickInheritedStyle(style: Record<string, DslStyleValue>) {
  return Object.fromEntries(Object.entries(style).filter(([property]) => inheritedProperties.has(property)));
}

function fail(context: CascadeContext, message: string): never | void {
  if (context.mode === 'strict') {
    throw new Error(message);
  }
  context.warnings.push(message);
}
