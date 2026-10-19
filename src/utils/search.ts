import Fuse, { type FuseResult, type IFuseOptions } from "fuse.js";
import type { SearchItem } from "@blog/types";
import { dataManifest, routeFor } from "@blog/services/data";
import type { SearchFile } from "@tau/plugins/publish-data";
export const SEARCH_RECENT_QUERIES_KEY = "blog:search:recent-queries";
export const SEARCH_RECENT_QUERIES_LIMIT = 5;
export const SEARCH_RESULT_LIMIT = 12;
export const BLOG_SEARCH_OPTIONS: IFuseOptions<SearchItem> = {
  includeMatches: true,
  includeScore: true,
  threshold: 0.35,
  ignoreLocation: true,
  minMatchCharLength: 1,
  keys: [
    { name: "title", weight: 0.42 },
    { name: "tags", weight: 0.2 },
    { name: "typeLabel", weight: 0.12 },
    { name: "summary", weight: 0.16 },
    { name: "content", weight: 0.1 },
  ],
};
export type BlogSearchResult = FuseResult<SearchItem>;
export interface BlogSearchIndex {
  search: (query: string) => BlogSearchResult[];
}
function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function normalizeQuery(query: string): string {
  return query.replace(/\s+/g, " ").trim();
}

export function readRecentSearchQueries(): string[] {
  const storage = getStorage();
  if (!storage) {
    return [];
  }

  try {
    const parsed = JSON.parse(
      storage.getItem(SEARCH_RECENT_QUERIES_KEY) || "[]",
    );
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((query): query is string => typeof query === "string")
      .map(normalizeQuery)
      .filter(Boolean)
      .slice(0, SEARCH_RECENT_QUERIES_LIMIT);
  } catch {
    return [];
  }
}

export function saveRecentSearchQuery(query: string): string[] {
  const normalized = normalizeQuery(query);
  if (!normalized) {
    return readRecentSearchQueries();
  }

  const nextQueries = [
    normalized,
    ...readRecentSearchQueries().filter((item) => item !== normalized),
  ].slice(0, SEARCH_RECENT_QUERIES_LIMIT);

  const storage = getStorage();
  if (storage) {
    storage.setItem(SEARCH_RECENT_QUERIES_KEY, JSON.stringify(nextQueries));
  }

  return nextQueries;
}

export function clearRecentSearchQueries(): void {
  const storage = getStorage();
  storage?.removeItem(SEARCH_RECENT_QUERIES_KEY);
}

export async function loadBlogSearchIndex(
  href: string,
): Promise<BlogSearchIndex> {
  const manifest = dataManifest();
  const response = await fetch(href);
  if (!response.ok) throw new Error(`搜索索引加载失败：${response.status}`);
  const bytes = await response.arrayBuffer();
  const hash = [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  if (hash !== manifest.search.integrity) throw new Error("搜索索引摘要错误");
  const source = JSON.parse(new TextDecoder().decode(bytes)) as SearchFile;
  if (source.version !== 1 || !Array.isArray(source.documents))
    throw new Error("搜索索引格式错误");
  const items: SearchItem[] = source.documents.map((document) => {
    const type = document.type === "doc" ? "project-doc" : document.type;
    return {
      ...document,
      type,
      typeLabel: {
        card: "卡片",
        article: "文章",
        "project-doc": "项目文档",
        quest: "求索录",
      }[type],
      href: routeFor(document),
    };
  });
  const fuse = new Fuse(items, BLOG_SEARCH_OPTIONS);
  return {
    search: (query) => fuse.search(query, { limit: SEARCH_RESULT_LIMIT }),
  };
}
