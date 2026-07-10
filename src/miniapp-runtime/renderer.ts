import type { CanvasCommand, ImageCommand, RectCommand, TextCommand } from './canvas';

export type MiniappCanvasContext = {
  save?: () => void;
  restore?: () => void;
  beginPath?: () => void;
  moveTo?: (x: number, y: number) => void;
  lineTo?: (x: number, y: number) => void;
  quadraticCurveTo?: (cpx: number, cpy: number, x: number, y: number) => void;
  closePath?: () => void;
  clip?: () => void;
  fill?: () => void;
  fillText?: (text: string, x: number, y: number, maxWidth?: number) => void;
  drawImage?: (image: unknown, ...args: number[]) => void;
  setFillStyle?: (fill: string) => void;
  setFontSize?: (size: number) => void;
  setTextAlign?: (align: string) => void;
  setTextBaseline?: (baseline: string) => void;
  fillStyle?: string;
  font?: string;
  textAlign?: string;
  textBaseline?: string;
};

export function renderCanvasCommands(context: MiniappCanvasContext, commands: CanvasCommand[]) {
  for (const command of commands) {
    if (command.type === 'rect') {
      drawRect(context, command);
    } else if (command.type === 'text') {
      drawText(context, command);
    } else {
      drawImage(context, command);
    }
  }
}

function drawRect(context: MiniappCanvasContext, command: RectCommand) {
  setFillStyle(context, command.fill);
  drawRoundedPath(context, command.x, command.y, command.width, command.height, command.radius);
  context.fill?.();
}

function drawText(context: MiniappCanvasContext, command: TextCommand) {
  setFillStyle(context, command.color);
  setFont(context, command);
  setTextAlign(context, command.textAlign);
  setTextBaseline(context, 'top');
  command.lines.forEach((line, index) => {
    context.fillText?.(line, command.x, command.y + index * command.lineHeight);
  });
}

function drawImage(context: MiniappCanvasContext, command: ImageCommand) {
  context.save?.();
  drawRoundedPath(context, command.x, command.y, command.width, command.height, command.radius);
  context.clip?.();
  const drawArgs = getImageDrawArgs(command);
  context.drawImage?.(command.src, ...drawArgs);
  context.restore?.();
}

function getImageDrawArgs(command: ImageCommand) {
  const sourceWidth = command.intrinsicWidth;
  const sourceHeight = command.intrinsicHeight;
  if (!sourceWidth || !sourceHeight || command.objectFit === 'fill') {
    return [command.x, command.y, command.width, command.height];
  }

  if (command.objectFit === 'contain') {
    const scale = Math.min(command.width / sourceWidth, command.height / sourceHeight);
    const drawnWidth = sourceWidth * scale;
    const drawnHeight = sourceHeight * scale;
    return [
      command.x + (command.width - drawnWidth) / 2,
      command.y + (command.height - drawnHeight) / 2,
      drawnWidth,
      drawnHeight,
    ];
  }

  const scale = Math.max(command.width / sourceWidth, command.height / sourceHeight);
  const cropWidth = command.width / scale;
  const cropHeight = command.height / scale;
  const cropX = (sourceWidth - cropWidth) / 2;
  const cropY = (sourceHeight - cropHeight) / 2;
  return [cropX, cropY, cropWidth, cropHeight, command.x, command.y, command.width, command.height];
}

function drawRoundedPath(
  context: MiniappCanvasContext,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath?.();
  context.moveTo?.(x + safeRadius, y);
  context.lineTo?.(x + width - safeRadius, y);
  context.quadraticCurveTo?.(x + width, y, x + width, y + safeRadius);
  context.lineTo?.(x + width, y + height - safeRadius);
  context.quadraticCurveTo?.(x + width, y + height, x + width - safeRadius, y + height);
  context.lineTo?.(x + safeRadius, y + height);
  context.quadraticCurveTo?.(x, y + height, x, y + height - safeRadius);
  context.lineTo?.(x, y + safeRadius);
  context.quadraticCurveTo?.(x, y, x + safeRadius, y);
  context.closePath?.();
}

function setFillStyle(context: MiniappCanvasContext, fill: string) {
  if (context.setFillStyle) {
    context.setFillStyle(fill);
  }
  context.fillStyle = fill;
}

function setFont(context: MiniappCanvasContext, command: TextCommand) {
  context.setFontSize?.(command.fontSize);
  context.font = `${command.fontWeight} ${command.fontSize}px ${command.fontFamily}`;
}

function setTextAlign(context: MiniappCanvasContext, align: string) {
  context.setTextAlign?.(align);
  context.textAlign = align;
}

function setTextBaseline(context: MiniappCanvasContext, baseline: string) {
  context.setTextBaseline?.(baseline);
  context.textBaseline = baseline;
}
