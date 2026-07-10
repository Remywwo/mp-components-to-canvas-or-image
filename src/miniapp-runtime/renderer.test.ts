import { describe, expect, it } from 'vitest';
import { renderCanvasCommands } from './renderer';
import type { CanvasCommand } from './canvas';

describe('miniapp canvas renderer adapter', () => {
  it('maps canvas commands to a small canvas context contract', () => {
    const calls: unknown[][] = [];
    const context = {
      save: () => calls.push(['save']),
      restore: () => calls.push(['restore']),
      beginPath: () => calls.push(['beginPath']),
      moveTo: (...args: number[]) => calls.push(['moveTo', ...args]),
      lineTo: (...args: number[]) => calls.push(['lineTo', ...args]),
      quadraticCurveTo: (...args: number[]) => calls.push(['quadraticCurveTo', ...args]),
      closePath: () => calls.push(['closePath']),
      clip: () => calls.push(['clip']),
      fill: () => calls.push(['fill']),
      fillText: (...args: unknown[]) => calls.push(['fillText', ...args]),
      drawImage: (...args: unknown[]) => calls.push(['drawImage', ...args]),
      setFillStyle: (value: string) => calls.push(['setFillStyle', value]),
      setFontSize: (value: number) => calls.push(['setFontSize', value]),
      setTextAlign: (value: string) => calls.push(['setTextAlign', value]),
      setTextBaseline: (value: string) => calls.push(['setTextBaseline', value]),
      font: '',
      fillStyle: '',
      textAlign: '',
      textBaseline: '',
    };

    const commands: CanvasCommand[] = [
      { type: 'rect', x: 0, y: 0, width: 100, height: 80, fill: '#fff', radius: 8 },
      {
        type: 'text',
        text: 'Hello',
        lines: ['Hello', 'World'],
        x: 10,
        y: 12,
        width: 80,
        height: 24,
        color: '#111',
        fontSize: 20,
        fontWeight: 700,
        lineHeight: 24,
        fontFamily: 'sans-serif',
        textAlign: 'left',
      },
      {
        type: 'image',
        src: '/a.png',
        x: 10,
        y: 40,
        width: 80,
        height: 32,
        objectFit: 'cover',
        radius: 4,
        intrinsicWidth: 100,
        intrinsicHeight: 100,
      },
    ];

    renderCanvasCommands(context, commands);

    expect(calls).toContainEqual(['setFillStyle', '#fff']);
    expect(calls).toContainEqual(['fillText', 'Hello', 10, 12]);
    expect(calls).toContainEqual(['fillText', 'World', 10, 36]);
    expect(calls).toContainEqual(['drawImage', '/a.png', 0, 30, 100, 40, 10, 40, 80, 32]);
    expect(calls.filter(([name]) => name === 'clip')).toHaveLength(1);
  });
});
