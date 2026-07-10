#!/usr/bin/env node
import { readMiniappComponentDirectory, readTemplateFiles } from './template-files.mjs';

const options = parseArgs(process.argv.slice(2));

try {
  const result = options.dir
    ? await readMiniappComponentDirectory({
        dir: options.dir,
        entry: options.entry || 'index',
      })
    : await readTemplateFiles({
        wxmlPath: options.wxml,
        wxssPath: options.wxss,
      });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}

function parseArgs(args) {
  const parsed = {};
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
  return parsed;
}
