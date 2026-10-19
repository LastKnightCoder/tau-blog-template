import { BlogDataProvider } from "@blog/services/data-context";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import DocPage from "./DocPage";
import {
  mockDocPageSidebarDemoData,
  publishedResult,
} from "@blog/test-fixtures/page-data";

vi.mock("@tau/blog", () => ({
  ContentRenderer: () => <div data-slate-editor="true" />,
}));

vi.mock("@blog/components/Outline", () => ({
  default: () => null,
}));

vi.mock("@blog/components/Common", () => ({
  Breadcrumb: ({ items }: { items: { label: string }[] }) => (
    <nav>{items.map((item) => item.label).join(" / ")}</nav>
  ),
  ScrollToTop: () => null,
}));

describe("DocPage", () => {
  let container: HTMLDivElement;
  let root: Root;
  const originalActEnvironment = (globalThis as Record<string, unknown>)
    .IS_REACT_ACT_ENVIRONMENT;

  beforeEach(() => {
    (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    HTMLElement.prototype.scrollIntoView = vi.fn();
    window.localStorage.clear();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    document.body.innerHTML = "";
    (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT =
      originalActEnvironment;
    vi.restoreAllMocks();
  });

  it("移动端 Header 菜单应包含当前文档树导航", async () => {
    await act(async () => {
      root.render(
        <BlogDataProvider
          data={mockDocPageSidebarDemoData}
          content={publishedResult(mockDocPageSidebarDemoData)}
        >
          <DocPage />
        </BlogDataProvider>,
      );
    });

    const menuButton = container.querySelector(
      'button[aria-label="菜单"]',
    ) as HTMLButtonElement | null;
    expect(menuButton).not.toBeNull();

    await act(async () => {
      menuButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(menuButton?.getAttribute("aria-expanded")).toBe("true");
    expect(container.textContent).toContain("项目");
    expect(container.textContent).toContain("0.4");
    expect(container.textContent).toContain("0.4.4");
    expect(container.querySelectorAll("aside").length).toBeGreaterThanOrEqual(
      2,
    );
  });
});
