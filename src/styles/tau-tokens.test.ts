import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";
import postcss from "postcss";

const editorCss = readFileSync(createRequire(import.meta.url).resolve("@tau/editor/styles.css"), "utf8");
const requiredTokens = [...new Set(editorCss.match(/--tau-[\w-]+(?=\s*:)/g))];
function collectCssVars(css: string) {
  const blocks = new Map<string, Record<string, string>>();
  postcss.parse(css).walkRules(rule => {
    for (const selector of postcss.list.comma(rule.selector)) {
      const values = blocks.get(selector.trim()) ?? {};
      rule.walkDecls(/^--/, declaration => { values[declaration.prop] = declaration.value; });
      blocks.set(selector.trim(), values);
    }
  });
  return blocks;
}
function resolveCssVars(blocks: Map<string, Record<string, string>>, scopes: string[]) {
  const values = Object.assign({}, ...scopes.map(scope => blocks.get(scope)));
  const resolve = (word: string, seen = new Set<string>()): string => {
    if (seen.has(word)) return "";
    return (values[word] ?? "").replace(/var\((--[\w-]+)(?:,\s*([^)]*))?\)/g, (_: string, next: string, fallback: string) => resolve(next, new Set([...seen, word])) || fallback || "");
  };
  return (word: string) => resolve(word);
}
const missingTokenWords = (resolve: (word: string) => string) => requiredTokens.filter(word => !resolve(word));

/**
 * blog 明暗两套都必须桥接出完整的 --tau-*（编辑器等公共包只认这套契约）。
 * 层叠与页面一致：global.css 的 :root / [data-theme] → legacy-palette.css 的 html[data-theme]
 * （更具体，覆盖同名变量）→ tau-tokens.css 桥接。
 */
const read = (file: string) =>
  readFileSync(resolve(import.meta.dirname, file), "utf8");
const blocks = collectCssVars(
  editorCss + read("global.css") + read("legacy-palette.css") + read("tau-tokens.css"),
);

const scopes = (mode: "light" | "dark") => [
  ":root",
  `[data-theme="${mode}"]`,
  `html[data-theme="${mode}"]`,
];

describe("blog --tau-* 桥接", () => {
  for (const mode of ["light", "dark"] as const) {
    it(`${mode} 全部 token 有值`, () => {
      expect(missingTokenWords(resolveCssVars(blocks, scopes(mode)))).toEqual(
        [],
      );
    });
  }

  it("桥接跟随页面实际配色：页面底色取旧配色层覆盖后的值", () => {
    const light = resolveCssVars(blocks, scopes("light"));
    const dark = resolveCssVars(blocks, scopes("dark"));
    expect(light("--tau-bg-page")).toBe("#f3f4f6");
    expect(dark("--tau-bg-page")).toBe("#010409");
  });
});
