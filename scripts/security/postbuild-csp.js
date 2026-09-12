// Injects the production Content-Security-Policy into build/index.html.
//
// Why here and not in public/index.html: the CRA dev server needs 'unsafe-eval'
// and inline scripts for hot reload, which a real CSP must forbid. The built
// bundle has no inline script (INLINE_RUNTIME_CHUNK=false in .env), so
// production can run with script-src 'self' only.
//
// GitHub Pages cannot send HTTP headers, so the policy ships as a <meta> tag.
// Capacitor loads the same index.html from its local scheme, where 'self' is
// the app bundle.
//
// Directives that only work as headers (frame-ancestors, report-uri) cannot be
// expressed in a meta tag; if the site ever moves to a host that supports
// custom headers, add them there.
const fs = require("fs");
const path = require("path");

const supabase = (process.env.REACT_APP_SUPABASE_URL || "").replace(/\/$/, "");
const supabaseHosts = supabase ? `${supabase} ${supabase.replace(/^https:/, "wss:")}` : "https://*.supabase.co wss://*.supabase.co";

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  // React writes styles through the CSSOM (allowed), but the app also mounts
  // its stylesheet as <style> elements, which needs 'unsafe-inline'.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseHosts} https://ammarmubarez.github.io`,
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

const file = path.join(__dirname, "../../build/index.html");
if (!fs.existsSync(file)) {
  console.error("postbuild-csp: build/index.html not found — run after react-scripts build");
  process.exit(1);
}
let html = fs.readFileSync(file, "utf8");
if (/http-equiv="Content-Security-Policy"/i.test(html)) {
  html = html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/i, "");
}
html = html.replace(/<meta charset="?UTF-8"?\s*\/?>/i, (m) => `${m}<meta http-equiv="Content-Security-Policy" content="${CSP}">`);
if (/<script(?![^>]*\bsrc=)[^>]*>[^<]/i.test(html)) {
  console.error("postbuild-csp: inline <script> found in build/index.html — CSP script-src 'self' would block it. Set INLINE_RUNTIME_CHUNK=false.");
  process.exit(1);
}
fs.writeFileSync(file, html);
console.log("postbuild-csp: CSP injected →", CSP);
