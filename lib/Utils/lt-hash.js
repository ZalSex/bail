"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LT_HASH_ANTI_TAMPERING = void 0;

/**
 * Pure JS LTHashAntiTampering — replaces whatsapp-rust-bridge
 * LT Hash is a summation-based hash algorithm that maintains integrity
 * over a series of add/remove mutations.
 */
class LTHashAntiTampering {
  constructor() {
    this.HASH_SIZE = 128;
  }

  add(hash, data) {
    const result = Buffer.from(hash);
    const dataHash = this._hashData(data);
    for (let i = 0; i < this.HASH_SIZE; i++) {
      result[i] = (result[i] + dataHash[i % dataHash.length]) & 0xff;
    }
    return result;
  }

  subtract(hash, data) {
    const result = Buffer.from(hash);
    const dataHash = this._hashData(data);
    for (let i = 0; i < this.HASH_SIZE; i++) {
      result[i] = (result[i] - dataHash[i % dataHash.length] + 256) & 0xff;
    }
    return result;
  }

  _hashData(data) {
    const crypto = require("crypto");
    return crypto.createHash("sha512").update(data).digest();
  }
}

const LT_HASH_ANTI_TAMPERING = exports.LT_HASH_ANTI_TAMPERING = new LTHashAntiTampering();
//# sourceMappingURL=lt-hash.js.map
