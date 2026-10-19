import { Component, type ReactNode } from "react";
import { ContentRenderer, type ContentRendererProps } from "@tau/blog";
import { renderPreviewLink, renderSiteLink } from "@blog/components/SiteLink";
import { routeFor } from "@blog/services/data";

class ContentErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: unknown) {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  render() {
    return this.state.error ? (
      <p role="alert" className="text-sm text-[var(--color-text-tertiary)]">
        正文加载失败：{this.state.error.message}
      </p>
    ) : (
      this.props.children
    );
  }
}

/** 本模板的正文：等待与错误界面，站内链接走模板路由；preview 为悬停预览里的正文，不再嵌套预览。 */
export function Content({
  preview = false,
  ...props
}: Omit<ContentRendererProps, "hrefFor" | "renderLink" | "fallback"> & {
  preview?: boolean;
}) {
  return (
    <ContentErrorBoundary key={props.content.dataUrl}>
      <ContentRenderer
        {...props}
        hrefFor={routeFor}
        renderLink={preview ? renderPreviewLink : renderSiteLink}
        fallback={
          <p
            role="status"
            className="text-sm text-[var(--color-text-tertiary)]"
          >
            正在准备正文…
          </p>
        }
      />
    </ContentErrorBoundary>
  );
}
