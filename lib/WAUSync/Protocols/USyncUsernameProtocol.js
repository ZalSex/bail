"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.USyncUsernameProtocol = void 0;
var _index = require("../../WABinary/index.js");
var _USyncUser = require("../USyncUser.js");
class USyncUsernameProtocol {
  constructor() {
    this.name = 'username';
  }
  getQueryElement() {
    return {
      tag: 'username',
      attrs: {}
    };
  }
  getUserElement(user) {
    void user;
    return null;
  }
  parser(node) {
    if (node.tag === 'username') {
      (0, _index.assertNodeErrorFree)(node);
      return typeof node.content === 'string' ? node.content : null;
    }
    return null;
  }
}
//# sourceMappingURL=USyncUsernameProtocol.js.map
exports.USyncUsernameProtocol = USyncUsernameProtocol;