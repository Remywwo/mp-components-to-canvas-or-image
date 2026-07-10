import { compileLayout, type CompileLayoutResult, type LayoutBox } from './layout';
import type { CompileDslInput, DslStyleValue } from './dsl';

export type RectCommand = {
  type: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  radius: number;
};

export type TextCommand = {
  type: 'text';
  text: string;
  lines: string[];
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  fontSize: number;
  fontWeight: string | number;
  lineHeight: number;
  fontFamily: string;
  textAlign: string;
};

export type ImageCommand = {
  type: 'image';
  src: unknown;
  source?: string;
  intrinsicWidth?: number;
  intrinsicHeight?: number;
  x: number;
  y: number;
  width: number;
  height: number;
  objectFit: 'cover' | 'contain' | 'fill';
  radius: number;
};

export type CanvasCommand = RectCommand | TextCommand | ImageCommand;

export type CompileCanvasCommandsResult = CompileLayoutResult & {
  commands: CanvasCommand[];
};

export function compileCanvasCommands(input: CompileDslInput): CompileCanvasCommandsResult {
  const layout = compileLayout(input);
  return {
    ...layout,
    commands: collectCommands(layout.box),
  };
}

function collectCommands(box: LayoutBox): CanvasCommand[] {
  const commands: CanvasCommand[] = [];
  const background = getBackground(box);
  if (background) {
    commands.push({
      type: 'rect',
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
      fill: background,
      radius: getNumber(box.style.borderRadius, 0),
    });
  }

  if (box.tag === 'text' && box.text) {
    const fontSize = getNumber(box.style.fontSize, 16);
    const lineHeight = resolveLineHeight(box.style.lineHeight, fontSize);
    commands.push({
      type: 'text',
      text: box.text,
      lines: wrapText(box.text, box.width, fontSize),
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
      color: getString(box.style.color, '#000000'),
      fontSize,
      fontWeight: getStringOrNumber(box.style.fontWeight, 400),
      lineHeight,
      fontFamily: getString(box.style.fontFamily, 'sans-serif'),
      textAlign: getString(box.style.textAlign, 'left'),
    });
  }

  if (box.tag === 'image') {
    commands.push({
      type: 'image',
      src: box.attrs.src ?? '',
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
      objectFit: resolveObjectFit(box),
      radius: getNumber(box.style.borderRadius, 0),
    });
  }

  for (const child of box.children) {
    commands.push(...collectCommands(child));
  }

  return commands.map(roundCommand);
}

function getBackground(box: LayoutBox) {
  return getOptionalString(box.style.backgroundColor) ?? getOptionalString(box.style.background);
}

function resolveObjectFit(box: LayoutBox): ImageCommand['objectFit'] {
  const styleFit = getOptionalString(box.style.objectFit);
  if (styleFit === 'cover' || styleFit === 'contain' || styleFit === 'fill') {
    return styleFit;
  }
  if (box.attrs.mode === 'aspectFit') {
    return 'contain';
  }
  if (box.attrs.mode === 'aspectFill') {
    return 'cover';
  }
  return 'fill';
}

function resolveLineHeight(value: DslStyleValue | undefined, fontSize: number) {
  if (typeof value === 'number') {
    return value <= 4 ? value * fontSize : value;
  }
  return fontSize * 1.2;
}

function getNumber(value: DslStyleValue | undefined, fallback: number) {
  return typeof value === 'number' ? value : fallback;
}

function getString(value: DslStyleValue | undefined, fallback: string) {
  return typeof value === 'string' ? value : fallback;
}

function getOptionalString(value: DslStyleValue | undefined) {
  return typeof value === 'string' ? value : undefined;
}

function getStringOrNumber(value: DslStyleValue | undefined, fallback: string | number) {
  return typeof value === 'string' || typeof value === 'number' ? value : fallback;
}

function roundCommand<T extends CanvasCommand>(command: T): T {
  return Object.fromEntries(
    Object.entries(command).map(([key, value]) => [key, typeof value === 'number' ? round(value) : value]),
  ) as T;
}

function round(value: number) {
  return Math.round(value * 1000) / 1000;
}

function wrapText(text: string, width: number, fontSize: number) {
  const lines: string[] = [];
  let currentLine = '';
  let currentWidth = 0;

  for (const char of text) {
    const charWidth = estimateCharWidth(char, fontSize);
    if (currentLine && currentWidth + charWidth > width) {
      lines.push(currentLine);
      currentLine = char;
      currentWidth = charWidth;
      continue;
    }

    currentLine += char;
    currentWidth += charWidth;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [''];
}

function estimateCharWidth(char: string, fontSize: number) {
  return isFullWidthChar(char) ? fontSize : fontSize * 0.56;
}

function isFullWidthChar(char: string) {
  return /[\u1100-\u115f\u2e80-\u9fff\uf900-\ufaff\uff00-\uffef]/u.test(char);
}
