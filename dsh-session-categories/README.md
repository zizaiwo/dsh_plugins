# dsh-session-categories

English | [中文](README.zh.md)

[![npm version](https://img.shields.io/npm/v/@zizaiwo/dsh-session-categories)](https://www.npmjs.com/package/@zizaiwo/dsh-session-categories) [![License](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)

**Organize your DeepSeek Harness sidebar into custom session categories.** Each workspace gets its own folder tree — drag sessions into folders, create sessions right inside a category, and keep related work together.

## Highlights

- **Zero-config takeover** — the bundle patch automatically disables the official workspace browser and mounts the category tree. Install, restart, done.
- **Per-workspace categories** — every workspace keeps its own independent folder structure.
- **Drag & drop** — move sessions between categories, reorder categories by dragging.
- **Full official experience preserved** — built on a fork of the official UI: search, rename, fork, archive, and workspace actions all still work.
- **Folders are cheap** — create a session directly inside any category (reuses the workspace blank session, one less drag).

## Install

```sh
dsh plugin --profile web add @zizaiwo/dsh-session-categories
```

Restart DSH. No further configuration — the patch disables the official `ui-workspace` and the category tree takes over the sidebar.

Manual profile registration:

```json
{
  "dependencies": { "@zizaiwo/dsh-session-categories": "^0.1.0" },
  "dsh": { "profile": { "bundles": [ "...official bundles...", "@zizaiwo/dsh-session-categories" ] } }
}
```

## Quick start

1. Install and restart — every existing session appears under an **Uncategorized** group per workspace.
2. Click **＋ New category**, type a name, press Enter.
3. Drag a session onto a category folder — it moves in. One session, one category.
4. Hover a category for ✎ rename / 🗑 delete (two-click confirm; sessions return to Uncategorized).

## Features

- Category management: create, rename, delete (delete keeps your sessions, just ungroups them)
- Category ordering: drag folders to reorder (per workspace; drag to "Uncategorized" = move to end)
- Move sessions: drag sessions between categories
- Create sessions in place: hover a folder and hit **＋**
- Per-workspace isolation of category config
- Official capabilities preserved: rename / fork / archive, workspace rename / delete / new session, search

## Compatibility

- Targets the current dsh prerelease plugin APIs (`0.1.0-rc` era). dsh is in **developer preview** and does not promise pre-release compatibility — upgrade dsh and this plugin together.

## Data

Category data lives in `{workspace}/.dsh/session-categories.json` (falls back to `{workspace}/session-categories.json` when `.dsh` is absent). Shape: `{ version: 1, categories: [{id, name, createdAt}], sessionCategory: {sessionId: categoryId} }` — sessions without a record are uncategorized. Writes are atomic (tmp + rename).

---

## For maintainers

### Architecture

- **Client** (`client.js`): fork of the official `dsh-client-ui-workspace`; the `WorkspaceBrowser` grouping layer is replaced by a `CategoryTree` (reusing official `ProjectRowItem` / `SessionNodeItem` and CSS modules).
- **Host** (`index.js`): `webServer` route at `/api/dsh-session-categories` (loopback-only) persisting category data with `node:fs` (atomic write: tmp + rename).
- **Data channel**: plain HTTP via the official web server — see "Why not harness.handle" below.

### Why not `harness.handle` / `host.call`

Those are dynamic-plugin-only private RPCs that die on process restart — unavailable to regular repository plugins. This plugin uses the official `webServer` route instead (same pattern as dsh-ssh).

### Why the plugin disables the official `ui-workspace`

This plugin forks the official client and registers the same slot. Slot rules allow `sidebar.workspaces.directoryFlow` to be declared by only one entry, and `renderSlot` only injects into the occupant that declares the child slot — so the official entry must be disabled for this plugin to take over. The patch does this automatically (`id: ui-workspace`, short name).

### Development

- No build step: plain JS host (`index.js`) + bundled client (`client.js`)
- Validate: `node .dsh/skills/ouyezi/scripts/check-plugin.mjs <this-dir>`

## License

[Apache-2.0](LICENSE) © 2026 zizaiwo
