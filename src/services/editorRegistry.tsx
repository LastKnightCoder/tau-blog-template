import type { ServiceRegistration } from "@tau/blog/editor";
import {
  IEditorSlots,
  IVideoContentProviders,
  createDefaultEditorSlots,
  AudioPlayer,
  VideoPlayer,
} from "@tau/blog/media";
import {
  type ImageBorderRadiusPreset,
  type ImageShadowPreset,
} from "@tau/blog/media";
import { type ImageAppearanceConfig } from "@tau/blog/media";
import { blogVideoContentProviders } from "../editor-providers/videoProviders";

export interface BlogPublishSettings {
  appearance?: {
    image?: {
      borderRadius?: ImageBorderRadiusPreset;
      shadow?: ImageShadowPreset | boolean;
    };
  };
}

const BLOG_DEFAULT_IMAGE_SETTINGS = {
  borderRadius: "md" as ImageBorderRadiusPreset,
  shadow: "none" as ImageShadowPreset | boolean,
};

function getBlogImageSettingValue<T extends "borderRadius" | "shadow">(
  settings: BlogPublishSettings | undefined,
  key: T,
): NonNullable<NonNullable<BlogPublishSettings["appearance"]>["image"]>[T] {
  return (settings?.appearance?.image?.[key] ??
    BLOG_DEFAULT_IMAGE_SETTINGS[key]) as NonNullable<
    NonNullable<BlogPublishSettings["appearance"]>["image"]
  >[T];
}

export const blogEditorServices: ServiceRegistration = (register) => {
  register(IEditorSlots, {
    ...createDefaultEditorSlots(),
    Video: VideoPlayer,
    Audio: AudioPlayer,
  });
  register(IVideoContentProviders, blogVideoContentProviders);
};

/** 图片默认外观：来自发布设置快照，缺省为中圆角、无阴影 */
export function getBlogImageAppearance(
  settingsSnapshot?: BlogPublishSettings,
): ImageAppearanceConfig {
  return {
    borderRadius: getBlogImageSettingValue(settingsSnapshot, "borderRadius"),
    shadow: getBlogImageSettingValue(settingsSnapshot, "shadow"),
  };
}
