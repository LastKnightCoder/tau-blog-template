import type { PublishedPluginRender } from "@tau/plugins/publish-artifacts";
import { loadPluginDefinitions } from "../published/resources";

export function loadPublishedPluginDefinitions(
  dependencies: readonly PublishedPluginRender[], dataUrl: string,
  scope = `[data-blog-runtime="${crypto.randomUUID()}"]`, signal?: AbortSignal,
) {
  return loadPluginDefinitions(dependencies, dataUrl, scope, signal);
}
