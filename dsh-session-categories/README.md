# dsh-session-categories（会话分类）

侧边栏会话按**自定义分类**组织：每个工作区下可以建立分类文件夹，会话拖入文件夹即归类；
一个会话只属于一个分类，未分类会话归入固定的「未分类」组。

本插件**在官方 `@deepseek-ai/dsh-client-ui-workspace` 基础上扩展**：fork 官方客户端代码，
复用其全部样式、primitives、搜索、会话行交互（重命名 / fork / 归档菜单、hover 卡片、
工作区重命名与删除），仅在分组层注入分类逻辑。官方「按工作区分组 / 平铺 / 搜索」视图仍然可用
（搜索时自动切换官方结果视图）。

## 功能

- 分类管理：新建、重命名、删除（删除分类时其会话回到「未分类」，不删会话；删除需两次点击确认）
- 分类排序：拖拽分类文件夹上下调整顺序（仅同工作区；拖到「未分类」= 移到末尾）
- 移动会话：拖拽会话到分类文件夹 / 「未分类」文件夹
- 文件夹内新建会话：hover 分类或「未分类」文件夹点「＋」，新建会话自动归入对应分组（复用工作区空白会话，少一步拖拽）
- 每工作区独立：分类配置按工作区隔离
- 保留能力：会话重命名 / fork / 归档、工作区重命名 / 删除 / 新建会话、搜索

## 第一版取舍（后续增强候选）

- 批量移动：当前仅拖拽单会话移动；批量（多选后移动）待 v1.1
- 分类内顺序：按更新时间倒序（官方手动排序未接入分类层）
- 工作区 / 分类的展开折叠状态：当前为会话内 UI 状态（刷新后重置为展开）

## 架构

- **Client**（`client.js`）：fork 官方 `dsh-client-ui-workspace`，`WorkspaceBrowser` 的分组层
  换成 `CategoryTree`（复用官方 `ProjectRowItem` / `SessionNodeItem` / CSS module）。
- **Host**（`index.js`）：`/api/dsh-session-categories` webServer 路由（loopback-only），
  用 node:fs 读写分类数据（原子写：tmp + rename）。
- **数据文件**：`{工作区}/.dsh/session-categories.json`（`.dsh` 不存在时回退
  `{工作区}/session-categories.json`）。
  形态：`{ version: 1, categories: [{id, name, createdAt}], sessionCategory: {sessionId: categoryId} }`
  （无记录 = 未分类）。

为什么不用动态插件的 `harness.handle / host.call`：那是动态插件专属私有 RPC，进程重启即失，
常规仓库插件不可用，故数据通道走官方 webServer（与 dsh-ssh 同款模式）。

## 安装（自包含，无需额外手工配置）

本插件**自带 bundle patch**，安装后自动完成「禁用官方 ui-workspace + 挂载自身」，
新设备无需手动改任何部署配置（`~/.dsh/profiles/web/cordis.patch.yml` 不用动）。

### 步骤（以 web profile 为例）

1. 通过 npm 安装并挂载（发布后）：
   ```sh
   dsh plugin --profile web add dsh-session-categories
   ```
   或手动在 `~/.dsh/profiles/web/package.json` 登记：
   ```json
   {
     "dependencies": { "dsh-session-categories": "^0.1.0" },
     "dsh": { "profile": { "bundles": [ "...官方 bundles...", "dsh-session-categories" ] } }
   }
   ```
   （`bundles` 数组末尾追加一行即可——这是所有 dsh bundle 插件的标准挂载方式。）
2. 重启 DSH。
3. 无需其他操作：插件 patch 会自动禁用官方 `ui-workspace`（`id: ui-workspace` 短名，
   见 `cordis.patch.yml`），分类树接管侧边栏。

> 为什么插件要禁用官方：本插件 fork 官方 client 注册同一 slot。slot 规则里子槽
> `sidebar.workspaces.directoryFlow` 只能被一个 entry 声明、`renderSlot` 只注入给声明子槽的
> occupant——官方在场时无法再声明子槽，必须由本插件独占。

### 排障

页面顶部会显示插件诊断横幅：绿字（apply/注册成功）或红字（具体错误）——套壳端无 DevTools
也能定位。常见错误与解法见 `cordis.patch.yml` 注释。

## 验证清单

1. 侧边栏每个工作区下方出现「未分类」组（原会话全部归入其中）
2. 「＋ 新建分类」→ 输入名称回车 → 出现空文件夹
3. 拖拽会话到分类 → 会话从「未分类」移入该分类（一个会话只在一个分类）
4. 分类行 hover：✎ 重命名、🗑 删除（两次点击确认，会话回未分类）
5. 搜索、会话重命名 / 归档、工作区重命名 / 新建会话仍与官方一致
