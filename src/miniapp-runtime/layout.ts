import { compileDsl, type CompileDslInput, type DslStyleValue, type RenderDslNode } from './dsl';

export type LayoutBox = {
  tag: RenderDslNode['tag'];
  attrs: Record<string, string>;
  text?: string;
  style: RenderDslNode['style'];
  x: number;
  y: number;
  width: number;
  height: number;
  children: LayoutBox[];
};

export type CompileLayoutResult = {
  box: LayoutBox;
  warnings: string[];
};

type LayoutContext = {
  viewportWidth: number;
};

type Edges = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export function compileLayout(input: CompileDslInput): CompileLayoutResult {
  const dsl = compileDsl(input);
  const context: LayoutContext = {
    viewportWidth: input.viewportWidth ?? 375,
  };

  return {
    box: layoutNode(dsl.tree, 0, 0, context.viewportWidth, context),
    warnings: dsl.warnings,
  };
}

function layoutNode(node: RenderDslNode, x: number, y: number, availableWidth: number, context: LayoutContext): LayoutBox {
  const width = getNumber(node.style.width, availableWidth);
  const padding = getEdges(node.style.padding);
  const contentWidth = Math.max(0, width - padding.left - padding.right);
  const explicitHeight = getOptionalNumber(node.style.height);
  const children =
    node.children.length === 0
      ? []
      : layoutChildren(node, x + padding.left, y + padding.top, contentWidth, context);
  const contentHeight =
    node.tag === 'text'
      ? measureTextHeight(node.text ?? '', contentWidth, node.style)
      : calculateChildrenHeight(node, children, padding);
  const height = explicitHeight ?? contentHeight + padding.top + padding.bottom;

  return {
    tag: node.tag,
    attrs: node.attrs,
    text: node.text,
    style: node.style,
    x,
    y,
    width,
    height,
    children: alignChildren(node, children, x, y, width, height, padding),
  };
}

function layoutChildren(
  node: RenderDslNode,
  contentX: number,
  contentY: number,
  contentWidth: number,
  context: LayoutContext,
) {
  const direction = node.style.flexDirection === 'row' ? 'row' : 'column';
  const gap = getOptionalNumber(node.style.gap) ?? 0;
  let cursorX = contentX;
  let cursorY = contentY;
  const children: LayoutBox[] = [];

  for (const child of node.children) {
    const childBox = layoutNode(child, cursorX, cursorY, getNumber(child.style.width, contentWidth), context);
    children.push(childBox);
    if (direction === 'row') {
      cursorX += childBox.width + gap;
    } else {
      cursorY += childBox.height + gap;
    }
  }

  return children;
}

function alignChildren(
  node: RenderDslNode,
  children: LayoutBox[],
  x: number,
  y: number,
  width: number,
  height: number,
  padding: Edges,
) {
  if (node.style.flexDirection !== 'row' || node.style.alignItems !== 'center') {
    return children;
  }

  const contentHeight = Math.max(0, height - padding.top - padding.bottom);
  return children.map((child) => ({
    ...child,
    y: y + padding.top + (contentHeight - child.height) / 2,
  }));
}

function calculateChildrenHeight(node: RenderDslNode, children: LayoutBox[], padding: Edges) {
  if (children.length === 0) {
    return getOptionalNumber(node.style.height) ?? 0;
  }

  if (node.style.flexDirection === 'row') {
    return Math.max(...children.map((child) => child.height));
  }

  const first = children[0];
  const last = children[children.length - 1];
  return last.y + last.height - first.y;
}

function measureTextHeight(text: string, width: number, style: Record<string, DslStyleValue>) {
  const fontSize = getOptionalNumber(style.fontSize) ?? 16;
  const lineHeight = resolveLineHeight(style.lineHeight, fontSize);
  const lineCount = measureTextLineCount(text, width, fontSize);
  return round(lineCount * lineHeight);
}

function measureTextLineCount(text: string, width: number, fontSize: number) {
  if (!text) {
    return 1;
  }

  let lineCount = 1;
  let currentWidth = 0;
  for (const char of text) {
    const charWidth = estimateCharWidth(char, fontSize);
    if (currentWidth > 0 && currentWidth + charWidth > width) {
      lineCount += 1;
      currentWidth = charWidth;
      continue;
    }
    currentWidth += charWidth;
  }
  return lineCount;
}

function estimateCharWidth(char: string, fontSize: number) {
  return isFullWidthChar(char) ? fontSize : fontSize * 0.56;
}

function isFullWidthChar(char: string) {
  return /[\u1100-\u115f\u2e80-\u9fff\uf900-\ufaff\uff00-\uffef]/u.test(char);
}

function resolveLineHeight(value: DslStyleValue | undefined, fontSize: number) {
  if (typeof value === 'number') {
    return value <= 4 ? value * fontSize : value;
  }
  return fontSize * 1.2;
}

function getEdges(value: DslStyleValue | undefined): Edges {
  if (!Array.isArray(value)) {
    const edge = getNumber(value, 0);
    return { top: edge, right: edge, bottom: edge, left: edge };
  }

  const [top, right = top, bottom = top, left = right] = value;
  return {
    top: getNumber(top, 0),
    right: getNumber(right, 0),
    bottom: getNumber(bottom, 0),
    left: getNumber(left, 0),
  };
}

function getNumber(value: DslStyleValue | undefined, fallback: number) {
  if (typeof value === 'string' && value.endsWith('%')) {
    return (Number(value.slice(0, -1)) / 100) * fallback;
  }
  return typeof value === 'number' ? value : fallback;
}

function getOptionalNumber(value: DslStyleValue | undefined) {
  return typeof value === 'number' ? value : undefined;
}

function round(value: number) {
  return Math.round(value * 1000) / 1000;
}
