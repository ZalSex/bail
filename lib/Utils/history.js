"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.processHistoryMessage = exports.getHistoryMsg = exports.downloadHistory = exports.downloadAndProcessHistorySyncNotification = void 0;
var _promises = require("stream/promises");
var _util = require("util");
var _zlib = require("zlib");
var _index = require("../../WAProto/index.js");
var _index2 = require("../Types/index.js");
var _index3 = require("../WABinary/index.js");
var _generics = require("./generics.js");
var _messages = require("./messages.js");
var _messagesMedia = require("./messages-media.js");
const inflatePromise = (0, _util.promisify)(_zlib.inflate);
const extractPnFromMessages = messages => {
  for (const msgItem of messages) {
    const message = msgItem.message;
    // Only extract from outgoing messages (fromMe: true) in 1:1 chats
    // because userReceipt.userJid is the recipient's JID
    if (!message?.key?.fromMe || !message.userReceipt?.length) {
      continue;
    }
    const userJid = message.userReceipt[0]?.userJid;
    if (userJid && ((0, _index3.isPnUser)(userJid) || (0, _index3.isHostedPnUser)(userJid))) {
      return userJid;
    }
  }
  return undefined;
};
const downloadHistory = async (msg, options) => {
  const stream = await (0, _messagesMedia.downloadContentFromMessage)(msg, 'md-msg-hist', {
    options
  });
  // Pipe decrypted stream directly through zlib inflate
  // This avoids allocating an intermediate buffer for the compressed data
  const inflater = (0, _zlib.createInflate)();
  const chunks = [];
  inflater.on('data', chunk => chunks.push(chunk));
  await (0, _promises.pipeline)(stream, inflater);
  const buffer = Buffer.concat(chunks);
  const syncData = _index.proto.HistorySync.decode(buffer);
  return syncData;
};
exports.downloadHistory = downloadHistory;
const processHistoryMessage = (item, logger) => {
  const messages = [];
  const contacts = [];
  const chats = [];
  const lidPnMappings = [];
  logger?.trace({
    progress: item.progress
  }, 'processing history of type ' + item.syncType?.toString());
  // Extract LID-PN mappings for all sync types
  for (const m of item.phoneNumberToLidMappings || []) {
    if (m.lidJid && m.pnJid) {
      lidPnMappings.push({
        lid: m.lidJid,
        pn: m.pnJid
      });
    }
  }
  switch (item.syncType) {
    case _index.proto.HistorySync.HistorySyncType.INITIAL_BOOTSTRAP:
    case _index.proto.HistorySync.HistorySyncType.RECENT:
    case _index.proto.HistorySync.HistorySyncType.FULL:
    case _index.proto.HistorySync.HistorySyncType.ON_DEMAND:
      for (const chat of item.conversations) {
        contacts.push({
          id: chat.id,
          name: chat.displayName || chat.name || chat.username || undefined,
          username: chat.username || undefined,
          lid: chat.lidJid || chat.accountLid || undefined,
          phoneNumber: chat.pnJid || undefined
        });
        const chatId = chat.id;
        const isLid = (0, _index3.isLidUser)(chatId) || (0, _index3.isHostedLidUser)(chatId);
        const isPn = (0, _index3.isPnUser)(chatId) || (0, _index3.isHostedPnUser)(chatId);
        if (isLid && chat.pnJid) {
          lidPnMappings.push({
            lid: chatId,
            pn: chat.pnJid
          });
        } else if (isPn && chat.lidJid) {
          lidPnMappings.push({
            lid: chat.lidJid,
            pn: chatId
          });
        } else if (isLid && !chat.pnJid) {
          // Fallback: extract PN from userReceipt in messages when pnJid is missing
          const pnFromReceipt = extractPnFromMessages(chat.messages || []);
          if (pnFromReceipt) {
            lidPnMappings.push({
              lid: chatId,
              pn: pnFromReceipt
            });
          }
        }
        const msgs = chat.messages || [];
        delete chat.messages;
        for (const item of msgs) {
          const message = item.message;
          messages.push(message);
          if (!chat.messages?.length) {
            // keep only the most recent message in the chat array
            chat.messages = [{
              message
            }];
          }
          if (!message.key.fromMe && !chat.lastMessageRecvTimestamp) {
            chat.lastMessageRecvTimestamp = (0, _generics.toNumber)(message.messageTimestamp);
          }
          if ((message.messageStubType === _index2.WAMessageStubType.BIZ_PRIVACY_MODE_TO_BSP || message.messageStubType === _index2.WAMessageStubType.BIZ_PRIVACY_MODE_TO_FB) && message.messageStubParameters?.[0]) {
            contacts.push({
              id: message.key.participant || message.key.remoteJid,
              verifiedName: message.messageStubParameters?.[0]
            });
          }
        }
        chats.push(chat);
      }
      break;
    case _index.proto.HistorySync.HistorySyncType.PUSH_NAME:
      for (const c of item.pushnames) {
        contacts.push({
          id: c.id,
          notify: c.pushname
        });
      }
      break;
  }
  return {
    chats,
    contacts,
    messages,
    lidPnMappings,
    pastParticipants: item.pastParticipants,
    syncType: item.syncType,
    progress: item.progress
  };
};
exports.processHistoryMessage = processHistoryMessage;
const downloadAndProcessHistorySyncNotification = async (msg, options, logger) => {
  let historyMsg;
  if (msg.initialHistBootstrapInlinePayload) {
    historyMsg = _index.proto.HistorySync.decode(await inflatePromise(msg.initialHistBootstrapInlinePayload));
  } else {
    historyMsg = await downloadHistory(msg, options);
  }
  return processHistoryMessage(historyMsg, logger);
};
exports.downloadAndProcessHistorySyncNotification = downloadAndProcessHistorySyncNotification;
const getHistoryMsg = message => {
  const normalizedContent = !!message ? (0, _messages.normalizeMessageContent)(message) : undefined;
  const anyHistoryMsg = normalizedContent?.protocolMessage?.historySyncNotification;
  return anyHistoryMsg;
};
//# sourceMappingURL=history.js.map
exports.getHistoryMsg = getHistoryMsg;