// Carves new regions out of neighbouring region paths so their edges are the
// artwork's own contours. Samples each source path in a browser (getPointAtLength),
// clips it with a predicate, and closes the run with a drawn dividing curve.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js'; const { chromium } = pkg;
import { readFileSync, writeFileSync } from 'node:fs';
const src = readFileSync('src/data/bodyPaths.js', 'utf8').replace(/export const /g, 'globalThis.');
eval(src);
const CX = 338.245;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless: true, args: ['--no-sandbox'] });
const page = await b.newPage();
await page.setContent('<svg xmlns="http://www.w3.org/2000/svg" id="s"></svg>');
// sample a path d into N points
const sample = async (d, n = 700) => page.evaluate(([d, n]) => {
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', d); document.getElementById('s').appendChild(p);
  const L = p.getTotalLength(); const pts = []; for (let i = 0; i < n; i++) { const q = p.getPointAtLength(L * i / n); pts.push([q.x, q.y]); } p.remove(); return pts;
}, [d, n]);
// pieces of a region for a view, sorted left→right by mean x
async function pieces(view, id) {
  const out = [];
  for (const p of _MUSCLE_PATHS[view][id]) { if (p.type !== 'path') continue; const pts = await sample(p.d); out.push({ pts, mx: pts.reduce((s, q) => s + q[0], 0) / pts.length }); }
  return out.sort((a, b) => a.mx - b.mx).map(o => o.pts);
}
// keep consecutive runs of points satisfying pred; rotate so we start outside; return runs in polygon order
function runs(pts, pred) {
  let start = pts.findIndex(p => !pred(p)); if (start < 0) return [pts];
  const rot = pts.slice(start).concat(pts.slice(0, start));
  const out = []; let cur = null;
  for (const p of rot) { if (pred(p)) { if (!cur) { cur = []; out.push(cur); } cur.push(p); } else cur = null; }
  return out;
}
const longest = (rs) => rs.reduce((a, r) => r.length > a.length ? r : a, []);
// quadratic-ish curve between two points bulging by `k` (fraction of distance) toward normal side
function bulge(a, b, k, n = 24) { const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2; const dx = b[0] - a[0], dy = b[1] - a[1]; const c = [mx - dy * k, my + dx * k]; const out = []; for (let i = 1; i < n; i++) { const t = i / n; out.push([(1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]]); } return out; }
// scalloped line between a and b with `m` bumps of depth `k` (toward normal side)
function scallop(a, b, m, k, n = 12) { const out = []; for (let s = 0; s < m; s++) { const p0 = [a[0] + (b[0] - a[0]) * s / m, a[1] + (b[1] - a[1]) * s / m], p1 = [a[0] + (b[0] - a[0]) * (s + 1) / m, a[1] + (b[1] - a[1]) * (s + 1) / m]; out.push(...bulge(p0, p1, k, n), p1); } return out; }
const path = (pts) => 'M' + pts.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L') + ' Z';
const flipSide = (side, x) => side === 'L' ? x : CX * 2 - x;   // mirror predicate coordinates for the right side
const mir = (side, pts) => pts;   // pieces are real geometry; no mirroring of points needed

const CFG = {
  maleFront:   { serrY: 396, serrTopX: [222, 286], braY: 404, brdY: [398, 476], hfY: [540, 650], hfTip: 592 },
  femaleFront: { serrY: 374, serrTopX: [250, 292], braY: 396, brdY: [388, 462], hfY: [522, 618], hfTip: 566 },
  maleBack:    { infY: 352, infW: 62, brdY: [372, 470] },
  femaleBack:  { infY: 336, infW: 56, brdY: [352, 446] },
};
const out = {};
for (const view of Object.keys(CFG)) {
  const c = CFG[view]; out[view] = {};
  const front = /Front/.test(view);
  if (front) {
    const obl = await pieces(view, 'obliques'), ext = await pieces(view, 'wrist-extensors'), labs = await pieces(view, 'lower-abdominals'), band = await pieces(view, 'inner-thigh');
    out[view]['serratus-anterior'] = []; out[view]['brachialis'] = []; out[view]['brachioradialis'] = []; out[view]['hip-flexors'] = [];
    for (const [i, side] of [[0, 'L'], [1, 'R']]) {
      // serratus: top of the obliques piece above serrY, closed with a scalloped lower edge (bumps hang down)
      const r = longest(runs(obl[i], p => p[1] < c.serrY));
      const a = r[r.length - 1], bb = r[0];
      const sc = scallop(a, bb, 3, side === 'L' ? -0.22 : 0.22);
      out[view]['serratus-anterior'].push(path([...r, ...sc]));
      // brachialis: top cap of the extensor strip above braY
      const rb = longest(runs(ext[i], p => p[1] < c.braY));
      out[view]['brachialis'].push(path([...rb, ...bulge(rb[rb.length - 1], rb[0], side === 'L' ? 0.12 : -0.12)]));
      // brachioradialis: band of the extensor strip between brdY[0] and brdY[1]
      const rs = runs(ext[i], p => p[1] >= c.brdY[0] && p[1] <= c.brdY[1]);
      const poly = []; rs.forEach((run, k) => { poly.push(...run); const nxt = rs[(k + 1) % rs.length]; poly.push(...bulge(run[run.length - 1], nxt[0], side === 'L' ? 0.1 : -0.1)); });
      out[view]['brachioradialis'].push(path(poly));
      // hip flexors: triangle between the lower-abs edge (this side), the midline and the sartorius band's medial edge
      const absPts = labs[0].filter(p => p[1] >= c.hfY[0] && p[1] <= c.hfTip && (side === 'L' ? p[0] < CX - 2 : p[0] > CX + 2)).sort((p, q) => p[1] - q[1]);
      const bandMed = band[i].filter(p => p[1] >= c.hfY[0] && p[1] <= c.hfY[1]);
      const byY = {}; for (const p of bandMed) { const k = Math.round(p[1] / 4); if (!byY[k] || (side === 'L' ? p[0] > byY[k][0] : p[0] < byY[k][0])) byY[k] = p; }
      const medEdge = Object.values(byY).sort((p, q) => q[1] - p[1]);            // bottom → top
      const tip = absPts[absPts.length - 1] || [CX, c.hfTip];
      const mid = side === 'L' ? CX - 2.5 : CX + 2.5;
      const hf = [...absPts, [mid, tip[1] + 6], [mid, c.hfY[1] - 4], ...medEdge];
      out[view]['hip-flexors'].push(path(hf));
    }
  } else {
    const lats = await pieces(view, 'lats'), ext = await pieces(view, 'wrist-extensors');
    out[view]['infraspinatus'] = []; out[view]['brachioradialis'] = [];
    for (const [i, side] of [[0, 'L'], [1, 'R']]) {
      // bound the wedge by width from this side's own armpit corner (the art is not symmetric)
      const top = lats[i].filter(p => p[1] < c.infY);
      const xEdge = side === 'L' ? Math.min(...top.map(p => p[0])) : Math.max(...top.map(p => p[0]));
      // the right lats piece is drawn differently; carve the left wedge and mirror it
      if (side === 'L') {
        const r = longest(runs(lats[i], p => p[1] < c.infY && Math.abs(p[0] - xEdge) < c.infW));
        const poly = [...r, ...bulge(r[r.length - 1], r[0], 0.16)];
        out[view]['infraspinatus'].push(path(poly));
        out[view]['infraspinatus'].push(path(poly.map(p => [CX * 2 - p[0], p[1]])));
      }
      const rs = runs(ext[i], p => p[1] >= c.brdY[0] && p[1] <= c.brdY[1]);
      const poly = []; rs.forEach((run, k) => { poly.push(...run); const nxt = rs[(k + 1) % rs.length]; poly.push(...bulge(run[run.length - 1], nxt[0], side === 'L' ? 0.1 : -0.1)); });
      out[view]['brachioradialis'].push(path(poly));
    }
  }
}
writeFileSync(process.argv[2] || 'carved.json', JSON.stringify(out));
console.log('carved', Object.entries(out).map(([v, r]) => `${v}: ${Object.keys(r).join(',')}`).join(' | '));
await b.close();
