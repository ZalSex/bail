"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.generateRegistrationNode = exports.generateLoginNode = exports.encodeSignedDeviceIdentity = exports.configureSuccessfulPairing = void 0;
var _boom = require("@hapi/boom");
var _crypto = require("crypto");
var _index = require("../../WAProto/index.js");
var _index2 = require("../Defaults/index.js");
var _index3 = require("../WABinary/index.js");
var _crypto2 = require("./crypto.js");
var _generics = require("./generics.js");
var _signal = require("./signal.js");
const getUserAgent = config => {
  return {
    appVersion: {
      primary: config.version[0],
      secondary: config.version[1],
      tertiary: config.version[2]
    },
    platform: _index.proto.ClientPayload.UserAgent.Platform.WEB,
    releaseChannel: _index.proto.ClientPayload.UserAgent.ReleaseChannel.RELEASE,
    osVersion: '0.1',
    device: 'Desktop',
    osBuildNumber: '0.1',
    localeLanguageIso6391: 'en',
    mnc: '000',
    mcc: '000',
    localeCountryIso31661Alpha2: config.countryCode
  };
};
const PLATFORM_MAP = {
  'Mac OS': _index.proto.ClientPayload.WebInfo.WebSubPlatform.DARWIN,
  Windows: _index.proto.ClientPayload.WebInfo.WebSubPlatform.WIN32
};
const getWebInfo = config => {
  let webSubPlatform = _index.proto.ClientPayload.WebInfo.WebSubPlatform.WEB_BROWSER;
  if (config.syncFullHistory && PLATFORM_MAP[config.browser[0]] && config.browser[1] === 'Desktop') {
    webSubPlatform = PLATFORM_MAP[config.browser[0]];
  }
  return {
    webSubPlatform
  };
};
const getClientPayload = config => {
  const payload = {
    connectType: _index.proto.ClientPayload.ConnectType.WIFI_UNKNOWN,
    connectReason: _index.proto.ClientPayload.ConnectReason.USER_ACTIVATED,
    userAgent: getUserAgent(config)
  };
  payload.webInfo = getWebInfo(config);
  if (config.pushName) {
    payload.pushName = config.pushName;
  }
  return payload;
};
const generateLoginNode = (userJid, config) => {
  const {
    user,
    device
  } = (0, _index3.jidDecode)(userJid);
  const payload = {
    ...getClientPayload(config),
    passive: true,
    pull: true,
    username: +user,
    device: device,
    // TODO: investigate (hard set as false atm)
    lidDbMigrated: false
  };
  return _index.proto.ClientPayload.fromObject(payload);
};
exports.generateLoginNode = generateLoginNode;
const getPlatformType = platform => {
  const platformType = platform.toUpperCase();
  return _index.proto.DeviceProps.PlatformType[platformType] || _index.proto.DeviceProps.PlatformType.CHROME;
};
const generateRegistrationNode = ({
  registrationId,
  signedPreKey,
  signedIdentityKey
}, config) => {
  // the app version needs to be md5 hashed
  // and passed in
  const appVersionBuf = (0, _crypto.createHash)('md5').update(config.version.join('.')) // join as string
  .digest();
  const companion = {
    os: config.browser[0],
    platformType: getPlatformType(config.browser[1]),
    requireFullSync: config.syncFullHistory,
    historySyncConfig: {
      storageQuotaMb: 10240,
      inlineInitialPayloadInE2EeMsg: true,
      recentSyncDaysLimit: undefined,
      supportCallLogHistory: false,
      supportBotUserAgentChatHistory: true,
      supportCagReactionsAndPolls: true,
      supportBizHostedMsg: true,
      supportRecentSyncChunkMessageCountTuning: true,
      supportHostedGroupMsg: true,
      supportFbidBotChatHistory: true,
      supportAddOnHistorySyncMigration: undefined,
      supportMessageAssociation: true,
      supportGroupHistory: false,
      onDemandReady: undefined,
      supportGuestChat: undefined
    },
    version: {
      primary: 10,
      secondary: 15,
      tertiary: 7
    }
  };
  const companionProto = _index.proto.DeviceProps.encode(companion).finish();
  const registerPayload = {
    ...getClientPayload(config),
    passive: false,
    pull: false,
    devicePairingData: {
      buildHash: appVersionBuf,
      deviceProps: companionProto,
      eRegid: (0, _generics.encodeBigEndian)(registrationId),
      eKeytype: _index2.KEY_BUNDLE_TYPE,
      eIdent: signedIdentityKey.public,
      eSkeyId: (0, _generics.encodeBigEndian)(signedPreKey.keyId, 3),
      eSkeyVal: signedPreKey.keyPair.public,
      eSkeySig: signedPreKey.signature
    }
  };
  return _index.proto.ClientPayload.fromObject(registerPayload);
};
exports.generateRegistrationNode = generateRegistrationNode;
const configureSuccessfulPairing = (stanza, {
  advSecretKey,
  signedIdentityKey,
  signalIdentities
}) => {
  const msgId = stanza.attrs.id;
  const pairSuccessNode = (0, _index3.getBinaryNodeChild)(stanza, 'pair-success');
  const deviceIdentityNode = (0, _index3.getBinaryNodeChild)(pairSuccessNode, 'device-identity');
  const platformNode = (0, _index3.getBinaryNodeChild)(pairSuccessNode, 'platform');
  const deviceNode = (0, _index3.getBinaryNodeChild)(pairSuccessNode, 'device');
  const businessNode = (0, _index3.getBinaryNodeChild)(pairSuccessNode, 'biz');
  if (!deviceIdentityNode || !deviceNode) {
    throw new _boom.Boom('Missing device-identity or device in pair success node', {
      data: stanza
    });
  }
  const bizName = businessNode?.attrs.name;
  const jid = deviceNode.attrs.jid;
  const lid = deviceNode.attrs.lid;
  const {
    details,
    hmac,
    accountType
  } = _index.proto.ADVSignedDeviceIdentityHMAC.decode(deviceIdentityNode.content);
  let hmacPrefix = Buffer.from([]);
  if (accountType !== undefined && accountType === _index.proto.ADVEncryptionType.HOSTED) {
    hmacPrefix = _index2.WA_ADV_HOSTED_ACCOUNT_SIG_PREFIX;
  }
  const advSign = (0, _crypto2.hmacSign)(Buffer.concat([hmacPrefix, details]), Buffer.from(advSecretKey, 'base64'));
  if (Buffer.compare(hmac, advSign) !== 0) {
    throw new _boom.Boom('Invalid account signature');
  }
  const account = _index.proto.ADVSignedDeviceIdentity.decode(details);
  const {
    accountSignatureKey,
    accountSignature,
    details: deviceDetails
  } = account;
  const deviceIdentity = _index.proto.ADVDeviceIdentity.decode(deviceDetails);
  const accountSignaturePrefix = deviceIdentity.deviceType === _index.proto.ADVEncryptionType.HOSTED ? _index2.WA_ADV_HOSTED_ACCOUNT_SIG_PREFIX : _index2.WA_ADV_ACCOUNT_SIG_PREFIX;
  const accountMsg = Buffer.concat([accountSignaturePrefix, deviceDetails, signedIdentityKey.public]);
  if (!_crypto2.Curve.verify(accountSignatureKey, accountMsg, accountSignature)) {
    throw new _boom.Boom('Failed to verify account signature');
  }
  const deviceMsg = Buffer.concat([_index2.WA_ADV_DEVICE_SIG_PREFIX, deviceDetails, signedIdentityKey.public, accountSignatureKey]);
  account.deviceSignature = _crypto2.Curve.sign(signedIdentityKey.private, deviceMsg);
  const identity = (0, _signal.createSignalIdentity)(lid, accountSignatureKey);
  const accountEnc = encodeSignedDeviceIdentity(account, false);
  const reply = {
    tag: 'iq',
    attrs: {
      to: _index3.S_WHATSAPP_NET,
      type: 'result',
      id: msgId
    },
    content: [{
      tag: 'pair-device-sign',
      attrs: {},
      content: [{
        tag: 'device-identity',
        attrs: {
          'key-index': deviceIdentity.keyIndex.toString()
        },
        content: accountEnc
      }]
    }]
  };
  const authUpdate = {
    account,
    me: {
      id: jid,
      name: bizName,
      lid
    },
    signalIdentities: [...(signalIdentities || []), identity],
    platform: platformNode?.attrs.name
  };
  return {
    creds: authUpdate,
    reply
  };
};
exports.configureSuccessfulPairing = configureSuccessfulPairing;
const encodeSignedDeviceIdentity = (account, includeSignatureKey) => {
  account = {
    ...account
  };
  // set to null if we are not to include the signature key
  // or if we are including the signature key but it is empty
  if (!includeSignatureKey || !account.accountSignatureKey?.length) {
    account.accountSignatureKey = null;
  }
  return _index.proto.ADVSignedDeviceIdentity.encode(account).finish();
};
//# sourceMappingURL=validate-connection.js.map
exports.encodeSignedDeviceIdentity = encodeSignedDeviceIdentity;