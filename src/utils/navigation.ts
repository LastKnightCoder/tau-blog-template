/**
 * 站内导航：链接是普通 <a href>，点击时转给 Router，避免整页重载；站外与新窗口链接交给浏览器。
 */
let basePath = "/";
let navigate: ((route: string) => void) | undefined;

export function connectNavigation(base: string, go: (route: string) => void) {
  basePath = base.endsWith("/") ? base : base + "/";
  navigate = go;
  return () => {
    if (navigate === go) navigate = undefined;
  };
}

/** 把同站链接换成 Router 路由；站外链接或只改锚点时返回 undefined。 */
export function siteRoute(href: string): string | undefined {
  const url = new URL(href, window.location.href);
  if (url.origin !== window.location.origin) return undefined;
  const inSite = url.pathname.startsWith(basePath) || url.pathname + "/" === basePath;
  if (!inSite) return undefined;
  if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash)
    return undefined;
  return "/" + url.pathname.slice(basePath.length) + url.search + url.hash;
}

export function openSiteLink(href: string) {
  const route = siteRoute(href);
  if (route !== undefined && navigate) navigate(route);
  else window.location.href = href;
}

export function interceptSiteLinks(event: MouseEvent) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
    return;
  const anchor = (event.target as Element | null)?.closest?.("a[href]");
  if (!(anchor instanceof HTMLAnchorElement)) return;
  if ((anchor.target && anchor.target !== "_self") || anchor.hasAttribute("download")) return;
  const route = siteRoute(anchor.href);
  if (route === undefined || !navigate) return;
  event.preventDefault();
  navigate(route);
}
