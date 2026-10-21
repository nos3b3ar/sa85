import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const from = join(root, 'node_modules/js-dos/dist');
const to = join(root, 'public/js-dos');

// Only the plain DOSBox backend; DOSBox-X, networking and the file explorer stay out of the bundle.
const files = [
  'js-dos.js',
  'js-dos.css',
  'emulators/emulators.js',
  'emulators/wdosbox.js',
  'emulators/wdosbox.wasm',
  'emulators/wlibzip.js',
  'emulators/wlibzip.wasm',
];

mkdirSync(join(to, 'emulators'), { recursive: true });
for (const file of files) copyFileSync(join(from, file), join(to, file));
