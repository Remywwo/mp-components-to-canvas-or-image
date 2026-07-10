#!/usr/bin/env node

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { parseCaptureOptions, parseClip } from './capture-options.mjs';

const options = parseCaptureOptions(process.argv.slice(2));
const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const outputPath = resolve(projectRoot, options.output);
const clip = parseClip(options.clip);

const browser = await openBrowser(options);

try {
  const page = await openPage(browser, options);

  if (clip) {
    await page.screenshot({
      path: outputPath,
      clip,
      animations: 'disabled',
      caret: 'hide',
    });
    console.log(`Captured clip ${options.clip} -> ${outputPath}`);
  } else {
    const target = page.locator(options.selector).first();
    await target.waitFor({ state: 'visible', timeout: Number(options.timeout) });
    await target.screenshot({
      path: outputPath,
      animations: 'disabled',
      caret: 'hide',
    });
    console.log(`Captured ${options.selector} -> ${outputPath}`);
  }
} finally {
  await browser.close();
}

async function openBrowser(options) {
  if (options.mode === 'cdp') {
    if (!options.cdp) {
      throw new Error('CDP mode requires --cdp, for example: --mode cdp --cdp http://127.0.0.1:9222');
    }

    return chromium.connectOverCDP(options.cdp);
  }

  return chromium.launch();
}

async function openPage(browser, options) {
  if (options.mode === 'cdp') {
    const context = browser.contexts()[0] ?? (await browser.newContext(createContextOptions(options)));
    const pages = context.pages();
    const page = options.pageIndex ? pages[Number(options.pageIndex)] : pages[0];

    if (!page) {
      throw new Error('No page found in the connected CDP browser. Open the target page first or provide a valid --pageIndex.');
    }

    if (options.url && options.navigate !== 'false') {
      await page.goto(options.url, {
        waitUntil: options.wait,
        timeout: Number(options.timeout),
      });
    }

    return page;
  }

  const page = await browser.newPage(createContextOptions(options));
  const url = options.mode === 'file' ? toFileUrl(options.file) : options.url;

  if (!url) {
    throw new Error(`${options.mode} mode requires a target URL or file.`);
  }

  await page.goto(url, {
    waitUntil: options.wait,
    timeout: Number(options.timeout),
  });

  return page;
}

function createContextOptions(options) {
  return {
    deviceScaleFactor: Number(options.deviceScaleFactor),
    isMobile: options.isMobile === 'true',
    viewport: {
      width: Number(options.viewportWidth),
      height: Number(options.viewportHeight),
    },
  };
}

function toFileUrl(file) {
  if (!file) {
    return undefined;
  }

  return `file://${resolve(projectRoot, file)}`;
}
