/**
 * Blog 的 EditorKit：图片外观来自发布设置，所以按设置快照建一个（同一快照复用同一个 kit）。
 */
import {
  createEditorKit,
  defaultExtensions,
  previewMenuExtension,
  type EditorKit,
} from "@tau/blog/editor";
import { createImageExtensions } from "@tau/blog/media";
import { blogEditorExtensions } from "../editorExtensions";
import {
  blogEditorServices,
  getBlogImageAppearance,
  type BlogPublishSettings,
} from "./editorRegistry";

const cache = new WeakMap<BlogPublishSettings, EditorKit>();
const defaultSettings: BlogPublishSettings = {};

export function getBlogKit(settings?: BlogPublishSettings): EditorKit {
  const snapshot = settings ?? defaultSettings;
  let kit = cache.get(snapshot);
  if (!kit) {
    kit = createEditorKit({
      extensions: [
        ...defaultExtensions,
        previewMenuExtension,
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
  return kit;
}
