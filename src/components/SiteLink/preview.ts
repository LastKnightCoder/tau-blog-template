import type { InitData } from "@blog/types";
import type { DataResult } from "@tau/blog";
import { adaptData, dataClient } from "@blog/services/data";

export type ContentLinkPreviewData = {
  initData: InitData;
  result: DataResult;
};
/** 预览按数据 key 读取，公开 URL 只用于作者选择的跳转入口。 */
export async function loadContentLinkPreview(
  key: string,
): Promise<ContentLinkPreviewData | null> {
  const result = await dataClient().readData({ key });
  const initData = adaptData(result);
  const content = initData.content;
  if (!("content" in content) || content.content.length === 0) return null;
  return {
    initData,
    result,
  };
}
