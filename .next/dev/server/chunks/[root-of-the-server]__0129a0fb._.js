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
"[project]/src/lib/login-history.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getClientIp",
    ()=>getClientIp,
    "logLoginEvent",
    ()=>logLoginEvent
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
;
function getClientIp(req) {
    if (!req) return null;
    // Try common proxy headers
    const xForwardedFor = req.headers.get('x-forwarded-for');
    if (xForwardedFor) {
        // X-Forwarded-For can be a comma-separated list; take the first one
        return xForwardedFor.split(',')[0].trim();
    }
    const xRealIp = req.headers.get('x-real-ip');
    if (xRealIp) return xRealIp.trim();
    const cfConnectingIp = req.headers.get('cf-connecting-ip');
    if (cfConnectingIp) return cfConnectingIp.trim();
    return null;
}
async function logLoginEvent(userId, eventType, req, opts) {
    try {
        if (!userId) return; // can't log without a user reference
        const ipAddress = getClientIp(req) || null;
        const userAgent = req?.headers.get('user-agent') || null;
        // Best-effort: no IP geolocation in this lightweight impl, but the
        // schema supports country/city if we add a GeoIP service later.
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].loginEvent.create({
            data: {
                userId,
                eventType,
                success: opts?.success ?? true,
                failureReason: opts?.failureReason || null,
                ipAddress,
                userAgent,
                country: null,
                city: null,
                sessionToken: opts?.sessionToken || null,
                metadata: opts?.metadata ? JSON.stringify(opts.metadata) : null
            }
        });
    } catch (e) {
        // Non-critical — don't block the login flow
        console.error('[logLoginEvent] error:', e);
    }
}
}),
"[project]/src/app/api/auth/update-profile/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$session$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/session.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$login$2d$history$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/login-history.ts [app-route] (ecmascript)");
;
;
;
;
async function POST(req) {
    try {
        const user = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$session$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getAuthUser"])(req);
        if (!user) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Unauthorized'
        }, {
            status: 401
        });
        const body = await req.json();
        const { name } = body;
        const updates = {};
        if (typeof name === 'string') {
            const trimmed = name.trim();
            if (trimmed.length < 2) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: 'الاسم قصير جداً'
                }, {
                    status: 400
                });
            }
            if (trimmed.length > 50) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: 'الاسم طويل جداً (الحد الأقصى 50 حرف)'
                }, {
                    status: 400
                });
            }
            updates.name = trimmed;
        }
        if (Object.keys(updates).length === 0) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'لا توجد تعديلات'
            }, {
                status: 400
            });
        }
        const updated = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].user.update({
            where: {
                id: user.id
            },
            data: updates,
            select: {
                id: true,
                email: true,
                username: true,
                name: true,
                phone: true,
                countryCode: true,
                emailVerified: true,
                phoneVerified: true,
                role: true,
                egpBalance: true,
                usdtBalance: true,
                referralCode: true
            }
        });
        // Log the profile update as a security event
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$login$2d$history$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["logLoginEvent"])(user.id, 'PROFILE_UPDATE', req, {
            success: true,
            metadata: {
                updatedFields: Object.keys(updates)
            }
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            user: {
                ...updated,
                egpBalance: Number(updated.egpBalance),
                usdtBalance: Number(updated.usdtBalance)
            },
            message: 'تم تحديث الملف الشخصي'
        });
    } catch (e) {
        console.error('Update profile error:', e);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'حدث خطأ غير متوقع'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0129a0fb._.js.map