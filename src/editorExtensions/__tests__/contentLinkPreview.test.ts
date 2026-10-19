import { beforeEach, expect, it, vi } from "vitest";
import {
  loadContentLinkPreview,
  resolveContentLinkTarget,
} from "../contentLinkPreview";
const read = vi.hoisted(() => vi.fn());
vi.mock("@blog/services/data", () => ({
  dataClient: () => ({ readData: read }),
  adaptData: (result: any) => JSON.parse(JSON.stringify(result.data)),
}));
beforeEach(() => read.mockReset());
it("正文身份映射到数据 key，公开路径由模板自行生成", () => {
  const target = {
    key: "doc:project:12:34",
    contentType: "project-item",
    refId: 34,
    href: "/author/doc",
  };
  expect(
    resolveContentLinkTarget(
      { contentType: "project-item", refId: 34 },
      { "project-item:34": target },
    ),
  ).toEqual(target);
  expect(
    resolveContentLinkTarget({ contentType: "card", refId: 99 }, {}),
  ).toBeNull();
});
it("按 key 读取，数据缓存留给数据层，每个预览独立装配渲染数据", async () => {
  read.mockResolvedValue({
    data: {
      meta: { type: "article" },
      content: { title: "正文", content: [{ text: "内容" }] },
    },
    dataUrl: "https://data.example/data/articles/12.hash.json",
  });
  const [first, second] = await Promise.all([
    loadContentLinkPreview("article:12", "标题"),
    loadContentLinkPreview("article:12", "标题"),
  ]);
  expect(read).toHaveBeenCalledWith({ key: "article:12" });
  expect(first.content).not.toBe(second.content);
  expect(first.initData).not.toBe(second.initData);
  expect(first.result.dataUrl).toBe(
    "https://data.example/data/articles/12.hash.json",
  );
});
it("失败不缓存，下一次可重试", async () => {
  read.mockRejectedValueOnce(new Error("数据不可用")).mockResolvedValue({
    data: {
      meta: { type: "card" },
      content: { content: [{ text: "恢复" }] },
    },
    dataUrl: "https://data.example/card.json",
  });
  await expect(loadContentLinkPreview("card:1", "卡片")).rejects.toThrow(
    "数据不可用",
  );
  expect((await loadContentLinkPreview("card:1", "卡片")).title).toBe("卡片");
});
