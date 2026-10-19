import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { Tooltip } from "./Tooltip";
import { showToast } from "./toast";

it("模板自己的悬停预览支持延迟、移入面板和 Esc 关闭", () => {
  vi.useFakeTimers();
  const previous = (globalThis as Record<string, unknown>)
    .IS_REACT_ACT_ENVIRONMENT;
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const change = vi.fn();
  try {
    act(() =>
      root.render(
        <Tooltip
          delay={30}
          onOpenChange={change}
          content={<button>预览交互</button>}
        >
          <a href="#">触发</a>
        </Tooltip>,
      ),
    );
    act(() =>
      container
        .querySelector("a")!
        .dispatchEvent(new MouseEvent("pointerover", { bubbles: true })),
    );
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
    act(() => vi.advanceTimersByTime(30));
    expect(document.querySelector('[role="tooltip"]')?.textContent).toBe(
      "预览交互",
    );
    expect(change).toHaveBeenLastCalledWith(true);
    act(() =>
      container
        .querySelector("a")!
        .dispatchEvent(
          new MouseEvent("pointerout", {
            bubbles: true,
            relatedTarget: document.body,
          }),
        ),
    );
    act(() =>
      document
        .querySelector('[role="tooltip"]')!
        .dispatchEvent(new MouseEvent("pointerover", { bubbles: true })),
    );
    act(() => vi.advanceTimersByTime(150));
    expect(document.querySelector('[role="tooltip"]')).not.toBeNull();
    act(() =>
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      ),
    );
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
    expect(change).toHaveBeenLastCalledWith(false);
  } finally {
    act(() => root.unmount());
    container.remove();
    vi.useRealTimers();
    (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = previous;
  }
});

it("模板提示只显示文本并自动清理", () => {
  vi.useFakeTimers();
  const remove = showToast("目标未发布 <b>保留文本</b>");
  try {
    const notice = document.querySelector('[role="status"]')!;
    expect(notice.textContent).toContain("<b>保留文本</b>");
    expect(notice.querySelector("b")).toBeNull();
    vi.advanceTimersByTime(3000);
    expect(document.body.contains(notice)).toBe(false);
  } finally {
    remove();
    vi.useRealTimers();
  }
});
