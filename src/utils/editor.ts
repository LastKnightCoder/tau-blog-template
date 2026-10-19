import type { Editor, Node } from "slate";
import type { HeaderElement } from "@tau/blog/editor";
import { ReactEditor } from "slate-react";

export const getInlineElementText = (
  value: unknown,
  editor?: Editor,
): string => {
  if (!value || typeof value !== "object") return "";
  const element = value as {
    type?: string;
    text?: string;
    tex?: string;
    alt?: string;
    children?: { text?: string }[];
  };
  if (
    (element as { type?: string }).type === "content-link" &&
    "children" in element &&
    Array.isArray(element.children)
  ) {
    const firstChild = element.children[0] as { text?: string } | undefined;
    return firstChild?.text ?? "";
  }

  switch (element.type) {
    case "formatted":
      return element.text ?? "";
    case "link":
    case "underline":
    case "styled-text":
      return element.children?.[0]?.text ?? "";
    case "inline-math":
      return element.tex ?? "";
    case "inline-image":
      return element.alt ?? "[Image]";
    default:
      if (editor) {
        try {
          return ReactEditor.toDOMNode(editor, value as Node).textContent ?? "";
        } catch {
          return "";
        }
      }
      return (
        element.children
          ?.map((child) => getInlineElementText(child))
          .join("") ?? ""
      );
  }
};

/** 正文顶层标题，供目录使用。 */
export function extractHeaders(content: unknown[], editor?: Editor) {
  const headers: { level: number; title: string }[] = [];
  for (const node of content) {
    if (node && typeof node === "object") {
      const n = node as Record<string, unknown>;
      if (n.type === "header" && Array.isArray(n.children)) {
        const header = n as unknown as HeaderElement;
        headers.push({
          level: header.level,
          title: header.children
            .map((child) => getInlineElementText(child, editor))
            .join(""),
        });
      }
    }
  }
  return headers;
}
