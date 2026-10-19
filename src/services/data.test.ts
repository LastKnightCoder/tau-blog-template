import { beforeEach, expect, it, vi } from "vitest";
import type { DataManifest, DataResult } from "@tau/plugins/publish-data";
import { adaptData, initializeData, keyForRoute, routeFor } from "./data";

const client = vi.hoisted(() => ({ readManifest: vi.fn() }));
vi.mock("@tau/plugins/publish-client", () => ({ createClient: () => client }));

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

it("模板根据清单元数据定义路由，不解析 key 或数据文件路径", () => {
  expect(routeFor(manifest.items[0])).toBe("/projects/12/34");
  expect(keyForRoute("/projects/12/34/")).toBe("opaque-document");
  expect(keyForRoute("/projects")).toBe("opaque-list");
  expect(keyForRoute("/docs/12/34.html")).toBeUndefined();
});

it("每次装配独立正文，只映射协议关系，不解释插件私有 target", () => {
  const result: DataResult = {
    dataUrl: "https://another.example/objects/content.json",
    data: {
      version: 1,
      key: "opaque-document",
      meta: { type: "doc", publishTime: 0 },
      content: {
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
      },
    },
  };
  const first = adaptData(result);
  const second = adaptData(result);
  expect(first.content).not.toBe(second.content);
  expect(first.content).toMatchObject({
    breadcrumb: [{ label: "项目", href: "/projects/12/34" }],
    content: [{ metadata: { target: { key: "plugin-private-key" } } }],
  });
  expect(first.search?.href).toBe(
    "https://resources.example/releases/indexes/custom.json",
  );
  expect(result.data.content).not.toHaveProperty("currentPath");
});
