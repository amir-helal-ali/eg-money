module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/src/lib/db.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "db",
    ()=>db
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs, [project]/node_modules/@prisma/client)");
;
const globalForPrisma = globalThis;
const db = globalForPrisma.prisma ?? new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["PrismaClient"]({
    log: [
        'query'
    ]
});
if ("TURBOPACK compile-time truthy", 1) globalForPrisma.prisma = db;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[project]/src/lib/auth.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "clearAllSessionsForUser",
    ()=>clearAllSessionsForUser,
    "createSession",
    ()=>createSession,
    "destroyAllUserSessions",
    ()=>destroyAllUserSessions,
    "destroySession",
    ()=>destroySession,
    "generateToken",
    ()=>generateToken,
    "getSession",
    ()=>getSession,
    "hashPassword",
    ()=>hashPassword,
    "verifyPassword",
    ()=>verifyPassword
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
;
// Simple secure password hashing using PBKDF2 (no external deps needed)
const ITERATIONS = 10000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';
function hashPassword(password) {
    const salt = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["randomBytes"])(16).toString('hex');
    const hash = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["createHash"])('sha512').update(salt + password).digest('hex');
    // Multi-round hashing for added security
    let final = hash;
    for(let i = 0; i < ITERATIONS; i++){
        final = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["createHash"])(DIGEST).update(salt + final).digest('hex');
    }
    return `${salt}:${final}`;
}
function verifyPassword(password, stored) {
    const [salt, hash] = stored.split(':');
    if (!salt || !hash) return false;
    let final = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["createHash"])('sha512').update(salt + password).digest('hex');
    for(let i = 0; i < ITERATIONS; i++){
        final = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["createHash"])(DIGEST).update(salt + final).digest('hex');
    }
    return final === hash;
}
function generateToken() {
    return (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["randomBytes"])(32).toString('hex');
}
const globalForSessions = globalThis;
const sessions = globalForSessions.__sessions ?? new Map();
if (!globalForSessions.__sessions) {
    globalForSessions.__sessions = sessions;
}
if ("TURBOPACK compile-time truthy", 1) {
    globalForSessions.__sessions = sessions;
}
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7 // 7 days
;
function createSession(userId) {
    const token = generateToken();
    sessions.set(token, {
        userId,
        token,
        expiresAt: Date.now() + SESSION_TTL_MS
    });
    return token;
}
function getSession(token) {
    const session = sessions.get(token);
    if (!session) return null;
    if (session.expiresAt < Date.now()) {
        sessions.delete(token);
        return null;
    }
    return session;
}
function destroySession(token) {
    sessions.delete(token);
}
function clearAllSessionsForUser(userId) {
    for (const [token, session] of sessions.entries()){
        if (session.userId === userId) {
            sessions.delete(token);
        }
    }
}
const destroyAllUserSessions = clearAllSessionsForUser;
}),
"[project]/src/lib/session.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getAuthUser",
    ()=>getAuthUser,
    "requireAdmin",
    ()=>requireAdmin
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth.ts [app-route] (ecmascript)");
;
;
async function getAuthUser(req) {
    const authHeader = req.headers.get('authorization');
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
    } else {
        token = req.cookies.get('session_token')?.value ?? null;
    }
    if (!token) return null;
    const session = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSession"])(token);
    if (!session) return null;
    const user = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].user.findUnique({
        where: {
            id: session.userId
        }
    });
    if (!user) return null;
    if (user.status !== 'ACTIVE') return null;
    return {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        phone: user.phone,
        countryCode: user.countryCode,
        role: user.role,
        egpBalance: Number(user.egpBalance),
        usdtBalance: Number(user.usdtBalance),
        status: user.status,
        referralCode: user.referralCode,
        googleId: user.googleId,
        googleAvatar: user.googleAvatar,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified
    };
}
async function requireAdmin(req) {
    const user = await getAuthUser(req);
    if (!user) return null;
    if (user.role !== 'ADMIN') return null;
    return user;
}
}),
"[project]/src/lib/money.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "creditEgp",
    ()=>creditEgp,
    "creditUsdt",
    ()=>creditUsdt,
    "debitEgp",
    ()=>debitEgp,
    "debitUsdt",
    ()=>debitUsdt,
    "formatEgp",
    ()=>formatEgp,
    "formatUsdt",
    ()=>formatUsdt,
    "getSettings",
    ()=>getSettings,
    "roundEgp",
    ()=>roundEgp,
    "roundUsdt",
    ()=>roundUsdt
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
;
function roundEgp(n) {
    return Math.round(n * 100) / 100;
}
function roundUsdt(n) {
    return Math.round(n * 1_000_000) / 1_000_000;
}
function formatEgp(n) {
    return new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(n);
}
function formatUsdt(n) {
    return new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 6
    }).format(n);
}
async function creditEgp(userId, amount, type, description, referenceId, referenceType) {
    const user = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].user.findUnique({
        where: {
            id: userId
        }
    });
    if (!user) throw new Error('USER_NOT_FOUND');
    const newBalance = roundEgp(Number(user.egpBalance) + amount);
    const [updated] = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].$transaction([
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].user.update({
            where: {
                id: userId
            },
            data: {
                egpBalance: newBalance
            }
        }),
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].transaction.create({
            data: {
                userId,
                type,
                direction: 'CREDIT',
                currency: 'EGP',
                amount: roundEgp(amount),
                balanceAfter: newBalance,
                description,
                referenceId,
                referenceType
            }
        })
    ]);
    return updated;
}
async function debitEgp(userId, amount, type, description, referenceId, referenceType) {
    const user = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].user.findUnique({
        where: {
            id: userId
        }
    });
    if (!user) throw new Error('USER_NOT_FOUND');
    const currentEgp = Number(user.egpBalance);
    if (currentEgp < amount) throw new Error('INSUFFICIENT_EGP_BALANCE');
    const newBalance = roundEgp(currentEgp - amount);
    const [updated] = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].$transaction([
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].user.update({
            where: {
                id: userId
            },
            data: {
                egpBalance: newBalance
            }
        }),
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].transaction.create({
            data: {
                userId,
                type,
                direction: 'DEBIT',
                currency: 'EGP',
                amount: roundEgp(amount),
                balanceAfter: newBalance,
                description,
                referenceId,
                referenceType
            }
        })
    ]);
    return updated;
}
async function creditUsdt(userId, amount, type, description, referenceId, referenceType) {
    const user = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].user.findUnique({
        where: {
            id: userId
        }
    });
    if (!user) throw new Error('USER_NOT_FOUND');
    const newBalance = roundUsdt(Number(user.usdtBalance) + amount);
    const [updated] = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].$transaction([
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].user.update({
            where: {
                id: userId
            },
            data: {
                usdtBalance: newBalance
            }
        }),
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].transaction.create({
            data: {
                userId,
                type,
                direction: 'CREDIT',
                currency: 'USDT',
                amount: roundUsdt(amount),
                balanceAfter: newBalance,
                description,
                referenceId,
                referenceType
            }
        })
    ]);
    return updated;
}
async function debitUsdt(userId, amount, type, description, referenceId, referenceType) {
    const user = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].user.findUnique({
        where: {
            id: userId
        }
    });
    if (!user) throw new Error('USER_NOT_FOUND');
    const currentUsdt = Number(user.usdtBalance);
    if (currentUsdt < amount) throw new Error('INSUFFICIENT_USDT_BALANCE');
    const newBalance = roundUsdt(currentUsdt - amount);
    const [updated] = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].$transaction([
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].user.update({
            where: {
                id: userId
            },
            data: {
                usdtBalance: newBalance
            }
        }),
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].transaction.create({
            data: {
                userId,
                type,
                direction: 'DEBIT',
                currency: 'USDT',
                amount: roundUsdt(amount),
                balanceAfter: newBalance,
                description,
                referenceId,
                referenceType
            }
        })
    ]);
    return updated;
}
async function getSettings() {
    let settings = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].settings.findFirst();
    if (!settings) {
        settings = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].settings.create({
            data: {}
        });
    }
    return {
        id: settings.id,
        buyPriceEgp: Number(settings.buyPriceEgp),
        sellPriceEgp: Number(settings.sellPriceEgp),
        minTradeEgp: Number(settings.minTradeEgp),
        maxTradeEgp: Number(settings.maxTradeEgp),
        minP2pEgp: Number(settings.minP2pEgp),
        maxP2pEgp: Number(settings.maxP2pEgp),
        p2pFeePercent: Number(settings.p2pFeePercent),
        platformFeePercent: Number(settings.platformFeePercent),
        googleOAuthEnabled: !!settings.googleOAuthEnabled,
        googleClientId: settings.googleClientId || '',
        googleClientSecret: settings.googleClientSecret || '',
        requireEmailVerification: !!settings.requireEmailVerification,
        requirePhoneVerification: !!settings.requirePhoneVerification,
        depositDailyLimitEgp: Number(settings.depositDailyLimitEgp),
        depositMonthlyLimitEgp: Number(settings.depositMonthlyLimitEgp)
    };
}
}),
"[project]/src/lib/notifications.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createNotification",
    ()=>createNotification,
    "createNotifications",
    ()=>createNotifications
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
;
async function createNotification({ userId, type, title, message, metadata }) {
    try {
        const notification = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].notification.create({
            data: {
                userId,
                type,
                title,
                message,
                metadata: metadata ? JSON.stringify(metadata) : null
            }
        });
        // Build the notification payload for the client
        const payload = {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            read: notification.read,
            metadata: notification.metadata ? JSON.parse(notification.metadata) : null,
            createdAt: notification.createdAt
        };
        // Push to ticker-service via HTTP (it will broadcast via WebSocket to the user's sockets)
        // Fire-and-forget — don't block the response
        fetch('http://localhost:3004/notify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId,
                notification: payload
            })
        }).catch(()=>{
        // Silently fail — notification is already in the DB, will be fetched on next poll
        });
        return notification;
    } catch (e) {
        console.error('[notifications] Failed to create notification:', e);
        return null;
    }
}
async function createNotifications(inputs) {
    try {
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].notification.createMany({
            data: inputs.map((i)=>({
                    userId: i.userId,
                    type: i.type,
                    title: i.title,
                    message: i.message,
                    metadata: i.metadata ? JSON.stringify(i.metadata) : null
                }))
        });
    } catch (e) {
        console.error('[notifications] Failed to create notifications:', e);
    }
}
}),
"[project]/src/lib/verify-guard.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "requireVerified",
    ()=>requireVerified
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$session$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/session.ts [app-route] (ecmascript)");
;
;
;
async function requireVerified(req) {
    const user = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$session$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getAuthUser"])(req);
    if (!user) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Unauthorized'
        }, {
            status: 401
        });
    }
    const settings = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].settings.findFirst();
    const requireEmail = settings?.requireEmailVerification ?? true;
    const requirePhone = settings?.requirePhoneVerification ?? true;
    if (requireEmail && !user.emailVerified) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'يجب تأكيد البريد الإلكتروني أولاً',
            code: 'EMAIL_NOT_VERIFIED'
        }, {
            status: 403
        });
    }
    if (requirePhone && user.phone && !user.phoneVerified) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'يجب تأكيد رقم الهاتف أولاً',
            code: 'PHONE_NOT_VERIFIED'
        }, {
            status: 403
        });
    }
    return null // all good, continue
    ;
}
}),
"[project]/src/app/api/p2p/offers/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DELETE",
    ()=>DELETE,
    "GET",
    ()=>GET,
    "PATCH",
    ()=>PATCH,
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$session$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/session.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/money.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$notifications$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/notifications.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$verify$2d$guard$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/verify-guard.ts [app-route] (ecmascript)");
;
;
;
;
;
;
async function GET(req) {
    const url = new URL(req.url);
    const type = url.searchParams.get('type') // BUY | SELL
    ;
    const paymentMethod = url.searchParams.get('paymentMethod') // VODAFONE_CASH | INSTAPAY | FAWRY | BANK_TRANSFER
    ;
    const minPriceStr = url.searchParams.get('minPrice');
    const maxPriceStr = url.searchParams.get('maxPrice');
    const minAmountStr = url.searchParams.get('minAmount');
    const maxAmountStr = url.searchParams.get('maxAmount');
    const search = url.searchParams.get('q')?.trim() // username substring
    ;
    const sort = url.searchParams.get('sort') || 'price_asc' // price_asc | price_desc | newest | amount_desc
    ;
    const where = {
        status: 'ACTIVE'
    };
    if (type === 'BUY' || type === 'SELL') {
        where.type = type;
    }
    if (paymentMethod) {
        where.paymentMethods = {
            contains: `"${paymentMethod}"`
        };
    }
    const minPrice = minPriceStr ? Number(minPriceStr) : null;
    const maxPrice = maxPriceStr ? Number(maxPriceStr) : null;
    if (minPrice !== null && !isNaN(minPrice)) where.priceEgp = {
        ...where.priceEgp || {},
        gte: minPrice
    };
    if (maxPrice !== null && !isNaN(maxPrice)) where.priceEgp = {
        ...where.priceEgp || {},
        lte: maxPrice
    };
    const minAmount = minAmountStr ? Number(minAmountStr) : null;
    const maxAmount = maxAmountStr ? Number(maxAmountStr) : null;
    if (minAmount !== null && !isNaN(minAmount)) where.usdtAmount = {
        ...where.usdtAmount || {},
        gte: minAmount
    };
    if (maxAmount !== null && !isNaN(maxAmount)) where.usdtAmount = {
        ...where.usdtAmount || {},
        lte: maxAmount
    };
    if (search) {
        where.user = {
            OR: [
                {
                    username: {
                        contains: search
                    }
                },
                {
                    name: {
                        contains: search
                    }
                }
            ]
        };
    }
    const orderBy = sort === 'newest' ? {
        createdAt: 'desc'
    } : sort === 'amount_desc' ? {
        usdtAmount: 'desc'
    } : sort === 'price_desc' ? {
        priceEgp: 'desc'
    } : {
        priceEgp: 'asc'
    } // default: price_asc (best price first)
    ;
    const offers = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].p2pOffer.findMany({
        where,
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    createdAt: true,
                    username: true,
                    p2pTradesCount: true,
                    p2pRatingSum: true,
                    p2pRatingCount: true,
                    emailVerified: true,
                    phoneVerified: true
                }
            }
        },
        orderBy,
        take: 200
    });
    // Batch-check online status for all offer owners
    const userIds = offers.map((o)=>o.userId);
    let onlineMap = {};
    try {
        const res = await fetch('http://localhost:3004/online-status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userIds
            })
        });
        if (res.ok) {
            const data = await res.json();
            onlineMap = data.online || {};
        }
    } catch  {
    // Non-critical — default to offline
    }
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        offers: offers.map((o)=>{
            const ratingAvg = o.user.p2pRatingCount > 0 ? o.user.p2pRatingSum / o.user.p2pRatingCount : 0;
            return {
                id: o.id,
                type: o.type,
                usdtAmount: Number(o.usdtAmount),
                priceEgp: Number(o.priceEgp),
                minOrderEgp: Number(o.minOrderEgp),
                maxOrderEgp: Number(o.maxOrderEgp),
                paymentMethods: JSON.parse(o.paymentMethods),
                status: o.status,
                createdAt: o.createdAt,
                user: {
                    id: o.user.id,
                    name: o.user.name || 'مستخدم',
                    username: o.user.username,
                    memberSince: o.user.createdAt,
                    tradesCount: o.user.p2pTradesCount,
                    ratingAvg: Math.round(ratingAvg * 10) / 10,
                    ratingCount: o.user.p2pRatingCount,
                    verified: o.user.emailVerified && o.user.phoneVerified,
                    online: onlineMap[o.user.id] || false
                }
            };
        })
    });
}
async function POST(req) {
    try {
        const verifyError = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$verify$2d$guard$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["requireVerified"])(req);
        if (verifyError) return verifyError;
        const user = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$session$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getAuthUser"])(req);
        if (!user) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Unauthorized'
        }, {
            status: 401
        });
        const body = await req.json();
        const { type, usdtAmount, priceEgp, minOrderEgp, maxOrderEgp, paymentMethods } = body;
        if (!type || type !== 'BUY' && type !== 'SELL') {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'النوع يجب أن يكون BUY أو SELL'
            }, {
                status: 400
            });
        }
        const usdt = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["roundUsdt"])(Number(usdtAmount));
        const price = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["roundEgp"])(Number(priceEgp));
        if (usdt <= 0 || price <= 0) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'الكمية والسعر يجب أن يكونا موجبين'
            }, {
                status: 400
            });
        }
        const settings = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSettings"])();
        if (price < settings.minP2pEgp || price > settings.maxP2pEgp) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: `السعر خارج النطاق المسموح (${settings.minP2pEgp} - ${settings.maxP2pEgp} جنيه)`
            }, {
                status: 400
            });
        }
        if (!Array.isArray(paymentMethods) || paymentMethods.length === 0) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'حدد طريقة دفع واحدة على الأقل'
            }, {
                status: 400
            });
        }
        const validMethods = [
            'VODAFONE_CASH',
            'INSTAPAY',
            'FAWRY',
            'BANK_TRANSFER'
        ];
        for (const m of paymentMethods){
            if (!validMethods.includes(m)) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: `طريقة دفع غير صحيحة: ${m}`
                }, {
                    status: 400
                });
            }
        }
        // If SELL offer, escrow the USDT immediately
        if (type === 'SELL') {
            if (user.usdtBalance < usdt) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: 'رصيد USDT غير كافٍ'
                }, {
                    status: 400
                });
            }
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["debitUsdt"])(user.id, usdt, 'P2P_TRADE', `حجز USDT لإعلان بيع P2P`, undefined, 'P2P_ESCROW');
        }
        const offer = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].p2pOffer.create({
            data: {
                userId: user.id,
                type,
                usdtAmount: usdt,
                priceEgp: price,
                minOrderEgp: Number(minOrderEgp) || settings.minP2pEgp,
                maxOrderEgp: Number(maxOrderEgp) || settings.maxP2pEgp,
                paymentMethods: JSON.stringify(paymentMethods)
            }
        });
        const updatedUser = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].user.findUnique({
            where: {
                id: user.id
            }
        });
        // Notify admins about new P2P offer (only for larger amounts ≥ 100 USDT)
        if (usdt >= 100) {
            const admins = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].user.findMany({
                where: {
                    role: 'ADMIN',
                    status: 'ACTIVE'
                }
            });
            for (const admin of admins){
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$notifications$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createNotification"])({
                    userId: admin.id,
                    type: 'P2P',
                    title: '📢 إعلان P2P جديد',
                    message: `${user.name || user.email} نشر إعلان ${type === 'BUY' ? 'شراء' : 'بيع'} ${usdt} USDT @ ${price} EGP.`,
                    metadata: {
                        offerId: offer.id,
                        usdtAmount: usdt,
                        priceEgp: price,
                        userId: user.id,
                        action: 'admin_p2p'
                    }
                });
            }
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            offer: {
                id: offer.id,
                type: offer.type,
                usdtAmount: Number(offer.usdtAmount),
                priceEgp: Number(offer.priceEgp),
                minOrderEgp: Number(offer.minOrderEgp),
                maxOrderEgp: Number(offer.maxOrderEgp),
                paymentMethods,
                status: offer.status,
                createdAt: offer.createdAt
            },
            balances: {
                egpBalance: updatedUser ? Number(updatedUser.egpBalance) : 0,
                usdtBalance: updatedUser ? Number(updatedUser.usdtBalance) : 0
            },
            message: 'تم إنشاء الإعلان بنجاح'
        });
    } catch (e) {
        console.error('P2P offer create error:', e);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'حدث خطأ غير متوقع'
        }, {
            status: 500
        });
    }
}
async function DELETE(req) {
    try {
        const user = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$session$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getAuthUser"])(req);
        if (!user) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Unauthorized'
        }, {
            status: 401
        });
        const url = new URL(req.url);
        const offerId = url.searchParams.get('id');
        if (!offerId) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'معرف الإعلان مطلوب'
        }, {
            status: 400
        });
        const offer = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].p2pOffer.findUnique({
            where: {
                id: offerId
            }
        });
        if (!offer) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'الإعلان غير موجود'
        }, {
            status: 404
        });
        if (offer.userId !== user.id) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'غير مصرح'
        }, {
            status: 403
        });
        if (offer.status !== 'ACTIVE') {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'لا يمكن إلغاء إعلان مكتمل'
            }, {
                status: 400
            });
        }
        // If SELL offer, refund escrowed USDT
        if (offer.type === 'SELL') {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["creditUsdt"])(user.id, Number(offer.usdtAmount), 'P2P_TRADE', `استرجاع USDT من إعلان ملغى`, offer.id, 'P2P_ESCROW_REFUND');
        }
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].p2pOffer.update({
            where: {
                id: offerId
            },
            data: {
                status: 'CANCELLED'
            }
        });
        const updatedUser = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].user.findUnique({
            where: {
                id: user.id
            }
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            balances: {
                egpBalance: updatedUser ? Number(updatedUser.egpBalance) : 0,
                usdtBalance: updatedUser ? Number(updatedUser.usdtBalance) : 0
            },
            message: 'تم إلغاء الإعلان'
        });
    } catch (e) {
        console.error('P2P offer cancel error:', e);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'حدث خطأ غير متوقع'
        }, {
            status: 500
        });
    }
}
async function PATCH(req) {
    try {
        const user = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$session$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getAuthUser"])(req);
        if (!user) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Unauthorized'
        }, {
            status: 401
        });
        const body = await req.json();
        const { id, priceEgp, usdtAmount, minOrderEgp, maxOrderEgp, paymentMethods } = body;
        if (!id) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'معرف الإعلان مطلوب'
        }, {
            status: 400
        });
        const offer = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].p2pOffer.findUnique({
            where: {
                id
            }
        });
        if (!offer) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'الإعلان غير موجود'
        }, {
            status: 404
        });
        if (offer.userId !== user.id) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'غير مصرح'
        }, {
            status: 403
        });
        if (offer.status !== 'ACTIVE') {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'لا يمكن تعديل إعلان غير نشط'
            }, {
                status: 400
            });
        }
        const settings = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSettings"])();
        const updates = {};
        if (priceEgp !== undefined) {
            const price = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["roundEgp"])(Number(priceEgp));
            if (price <= 0) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'السعر غير صالح'
            }, {
                status: 400
            });
            if (price < settings.minP2pEgp || price > settings.maxP2pEgp) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: `السعر خارج النطاق المسموح (${settings.minP2pEgp} - ${settings.maxP2pEgp} جنيه)`
                }, {
                    status: 400
                });
            }
            updates.priceEgp = price;
        }
        if (usdtAmount !== undefined) {
            const newUsdt = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["roundUsdt"])(Number(usdtAmount));
            if (newUsdt <= 0) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'الكمية غير صالحة'
            }, {
                status: 400
            });
            // For SELL offers, adjusting the amount affects the USDT escrow.
            // If increasing the amount, the user must have enough extra USDT.
            // If decreasing, refund the difference.
            if (offer.type === 'SELL') {
                const currentAmount = Number(offer.usdtAmount);
                const diff = newUsdt - currentAmount;
                if (diff > 0) {
                    // Need to escrow more
                    const fresh = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].user.findUnique({
                        where: {
                            id: user.id
                        }
                    });
                    if (!fresh || Number(fresh.usdtBalance) < diff) {
                        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                            error: 'رصيد USDT غير كافٍ لزيادة الكمية'
                        }, {
                            status: 400
                        });
                    }
                    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["debitUsdt"])(user.id, diff, 'P2P_TRADE', `زيادة كمية إعلان بيع`, id, 'P2P_ESCROW');
                } else if (diff < 0) {
                    // Refund the reduction
                    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["creditUsdt"])(user.id, -diff, 'P2P_TRADE', `استرجاع USDT من تخفيض كمية إعلان`, id, 'P2P_ESCROW_REFUND');
                }
            }
            updates.usdtAmount = newUsdt;
        }
        if (minOrderEgp !== undefined) {
            updates.minOrderEgp = Number(minOrderEgp) || settings.minP2pEgp;
        }
        if (maxOrderEgp !== undefined) {
            updates.maxOrderEgp = Number(maxOrderEgp) || settings.maxP2pEgp;
        }
        if (paymentMethods !== undefined) {
            if (!Array.isArray(paymentMethods) || paymentMethods.length === 0) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: 'حدد طريقة دفع واحدة على الأقل'
                }, {
                    status: 400
                });
            }
            const validMethods = [
                'VODAFONE_CASH',
                'INSTAPAY',
                'FAWRY',
                'BANK_TRANSFER'
            ];
            for (const m of paymentMethods){
                if (!validMethods.includes(m)) {
                    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                        error: `طريقة دفع غير صحيحة: ${m}`
                    }, {
                        status: 400
                    });
                }
            }
            updates.paymentMethods = JSON.stringify(paymentMethods);
        }
        const updated = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].p2pOffer.update({
            where: {
                id
            },
            data: updates
        });
        const updatedUser = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].user.findUnique({
            where: {
                id: user.id
            }
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            offer: {
                id: updated.id,
                type: updated.type,
                usdtAmount: Number(updated.usdtAmount),
                priceEgp: Number(updated.priceEgp),
                minOrderEgp: Number(updated.minOrderEgp),
                maxOrderEgp: Number(updated.maxOrderEgp),
                paymentMethods: JSON.parse(updated.paymentMethods),
                status: updated.status
            },
            balances: {
                egpBalance: updatedUser ? Number(updatedUser.egpBalance) : 0,
                usdtBalance: updatedUser ? Number(updatedUser.usdtBalance) : 0
            },
            message: 'تم تعديل الإعلان'
        });
    } catch (e) {
        console.error('P2P offer edit error:', e);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'حدث خطأ غير متوقع'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__aa90b40c._.js.map