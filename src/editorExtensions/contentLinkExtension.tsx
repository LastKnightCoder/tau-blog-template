import { useInitData } from "@blog/services/data-context";
import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import classNames from "classnames";
import { Tooltip, toast } from "@tau/editor/ui";
import {
  defineElement,
  defineExtension,
  type ElementRenderProps,
} from "@tau/editor";
import { RenderElementProps } from "slate-react";
import { Editor } from "@tau/editor";
import type { EditorKit } from "@tau/editor";
import type { ContentPluginDefinition as PluginDefinition } from "@blog/published/resources";
import { getBlogKit } from "@blog/services/editorKit";
import { joinPath } from "@blog/utils";
import type { ContentLinkTarget } from "@blog/types";
import { BlogDataProvider } from "@blog/services/data-context";
import { loadContentStyles, contentStyleText } from "@blog/services/data";
import { CiteMark, useCitationIndex } from "@blog/components/Citation";
import {
  loadContentLinkPreview,
  resolveContentLinkTarget,
  type ContentLinkPreviewData,
} from "./contentLinkPreview";

type ContentLinkElement = {
  type: "content-link";
  refId?: number;
  contentId?: number;
  contentType?: string;
  contentTitle?: string;
  children: unknown[];
};

type ContentLinkProps = {
  attributes: RenderElementProps["attributes"];
  element: ContentLinkElement;
  children: ReactNode;
  enablePreview: boolean;
};

type LinkPreviewState = {
  scopeId?: string;
  loading: boolean;
  data: ContentLinkPreviewData | null;
  error: string;
  kit?: EditorKit;
  plugins?: readonly PluginDefinition[];
};

const unresolvedMessage = "目标未发布或不可用";
const DEFAULT_CONTENT_LINK_LABEL = "关联内容";
const COMPACT_CONTENT_LINK_LABEL = "内容";
function readText(input: unknown, fallback = ""): string {
  if (typeof input === "string" && input.trim()) {
    return input.trim();
  }
  return fallback;
}

function readNodeText(input: unknown): string {
  if (typeof input === "string") {
    return input;
  }

  if (!input || typeof input !== "object") {
    return "";
  }

  const node = input as Record<string, unknown>;

  if (typeof node.text === "string") {
    return node.text;
  }

  if (Array.isArray(node.children)) {
    return node.children.map(readNodeText).join("");
  }

  return "";
}

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
        <div
          className="blog-content-link-preview-body"
          data-blog-runtime={state.scopeId}
        >
          <BlogDataProvider data={state.data.initData} plugins={state.plugins}>
            <Editor
              initValue={state.data.content}
              readonly
              {...(state.kit
                ? { kit: state.kit }
                : { extensions: blogContentLinkPreviewExtensions })}
            />
          </BlogDataProvider>
        </div>
      </div>
    );
  },
);

ContentLinkPreviewPanel.displayName = "ContentLinkPreviewPanel";

const ContentLinkNode = memo((props: ContentLinkProps) => {
  const { attributes, element, children, enablePreview } = props;
  const initData = useInitData();
  const { contentLinkTargets, site } = initData;
  const targetMap = contentLinkTargets as
    Record<string, ContentLinkTarget> | undefined;
  const target = useMemo(
    () =>
      resolveContentLinkTarget(
        { contentType: element.contentType, refId: element.refId },
        targetMap,
      ),
    [element.contentType, element.refId, targetMap],
  );

  const inlineLabel = readText(readNodeText(element.children));
  const displayTitle = readText(
    element.contentTitle,
    COMPACT_CONTENT_LINK_LABEL,
  );
  const shouldCompactLabel =
    !readText(element.contentTitle) &&
    inlineLabel === DEFAULT_CONTENT_LINK_LABEL;
  const targetHref = target ? joinPath(site.basePath, target.href) : "";
  const citationIndex = useCitationIndex(
    `${element.contentType}:${element.refId}`,
  );
  const canPreview = enablePreview && !!target;
  const [open, setOpen] = useState(false);
  const requestIdRef = useRef(0);
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
    let disposeStyles: (() => void) | undefined;
    const currentRequestId = ++requestIdRef.current;
    setPreviewState((previous) => ({
      ...previous,
      loading: true,
      error: "",
    }));

    loadContentLinkPreview(target!.key, displayTitle)
      .then(async (data) => {
        if (cancelled || requestIdRef.current !== currentRequestId) {
          return;
        }
        let kit: EditorKit | undefined;
        let plugins: readonly PluginDefinition[] = [];
        const scopeId = crypto.randomUUID();
        const disposeCss = await loadContentStyles(
          data.result,
          `[data-blog-runtime="${scopeId}"] [data-slate-editor="true"]`,
        );
        disposeStyles = disposeCss;
        data.initData.contentStyleText = contentStyleText(data.result);
        if (cancelled || requestIdRef.current !== currentRequestId) {
          disposeCss();
          return;
        }
        {
          const { loadPublishedPluginDefinitions } =
            await import("@blog/services/plugin-runtime");
          if (cancelled || requestIdRef.current !== currentRequestId) return;
          const loaded = await loadPublishedPluginDefinitions(
            data.pluginRenderers ?? [],
            data.baseUrl,
            `[data-blog-runtime="${scopeId}"]`,
          );
          plugins = loaded.definitions;
          disposeStyles = () => {
            loaded.dispose();
            disposeCss();
          };
          if (cancelled || requestIdRef.current !== currentRequestId) {
            disposeStyles();
            return;
          }
          kit = getBlogKit(
            data.initData.settings,
            loaded.definitions.flatMap(
              (definition) => definition.editorExtensions ?? [],
            ),
          ).extend({
            extensions: blogContentLinkPreviewExtensions,
            override: true,
          });
        }
        setPreviewState({
          loading: false,
          data,
          scopeId,
          error: "",
          kit,
          plugins,
        });
      })
      .catch(() => {
        disposeStyles?.();
        if (cancelled || requestIdRef.current !== currentRequestId) {
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
      disposeStyles?.();
    };
  }, [open, canPreview, displayTitle, target?.key]);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!target || !targetHref) {
      toast.info(unresolvedMessage);
      return;
    }

    if (event.metaKey || event.ctrlKey) {
      window.open(targetHref, "_blank", "noopener,noreferrer");
      return;
    }

    window.location.href = targetHref;
  };

  const linkNode = (
    <a
      {...attributes}
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

  const citeMark =
    citationIndex != null ? <CiteMark index={citationIndex} /> : null;

  if (!enablePreview || !target || !targetHref) {
    return citeMark ? (
      <>
        {linkNode}
        {citeMark}
      </>
    ) : (
      linkNode
    );
  }

  const previewLink = (
    <Tooltip
      onOpenChange={setOpen}
      placement="bottom"
      arrow={false}
      delay={350}
      className="bg-page text-ink-1 border-line-1 shadow-card max-w-[480px] overflow-hidden rounded-lg border p-0"
      content={open ? <ContentLinkPreviewPanel state={previewState} /> : null}
    >
      {linkNode}
    </Tooltip>
  );

  return citeMark ? (
    <>
      {previewLink}
      {citeMark}
    </>
  ) : (
    previewLink
  );
});

ContentLinkNode.displayName = "ContentLinkNode";

const createBlogContentLinkExtension = (enablePreview: boolean) =>
  defineExtension({
    id: "host.content-link",
    elements: [
      defineElement({
        type: "content-link",
        kind: "inline",
        render: ({ attributes, children, element }: ElementRenderProps) => (
          <ContentLinkNode
            attributes={attributes}
            element={element as unknown as ContentLinkElement}
            enablePreview={enablePreview}
          >
            {children}
          </ContentLinkNode>
        ),
      }),
    ],
  });

export const blogContentLinkExtension = createBlogContentLinkExtension(true);
export const blogContentLinkPreviewExtensions = [
  createBlogContentLinkExtension(false),
];
