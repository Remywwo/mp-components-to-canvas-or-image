import { compileCanvasCommands, type CanvasCommand } from './canvas';
import type { CompileDslInput } from './dsl';
import { renderCanvasCommands, type MiniappCanvasContext } from './renderer';
import {
  resolveCanvasResources,
  type ImageResource,
  type ResolveCanvasResourcesOptions,
  type ResolveImageResource,
} from './resources';

export type ShareCardRendererOptions = {
  resolveImage?: ResolveImageResource;
};

export type ShareCardRenderInput = CompileDslInput & {
  context?: MiniappCanvasContext;
};

export type ShareCardRenderResult = {
  box: ReturnType<typeof compileCanvasCommands>['box'];
  commands: CanvasCommand[];
  resources: ImageResource[];
  warnings: string[];
};

export type ShareCardRenderer = {
  render: (input: ShareCardRenderInput) => Promise<ShareCardRenderResult>;
};

export function createShareCardRenderer(options: ShareCardRendererOptions = {}): ShareCardRenderer {
  return {
    async render(input) {
      const compiled = compileCanvasCommands(input);
      const resolved = options.resolveImage
        ? await resolveCanvasResources(compiled.commands, {
            mode: input.mode,
            resolveImage: options.resolveImage,
          } satisfies ResolveCanvasResourcesOptions)
        : {
            commands: compiled.commands,
            resources: [],
            warnings: [],
          };

      if (input.context) {
        renderCanvasCommands(input.context, resolved.commands);
      }

      return {
        box: compiled.box,
        commands: resolved.commands,
        resources: resolved.resources,
        warnings: [...compiled.warnings, ...resolved.warnings],
      };
    },
  };
}
