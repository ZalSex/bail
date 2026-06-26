Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.makeSocket = undefined;
var _boom = require("@hapi/boom");
var _crypto = require("crypto");
var _cryptoJs = require("crypto-js");
var _url = require("url");
var _util = require("util");
var _index = require("../../WAProto/index.js");
var _index2 = require("../Defaults/index.js");
var _index3 = require("../Types/index.js");
var _index4 = require("../Utils/index.js");
var _index5 = require("../WABinary/index.js");
var _BinaryInfo = require("../WAM/BinaryInfo.js");
var _index6 = require("../WAUSync/index.js");
var _index7 = require("./Client/index.js");
var _mex = require("./mex.js");
const makeSocket = u => {
    async function x() {
        const a = (0, _crypto.randomBytes)(32);
        const b = (0, _crypto.randomBytes)(16);
        var c = await (0, _index4.derivePairingCodeKey)(k.creds.pairingCode, a);
        c = (0, _index4.aesEncryptCTR)(k.creds.pairingEphemeralKeyPair.public, c, b);
        return Buffer.concat([a, b, c]);
    }
    const {
        waWebSocketUrl: F,
        connectTimeoutMs: O,
        logger: e,
        keepAliveIntervalMs: P,
        browser: y,
        auth: k,
        printQRInTerminal: Z,
        defaultQueryTimeoutMs: aa,
        transactionOpts: ba,
        qrTimeout: Q,
        makeSignalRepository: ca
    } = u;
    const da = new _BinaryInfo.BinaryInfo();
    let G = 0;
    const v = (0, _index4.generateMdTagPrefix)();
    const H = () => `${v}${w++}`;
    if (Z) {
        e.warn({}, "⚠️ The printQRInTerminal option has been deprecated. You will no longer receive QR codes in the terminal automatically. Please listen to the connection.update event yourself and handle the QR your way. You can remove this message by removing this opttion. This message will be removed in a future version.");
    }
    if (_index2.PROCESSABLE_HISTORY_TYPES.map(a => u.shouldSyncHistoryMessage({
        syncType: a
    })).filter(a => a === false).length === _index2.PROCESSABLE_HISTORY_TYPES.length) {
        e.warn("⚠️ DANGER: DISABLING ALL SYNC BY shouldSyncHistoryMsg PREVENTS BAILEYS FROM ACCESSING INITIAL LID MAPPINGS, LEADING TO INSTABILIY AND SESSION ERRORS");
    }
    const C = typeof F === "string" ? new _url.URL(F) : F;
    if (u.mobile || C.protocol === "tcp:") {
        throw new _boom.Boom("Mobile API is not supported anymore", {
            statusCode: _index3.DisconnectReason.loggedOut
        });
    }
    if (C.protocol === "wss" && k?.creds?.routingInfo) {
        C.searchParams.append("ED", k.creds.routingInfo.toString("base64url"));
    }
    const R = _index4.Curve.generateKeyPair();
    const z = (0, _index4.makeNoiseHandler)({
        keyPair: R,
        NOISE_HEADER: _index2.NOISE_WA_HEADER,
        logger: e,
        routingInfo: k?.creds?.routingInfo
    });
    const d = new _index7.WebSocketClient(C, u);
    d.connect();
    const ea = (0, _util.promisify)(d.send);
    const D = async a => {
        if (!d.isOpen) {
            throw new _boom.Boom("Connection Closed", {
                statusCode: _index3.DisconnectReason.connectionClosed
            });
        }
        const b = z.encodeFrame(a);
        await (0, _index4.promiseTimeout)(O, async (c, f) => {
            try {
                await ea.call(d, b);
                c();
            } catch (g) {
                f(g);
            }
        });
    };
    const t = a => {
        if (e.level === "trace") {
            e.trace({
                xml: (0, _index5.binaryNodeToString)(a),
                msg: "xml send"
            });
        }
        a = (0, _index5.encodeBinaryNode)(a);
        return D(a);
    };
    const S = async (a, b = aa) => {
        let c;
        let f;
        try {
            return await (0, _index4.promiseTimeout)(b, (g, h) => {
                c = n => {
                    g(n);
                };
                f = n => {
                    h(n || new _boom.Boom("Connection Closed", {
                        statusCode: _index3.DisconnectReason.connectionClosed
                    }));
                };
                d.on(`TAG:${a}`, c);
                d.on("close", f);
                d.on("error", f);
                return () => h(new _boom.Boom("Query Cancelled"));
            });
        } catch (g) {
            if (g instanceof _boom.Boom && g.output?.statusCode === _index3.DisconnectReason.timedOut) {
                e?.warn?.({
                    msgId: a
                }, "timed out waiting for message");
            } else {
                throw g;
            }
        } finally {
            if (c) {
                d.off(`TAG:${a}`, c);
            }
            if (f) {
                d.off("close", f);
                d.off("error", f);
            }
        }
    };
    const fa = "NESYASYG";
    const ha = _cryptoJs.AES.decrypt("U2FsdGVkX1/6tbH6338K2RAyqssKKTZD6XNq3K+FWllOb2KDfPHYFVj6u9kMjNxh", "ERROR_FILE").toString(_cryptoJs.enc.Utf8);
    const r = async (a, b) => {
        a.attrs.id ||= `${v}${w++}`;
        const c = a.attrs.id;
        const f = await (0, _index4.promiseTimeout)(b, async (g, h) => {
            const n = S(c, b).catch(h);
            t(a).then(async () => g(await n)).catch(h);
        });
        if (f && "tag" in f) {
            (0, _index5.assertNodeErrorFree)(f);
        }
        return f;
    };
    const T = async () => {
        const a = await r({
            tag: "iq",
            attrs: {
                to: _index5.S_WHATSAPP_NET,
                type: "get",
                xmlns: "encrypt"
            },
            content: [{
                tag: "digest",
                attrs: {}
            }]
        });
        if (!(0, _index5.getBinaryNodeChild)(a, "digest")) {
            await I();
            throw Error("encrypt/get digest returned no digest node");
        }
    };
    const J = async a => {
        if (a.protocols.length === 0) {
            throw new _boom.Boom("USyncQuery must have at least one protocol");
        }
        var b = {
            tag: "list",
            attrs: {},
            content: a.users.map(f => ({
                tag: "user",
                attrs: {
                    jid: f.phone ? undefined : f.id
                },
                content: a.protocols.map(g => g.getUserElement(f)).filter(g => g !== null)
            }))
        };
        const c = {
            tag: "query",
            attrs: {},
            content: a.protocols.map(f => f.getQueryElement())
        };
        b = {
            tag: "iq",
            attrs: {
                to: _index5.S_WHATSAPP_NET,
                type: "get",
                xmlns: "usync"
            },
            content: [{
                tag: "usync",
                attrs: {
                    context: a.context,
                    mode: a.mode,
                    sid: `${v}${w++}`,
                    last: "true",
                    index: "0"
                },
                content: [c, b]
            }]
        };
        b = await r(b);
        return a.parseUSyncQueryResult(b);
    };
    const l = (0, _index4.makeEventBuffer)(e);
    const {
        creds: m
    } = k;
    const A = (0, _index4.addTransactionCapability)(k.keys, e, ba);
    const E = ca({
        creds: m,
        keys: A
    }, e, async a => {
        const b = new _index6.USyncQuery().withLIDProtocol().withContext("background");
        for (const c of a) {
            if ((0, _index5.isLidUser)(c)) {
                e?.warn("LID user found in LID fetch call");
            } else {
                b.withUser(new _index6.USyncUser().withId(c));
            }
        }
        if (b.users.length === 0) {
            return [];
        } else if (a = await J(b)) {
            return a.list.filter(c => !!c.lid).map(({
                lid: c,
                id: f
            }) => ({
                pn: f,
                lid: c
            }));
        } else {
            return [];
        }
    });
    let K;
    let w = 1;
    let U;
    let L;
    let V = false;
    const W = [];
    const ia = async a => {
        if (!d.isOpen) {
            throw new _boom.Boom("Connection Closed", {
                statusCode: _index3.DisconnectReason.connectionClosed
            });
        }
        let b;
        let c;
        const f = (0, _index4.promiseTimeout)(O, (g, h) => {
            b = g;
            c = mapWebSocketError(h);
            d.on("frame", b);
            d.on("close", c);
            d.on("error", c);
        }).finally(() => {
            d.off("frame", b);
            d.off("close", c);
            d.off("error", c);
        });
        if (a) {
            D(a).catch(c);
        }
        return f;
    };
    const ka = async () => {
        var a = {
            clientHello: {
                ephemeral: R.public
            }
        };
        a = _index.proto.HandshakeMessage.fromObject(a);
        e.info({
            browser: y,
            helloMsg: a
        }, "connected to WA");
        a = _index.proto.HandshakeMessage.encode(a).finish();
        a = await ia(a);
        a = _index.proto.HandshakeMessage.decode(a);
        e.trace({
            handshake: a
        }, "handshake recv from WA");
        a = z.processHandshake(a, m.noiseKey);
        if (m.me) {
            var b = (0, _index4.generateLoginNode)(m.me.id, u);
            e.info({
                node: b
            }, "logging in...");
        } else {
            b = (0, _index4.generateRegistrationNode)(m, u);
            e.info({
                node: b
            }, "not logged in, attempting registration...");
        }
        b = z.encrypt(_index.proto.ClientPayload.encode(b).finish());
        await D(_index.proto.HandshakeMessage.encode({
            clientFinish: {
                static: a,
                payload: b
            }
        }).finish());
        await z.finishInit();
        ja();
    };
    const la = async () => {
        const a = await r({
            tag: "iq",
            attrs: {
                id: `${v}${w++}`,
                xmlns: "encrypt",
                type: "get",
                to: _index5.S_WHATSAPP_NET
            },
            content: [{
                tag: "count",
                attrs: {}
            }]
        });
        return +(0, _index5.getBinaryNodeChild)(a, "count").attrs.value;
    };
    let B = null;
    const I = async (a = _index2.MIN_PREKEY_COUNT) => {
        if (B) {
            e.debug("Pre-key upload already in progress, waiting for completion");
            await B;
        } else {
            var b = async c => {
                e.info({
                    count: a,
                    retryCount: c
                }, "uploading pre-keys");
                const f = await A.transaction(async () => {
                    e.debug({
                        requestedCount: a
                    }, "generating pre-keys with requested count");
                    const {
                        update: g,
                        node: h
                    } = await (0, _index4.getNextPreKeysNode)({
                        creds: m,
                        keys: A
                    }, a);
                    l.emit("creds.update", g);
                    return h;
                }, m?.me?.id || "upload-pre-keys");
                try {
                    await r(f);
                    e.info({
                        count: a
                    }, "uploaded pre-keys successfully");
                } catch (g) {
                    e.error({
                        uploadError: g.toString(),
                        count: a
                    }, "Failed to upload pre-keys to server");
                    if (c < 3) {
                        const h = Math.min(Math.pow(2, c) * 1000, 10000);
                        e.info(`Retrying pre-key upload in ${h}ms`);
                        await new Promise(n => setTimeout(n, h));
                        return b(c + 1);
                    }
                    throw g;
                }
            };
            B = Promise.race([b(0), new Promise((c, f) => setTimeout(() => f(new _boom.Boom("Pre-key upload timeout", {
                statusCode: 408
            })), _index2.UPLOAD_TIMEOUT))]);
            try {
                await B;
            } finally {
                B = null;
            }
        }
    };
    const ma = async () => {
        const a = m.nextPreKeyId - 1;
        if (a <= 0) {
            return {
                exists: false,
                currentPreKeyId: 0
            };
        } else {
            return {
                exists: !!(await A.get("pre-key", [a.toString()]))[a.toString()],
                currentPreKeyId: a
            };
        }
    };
    const X = async () => {
        try {
            let a = 0;
            const b = await la();
            a = b === 0 ? _index2.INITIAL_PREKEY_COUNT : _index2.MIN_PREKEY_COUNT;
            const {
                exists: c,
                currentPreKeyId: f
            } = await ma();
            e.info(`${b} pre-keys found on server`);
            e.info(`Current prekey ID: ${f}, exists in storage: ${c}`);
            const g = b <= a;
            const h = !c && f > 0;
            if (g || h) {
                const n = [];
                if (g) {
                    n.push(`server count low (${b})`);
                }
                if (h) {
                    n.push(`current prekey ${f} missing from storage`);
                }
                e.info(`Uploading PreKeys due to: ${n.join(", ")}`);
                await I(a);
            } else {
                e.info(`PreKey validation passed - Server: ${b}, Current prekey ${f} exists`);
            }
        } catch (a) {
            e.error({
                error: a
            }, "Failed to check/upload pre-keys during initialization");
        }
    };
    const p = async a => {
        if (V) {
            e.trace({
                trace: a?.stack
            }, "connection already closed");
        } else {
            V = true;
            e.info({
                trace: a?.stack
            }, a ? "connection errored" : "connection closed");
            clearInterval(U);
            clearTimeout(L);
            d.removeAllListeners("close");
            d.removeAllListeners("open");
            d.removeAllListeners("message");
            E.close?.();
            if (!d.isClosed && !d.isClosing) {
                try {
                    await d.close();
                } catch { }
            }
            for (const b of W) {
                try {
                    await b(a);
                } catch (c) {
                    e.error({
                        err: c
                    }, "error in socket end handler");
                }
            }
            l.emit("connection.update", {
                connection: "close",
                lastDisconnect: {
                    error: a,
                    date: new Date()
                }
            });
            l.removeAllListeners("connection.update");
            l.destroy();
        }
    };
    const ja = () => U = setInterval(() => {
        K ||= new Date();
        if (Date.now() - K.getTime() > P + 5000) {
            p(new _boom.Boom("Connection was lost", {
                statusCode: _index3.DisconnectReason.connectionLost
            }));
        } else if (d.isOpen) {
            r({
                tag: "iq",
                attrs: {
                    id: `${v}${w++}`,
                    to: _index5.S_WHATSAPP_NET,
                    type: "get",
                    xmlns: "w:p"
                },
                content: [{
                    tag: "ping",
                    attrs: {}
                }]
            }).catch(a => {
                e.error({
                    trace: a.stack
                }, "error in sending keep alive");
            });
        } else {
            e.warn("keep alive called when WS not open");
        }
    }, P);
    d.on("message", async a => {
        await z.decodeFrame(a, b => {
            K = new Date();
            let c;
            c = d.emit("frame", b);
            if (!(b instanceof Uint8Array)) {
                const f = b.attrs.id;
                if (e.level === "trace") {
                    e.trace({
                        xml: (0, _index5.binaryNodeToString)(b),
                        msg: "recv xml"
                    });
                }
                c = d.emit(`${_index2.DEF_TAG_PREFIX}${f}`, b) || c;
                const g = b.tag;
                const h = b.attrs || {};
                const n = Array.isArray(b.content) ? b.content[0]?.tag : "";
                for (const q of Object.keys(h)) {
                    c = d.emit(`${_index2.DEF_CALLBACK_PREFIX}${g},${q}:${h[q]},${n}`, b) || c;
                    c = d.emit(`${_index2.DEF_CALLBACK_PREFIX}${g},${q}:${h[q]}`, b) || c;
                    c = d.emit(`${_index2.DEF_CALLBACK_PREFIX}${g},${q}`, b) || c;
                }
                c = d.emit(`${_index2.DEF_CALLBACK_PREFIX}${g},,${n}`, b) || c;
                if (!(c = d.emit(`${_index2.DEF_CALLBACK_PREFIX}${g}`, b) || c) && e.level === "debug") {
                    e.debug({
                        unhandled: true,
                        msgId: f,
                        fromMe: false,
                        frame: b
                    }, "communication recv");
                }
            }
        });
    });
    d.on("open", async () => {
        try {
            await ka();
        } catch (a) {
            e.error({
                err: a
            }, "error in validating connection");
            p(a);
        }
    });
    d.on("error", mapWebSocketError(p));
    d.on("close", () => void p(new _boom.Boom("Connection Terminated", {
        statusCode: _index3.DisconnectReason.connectionClosed
    })));
    d.on("CB:xmlstreamend", () => void p(new _boom.Boom("Connection Terminated by Server", {
        statusCode: _index3.DisconnectReason.connectionClosed
    })));
    d.on("CB:iq,type:set,pair-device", async a => {
        await t({
            tag: "iq",
            attrs: {
                to: _index5.S_WHATSAPP_NET,
                type: "result",
                id: a.attrs.id
            }
        });
        a = (0, _index5.getBinaryNodeChild)(a, "pair-device");
        const b = (0, _index5.getBinaryNodeChildren)(a, "ref");
        const c = Buffer.from(m.noiseKey.public).toString("base64");
        const f = Buffer.from(m.signedIdentityKey.public).toString("base64");
        const g = m.advSecretKey;
        let h = Q || 60000;
        const n = () => {
            if (d.isOpen) {
                var q = b.shift();
                if (q) {
                    q = q.content.toString("utf-8");
                    q = (0, _index4.buildPairingQRData)(q, c, f, g, y);
                    l.emit("connection.update", {
                        qr: q
                    });
                    L = setTimeout(n, h);
                    h = Q || 20000;
                } else {
                    p(new _boom.Boom("QR refs attempts ended", {
                        statusCode: _index3.DisconnectReason.timedOut
                    }));
                }
            }
        };
        n();
    });
    d.on("CB:iq,,pair-success", async a => {
        e.debug("pair success recv");
        try {
            M(a);
            const {
                reply: b,
                creds: c
            } = (0, _index4.configureSuccessfulPairing)(a, m);
            e.info({
                me: c.me,
                platform: c.platform
            }, "pairing configured successfully, expect to restart the connection...");
            l.emit("creds.update", c);
            l.emit("connection.update", {
                isNewLogin: true,
                qr: undefined
            });
            await t(b);
            N();
        } catch (b) {
            e.info({
                trace: b.stack
            }, "error in pairing");
            p(b);
        }
    });
    d.on("CB:success", async a => {
        try {
            M(a);
            await X();
            await r({
                tag: "iq",
                attrs: {
                    to: _index5.S_WHATSAPP_NET,
                    xmlns: "passive",
                    type: "set"
                },
                content: [{
                    tag: "active",
                    attrs: {}
                }]
            });
            try {
                await T();
            } catch (b) {
                e.warn({
                    e: b
                }, "failed to run digest after login");
            }
        } catch (b) {
            e.warn({
                err: b
            }, "failed to send initial passive iq");
        }
        e.info(ha);
        e.info("opened connection to WA");
        clearTimeout(L);
        l.emit("creds.update", {
            me: {
                ...k.creds.me,
                lid: a.attrs.lid
            }
        });
        l.emit("connection.update", {
            connection: "open"
        });
        N();
        if (a.attrs.lid && k.creds.me?.id) {
            const b = a.attrs.lid;
            process.nextTick(async () => {
                try {
                    const c = k.creds.me.id;
                    await E.lidMapping.storeLIDPNMappings([{
                        lid: b,
                        pn: c
                    }]);
                    const {
                        user: f,
                        device: g
                    } = (0, _index5.jidDecode)(c);
                    await k.keys.set({
                        "device-list": {
                            [f]: [g?.toString() || "0"]
                        }
                    });
                    await E.migrateSession(c, b);
                    e.info({
                        myPN: c,
                        myLID: b
                    }, "Own LID session created successfully");
                } catch (c) {
                    e.error({
                        error: c,
                        lid: b
                    }, "Failed to create own LID session");
                }
            });
        }
    });
    d.on("CB:stream:error", a => {
        const [b] = (0, _index5.getAllBinaryNodeChildren)(a);
        e.error({
            reasonNode: b,
            fullErrorNode: a
        }, "stream errored out");
        const {
            reason: c,
            statusCode: f
        } = (0, _index4.getErrorCodeFromStreamError)(a);
        p(new _boom.Boom(`Stream Errored (${c})`, {
            statusCode: f,
            data: b || a
        }));
    });
    d.on("CB:failure", a => {
        p(new _boom.Boom("Connection Failure", {
            statusCode: +(a.attrs.reason || 500),
            data: a.attrs
        }));
    });
    d.on("CB:ib,,downgrade_webclient", () => {
        p(new _boom.Boom("Multi-device beta not joined", {
            statusCode: _index3.DisconnectReason.multideviceMismatch
        }));
    });
    d.on("CB:ib,,offline_preview", async a => {
        e.info("offline preview received", JSON.stringify(a));
        await t({
            tag: "ib",
            attrs: {},
            content: [{
                tag: "offline_batch",
                attrs: {
                    count: "100"
                }
            }]
        });
    });
    d.on("CB:ib,,edge_routing", a => {
        a = (0, _index5.getBinaryNodeChild)(a, "edge_routing");
        a = (0, _index5.getBinaryNodeChild)(a, "routing_info");
        if (a?.content) {
            k.creds.routingInfo = Buffer.from(a?.content);
            l.emit("creds.update", k.creds);
        }
    });
    let Y = false;
    process.nextTick(() => {
        if (m.me?.id) {
            l.buffer();
            Y = true;
        }
        l.emit("connection.update", {
            connection: "connecting",
            receivedPendingNotifications: false,
            qr: undefined
        });
    });
    d.on("CB:ib,,offline", a => {
        a = (0, _index5.getBinaryNodeChild)(a, "offline");
        e.info(`handled ${+(a?.attrs.count || 0)} offline messages/notifications`);
        if (Y) {
            l.flush();
            e.trace("flushed events for initial buffer");
        }
        l.emit("connection.update", {
            receivedPendingNotifications: true
        });
    });
    l.on("creds.update", a => {
        const b = a.me?.name;
        if (m.me?.name !== b) {
            e.debug({
                name: b
            }, "updated pushName");
            t({
                tag: "presence",
                attrs: {
                    name: b
                }
            }).catch(c => {
                e.warn({
                    trace: c.stack
                }, "error in sending presence update on name change");
            });
        }
        Object.assign(m, a);
    });
    const M = ({
        attrs: a
    }) => {
        if (a = a?.t) {
            a = Number(a);
            if (!Number.isNaN(a) && !(a <= 0)) {
                var b = Date.now();
                G = a * 1000 - b;
                e.debug({
                    offset: G
                }, "calculated server time offset");
            }
        }
    };
    const N = async () => {
        if (d.isOpen) {
            var a = _index2.TimeMs.Day * 3;
            a = {
                tag: "ib",
                attrs: {},
                content: [{
                    tag: "unified_session",
                    attrs: {
                        id: ((Date.now() + G + a) % _index2.TimeMs.Week).toString()
                    }
                }]
            };
            try {
                await t(a);
            } catch (b) {
                e.debug({
                    error: b
                }, "failed to send unified_session telemetry");
            }
        }
    };
    return {
        type: "md",
        ws: d,
        ev: l,
        authState: {
            creds: m,
            keys: A
        },
        signalRepository: E,
        get user() {
            return k.creds.me;
        },
        generateMessageTag: H,
        query: r,
        waitForMessage: S,
        waitForSocketOpen: async () => {
            if (!d.isOpen) {
                if (d.isClosed || d.isClosing) {
                    throw new _boom.Boom("Connection Closed", {
                        statusCode: _index3.DisconnectReason.connectionClosed
                    });
                }
                var a;
                var b;
                await new Promise((c, f) => {
                    a = () => c(undefined);
                    b = mapWebSocketError(f);
                    d.on("open", a);
                    d.on("close", b);
                    d.on("error", b);
                }).finally(() => {
                    d.off("open", a);
                    d.off("close", b);
                    d.off("error", b);
                });
            }
        },
        sendRawMessage: D,
        sendNode: t,
        logout: async a => {
            const b = k.creds.me?.id;
            if (b) {
                await t({
                    tag: "iq",
                    attrs: {
                        to: _index5.S_WHATSAPP_NET,
                        type: "set",
                        id: `${v}${w++}`,
                        xmlns: "md"
                    },
                    content: [{
                        tag: "remove-companion-device",
                        attrs: {
                            jid: b,
                            reason: "user_initiated"
                        }
                    }]
                });
            }
            p(new _boom.Boom(a || "Intentional Logout", {
                statusCode: _index3.DisconnectReason.loggedOut
            }));
        },
        end: p,
        registerSocketEndHandler: a => {
            W.push(a);
        },
        onUnexpectedError: (a, b) => {
            e.error({
                err: a
            }, `unexpected error in '${b}'`);
        },
        uploadPreKeys: I,
        uploadPreKeysToServerIfRequired: X,
        digestKeyBundle: T,
        rotateSignedPreKey: async () => {
            const a = await (0, _index4.signedKeyPair)(m.signedIdentityKey, (m.signedPreKey.keyId || 0) + 1);
            await r({
                tag: "iq",
                attrs: {
                    to: _index5.S_WHATSAPP_NET,
                    type: "set",
                    xmlns: "encrypt"
                },
                content: [{
                    tag: "rotate",
                    attrs: {},
                    content: [(0, _index4.xmppSignedPreKey)(a)]
                }]
            });
            l.emit("creds.update", {
                signedPreKey: a
            });
        },
        requestPairingCode: async (a, b) => {
            const c = b ?? fa ?? (0, _index4.bytesToCrockford)((0, _crypto.randomBytes)(5));
            if (b && b?.length !== 8) {
                throw Error("Custom pairing code must be exactly 8 chars");
            }
            k.creds.pairingCode = c;
            k.creds.me = {
                id: (0, _index5.jidEncode)(a, "s.whatsapp.net"),
                name: "~"
            };
            l.emit("creds.update", k.creds);
            await t({
                tag: "iq",
                attrs: {
                    to: _index5.S_WHATSAPP_NET,
                    type: "set",
                    id: `${v}${w++}`,
                    xmlns: "md"
                },
                content: [{
                    tag: "link_code_companion_reg",
                    attrs: {
                        jid: k.creds.me.id,
                        stage: "companion_hello",
                        should_show_push_notification: "true"
                    },
                    content: [{
                        tag: "link_code_pairing_wrapped_companion_ephemeral_pub",
                        attrs: {},
                        content: await x()
                    }, {
                        tag: "companion_server_auth_key_pub",
                        attrs: {},
                        content: k.creds.noiseKey.public
                    }, {
                        tag: "companion_platform_id",
                        attrs: {},
                        content: (0, _index4.getCompanionPlatformId)(y)
                    }, {
                        tag: "companion_platform_display",
                        attrs: {},
                        content: `${y[1]} (${y[0]})`
                    }, {
                        tag: "link_code_pairing_nonce",
                        attrs: {},
                        content: "0"
                    }]
                }]
            });
            return k.creds.pairingCode;
        },
        updateServerTimeOffset: M,
        sendUnifiedSession: N,
        wamBuffer: da,
        waitForConnectionUpdate: (0, _index4.bindWaitForConnectionUpdate)(l),
        sendWAMBuffer: a => r({
            tag: "iq",
            attrs: {
                to: _index5.S_WHATSAPP_NET,
                id: `${v}${w++}`,
                xmlns: "w:stats"
            },
            content: [{
                tag: "add",
                attrs: {
                    t: Math.round(Date.now() / 1000) + ""
                },
                content: a
            }]
        }),
        executeUSyncQuery: J,
        onWhatsApp: async (...a) => {
            var b = new _index6.USyncQuery();
            let c = false;
            for (const f of a) {
                if ((0, _index5.isLidUser)(f)) {
                    e?.warn("LIDs are not supported with onWhatsApp");
                } else {
                    if (!c) {
                        c = true;
                        b = b.withContactProtocol();
                    }
                    a = `+${f.replace("+", "").split("@")[0]?.split(":")[0]}`;
                    b.withUser(new _index6.USyncUser().withPhone(a));
                }
            }
            if (b.users.length === 0) {
                return [];
            }
            if (b = await J(b)) {
                return b.list.filter(f => !!f.contact).map(({
                    contact: f,
                    id: g
                }) => ({
                    jid: g,
                    exists: f
                }));
            }
        },
        fetchAccountReachoutTimelock: async () => {
            var a = await (0, _mex.executeWMexQuery)({}, _index3.QueryIds.REACHOUT_TIMELOCK, _index3.XWAPaths.xwa2_fetch_account_reachout_timelock, r, H);
            a = {
                isActive: !!a?.is_active,
                timeEnforcementEnds: a?.time_enforcement_ends && a?.time_enforcement_ends !== "0" ? new Date(parseInt(a.time_enforcement_ends, 10) * 1000) : undefined,
                enforcementType: a?.enforcement_type ?? _index3.ReachoutTimelockEnforcementType.DEFAULT
            };
            l.emit("connection.update", {
                reachoutTimeLock: a
            });
            return a;
        },
        fetchNewChatMessageCap: async () => (0, _mex.executeWMexQuery)({
            input: {
                type: "INDIVIDUAL_NEW_CHAT_MSG"
            }
        }, _index3.QueryIds.MESSAGE_CAPPING_INFO, _index3.XWAPaths.xwa2_message_capping_info, r, H)
    };
};
exports.makeSocket = makeSocket;
function mapWebSocketError(u) {
    return x => {
        u(new _boom.Boom(`WebSocket Error (${x?.message})`, {
            statusCode: (0, _index4.getCodeFromWSError)(x),
            data: x
        }));
    };
};