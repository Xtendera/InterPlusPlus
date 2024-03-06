import express from 'express'
import { encodeJWT} from './utils.js'
import crypto from 'node:crypto'
import bcrypt from 'bcrypt'
import fs from 'node:fs'
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let tokens;
export let firstToken;

function flushTokens() {
  fs.writeFileSync(path.join(__dirname, 'tokens.json'), JSON.stringify(tokens));
}

function random(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

if (!fs.existsSync('cert_pub.pem') || !fs.existsSync('cert_priv.pem') || !fs.existsSync('tokens.json')) {
  console.log('Certificates/Tokens do not exist, doing first time setup.');
  const keyPair = crypto.generateKeyPairSync('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: 'pkcs1',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs1',
      format: 'pem'
    },
  });
  fs.writeFileSync(__dirname + '/cert_pub.pem', keyPair.publicKey);
  fs.writeFileSync(__dirname + '/cert_priv.pem', keyPair.privateKey);
  fs.writeFileSync(__dirname + '/tokens.json', '{}');
  tokens = {};
  firstToken = random(24);
  console.log('Please proceed to the running url and enter the following token: ' + firstToken);
} else {
  tokens = JSON.parse(fs.readFileSync(__dirname + '/tokens.json'));
  if (fs.existsSync(path.join(__dirname, 'tokens.json'))) {
    if (Object.keys(JSON.parse(fs.readFileSync(path.join(__dirname, 'tokens.json')))).length === 0) {
      console.log('Certificates/Tokens do not exist, doing first time setup.');
      tokens = {};
      firstToken = random(24);
      console.log('Please proceed to the running url and enter the following token: ' + firstToken);
    }
  }
}

const auth = express.Router();

auth.post('/api/login', (req, res) => {
  if (firstToken) {
    return res.sendStatus(400);
  }
  let user = req.body.user;
  let pass = req.body.pass;
  if (!user && !pass) {
    return res.sendStatus(401);
  }
  user = user.toString();
  pass = pass.toString();
  let account;
  tokens.accounts.forEach(acc => {
    if (user == acc.username) {
      account = acc;
    }
  });
  if (!account) {
    return res.sendStatus(401);
  }
  if (bcrypt.compareSync(pass, account.hash)) {
    const d = new Date();
    d.setTime(d.getTime() + (21 * 24 * 60 * 60 * 1000));
    return res.send(encodeJWT({
      iat: Date.now(),
      exp: d.getTime(),
      nickname: 'xtendera',
      admin: account.admin
    }));
  }
  return res.sendStatus(401);
});

auth.post('/api/firstLogin', (req, res) => {
  if (req.body.ftToken.toString() != firstToken) {
    return res.sendStatus(401);
  }
  tokens.accounts = [{
    username: req.body.user.toString(),
    hash: bcrypt.hashSync(req.body.pass.toString(), 8),
    admin: true
  }];
  firstToken = undefined;
  console.log('First time setup has been completed.');
  flushTokens();
});

export default auth;