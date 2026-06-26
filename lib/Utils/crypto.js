"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Curve = void 0;
exports.aesDecrypt = aesDecrypt;
exports.aesDecryptCTR = aesDecryptCTR;
exports.aesDecryptGCM = aesDecryptGCM;
exports.aesDecryptWithIV = aesDecryptWithIV;
exports.aesEncrypWithIV = aesEncrypWithIV;
exports.aesEncrypt = aesEncrypt;
exports.aesEncryptCTR = aesEncryptCTR;
exports.aesEncryptGCM = aesEncryptGCM;
exports.derivePairingCodeKey = derivePairingCodeKey;
exports.generateSignalPubKey = void 0;
exports.hkdf = hkdf;
exports.hmacSign = hmacSign;
exports.md5 = md5;
exports.sha256 = sha256;
exports.signedKeyPair = void 0;
var _crypto = require("crypto");
var curve = _interopRequireWildcard(require("libsignal/src/curve.js"));
var _index = require("../Defaults/index.js");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }

// Native HKDF implementation replacing whatsapp-rust-bridge
function hkdf(ikm, length, { salt, info } = {}) {
  const saltKey = salt
    ? (0, _crypto.createHmac)('sha256', salt).update(ikm).digest()
    : (0, _crypto.createHmac)('sha256', Buffer.alloc(32)).update(ikm).digest();
  const infoBuffer = info ? Buffer.from(info) : Buffer.alloc(0);
  const blocks = Math.ceil(length / 32);
  let prev = Buffer.alloc(0);
  const output = [];
  for (let i = 0; i < blocks; i++) {
    prev = (0, _crypto.createHmac)('sha256', saltKey)
      .update(Buffer.concat([prev, infoBuffer, Buffer.from([i + 1])]))
      .digest();
    output.push(prev);
  }
  return Buffer.concat(output).subarray(0, length);
}

// Native MD5 implementation replacing whatsapp-rust-bridge
function md5(buffer) {
  return (0, _crypto.createHash)('md5').update(buffer).digest();
}

const { subtle } = globalThis.crypto;

const generateSignalPubKey = pubKey => pubKey.length === 33 ? pubKey : Buffer.concat([_index.KEY_BUNDLE_TYPE, pubKey]);
exports.generateSignalPubKey = generateSignalPubKey;
const Curve = exports.Curve = {
  generateKeyPair: () => {
    const { pubKey, privKey } = curve.generateKeyPair();
    return {
      private: Buffer.from(privKey),
      public: Buffer.from(pubKey.slice(1))
    };
  },
  sharedKey: (privateKey, publicKey) => {
    const shared = curve.calculateAgreement(generateSignalPubKey(publicKey), privateKey);
    return Buffer.from(shared);
  },
  sign: (privateKey, buf) => curve.calculateSignature(privateKey, buf),
  verify: (pubKey, message, signature) => {
    try {
      curve.verifySignature(generateSignalPubKey(pubKey), message, signature);
      return true;
    } catch (error) {
      return false;
    }
  }
};
const signedKeyPair = (identityKeyPair, keyId) => {
  const preKey = Curve.generateKeyPair();
  const pubKey = generateSignalPubKey(preKey.public);
  const signature = Curve.sign(identityKeyPair.private, pubKey);
  return { keyPair: preKey, signature, keyId };
};
exports.signedKeyPair = signedKeyPair;
const GCM_TAG_LENGTH = 128 >> 3;
function aesEncryptGCM(plaintext, key, iv, additionalData) {
  const cipher = (0, _crypto.createCipheriv)('aes-256-gcm', key, iv);
  cipher.setAAD(additionalData);
  return Buffer.concat([cipher.update(plaintext), cipher.final(), cipher.getAuthTag()]);
}
function aesDecryptGCM(ciphertext, key, iv, additionalData) {
  const decipher = (0, _crypto.createDecipheriv)('aes-256-gcm', key, iv);
  const enc = ciphertext.slice(0, ciphertext.length - GCM_TAG_LENGTH);
  const tag = ciphertext.slice(ciphertext.length - GCM_TAG_LENGTH);
  decipher.setAAD(additionalData);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]);
}
function aesEncryptCTR(plaintext, key, iv) {
  const cipher = (0, _crypto.createCipheriv)('aes-256-ctr', key, iv);
  return Buffer.concat([cipher.update(plaintext), cipher.final()]);
}
function aesDecryptCTR(ciphertext, key, iv) {
  const decipher = (0, _crypto.createDecipheriv)('aes-256-ctr', key, iv);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}
function aesDecrypt(buffer, key) {
  return aesDecryptWithIV(buffer.subarray(16), key, buffer.subarray(0, 16));
}
function aesDecryptWithIV(buffer, key, IV) {
  const aes = (0, _crypto.createDecipheriv)('aes-256-cbc', key, IV);
  return Buffer.concat([aes.update(buffer), aes.final()]);
}
function aesEncrypt(buffer, key) {
  const IV = (0, _crypto.randomBytes)(16);
  const aes = (0, _crypto.createCipheriv)('aes-256-cbc', key, IV);
  return Buffer.concat([IV, aes.update(buffer), aes.final()]);
}
function aesEncrypWithIV(buffer, key, IV) {
  const aes = (0, _crypto.createCipheriv)('aes-256-cbc', key, IV);
  return Buffer.concat([aes.update(buffer), aes.final()]);
}
function hmacSign(buffer, key, variant = 'sha256') {
  return (0, _crypto.createHmac)(variant, key).update(buffer).digest();
}
function sha256(buffer) {
  return (0, _crypto.createHash)('sha256').update(buffer).digest();
}
async function derivePairingCodeKey(pairingCode, salt) {
  const encoder = new TextEncoder();
  const pairingCodeBuffer = encoder.encode(pairingCode);
  const saltBuffer = new Uint8Array(salt instanceof Uint8Array ? salt : new Uint8Array(salt));
  const keyMaterial = await subtle.importKey('raw', pairingCodeBuffer, { name: 'PBKDF2' }, false, ['deriveBits']);
  const derivedBits = await subtle.deriveBits({
    name: 'PBKDF2',
    salt: saltBuffer,
    iterations: 2 << 16,
    hash: 'SHA-256'
  }, keyMaterial, 32 * 8);
  return Buffer.from(derivedBits);
}
//# sourceMappingURL=crypto.js.map
