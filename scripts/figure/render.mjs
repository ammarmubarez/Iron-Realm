// node render.mjs <view> <extraRegionsJson|-> <x> <y> <w> <h> <scale> <out.png>
// Renders the body figure (silhouette + regions) with optional extra regions
// drawn on top in bright colours, cropped to a box and scaled.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js'; const { chromium } = pkg;
import { readFileSync } from 'node:fs';
const [view, extraFile, x, y, w, h, scale, out] = process.argv.slice(2);
const src = readFileSync('src/data/bodyPaths.js', 'utf8').replace(/export const /g, 'globalThis.');
eval(src);
const extra = extraFile && extraFile !== '-' ? JSON.parse(readFileSync(extraFile, 'utf8'))[view] || {} : {};
const body = _BODY_PATHS[view] || [], groups = _MUSCLE_PATHS[view] || {};
const cols = ["#e05555","#4a9eff","#4ecb71","#8b5cf6","#f59e0b","#e07b00","#c46000","#06b6d4","#ec4899","#10b981","#ff5c5c","#37d67a","#a3e635","#f472b6","#22d3ee","#fb923c","#c084fc","#fde047","#34d399","#60a5fa","#f87171","#facc15","#2dd4bf","#e879f9","#fb7185","#818cf8","#4ade80","#f97316","#38bdf8","#a78bfa","#f43f5e","#84cc16","#eab308"];
const bright = ["#00d4ff", "#00d4ff", "#00d4ff", "#00d4ff", "#00d4ff"];
const APP = process.env.APP === '1';
let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}" width="${w * scale}" height="${h * scale}" style="background:#111">`;
for (const p of body) svg += p.type === 'line' ? `<line x1="${p.x1}" y1="${p.y1}" x2="${p.x2}" y2="${p.y2}" stroke="${APP ? '#2a4a6a' : '#666'}" stroke-width="${p.sw || 1}"/>` : `<path d="${p.d}" fill="none" stroke="${APP ? '#2a4a6a' : '#666'}" stroke-width="${p.sw || 1}"/>`;
let k = 0;
for (const [id, paths] of Object.entries(groups)) { const c = APP ? '#e8eef8' : cols[k++ % cols.length]; if (APP && extra[id]) continue; for (const p of paths) svg += p.type === 'line' ? `<line x1="${p.x1}" y1="${p.y1}" x2="${p.x2}" y2="${p.y2}" stroke="${APP ? '#2a4a6a' : c}" stroke-width="${p.sw}"/>` : `<path d="${p.d}" fill="${p.fill === 'none' ? 'none' : c}" fill-opacity="${APP ? 1 : .5}" stroke="${APP ? '#06080c' : '#000'}" stroke-width="${APP ? 3.2 : .6}" stroke-linejoin="round"/>`; }
k = 0;
for (const [id, paths] of Object.entries(extra)) { const c = bright[k++ % bright.length]; for (const d of paths) svg += `<path d="${d}" fill="${c}" fill-opacity="${APP ? 1 : .8}" stroke="${APP ? '#06080c' : '#000'}" stroke-width="${APP ? 3.2 : 1}" stroke-linejoin="round"/>`; }
if (!APP) for (let gx = Math.ceil(+x / 25) * 25; gx <= +x + +w; gx += 25) svg += `<line x1="${gx}" y1="${y}" x2="${gx}" y2="${+y + +h}" stroke="#fff" stroke-opacity="${gx % 100 ? .12 : .3}"/>` + (gx % 100 ? '' : `<text x="${gx + 1}" y="${+y + 10}" fill="#fff" font-size="${9 / scale * 2}">${gx}</text>`);
if (!APP) for (let gy = Math.ceil(+y / 25) * 25; gy <= +y + +h; gy += 25) svg += `<line x1="${x}" y1="${gy}" x2="${+x + +w}" y2="${gy}" stroke="#fff" stroke-opacity="${gy % 100 ? .12 : .3}"/>` + (gy % 100 ? '' : `<text x="${+x + 1}" y="${gy - 1}" fill="#fff" font-size="${9 / scale * 2}">${gy}</text>`);
svg += '</svg>';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless: true, args: ['--no-sandbox'] });
const page = await b.newPage(); await page.setViewportSize({ width: Math.round(w * scale), height: Math.round(h * scale) });
await page.setContent(`<body style="margin:0;background:#111">${svg}</body>`);
await page.screenshot({ path: out }); await b.close();
