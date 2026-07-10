import type { CanvasCommand, ImageCommand } from './canvas';

type ResourceMode = 'strict' | 'loose';

export type ImageResource = {
  kind: 'image';
  src: string;
  drawable: unknown;
  width?: number;
  height?: number;
};

export type ResolveImageResource = (src: string) => Promise<Omit<ImageResource, 'kind'> | ImageResource>;

export type ResolveCanvasResourcesOptions = {
  mode?: ResourceMode;
  resolveImage: ResolveImageResource;
};

export type ResolveCanvasResourcesResult = {
  commands: CanvasCommand[];
  resources: ImageResource[];
  warnings: string[];
};

export async function resolveCanvasResources(
  commands: CanvasCommand[],
  options: ResolveCanvasResourcesOptions,
): Promise<ResolveCanvasResourcesResult> {
  const mode = options.mode ?? 'strict';
  const warnings: string[] = [];
  const cache = new Map<string, ImageResource>();
  const resources: ImageResource[] = [];

  async function getResource(src: string) {
    const cached = cache.get(src);
    if (cached) {
      return cached;
    }

    try {
      const resolved = await options.resolveImage(src);
      const resource: ImageResource = {
        kind: 'image',
        src: resolved.src,
        drawable: resolved.drawable,
        width: resolved.width,
        height: resolved.height,
      };
      cache.set(src, resource);
      resources.push(resource);
      return resource;
    } catch (error) {
      const message = `Failed to resolve image "${src}": ${error instanceof Error ? error.message : String(error)}`;
      if (mode === 'strict') {
        throw new Error(message);
      }
      warnings.push(message);
      return null;
    }
  }

  const resolvedCommands: CanvasCommand[] = [];
  for (const command of commands) {
    if (command.type !== 'image') {
      resolvedCommands.push(command);
      continue;
    }

    const resource = await getResource(String(command.src));
    resolvedCommands.push(resource ? applyImageResource(command, resource) : command);
  }

  return {
    commands: resolvedCommands,
    resources,
    warnings,
  };
}

function applyImageResource(command: ImageCommand, resource: ImageResource): ImageCommand {
  return {
    ...command,
    source: command.source ?? String(command.src),
    src: resource.drawable,
    intrinsicWidth: resource.width,
    intrinsicHeight: resource.height,
  };
}
