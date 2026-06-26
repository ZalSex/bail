"use strict";
console.log(`
⠀⠀⢀⣠⣶⣾⣿⣿⣿⣶⣦⣀⠀⠀⠀⠀⠀⠀⠀⠀⠴⠚⠛⠛⠳⢶⣄⡀⠀⠀
⠀⣠⣿⡿⠛⠉⠁⠀⠉⠙⠻⣿⣷⡀⠀⠀⣠⣴⡶⠀⠀⠀⠀⠀⠀⠀⠙⢿⣄⠀
⢰⣿⡟⠀⠀⠀⠀⠀⠀⠀⠀⠈⢿⣿⡄⣸⣿⣿⠇⠀⠀⠀⠀⠀⠀⠀⠀⠈⣿⡆
⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠻⣽⣿⠏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣷
⣿⣿⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⢯⣦⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣾⡟
⠸⣿⣧⡀⠀⠀⠀⠀⠀⠀⠀⢠⣾⣿⠃⠙⣿⣷⡄⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⠃
⠀⠙⢿⣿⣦⣀⣀⢀⣀⣠⣶⣿⠟⠁⠀⠀⠈⠻⣿⣶⣄⣀⡀⢀⣀⣤⣾⡿⠃⠀
⠀⠀⠀⠙⠻⠿⠿⠿⠿⠿⠛⠁⠀⠀⠀⠀⠀⠀⠈⠛⠿⢿⣿⣿⠿⠟⠉⠀⠀⠀

  Author  : @ZalRyuichi
  Versi   : 7.0.0-rc13
`);

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  makeWASocket: true
};
exports.default = void 0;
Object.defineProperty(exports, "makeWASocket", {
  enumerable: true,
  get: function () {
    return _index.default;
  }
});
var _index = _interopRequireDefault(require("./Socket/index.js"));
var _index2 = require("../WAProto/index.js");
Object.keys(_index2).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _index2[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _index2[key];
    }
  });
});
var _index3 = require("./Utils/index.js");
Object.keys(_index3).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _index3[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _index3[key];
    }
  });
});
var _index4 = require("./Types/index.js");
Object.keys(_index4).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _index4[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _index4[key];
    }
  });
});
var _index5 = require("./Defaults/index.js");
Object.keys(_index5).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _index5[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _index5[key];
    }
  });
});
var _index6 = require("./WABinary/index.js");
Object.keys(_index6).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _index6[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _index6[key];
    }
  });
});
var _index7 = require("./WAM/index.js");
Object.keys(_index7).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _index7[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _index7[key];
    }
  });
});
var _index8 = require("./WAUSync/index.js");
Object.keys(_index8).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _index8[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _index8[key];
    }
  });
});
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
var _default = exports.default = _index.default; //# sourceMappingURL=index.js.map