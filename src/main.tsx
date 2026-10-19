import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, useLocation } from "react-router-dom";
import { UiProvider } from "@tau/editor/ui";
import { BlogDataProvider } from "./services/data-context";
import {
  adaptData,
  dataClient,
  initializeData,
  keyForRoute,
} from "./services/data";
import type { DataResult } from "@tau/editor/renderer";
import { initTheme } from "./utils";
import type { InitData } from "./types";
import HomePage from "./templates/home/HomePage";
import CardPage from "./templates/card/CardPage";
import ArticlePage from "./templates/article/ArticlePage";
import DocPage from "./templates/doc/DocPage";
import QuestPage from "./templates/quest/QuestPage";
import ListPage from "./templates/list/ListPage";
import "./styles/global.css";

const pages = {
  home: HomePage,
  card: CardPage,
  article: ArticlePage,
  doc: DocPage,
  quest: QuestPage,
  list: ListPage,
};
function BlogRouter() {
  const location = useLocation();
  const [view, setView] = useState<{
    key: string;
    data: InitData;
    content: DataResult;
  } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setError("");
    setView(null);
    (async () => {
      const key = keyForRoute(location.pathname);
      if (!key) throw new Error("页面不存在或已撤下");
      const result = await dataClient().readData({
        key,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      const data = adaptData(result);
      const query = new URLSearchParams(location.search);
      data.activeTag = query.get("tag") ?? undefined;
      if (data.meta.type === "list" && "items" in data.content)
        data.content.activeTag = data.activeTag;
      const title =
        "title" in data.content ? data.content.title : data.site.title;
      document.title = `${title || data.site.title} · ${data.site.title}`;
      setView({ key, data, content: result });
      window.scrollTo(0, 0);
    })().catch((error) => {
      if (!controller.signal.aborted)
        setError(error instanceof Error ? error.message : String(error));
    });
    return () => {
      controller.abort();
    };
  }, [location.pathname, location.search]);
  if (error)
    return (
      <main role="alert" className="mx-auto max-w-3xl p-8">
        {error}
      </main>
    );
  if (!view)
    return (
      <main role="status" className="mx-auto max-w-3xl p-8">
        正在加载…
      </main>
    );
  const Page = pages[view.data.meta.type];
  return (
    <div>
      <BlogDataProvider data={view.data} content={view.content}>
        <Page key={view.key + location.search} />
      </BlogDataProvider>
    </div>
  );
}

async function start() {
  const manifest = document.querySelector<HTMLMetaElement>(
    'meta[name="tau-manifest"]',
  )?.content;
  if (!manifest || manifest.includes("__TAU_"))
    throw new Error("请通过宿主导出的站点访问博客");
  const manifestUrl = new URL(manifest, window.location.origin).href;
  const data = await initializeData(manifestUrl);
  if (data.site.favicon) {
    const favicon = document.createElement("link");
    favicon.rel = "icon";
    favicon.type = data.site.favicon.mimeType;
    favicon.href = new URL(data.site.favicon.href, manifestUrl).href;
    document.head.append(favicon);
  }
  initTheme();
  createRoot(document.getElementById("root")!).render(
    <UiProvider>
      <HashRouter>
        <BlogRouter />
      </HashRouter>
    </UiProvider>,
  );
}
void start().catch((error) => {
  const root = document.getElementById("root")!;
  root.setAttribute("role", "alert");
  root.textContent = String(error);
});
