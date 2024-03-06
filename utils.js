import fs from 'node:fs'
import crypto from 'node:crypto'
import path from 'path'
import bcrypt from 'bcrypt'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function decodeJWT(token) {
    const publicKey = fs.readFileSync('cert_pub.pem', 'utf8');
    const jwtSplit = token.split('.');
    const jwtVerif = jwtSplit[0] + '.' + jwtSplit[1];
    if (!crypto.verify('SHA256', jwtVerif, publicKey, Buffer.from(jwtSplit[2], 'base64url'))) {
        return undefined;
    }
    return JSON.parse(Buffer.from(jwtSplit[1], 'base64url'));
}

export function encodeJWT(data) {
    const privateKey = fs.readFileSync('cert_priv.pem', 'utf8');
    let jwtString = Buffer.from('{ "alg": "RS256", "typ": "JWT" }', 'utf8').toString('base64url') + '.';
    jwtString += Buffer.from(JSON.stringify(data), 'utf8').toString('base64url');
    jwtString += '.' + crypto.sign('SHA256', Buffer.from(jwtString), privateKey).toString('base64url');
    return jwtString;
}