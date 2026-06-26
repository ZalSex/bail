Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.makeMessagesSocket = undefined;
var _nodeCache = _interopRequireDefault(require("@cacheable/node-cache"));
var _boom = require("@hapi/boom");
var _index = require("../../WAProto/index.js");
var _index2 = require("../Defaults/index.js");
var _index3 = require("../Utils/index.js");
var _linkPreview = require("../Utils/link-preview.js");
var _makeMutex = require("../Utils/make-mutex.js");
var _reportingUtils = require("../Utils/reporting-utils.js");
var _tcTokenUtils = require("../Utils/tc-token-utils.js");
var _index4 = require("../WABinary/index.js");
var _index5 = require("../WAUSync/index.js");
var _newsletter = require("./newsletter.js");
function _interopRequireDefault(B) {
    if (B && B.__esModule) {
        return B;
    } else {
        return {
            default: B
        };
    }
}
const makeMessagesSocket = B => {
    const {
        logger: m,
        linkPreviewImageThumbnailWidth: ya,
        generateHighQualityLinkPreview: za,
        options: Aa,
        patchMessageBeforeSending: T,
        cachedGroupMetadata: ma,
        enableRecentMessageCache: Ba,
        maxMsgRetryCount: Ca
    } = B;
    const K = (0, _newsletter.makeNewsletterSocket)(B);
    const {
        ev: na,
        authState: u,
        messageMutex: Da,
        signalRepository: A,
        upsertMessage: Ea,
        query: da,
        fetchPrivacySettings: oa,
        sendNode: X,
        groupMetadata: Fa,
        groupToggleEphemeral: Ga,
        registerSocketEndHandler: Ha
    } = K;
    const ea = A.lidMapping.getLIDForPN.bind(A.lidMapping);
    const fa = new Set();
    const E = B.userDevicesCache || new _nodeCache.default({
        stdTTL: _index2.DEFAULT_CACHE_TTLS.USER_DEVICES,
        useClones: false
    });
    const pa = (0, _makeMutex.makeMutex)();
    const U = Ba ? new _index3.MessageRetryManager(m, Ca) : null;
    const Ia = (0, _makeMutex.makeKeyedMutex)();
    let Y;
    let ha = _index3.DEF_MEDIA_HOST;
    const qa = async (a = false) => {
        const b = await Y;
        if (!b || a || new Date().getTime() - b.fetchDate.getTime() > b.ttl * 1000) {
            Y = (async () => {
                var e = await da({
                    tag: "iq",
                    attrs: {
                        type: "set",
                        xmlns: "w:m",
                        to: _index4.S_WHATSAPP_NET
                    },
                    content: [{
                        tag: "media_conn",
                        attrs: {}
                    }]
                });
                e = (0, _index4.getBinaryNodeChild)(e, "media_conn");
                e = {
                    hosts: (0, _index4.getBinaryNodeChildren)(e, "host").map(({
                        attrs: d
                    }) => ({
                        hostname: d.hostname,
                        maxContentLengthBytes: +d.maxContentLengthBytes
                    })),
                    auth: e.attrs.auth,
                    ttl: +e.attrs.ttl,
                    fetchDate: new Date()
                };
                m.debug("fetched media conn");
                if (e.hosts[0]) {
                    ha = e.hosts[0].hostname;
                }
                return e;
            })();
        }
        return Y;
    };
    const ra = async (a, b, e, d) => {
        if (!e || e.length === 0) {
            throw new _boom.Boom("missing ids in receipt");
        }
        const c = {
            tag: "receipt",
            attrs: {
                id: e[0]
            }
        };
        if (d === "read" || d === "read-self") {
            c.attrs.t = (0, _index3.unixTimestampSeconds)().toString();
        }
        if (d === "sender" && ((0, _index4.isPnUser)(a) || (0, _index4.isLidUser)(a))) {
            c.attrs.recipient = a;
            c.attrs.to = b;
        } else {
            c.attrs.to = a;
            if (b) {
                c.attrs.participant = b;
            }
        }
        if (d) {
            c.attrs.type = d;
        }
        a = e.slice(1);
        if (a.length) {
            c.content = [{
                tag: "list",
                attrs: {},
                content: a.map(k => ({
                    tag: "item",
                    attrs: {
                        id: k
                    }
                }))
            }];
        }
        m.debug({
            attrs: c.attrs,
            messageIds: e
        }, "sending receipt for messages");
        await X(c);
    };
    const sa = async (a, b) => {
        a = (0, _index3.aggregateMessageKeysNotFromMe)(a);
        for (const {
            jid: e,
            participant: d,
            messageIds: c
        } of a) {
            await ra(e, d, c, b);
        }
    };
    const ia = async (a, b, e) => {
        const d = [];
        if (!b) {
            m.debug("not using cache for devices");
        }
        var c = [];
        a = a.map(f => {
            var h = (0, _index4.jidDecode)(f);
            const n = h?.user;
            h = h?.device;
            if (typeof h === "number" && h >= 0 && n) {
                d.push({
                    user: n,
                    device: h,
                    jid: f
                });
                return null;
            }
            f = (0, _index4.jidNormalizedUser)(f);
            return {
                jid: f,
                user: n
            };
        }).filter(f => f !== null);
        if (b && E.mget) {
            var k = a.map(f => f?.user).filter(Boolean);
            k = await E.mget(k);
        }
        for (const {
            jid: f,
            user: h
        } of a) {
            if (b) {
                if (a = k?.[h] || (E.mget ? undefined : await E.get(h))) {
                    a = a.map(n => ({
                        ...n,
                        jid: (0, _index4.jidEncode)(n.user, n.server, n.device)
                    }));
                    d.push(...a);
                    m.trace({
                        user: h
                    }, "using cache for devices");
                } else {
                    c.push(f);
                }
            } else {
                c.push(f);
            }
        }
        if (!c.length) {
            return d;
        }
        b = new Set();
        for (var q of c) {
            if (((0, _index4.isLidUser)(q) || (0, _index4.isHostedLidUser)(q)) && (k = (0, _index4.jidDecode)(q)?.user)) {
                b.add(k);
            }
        }
        q = new _index5.USyncQuery().withContext("message").withDeviceProtocol().withLIDProtocol();
        for (var x of c) {
            q.withUser(new _index5.USyncUser().withId(x));
        }
        if (c = await K.executeUSyncQuery(q)) {
            x = c.list.filter(h => !!h.lid);
            if (x.length > 0) {
                m.trace("Storing LID maps from device call");
                await A.lidMapping.storeLIDPNMappings(x.map(h => ({
                    lid: h.lid,
                    pn: h.id
                })));
                try {
                    const h = x.map(n => n.lid);
                    if (h.length) {
                        await Z(h, true);
                    }
                } catch (h) {
                    m.warn({
                        e: h,
                        count: x.length
                    }, "failed to assert sessions for newly mapped LIDs");
                }
            }
            e = (0, _index3.extractDeviceJids)(c?.list, u.creds.me.id, u.creds.me.lid, e);
            const f = {};
            for (var v of e) {
                f[v.user] = f[v.user] || [];
                f[v.user]?.push(v);
            }
            for (const [h, n] of Object.entries(f)) {
                v = b.has(h);
                for (var g of n) {
                    e = v ? (0, _index4.jidEncode)(h, g.server, g.device) : (0, _index4.jidEncode)(g.user, g.server, g.device);
                    d.push({
                        ...g,
                        jid: e
                    });
                    m.debug({
                        user: g.user,
                        device: g.device,
                        finalJid: e,
                        usedLid: v
                    }, "Processed device with LID priority");
                }
            }
            await pa.mutex(async () => {
                if (E.mset) {
                    await E.mset(Object.entries(f).map(([h, n]) => ({
                        key: h,
                        value: n
                    })));
                } else {
                    for (const h in f) {
                        if (f[h]) {
                            await E.set(h, f[h]);
                        }
                    }
                }
            });
            g = {};
            for (const [h, n] of Object.entries(f)) {
                if (n && n.length > 0) {
                    g[h] = n.map(H => H.device?.toString() || "0");
                }
            }
            if (Object.keys(g).length > 0) {
                try {
                    await u.keys.set({
                        "device-list": g
                    });
                    m.debug({
                        userCount: Object.keys(g).length
                    }, "stored user device lists for bulk migration");
                } catch (h) {
                    m.warn({
                        error: h
                    }, "failed to store user device lists");
                }
            }
        }
        return d;
    };
    const Z = async (a, b) => {
        let e = false;
        const d = [...new Set(a)];
        var c = [];
        m.debug({
            jids: a
        }, "assertSessions call with jids");
        for (const k of d) {
            if (!!b || !(await A.validateSession(k)).exists) {
                c.push(k);
            }
        }
        if (c.length) {
            a = [...c.filter(k => !!(0, _index4.isLidUser)(k) || !!(0, _index4.isHostedLidUser)(k)), ...((await A.lidMapping.getLIDsForPNs(c.filter(k => !!(0, _index4.isPnUser)(k) || !!(0, _index4.isHostedPnUser)(k)))) || []).map(k => k.lid)];
            m.debug({
                jidsRequiringFetch: c,
                wireJids: a
            }, "fetching sessions");
            c = await da({
                tag: "iq",
                attrs: {
                    xmlns: "encrypt",
                    type: "get",
                    to: _index4.S_WHATSAPP_NET
                },
                content: [{
                    tag: "key",
                    attrs: {},
                    content: a.map(k => {
                        k = {
                            jid: k
                        };
                        if (b) {
                            k.reason = "identity";
                        }
                        return {
                            tag: "user",
                            attrs: k
                        };
                    })
                }]
            });
            await (0, _index3.parseAndInjectE2ESessions)(c, A);
            e = true;
        }
        return e;
    };
    const aa = async (a, b, e, d) => {
        if (!a.length) {
            return {
                nodes: [],
                shouldIncludeDeviceIdentity: false
            };
        }
        const c = await T(b, a);
        b = Array.isArray(c) ? c : a.map(g => ({
            recipientJid: g,
            message: c
        }));
        let k = false;
        const q = u.creds.me.id;
        const x = u.creds.me?.lid;
        const v = x ? (0, _index4.jidDecode)(x)?.user : null;
        b = b.map(async ({
            recipientJid: g,
            message: f
        }) => {
            try {
                if (!g) {
                    return null;
                }
                if (d) {
                    const {
                        user: n
                    } = (0, _index4.jidDecode)(g);
                    const {
                        user: H
                    } = (0, _index4.jidDecode)(q);
                    const V = g === q || x && g === x;
                    if ((n === H || v && n === v) && !V) {
                        f = d;
                        m.debug({
                            jid: g,
                            targetUser: n
                        }, "Using DSM for own device");
                    }
                }
                const h = (0, _index3.encodeWAMessage)(f);
                return await Ia.mutex(g, async () => {
                    const {
                        type: n,
                        ciphertext: H
                    } = await A.encryptMessage({
                        jid: g,
                        data: h
                    });
                    if (n === "pkmsg") {
                        k = true;
                    }
                    return {
                        tag: "to",
                        attrs: {
                            jid: g
                        },
                        content: [{
                            tag: "enc",
                            attrs: {
                                v: "2",
                                type: n,
                                ...(e || {})
                            },
                            content: H
                        }]
                    };
                });
            } catch (h) {
                m.error({
                    jid: g,
                    err: h
                }, "Failed to encrypt for recipient");
                return null;
            }
        });
        b = (await Promise.all(b)).filter(g => g !== null);
        if (a.length > 0 && b.length === 0) {
            throw new _boom.Boom("All encryptions failed", {
                statusCode: 500
            });
        }
        return {
            nodes: b,
            shouldIncludeDeviceIdentity: k
        };
    };
    const ca = async (a, b, {
        messageId: e,
        participant: d,
        additionalAttributes: c,
        additionalNodes: k,
        useUserDevicesCache: q,
        useCachedGroupMetadata: x,
        statusJidList: v
    }) => {
        const g = (0, _index3.assertMeId)(u.creds);
        const f = u.creds.me?.lid;
        const h = d?.count !== undefined;
        let n = h;
        const {
            user: H,
            server: V
        } = (0, _index4.jidDecode)(a);
        const ba = V === "g.us";
        const L = a === "status@broadcast";
        const W = V === "lid";
        const ja = V === "newsletter";
        const ta = ba || L;
        e = e || (0, _index3.generateMessageIDV2)(g);
        q = q !== false;
        x = x !== false && !L;
        const N = [];
        const r = L ? "status@broadcast" : a;
        const O = [];
        const F = [];
        let R;
        const ua = {
            deviceSentMessage: {
                destinationJid: r,
                message: b
            },
            messageContextInfo: b.messageContextInfo
        };
        const P = {};
        if (d) {
            if (!ba && !L) {
                c = {
                    ...c,
                    device_fanout: "false"
                };
            }
            const {
                user: l,
                device: y
            } = (0, _index4.jidDecode)(d.jid);
            F.push({
                user: l,
                device: y,
                jid: d.jid
            });
        }
        await u.keys.transaction(async () => {
            var l = va(b);
            if (l) {
                P.mediatype = l;
            }
            if (ja) {
                var y = T ? await T(b, []) : b;
                y = (0, _index3.encodeNewsletterMessage)(y);
                O.push({
                    tag: "plaintext",
                    attrs: {},
                    content: y
                });
                y = {
                    tag: "message",
                    attrs: {
                        to: a,
                        id: e,
                        type: wa(b),
                        ...(c || {})
                    },
                    content: O
                };
                m.debug({
                    msgId: e
                }, `sending newsletter message to ${a}`);
                await X(y);
            } else {
                if ((0, _index3.normalizeMessageContent)(b)?.pinInChatMessage || (0, _index3.normalizeMessageContent)(b)?.reactionMessage) {
                    P["decrypt-fail"] = "hide";
                }
                if (ta && !h) {
                    const [w, z] = await Promise.all([(async () => {
                        let I = x && ma ? await ma(a) : undefined;
                        if (I && Array.isArray(I?.participants)) {
                            m.trace({
                                jid: a,
                                participants: I.participants.length
                            }, "using cached group metadata");
                        } else if (!L) {
                            I = await Fa(a);
                        }
                        return I;
                    })(), (async () => d || L ? {} : (await u.keys.get("sender-key-memory", [a]))[a] || {})()]);
                    l = w ? w.participants.map(I => I.id) : [];
                    if (w?.ephemeralDuration && w.ephemeralDuration > 0) {
                        c = {
                            ...c,
                            expiration: w.ephemeralDuration.toString()
                        };
                    }
                    if (L && v) {
                        l.push(...v);
                    }
                    l = await ia(l, !!q, false);
                    F.push(...l);
                    if (ba) {
                        c = {
                            ...c,
                            addressing_mode: w?.addressingMode || "lid"
                        };
                    }
                    l = await T(b);
                    if (Array.isArray(l)) {
                        throw new _boom.Boom("Per-jid patching is not supported in groups");
                    }
                    var C = (0, _index3.encodeWAMessage)(l);
                    R = l;
                    const {
                        ciphertext: Q,
                        senderKeyDistributionMessage: ka
                    } = await A.encryptGroupMessage({
                        group: r,
                        data: C,
                        meId: (c?.addressing_mode || w?.addressingMode || "lid") === "lid" && f ? f : g
                    });
                    l = [];
                    for (var p of F) {
                        C = p.jid;
                        if ((!z[C] || !!d) && !(0, _index4.isHostedLidUser)(C) && !(0, _index4.isHostedPnUser)(C) && p.device !== 99) {
                            l.push(C);
                            z[C] = true;
                        }
                    }
                    if (l.length) {
                        m.debug({
                            senderKeyJids: l
                        }, "sending new sender key");
                        p = {
                            senderKeyDistributionMessage: {
                                axolotlSenderKeyDistributionMessage: ka,
                                groupId: r
                            }
                        };
                        await Z(l);
                        p = await aa(l, p, P);
                        n = n || p.shouldIncludeDeviceIdentity;
                        N.push(...p.nodes);
                    }
                    O.push({
                        tag: "enc",
                        attrs: {
                            v: "2",
                            type: "skmsg",
                            ...P
                        },
                        content: Q
                    });
                    await u.keys.set({
                        "sender-key-memory": {
                            [a]: z
                        }
                    });
                } else {
                    p = g;
                    if (W && f) {
                        p = f;
                        m.debug({
                            to: a,
                            ownId: p
                        }, "Using LID identity for @lid conversation");
                    } else {
                        m.debug({
                            to: a,
                            ownId: p
                        }, "Using PN identity for @s.whatsapp.net conversation");
                    }
                    ({
                        user: p
                    } = (0, _index4.jidDecode)(p));
                    if (!d) {
                        l = await T(b, [a]);
                        R = Array.isArray(l) ? l.find(M => M.recipientJid === a) || l[0] : l;
                    }
                    if (!h && !d) {
                        F.push({
                            user: H,
                            device: 0,
                            jid: (0, _index4.jidEncode)(H, W ? "lid" : "s.whatsapp.net", 0)
                        });
                        if (H !== p) {
                            p = W ? "lid" : "s.whatsapp.net";
                            l = W && f ? (0, _index4.jidDecode)(f).user : (0, _index4.jidDecode)(g).user;
                            F.push({
                                user: l,
                                device: 0,
                                jid: (0, _index4.jidEncode)(l, p, 0)
                            });
                        }
                        if (c?.category !== "peer") {
                            F.length = 0;
                            p = W && f ? (0, _index4.jidEncode)((0, _index4.jidDecode)(f)?.user, "lid", undefined) : (0, _index4.jidEncode)((0, _index4.jidDecode)(g)?.user, "s.whatsapp.net", undefined);
                            p = await ia([p, a], true, false);
                            F.push(...p);
                            m.debug({
                                deviceCount: F.length,
                                devices: F.map(M => `${M.user}:${M.device}@${(0, _index4.jidDecode)(M.jid)?.server}`)
                            }, "Device enumeration complete with unified addressing");
                        }
                    }
                    p = [];
                    l = [];
                    C = [];
                    const {
                        user: w
                    } = (0, _index4.jidDecode)(g);
                    const {
                        user: z
                    } = f ? (0, _index4.jidDecode)(f) : {
                        user: null
                    };
                    for (const {
                        user: M,
                        jid: S
                    } of F) {
                        if (S === g || f && S === f) {
                            m.debug({
                                jid: S,
                                meId: g,
                                meLid: f
                            }, "Skipping exact sender device (whatsmeow pattern)");
                        } else {
                            if (M === w || M === z) {
                                l.push(S);
                            } else {
                                C.push(S);
                            }
                            p.push(S);
                        }
                    }
                    await Z(p);
                    const [{
                        nodes: Q,
                        shouldIncludeDeviceIdentity: ka
                    }, {
                        nodes: I,
                        shouldIncludeDeviceIdentity: Ja
                    }] = await Promise.all([aa(l, ua || b, P), aa(C, b, P, ua)]);
                    N.push(...Q);
                    N.push(...I);
                    if (l.length > 0 || C.length > 0) {
                        P.phash = (0, _index3.generateParticipantHashV2)([...l, ...C]);
                    }
                    n = n || ka || Ja;
                }
                if (h) {
                    p = (0, _index4.isLidUser)(d.jid);
                    p = (0, _index4.areJidsSameUser)(d.jid, p ? f : g);
                    l = b;
                    if (ta) {
                        var t;
                        if (f && (await A.hasSenderKey({
                            group: r,
                            meId: f
                        }))) {
                            t = f;
                        } else if (await A.hasSenderKey({
                            group: r,
                            meId: g
                        })) {
                            t = g;
                        }
                        if (t) {
                            try {
                                var G = await A.getSenderKeyDistributionMessage({
                                    group: r,
                                    meId: t
                                });
                                l = {
                                    ...b,
                                    senderKeyDistributionMessage: {
                                        groupId: r,
                                        axolotlSenderKeyDistributionMessage: G
                                    }
                                };
                            } catch (Q) {
                                m.warn({
                                    err: Q,
                                    jid: r
                                }, "failed to build SKDM for retry, sending without it");
                            }
                        }
                    }
                    t = p ? (0, _index3.encodeWAMessage)({
                        deviceSentMessage: {
                            destinationJid: r,
                            message: l
                        }
                    }) : (0, _index3.encodeWAMessage)(l);
                    const {
                        type: w,
                        ciphertext: z
                    } = await A.encryptMessage({
                        data: t,
                        jid: d.jid
                    });
                    O.push({
                        tag: "enc",
                        attrs: {
                            v: "2",
                            type: w,
                            ...(d.count ? {
                                count: d.count.toString()
                            } : {})
                        },
                        content: z
                    });
                }
                if (N.length) {
                    if (c?.category === "peer") {
                        if (t = N[0]?.content?.[0]) {
                            O.push(t);
                        }
                    } else {
                        O.push({
                            tag: "participants",
                            attrs: {},
                            content: N
                        });
                    }
                }
                t = {
                    tag: "message",
                    attrs: {
                        id: e,
                        to: r,
                        type: wa(b),
                        ...(c || {})
                    },
                    content: O
                };
                if (d) {
                    if ((0, _index4.isJidGroup)(r)) {
                        t.attrs.to = r;
                        t.attrs.participant = d.jid;
                    } else if ((0, _index4.areJidsSameUser)(d.jid, g)) {
                        t.attrs.to = d.jid;
                        t.attrs.recipient = r;
                    } else {
                        t.attrs.to = d.jid;
                    }
                } else {
                    t.attrs.to = r;
                }
                if (n) {
                    t.content.push({
                        tag: "device-identity",
                        attrs: {},
                        content: (0, _index3.encodeSignedDeviceIdentity)(u.creds.account, true)
                    });
                    m.debug({
                        jid: a
                    }, "adding device identity");
                }
                if (!ja && !h && R?.messageContextInfo?.messageSecret && (0, _reportingUtils.shouldIncludeReportingToken)(R)) {
                    try {
                        y = (0, _index3.encodeWAMessage)(R);
                        var J = await (0, _reportingUtils.getMessageReportingToken)(y, R, {
                            id: e,
                            fromMe: true,
                            remoteJid: r,
                            participant: d?.jid
                        });
                        if (J) {
                            t.content.push(J);
                            m.trace({
                                jid: a
                            }, "added reporting token to message");
                        }
                    } catch (w) {
                        m.warn({
                            jid: a,
                            trace: w?.stack
                        }, "failed to attach reporting token");
                    }
                }
                y = c?.category === "peer";
                var D = (y = !ba && !h && !L && !ja && !y) ? await (0, _tcTokenUtils.resolveTcTokenJid)(r, ea) : r;
                J = (y ? await u.keys.get("tctoken", [D]) : {})[D];
                G = J?.token;
                if (G?.length && (0, _tcTokenUtils.isTcTokenExpired)(J?.timestamp)) {
                    m.debug({
                        jid: r,
                        timestamp: J?.timestamp
                    }, "tctoken expired, clearing");
                    G = undefined;
                    p = J?.senderTimestamp !== undefined ? {
                        token: Buffer.alloc(0),
                        senderTimestamp: J.senderTimestamp
                    } : null;
                    try {
                        await u.keys.set({
                            tctoken: {
                                [D]: p
                            }
                        });
                    } catch (w) {
                        m.debug({
                            jid: r,
                            err: w?.message
                        }, "failed to persist tctoken expiry cleanup");
                    }
                }
                if (G?.length && K.serverProps.privacyTokenOn1to1) {
                    t.content.push({
                        tag: "tctoken",
                        attrs: {},
                        content: G
                    });
                }
                if (k && k.length > 0) {
                    t.content.push(...k);
                } else if (((0, _index4.isJidGroup)(a) || (0, _index4.isPnUser)(a)) && ((b === null || b === undefined ? 0 : b.viewOnceMessage) || (b === null || b === undefined ? 0 : b.viewOnceMessageV2) || (b === null || b === undefined ? 0 : b.viewOnceMessageV2Extension) || (b === null || b === undefined ? 0 : b.ephemeralMessage) || (b === null || b === undefined ? 0 : b.templateMessage) || (b === null || b === undefined ? 0 : b.interactiveMessage) || (b === null || b === undefined ? 0 : b.buttonsMessage))) {
                    t.content.push({
                        tag: "biz",
                        attrs: {},
                        content: [{
                            tag: "interactive",
                            attrs: {
                                type: "native_flow",
                                v: "1"
                            },
                            content: [{
                                tag: "native_flow",
                                attrs: {
                                    name: "quick_reply"
                                }
                            }]
                        }]
                    });
                }
                if (G = Ka(b)) {
                    t.content.push({
                        tag: "biz",
                        attrs: {},
                        content: [{
                            tag: G,
                            attrs: La(b)
                        }]
                    });
                    m.debug({
                        jid: a
                    }, "adding business node");
                }
                m.debug({
                    msgId: e
                }, `sending message to ${N.length} devices`);
                await X(t);
                t = !!(0, _index3.normalizeMessageContent)(b)?.protocolMessage;
                G = r === _index4.PSA_WID || (0, _index4.isJidBot)(r) || (0, _index4.isJidMetaAI)(r);
                if (y && !t && !G && (0, _tcTokenUtils.shouldSendNewTcToken)(J?.senderTimestamp) && !fa.has(D)) {
                    fa.add(D);
                    const w = (0, _index3.unixTimestampSeconds)();
                    y = A.lidMapping.getPNForLID.bind(A.lidMapping);
                    (0, _tcTokenUtils.resolveIssuanceJid)(r, K.serverProps.lidTrustedTokenIssueToLid, ea, y).then(z => xa([z], w)).then(async z => {
                        await (0, _tcTokenUtils.storeTcTokensFromIqResult)({
                            result: z,
                            fallbackJid: D,
                            keys: u.keys,
                            getLIDForPN: ea
                        });
                        z = (await u.keys.get("tctoken", [D]))[D];
                        const Q = await (0, _tcTokenUtils.buildMergedTcTokenIndexWrite)(u.keys, [D]);
                        await u.keys.set({
                            tctoken: {
                                [D]: {
                                    token: Buffer.alloc(0),
                                    ...z,
                                    senderTimestamp: w
                                },
                                ...Q
                            }
                        });
                    }).catch(z => {
                        m.debug({
                            jid: r,
                            err: z?.message
                        }, "fire-and-forget tctoken issuance failed");
                    }).finally(() => {
                        fa.delete(D);
                    });
                }
                if (U && !d) {
                    U.addRecentMessage(r, e, b);
                }
            }
        }, g);
        return e;
    };
    const wa = a => (a = (0, _index3.normalizeMessageContent)(a)) ? a.reactionMessage || a.encReactionMessage ? "reaction" : a.pollCreationMessage || a.pollCreationMessageV2 || a.pollCreationMessageV3 || a.pollUpdateMessage ? "poll" : a.eventMessage ? "event" : va(a) !== "" ? "media" : "text" : "text";
    const va = a => a.imageMessage ? "image" : a.videoMessage ? a.videoMessage.gifPlayback ? "gif" : "video" : a.audioMessage ? a.audioMessage.ptt ? "ptt" : "audio" : a.contactMessage ? "vcard" : a.documentMessage ? "document" : a.contactsArrayMessage ? "contact_array" : a.liveLocationMessage ? "livelocation" : a.stickerMessage ? "sticker" : a.listMessage ? "list" : a.listResponseMessage ? "list_response" : a.buttonsResponseMessage ? "buttons_response" : a.orderMessage ? "order" : a.productMessage ? "product" : a.interactiveResponseMessage ? "native_flow_response" : a.groupInviteMessage ? "url" : "";
    const Ka = a => {
        if (a.buttonsMessage) {
            return "buttons";
        }
        if (a.buttonsResponseMessage) {
            return "buttons_response";
        }
        if (a.interactiveResponseMessage) {
            return "interactive_response";
        }
        if (a.listMessage) {
            return "list";
        }
        if (a.listResponseMessage) {
            return "list_response";
        }
    };
    const La = a => {
        if (a.templateMessage) {
            return {};
        }
        if (a.listMessage) {
            a = a.listMessage.listType;
            if (!a) {
                throw new boom_1.Boom("Expected list type inside message");
            }
            return {
                v: "2",
                type: ListType[a].toLowerCase()
            };
        }
        return {};
    };
    const xa = async (a, b) => {
        const e = (b ?? (0, _index3.unixTimestampSeconds)()).toString();
        return await da({
            tag: "iq",
            attrs: {
                to: _index4.S_WHATSAPP_NET,
                type: "set",
                xmlns: "privacy"
            },
            content: [{
                tag: "tokens",
                attrs: {},
                content: a.map(d => ({
                    tag: "token",
                    attrs: {
                        jid: (0, _index4.jidNormalizedUser)(d),
                        t: e,
                        type: "trusted_contact"
                    }
                }))
            }]
        });
    };
    const la = (0, _index3.getWAUploadToServer)(B, qa);
    const Ma = (0, _index3.bindWaitForEvent)(na, "messages.media-update");
    Ha(() => {
        if (!B.userDevicesCache && E.close) {
            E.close();
        }
        Y = undefined;
        if (U) {
            U.clear();
        }
    });
    return {
        ...K,
        userDevicesCache: E,
        devicesMutex: pa,
        issuePrivacyTokens: xa,
        assertSessions: Z,
        relayMessage: ca,
        sendReceipt: ra,
        sendReceipts: sa,
        readMessages: async a => {
            const b = (await oa()).readreceipts === "all" ? "read" : "read-self";
            await sa(a, b);
        },
        refreshMediaConn: qa,
        getMediaHost: () => ha,
        waUploadToServer: la,
        fetchPrivacySettings: oa,
        sendPeerDataOperationMessage: async a => {
            if (!u.creds.me?.id) {
                throw new _boom.Boom("Not authenticated");
            }
            a = {
                protocolMessage: {
                    peerDataOperationRequestMessage: a,
                    type: _index.proto.Message.ProtocolMessage.Type.PEER_DATA_OPERATION_REQUEST_MESSAGE
                }
            };
            const b = (0, _index4.jidNormalizedUser)(u.creds.me.id);
            return await ca(b, a, {
                additionalAttributes: {
                    category: "peer",
                    push_priority: "high_force"
                },
                additionalNodes: [{
                    tag: "meta",
                    attrs: {
                        appdata: "default"
                    }
                }]
            });
        },
        createParticipantNodes: aa,
        getUSyncDevices: ia,
        messageRetryManager: U,
        updateMemberLabel: (a, b) => ca(a, {
            protocolMessage: {
                type: _index.proto.Message.ProtocolMessage.Type.GROUP_MEMBER_LABEL_CHANGE,
                memberLabel: {
                    label: b?.slice(0, 30),
                    labelTimestamp: (0, _index3.unixTimestampSeconds)()
                }
            }
        }, {
            additionalNodes: [{
                tag: "meta",
                attrs: {
                    tag_reason: "user_update",
                    appdata: "member_tag"
                },
                content: undefined
            }]
        }),
        updateMediaMessage: async a => {
            const b = (0, _index3.assertMediaContent)(a.message);
            const e = b.mediaKey;
            const d = (0, _index3.encryptMediaRetryRequest)(a.key, e, u.creds.me.id);
            let c = undefined;
            await Promise.all([X(d), Ma(async k => {
                if (k = k.find(q => q.key.id === a.key.id)) {
                    if (k.error) {
                        c = k.error;
                    } else {
                        try {
                            const q = (0, _index3.decryptMediaRetryData)(k.media, e, k.key.id);
                            if (q.result !== _index.proto.MediaRetryNotification.ResultType.SUCCESS) {
                                throw new _boom.Boom(`Media re-upload failed by device (${_index.proto.MediaRetryNotification.ResultType[q.result]})`, {
                                    data: q,
                                    statusCode: (0, _index3.getStatusCodeForMediaRetry)(q.result) || 404
                                });
                            }
                            b.directPath = q.directPath;
                            b.url = (0, _index3.getUrlFromDirectPath)(b.directPath, ha);
                            m.debug({
                                directPath: q.directPath,
                                key: k.key
                            }, "media update successful");
                        } catch (q) {
                            c = q;
                        }
                    }
                    return true;
                }
            })]);
            if (c) {
                throw c;
            }
            na.emit("messages.update", [{
                key: a.key,
                update: {
                    message: a.message
                }
            }]);
            return a;
        },
        sendMessage: async (a, b, e = {}) => {
            var d = u.creds.me.id;
            if (typeof b === "object" && "disappearingMessagesInChat" in b && typeof b.disappearingMessagesInChat !== "undefined" && (0, _index4.isJidGroup)(a)) {
                ({
                    disappearingMessagesInChat: b
                } = b);
                await Ga(a, typeof b === "boolean" ? b ? _index2.WA_DEFAULT_EPHEMERAL : 0 : b);
            } else {
                const c = await (0, _index3.generateWAMessage)(a, b, {
                    logger: m,
                    userJid: d,
                    getUrlInfo: f => (0, _linkPreview.getUrlInfo)(f, {
                        thumbnailWidth: ya,
                        fetchOpts: {
                            timeout: 3000,
                            ...(Aa || {})
                        },
                        logger: m,
                        uploadImage: za ? la : undefined
                    }),
                    getProfilePicUrl: K.profilePictureUrl,
                    getCallLink: K.createCallLink,
                    upload: la,
                    mediaCache: B.mediaCache,
                    options: B.options,
                    messageId: (0, _index3.generateMessageIDV2)(K.user?.id),
                    ...e
                });
                d = "event" in b && !!b.event;
                const k = "edit" in b && !!b.edit;
                const q = "pin" in b && !!b.pin;
                const x = "poll" in b && !!b.poll;
                const v = {};
                const g = [];
                if ("delete" in b && b.delete) {
                    if ((0, _index4.isJidGroup)(b.delete?.remoteJid) && !b.delete?.fromMe) {
                        v.edit = "8";
                    } else {
                        v.edit = "7";
                    }
                } else if (k) {
                    v.edit = "1";
                } else if (q) {
                    v.edit = "2";
                } else if (x) {
                    g.push({
                        tag: "meta",
                        attrs: {
                            polltype: "creation"
                        }
                    });
                } else if (d) {
                    g.push({
                        tag: "meta",
                        attrs: {
                            event_type: "creation"
                        }
                    });
                }
                await ca(a, c.message, {
                    messageId: c.key.id,
                    useCachedGroupMetadata: e.useCachedGroupMetadata,
                    additionalAttributes: v,
                    statusJidList: e.statusJidList,
                    additionalNodes: g
                });
                if (B.emitOwnEvents) {
                    process.nextTick(async () => {
                        await Da.mutex(() => Ea(c, "append"));
                    });
                }
                return c;
            }
        }
    };
};
exports.makeMessagesSocket = makeMessagesSocket;