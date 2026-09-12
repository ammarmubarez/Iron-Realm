# Body-figure tools

The v2.5 regions (serratus anterior, brachialis, brachioradialis, hip flexors,
infraspinatus) are not hand-drawn blobs: `carve.mjs` samples the neighbouring
regions' paths in a headless browser and cuts the new region out of them, so
every edge is the artwork's own contour and only the dividing line is drawn.

    node scripts/figure/carve.mjs carved.json        # regenerate the five regions (JSON)
    APP=1 node scripts/figure/render.mjs maleFront carved.json 0 150 676 560 1.4 out.png

`render.mjs` draws any view with optional extra regions on top; `APP=1` uses the
app's white-fill / dark-seam style, otherwise a colour-per-region debug view with
a coordinate grid. Paste the JSON into `src/data/bodyPaths.js` under each view.
Run both from the repo root; they need the Playwright build at /opt/node22.
