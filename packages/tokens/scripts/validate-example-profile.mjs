#!/usr/bin/env node
/**
 * Validates the committed example profile against validateProfile() from the built output.
 * Run after `npm run build`. Reads dist output, not source TypeScript.
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

async function main() {
  const fixturePath = join(root, 'fixtures', 'example-profile.json');
  const validatorPath = join(root, 'dist', 'pipeline', 'validate-profile.js');

  const [{ validateProfile }, raw] = await Promise.all([
    import(validatorPath),
    readFile(fixturePath, 'utf8'),
  ]);

  const profile = JSON.parse(raw);
  const result = validateProfile(profile);

  if (!result.valid) {
    console.error('Example profile failed validation:');
    result.errors?.forEach(e => console.error(' -', e));
    process.exit(1);
  }

  console.log('Example profile valid.');
  console.log('  Entity: ', profile.entity.id);
  console.log('  Axes:   ', profile.layers.semantic_axes.length);
  console.log('  Version:', profile.version ?? profile.metadata?.inquiry_version);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
