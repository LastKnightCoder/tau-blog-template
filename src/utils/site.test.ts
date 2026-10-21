import { describe, expect, it } from "vitest";
import { siteHero } from "./site";

describe("siteHero", () => {
  it("站点描述来自模板声明的字段", () => {
    expect(
      siteHero({
        title: "博客",
        basePath: "/",
        fields: { description: " 记录 " },
      }),
    ).toEqual({ title: "博客", description: "记录" });
  });
  it("描述为空或类型不符时不显示介绍区", () => {
    expect(siteHero({ title: "博客", basePath: "/" })).toBeUndefined();
    expect(
      siteHero({ title: "博客", basePath: "/", fields: { description: true } }),
    ).toBeUndefined();
  });
});
