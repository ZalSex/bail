"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeNewsletterSocket = void 0;
var _index = require("../Types/index.js");
var _messagesMedia = require("../Utils/messages-media.js");
var _index2 = require("../WABinary/index.js");
var _groups = require("./groups.js");
var _mex = require("./mex.js");
const parseNewsletterCreateResponse = response => {
  const {
    id,
    thread_metadata: thread,
    viewer_metadata: viewer
  } = response;
  return {
    id: id,
    owner: undefined,
    name: thread.name.text,
    creation_time: parseInt(thread.creation_time, 10),
    description: thread.description.text,
    invite: thread.invite,
    subscribers: parseInt(thread.subscribers_count, 10),
    verification: thread.verification,
    picture: {
      id: thread.picture.id,
      directPath: thread.picture.direct_path
    },
    mute_state: viewer.mute
  };
};
const parseNewsletterMetadata = result => {
  if (typeof result !== 'object' || result === null) {
    return null;
  }
  if ('id' in result && typeof result.id === 'string') {
    return result;
  }
  if ('result' in result && typeof result.result === 'object' && result.result !== null && 'id' in result.result) {
    return result.result;
  }
  return null;
};
const makeNewsletterSocket = config => {
  const sock = (0, _groups.makeGroupsSocket)(config);
  const {
    query,
    generateMessageTag
  } = sock;
  const executeWMexQuery = (variables, queryId, dataPath) => {
    return (0, _mex.executeWMexQuery)(variables, queryId, dataPath, query, generateMessageTag);
  };
  const newsletterUpdate = async (jid, updates) => {
    const variables = {
      newsletter_id: jid,
      updates: {
        ...updates,
        settings: null
      }
    };
    return executeWMexQuery(variables, _index.QueryIds.UPDATE_METADATA, 'xwa2_newsletter_update');
  };
  return {
    ...sock,
    newsletterCreate: async (name, description) => {
      const variables = {
        input: {
          name,
          description: description ?? null
        }
      };
      const rawResponse = await executeWMexQuery(variables, _index.QueryIds.CREATE, _index.XWAPaths.xwa2_newsletter_create);
      return parseNewsletterCreateResponse(rawResponse);
    },
    newsletterUpdate,
    newsletterSubscribers: async jid => {
      return executeWMexQuery({
        newsletter_id: jid
      }, _index.QueryIds.SUBSCRIBERS, _index.XWAPaths.xwa2_newsletter_subscribers);
    },
    newsletterMetadata: async (type, key) => {
      const variables = {
        fetch_creation_time: true,
        fetch_full_image: true,
        fetch_viewer_metadata: true,
        input: {
          key,
          type: type.toUpperCase()
        }
      };
      const result = await executeWMexQuery(variables, _index.QueryIds.METADATA, _index.XWAPaths.xwa2_newsletter_metadata);
      return parseNewsletterMetadata(result);
    },
    newsletterFollow: jid => {
      return executeWMexQuery({
        newsletter_id: jid
      }, _index.QueryIds.FOLLOW, _index.XWAPaths.xwa2_newsletter_join_v2);
    },
    newsletterUnfollow: jid => {
      return executeWMexQuery({
        newsletter_id: jid
      }, _index.QueryIds.UNFOLLOW, _index.XWAPaths.xwa2_newsletter_leave_v2);
    },
    newsletterMute: jid => {
      return executeWMexQuery({
        newsletter_id: jid
      }, _index.QueryIds.MUTE, _index.XWAPaths.xwa2_newsletter_mute_v2);
    },
    newsletterUnmute: jid => {
      return executeWMexQuery({
        newsletter_id: jid
      }, _index.QueryIds.UNMUTE, _index.XWAPaths.xwa2_newsletter_unmute_v2);
    },
    newsletterUpdateName: async (jid, name) => {
      return await newsletterUpdate(jid, {
        name
      });
    },
    newsletterUpdateDescription: async (jid, description) => {
      return await newsletterUpdate(jid, {
        description
      });
    },
    newsletterUpdatePicture: async (jid, content) => {
      const {
        img
      } = await (0, _messagesMedia.generateProfilePicture)(content);
      return await newsletterUpdate(jid, {
        picture: img.toString('base64')
      });
    },
    newsletterRemovePicture: async jid => {
      return await newsletterUpdate(jid, {
        picture: ''
      });
    },
    newsletterReactMessage: async (jid, serverId, reaction) => {
      await query({
        tag: 'message',
        attrs: {
          to: jid,
          ...(reaction ? {} : {
            edit: '7'
          }),
          type: 'reaction',
          server_id: serverId,
          id: generateMessageTag()
        },
        content: [{
          tag: 'reaction',
          attrs: reaction ? {
            code: reaction
          } : {}
        }]
      });
    },
    newsletterFetchMessages: async (jid, count, since, after) => {
      const messageUpdateAttrs = {
        count: count.toString()
      };
      if (typeof since === 'number') {
        messageUpdateAttrs.since = since.toString();
      }
      if (after) {
        messageUpdateAttrs.after = after.toString();
      }
      const result = await query({
        tag: 'iq',
        attrs: {
          id: generateMessageTag(),
          type: 'get',
          xmlns: 'newsletter',
          to: jid
        },
        content: [{
          tag: 'message_updates',
          attrs: messageUpdateAttrs
        }]
      });
      return result;
    },
    subscribeNewsletterUpdates: async jid => {
      const result = await query({
        tag: 'iq',
        attrs: {
          id: generateMessageTag(),
          type: 'set',
          xmlns: 'newsletter',
          to: jid
        },
        content: [{
          tag: 'live_updates',
          attrs: {},
          content: []
        }]
      });
      const liveUpdatesNode = (0, _index2.getBinaryNodeChild)(result, 'live_updates');
      const duration = liveUpdatesNode?.attrs?.duration;
      return duration ? {
        duration: duration
      } : null;
    },
    newsletterAdminCount: async jid => {
      const response = await executeWMexQuery({
        newsletter_id: jid
      }, _index.QueryIds.ADMIN_COUNT, _index.XWAPaths.xwa2_newsletter_admin_count);
      return response.admin_count;
    },
    newsletterChangeOwner: async (jid, newOwnerJid) => {
      await executeWMexQuery({
        newsletter_id: jid,
        user_id: newOwnerJid
      }, _index.QueryIds.CHANGE_OWNER, _index.XWAPaths.xwa2_newsletter_change_owner);
    },
    newsletterDemote: async (jid, userJid) => {
      await executeWMexQuery({
        newsletter_id: jid,
        user_id: userJid
      }, _index.QueryIds.DEMOTE, _index.XWAPaths.xwa2_newsletter_demote);
    },
    newsletterDelete: async jid => {
      await executeWMexQuery({
        newsletter_id: jid
      }, _index.QueryIds.DELETE, _index.XWAPaths.xwa2_newsletter_delete_v2);
    }
  };
};
//# sourceMappingURL=newsletter.js.map
exports.makeNewsletterSocket = makeNewsletterSocket;