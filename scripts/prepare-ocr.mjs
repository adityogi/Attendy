import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { mkdir, copyFile } from "node:fs/promises";
const require = createRequire(import.meta.url),
  tesseractRoot = dirname(require.resolve("tesseract.js/package.json"));
const resolveCore = createRequire(join(tesseractRoot, "package.json"));
const coreRoot = dirname(resolveCore.resolve("tesseract.js-core/package.json"));
const languageRoot = dirname(
  require.resolve("@tesseract.js-data/eng/package.json"),
);
await mkdir("public/ocr", { recursive: true });
await copyFile(
  join(tesseractRoot, "dist/worker.min.js"),
  "public/ocr/worker.min.js",
);
await copyFile(
  join(tesseractRoot, "LICENSE.md"),
  "public/ocr/TESSERACT-LICENSE.txt",
);
await copyFile(join(coreRoot, "LICENSE"), "public/ocr/CORE-LICENSE.txt");
for (const name of [
  "tesseract-core-lstm.wasm.js",
  "tesseract-core-simd-lstm.wasm.js",
  "tesseract-core-lstm.wasm",
  "tesseract-core-simd-lstm.wasm",
])
  await copyFile(join(coreRoot, name), join("public/ocr", name));
await copyFile(
  join(languageRoot, "4.0.0_best_int/eng.traineddata.gz"),
  "public/ocr/eng.traineddata.gz",
);
console.log("Image recognition assets are ready locally.");
