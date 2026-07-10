export const devicePresets = {
  desktop: {
    width: '1440',
    height: '1400',
    deviceScaleFactor: '1',
    isMobile: 'false',
  },
  mobile: {
    width: '390',
    height: '844',
    deviceScaleFactor: '3',
    isMobile: 'true',
  },
  miniapp: {
    width: '375',
    height: '812',
    deviceScaleFactor: '2',
    isMobile: 'true',
  },
  tablet: {
    width: '768',
    height: '1024',
    deviceScaleFactor: '2',
    isMobile: 'true',
  },
};

const defaultOptions = {
  mode: 'web',
  url: 'http://127.0.0.1:5173/',
  selector: '[data-capture-target="share-card"]',
  output: 'exports/share-card.png',
  wait: 'networkidle',
  timeout: '10000',
  device: 'desktop',
};

export function parseCaptureOptions(args) {
  const parsed = { ...defaultOptions };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (!arg.startsWith('--')) {
      continue;
    }

    const key = arg.slice(2);
    const value = args[index + 1];

    if (!value || value.startsWith('--')) {
      parsed[key] = 'true';
      continue;
    }

    parsed[key] = value;
    index += 1;
  }

  const preset = devicePresets[parsed.device] ?? devicePresets.desktop;
  const viewportWidth = parsed.viewportWidth ?? parsed.width ?? preset.width;
  const viewportHeight = parsed.viewportHeight ?? parsed.height ?? preset.height;
  const deviceScaleFactor = parsed.deviceScaleFactor ?? preset.deviceScaleFactor;
  const isMobile = parsed.isMobile ?? preset.isMobile;

  return {
    ...parsed,
    viewportWidth,
    viewportHeight,
    deviceScaleFactor,
    isMobile,
  };
}

export function parseClip(value) {
  if (!value) {
    return undefined;
  }

  const [x, y, width, height] = value.split(',').map((part) => Number(part.trim()));

  if ([x, y, width, height].some((item) => Number.isNaN(item))) {
    throw new Error('--clip must use "x,y,width,height", for example: --clip 0,0,375,812');
  }

  return { x, y, width, height };
}
