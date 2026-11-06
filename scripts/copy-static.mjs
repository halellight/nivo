import { readFileSync, writeFileSync, cpSync, existsSync, mkdirSync } from 'node:fs';

mkdirSync('dist', { recursive: true });

// index.html points at /src/main.ts for dev; in production it must point at the bundle
const html = readFileSync('index.html', 'utf8').replace('/src/main.ts', '/nivo.js');
writeFileSync('dist/index.html', html);

// 5.png, weace.png, etc.
if (existsSync('public')) cpSync('public', 'dist', { recursive: true });