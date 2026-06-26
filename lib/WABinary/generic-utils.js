"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.assertNodeErrorFree = void 0;
exports.binaryNodeToString = binaryNodeToString;
exports.reduceBinaryNodeToDictionary = exports.getBinaryNodeMessages = exports.getBinaryNodeChildren = exports.getBinaryNodeChildUInt = exports.getBinaryNodeChildString = exports.getBinaryNodeChildBuffer = exports.getBinaryNodeChild = exports.getAllBinaryNodeChildren = void 0;
var _boom = require("@hapi/boom");
var _index = require("../../WAProto/index.js");
require("./types.js");
// some extra useful utilities
const indexCache = new WeakMap();
const getBinaryNodeChildren = (node, childTag) => {
  if (!node || !Array.isArray(node.content)) return [];
  let index = indexCache.get(node);
  // Build the index once per node
  if (!index) {
    index = new Map();
    for (const child of node.content) {
      let arr = index.get(child.tag);
      if (!arr) index.set(child.tag, arr = []);
      arr.push(child);
    }
    indexCache.set(node, index);
  }
  // Return first matching child
  return index.get(childTag) || [];
};
exports.getBinaryNodeChildren = getBinaryNodeChildren;
const getBinaryNodeChild = (node, childTag) => {
  return getBinaryNodeChildren(node, childTag)[0];
};
exports.getBinaryNodeChild = getBinaryNodeChild;
const getAllBinaryNodeChildren = ({
  content
}) => {
  if (Array.isArray(content)) {
    return content;
  }
  return [];
};
exports.getAllBinaryNodeChildren = getAllBinaryNodeChildren;
const getBinaryNodeChildBuffer = (node, childTag) => {
  const child = getBinaryNodeChild(node, childTag)?.content;
  if (Buffer.isBuffer(child) || child instanceof Uint8Array) {
    return child;
  }
};
exports.getBinaryNodeChildBuffer = getBinaryNodeChildBuffer;
const getBinaryNodeChildString = (node, childTag) => {
  const child = getBinaryNodeChild(node, childTag)?.content;
  if (Buffer.isBuffer(child) || child instanceof Uint8Array) {
    return Buffer.from(child).toString('utf-8');
  } else if (typeof child === 'string') {
    return child;
  }
};
exports.getBinaryNodeChildString = getBinaryNodeChildString;
const getBinaryNodeChildUInt = (node, childTag, length) => {
  const buff = getBinaryNodeChildBuffer(node, childTag);
  if (buff) {
    return bufferToUInt(buff, length);
  }
};
exports.getBinaryNodeChildUInt = getBinaryNodeChildUInt;
const assertNodeErrorFree = node => {
  const errNode = getBinaryNodeChild(node, 'error');
  if (errNode) {
    throw new _boom.Boom(errNode.attrs.text || 'Unknown error', {
      data: +errNode.attrs.code
    });
  }
};
exports.assertNodeErrorFree = assertNodeErrorFree;
const reduceBinaryNodeToDictionary = (node, tag) => {
  const nodes = getBinaryNodeChildren(node, tag);
  const dict = nodes.reduce((dict, {
    attrs
  }) => {
    if (typeof attrs.name === 'string') {
      dict[attrs.name] = attrs.value || attrs.config_value;
    } else {
      dict[attrs.config_code] = attrs.value || attrs.config_value;
    }
    return dict;
  }, {});
  return dict;
};
exports.reduceBinaryNodeToDictionary = reduceBinaryNodeToDictionary;
const getBinaryNodeMessages = ({
  content
}) => {
  const msgs = [];
  if (Array.isArray(content)) {
    for (const item of content) {
      if (item.tag === 'message') {
        msgs.push(_index.proto.WebMessageInfo.decode(item.content).toJSON());
      }
    }
  }
  return msgs;
};
exports.getBinaryNodeMessages = getBinaryNodeMessages;
function bufferToUInt(e, t) {
  let a = 0;
  for (let i = 0; i < t; i++) {
    a = 256 * a + e[i];
  }
  return a;
}
const tabs = n => '\t'.repeat(n);
function binaryNodeToString(node, i = 0) {
  if (!node) {
    return node;
  }
  if (typeof node === 'string') {
    return tabs(i) + node;
  }
  if (node instanceof Uint8Array) {
    return tabs(i) + Buffer.from(node).toString('hex');
  }
  if (Array.isArray(node)) {
    return node.map(x => tabs(i + 1) + binaryNodeToString(x, i + 1)).join('\n');
  }
  const children = binaryNodeToString(node.content, i + 1);
  const tag = `<${node.tag} ${Object.entries(node.attrs || {}).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}='${v}'`).join(' ')}`;
  const content = children ? `>\n${children}\n${tabs(i)}</${node.tag}>` : '/>';
  return tag + content;
}
//# sourceMappingURL=generic-utils.js.map