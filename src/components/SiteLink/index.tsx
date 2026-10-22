import { memo, useEffect, useState, type MouseEvent } from "react";
import classNames from "classnames";
import type { LinkRenderProps } from "@tau/blog";
import { Tooltip } from "@blog/components/Common/Tooltip";
import { showToast } from "@blog/components/Common/toast";
import { Content } from "@blog/components/Content";
import { BlogDataProvider, useInitData } from "@blog/services/data-context";
import { routeFor } from "@blog/services/data";
import { joinPath } from "@blog/utils";
import { openSiteLink } from "@blog/utils/navigation";
import { loadContentLinkPreview, type ContentLinkPreviewData } from "./preview";

type LinkPreviewState = {
  loading: boolean;
  data: ContentLinkPreviewData | null;
  error: string;
};

const unresolvedMessage = "目标未发布或不可用";
const DEFAULT_CONTENT_LINK_LABEL = "关联内容";
const COMPACT_CONTENT_LINK_LABEL = "内容";
const ContentLinkPreviewPanel = memo(
  ({ state }: { state: LinkPreviewState }) => {
    if (state.loading) {
      return (
        <div className="blog-content-link-preview">
          <p className="blog-content-link-preview-tip">正在加载预览...</p>
        </div>
      );
    }

    if (state.error) {
      return (
        <div className="blog-content-link-preview">
          <p className="blog-content-link-preview-error">预览加载失败</p>
        </div>
      );
    }

    if (!state.data) {
      return (
        <div className="blog-content-link-preview">
          <p className="blog-content-link-preview-tip">暂无可预览内容</p>
        </div>
      );
    }

    return (
      <div className="blog-content-link-preview">
        <div className="blog-content-link-preview-body">
          <BlogDataProvider
            data={state.data.initData}
            content={state.data.result}
          >
            <Content content={state.data.result} preview />
          </BlogDataProvider>
        </div>
      </div>
    );
  },
);

ContentLinkPreviewPanel.displayName = "ContentLinkPreviewPanel";

const SiteLinkView = memo(
  ({
    link,
    enablePreview,
  }: {
    link: LinkRenderProps;
    enablePreview: boolean;
  }) => {
    const { site } = useInitData();
    const { target, children } = link;
    const displayTitle = link.title.trim() || COMPACT_CONTENT_LINK_LABEL;
    const shouldCompactLabel =
      !link.title.trim() && link.text.trim() === DEFAULT_CONTENT_LINK_LABEL;
    const targetHref = target ? joinPath(site.basePath, routeFor(target)) : "";
    const canPreview = enablePreview && !!target;
    const [open, setOpen] = useState(false);
    const [previewState, setPreviewState] = useState<LinkPreviewState>({
      loading: false,
      data: null,
      error: "",
    });

    useEffect(() => {
      if (!open || !canPreview) {
        return;
      }

      let cancelled = false;
      setPreviewState((previous) => ({
        ...previous,
        loading: true,
        error: "",
      }));

      loadContentLinkPreview(target!.key)
        .then((data) => {
          if (cancelled) {
            return;
          }
          setPreviewState({
            loading: false,
            data,
            error: "",
          });
        })
        .catch(() => {
          if (cancelled) {
            return;
          }
          setPreviewState({
            loading: false,
            data: null,
            error: "PREVIEW_LOAD_FAILED",
          });
        });

      return () => {
        cancelled = true;
      };
    }, [open, canPreview, target?.key]);

    const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      event.stopPropagation();

      if (!target || !targetHref) {
        showToast(unresolvedMessage);
        return;
      }

      if (event.metaKey || event.ctrlKey) {
        window.open(targetHref, "_blank", "noopener,noreferrer");
        return;
      }

      openSiteLink(targetHref);
    };

    const linkNode = (
      <a
        href={targetHref || "#"}
        onClick={handleClick}
        className={classNames("blog-content-link", {
          "blog-content-link--unresolved": !target || !targetHref,
        })}
        title={displayTitle}
      >
        {shouldCompactLabel ? COMPACT_CONTENT_LINK_LABEL : children}
      </a>
    );

    if (!enablePreview || !target || !targetHref) {
      return linkNode;
    }

    return (
      <Tooltip
        onOpenChange={setOpen}
        placement="bottom"
        delay={350}
        className="bg-page text-ink-1 border-line-1 shadow-card max-w-[480px] overflow-hidden rounded-lg border p-0"
        content={open ? <ContentLinkPreviewPanel state={previewState} /> : null}
      >
        {linkNode}
      </Tooltip>
    );
  },
);
SiteLinkView.displayName = "SiteLinkView";

/** 正文站内链接的展示：悬停预览与未发布提示；预览里的链接不再嵌套预览。 */
export const renderSiteLink = (link: LinkRenderProps) => (
  <SiteLinkView link={link} enablePreview />
);
export const renderPreviewLink = (link: LinkRenderProps) => (
  <SiteLinkView link={link} enablePreview={false} />
);
