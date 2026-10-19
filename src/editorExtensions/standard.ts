import type { AnyExtension } from "@tau/editor/api";
import blockquote from "@tau/editor-blockquote";
import callout from "@tau/editor-callout";
import detail from "@tau/editor-detail";
import highlightBlock from "@tau/editor-highlight-block";
import { defaultMenuExtension } from "@tau/editor";
import { textFormattingExtension } from "@tau/editor-text-formatting";
import { tabsExtensions } from "@tau/editor-tabs";
import header from "@tau/editor-header";
import { tableExtensions } from "@tau/editor-table";
import { listExtensions } from "@tau/editor-list";
import { default as link } from "@tau/editor-link";
import { default as comment } from "@tau/editor-comment";
import { default as divideLine } from "@tau/editor-divide-line";
import { default as kbd } from "@tau/editor-kbd";
import { default as frontMatter } from "@tau/editor-front-matter";
import { default as annotation } from "@tau/editor-annotation";
import { default as underline } from "@tau/editor-underline";
import { default as styledText } from "@tau/editor-styled-text";
import {
  image,
  inlineImage,
  imageGallery,
  audio,
  video,
  mediaUiExtension,
} from "@tau/editor-media";

/** 产品的显式扩展组合，顺序保持原场景；核心不得依赖此模块。 */
export const standardExtensions: readonly AnyExtension[] = [
  defaultMenuExtension,
  underline,
  header,
  image,
  inlineImage,
  imageGallery,
  ...listExtensions,
  ...tabsExtensions,
  detail,
  highlightBlock,
  blockquote,
  callout,
  link,
  comment,
  divideLine,
  kbd,
  ...tableExtensions,
  styledText,
  audio,
  video,
  frontMatter,
  annotation,
  textFormattingExtension,
  mediaUiExtension,
];
