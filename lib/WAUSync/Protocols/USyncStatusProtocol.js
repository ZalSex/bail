"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.USyncStatusProtocol = void 0;
var _index = require("../../WABinary/index.js");
class USyncStatusProtocol {
  constructor() {
    this.name = 'status';
  }
  getQueryElement() {
    return {
      tag: 'status',
      attrs: {}
    };
  }
  getUserElement() {
    return null;
  }
  parser(node) {
    if (node.tag === 'status') {
      (0, _index.assertNodeErrorFree)(node);
      let status = node?.content?.toString() ?? null;
      const setAt = new Date(+(node?.attrs.t || 0) * 1000);
      if (!status) {
        if (node.attrs?.code && +node.attrs.code === 401) {
          status = '';
        } else {
          status = null;
        }
      } else if (typeof status === 'string' && status.length === 0) {
        status = null;
      }
      return {
        status,
        setAt
      };
    }
  }
}
//# sourceMappingURL=USyncStatusProtocol.js.map
exports.USyncStatusProtocol = USyncStatusProtocol;