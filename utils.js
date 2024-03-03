import fs from 'node:fs'
import crypto from 'node:crypto'
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!fs.existsSync('cert_pub.pem') || !fs.existsSync('cert_priv.pem')) {
    console.log('Certificates do not exist, doing first time setup.');
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
}
const privateKey = fs.readFileSync('cert_priv.pem', 'utf8');
const publicKey = fs.readFileSync('cert_pub.pem', 'utf8');

export function decodeJWT(token) {
    const jwtSplit = token.split('.');
    const jwtVerif = jwtSplit[0] + '.' + jwtSplit[1];
    if (!crypto.verify('SHA256', jwtVerif, publicKey, Buffer.from(jwtSplit[2], 'base64url'))) {
        return undefined;
    }
    return JSON.parse(Buffer.from(jwtSplit[1], 'base64url'));
}

export function encodeJWT(data) {
    let jwtString = Buffer.from('{ "alg": "RS512", "typ": "JWT" }', 'utf8').toString('base64url') + '.';
    jwtString += Buffer.from(JSON.stringify(data), 'utf8').toString('base64url');
    jwtString += '.' + crypto.sign('SHA256', Buffer.from(jwtString), privateKey).toString('base64url');
    return jwtString;
}