import {
  type EditorExtension,
  webviewExtension,
} from "@tau/blog/editor";
import { blogContentLinkExtension } from "./contentLinkExtension";

export const blogEditorExtensions: EditorExtension[] = [
  blogContentLinkExtension,
  webviewExtension,
];
