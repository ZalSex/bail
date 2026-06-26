"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WebSocketClient = void 0;
var _ws = _interopRequireDefault(require("ws"));
var _index = require("../../Defaults/index.js");
var _types = require("./types.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
class WebSocketClient extends _types.AbstractSocketClient {
  constructor() {
    super(...arguments);
    this.socket = null;
  }
  get isOpen() {
    return this.socket?.readyState === _ws.default.OPEN;
  }
  get isClosed() {
    return this.socket === null || this.socket?.readyState === _ws.default.CLOSED;
  }
  get isClosing() {
    return this.socket === null || this.socket?.readyState === _ws.default.CLOSING;
  }
  get isConnecting() {
    return this.socket?.readyState === _ws.default.CONNECTING;
  }
  connect() {
    if (this.socket) {
      return;
    }
    this.socket = new _ws.default(this.url, {
      origin: _index.DEFAULT_ORIGIN,
      headers: this.config.options?.headers,
      handshakeTimeout: this.config.connectTimeoutMs,
      timeout: this.config.connectTimeoutMs,
      agent: this.config.agent
    });
    this.socket.setMaxListeners(0);
    const events = ['close', 'error', 'upgrade', 'message', 'open', 'ping', 'pong', 'unexpected-response'];
    for (const event of events) {
      this.socket?.on(event, (...args) => this.emit(event, ...args));
    }
  }
  async close() {
    if (!this.socket) {
      return;
    }
    const closePromise = new Promise(resolve => {
      this.socket?.once('close', resolve);
    });
    this.socket.close();
    await closePromise;
    this.socket = null;
  }
  send(str, cb) {
    this.socket?.send(str, cb);
    return Boolean(this.socket);
  }
}
//# sourceMappingURL=websocket.js.map
exports.WebSocketClient = WebSocketClient;