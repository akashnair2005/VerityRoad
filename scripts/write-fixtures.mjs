import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PNG_1x1_BASE64, JPEG_1x1_BASE64 } from '../test/helpers.mjs';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../fixtures');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'tiny.png'), Buffer.from(PNG_1x1_BASE64, 'base64'));
fs.writeFileSync(path.join(dir, 'tiny.jpg'), Buffer.from(JPEG_1x1_BASE64, 'base64'));
console.log('Wrote fixtures/tiny.png and fixtures/tiny.jpg');
