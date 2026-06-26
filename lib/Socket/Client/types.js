"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AbstractSocketClient = void 0;
var _events = require("events");
var _url = require("url");
class AbstractSocketClient extends _events.EventEmitter {
  constructor(url, config) {
    super();
    this.url = url;
    this.config = config;
    this.setMaxListeners(0);
  }
}
//# sourceMappingURL=types.js.map
exports.AbstractSocketClient = AbstractSocketClient;