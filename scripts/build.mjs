import {
  readdir,
  readFile,
  writeFile,
  mkdir,
} from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createHash } from "node:crypto";
import { build } from "vite";
import AdmZip from "adm-zip";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { version } = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
await build({ root, configFile: path.join(root, "vite.config.ts") });
const site = path.join(root, "dist/site");
// 路径路由下页面可能在任意深度，资源改用部署根的绝对路径；__TAU_BASE__ 由宿主发布时替换。
const html = (await readFile(path.join(site, "index.html"), "utf8")).replace(
  /(\s(?:src|href))="\.\//g,
  '$1="__TAU_BASE__',
);
await writeFile(path.join(site, "index.html"), html);
// 静态托管对不存在的路径返回 404.html；内容与入口相同，由 Router 按地址渲染深链。
await writeFile(path.join(site, "404.html"), html);
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
  version,
  minAppVersion: "0.59.0",
  description:
    "保留 Tau 博客的文章、卡片、项目、求索录、搜索与内容预览的独立模板。",
  categories: ["blog-template"],
  keywords: ["博客", "个人网站", "静态站点", "主题"],
  template: {
    protocolVersion: 1,
    root: "site",
    entries: ["index.html", "404.html"],
  },
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
await writeFile(path.join(root, "output", `${manifest.id}-${version}.zip`), bytes);
console.log(
  JSON.stringify({
    id: manifest.id,
    files: Object.keys(integrity).length,
    zipBytes: bytes.length,
  }),
);
