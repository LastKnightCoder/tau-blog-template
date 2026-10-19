import { beforeEach, expect, it, vi } from "vitest";
import type { DataManifest, DataResult } from "@tau/blog";
import { adaptData, initializeData, keyForRoute, routeFor } from "./data";

const client = vi.hoisted(() => ({ readManifest: vi.fn() }));
vi.mock("@tau/blog", () => ({ createClient: () => client }));

const manifest: DataManifest = {
  version: 1,
  site: { title: "博客", description: "", basePath: "/notes/" },
  items: [
    {
      key: "opaque-document",
      type: "doc",
      id: 34,
      projectId: 12,
      title: "文档",
      data: "unrelated.json",
      integrity: "",
    },
    {
      key: "opaque-list",
      type: "list",
      collectionType: "doc",
      title: "项目",
      data: "list.json",
      integrity: "",
    },
  ],
  search: { data: "indexes/custom.json", integrity: "" },
};

beforeEach(async () => {
  client.readManifest.mockResolvedValue(manifest);
  await initializeData("https://resources.example/releases/site.json");
});

it("已知内容引用、侧边栏、项目集合和标签树都保留模板链接", () => {
  const target = manifest.items[0];
  const href = "/projects/12/34";
  const adapt = (type: DataResult["data"]["meta"]["type"], content: object) =>
    adaptData({
      dataUrl: "https://example.com/data.json",
      data: {
        version: 1,
        key: target.key,
        meta: { type, publishTime: 0 },
        content,
      },
    } as DataResult).content;
  expect(adapt("home", { timeline: [{ target }] })).toMatchObject({
    timeline: [{ href }],
  });
  expect(
    adapt("card", { content: [], linkedCards: [{ target }] }),
  ).toMatchObject({ linkedCards: [{ href }] });
  expect(adapt("list", { items: [{ target }] })).toMatchObject({
    items: [{ href }],
  });
  expect(
    adapt("doc", {
      breadcrumb: [{ target }, { label: "分组" }],
      prevPage: { target },
      nextPage: { target },
    }),
  ).toMatchObject({
    breadcrumb: [{ href }, { label: "分组", href: undefined }],
    prevPage: { href },
    nextPage: { href },
    currentPath: href,
  });
  expect(
    adapt("quest", {
      target,
      answers: [{ source: { target } }, { source: { published: false } }],
      materials: [{ target }, { url: "https://example.com" }],
    }),
  ).toMatchObject({
    href,
    answers: [
      { source: { key: target.key, href } },
      { source: { published: false, href: undefined } },
    ],
    materials: [{ href }, { url: "https://example.com", href: undefined }],
  });
  const result = adaptData({
    dataUrl: "https://example.com/data.json",
    data: {
      version: 1,
      key: target.key,
      meta: { type: "article", publishTime: 0 },
      content: { title: "文章", content: [] },
      tree: [{ title: "分组", children: [{ title: "文档", target }] }],
      collections: [
        {
          type: "project",
          label: "项目",
          items: [{ id: 12, title: "项目", kind: "project", target }],
        },
      ],
      cardTagTree: [
        {
          tag: "父标签",
          count: 1,
          cards: [],
          children: [{ tag: "子标签", count: 1, cards: [{ target }] }],
        },
      ],
    },
  } as DataResult);
  expect(result.sidebar).toMatchObject([{ children: [{ href }] }]);
  expect(result.docCollections).toMatchObject([{ items: [{ href }] }]);
  expect(result.cardTagTree).toMatchObject([
    { children: [{ cards: [{ href }] }] },
  ]);
});

it("模板根据清单元数据定义路由，不解析 key 或数据文件路径", () => {
  expect(routeFor(manifest.items[0])).toBe("/projects/12/34");
  expect(keyForRoute("/projects/12/34/")).toBe("opaque-document");
  expect(keyForRoute("/projects")).toBe("opaque-list");
  expect(keyForRoute("/docs/12/34.html")).toBeUndefined();
});

it("仅映射已知引用，正文与其他字段保持原样且不修改输入", () => {
  const content = {
    id: 34,
    projectId: 12,
    title: "文档",
    createTime: 0,
    updateTime: 0,
    breadcrumb: [{ label: "项目", target: manifest.items[0] }],
    content: [
      {
        type: "custom",
        metadata: { target: { key: "plugin-private-key" } },
        children: [{ text: "内容" }],
      },
    ],
    metadata: { target: { key: "metadata-private-key" } },
  };
  const result: DataResult = {
    dataUrl: "https://another.example/objects/content.json",
    data: {
      version: 1,
      key: "opaque-document",
      meta: { type: "doc", publishTime: 0 },
      content,
    },
  };
  const first = adaptData(result);
  const second = adaptData(result);
  expect(first.content).not.toBe(second.content);
  expect(first.content).toMatchObject({
    breadcrumb: [{ label: "项目", href: "/projects/12/34" }],
    content: [{ metadata: { target: { key: "plugin-private-key" } } }],
    metadata: { target: { key: "metadata-private-key" } },
  });
  expect((first.content as { content: unknown }).content).toBe(content.content);
  expect(first.search?.href).toBe(
    "https://resources.example/releases/indexes/custom.json",
  );
  expect(result.data.content).not.toHaveProperty("currentPath");
});
