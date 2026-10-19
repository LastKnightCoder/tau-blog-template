import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export function Tooltip({
  children,
  content,
  placement = "bottom",
  delay = 350,
  className,
  onOpenChange,
}: {
  children: ReactNode;
  content: ReactNode;
  placement?: "top" | "bottom";
  delay?: number;
  className?: string;
  onOpenChange?: (open: boolean) => void;
}) {
  const trigger = useRef<HTMLSpanElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const change = useRef(onOpenChange);
  change.current = onOpenChange;
  const visible = useRef(false);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const update = useCallback((next: boolean) => {
    if (visible.current === next) return;
    visible.current = next;
    setOpen(next);
    change.current?.(next);
  }, []);
  const schedule = (next: boolean, wait: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => update(next), wait);
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      if (!trigger.current || !panel.current) return;
      const anchor = trigger.current.getBoundingClientRect();
      const box = panel.current.getBoundingClientRect();
      const preferred =
        placement === "top" ? anchor.top - box.height - 6 : anchor.bottom + 6;
      setPosition({
        top: Math.max(
          8,
          Math.min(preferred, window.innerHeight - box.height - 8),
        ),
        left: Math.max(
          8,
          Math.min(
            anchor.left + (anchor.width - box.width) / 2,
            window.innerWidth - box.width - 8,
          ),
        ),
      });
    };
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") update(false);
    };
    const observer =
      typeof ResizeObserver === "function"
        ? new ResizeObserver(place)
        : undefined;
    if (panel.current) observer?.observe(panel.current);
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    document.addEventListener("keydown", keydown);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      document.removeEventListener("keydown", keydown);
    };
  }, [open, placement, update]);
  return (
    <>
      <span
        ref={trigger}
        onPointerEnter={() => schedule(true, delay)}
        onPointerLeave={() => schedule(false, 120)}
        onFocus={() => schedule(true, 0)}
        onBlur={() => schedule(false, 120)}
      >
        {children}
      </span>
      {open &&
        createPortal(
          <div
            ref={panel}
            role="tooltip"
            style={{ position: "fixed", ...position, zIndex: 1000 }}
            onPointerEnter={() => {
              clearTimeout(timer.current);
            }}
            onPointerLeave={() => schedule(false, 120)}
            onFocus={() => clearTimeout(timer.current)}
            onBlur={() => schedule(false, 120)}
            className={
              className ??
              "max-w-[calc(100vw-24px)] rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-elevated)] px-3 py-2 text-sm text-[var(--color-text-primary)] shadow-lg"
            }
          >
            {content}
          </div>,
          document.body,
        )}
    </>
  );
}
