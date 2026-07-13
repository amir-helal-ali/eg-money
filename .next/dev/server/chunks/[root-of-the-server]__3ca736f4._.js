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
"[project]/src/app/api/settings/notifications/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "PATCH",
    ()=>PATCH
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$session$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/session.ts [app-route] (ecmascript)");
;
;
;
async function GET(req) {
    const user = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$session$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getAuthUser"])(req);
    if (!user) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        error: 'Unauthorized'
    }, {
        status: 401
    });
    const settings = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].userSettings.findUnique({
        where: {
            userId: user.id
        }
    });
    // Return defaults if no settings row exists yet
    const defaults = {
        notifyEmail: true,
        notifyPush: true,
        emailSecurity: true,
        emailDeposits: true,
        emailWithdrawals: true,
        emailP2p: true,
        emailMarketing: false,
        pushSecurity: true,
        pushDeposits: true,
        pushWithdrawals: true,
        pushP2p: true
    };
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        preferences: settings ? {
            notifyEmail: settings.notifyEmail,
            notifyPush: settings.notifyPush,
            emailSecurity: settings.emailSecurity,
            emailDeposits: settings.emailDeposits,
            emailWithdrawals: settings.emailWithdrawals,
            emailP2p: settings.emailP2p,
            emailMarketing: settings.emailMarketing,
            pushSecurity: settings.pushSecurity,
            pushDeposits: settings.pushDeposits,
            pushWithdrawals: settings.pushWithdrawals,
            pushP2p: settings.pushP2p
        } : defaults
    });
}
async function PATCH(req) {
    const user = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$session$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getAuthUser"])(req);
    if (!user) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        error: 'Unauthorized'
    }, {
        status: 401
    });
    const body = await req.json();
    const allowedFields = [
        'notifyEmail',
        'notifyPush',
        'emailSecurity',
        'emailDeposits',
        'emailWithdrawals',
        'emailP2p',
        'emailMarketing',
        'pushSecurity',
        'pushDeposits',
        'pushWithdrawals',
        'pushP2p'
    ];
    const updates = {};
    for (const field of allowedFields){
        if (typeof body[field] === 'boolean') {
            updates[field] = body[field];
        }
    }
    if (Object.keys(updates).length === 0) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'لا توجد تعديلات صالحة'
        }, {
            status: 400
        });
    }
    // Upsert: create settings row if it doesn't exist
    const updated = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].userSettings.upsert({
        where: {
            userId: user.id
        },
        update: updates,
        create: {
            userId: user.id,
            ...updates
        }
    });
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        success: true,
        preferences: {
            notifyEmail: updated.notifyEmail,
            notifyPush: updated.notifyPush,
            emailSecurity: updated.emailSecurity,
            emailDeposits: updated.emailDeposits,
            emailWithdrawals: updated.emailWithdrawals,
            emailP2p: updated.emailP2p,
            emailMarketing: updated.emailMarketing,
            pushSecurity: updated.pushSecurity,
            pushDeposits: updated.pushDeposits,
            pushWithdrawals: updated.pushWithdrawals,
            pushP2p: updated.pushP2p
        },
        message: 'تم تحديث تفضيلات الإشعارات'
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__3ca736f4._.js.map