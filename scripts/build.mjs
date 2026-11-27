import {
  lstat,
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

const LOCALIZED_README_PATTERN = /^README\.([A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*)\.md$/;

async function copyLocalizedReadmes(sourceDir, targetDir) {
  const seen = new Set();
  const entries = (await readdir(sourceDir, { withFileTypes: true })).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  for (const entry of entries) {
    const match = LOCALIZED_README_PATTERN.exec(entry.name);
    if (!match) continue;
    const sourcePath = path.join(sourceDir, entry.name);
    const stat = await lstat(sourcePath);
    if (stat.isSymbolicLink() || !stat.isFile())
      throw new Error(`多语言说明文档必须是普通文件，不能是符号链接：${entry.name}`);
    let locale;
    try {
      locale = new Intl.Locale(match[1]).toString();
    } catch {
      throw new Error(`多语言说明文档包含无效的语言标识：${entry.name}`);
    }
    if (seen.has(locale))
      throw new Error(`多语言说明文档包含重复的语言标识：${locale}（${entry.name}）`);
    const content = await readFile(sourcePath, "utf8");
    if (!content.trim()) throw new Error(`${entry.name} 必须包含插件介绍与使用说明`);
    seen.add(locale);
    await writeFile(path.join(targetDir, `README.${locale}.md`), content);
  }
}

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
  minAppVersion: "0.68.0",
  description:
    "保留 Tau 博客的文章、卡片、项目、搜索与内容预览的独立模板。",
  categories: ["blog-template"],
  keywords: ["博客", "个人网站", "静态站点", "主题"],
  i18n: {
    "zh-TW": {
      name: "Tau 部落格",
      description: "保留 Tau 部落格的文章、卡片、專案、搜尋與內容預覽的獨立模板。",
      keywords: ["部落格", "個人網站", "靜態網站", "佈景主題"],
    },
    "en-US": {
      name: "Tau Blog",
      description:
        "Standalone blog template preserving Tau Blog articles, cards, projects, search, and content previews.",
      keywords: ["blog", "personal site", "static site", "theme"],
    },
  },
  template: {
    protocolVersion: 1,
    root: "site",
    entries: ["index.html", "404.html"],
    siteFields: [
      {
        key: "description",
        label: "站点描述",
        type: "textarea",
        placeholder: "记录学习与思考",
        description: "显示在首页标题下方，留空则首页不显示介绍区",
      },
    ],
  },
  integrity,
};
await writeFile(
  path.join(root, "dist/manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);
for (const name of ["README.md", "CHANGELOG.md", "LICENSE"]) {
  await writeFile(path.join(root, "dist", name), await readFile(path.join(root, name)));
}
await copyLocalizedReadmes(root, path.join(root, "dist"));
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
