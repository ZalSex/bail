"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _encode = require("./encode.js");
Object.keys(_encode).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _encode[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _encode[key];
    }
  });
});
var _decode = require("./decode.js");
Object.keys(_decode).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _decode[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _decode[key];
    }
  });
});
var _genericUtils = require("./generic-utils.js");
Object.keys(_genericUtils).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _genericUtils[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _genericUtils[key];
    }
  });
});
var _jidUtils = require("./jid-utils.js");
Object.keys(_jidUtils).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _jidUtils[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _jidUtils[key];
    }
  });
});
var _types = require("./types.js");
Object.keys(_types).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _types[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _types[key];
    }
  });
});