import type { DataResult } from "@tau/blog";
import type { InitData, DocCollection } from "@blog/types";
import type { Descendant } from "slate";

const baseSiteConfig = {
  title: "我的知识库",
  fields: { description: "记录学习、思考与成长" },
  basePath: "",
};

const baseNavigation = [
  { label: "首页", href: "/", active: false },
  { label: "卡片", href: "/cards", active: false },
  { label: "文章", href: "/articles", active: false },
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

export function publishedResult(data: InitData): DataResult {
  return { dataUrl: "https://example.com/test.json", data: { version: 1, key: "test", meta: data.meta, content: data.content } as DataResult["data"] };
}

export const mockDocPageSidebarDemoData: InitData = {
  site: baseSiteConfig,
  navigation: baseNavigation.map((n) => ({
    ...n,
    active: n.href === "/projects",
  })),
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
