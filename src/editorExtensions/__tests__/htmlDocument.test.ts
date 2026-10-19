import { expect, it } from "vitest";
import { htmlDocumentSource } from "../htmlDocumentExtension";
it("全页 HTML 在自己的文档中注入已验证 CSS，保留 doctype、脚本与特殊属性", () => {
  const result = htmlDocumentSource(
    '<!doctype html><html data-title="a>b"><body><script>window.fullPageValue=1</script><button>正文</button></body></html>',
    ".text-red-500{color:red}",
  );
  const parsed = new DOMParser().parseFromString(result, "text/html");
  expect(parsed.doctype?.name).toBe("html");
  expect(parsed.documentElement.getAttribute("data-title")).toBe("a>b");
  expect(
    parsed.head.querySelector("style[data-tau-content-css]")?.textContent,
  ).toContain("text-red-500");
  expect(parsed.querySelector("script")?.textContent).toBe(
    "window.fullPageValue=1",
  );
  expect((window as any).fullPageValue).toBeUndefined();
});
