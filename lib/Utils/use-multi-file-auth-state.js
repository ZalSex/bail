"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useMultiFileAuthState = void 0;
var _asyncMutex = require("async-mutex");
var _promises = require("fs/promises");
var _path = require("path");
var _index = require("../../WAProto/index.js");
var _authUtils = require("./auth-utils.js");
var _generics = require("./generics.js");
// We need to lock files due to the fact that we are using async functions to read and write files
// https://github.com/WhiskeySockets/Baileys/issues/794
// https://github.com/nodejs/node/issues/26338
// Use a Map to store mutexes for each file path
const fileLocks = new Map();
// Get or create a mutex for a specific file path
const getFileLock = path => {
  let mutex = fileLocks.get(path);
  if (!mutex) {
    mutex = new _asyncMutex.Mutex();
    fileLocks.set(path, mutex);
  }
  return mutex;
};
/**
 * stores the full authentication state in a single folder.
 * Far more efficient than singlefileauthstate
 *
 * Again, I wouldn't endorse this for any production level use other than perhaps a bot.
 * Would recommend writing an auth state for use with a proper SQL or No-SQL DB
 * */
const useMultiFileAuthState = async folder => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const writeData = async (data, file) => {
    const filePath = (0, _path.join)(folder, fixFileName(file));
    const mutex = getFileLock(filePath);
    return mutex.acquire().then(async release => {
      try {
        await (0, _promises.writeFile)(filePath, JSON.stringify(data, _generics.BufferJSON.replacer));
      } finally {
        release();
      }
    });
  };
  const readData = async file => {
    try {
      const filePath = (0, _path.join)(folder, fixFileName(file));
      const mutex = getFileLock(filePath);
      return await mutex.acquire().then(async release => {
        try {
          const data = await (0, _promises.readFile)(filePath, {
            encoding: 'utf-8'
          });
          return JSON.parse(data, _generics.BufferJSON.reviver);
        } finally {
          release();
        }
      });
    } catch (error) {
      return null;
    }
  };
  const removeData = async file => {
    try {
      const filePath = (0, _path.join)(folder, fixFileName(file));
      const mutex = getFileLock(filePath);
      return mutex.acquire().then(async release => {
        try {
          await (0, _promises.unlink)(filePath);
        } catch {} finally {
          release();
        }
      });
    } catch {}
  };
  const folderInfo = await (0, _promises.stat)(folder).catch(() => {});
  if (folderInfo) {
    if (!folderInfo.isDirectory()) {
      throw new Error(`found something that is not a directory at ${folder}, either delete it or specify a different location`);
    }
  } else {
    await (0, _promises.mkdir)(folder, {
      recursive: true
    });
  }
  const fixFileName = file => file?.replace(/\//g, '__')?.replace(/:/g, '-');
  const creds = (await readData('creds.json')) || (0, _authUtils.initAuthCreds)();
  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data = {};
          await Promise.all(ids.map(async id => {
            let value = await readData(`${type}-${id}.json`);
            if (type === 'app-state-sync-key' && value) {
              value = _index.proto.Message.AppStateSyncKeyData.fromObject(value);
            }
            data[id] = value;
          }));
          return data;
        },
        set: async data => {
          const tasks = [];
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              const file = `${category}-${id}.json`;
              tasks.push(value ? writeData(value, file) : removeData(file));
            }
          }
          await Promise.all(tasks);
        }
      }
    },
    saveCreds: async () => {
      return writeData(creds, 'creds.json');
    }
  };
};
//# sourceMappingURL=use-multi-file-auth-state.js.map
exports.useMultiFileAuthState = useMultiFileAuthState;