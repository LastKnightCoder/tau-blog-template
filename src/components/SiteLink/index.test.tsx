import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import type { LinkRenderProps } from "@tau/blog";
import type { InitData } from "@blog/types";
import { BlogDataProvider } from "@blog/services/data-context";
import { renderSiteLink } from ".";

const load = vi.hoisted(() => vi.fn());
vi.mock("./preview", () => ({ loadContentLinkPreview: load }));
vi.mock("@blog/services/data", () => ({
  routeFor: (target: { key: string }) => `/${target.key}`,
}));
vi.mock("@blog/components/Content", () => ({
  Content: ({ content }: { content: { data: { key: string } } }) => (
    <p data-preview-key={content.data.key} />
  ),
}));
vi.mock("@blog/components/Common/Tooltip", () => ({
  Tooltip: ({ children, content, onOpenChange }: any) => (
    <div>
      <button onClick={() => onOpenChange(true)}>展开</button>
      <button onClick={() => onOpenChange(false)}>收起</button>
      {children}
      {content}
    </div>
  ),
}));

afterEach(() => {
  vi.unstubAllGlobals();
  load.mockReset();
});

const link = (key: string): LinkRenderProps => ({
  identity: `article:${key}`,
  target: { key, type: "article" },
  href: `/${key}`,
  title: "",
  text: "链接",
  children: "链接",
});

it("预览关闭或切换目标后，旧请求结果不会覆盖当前正文；缺正文时显示空态", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const pending: ((value: unknown) => void)[] = [];
  load.mockImplementation(
    () => new Promise((resolve) => pending.push(resolve)),
  );
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const data = { site: { basePath: "/" } } as unknown as InitData;
  const render = (key: string) =>
    act(async () =>
      root.render(
        <BlogDataProvider data={data}>
          {renderSiteLink(link(key))}
        </BlogDataProvider>,
      ),
    );
  const preview = (key: string) => ({
    result: { data: { key }, dataUrl: key },
    initData: {},
  });
  try {
    await render("first");
    expect(container.querySelector("a")?.getAttribute("href")).toBe("/first");
    await act(async () => container.querySelectorAll("button")[0].click());
    await act(async () => container.querySelectorAll("button")[1].click());
    await act(async () => pending[0](preview("closed")));
    expect(container.querySelector("[data-preview-key]")).toBeNull();
    await act(async () => container.querySelectorAll("button")[0].click());
    await render("second");
    expect(load.mock.calls.map((call) => call[0])).toEqual([
      "first",
      "first",
      "second",
    ]);
    await act(async () => pending[1](preview("stale")));
    expect(container.querySelector("[data-preview-key]")).toBeNull();
    await act(async () => pending[2](preview("current")));
    expect(
      container
        .querySelector("[data-preview-key]")
        ?.getAttribute("data-preview-key"),
    ).toBe("current");
    await act(async () => container.querySelectorAll("button")[1].click());
    await act(async () => container.querySelectorAll("button")[0].click());
    await act(async () => pending[3](null));
    expect(container.textContent).toContain("暂无可预览内容");
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
});
