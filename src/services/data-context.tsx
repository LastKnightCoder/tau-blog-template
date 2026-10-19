import { createContext, useContext, type ReactNode } from "react";
import type { InitData } from "@blog/types";
import type { DataResult } from "@tau/blog";

const BlogDataContext = createContext<InitData | null>(null);
const BlogContentContext = createContext<DataResult | undefined>(undefined);
export function BlogDataProvider({
  data,
  content,
  children,
}: {
  data: InitData;
  content?: DataResult;
  children: ReactNode;
}) {
  return (
    <BlogDataContext.Provider value={data}>
      <BlogContentContext.Provider value={content}>
        {children}
      </BlogContentContext.Provider>
    </BlogDataContext.Provider>
  );
}
export function useBlogContent() {
  const content = useContext(BlogContentContext);
  if (!content) throw new Error("博客正文上下文缺失");
  return content;
}
export function useInitData() {
  const data = useContext(BlogDataContext);
  if (!data) throw new Error("博客数据上下文缺失");
  return data;
}
