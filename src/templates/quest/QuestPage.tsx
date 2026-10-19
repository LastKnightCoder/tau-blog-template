import { useInitData, BlogDataProvider } from "@blog/services/data-context";
import {
  adaptData,
  dataClient,
  loadContentStyles,
  contentStyleText,
} from "@blog/services/data";
import { loadPublishedPluginDefinitions } from "@blog/services/plugin-runtime";
import { memo, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Header } from "@blog/components/Layout";
import DocCollectionsMenu from "@blog/components/Layout/DocCollectionsMenu";
import { Tag, ScrollToTop } from "@blog/components/Common";
import { Editor } from "@tau/editor";
import {
  formatDate,
  getReadingTime,
  getPlainText,
  joinPath,
} from "@blog/utils";
import { QuestAnswerData, QuestData } from "@blog/types";
import DndProvider from "@blog/components/DndProvider";
import { getBlogKit, useBlogKit } from "@blog/services/editorKit";
import type { PluginDefinition } from "@tau/plugins";
import { fadeUp, defaultTransition } from "@blog/utils/motion";
import { CitationProvider, CitationScope } from "@blog/components/Citation";
import {
  QuestReferences,
  QuestTrail,
  ResearchSection,
  ResearchStats,
} from "./QuestResearch";

const statusLabels: Record<QuestData["status"], string> = {
  not_started: "未开始",
  in_progress: "进行中",
  resolved: "已解决",
};

const serifLabelClass =
  "font-['Songti_SC','STSong','Noto_Serif_SC','Source_Han_Serif_SC',serif]";

type LoadedAnswerContent = {
  loading: boolean;
  content: QuestAnswerData["content"];
  error: boolean;
  data?: import("@blog/types").InitData;
  kit?: import("@tau/editor").EditorKit;
  scopeId?: string;
  plugins?: readonly PluginDefinition[];
};
const AnswerContent = memo(
  ({
    answer,
    settings,
  }: {
    answer: QuestAnswerData;
    settings: ReturnType<typeof useInitData>["settings"];
  }) => {
    const inlineKit = useBlogKit(settings);
    const sourceKey = answer.source?.key;
    const [remote, setRemote] = useState<LoadedAnswerContent>({
      loading: Boolean(sourceKey && !answer.content),
      content: answer.content,
      error: false,
    });
    useEffect(() => {
      if (!sourceKey || answer.content) return;
      const controller = new AbortController();
      const disposals: (() => void)[] = [];
      setRemote({ loading: true, content: undefined, error: false });
      (async () => {
        const result = await dataClient().readData({
          key: sourceKey,
          signal: controller.signal,
        });
        const data = adaptData(result);
        const loaded = await loadPublishedPluginDefinitions(
          result.data.pluginRenderers ?? [],
          result.dataUrl,
        );
        disposals.push(loaded.dispose);
        if (controller.signal.aborted) {
          loaded.dispose();
          return;
        }
        const scopeId = crypto.randomUUID();
        const disposeCss = await loadContentStyles(
          result,
          `[data-blog-runtime="${scopeId}"] [data-slate-editor="true"]`,
        );
        disposals.push(disposeCss);
        data.contentStyleText = contentStyleText(result);
        if (controller.signal.aborted) {
          disposeCss();
          return;
        }
        const content =
          "content" in data.content && Array.isArray(data.content.content)
            ? data.content.content
            : undefined;
        setRemote({
          loading: false,
          content,
          error: !content,
          data,
          scopeId,
          plugins: loaded.definitions,
          kit: getBlogKit(
            data.settings,
            loaded.definitions.flatMap(
              (definition) => definition.editorExtensions ?? [],
            ),
          ),
        });
      })().catch(() => {
        disposals.forEach((dispose) => dispose());
        if (!controller.signal.aborted)
          setRemote({ loading: false, content: undefined, error: true });
      });
      return () => {
        controller.abort();
        disposals.forEach((dispose) => dispose());
      };
    }, [answer.content, sourceKey]);
    if (remote.loading)
      return (
        <p className="text-sm text-[var(--color-text-tertiary)]">
          正在取回答案...
        </p>
      );
    if (remote.error || !remote.content?.length)
      return (
        <p className="text-sm text-[var(--color-text-tertiary)]">
          暂无可展示内容
        </p>
      );
    const body = (
      <div data-blog-runtime={remote.scopeId}>
        <DndProvider>
          <Editor
            kit={remote.kit ?? inlineKit}
            initValue={remote.content}
            readonly
          />
        </DndProvider>
      </div>
    );
    return remote.data ? (
      <BlogDataProvider data={remote.data} plugins={remote.plugins}>
        {body}
      </BlogDataProvider>
    ) : (
      body
    );
  },
);
AnswerContent.displayName = "AnswerContent";

const SectionKicker = memo(
  ({
    label,
    hint,
    className = "",
  }: {
    label: string;
    hint?: string;
    className?: string;
  }) => (
    <div
      className={`${serifLabelClass} ${className} mb-5 inline-flex items-center gap-3 text-lg font-semibold text-[var(--color-text-primary)]`}
    >
      <span>{label}</span>
      {hint && (
        <span className="text-[13px] font-normal text-[var(--color-text-tertiary)]">
          {hint}
        </span>
      )}
      <span className="h-px w-10 bg-[var(--color-border-ring-heavy)]" />
    </div>
  ),
);

SectionKicker.displayName = "SectionKicker";

function getAnswerLabel(index: number, total: number): string {
  if (total <= 1) {
    return "解";
  }
  const numerals = ["其一", "其二", "其三", "其四", "其五", "其六"];
  return `解 · ${numerals[index] || `其 ${index + 1}`}`;
}

const AnswerHeader = memo(
  ({
    answer,
    basePath,
    index,
    showDivider,
    total,
  }: {
    answer: QuestAnswerData;
    basePath: string;
    index: number;
    showDivider: boolean;
    total: number;
  }) => {
    const showIndex = total > 1;
    const answerLabel = getAnswerLabel(index, total);

    return (
      <div
        className={`mb-7 ${showDivider ? "border-t border-[var(--color-border-ring-heavy)] pt-6" : ""}`}
      >
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <div
            className={`${serifLabelClass} text-xl font-semibold text-[var(--color-text-primary)]`}
            data-answer-index={
              showIndex ? String(index + 1).padStart(2, "0") : undefined
            }
          >
            {answerLabel}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs tracking-[0.04em] text-[var(--color-text-tertiary)]">
            <time dateTime={new Date(answer.updateTime).toISOString()}>
              {formatDate(answer.updateTime, "full")}
            </time>
            {answer.source?.href && (
              <a
                href={joinPath(basePath, answer.source.href)}
                className="text-[var(--color-text-secondary)] underline underline-offset-4 transition-colors hover:text-[var(--color-accent)]"
              >
                原文
              </a>
            )}
          </div>
        </div>
      </div>
    );
  },
);

AnswerHeader.displayName = "AnswerHeader";

const QuestPage = memo(() => {
  const initData = useInitData();
  const { site, navigation } = initData;
  const quest = initData.content as QuestData;
  const docCollections = initData.docCollections || [];
  const blogSettings = initData.settings;
  const kit = useBlogKit(blogSettings);
  const hasDescription = Boolean(
    quest.description && getPlainText(quest.description).trim(),
  );
  const materials = quest.materials ?? [];
  const trail = quest.trail ?? [];

  const readingTime = useMemo(() => {
    const answerContent = quest.answers.flatMap(
      (answer) => answer.content || [],
    );
    return getReadingTime([...(quest.description || []), ...answerContent]);
  }, [quest.answers, quest.description]);

  const desktopDocNav =
    docCollections.length > 0 ? (
      <DocCollectionsMenu
        collections={docCollections}
        basePath={site.basePath}
        variant="desktop"
      />
    ) : undefined;
  const mobileDocNav =
    docCollections.length > 0 ? (
      <DocCollectionsMenu
        collections={docCollections}
        basePath={site.basePath}
        variant="mobile"
      />
    ) : undefined;

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      <Header
        title={site.title}
        basePath={site.basePath}
        navigation={navigation}
        customNav={desktopDocNav}
        mobileCustomNav={mobileDocNav}
        searchHref={initData.search?.href}
      />

      <main className="min-h-0 flex-1 overflow-hidden">
        <div className="h-full min-h-0 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="panel-scroll-area" data-primary-scroll-container>
            <CitationProvider materials={materials} basePath={site.basePath}>
              <article className="wide-prose-column">
                <motion.header
                  className="mb-10"
                  initial={fadeUp.hidden}
                  animate={fadeUp.visible}
                  transition={defaultTransition}
                >
                  <div className="mb-5 flex flex-wrap items-center gap-2">
                    <Tag name={quest.groupTitle} size="sm" />
                    <span className="tag">{statusLabels[quest.status]}</span>
                    <span className="text-xs font-medium uppercase tracking-[0.15em] text-[var(--color-text-tertiary)]">
                      {formatDate(quest.updateTime)} · 约 {readingTime} 分钟
                    </span>
                  </div>
                  <SectionKicker label="问" className="mb-4" />
                  <h1 className="text-4xl font-bold leading-[1.08] text-[var(--color-text-primary)] sm:text-5xl">
                    {quest.title}
                  </h1>
                  {hasDescription && quest.description && (
                    <div
                      className="mt-6 max-w-[68ch] text-[15px] leading-8 text-[var(--color-text-tertiary)]"
                      data-testid="quest-description"
                    >
                      <DndProvider>
                        <Editor
                          kit={kit}
                          initValue={quest.description}
                          readonly
                          className="text-[var(--color-text-tertiary)]"
                        />
                      </DndProvider>
                    </div>
                  )}
                  <ResearchStats quest={quest} />
                </motion.header>

                <CitationScope name="answer">
                  <section className="space-y-14">
                    {quest.answers.length > 0 ? (
                      quest.answers.map((answer, index) => (
                        <section key={answer.id}>
                          <AnswerHeader
                            answer={answer}
                            basePath={site.basePath}
                            index={index}
                            showDivider={hasDescription || index > 0}
                            total={quest.answers.length}
                          />
                          <AnswerContent
                            answer={answer}
                            settings={blogSettings}
                          />
                        </section>
                      ))
                    ) : (
                      <div>
                        <p
                          className={`${serifLabelClass} text-lg font-semibold text-[var(--color-text-secondary)]`}
                        >
                          仍在路上
                        </p>
                        <p className="mt-2 max-w-[42ch] text-sm leading-7 text-[var(--color-text-tertiary)]">
                          这条求索暂时还没有整理出答案。
                        </p>
                      </div>
                    )}
                  </section>
                </CitationScope>

                {trail.length > 0 && (
                  <ResearchSection
                    kicker={<SectionKicker label="径" hint="探索过程" />}
                  >
                    <QuestTrail trail={trail} />
                  </ResearchSection>
                )}

                {materials.length > 0 && (
                  <ResearchSection
                    kicker={<SectionKicker label="据" hint="参考资料" />}
                  >
                    <QuestReferences
                      materials={materials}
                      basePath={site.basePath}
                    />
                  </ResearchSection>
                )}
              </article>
            </CitationProvider>
          </div>
        </div>
      </main>

      <ScrollToTop />
    </div>
  );
});

QuestPage.displayName = "QuestPage";

export default QuestPage;
