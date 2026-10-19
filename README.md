# Tau 博客模板插件

插件 ID：`tau.blog`。基于原博客独立维护，提供文章、卡片、项目文档、求索录、搜索和正文预览；页面、样式及路由由本模板维护。旧 apps/blog 不再作为构建或发布来源。

宿主只负责数据、搜索和插件产物协议。此模板自己选择 React、HashRouter 和预览 UI，正文通过公开 ContentRenderer 接入，不调用桌面 create/activate。其他模板无需使用这些实现。

## 构建

本工程只消费一个 Tau 公共包 `@tau/blog`，不依赖宿主源码。必要 Editor、内置扩展及预编译 CSS 随包交付，内容插件消费发布时的实际产物。

公开依赖固定为 `@xiongtao.xt/tau-blog@0.1.0`，代码中通过 npm 别名使用 `@tau/blog`。根入口提供 ContentRenderer/createClient；/editor 提供正文扩展与默认组合，/media 提供媒体定制，不公开内部子路径或页面 UI 库。

```sh
pnpm install --frozen-lockfile --ignore-scripts
node scripts/build.mjs
node node_modules/typescript/bin/tsc --noEmit
node node_modules/vitest/vitest.mjs run --config vitest.config.ts
```

正文读取后的插件加载、摘要校验、共享模块和样式清理由公开渲染器封装，模板不维护 src/published 或具体插件适配。页面保留图片偏好、媒体插槽、业务节点和内容链接等自身扩展，从公开能力接入；不复制编辑器实现，不扫描宿主源码。

模板直接复用默认扩展组合，只追加自己的业务节点和外观。页面不补齐 UiProvider/DndProvider；components/Content.tsx 仅维护本模板的等待和错误界面，Tooltip、提示消息及预览容器也属于模板。插件 CSS 和正文 CSS 按原文加载，作用范围由内容插件定义，渲染器不改写样式。

旧 passiveExtensions 及其占位样式、强制覆盖清单已删除，不再由模板识别附件、白板或数据库并替换成专属占位。

产物：

- `dist/manifest.json`：纯静态 template 清单，全部站点资产使用 SHA-256。
- `dist/site/`：单入口 SPA 与原有渲染资源。
- `output/tau.blog-1.0.0.zip`：可安装模板包，根目录为 tau.blog。

在 [GitHub Releases](https://github.com/LastKnightCoder/tau-blog-template/releases) 下载模板 ZIP，通过支持静态模板协议的 Tau 客户端插件页安装，重启后在「发布 → 站点设置 → 博客模板」选择。清单最低版本为 0.59.0，具体能力以宿主支持为准；本模板不经过旧 R2 模板下载流程。本次只通过 GitHub 分发，不上架插件中心。

## 数据与路由

入口 meta 的 __TAU_MANIFEST__ 由宿主替换。模板从清单按 key 读取数据，搜索只读取摘要索引，预览与引用答案也按 key 取数。它们都不抓取公开页面或解析 HTML 内联初始化数据。

本模板的公开路径示例为 `/#/articles/1`、`/#/cards`、`/#/projects/12/34`、`/#/quests/9`。部署在 /notes/ 时为 `/notes/#/projects/12/34`。这些规则由本模板定义；浏览器前进、后退与 hash 深链交给 HashRouter，无需服务器业务 URL 回退。

链接只从协议声明的引用字段生成，不遍历或改写正文及插件字段；树形处理仅用于侧边栏和标签树。没有可预览正文时显示空态，不制造空段落。kit 只使用一处缓存，预览请求只保留一处旧结果回写保护。

正文、悬停预览和复用答案各持独立数据上下文，分别挂载 ContentRenderer；插件与样式由组件按实例处理，关闭后清理。HTML 直接使用原插件渲染，不引入 iframe 或改写 render。框架与 DOM 约定没有进入宿主契约。

## 验证

在宿主 checkout 执行：

```sh
node scripts/blog/verify-author.mjs /绝对路径/tau-blog-template
node scripts/plugins/verify-blog-template.mjs /绝对路径/tau-blog-template
TAU_VERIFY_BLOG_BROWSER=1 node scripts/plugins/verify-blog-template.mjs /绝对路径/tau-blog-template
```

第一条生成无宿主源码的作者目录，从公共 npm 按锁文件冻结安装并完整验证，路径记录在 output/author-verification；后两条可传该目录，第三条使用隐藏 Electron 窗口验证行为。可用 TAU_ELECTRON_BIN 指定本机 Electron 可执行文件。检查记录写入宿主 output/blog-template-integration/。不截图、不进行视觉走查，外观由用户验收。正式 SQLite 选取与上传提供方由宿主现有入口负责，检查脚本使用真实形状的数据夹具，网络发布与真实账户另由使用者验收。

维护者在发包前可给第一条追加 `--candidate` 预检本地归档；该模式与公共 registry 验收分别记录，模板作者无需使用。
