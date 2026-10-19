import { createClient } from "@tau/blog";
import type { ContentRef, DataManifest, DataResult } from "@tau/blog";
import type { InitData, SidebarItem, CardTagTree } from "@blog/types";
import type * as Published from "@tau/blog";

let source: ReturnType<typeof createClient> | undefined;
let manifest: DataManifest | undefined;
let manifestResourceUrl = "";
let routes = new Map<string, string>();
let keysByRoute = new Map<string, string>();
export async function initializeData(manifestUrl: string) {
  manifestResourceUrl = manifestUrl;
  source = createClient({ manifestUrl });
  manifest = await source.readManifest();
  routes = new Map(manifest.items.map((item) => [item.key, routeOf(item)]));
  keysByRoute = new Map([...routes].map(([key, route]) => [route, key]));
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
function routeOf(item: DataManifest["items"][number]): string {
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

export function routeFor(ref: ContentRef): string {
  const route = routes.get(ref.key);
  if (!route) throw new Error("目标未发布");
  return route;
}

export function keyForRoute(path: string): string | undefined {
  return keysByRoute.get(path.replace(/\/$/, "") || "/");
}

function adaptContent(data: Published.PublishedData) {
  switch (data.meta.type) {
    case "home": {
      const content = data.content as Published.HomeData;
      return {
        ...content,
        timeline: content.timeline.map((item) => ({
          ...item,
          href: routeFor(item.target),
        })),
      };
    }
    case "card": {
      const content = data.content as Published.CardData;
      return {
        ...content,
        linkedCards: content.linkedCards?.map((item) => ({
          ...item,
          href: routeFor(item.target),
        })),
      };
    }
    case "article":
      return { ...data.content };
    case "doc": {
      const content = data.content as Published.DocData;
      return {
        ...content,
        currentPath: routeFor({ key: data.key, type: "doc" }),
        breadcrumb: content.breadcrumb.map((item) => ({
          ...item,
          href: item.target ? routeFor(item.target) : undefined,
        })),
        prevPage: content.prevPage && {
          ...content.prevPage,
          href: routeFor(content.prevPage.target),
        },
        nextPage: content.nextPage && {
          ...content.nextPage,
          href: routeFor(content.nextPage.target),
        },
      };
    }
    case "quest": {
      const content = data.content as Published.QuestData;
      return {
        ...content,
        href: routeFor(content.target),
        answers: content.answers.map((answer) => ({
          ...answer,
          source: answer.source && {
            ...answer.source,
            key: answer.source.target?.key,
            href: answer.source.target
              ? routeFor(answer.source.target)
              : undefined,
          },
        })),
        materials: content.materials.map((item) => ({
          ...item,
          href: item.target ? routeFor(item.target) : undefined,
        })),
      };
    }
    case "list": {
      const content = data.content as Published.ListData;
      return {
        ...content,
        items: content.items.map((item) => ({
          ...item,
          href: routeFor(item.target),
        })),
      };
    }
  }
}

function sidebarItems(items: Published.TreeItem[]): SidebarItem[] {
  return items.map((item) => ({
    ...item,
    href: item.target ? routeFor(item.target) : undefined,
    children: item.children && sidebarItems(item.children),
  }));
}

function cardTags(items: Published.CardTagTree[]): CardTagTree[] {
  return items.map((item) => ({
    ...item,
    cards: item.cards.map((card) => ({ ...card, href: routeFor(card.target) })),
    children: item.children ? cardTags(item.children) : [],
  }));
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
  const content = adaptContent(data) as InitData["content"];
  const tree = projectId === undefined ? undefined : source.projectTrees?.[projectId];
  return {
    site: source.site,
    navigation,
    content,
    meta: data.meta,
    contentLinkTargets: linkTargets(source),
    sidebar: tree && sidebarItems(tree),
    docCollections: source.collections?.map((collection) => ({
      ...collection,
      items: collection.items.map((item) => ({
        ...item,
        href: routeFor(item.target),
        active: data.meta.type === "doc" && item.id === projectId,
      })),
    })),
    cardTagTree: source.cardTagTree && cardTags(source.cardTagTree),
    search: { href: new URL(source.search.data, manifestResourceUrl).href },
    settings: source.settings as InitData["settings"],
  };
}

/** 站内链接目标键为 `${contentType}:${refId}`：卡片、文章即清单 key，项目条目查清单 contentLinkTargets。 */
const linkTargetCache = new WeakMap<DataManifest, InitData["contentLinkTargets"]>();
function linkTargets(source: DataManifest): InitData["contentLinkTargets"] {
  let targets = linkTargetCache.get(source);
  if (!targets) {
    const refs: [string, ContentRef][] = [
      ...source.items
        .filter((item) => item.type === "card" || item.type === "article")
        .map((item): [string, ContentRef] => [item.key, item]),
      ...Object.entries(source.contentLinkTargets ?? {}),
    ];
    targets = Object.fromEntries(
      refs.map(([identity, ref]) => [
        identity,
        {
          key: ref.key,
          type: ref.type,
          id: ref.id,
          contentType: identity.slice(0, identity.lastIndexOf(":")),
          refId: Number(identity.slice(identity.lastIndexOf(":") + 1)),
          href: routeFor(ref),
        },
      ]),
    );
    linkTargetCache.set(source, targets);
  }
  return targets;
}
