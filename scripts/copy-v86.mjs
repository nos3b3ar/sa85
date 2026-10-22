import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const from = join(root, 'node_modules/v86/build');
const to = join(root, 'public/v86');

// Only the release build; the debug variants are several megabytes larger.
const files = ['libv86.js', 'v86.wasm'];

mkdirSync(to, { recursive: true });
for (const file of files) copyFileSync(join(from, file), join(to, file));
copyFileSync(join(root, 'node_modules/v86/LICENSE'), join(to, 'LICENSE'));
