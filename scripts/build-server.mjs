import { build } from "esbuild";
import { readdir, writeFile, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
await build({
  entryPoints: ["server/worker.ts"],
  bundle: true,
  format: "esm",
  platform: "browser",
  outfile: "dist/server/index.js",
});
const assets = (await readdir("dist/client/assets")).map(
  (x) => "./assets/" + x,
);
const version = createHash("sha256")
  .update(await readFile("dist/client/index.html"))
  .digest("hex")
  .slice(0, 12);
await writeFile(
  "dist/client/sw.js",
  `const CACHE='attendly-${version}';const FILES=${JSON.stringify(["./", "./index.html", "./favicon.svg", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", ...assets, ...(await readdir("dist/client/ocr")).map((x) => "./ocr/" + x)])};self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));});self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('attendly-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin||new URL(e.request.url).pathname.includes('/api/'))return;if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).catch(()=>caches.match('./index.html')));return;}e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request)));});`,
);
