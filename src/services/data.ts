import { createClient } from "@tau/plugins/publish-client";
import type {
  ContentRef,
  DataManifest,
  DataResult,
} from "@tau/plugins/publish-data";
import type { InitData } from "@blog/types";
import { scopeRuntimeTailwindCss } from "./content-css";

let source: ReturnType<typeof createClient> | undefined;
let manifest: DataManifest | undefined;
let manifestResourceUrl = "";
const contentCss = new WeakMap<object, string>();
export const contentStyleText = (result: DataResult) =>
  contentCss.get(result.data) ?? "";
export async function initializeData(manifestUrl: string) {
  manifestResourceUrl = manifestUrl;
  source = createClient({ manifestUrl });
  manifest = await source.readManifest();
  return manifest;
}
export function dataClient() {
  if (!source) throw new Error("博客数据尚未初始化");
  return source;
}
export function dataManifest() {
  if (!manifest) throw new Error("博客清单尚未初始化");
  return manifest;
}

/** 路由规则属于此博客模板，数据 key 不参与公开路径协议。 */
export function routeFor(ref: ContentRef): string {
  const item = dataManifest().items.find((item) => item.key === ref.key);
  if (!item) throw new Error("目标未发布");
  if (item.type === "home") return "/";
  if (item.type === "doc") return `/projects/${item.projectId}/${item.id}`;
  if (item.type === "list") {
    const routes = {
      card: "/cards",
      article: "/articles",
      doc: "/projects",
      quest: "/quests",
    };
    if (!item.collectionType) throw new Error("集合数据缺少业务类型");
    return routes[item.collectionType];
  }
  return `/${item.type}s/${item.id}`;
}

export function keyForRoute(path: string): string | undefined {
  const normalized = path.replace(/\/$/, "") || "/";
  return dataManifest().items.find((item) => routeFor(item) === normalized)
    ?.key;
}

function resolveTargets(value: unknown, relations = true): unknown {
  if (Array.isArray(value))
    return value.map((item) => resolveTargets(item, relations));
  if (!value || typeof value !== "object") return value;
  const result: Record<string, unknown> = {};
  const source = value as Record<string, unknown>;
  const isNode =
    typeof source.text === "string" ||
    (typeof source.type === "string" && Array.isArray(source.children));
  for (const [key, entry] of Object.entries(value)) {
    if (
      relations &&
      !isNode &&
      key === "target" &&
      entry &&
      typeof entry === "object" &&
      "key" in entry
    ) {
      result.href = routeFor(entry as ContentRef);
      result.key = (entry as ContentRef).key;
    } else result[key] = resolveTargets(entry, relations && !isNode);
  }
  return result;
}

export function adaptData({ data }: DataResult): InitData {
  const source = dataManifest();
  const projectId = source.items.find(
    (item) => item.key === data.key,
  )?.projectId;
  const navigation = [
    { label: "首页", href: "/" },
    ...[
      ["card", "卡片"],
      ["article", "文章"],
      ["quest", "求索录"],
    ].flatMap(([type, label]) =>
      source.items.some(
        (item) => item.type === "list" && item.collectionType === type,
      )
        ? [{ label, href: `/${type}s` }]
        : [],
    ),
  ];
  const content = resolveTargets(data.content) as InitData["content"];
  if (data.meta.type === "doc")
    (content as unknown as Record<string, unknown>).currentPath = routeFor({
      key: data.key,
      type: "doc",
    });
  const targets = Object.fromEntries(
    Object.entries(data.contentLinkTargets ?? {}).map(([identity, ref]) => [
      identity,
      {
        ...ref,
        contentType: identity.slice(0, identity.lastIndexOf(":")),
        refId: ref.id ?? 0,
        href: routeFor(ref),
      },
    ]),
  );
  return {
    site: source.site,
    contentStyleText: contentCss.get(data),
    navigation,
    content,
    meta: data.meta,
    contentLinkTargets: targets,
    sidebar: resolveTargets(data.tree) as InitData["sidebar"],
    docCollections: (
      resolveTargets(data.collections) as InitData["docCollections"]
    )?.map((collection) => ({
      ...collection,
      items: collection.items.map((item) => ({
        ...item,
        active: data.meta.type === "doc" && item.id === projectId,
      })),
    })),
    cardTagTree: resolveTargets(data.cardTagTree) as InitData["cardTagTree"],
    search: { href: new URL(source.search.data, manifestResourceUrl).href },
    settings: data.settings as InitData["settings"],
    ...(data.pluginRenderers ? { pluginRenderers: data.pluginRenderers } : {}),
  };
}

export async function loadContentStyles(
  result: DataResult,
  scopeSelector?: string,
): Promise<() => void> {
  const styles: HTMLStyleElement[] = [];
  const sources: string[] = [];
  try {
    for (const ref of result.data.contentStyles ?? []) {
      const response = await fetch(new URL(ref.href, result.dataUrl));
      if (!response.ok) throw new Error(`正文样式加载失败：${response.status}`);
      const bytes = await response.arrayBuffer();
      const hash = [
        ...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
      ]
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
      if (hash !== ref.integrity) throw new Error("正文样式摘要错误");
      const style = document.createElement("style");
      const source = new TextDecoder().decode(bytes);
      sources.push(source);
      style.textContent = scopeRuntimeTailwindCss(source, scopeSelector);
      document.head.append(style);
      styles.push(style);
    }
    contentCss.set(result.data, sources.join("\n"));
    return () => styles.forEach((style) => style.remove());
  } catch (error) {
    styles.forEach((style) => style.remove());
    throw error;
  }
}
