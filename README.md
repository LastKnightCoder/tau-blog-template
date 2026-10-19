# Tau 博客模板插件

插件 ID：`tau.blog`。基于原博客独立维护，提供文章、卡片、项目文档、求索录、搜索和正文预览；页面、样式及路由由本模板维护。

宿主只负责数据、搜索和插件产物协议。此模板自己选择 React、BrowserRouter 和预览 UI，正文通过公开 ContentRenderer 接入，不调用桌面 create/activate。其他模板无需使用这些实现。

## 构建

本工程只消费一个 Tau 公共包 `@tau/blog`（固定为 `@xiongtao.xt/tau-blog@0.2.0`，通过 npm 别名使用），不依赖宿主源码。

```sh
pnpm install --frozen-lockfile --ignore-scripts
node node_modules/typescript/bin/tsc --noEmit
node node_modules/vitest/vitest.mjs run --config vitest.config.ts
node scripts/build.mjs
```

正文完全由 ContentRenderer 渲染，模板不装配编辑器。components/Content.tsx 给它三样属于模板的东西：路由（`hrefFor`）、站内链接的悬停预览与引用编号（`renderLink`，实现在 components/SiteLink）、等待和错误界面；文章与文档页用 `onOutline` 生成目录。

产物：

- `dist/manifest.json`：纯静态 template 清单，全部站点资产使用 SHA-256。
- `dist/site/`：`index.html` 与内容相同的 `404.html` 两个入口，以及渲染资源。
- `output/tau.blog-<版本>.zip`：可安装模板包，根目录为 tau.blog。

Release 中的 ZIP 由打 tag 的提交在干净目录中构建，可用上面的命令复现。

## 数据与路由

入口 meta 的 `__TAU_MANIFEST__` 和资源路径前缀 `__TAU_BASE__` 由宿主发布时替换。模板从清单按 key 读取数据；侧边栏目录、项目列表和卡片标签树从清单读取。搜索只读取摘要索引，预览与引用答案也按 key 取数。

公开路径为 `/articles/1`、`/cards`、`/projects/12/34`、`/quests/9`，部署在 /notes/ 时加上该前缀。这些规则由本模板定义。站内链接点击由 Router 处理，不整页刷新；直接打开深链时，静态托管找不到对应文件会返回 `404.html`，再由 Router 按地址渲染。GitHub Pages 自动使用 404.html；S3 需要把桶的错误页设为 `404.html`。深链的 HTTP 状态码是 404，不影响浏览器访问，但搜索引擎不会收录这些地址。

链接只从协议声明的引用字段生成，不遍历或改写正文及插件字段。正文、悬停预览和复用答案各持独立数据上下文，分别挂载 ContentRenderer，关闭后清理。

## 验证

在宿主仓库执行：

```sh
node scripts/blog/verify-author.mjs /绝对路径/tau-blog-template
node scripts/plugins/verify-blog-template.mjs /绝对路径/tau-blog-template
TAU_VERIFY_BLOG_BROWSER=1 node scripts/plugins/verify-blog-template.mjs /绝对路径/tau-blog-template
```

第一条要求模板工作区已提交，用 `git archive` 取出提交内容，从公共 npm 按锁文件冻结安装并完整验证，报告记录提交号；第三条用隐藏 Electron 窗口验证行为。维护者发包前可给第一条加 `--candidate`，用本地候选归档预检。
