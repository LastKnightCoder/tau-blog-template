import type { Editor, Node } from "slate";
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
