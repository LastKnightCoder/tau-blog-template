# Tau 博客模板插件

插件 ID：`tau.blog`。源码基于主项目 master `8914722c1` 的 `apps/blog` 复制，保留页面、样式、主题、目录、标签、卡片、文章、项目文档、求索录、搜索及正文预览。原工程保持不动，旧说明见 [原博客说明](docs/原博客说明.md)。

宿主只负责数据、搜索和插件产物协议。此模板自己选择 React、EditorKit、HashRouter 和预览 UI，自己校验、求值并渲染内容插件，不调用桌面 create/activate。其他模板无需使用这些实现。

## 构建

本工程只消费两个 Tau 公开依赖：通用 `@tau/editor` 与数据/产物协议 `@tau/plugins`，不依赖宿主源码，不执行普通 SDK/UI 根入口的占位脚本。Editor、默认内置扩展、UI、预编译 CSS 与资源随站点构建；内容插件仍消费发布时的实际 C23 产物。

候选阶段的仓库外验证已完成；SDK 的公共 npm 发布需先协调 registry 已有 0.18.0 与 master 0.17.0 的差异，不能把候选验证当成公开安装完成。正式锁文件/公开版本交付后，在本工程运行：

```sh
pnpm install --frozen-lockfile --ignore-scripts
node scripts/build.mjs
node node_modules/typescript/bin/tsc --noEmit
node node_modules/vitest/vitest.mjs run --config vitest.config.ts
```

正文资源读取、C23 模块映射、摘要校验、实例样式和全页 HTML 适配在 `src/published/`，使用 Editor 的公开能力；不复制编辑器实现，不扫描宿主源码。页面保留图片偏好、媒体插槽、业务节点和内容链接等自身扩展，全部从明确的公开子入口接入。

产物：

- `dist/manifest.json`：纯静态 template 清单，全部站点资产使用 SHA-256。
- `dist/site/`：单入口 SPA 与原有渲染资源。
- `output/tau.blog-1.0.0.zip`：可安装模板包，根目录为 tau.blog。

开发版客户端通过插件页安装 ZIP，重启完成既有安装事务，再在「发布 → 站点设置 → 博客模板」选择。主仓库的本地集成检查使用临时目录与生成站点，不写入真实用户插件目录。正式上架需随支持该协议的宿主版本确定最低版本并发布门户 API；本轮没有线上发布。

## 数据与路由

入口 meta 的 __TAU_MANIFEST__ 由宿主替换。模板从清单按 key 读取数据，搜索只读取摘要索引，预览与引用答案也按 key 取数。它们都不抓取公开页面或解析 HTML 内联初始化数据。

本模板的公开路径示例为 `/#/articles/1`、`/#/cards`、`/#/projects/12/34`、`/#/quests/9`。部署在 /notes/ 时为 `/notes/#/projects/12/34`。这些规则由本模板定义；浏览器前进、后退与 hash 深链交给 HashRouter，无需服务器业务 URL 回退。

正文、悬停预览和复用答案各持独立数据上下文与编辑器实例。伴生 CSS 按 dataUrl 读取并验证摘要，限定到对应实例，关闭后释放。全页 HTML 使用模板自己的 iframe，支持脚本与伴生 CSS；普通 HTML 片段继续使用原渲染器。框架与 DOM 约定没有进入宿主契约。

## 验证

在宿主 checkout 执行：

```sh
node scripts/editor/verify-author.mjs /绝对路径/tau-blog-template --candidate
node scripts/plugins/verify-blog-template.mjs /绝对路径/tau-blog-template
TAU_VERIFY_BLOG_BROWSER=1 node scripts/plugins/verify-blog-template.mjs /绝对路径/tau-blog-template
```

第一条生成无宿主源码的候选作者目录并完整验证，路径记录在 output/author-verification；后两条可传该目录，第三条使用隐藏 Electron 窗口验证行为。可用 TAU_ELECTRON_BIN 指定本机 Electron 可执行文件。检查记录写入宿主 output/blog-template-integration/。不截图、不进行视觉走查，外观由用户验收。正式 SQLite 选取与上传提供方由宿主现有入口负责，检查脚本使用真实形状的数据夹具，网络发布与真实账户另由使用者验收。
