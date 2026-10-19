import { expect, it, vi } from "vitest";
import { ReactEditor } from "slate-react";
import type { Editor } from "slate";
import { getInlineElementText } from "./editor";

it("未知行内插件的目录文字来自实际渲染结果，不读取插件私有字段", () => {
  const dom = document.createElement("span");
  dom.textContent = "插件展示文字";
  const read = vi.spyOn(ReactEditor, "toDOMNode").mockReturnValue(dom);
  const element = { type: "example.inline", children: [{ text: "" }] };
  Object.defineProperty(element, "html", {
    get() {
      throw Error("不得读取插件字段");
    },
  });
  try {
    expect(getInlineElementText(element, {} as Editor)).toBe("插件展示文字");
    expect(getInlineElementText({ type: "inline-math", tex: "x+y" })).toBe(
      "x+y",
    );
    expect(getInlineElementText({ type: "inline-image", alt: "图片" })).toBe(
      "图片",
    );
  } finally {
    read.mockRestore();
  }
});
