export function showToast(message: string) {
  const element = document.createElement("div");
  element.setAttribute("role", "status");
  element.className =
    "fixed bottom-6 left-1/2 z-[1100] max-w-[calc(100vw-32px)] -translate-x-1/2 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-elevated)] px-4 py-2 text-sm text-[var(--color-text-primary)] shadow-lg";
  element.textContent = message;
  document.body.append(element);
  const timer = setTimeout(() => element.remove(), 3000);
  return () => {
    clearTimeout(timer);
    element.remove();
  };
}
