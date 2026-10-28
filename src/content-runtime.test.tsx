import { act } from "react";
import { createRoot } from "react-dom/client";
import { createHash, webcrypto } from "node:crypto";
import { afterEach, expect, it, vi } from "vitest";
import { ContentRenderer, type DataResult } from "@tau/blog";

afterEach(() => vi.unstubAllGlobals());

it("发布的运行时显示步骤代码块和格式 3 插件正文", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("crypto", webcrypto);
  const pluginCode = `const React = require('react');
module.exports.default = require('@tau/plugins').definePlugin({
  id:'test.blog',name:'测试',version:'1.0.0',
  editorExtensions:[{id:'test.blog',apiVersion:1,elements:[{
    type:'test.blog',kind:'block',isVoid:true,
    render:({attributes,children})=>React.createElement('div',attributes,'插件正文已加载',children)
  }]}],create(){throw Error('不应激活插件')}});`;
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(pluginCode))
  );
  const source = "body {\n  color: CanvasText;\n}";
  const content: DataResult = {
    dataUrl: "https://example.com/data/article.json",
    data: {
      version: 1,
      key: "test-blog-runtime",
      meta: { type: "card", publishTime: 1 },
      content: {
        id: 1,
        tags: [],
        createTime: 1,
        updateTime: 1,
        content: [
          {
            type: "code-block",
            uuid: "blog-code",
            language: "css",
            children: [
              { type: "code-step", code: source, children: [{ type: "formatted", text: "" }] },
            ],
          },
          { type: "test.blog", children: [{ type: "formatted", text: "" }] },
        ],
      },
      pluginRenderers: [
        {
          runtimeVersion: 1,
          entry: "plugin.js",
          nodeTypes: ["test.blog"],
          manifest: {
            id: "test.blog",
            name: "测试",
            version: "1.0.0",
            apiVersion: 1,
            formatVersion: 3,
            platform: "portable",
            profile: "web-v1",
            format: "cjs",
            targets: { desktop: { minAppVersion: "0.59.1" } },
            main: "main.js",
            integrity: { "main.js": createHash("sha256").update(pluginCode).digest("hex") },
          },
        },
      ],
    },
  };
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(<ContentRenderer content={content} />));
    await vi.waitFor(
      async () => {
        await act(async () => new Promise(resolve => setTimeout(resolve, 5)));
        expect(container.textContent).toContain("插件正文已加载");
        expect(container.querySelector(".code-block-shiki-layer")?.textContent).toContain(
          "CanvasText"
        );
        expect(container.querySelector("textarea")?.value).toBe(source);
      },
      { timeout: 10000 }
    );
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
});
