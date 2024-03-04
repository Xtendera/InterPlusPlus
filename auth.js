import express from 'express'
import { decodeJWT, encodeJWT } from './utils.js'

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
}

const auth = express.Router();

export default auth;

auth.post('/api/login', (req, res) => {
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
        exp: d.getTime(),
        nickname: 'xtendera',
      }));
    }
    return res.sendStatus(401);
  });