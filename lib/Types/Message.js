"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WAMessageStubType = exports.WAMessageStatus = exports.WAMessageAddressingMode = void 0;
Object.defineProperty(exports, "WAProto", {
  enumerable: true,
  get: function () {
    return _index.proto;
  }
});
var _index = require("../../WAProto/index.js");
// export the WAMessage Prototypes

const WAMessageStubType = exports.WAMessageStubType = _index.proto.WebMessageInfo.StubType;
const WAMessageStatus = exports.WAMessageStatus = _index.proto.WebMessageInfo.Status;
var WAMessageAddressingMode;
(function (WAMessageAddressingMode) {
  WAMessageAddressingMode["PN"] = "pn";
  WAMessageAddressingMode["LID"] = "lid";
})(WAMessageAddressingMode || (exports.WAMessageAddressingMode = WAMessageAddressingMode = {}));
//# sourceMappingURL=Message.js.map