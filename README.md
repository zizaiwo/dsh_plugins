# dsh_plugins

[English](README.en.md)

**zizaiwo 的 DeepSeek Harness 插件集合**——开箱即用、全部可一键 npm 安装的 dsh 插件。

## 插件列表

| 插件 | npm 包 | 一句话 | 安装 |
|------|--------|--------|------|
| 🗂️ 会话分类 | [`@zizaiwo/dsh-session-categories`](https://www.npmjs.com/package/@zizaiwo/dsh-session-categories) | 侧边栏会话按自定义分类组织，拖拽即归类 | `dsh plugin --profile web add @zizaiwo/dsh-session-categories` |

> 更多插件陆续加入（每个插件一个独立 npm 包，互不干扰）。

## 快速开始

所有插件都通过官方 `dsh plugin` 命令安装，**无需额外手工配置**（插件自带 bundle patch，自动完成挂载）：

```sh
# 以 web profile 为例（其他 profile 换名字即可）
dsh plugin --profile web add @zizaiwo/dsh-session-categories
dsh --profile web
```

安装后重启 dsh 即生效。每个插件的详细使用说明见各自目录的 README。

## 兼容性

- 适配 **dsh 0.1.0-rc.x（开发者预览期）**
- dsh 处于预览期，未来可能有破坏性变更——**升级 dsh 时请同步升级插件**
- 各插件依赖官方 `@deepseek-ai/dsh-base` / `@deepseek-ai/dsh-web-app` 组合，独立安装到其他 profile 时需确认对应官方 bundle 在场

## 仓库结构

```
dsh_plugins/
├── dsh-session-categories/   ← 会话分类插件（完整 bundle 源码 + README + LICENSE）
└── ...                        ← 后续插件按此结构加入
```

每个插件目录是一个**完整的可发布 bundle**（`package.json` 声明 `dsh.bundle` + `cordis.patch.yml` + 插件源码），可独立 `npm publish`。

## 开发与维护

- 合规校验：插件发布前用 [欧冶子（ouyezi）](https://github.com/deepseek-ai/deepseek-harness) 技能体系的 `check-plugin.mjs` 校验（14 条规则：bundle 声明/exports/依赖声明/LICENSE 等）
- 提 Issue / PR 欢迎：https://github.com/zizaiwo/dsh_plugins/issues

## License

Apache-2.0 — 详见各插件目录的 [LICENSE](dsh-session-categories/LICENSE)。
