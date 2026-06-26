Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;
var _index = require("../Defaults/index.js");
var _communities = require("./communities.js");
const makeWASocket = a => (0, _communities.makeCommunitiesSocket)({
  ..._index.DEFAULT_CONNECTION_CONFIG,
  ...a
});
var _default = exports.default = makeWASocket;