"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WA_DEFAULT_EPHEMERAL = exports.WA_CERT_DETAILS = exports.WA_ADV_HOSTED_DEVICE_SIG_PREFIX = exports.WA_ADV_HOSTED_ACCOUNT_SIG_PREFIX = exports.WA_ADV_DEVICE_SIG_PREFIX = exports.WA_ADV_ACCOUNT_SIG_PREFIX = exports.URL_REGEX = exports.UPLOAD_TIMEOUT = exports.UNAUTHORIZED_CODES = exports.TimeMs = exports.STATUS_EXPIRY_SECONDS = exports.PROCESSABLE_HISTORY_TYPES = exports.PLACEHOLDER_MAX_AGE_SECONDS = exports.PHONE_CONNECTION_CB = exports.NOISE_WA_HEADER = exports.NOISE_MODE = exports.MIN_PREKEY_COUNT = exports.MEDIA_PATH_MAP = exports.MEDIA_KEYS = exports.MEDIA_HKDF_KEY_MAPPING = exports.KEY_BUNDLE_TYPE = exports.INITIAL_PREKEY_COUNT = exports.HISTORY_SYNC_PAUSED_TIMEOUT_MS = exports.DICT_VERSION = exports.DEF_TAG_PREFIX = exports.DEF_CALLBACK_PREFIX = exports.DEFAULT_ORIGIN = exports.DEFAULT_CONNECTION_CONFIG = exports.DEFAULT_CACHE_TTLS = exports.CALL_VIDEO_PREFIX = exports.CALL_AUDIO_PREFIX = void 0;
var _index = require("../../WAProto/index.js");
var _libsignal = require("../Signal/libsignal.js");
var _browserUtils = require("../Utils/browser-utils.js");
var _logger = _interopRequireDefault(require("../Utils/logger.js"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const version = [2, 3000, 1035194821];
const UNAUTHORIZED_CODES = exports.UNAUTHORIZED_CODES = [401, 403, 419];
const DEFAULT_ORIGIN = exports.DEFAULT_ORIGIN = 'https://web.whatsapp.com';
const CALL_VIDEO_PREFIX = exports.CALL_VIDEO_PREFIX = 'https://call.whatsapp.com/video/';
const CALL_AUDIO_PREFIX = exports.CALL_AUDIO_PREFIX = 'https://call.whatsapp.com/voice/';
const DEF_CALLBACK_PREFIX = exports.DEF_CALLBACK_PREFIX = 'CB:';
const DEF_TAG_PREFIX = exports.DEF_TAG_PREFIX = 'TAG:';
const PHONE_CONNECTION_CB = exports.PHONE_CONNECTION_CB = 'CB:Pong';
const WA_ADV_ACCOUNT_SIG_PREFIX = exports.WA_ADV_ACCOUNT_SIG_PREFIX = Buffer.from([6, 0]);
const WA_ADV_DEVICE_SIG_PREFIX = exports.WA_ADV_DEVICE_SIG_PREFIX = Buffer.from([6, 1]);
const WA_ADV_HOSTED_ACCOUNT_SIG_PREFIX = exports.WA_ADV_HOSTED_ACCOUNT_SIG_PREFIX = Buffer.from([6, 5]);
const WA_ADV_HOSTED_DEVICE_SIG_PREFIX = exports.WA_ADV_HOSTED_DEVICE_SIG_PREFIX = Buffer.from([6, 6]);
const WA_DEFAULT_EPHEMERAL = exports.WA_DEFAULT_EPHEMERAL = 7 * 24 * 60 * 60;
/** Status messages older than 24 hours are considered expired */
const STATUS_EXPIRY_SECONDS = exports.STATUS_EXPIRY_SECONDS = 24 * 60 * 60;
/** WA Web enforces a 14-day maximum age for placeholder resend requests */
const PLACEHOLDER_MAX_AGE_SECONDS = exports.PLACEHOLDER_MAX_AGE_SECONDS = 14 * 24 * 60 * 60;
const NOISE_MODE = exports.NOISE_MODE = 'Noise_XX_25519_AESGCM_SHA256\0\0\0\0';
const DICT_VERSION = exports.DICT_VERSION = 3;
const KEY_BUNDLE_TYPE = exports.KEY_BUNDLE_TYPE = Buffer.from([5]);
const NOISE_WA_HEADER = exports.NOISE_WA_HEADER = Buffer.from([87, 65, 6, DICT_VERSION]); // last is "DICT_VERSION"
/** from: https://stackoverflow.com/questions/3809401/what-is-a-good-regular-expression-to-match-a-url */
const URL_REGEX = exports.URL_REGEX = /https:\/\/(?![^:@\/\s]+:[^:@\/\s]+@)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(:\d+)?(\/[^\s]*)?/g;
const WA_CERT_DETAILS = exports.WA_CERT_DETAILS = {
  SERIAL: 0,
  ISSUER: 'WhatsAppLongTerm1',
  PUBLIC_KEY: Buffer.from('142375574d0a587166aae71ebe516437c4a28b73e3695c6ce1f7f9545da8ee6b', 'hex')
};
const PROCESSABLE_HISTORY_TYPES = exports.PROCESSABLE_HISTORY_TYPES = [_index.proto.HistorySync.HistorySyncType.INITIAL_BOOTSTRAP, _index.proto.HistorySync.HistorySyncType.PUSH_NAME, _index.proto.HistorySync.HistorySyncType.RECENT, _index.proto.HistorySync.HistorySyncType.FULL, _index.proto.HistorySync.HistorySyncType.ON_DEMAND, _index.proto.HistorySync.HistorySyncType.NON_BLOCKING_DATA, _index.proto.HistorySync.HistorySyncType.INITIAL_STATUS_V3];
const DEFAULT_CACHE_TTLS = exports.DEFAULT_CACHE_TTLS = {
  SIGNAL_STORE: 5 * 60,
  // 5 minutes
  MSG_RETRY: 60 * 60,
  // 1 hour
  CALL_OFFER: 5 * 60,
  // 5 minutes
  USER_DEVICES: 5 * 60 // 5 minutes
};
const DEFAULT_CONNECTION_CONFIG = exports.DEFAULT_CONNECTION_CONFIG = {
  version: version,
  browser: _browserUtils.Browsers.macOS('Chrome'),
  waWebSocketUrl: 'wss://web.whatsapp.com/ws/chat',
  connectTimeoutMs: 20000,
  keepAliveIntervalMs: 30000,
  logger: _logger.default.child({
    class: 'baileys'
  }),
  emitOwnEvents: true,
  defaultQueryTimeoutMs: 60000,
  customUploadHosts: [],
  retryRequestDelayMs: 250,
  maxMsgRetryCount: 5,
  fireInitQueries: true,
  auth: undefined,
  markOnlineOnConnect: true,
  syncFullHistory: true,
  patchMessageBeforeSending: msg => msg,
  shouldSyncHistoryMessage: ({
    syncType
  }) => {
    return syncType !== _index.proto.HistorySync.HistorySyncType.FULL;
  },
  shouldIgnoreJid: () => false,
  linkPreviewImageThumbnailWidth: 192,
  transactionOpts: {
    maxCommitRetries: 10,
    delayBetweenTriesMs: 3000
  },
  generateHighQualityLinkPreview: false,
  enableAutoSessionRecreation: true,
  enableRecentMessageCache: true,
  options: {},
  appStateMacVerification: {
    patch: false,
    snapshot: false
  },
  countryCode: 'US',
  getMessage: async () => undefined,
  cachedGroupMetadata: async () => undefined,
  makeSignalRepository: _libsignal.makeLibSignalRepository
};
const MEDIA_PATH_MAP = exports.MEDIA_PATH_MAP = {
  image: '/mms/image',
  video: '/mms/video',
  document: '/mms/document',
  audio: '/mms/audio',
  sticker: '/mms/image',
  'thumbnail-link': '/mms/image',
  'product-catalog-image': '/product/image',
  'md-app-state': '',
  'md-msg-hist': '/mms/md-app-state',
  'biz-cover-photo': '/pps/biz-cover-photo'
};
const MEDIA_HKDF_KEY_MAPPING = exports.MEDIA_HKDF_KEY_MAPPING = {
  audio: 'Audio',
  document: 'Document',
  gif: 'Video',
  image: 'Image',
  ppic: '',
  product: 'Image',
  ptt: 'Audio',
  sticker: 'Image',
  video: 'Video',
  'thumbnail-document': 'Document Thumbnail',
  'thumbnail-image': 'Image Thumbnail',
  'thumbnail-video': 'Video Thumbnail',
  'thumbnail-link': 'Link Thumbnail',
  'md-msg-hist': 'History',
  'md-app-state': 'App State',
  'product-catalog-image': '',
  'payment-bg-image': 'Payment Background',
  ptv: 'Video',
  'biz-cover-photo': 'Image'
};
const MEDIA_KEYS = exports.MEDIA_KEYS = Object.keys(MEDIA_PATH_MAP);
/** 120s timeout for history sync stall detection, same as WA Web's handleChunkProgress / restartPausedTimer (g = 120) */
const HISTORY_SYNC_PAUSED_TIMEOUT_MS = exports.HISTORY_SYNC_PAUSED_TIMEOUT_MS = 120000;
const MIN_PREKEY_COUNT = exports.MIN_PREKEY_COUNT = 5;
const INITIAL_PREKEY_COUNT = exports.INITIAL_PREKEY_COUNT = 812;
const UPLOAD_TIMEOUT = exports.UPLOAD_TIMEOUT = 30000; // 30 seconds
const TimeMs = exports.TimeMs = {
  Minute: 60 * 1000,
  Hour: 60 * 60 * 1000,
  Day: 24 * 60 * 60 * 1000,
  Week: 7 * 24 * 60 * 60 * 1000
};
//# sourceMappingURL=index.js.map