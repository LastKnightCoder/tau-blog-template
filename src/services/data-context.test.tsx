import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it } from "vitest";
import type { PluginDefinition } from "@tau/plugins";
import type { InitData } from "@blog/types";
import { BlogDataProvider, useInitData } from "./data-context";
import { useBlogKit } from "./editorKit";

it("并列及嵌套正文从各自上下文取得插件贡献，空贡献不继承父正文", () => {
  const container = document.createElement("div");
  const root = createRoot(container);
  const environment = globalThis as Record<string, unknown>;
  const previous = environment.IS_REACT_ACT_ENVIRONMENT;
  environment.IS_REACT_ACT_ENVIRONMENT = true;
  const plugin = (type: string): PluginDefinition => ({
    id: type,
    name: type,
    version: "1.0.0",
    editorExtensions: [
      {
        id: type,
        apiVersion: 1,
        elements: [{ type, kind: "block", render: () => null }],
      },
    ],
    create: () => ({}),
  });
  const data = (title: string) => ({ site: { title } }) as InitData;
  function Probe() {
    const value = useInitData();
    const kit = useBlogKit();
    return (
      <p>
        {value.site.title}:
        {kit.elementTypes.filter((type) => type.startsWith("test.")).join(",")}
      </p>
    );
  }
  try {
    act(() =>
      root.render(
        <>
          <BlogDataProvider data={data("正文")} plugins={[plugin("test.page")]}>
            <Probe />
            <BlogDataProvider
              data={data("预览")}
              plugins={[plugin("test.preview")]}
            >
              <Probe />
            </BlogDataProvider>
            <BlogDataProvider data={data("无插件")}>
              <Probe />
            </BlogDataProvider>
          </BlogDataProvider>
          <BlogDataProvider
            data={data("另一正文")}
            plugins={[plugin("test.other")]}
          >
            <Probe />
          </BlogDataProvider>
        </>,
      ),
    );
    expect(
      [...container.querySelectorAll("p")].map((item) => item.textContent),
    ).toEqual([
      "正文:test.page",
      "预览:test.preview",
      "无插件:",
      "另一正文:test.other",
    ]);
  } finally {
    act(() => root.unmount());
    environment.IS_REACT_ACT_ENVIRONMENT = previous;
  }
});
