"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SenderChainKey = void 0;
var _crypto = require("libsignal/src/crypto.js");
var _senderMessageKey = require("./sender-message-key.js");
class SenderChainKey {
  constructor(iteration, chainKey) {
    this.MESSAGE_KEY_SEED = Buffer.from([0x01]);
    this.CHAIN_KEY_SEED = Buffer.from([0x02]);
    this.iteration = iteration;
    this.chainKey = Buffer.from(chainKey);
  }
  getIteration() {
    return this.iteration;
  }
  getSenderMessageKey() {
    return new _senderMessageKey.SenderMessageKey(this.iteration, this.getDerivative(this.MESSAGE_KEY_SEED, this.chainKey));
  }
  getNext() {
    return new SenderChainKey(this.iteration + 1, this.getDerivative(this.CHAIN_KEY_SEED, this.chainKey));
  }
  getSeed() {
    return this.chainKey;
  }
  getDerivative(seed, key) {
    return (0, _crypto.calculateMAC)(key, seed);
  }
}
//# sourceMappingURL=sender-chain-key.js.map
exports.SenderChainKey = SenderChainKey;