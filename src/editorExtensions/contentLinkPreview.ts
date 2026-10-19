import type { Descendant } from "slate";
import type { ContentLinkTarget, InitData } from "@blog/types";
import type { DataResult } from "@tau/plugins/publish-data";
import { adaptData, dataClient } from "@blog/services/data";

export type ContentLinkTargetMap = Record<string, ContentLinkTarget>;
export type ResolvedContentLinkTarget = ContentLinkTarget;
export type ContentLinkPreviewData = {
  title: string;
  content: Descendant[];
  initData: InitData;
  result: DataResult;
};
export function buildContentLinkTargetKey(contentType: string, refId: number) {
  return `${contentType}:${refId}`;
}
export function resolveContentLinkTarget(
  identity: { contentType?: unknown; refId?: unknown },
  targets?: ContentLinkTargetMap,
): ResolvedContentLinkTarget | null {
  if (
    typeof identity.contentType !== "string" ||
    !Number.isSafeInteger(Number(identity.refId))
  )
    return null;
  return (
    targets?.[
      buildContentLinkTargetKey(identity.contentType, Number(identity.refId))
    ] ?? null
  );
}
/** 预览按数据 key 读取，公开 URL 只用于作者选择的跳转入口。 */
export async function loadContentLinkPreview(
  key: string,
  fallbackTitle: string,
): Promise<ContentLinkPreviewData> {
  const result = await dataClient().readData({ key });
  const initData = adaptData(result);
  const content = initData.content as unknown as Record<string, unknown>;
  return {
    title: typeof content.title === "string" ? content.title : fallbackTitle,
    content: (Array.isArray(content.content)
      ? content.content
      : [
          { type: "paragraph", children: [{ type: "formatted", text: "" }] },
        ]) as Descendant[],
    initData,
    result,
  };
}
