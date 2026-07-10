import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { demoComponentManifests } from '../miniprogram-demo/components/manifest.mjs';
import { readMiniappComponentTree } from './template-files.mjs';

const demoRoot = 'miniprogram-demo';
const outputFile = join(demoRoot, 'templates/index.js');

await buildMiniappDemoTemplates();

export async function buildMiniappDemoTemplates() {
  const templates = await Promise.all(
    demoComponentManifests.map(async (item) => {
      const componentDir = join(demoRoot, 'components', item.dir);
      const source = await readMiniappComponentTree({ dir: componentDir, projectRoot: demoRoot });

      return {
        ...item,
        source,
        generatedFrom: {
          dir: componentDir,
          entry: source.entry,
          files: source.files,
          components: source.components,
        },
      };
    }),
  );

  const source = renderTemplateModule(templates);
  await mkdir(dirname(outputFile), { recursive: true });
  await writeFile(outputFile, source, 'utf8');
}

function renderTemplateModule(templates) {
  const declarations = templates
    .map((template) => {
      const value = {
        id: template.id,
        name: template.name,
        data: template.data,
        generatedFrom: template.generatedFrom,
        generatedComponents: template.generatedFrom.components,
        wxml: template.source.wxml.trim(),
        wxss: template.source.wxss.trim(),
        js: template.source.js.trim(),
        json: template.source.json.trim(),
      };

      return `const ${template.exportName} = ${JSON.stringify(value, null, 2)};`;
    })
    .join('\n\n');

  const exportNames = templates.map((template) => template.exportName);

  return `// 此文件由 scripts/build-miniapp-demo-templates.mjs 生成，请勿手写修改。
${declarations}

const demoTemplates = [${exportNames.join(', ')}];

module.exports = {
  ${exportNames.join(',\n  ')},
  demoTemplates,
};
`;
}
