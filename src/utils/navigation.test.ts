import { afterEach, expect, it, vi } from "vitest";
import { connectNavigation, interceptSiteLinks, siteRoute } from "./navigation";

let disconnect: (() => void) | undefined;
afterEach(() => {
  disconnect?.();
  document.body.innerHTML = "";
  window.history.replaceState(null, "", "/");
});

it("站内链接转成 Router 路由，站外与仅锚点链接交给浏览器", () => {
  window.history.replaceState(null, "", "/notes/cards/1");
  disconnect = connectNavigation("/notes/", () => undefined);
  expect(siteRoute("/notes/projects/12/34?x=1")).toBe("/projects/12/34?x=1");
  expect(siteRoute("/notes/")).toBe("/");
  expect(siteRoute("/notes")).toBe("/");
  expect(siteRoute("/other/cards/1")).toBeUndefined();
  expect(siteRoute("https://example.com/notes/cards/1")).toBeUndefined();
  expect(siteRoute("/notes/cards/1#ref-2")).toBeUndefined();
});

it("左键点击站内链接不整页跳转，修饰键与新窗口保持浏览器默认行为", () => {
  const go = vi.fn();
  disconnect = connectNavigation("/notes/", go);
  document.body.innerHTML =
    '<a id="in" href="/notes/articles/3">a</a><a id="blank" target="_blank" href="/notes/articles/3">b</a>';
  document.addEventListener("click", interceptSiteLinks);
  // 记录拦截结果后再阻止默认行为，避免 jsdom 尝试真实跳转。
  let intercepted = false;
  const record = (event: MouseEvent) => {
    intercepted = event.defaultPrevented;
    event.preventDefault();
  };
  document.addEventListener("click", record);
  const click = (id: string, init: MouseEventInit = {}) => {
    const event = new MouseEvent("click", { bubbles: true, cancelable: true, ...init });
    document.getElementById(id)!.dispatchEvent(event);
    return intercepted;
  };
  expect(click("in")).toBe(true);
  expect(go).toHaveBeenCalledWith("/articles/3");
  expect(click("in", { metaKey: true })).toBe(false);
  expect(click("blank")).toBe(false);
  expect(go).toHaveBeenCalledTimes(1);
  document.removeEventListener("click", interceptSiteLinks);
  document.removeEventListener("click", record);
});
