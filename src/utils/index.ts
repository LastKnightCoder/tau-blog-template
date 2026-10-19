/**
 * 格式化日期
 */
export function formatDate(
  timestamp: number,
  format: "full" | "short" | "relative" = "short",
): string {
  const date = new Date(timestamp);

  if (format === "relative") {
    const now = Date.now();
    const diff = now - timestamp;
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const month = 30 * day;
    const year = 365 * day;

    if (diff < minute) return "刚刚";
    if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`;
    if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
    if (diff < month) return `${Math.floor(diff / day)} 天前`;
    if (diff < year) return `${Math.floor(diff / month)} 个月前`;
    return `${Math.floor(diff / year)} 年前`;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  if (format === "short") {
    return `${year}-${month}-${day}`;
  }

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * 拼接 basePath 和路径
 * 路由格式由此模板维护。
 */
export function joinPath(basePath: string, path: string): string {
  if (/^(https?:)?\/\//.test(path)) return path;
  const base = basePath.endsWith("/") ? basePath : basePath + "/";
  const route = path.startsWith("/") ? path : "/" + path;
  return base + "#" + route;
}

/**
 * 截取摘要
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
}

/**
 * 从 Descendant[] 中提取纯文本
 */
export function getPlainText(nodes: unknown[]): string {
  return nodes
    .map((node) => {
      if (typeof node === "string") return node;
      if (node && typeof node === "object") {
        const n = node as Record<string, unknown>;
        if ("text" in n && typeof n.text === "string") return n.text;
        if ("children" in n && Array.isArray(n.children)) {
          return getPlainText(n.children);
        }
      }
      return "";
    })
    .join("");
}

/**
 * 获取阅读时间（分钟）
 */
export function getReadingTime(content: unknown[] | string): number {
  const text =
    typeof content === "string"
      ? content.replace(/<[^>]*>/g, "")
      : getPlainText(content);
  // 中文字符按 300 字/分钟，英文按 200 词/分钟
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
  const minutes = Math.ceil(chineseChars / 300 + englishWords / 200);
  return Math.max(1, minutes);
}

/**
 * 生成目录锚点 ID
 */
export function generateAnchorId(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u4e00-\u9fa5-]/g, "");
}

/**
 * 获取当前主题
 */
export const BLOG_THEME_CHANGE_EVENT = "tau-blog-theme-change";

export function getTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem("theme");
  if (stored === "dark" || stored === "light") return stored;
  if (typeof window.matchMedia !== "function") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * 检测是否是暗色模式
 */
export function isDarkMode(): boolean {
  return getTheme() === "dark";
}

/**
 * 将主题状态同步到文档根节点：data-theme（blog 配色）、data-mode（@tau/themes 约定的明暗）、
 * .dark（Tailwind dark 变体）
 */
export function applyThemeToDocument(theme: "light" | "dark"): void {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.setAttribute("data-mode", theme);
  document.documentElement.classList.toggle("dark", theme === "dark");
}

/**
 * 切换主题
 */
export function toggleTheme(): void {
  const current = getTheme();
  const next = current === "dark" ? "light" : "dark";
  applyThemeToDocument(next);
  localStorage.setItem("theme", next);
  window.dispatchEvent(new Event(BLOG_THEME_CHANGE_EVENT));
}

/**
 * 初始化主题
 */
export function initTheme(): void {
  const theme = getTheme();
  applyThemeToDocument(theme);
}
