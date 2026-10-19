/**
 * Blog 的 EditorKit：图片外观来自发布设置，所以按设置快照建一个（同一快照复用同一个 kit）。
 */
import { createEditorKit, type EditorKit } from "@tau/editor";
import { createImageExtensions } from "@tau/editor-media";
import { standardExtensions } from "../editorExtensions/standard";
import { useMemo } from "react";
import { useBlogPlugins } from "./data-context";
import { diagramExtensions } from "@tau/editor-diagram";
import { htmlExtensions } from "@tau/editor-html";
import { previewMenuExtension } from "@tau/editor-source-view/menu";
import codeBlockExtension from "@tau/editor-code-block";
import { mathExtensions } from "@tau/editor-math";
import emojiExtension from "@tau/editor-emoji";
import { blogEditorExtensions } from "../editorExtensions";
import {
  blogEditorServices,
  getBlogImageAppearance,
  type BlogPublishSettings,
} from "./editorRegistry";

const cache = new WeakMap<BlogPublishSettings, EditorKit>();
const defaultSettings: BlogPublishSettings = {};

export function useBlogKit(settings?: BlogPublishSettings): EditorKit {
  const plugins = useBlogPlugins();
  return useMemo(
    () =>
      getBlogKit(
        settings,
        plugins.flatMap((plugin) => plugin.editorExtensions ?? []),
      ),
    [settings, plugins],
  );
}

export function getBlogKit(
  settings?: BlogPublishSettings,
  contributions: Parameters<EditorKit["extend"]>[0]["extensions"] = [],
): EditorKit {
  const snapshot = settings ?? defaultSettings;
  let kit = cache.get(snapshot);
  if (!kit) {
    kit = createEditorKit({
      extensions: [
        ...standardExtensions,
        ...diagramExtensions,
        ...htmlExtensions,
        previewMenuExtension,
        codeBlockExtension,
        ...mathExtensions,
        emojiExtension,
        ...blogEditorExtensions,
        ...createImageExtensions({
          appearance: getBlogImageAppearance(settings),
        }),
      ],
      services: [blogEditorServices],
      // createImageExtensions 按 type 替换内置 image / image-gallery
      override: true,
    });
    cache.set(snapshot, kit);
  }
  return contributions.length
    ? kit.extend({ extensions: contributions, override: true })
    : kit;
}
