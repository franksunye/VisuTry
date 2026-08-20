import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, resolve } from 'node:path'

const port = Number(process.env.MEDIAPIPE_ASSET_PORT || 4100)
const root = resolve(
  process.cwd(),
  process.env.MEDIAPIPE_ASSET_ROOT || '.local/mediapipe-assets',
)

const mimeTypes = {
  '.js': 'application/javascript; charset=utf-8',
  '.task': 'application/octet-stream',
  '.wasm': 'application/wasm',
}

function safePath(urlPath) {
  try {
    const decoded = decodeURIComponent(urlPath.split('?')[0])
    const relative = decoded.replace(/^\/+/, '')
    const candidate = resolve(root, relative)
    return candidate === root || candidate.startsWith(`${root}/`) ? candidate : null
  } catch {
    return null
  }
}

const server = createServer(async (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*')
  response.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
  response.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type')
  response.setHeader('X-Content-Type-Options', 'nosniff')
  response.setHeader('Cache-Control', 'public, max-age=31536000, immutable')

  if (request.method === 'OPTIONS') {
    response.writeHead(204)
    response.end()
    return
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD, OPTIONS' })
    response.end('Method Not Allowed')
    return
  }

  const filePath = safePath(request.url || '/')
  if (!filePath) {
    response.writeHead(400)
    response.end('Bad Request')
    return
  }

  try {
    const file = await stat(filePath)
    if (!file.isFile()) throw new Error('not a file')

    const contentType = mimeTypes[extname(filePath)] || 'application/octet-stream'
    const range = request.headers.range
    let start = 0
    let end = file.size - 1
    let status = 200

    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range)
      if (!match) {
        response.writeHead(416, { 'Content-Range': `bytes */${file.size}` })
        response.end()
        return
      }
      if (match[1]) {
        start = Number(match[1])
        end = match[2] ? Number(match[2]) : file.size - 1
      } else {
        const suffixLength = Number(match[2])
        start = Math.max(0, file.size - suffixLength)
        end = file.size - 1
      }
      if (start < 0 || start >= file.size || end < start) {
        response.writeHead(416, { 'Content-Range': `bytes */${file.size}` })
        response.end()
        return
      }
      end = Math.min(end, file.size - 1)
      status = 206
    }

    const headers = {
      'Accept-Ranges': 'bytes',
      'Content-Length': end - start + 1,
      'Content-Type': contentType,
    }
    if (status === 206) headers['Content-Range'] = `bytes ${start}-${end}/${file.size}`
    response.writeHead(status, headers)
    if (request.method === 'HEAD') {
      response.end()
      return
    }
    createReadStream(filePath, { start, end }).pipe(response)
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    response.end('Not Found')
  }
})

server.listen(port, '127.0.0.1', () => {
  console.log(`Local MediaPipe asset host: http://127.0.0.1:${port}`)
  console.log(`Serving files from: ${root}`)
})
