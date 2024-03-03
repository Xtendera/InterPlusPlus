import express from 'express'
import http from 'node:http'
import { createBareServer } from '@tomphttp/bare-server-node'
import path from 'node:path'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import config from './config.js'
import { decodeJWT, encodeJWT } from './utils.js'
const __dirname = process.cwd()
const server = http.createServer()
const app = express(server)
const bareServer = createBareServer('/v/')
const PORT = process.env.PORT || 8080
let jwtUsed = false;

app.use(cookieParser());
if (config.challenge) {
  console.log('Password protection is enabled. Usernames are: ' + Object.keys(config.users))
  console.log('Passwords are: ' + Object.values(config.users))
}

app.use((req, res, next) => {
  if (req.path == '/l' || req.path.includes('/assets') || req.path == '/api/login') {
    return next();
  }
  const token = req.cookies.gtid;
  if (!token) {
    return res.redirect('/l');
  }
  if (!decodeJWT(token)) {
    return res.redirect('/l');
  }
  next();
});
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())
app.use(express.static(path.join(__dirname, 'static')))

if (config.routes !== false) {
  const routes = [
    { path: '/~', file: 'apps.html' },
    { path: '/-', file: 'games.html' },
    { path: '/!', file: 'settings.html' },
    { path: '/0', file: 'tabs.html' },
    { path: '/1', file: 'go.html' },
    { path: '/', file: 'index.html' },
    { path: '/l', file: 'login.html' },
  ]

  routes.forEach((route) => {
    app.get(route.path, (req, res) => {
      res.sendFile(path.join(__dirname, 'static', route.file))
    })
  })
}

app.post('/api/login', (req, res) => {
  let user = req.body.user;
  let pass = req.body.pass;
  if (!user && !pass) {
    return res.sendStatus(401);
  }
  user = user.toString();
  pass = pass.toString();
  if (user == 'coolboy' && pass == 'blo') {
    const d = new Date();
    d.setTime(d.getTime() + (7*24*60*60*1000));
    return res.send(encodeJWT({
      sub: '123456789',
      iat: Date.now(),
      exp: d,
      nickname: 'xtendera',
    }));
  }
  return res.sendStatus(401);
});

if (config.local !== false) {
  app.get('/y/*', (req, res, next) => {
    const baseUrl = 'https://raw.githubusercontent.com/ypxa/y/main'
    fetchData(req, res, next, baseUrl)
  })

  app.get('/f/*', (req, res, next) => {
    const baseUrl = 'https://raw.githubusercontent.com/4x-a/x/fixy'
    fetchData(req, res, next, baseUrl)
  })
}

const fetchData = async (req, res, next, baseUrl) => {
  try {
    const reqTarget = `${baseUrl}/${req.params[0]}`
    const asset = await fetch(reqTarget)

    if (asset.ok) {
      const data = await asset.arrayBuffer()
      res.end(Buffer.from(data))
    } else {
      next()
    }
  } catch (error) {
    console.error('Error fetching:', error)
    next(error)
  }
}
server.on('request', (req, res) => {
  if (bareServer.shouldRoute(req)) {
    bareServer.routeRequest(req, res)
  } else {
    app(req, res)
  }
})

server.on('upgrade', (req, socket, head) => {
  if (bareServer.shouldRoute(req)) {
    bareServer.routeUpgrade(req, socket, head)
  } else {
    socket.end()
  }
})

server.on('listening', () => {
  console.log(`Running at http://localhost:${PORT}`)
})

server.listen({
  port: PORT,
})
