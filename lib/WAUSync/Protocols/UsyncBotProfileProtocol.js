"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.USyncBotProfileProtocol = void 0;
var _index = require("../../WABinary/index.js");
var _USyncUser = require("../USyncUser.js");
class USyncBotProfileProtocol {
  constructor() {
    this.name = 'bot';
  }
  getQueryElement() {
    return {
      tag: 'bot',
      attrs: {},
      content: [{
        tag: 'profile',
        attrs: {
          v: '1'
        }
      }]
    };
  }
  getUserElement(user) {
    return {
      tag: 'bot',
      attrs: {},
      content: [{
        tag: 'profile',
        attrs: {
          persona_id: user.personaId
        }
      }]
    };
  }
  parser(node) {
    const botNode = (0, _index.getBinaryNodeChild)(node, 'bot');
    const profile = (0, _index.getBinaryNodeChild)(botNode, 'profile');
    const commandsNode = (0, _index.getBinaryNodeChild)(profile, 'commands');
    const promptsNode = (0, _index.getBinaryNodeChild)(profile, 'prompts');
    const commands = [];
    const prompts = [];
    for (const command of (0, _index.getBinaryNodeChildren)(commandsNode, 'command')) {
      commands.push({
        name: (0, _index.getBinaryNodeChildString)(command, 'name'),
        description: (0, _index.getBinaryNodeChildString)(command, 'description')
      });
    }
    for (const prompt of (0, _index.getBinaryNodeChildren)(promptsNode, 'prompt')) {
      prompts.push(`${(0, _index.getBinaryNodeChildString)(prompt, 'emoji')} ${(0, _index.getBinaryNodeChildString)(prompt, 'text')}`);
    }
    return {
      isDefault: !!(0, _index.getBinaryNodeChild)(profile, 'default'),
      jid: node.attrs.jid,
      name: (0, _index.getBinaryNodeChildString)(profile, 'name'),
      attributes: (0, _index.getBinaryNodeChildString)(profile, 'attributes'),
      description: (0, _index.getBinaryNodeChildString)(profile, 'description'),
      category: (0, _index.getBinaryNodeChildString)(profile, 'category'),
      personaId: profile.attrs['persona_id'],
      commandsDescription: (0, _index.getBinaryNodeChildString)(commandsNode, 'description'),
      commands,
      prompts
    };
  }
}
//# sourceMappingURL=UsyncBotProfileProtocol.js.map
exports.USyncBotProfileProtocol = USyncBotProfileProtocol;