import { beforeEach, expect, it, vi } from "vitest";
import { webcrypto, createHash } from "node:crypto";
import { loadPublishedPluginDefinitions } from "./plugin-runtime";
import { validatePluginManifest } from "@tau/plugins/publish-artifacts";
import type { PublishedPluginRender } from "@tau/plugins/publish-artifacts";
const code = `module.exports.default=require('@tau/plugins').definePlugin({id:'test.editor',name:'test',version:'1.0.0',editorExtensions:[{id:'test.node',apiVersion:1,elements:[{type:'test.node',kind:'block',render:()=>null}]}],create(){throw Error('博客不能调用 create')}});`;
const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const dependency: PublishedPluginRender = {
  runtimeVersion: 1,
  manifest: validatePluginManifest({
    id: "test.editor",
    name: "test",
    version: "1.0.0",
    apiVersion: 1,
    formatVersion: 1,
    main: "main.js",
    styles: "main.css",
    platform: "desktop",
    format: "cjs",
    editor: true,
    integrity: { "main.js": hash(code), "main.css": hash(".test{}") },
  }),
  entry: "/main.js",
  styles: "/main.css",
  nodeTypes: ["test.node"],
};
const dataUrl = "https://data.example/data/articles/2.json";
beforeEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.head
    .querySelectorAll("style[data-tau-content-plugin]")
    .forEach((style) => style.remove());
  vi.stubGlobal("crypto", webcrypto);
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async (url: URL) =>
        new Response(url.pathname.endsWith(".css") ? ".test{}" : code),
    ),
  );
});

it("按清单验证并加载同一个入口及样式，不执行桌面生命周期", async () => {
  const loaded = await loadPublishedPluginDefinitions([dependency], dataUrl);
  expect(loaded.definitions[0].id).toBe("test.editor");
  expect(
    document.head.querySelector("style[data-tau-content-plugin]")?.textContent,
  ).toContain(".test{}");
  loaded.dispose();
  expect(
    document.head.querySelector("style[data-tau-content-plugin]"),
  ).toBeNull();
});
it("摘要不匹配或未来协议拒绝加载，不留下已加载贡献", async () => {
  await expect(
    loadPublishedPluginDefinitions(
      [
        {
          ...dependency,
          manifest: {
            ...dependency.manifest,
            integrity: {
              ...dependency.manifest.integrity,
              "main.js": "0".repeat(64),
            },
          },
        },
      ],
      dataUrl,
    ),
  ).rejects.toThrow("摘要");
  await expect(
    loadPublishedPluginDefinitions(
      [{ ...dependency, runtimeVersion: 2 as 1 }],
      dataUrl,
    ),
  ).rejects.toThrow("协议");
  expect(
    document.head.querySelector("style[data-tau-content-plugin]"),
  ).toBeNull();
});
it("重复节点/插件清单失败时回收本次注入的样式", async () => {
  await expect(
    loadPublishedPluginDefinitions([dependency, dependency], dataUrl),
  ).rejects.toThrow("重复");
  expect(
    document.head.querySelector("style[data-tau-content-plugin]"),
  ).toBeNull();
});

it("同一插件的多个实例按各自数据 URL 解析资源，关闭互不影响", async () => {
  const page = await loadPublishedPluginDefinitions([dependency], dataUrl);
  const preview = await loadPublishedPluginDefinitions(
    [{ ...dependency, entry: "../main.js", styles: "../main.css" }],
    "https://resources.example/content/2.json",
  );
  expect(preview.definitions[0]).not.toBe(page.definitions[0]);
  expect(
    vi
      .mocked(fetch)
      .mock.calls.some(
        ([url]) => String(url) === "https://resources.example/main.js",
      ),
  ).toBe(true);
  expect(
    document.head.querySelectorAll("style[data-tau-content-plugin]"),
  ).toHaveLength(2);
  preview.dispose();
  expect(
    document.head.querySelectorAll("style[data-tau-content-plugin]"),
  ).toHaveLength(1);
  page.dispose();
  expect(
    document.head.querySelector("style[data-tau-content-plugin]"),
  ).toBeNull();
});
