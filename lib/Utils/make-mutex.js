"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeMutex = exports.makeKeyedMutex = void 0;
var _asyncMutex = require("async-mutex");
const makeMutex = () => {
  const mutex = new _asyncMutex.Mutex();
  return {
    mutex(code) {
      return mutex.runExclusive(code);
    }
  };
};
exports.makeMutex = makeMutex;
const makeKeyedMutex = () => {
  const map = new Map();
  return {
    async mutex(key, task) {
      let entry = map.get(key);
      if (!entry) {
        entry = {
          mutex: new _asyncMutex.Mutex(),
          refCount: 0
        };
        map.set(key, entry);
      }
      entry.refCount++;
      try {
        return await entry.mutex.runExclusive(task);
      } finally {
        entry.refCount--;
        // only delete it if this is still the current entry
        if (entry.refCount === 0 && map.get(key) === entry) {
          map.delete(key);
        }
      }
    }
  };
};
//# sourceMappingURL=make-mutex.js.map
exports.makeKeyedMutex = makeKeyedMutex;