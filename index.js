import express from 'express'
import http from 'node:http'
import { createBareServer } from '@tomphttp/bare-server-node'
import path from 'node:path'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import config from './config.js'
import { decodeJWT } from './utils.js'
import auth, {firstToken} from './auth.js'
const __dirname = process.cwd()
const server = http.createServer()
const app = express(server)
const bareServer = createBareServer('/v/')
const PORT = process.env.PORT || 8080

app.use(cookieParser());
if (config.challenge) {
  console.log('Password protection is enabled. Usernames are: ' + Object.keys(config.users))
  console.log('Passwords are: ' + Object.values(config.users))
}
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())
app.use((req, res, next) => {
  let redirectLoc = '/l';
  let whitelist = [
    '/l',
    '/api/login',
    '/assets/scripts/login.js',
    '/assets/styles/login.css'
  ];
  if (firstToken) {
    redirectLoc = '/firstLogin';
    whitelist = [
      '/firstLogin',
      '/api/firstLogin',
      '/assets/scripts/firstLogin.js',
      '/assets/styles/firstLogin.css'
    ];
  }
  const token = req.cookies.gtid;
  if (token && decodeJWT(token)) {
    whitelist.forEach((s) => {
      if (req.path == s) {
        return res.redirect('/');
      }
    })
    return next();
  }
  let wa = false;
  whitelist.forEach(
    (s) => {
      if (req.path == s) {
        wa = true;
      } 
    }
  );
  if (wa) {
    return next();
  } else {
    return res.redirect(redirectLoc);
  }
});
app.use(auth);
app.use(express.static(path.join(__dirname, 'static')))

if (config.routes !== false) {
  const routes = [
    { path: '/~', file: 'apps.html' },
    { path: '/-', file: 'games.html' },
    { path: '/!', file: 'settings.html' },
    { path: '/0', file: 'tabs.html' },
    { path: '/1', file: 'go.html' },
    { path: '/', file: 'index.html' },
    { path: '/l', file: 'login.html' }
  ]

  routes.forEach((route) => {
    app.get(route.path, (req, res) => {
      res.sendFile(path.join(__dirname, 'static', route.file))
    })
  })
}

app.get('/firstLogin', (req, res) => {
  if (firstToken) {
    return res.sendFile(path.join(__dirname, 'static', 'firstLogin.html'));
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
