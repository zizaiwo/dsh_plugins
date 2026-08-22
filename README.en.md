# dsh_plugins

[中文](README.md)

**A collection of DeepSeek Harness plugins by zizaiwo** — ready-to-use dsh plugins, all installable via npm in one command.

## Plugins

| Plugin | npm package | What it does | Install |
|--------|-------------|--------------|---------|
| 🗂️ Session Categories | [`@zizaiwo/dsh-session-categories`](https://www.npmjs.com/package/@zizaiwo/dsh-session-categories) | Organize sidebar sessions into custom categories, drag & drop to group | `dsh plugin --profile web add @zizaiwo/dsh-session-categories` |

> More plugins will be added over time (each plugin is an independent npm package).

## Quick Start

Every plugin installs through the official `dsh plugin` command — **no extra manual configuration needed** (each plugin ships its own bundle patch that handles mounting automatically):

```sh
# Example with the web profile (use your profile name otherwise)
dsh plugin --profile web add @zizaiwo/dsh-session-categories
dsh --profile web
```

Restart dsh after install. See each plugin's README for detailed usage.

## Compatibility

- Targets **dsh 0.1.0-rc.x (developer preview)**
- dsh is in preview and may introduce breaking changes — **upgrade plugins together with dsh**
- Plugins depend on the official `@deepseek-ai/dsh-base` / `@deepseek-ai/dsh-web-app` composition; when installing into other profiles, make sure the corresponding official bundles are present

## Repository Layout

```
dsh_plugins/
├── dsh-session-categories/   ← Session Categories plugin (full bundle source + README + LICENSE)
└── ...                        ← future plugins follow the same structure
```

Each plugin directory is a **complete publishable bundle** (`package.json` declaring `dsh.bundle` + `cordis.patch.yml` + plugin source) that can be `npm publish`ed independently.

## Development

- Issues / PRs welcome: https://github.com/zizaiwo/dsh_plugins/issues

## License

Apache-2.0 — see the [LICENSE](dsh-session-categories/LICENSE) file in each plugin directory.
