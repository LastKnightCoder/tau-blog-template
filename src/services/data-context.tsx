import { createContext, useContext, type ReactNode } from "react";
import type { InitData } from "@blog/types";
import { PublishedContentCss } from "../published/PublishedContent";
import type { ContentPluginDefinition as PluginDefinition } from "@blog/published/resources";

const BlogDataContext = createContext<InitData | null>(null);
const emptyPlugins: readonly PluginDefinition[] = [];
const BlogPluginsContext = createContext(emptyPlugins);
export function BlogDataProvider({
  data,
  plugins = emptyPlugins,
  children,
}: {
  data: InitData;
  plugins?: readonly PluginDefinition[];
  children: ReactNode;
}) {
  return (
    <BlogDataContext.Provider value={data}>
      <BlogPluginsContext.Provider value={plugins}>
        <PublishedContentCss value={data.contentStyleText ?? ""}>{children}</PublishedContentCss>
      </BlogPluginsContext.Provider>
    </BlogDataContext.Provider>
  );
}
export const useBlogPlugins = () => useContext(BlogPluginsContext);
export function useInitData() {
  const data = useContext(BlogDataContext);
  if (!data) throw new Error("博客数据上下文缺失");
  return data;
}
