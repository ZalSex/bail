"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.USyncQuery = void 0;
var _index = require("../WABinary/index.js");
var _UsyncBotProfileProtocol = require("./Protocols/UsyncBotProfileProtocol.js");
var _UsyncLIDProtocol = require("./Protocols/UsyncLIDProtocol.js");
var _index2 = require("./Protocols/index.js");
var _USyncUser = require("./USyncUser.js");
class USyncQuery {
  constructor() {
    this.protocols = [];
    this.users = [];
    this.context = 'interactive';
    this.mode = 'query';
  }
  withMode(mode) {
    this.mode = mode;
    return this;
  }
  withContext(context) {
    this.context = context;
    return this;
  }
  withUser(user) {
    this.users.push(user);
    return this;
  }
  parseUSyncQueryResult(result) {
    if (result?.attrs.type !== 'result') {
      return;
    }
    const protocolMap = Object.fromEntries(this.protocols.map(protocol => {
      return [protocol.name, protocol.parser];
    }));
    const queryResult = {
      // TODO: implement errors etc.
      list: [],
      sideList: []
    };
    const usyncNode = (0, _index.getBinaryNodeChild)(result, 'usync');
    //TODO: implement error backoff, refresh etc.
    //TODO: see if there are any errors in the result node
    //const resultNode = getBinaryNodeChild(usyncNode, 'result')
    const listNode = usyncNode ? (0, _index.getBinaryNodeChild)(usyncNode, 'list') : undefined;
    if (listNode?.content && Array.isArray(listNode.content)) {
      queryResult.list = listNode.content.reduce((acc, node) => {
        const id = node?.attrs.jid;
        if (id) {
          const data = Array.isArray(node?.content) ? Object.fromEntries(node.content.map(content => {
            const protocol = content.tag;
            const parser = protocolMap[protocol];
            if (parser) {
              return [protocol, parser(content)];
            } else {
              return [protocol, null];
            }
          }).filter(([, b]) => b !== null)) : {};
          acc.push({
            ...data,
            id
          });
        }
        return acc;
      }, []);
    }
    //TODO: implement side list
    //const sideListNode = getBinaryNodeChild(usyncNode, 'side_list')
    return queryResult;
  }
  withDeviceProtocol() {
    this.protocols.push(new _index2.USyncDeviceProtocol());
    return this;
  }
  withContactProtocol() {
    this.protocols.push(new _index2.USyncContactProtocol());
    return this;
  }
  withStatusProtocol() {
    this.protocols.push(new _index2.USyncStatusProtocol());
    return this;
  }
  withDisappearingModeProtocol() {
    this.protocols.push(new _index2.USyncDisappearingModeProtocol());
    return this;
  }
  withBotProfileProtocol() {
    this.protocols.push(new _UsyncBotProfileProtocol.USyncBotProfileProtocol());
    return this;
  }
  withLIDProtocol() {
    this.protocols.push(new _UsyncLIDProtocol.USyncLIDProtocol());
    return this;
  }
  withUsernameProtocol() {
    this.protocols.push(new _index2.USyncUsernameProtocol());
    return this;
  }
}
//# sourceMappingURL=USyncQuery.js.map
exports.USyncQuery = USyncQuery;