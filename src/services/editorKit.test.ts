import { describe, expect, it } from "vitest";
import { getBlogKit } from "./editorKit";

describe("博客正文组合", () => {
  it("同一发布设置复用 kit，保留已拆扩展", () => {
    const settings = { appearance: { image: { borderRadius: "md" as const } } };
    const kit = getBlogKit(settings);
    expect(kit.elementTypes).toEqual(
      expect.arrayContaining(["content-link", "webview"]),
    );
    expect(getBlogKit(settings)).toBe(kit);
    expect(getBlogKit()).toBe(getBlogKit());
    expect(getBlogKit({ ...settings })).not.toBe(kit);
    for (const id of [
      "tau.mark.bold",
      "tau.header.promote",
      "tau.transform.to.bulleted-list",
      "tau.preview.edit",
    ])
      expect(kit.assembly.commands.get(id), id).toBeDefined();
    expect(
      kit.assembly.commandHotkeys.some((entry) => entry.hotkey.key === "mod+b"),
    ).toBe(true);
    expect(kit.assembly.hoveringBarElements.length).toBeGreaterThan(0);
    expect(
      kit.extensions.filter((extension) => extension.id === "tau.preview-menu"),
    ).toHaveLength(1);
    for (const type of ["mermaid", "plantuml"])
      expect(kit.elementTypes).toContain(type);
    for (const type of [
      "html-block",
      "html-inline",
      "abc",
      "tikz",
      "typst",
      "custom-block",
    ])
      expect(kit.elementTypes).not.toContain(type);
  });
});
