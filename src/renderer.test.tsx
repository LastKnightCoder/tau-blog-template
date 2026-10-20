import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { ContentRenderer, type DataResult } from "@tau/blog";

it("最小公开入口接收正文即可渲染，无需接线或手动准备插件", async () => {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const content: DataResult = {
    dataUrl: "https://example.com/data/card.json",
    data: {
      version: 1,
      key: "example",
      meta: { type: "card", publishTime: 1 },
      content: {
        id: 1,
        tags: [],
        createTime: 1,
        updateTime: 1,
        content: [
          {
            type: "paragraph",
            children: [{ type: "formatted", text: "最小接入正文" }],
          },
        ],
      },
    },
  };
  try {
    await act(async () => root.render(<ContentRenderer content={content} />));
    await vi.waitFor(async () => {
      await act(async () => new Promise((resolve) => setTimeout(resolve, 5)));
      expect(container.textContent).toContain("最小接入正文");
    });
    expect(container.querySelector('[contenteditable="false"]')).not.toBeNull();
    expect(container.querySelector("iframe")).toBeNull();
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
});

it("项目文档保留卡片、摘要与图标，整张卡片指向模板文档地址", async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const content: DataResult = {
    dataUrl: "https://example.com/notes/data/projects/12/33.json",
    data: {
      version: 1,
      key: "doc:project:12:33",
      meta: { type: "doc", publishTime: 1 },
      content: {
        id: 33,
        projectId: 12,
        title: "目录",
        breadcrumb: [],
        createTime: 1,
        updateTime: 1,
        content: [{
          type: "project-card-list",
          items: [{ id: 34, title: "子文档", summary: "子文档摘要", target: { key: "doc:project:12:34", type: "doc", id: 34 } }],
          children: [{ type: "formatted", text: "" }],
        }],
      },
    },
  };
  try {
    await act(async () => root.render(
      <ContentRenderer content={content} hrefFor={target => target.key === "doc:project:12:34" ? "/notes/projects/12/34" : undefined} />
    ));
    await vi.waitFor(async () => {
      await act(async () => new Promise(resolve => setTimeout(resolve, 5)));
      expect(container.querySelector("a")?.getAttribute("href")).toBe("/notes/projects/12/34");
    });
    const card = container.querySelector("a")!;
    expect(card.textContent).toBe("子文档子文档摘要");
    expect(card.querySelectorAll("svg")).toHaveLength(2);
    expect(card.className).toContain("hover:shadow-card");
    expect(card.lastElementChild?.className).toContain("line-clamp-2");
    expect(card.parentElement?.className).toContain("grid-cols-[repeat(auto-fill,minmax(15em,1fr))]");
    expect(card.firstElementChild?.closest("a")).toBe(card);
    expect(card.lastElementChild?.closest("a")).toBe(card);
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
});
