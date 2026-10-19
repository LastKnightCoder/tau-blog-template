import {
  defineElement,
  defineExtension,
  type ElementRenderProps,
} from "@tau/editor";
import { htmlBlockExtension, type HTMLBlockElement } from "@tau/editor-html";
import { PreviewWithEditor } from "@tau/editor-source-view";
import { CodeXml } from "lucide-react";
import { useInitData } from "@blog/services/data-context";

const FragmentRenderer = htmlBlockExtension.elements![0].render!;
export function htmlDocumentSource(html: string, css: string): string {
  const document = new DOMParser().parseFromString(html, "text/html");
  const style = document.createElement("style");
  style.dataset.tauContentCss = "";
  style.textContent = css.replace(/<\/style/gi, "<\\/style");
  document.head.append(style);
  return (
    (document.doctype
      ? new XMLSerializer().serializeToString(document.doctype)
      : "") + document.documentElement.outerHTML
  );
}
function HtmlDocument(props: ElementRenderProps<HTMLBlockElement>) {
  const data = useInitData();
  const { element, attributes, children } = props;
  if (!/<!doctype\s+html|<(?:html|head|body)(?:\s|>)/i.test(element.html))
    return <FragmentRenderer {...props} />;
  const source = htmlDocumentSource(element.html, data.contentStyleText ?? "");
  return (
    <div {...attributes}>
      <PreviewWithEditor
        mode="htmlmixed"
        title="HTML"
        icon={CodeXml}
        initValue={element.html}
        element={element}
        extend
        onChange={() => {}}
      >
        <iframe
          title="HTML 文档"
          srcDoc={source}
          sandbox="allow-scripts allow-forms"
          className="h-[600px] w-full rounded-xl border-0 bg-[var(--color-bg-page)]"
        />
      </PreviewWithEditor>
      {children}
    </div>
  );
}

export const blogHtmlDocumentExtension = defineExtension({
  id: "blog.html-document",
  elements: [
    defineElement<HTMLBlockElement>({
      type: "html-block",
      kind: "block",
      drag: true,
      isVoid: true,
      isEmpty: (element) => element.html === "",
      render: (props) => <HtmlDocument {...props} />,
    }),
  ],
});
