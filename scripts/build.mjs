import {
  readdir,
  readFile,
  writeFile,
  mkdir,
  realpath,
} from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createHash } from "node:crypto";
import { build } from "vite";
import AdmZip from "adm-zip";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const host = path.resolve(
  await realpath(path.join(root, "node_modules/@tau/plugins")),
  "../..",
);
const sourceDirs = [
  "packages/ui/src",
  "packages/editor/src",
  "packages/shared/src",
  "packages/editor-source-view/src",
  ...(await readdir(path.join(host, "editor-extensions"), { withFileTypes: true }))
    .filter(entry => entry.isDirectory())
    .map(entry => `editor-extensions/${entry.name}/src`),
];
await writeFile(
  path.join(root, "src/styles/host-sources.css"),
  sourceDirs.map(dir => `@source ${JSON.stringify(path.join(host, dir))};`).join("\n"),
);
await build({ root, configFile: path.join(root, "vite.config.ts") });
const site = path.join(root, "dist/site");
const integrity = {};
async function walk(directory, prefix = "") {
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort(
    (a, b) => a.name.localeCompare(b.name),
  )) {
    const relative = prefix + entry.name;
    if (entry.isDirectory())
      await walk(path.join(directory, entry.name), relative + "/");
    else
      integrity["site/" + relative] = createHash("sha256")
        .update(await readFile(path.join(directory, entry.name)))
        .digest("hex");
  }
}
await walk(site);
const manifest = {
  formatVersion: 1,
  apiVersion: 1,
  platform: "desktop",
  id: "tau.blog",
  name: "Tau 博客",
  version: "1.0.0",
  minAppVersion: "0.59.0",
  description:
    "保留 Tau 博客的文章、卡片、项目、求索录、搜索与内容预览的独立模板。",
  template: { protocolVersion: 1, root: "site", entries: ["index.html"] },
  integrity,
};
await writeFile(
  path.join(root, "dist/manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);
await writeFile(
  path.join(root, "dist/README.md"),
  await readFile(path.join(root, "README.md")),
);
const zip = new AdmZip();
zip.addLocalFolder(path.join(root, "dist"), "tau.blog");
await mkdir(path.join(root, "output"), { recursive: true });
const bytes = zip.toBuffer();
await writeFile(path.join(root, "output/tau.blog-1.0.0.zip"), bytes);
console.log(
  JSON.stringify({
    id: manifest.id,
    files: Object.keys(integrity).length,
    zipBytes: bytes.length,
    hostSource: host,
  }),
);
