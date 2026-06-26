"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  DisconnectReason: true
};
exports.DisconnectReason = void 0;
var _Auth = require("./Auth.js");
Object.keys(_Auth).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _Auth[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _Auth[key];
    }
  });
});
var _GroupMetadata = require("./GroupMetadata.js");
Object.keys(_GroupMetadata).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _GroupMetadata[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _GroupMetadata[key];
    }
  });
});
var _Chat = require("./Chat.js");
Object.keys(_Chat).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _Chat[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _Chat[key];
    }
  });
});
var _Contact = require("./Contact.js");
Object.keys(_Contact).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _Contact[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _Contact[key];
    }
  });
});
var _State = require("./State.js");
Object.keys(_State).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _State[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _State[key];
    }
  });
});
var _Message = require("./Message.js");
Object.keys(_Message).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _Message[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _Message[key];
    }
  });
});
var _Socket = require("./Socket.js");
Object.keys(_Socket).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _Socket[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _Socket[key];
    }
  });
});
var _Events = require("./Events.js");
Object.keys(_Events).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _Events[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _Events[key];
    }
  });
});
var _Product = require("./Product.js");
Object.keys(_Product).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _Product[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _Product[key];
    }
  });
});
var _Call = require("./Call.js");
Object.keys(_Call).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _Call[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _Call[key];
    }
  });
});
var _Signal = require("./Signal.js");
Object.keys(_Signal).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _Signal[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _Signal[key];
    }
  });
});
var _Mex = require("./Mex.js");
Object.keys(_Mex).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _Mex[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _Mex[key];
    }
  });
});
var DisconnectReason;
(function (DisconnectReason) {
  DisconnectReason[DisconnectReason["connectionClosed"] = 428] = "connectionClosed";
  DisconnectReason[DisconnectReason["connectionLost"] = 408] = "connectionLost";
  DisconnectReason[DisconnectReason["connectionReplaced"] = 440] = "connectionReplaced";
  DisconnectReason[DisconnectReason["timedOut"] = 408] = "timedOut";
  DisconnectReason[DisconnectReason["loggedOut"] = 401] = "loggedOut";
  DisconnectReason[DisconnectReason["badSession"] = 500] = "badSession";
  DisconnectReason[DisconnectReason["restartRequired"] = 515] = "restartRequired";
  DisconnectReason[DisconnectReason["multideviceMismatch"] = 411] = "multideviceMismatch";
  DisconnectReason[DisconnectReason["forbidden"] = 403] = "forbidden";
  DisconnectReason[DisconnectReason["unavailableService"] = 503] = "unavailableService";
})(DisconnectReason || (exports.DisconnectReason = DisconnectReason = {}));
//# sourceMappingURL=index.js.map