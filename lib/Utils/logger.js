"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _pino = _interopRequireDefault(require("pino"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
var _default = exports.default = (0, _pino.default)({
  timestamp: () => `,"time":"${new Date().toJSON()}"`
}); //# sourceMappingURL=logger.js.map