import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it } from "vitest";
import type { DataResult } from "@tau/blog";
import type { InitData } from "@blog/types";
import { BlogDataProvider, useInitData, useBlogContent } from "./data-context";

it("并列和嵌套页面各自传递原始正文，渲染器无需模板装配插件", () => {
  const container = document.createElement("div");
  const root = createRoot(container);
  const environment = globalThis as Record<string, unknown>;
  const previous = environment.IS_REACT_ACT_ENVIRONMENT;
  environment.IS_REACT_ACT_ENVIRONMENT = true;
  const content = (key: string) => ({ data: { key } }) as DataResult;
  const data = (title: string) => ({ site: { title } }) as InitData;
  function Probe() {
    const value = useInitData();
    const source = useBlogContent();
    return (
      <p>
        {value.site.title}:{source.data.key}
      </p>
    );
  }
  try {
    act(() =>
      root.render(
        <>
          <BlogDataProvider data={data("正文")} content={content("test.page")}>
            <Probe />
            <BlogDataProvider
              data={data("预览")}
              content={content("test.preview")}
            >
              <Probe />
            </BlogDataProvider>
            <BlogDataProvider
              data={data("无插件")}
              content={content("test.empty")}
            >
              <Probe />
            </BlogDataProvider>
          </BlogDataProvider>
          <BlogDataProvider
            data={data("另一正文")}
            content={content("test.other")}
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
      "无插件:test.empty",
      "另一正文:test.other",
    ]);
  } finally {
    act(() => root.unmount());
    environment.IS_REACT_ACT_ENVIRONMENT = previous;
  }
});
