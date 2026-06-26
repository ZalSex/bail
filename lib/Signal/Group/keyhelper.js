"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.generateSenderKey = generateSenderKey;
exports.generateSenderKeyId = generateSenderKeyId;
exports.generateSenderSigningKey = generateSenderSigningKey;
var nodeCrypto = _interopRequireWildcard(require("crypto"));
var _curve = require("libsignal/src/curve.js");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function generateSenderKey() {
  return nodeCrypto.randomBytes(32);
}
function generateSenderKeyId() {
  return nodeCrypto.randomInt(2147483647);
}
function generateSenderSigningKey(key) {
  if (!key) {
    key = (0, _curve.generateKeyPair)();
  }
  return {
    public: Buffer.from(key.pubKey),
    private: Buffer.from(key.privKey)
  };
}
//# sourceMappingURL=keyhelper.js.map