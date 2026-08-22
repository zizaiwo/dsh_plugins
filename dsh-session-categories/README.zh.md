# dsh-session-categories（会话分类）

[English](README.md) | 中文

**把 DeepSeek Harness 侧边栏按自定义分类组织起来。** 每个工作区有自己的分类文件夹树——把会话拖进文件夹、直接在分类里新建会话，相关工作聚在一起。

## 亮点

- **零配置接管**——bundle patch 自动禁用官方工作区浏览器、挂载分类树。安装 → 重启 → 完成，无需任何手工配置
- **每工作区独立**——每个工作区的分类结构互不干扰
- **拖拽操作**——会话拖入/拖出分类、拖分类文件夹调顺序
- **完整保留官方体验**——基于官方 UI 的 fork：搜索、重命名、fork、归档、工作区操作全部照旧
- **分类里直接建会话**——hover 分类文件夹点「＋」，复用工作区空白会话，少一步拖拽

## 安装

```sh
dsh plugin --profile web add @zizaiwo/dsh-session-categories
```

重启 DSH 即可，无需其他配置——patch 会自动禁用官方 `ui-workspace`，分类树接管侧边栏。

手动登记 profile：

```json
{
  "dependencies": { "@zizaiwo/dsh-session-categories": "^0.1.0" },
  "dsh": { "profile": { "bundles": [ "...官方 bundles...", "@zizaiwo/dsh-session-categories" ] } }
}
```

## 快速开始

1. 安装并重启——每个工作区现有的会话全部归入「未分类」组
2. 点「＋ 新建分类」→ 输入名称回车 → 出现空文件夹
3. 把会话拖到分类文件夹上——完成归类（一个会话只属于一个分类）
4. hover 分类：✎ 重命名 / 🗑 删除（两次点击确认，删除后会话回「未分类」，不删会话）

## 功能特性

- 分类管理：新建、重命名、删除（删除只取消归类，不删会话）
- 分类排序：拖拽文件夹调整顺序（仅同工作区；拖到「未分类」= 移到末尾）
- 移动会话：拖拽会话到分类 / 「未分类」文件夹
- 原地建会话：hover 分类或「未分类」文件夹点「＋」，新建会话自动归入
- 每工作区隔离：分类配置按工作区独立
- 官方能力保留：重命名 / fork / 归档、工作区重命名 / 删除 / 新建会话、搜索

## 兼容性

- 面向当前 dsh 预发布插件 API（`0.1.0-rc` 时期）。dsh 处于**开发者预览期**，不承诺预发布兼容——升级时请 dsh 与本插件一起升级。

## 数据

分类数据存于 `{工作区}/.dsh/session-categories.json`（`.dsh` 目录不存在时回退 `{工作区}/session-categories.json`）。形态：`{ version: 1, categories: [{id, name, createdAt}], sessionCategory: {sessionId: categoryId} }`——无记录的会话即未分类。写入原子化（tmp + rename）。

---

## 维护者区

### 架构

- **Client**（`client.js`）：fork 官方 `dsh-client-ui-workspace`，把 `WorkspaceBrowser` 的分组层换成 `CategoryTree`（复用官方 `ProjectRowItem` / `SessionNodeItem` 与 CSS modules）
- **Host**（`index.js`）：`webServer` 路由 `/api/dsh-session-categories`（loopback-only），用 `node:fs` 持久化分类数据（原子写：tmp + rename）
- **数据通道**：走官方 webServer 的普通 HTTP——见下"为什么不用 harness.handle"

### 为什么不用 `harness.handle` / `host.call`

那是动态插件专属的私有 RPC，进程重启即失——常规仓库插件不可用。本插件走官方 `webServer` 路由（与 dsh-ssh 同款模式）。

### 为什么插件要禁用官方 `ui-workspace`

本插件 fork 官方 client 并注册同一个 slot。slot 规则里子槽 `sidebar.workspaces.directoryFlow` 只能被一个 entry 声明、`renderSlot` 只注入给声明了子槽的 occupant——官方在场时无法再声明子槽，必须由本插件独占。patch 自动完成禁用（`id: ui-workspace` 短名）。

### 开发

- 无构建步骤：纯 JS host（`index.js`）+ 打包 client（`client.js`）
- 校验：`node .dsh/skills/ouyezi/scripts/check-plugin.mjs <本目录>`

## License

[Apache-2.0](LICENSE) © 2026 zizaiwo
