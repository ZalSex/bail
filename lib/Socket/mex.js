"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.executeWMexQuery = void 0;
var _boom = require("@hapi/boom");
var _index = require("../WABinary/index.js");
const wMexQuery = (variables, queryId, query, generateMessageTag) => {
  return query({
    tag: 'iq',
    attrs: {
      id: generateMessageTag(),
      type: 'get',
      to: _index.S_WHATSAPP_NET,
      xmlns: 'w:mex'
    },
    content: [{
      tag: 'query',
      attrs: {
        query_id: queryId
      },
      content: Buffer.from(JSON.stringify({
        variables
      }), 'utf-8')
    }]
  });
};
const executeWMexQuery = async (variables, queryId, dataPath, query, generateMessageTag) => {
  const result = await wMexQuery(variables, queryId, query, generateMessageTag);
  const child = (0, _index.getBinaryNodeChild)(result, 'result');
  if (child?.content) {
    const data = JSON.parse(child.content.toString());
    if (data.errors && data.errors.length > 0) {
      const errorMessages = data.errors.map(err => err.message || 'Unknown error').join(', ');
      const firstError = data.errors[0];
      const errorCode = firstError.extensions?.error_code || 400;
      throw new _boom.Boom(`GraphQL server error: ${errorMessages}`, {
        statusCode: errorCode,
        data: firstError
      });
    }
    const response = dataPath ? data?.data?.[dataPath] : data?.data;
    if (typeof response !== 'undefined') {
      return response;
    }
  }
  const action = (dataPath || '').startsWith('xwa2_') ? dataPath.substring(5).replace(/_/g, ' ') : dataPath?.replace(/_/g, ' ');
  throw new _boom.Boom(`Failed to ${action}, unexpected response structure.`, {
    statusCode: 400,
    data: result
  });
};
//# sourceMappingURL=mex.js.map
exports.executeWMexQuery = executeWMexQuery;