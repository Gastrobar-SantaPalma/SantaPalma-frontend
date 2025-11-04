// Minimal static file server for production (no external deps)
const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = process.env.PORT || 3000
const DIST = path.join(__dirname, 'dist')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase()
  const ct = MIME[ext] || 'application/octet-stream'
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404)
      return res.end('Not found')
    }
    res.writeHead(200, { 'Content-Type': ct })
    res.end(data)
  })
}

const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`)
    let reqPath = decodeURIComponent(url.pathname)

    // disallow directory traversal
    if (reqPath.includes('..')) {
      res.writeHead(400)
      return res.end('Bad request')
    }

    let filePath = path.join(DIST, reqPath)
    // if path is directory or doesn't exist, serve index.html for SPA routing
    if (reqPath === '/' || reqPath.endsWith('/') || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(DIST, 'index.html')
    }

    sendFile(res, filePath)
  } catch (e) {
    res.writeHead(500)
    res.end('Server error')
  }
})

server.listen(PORT, () => console.log('Static server running on port', PORT))
