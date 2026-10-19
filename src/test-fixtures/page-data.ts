import type { InitData, DocCollection } from "@blog/types";
import type { Descendant } from "slate";

const baseSiteConfig = {
  title: "我的知识库",
  description: "记录学习、思考与成长",
  basePath: "",
};

const baseNavigation = [
  { label: "首页", href: "/", active: false },
  { label: "卡片", href: "/cards", active: false },
  { label: "文章", href: "/articles", active: false },
  { label: "求索录", href: "/quests", active: false },
];

const mockDocCollections: DocCollection[] = [
  {
    type: "project",
    label: "项目",
    items: [
      {
        id: 1,
        title: "Tau 产品手册",
        href: "/projects/1/1",
        kind: "project",
      },
      {
        id: 2,
        title: "开放平台",
        href: "/projects/2/2",
        kind: "project",
      },
      {
        id: 101,
        title: "创意仓库",
        href: "/projects/101/404",
        kind: "project",
      },
      {
        id: 102,
        title: "读书笔记",
        href: "/projects/102/405",
        kind: "project",
      },
    ],
  },
];

const mockContentLinkTargets = {
  "card:9001": {
    key: "card:9001",
    contentType: "card",
    refId: 9001,
    href: "/cards/9001",
    title: "React 性能优化策略",
  },
  "project-item:9002": {
    key: "doc:project:101:9002",
    contentType: "project-item",
    refId: 9002,
    href: "/projects/101/9002",
    title: "快速开始 - 介绍",
  },
};

const buildDocSidebarValidationDemo = () => {
  const longVersionChildren = Array.from({ length: 18 }, (_, index) => ({
    title: `0.4.${index + 1}`,
    href: `/projects/101/${401 + index}`,
  }));

  return [
    {
      title: "0.3",
      children: Array.from({ length: 14 }, (_, index) => ({
        title: `0.3.${index + 1}`,
        href: `/projects/101/${301 + index}`,
      })),
    },
    {
      title: "0.4",
      href: "/projects/101/4",
      children: longVersionChildren,
    },
    {
      title: "0.5",
      children: [
        { title: "0.5.0", href: "/projects/101/500" },
        { title: "0.5.1", href: "/projects/101/501" },
      ],
    },
    {
      title: "FAQ",
      children: [
        { title: "同步相关", href: "/projects/101/601" },
        { title: "发布相关", href: "/projects/101/602" },
      ],
    },
  ];
};

const buildDocOutlineValidationContent = (): Descendant[] => [
  {
    type: "header",
    level: 1,
    children: [{ type: "formatted", text: "0.4.4 更新说明" }],
  },
  {
    type: "paragraph",
    children: [
      {
        type: "formatted",
        text: "这个 demo 用来验证左侧长导航滚动、带链接分组点击跳转、以及右侧页面目录高亮跟随。",
      },
    ],
  },
  {
    type: "header",
    level: 2,
    children: [{ type: "formatted", text: "修复目标" }],
  },
  {
    type: "paragraph",
    children: [
      {
        type: "formatted",
        text: "确认长分组在展开后不会因为固定高度被截断，同时切换章节时，手动收起的其它分组状态仍会保留。",
      },
    ],
  },
  {
    type: "header",
    level: 3,
    children: [{ type: "formatted", text: "左侧导航验证点" }],
  },
  {
    type: "bulleted-list",
    children: [
      {
        type: "list-item",
        children: [
          {
            type: "paragraph",
            children: [
              {
                type: "formatted",
                text: "收起 0.3 分组后，点击 0.4.4 或 0.4 分组链接，不应把 0.3 自动展开。",
              },
            ],
          },
        ],
      },
      {
        type: "list-item",
        children: [
          {
            type: "paragraph",
            children: [
              {
                type: "formatted",
                text: "展开 0.4 分组后，应能继续滚动看到后面的 0.4.10 以后内容，而不是被中途截断。",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    type: "header",
    level: 3,
    children: [{ type: "formatted", text: "右侧目录高亮验证点" }],
  },
  {
    type: "paragraph",
    children: [
      {
        type: "formatted",
        text: "向下滚动正文时，右侧页面目录应从“修复目标”切到“左侧导航验证点”，再切到“右侧目录高亮验证点”。",
      },
    ],
  },
  {
    type: "header",
    level: 4,
    children: [{ type: "formatted", text: "深层标题缩进" }],
  },
  {
    type: "paragraph",
    children: [
      {
        type: "formatted",
        text: "这个四级标题同时用于验证右侧目录的深层缩进不会回退到顶格。",
      },
    ],
  },
  {
    type: "header",
    level: 2,
    children: [{ type: "formatted", text: "滚动填充区块 A" }],
  },
  {
    type: "paragraph",
    children: [
      {
        type: "formatted",
        text: "为了方便观察目录高亮变化，这里加入较长说明文字。你可以持续下滚，观察右侧目录项的激活状态是否同步变化。",
      },
    ],
  },
  {
    type: "paragraph",
    children: [
      {
        type: "formatted",
        text: "当正文高度足够长时，目录高亮切换更容易暴露边界问题，例如标题已经越过顶部，但高亮还停留在上一个标题。",
      },
    ],
  },
  {
    type: "header",
    level: 2,
    children: [{ type: "formatted", text: "滚动填充区块 B" }],
  },
  {
    type: "paragraph",
    children: [
      {
        type: "formatted",
        text: "这里继续补充一段较长内容，让右侧目录具备多个可切换目标。你也可以点击右侧目录，确认跳转后高亮状态会同步到对应标题。",
      },
    ],
  },
  {
    type: "paragraph",
    children: [
      {
        type: "formatted",
        text: "如果需要重复验证左侧折叠状态，可以先收起 FAQ，再点击 0.4.4，对应跳转后 FAQ 仍应保持收起。",
      },
    ],
  },
];

export const mockQuestPageData: InitData = {
  site: baseSiteConfig,
  navigation: baseNavigation.map((n) => ({
    ...n,
    active: n.href === "/quests",
  })),
  docCollections: mockDocCollections,
  contentLinkTargets: mockContentLinkTargets,
  content: {
    id: 1,
    title: "React 列表重渲染时，为什么输入框会失焦？",
    summary:
      "排查 key、受控输入和父组件重建之间的关系，最后确认是列表项 key 不稳定。",
    href: "/quests/1",
    groupId: 1,
    groupTitle: "前端现场",
    groupColor: "#92816b",
    status: "resolved",
    description: [
      {
        type: "paragraph",
        children: [
          {
            type: "formatted",
            text: "现象是每输入一个字符，输入框都会失焦。最初怀疑是防抖更新导致，后来发现根因在列表项标识。",
          },
        ],
      },
    ],
    answers: [
      {
        id: 9001,
        createTime: Date.now() - 86400000 * 2,
        updateTime: Date.now() - 86400000,
        content: [
          {
            type: "paragraph",
            children: [
              {
                type: "formatted",
                text: "先看 key 是否来自数组下标或临时生成值。如果父组件每次 render 都重新生成 key，React 会卸载并重建输入框，自然会丢失焦点。官方文档对 key 的说明也印证了这一点，之前整理的",
              },
              {
                type: "content-link",
                contentType: "card",
                refId: 9001,
                contentTitle: "React 性能优化策略",
                children: [{ type: "formatted", text: "性能优化卡片" }],
              } as any,
              { type: "formatted", text: "里也有相同结论。" },
            ],
          },
          {
            type: "code-block",
            language: "tsx",
            code: "items.map((item) => <Row key={item.id} item={item} />)",
            uuid: "quest-code-demo",
            children: [{ type: "formatted", text: "" }],
          } as any,
        ],
        source: {
          type: "custom",
          contentId: 9001,
          published: false,
        },
      },
    ],
    materials: [
      {
        index: 1,
        kind: "web-clip",
        group: "external",
        title: "Preserving and Resetting State",
        meta: "react.dev",
        excerpt:
          "React will destroy a component's state when it's removed from the tree, or when its key changes.",
        url: "https://react.dev/learn/preserving-and-resetting-state",
      },
      {
        index: 2,
        kind: "excerpt",
        group: "external",
        title: "微信读书 · 《深入浅出 React》 · 协调",
        meta: "",
        excerpt: "key 是 React 判断两次渲染中元素是否为同一个的唯一依据。",
        note: "下标当 key 在插入时一定出问题",
      },
      {
        index: 3,
        kind: "card",
        group: "note",
        title: "React 性能优化策略",
        meta: "",
        excerpt: "稳定的 key 与 memo 一起才能避免不必要的卸载重建。",
        href: "/cards/9001",
        citeKey: "card:9001",
      },
      {
        index: 4,
        kind: "chat-session",
        group: "discussion",
        title: "排查输入框失焦",
        meta: "12 条消息",
        excerpt: "",
      },
    ],
    trail: [
      {
        time: Date.now() - 86400000 * 3,
        tone: "start",
        text: "提出问题",
        refs: [],
      },
      {
        time: Date.now() - 86400000 * 3,
        tone: "plain",
        text: "关联 2 份资料",
        refs: [1, 2],
      },
      {
        time: Date.now() - 86400000 * 2,
        tone: "note",
        text: "一开始怀疑是防抖更新导致，去掉防抖后依旧失焦，排除。",
        refs: [],
      },
      {
        time: Date.now() - 86400000 * 2,
        tone: "plain",
        text: "关联对话",
        refs: [4],
      },
      {
        time: Date.now() - 86400000 * 2,
        tone: "milestone",
        text: "写下卡片",
        refs: [3],
      },
      {
        time: Date.now() - 86400000,
        tone: "done",
        text: "标为已解决",
        refs: [],
      },
    ],
    createTime: Date.now() - 86400000 * 3,
    updateTime: Date.now() - 86400000,
    resolvedTime: Date.now() - 86400000,
  },
  meta: {
    type: "quest",
    publishTime: Date.now(),
  },
};

export const mockQuestMultiAnswerPageData: InitData = {
  ...mockQuestPageData,
  content: {
    ...(mockQuestPageData.content as any),
    id: 2,
    title: "发布页怎样避免重复打包同一份答案内容？",
    summary:
      "同一份 content 可以在卡片、文章和求索录之间复用，发布时按页面需求决定链接或内嵌。",
    href: "/quests/2",
    groupTitle: "发布",
    description: [
      {
        type: "paragraph",
        children: [
          {
            type: "formatted",
            text: "这个调试样例用于观察多答案布局：一个答案直接内嵌，另一个答案来自已发布文章，页面需要保持轻量、清晰且不重复发布内容。",
          },
        ],
      },
    ],
    answers: [
      {
        id: 9101,
        createTime: Date.now() - 86400000 * 5,
        updateTime: Date.now() - 86400000 * 4,
        content: [
          {
            type: "paragraph",
            children: [
              {
                type: "formatted",
                text: "发布生成器先判断答案 contentId 是否已经投射为卡片或文章。如果本次也选择发布了对应页面，求索录只保留来源链接，由前端读取目标页面的初始化数据来展示正文。这个判断应该只服务于发布体积和阅读完整性，不应该反过来改变用户原本选择发布的范围。",
              },
            ],
          },
          {
            type: "paragraph",
            children: [
              {
                type: "formatted",
                text: "换句话说，求索录引用了卡片，并不代表这张卡片必须被公开发布。只有当卡片本身已经在发布选择里，答案才复用它的页面数据；否则答案内容直接内嵌在求索录详情里。这样读者打开求索录时能读完整内容，发布目录也不会因为引用关系膨胀。",
              },
            ],
          },
          {
            type: "paragraph",
            children: [
              {
                type: "formatted",
                text: "这个策略的关键是把“内容复用”和“页面生成”拆开：复用的是同一份 content 数据，生成的是用户明确选择的公开页面。求索录只是另一个阅读入口，不应该成为隐式发布卡片或文章的开关。",
              },
            ],
          },
        ],
        source: {
          type: "custom",
          contentId: 9101,
          published: false,
        },
      },
      {
        id: 9102,
        createTime: Date.now() - 86400000 * 3,
        updateTime: Date.now() - 86400000 * 2,
        content: [
          {
            type: "paragraph",
            children: [
              {
                type: "formatted",
                text: "如果对应卡片或文章没有发布，求索录会直接内嵌答案正文。这样读者不需要跳转，也不会因为引用关系额外生成未选择的页面。内嵌时仍然保留答案来源信息，方便以后排查这段答案原本来自哪类内容。",
              },
            ],
          },
          {
            type: "code-block",
            language: "ts",
            code: "const shouldInline = !source?.key;",
            uuid: "quest-multi-code-demo",
            children: [{ type: "formatted", text: "" }],
          } as any,
          {
            type: "paragraph",
            children: [
              {
                type: "formatted",
                text: "source.key 标识已发布的来源数据；正文按 key 读取，公开链接由模板自己生成。没有可读取的来源时使用内嵌 content，不抓取公开 HTML。",
              },
            ],
          },
        ],
        source: {
          type: "article",
          id: 18,
          contentId: 9102,
          href: "/articles/18",
          title: "发布数据复用策略",
          published: true,
        },
      },
      {
        id: 9103,
        createTime: Date.now() - 86400000 * 2,
        updateTime: Date.now() - 86400000,
        content: [
          {
            type: "paragraph",
            children: [
              {
                type: "formatted",
                text: "列表页和详情页只需要知道答案的展示方式，不需要知道内部表名。对外仍然叫求索录，保留一点记录探索过程的味道。内部可以继续沿用 question、answer、content 这些命名，因为它们服务的是数据建模，不是读者看到的公开叙事。",
              },
            ],
          },
          {
            type: "paragraph",
            children: [
              {
                type: "formatted",
                text: "真正需要统一的是发布后的语言：导航、列表、详情页、空状态都应该使用求索录。这样不会把内部的问题管理感暴露出去，也能让页面读起来像一组持续整理的探索记录。",
              },
            ],
          },
          {
            type: "paragraph",
            children: [
              {
                type: "formatted",
                text: "答案的排版也应该服从这个定位。它不是评论流，也不是工单记录，而是一个题目下的几段完整笔记。因此调试样例必须使用接近真实卡片长度的答案，否则很容易误判布局，把页面设计成只适合短句的时间线。",
              },
            ],
          },
        ],
        source: {
          type: "project-item",
          id: 7,
          contentId: 9103,
          title: "发布模块设计记录",
          published: false,
        },
      },
    ],
    createTime: Date.now() - 86400000 * 7,
    updateTime: Date.now() - 86400000,
    resolvedTime: Date.now() - 86400000,
  },
};

export const mockDocPageSidebarDemoData: InitData = {
  site: baseSiteConfig,
  navigation: baseNavigation.map((n) => ({
    ...n,
    active: n.href === "/projects",
  })),
  contentLinkTargets: mockContentLinkTargets,
  sidebar: buildDocSidebarValidationDemo(),
  docCollections: mockDocCollections.map((collection) => ({
    ...collection,
    items: collection.items.map((item) => ({
      ...item,
      active: item.id === 101,
    })),
  })),
  content: {
    id: 404,
    title: "更新日志 / 0.4 / 0.4.4",
    content: buildDocOutlineValidationContent(),
    breadcrumb: [
      { label: "软件使用文档", href: "/projects" },
      { label: "更新日志", href: "/projects/101/1" },
      { label: "0.4", href: "/projects/101/4" },
      { label: "0.4.4", href: "/projects/101/404" },
    ],
    prevPage: { title: "0.4.3", href: "/projects/101/403" },
    nextPage: { title: "0.4.5", href: "/projects/101/405" },
    createTime: Date.now() - 86400000 * 40,
    updateTime: Date.now() - 86400000,
    currentPath: "/projects/101/404",
  },
  meta: {
    type: "doc",
    publishTime: Date.now(),
  },
};
