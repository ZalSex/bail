"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.GroupSessionBuilder = void 0;
var keyhelper = _interopRequireWildcard(require("./keyhelper.js"));
var _senderKeyDistributionMessage = require("./sender-key-distribution-message.js");
var _senderKeyName = require("./sender-key-name.js");
var _senderKeyRecord = require("./sender-key-record.js");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
class GroupSessionBuilder {
  constructor(senderKeyStore) {
    this.senderKeyStore = senderKeyStore;
  }
  async process(senderKeyName, senderKeyDistributionMessage) {
    const senderKeyRecord = await this.senderKeyStore.loadSenderKey(senderKeyName);
    senderKeyRecord.addSenderKeyState(senderKeyDistributionMessage.getId(), senderKeyDistributionMessage.getIteration(), senderKeyDistributionMessage.getChainKey(), senderKeyDistributionMessage.getSignatureKey());
    await this.senderKeyStore.storeSenderKey(senderKeyName, senderKeyRecord);
  }
  async create(senderKeyName) {
    const senderKeyRecord = await this.senderKeyStore.loadSenderKey(senderKeyName);
    if (senderKeyRecord.isEmpty()) {
      const keyId = keyhelper.generateSenderKeyId();
      const senderKey = keyhelper.generateSenderKey();
      const signingKey = keyhelper.generateSenderSigningKey();
      senderKeyRecord.setSenderKeyState(keyId, 0, senderKey, signingKey);
      await this.senderKeyStore.storeSenderKey(senderKeyName, senderKeyRecord);
    }
    const state = senderKeyRecord.getSenderKeyState();
    if (!state) {
      throw new Error('No session state available');
    }
    return new _senderKeyDistributionMessage.SenderKeyDistributionMessage(state.getKeyId(), state.getSenderChainKey().getIteration(), state.getSenderChainKey().getSeed(), state.getSigningKeyPublic());
  }
}
//# sourceMappingURL=group-session-builder.js.map
exports.GroupSessionBuilder = GroupSessionBuilder;