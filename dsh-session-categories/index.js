// dsh-session-categories — HOST 半边：会话分类数据持久化 API。
//
// 数据文件：{workspace}/.dsh/session-categories.json（.dsh 目录不存在时回退
// {workspace}/session-categories.json，避免破坏无 .dsh 的工作区根目录）。
// 形态：{ version: 1, categories: [{id,name,createdAt}], sessionCategory: {sessionId: categoryId} }
// 会话不设分类时其 sessionId 不在 sessionCategory 中（等价于未分类）。
//
// Client 通过 fetch('/api/dsh-session-categories?...') 调用本 API（GET 读 / POST 写），
// 静态插件（常规仓库插件）拿不到动态插件专属的 harness.handle/host.call 私有 RPC，
// 所以数据通道走官方 webServer 路由（与 dsh-ssh 同款模式）。

import { mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const API_PATH = '/api/dsh-session-categories'

export const name = 'dsh-session-categories'
export const inject = ['webServer']

const EMPTY_STORE = () => ({ version: 1, categories: [], sessionCategory: {} })

/** Store 文件路径：优先 {ws}/.dsh/session-categories.json，回退 {ws}/session-categories.json。 */
function storePath(workspacePath) {
  const base = String(workspacePath || '').replace(/[/\\]+$/, '')
  if (base === '') return ''
  const dotDsh = join(base, '.dsh')
  let useDotDsh = false
  try {
    useDotDsh = statSync(dotDsh).isDirectory()
  } catch {
    useDotDsh = false
  }
  return useDotDsh ? join(dotDsh, 'session-categories.json') : join(base, 'session-categories.json')
}

/** 读 store；文件缺失或损坏时返回空 store。 */
function readStore(workspacePath) {
  const file = storePath(workspacePath)
  if (file === '') return EMPTY_STORE()
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8'))
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.categories)) {
      return {
        version: 1,
        categories: parsed.categories,
        sessionCategory:
          parsed.sessionCategory && typeof parsed.sessionCategory === 'object' ? parsed.sessionCategory : {},
      }
    }
  } catch {
    /* fall through to empty */
  }
  return EMPTY_STORE()
}

/** 原子写 store（先写临时文件再 rename，避免半写）。 */
function writeStore(workspacePath, data) {
  const file = storePath(workspacePath)
  if (file === '') throw new Error('workspacePath is required')
  mkdirSync(dirname(file), { recursive: true })
  const tmp = file + '.tmp'
  writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8')
  renameSync(tmp, file)
}

function writeJson(res, status, body) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'referrer-policy': 'no-referrer',
  })
  res.end(JSON.stringify(body))
}

/** Loopback-only 防护：这些端点读写本地工作区数据，LAN 暴露的部署不应开放。 */
function isLoopback(req) {
  const addr = req.socket && req.socket.remoteAddress
  return addr === '127.0.0.1' || addr === '::1' || addr === '::ffff:127.0.0.1' || addr === undefined
}

export function apply(ctx) {
  ctx.webServer.register({
    kind: 'exact',
    path: API_PATH,
    handler: async (req, res) => {
      const method = req.method ?? 'GET'
      if (!isLoopback(req)) {
        writeJson(res, 403, { error: 'forbidden: loopback-only' })
        return
      }
      const url = new URL(req.url ?? '/', 'http://localhost')
      const ws = url.searchParams.get('ws') || ''

      if (method === 'GET') {
        if (!ws) {
          writeJson(res, 400, { error: 'ws (workspacePath) query param is required' })
          return
        }
        writeJson(res, 200, readStore(ws))
        return
      }

      if (method === 'POST') {
        let body
        try {
          const chunks = []
          for await (const chunk of req) chunks.push(chunk)
          body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
        } catch {
          writeJson(res, 400, { error: 'invalid JSON body' })
          return
        }
        const action = String((body && body.action) || '')
        const targetWs = String((body && body.ws) || '')
        if (!targetWs) {
          writeJson(res, 400, { error: 'ws (workspacePath) is required' })
          return
        }
        const store = readStore(targetWs)

        if (action === 'create') {
          const name = String((body && body.name) || '').trim()
          if (!name) {
            writeJson(res, 400, { error: 'name is required' })
            return
          }
          if (store.categories.some((c) => c.name === name)) {
            writeJson(res, 409, { error: 'category name already exists' })
            return
          }
          const cat = {
            id: 'cat-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7),
            name,
            createdAt: Date.now(),
          }
          store.categories.push(cat)
          try {
            writeStore(targetWs, store)
          } catch (err) {
            writeJson(res, 500, { error: 'write failed: ' + String((err && err.message) || err) })
            return
          }
          writeJson(res, 200, cat)
          return
        }

        if (action === 'rename') {
          const id = String((body && body.categoryId) || '')
          const name = String((body && body.name) || '').trim()
          if (!name) {
            writeJson(res, 400, { error: 'name is required' })
            return
          }
          const cat = store.categories.find((c) => c.id === id)
          if (!cat) {
            writeJson(res, 404, { error: 'category not found' })
            return
          }
          cat.name = name
          try {
            writeStore(targetWs, store)
          } catch (err) {
            writeJson(res, 500, { error: 'write failed: ' + String((err && err.message) || err) })
            return
          }
          writeJson(res, 200, { ok: true })
          return
        }

        if (action === 'delete') {
          const id = String((body && body.categoryId) || '')
          if (!store.categories.some((c) => c.id === id)) {
            writeJson(res, 404, { error: 'category not found' })
            return
          }
          store.categories = store.categories.filter((c) => c.id !== id)
          for (const key of Object.keys(store.sessionCategory)) {
            if (store.sessionCategory[key] === id) delete store.sessionCategory[key]
          }
          try {
            writeStore(targetWs, store)
          } catch (err) {
            writeJson(res, 500, { error: 'write failed: ' + String((err && err.message) || err) })
            return
          }
          writeJson(res, 200, { ok: true })
          return
        }

        if (action === 'move') {
          const id = String((body && body.categoryId) || '')
          const beforeId =
            body && (body.beforeCategoryId === null || body.beforeCategoryId === undefined)
              ? null
              : String((body && body.beforeCategoryId) || '')
          if (store.categories.findIndex((c) => c.id === id) < 0) {
            writeJson(res, 404, { error: 'category not found' })
            return
          }
          const list = store.categories.filter((c) => c.id !== id)
          let to = list.length
          if (beforeId !== null) {
            const target = list.findIndex((c) => c.id === beforeId)
            if (target < 0) {
              writeJson(res, 404, { error: 'target category not found' })
              return
            }
            to = target
          }
          list.splice(to, 0, store.categories[store.categories.findIndex((c) => c.id === id)])
          store.categories = list
          try {
            writeStore(targetWs, store)
          } catch (err) {
            writeJson(res, 500, { error: 'write failed: ' + String((err && err.message) || err) })
            return
          }
          writeJson(res, 200, { ok: true })
          return
        }

        if (action === 'assign') {
          const sessionId = String((body && body.sessionId) || '')
          const categoryId =
            body && (body.categoryId === null || body.categoryId === undefined)
              ? null
              : String((body && body.categoryId) || '')
          if (!sessionId) {
            writeJson(res, 400, { error: 'sessionId is required' })
            return
          }
          if (categoryId === null) delete store.sessionCategory[sessionId]
          else store.sessionCategory[sessionId] = categoryId
          try {
            writeStore(targetWs, store)
          } catch (err) {
            writeJson(res, 500, { error: 'write failed: ' + String((err && err.message) || err) })
            return
          }
          writeJson(res, 200, { ok: true })
          return
        }

        writeJson(res, 400, { error: 'unknown action: ' + action })
        return
      }

      writeJson(res, 405, { error: 'method not allowed' })
    },
  })
}
