module.exports = [
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/lib/incremental-cache/tags-manifest.external.js [external] (next/dist/server/lib/incremental-cache/tags-manifest.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/lib/incremental-cache/tags-manifest.external.js", () => require("next/dist/server/lib/incremental-cache/tags-manifest.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/src/proxy.ts [middleware] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "config",
    ()=>config,
    "proxy",
    ()=>proxy
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [middleware] (ecmascript)");
;
/**
 * Proxy — runs on every request before the route handler.
 * (Renamed from middleware.ts per Next.js 16 convention)
 *
 * Responsibilities:
 * 1. Security headers (CSP, X-Frame-Options, X-Content-Type-Options, etc.)
 * 2. Basic rate limiting on auth endpoints (in-memory, per-IP)
 * 3. HTTPS redirect in production
 */ // ===== Security headers =====
const SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-DNS-Prefetch-Control': 'on',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'X-XSS-Protection': '1; mode=block',
    // CSP allows inline styles (Next.js requires them), inline scripts (dev),
    // images from self + data: + blob:, and connects to localhost (WebSocket)
    'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' data: blob: https:",
        "connect-src 'self' ws: wss: http://localhost:* https:",
        "media-src 'self' data: blob:",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
    ].join('; '),
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload'
};
// ===== Rate limiting (in-memory, per-IP) =====
// Limits for sensitive auth endpoints to prevent brute-force attacks.
const RATE_LIMITS = {
    '/api/auth/login': {
        window: 15 * 60 * 1000,
        max: 20
    },
    '/api/auth/signup': {
        window: 60 * 60 * 1000,
        max: 5
    },
    '/api/auth/forgot-password': {
        window: 60 * 60 * 1000,
        max: 5
    },
    '/api/auth/verify-otp': {
        window: 5 * 60 * 1000,
        max: 10
    },
    '/api/auth/verify-email/confirm': {
        window: 5 * 60 * 1000,
        max: 10
    },
    '/api/auth/verify-phone/confirm': {
        window: 5 * 60 * 1000,
        max: 10
    }
};
const ipHits = new Map() // endpoint → IP → timestamps
;
function checkRateLimit(endpoint, ip) {
    const config = RATE_LIMITS[endpoint];
    if (!config) return {
        allowed: true
    };
    if (!ipHits.has(endpoint)) ipHits.set(endpoint, new Map());
    const endpointMap = ipHits.get(endpoint);
    const now = Date.now();
    const hits = endpointMap.get(ip) || [];
    // Prune old hits
    const validHits = hits.filter((t)=>now - t < config.window);
    if (validHits.length >= config.max) {
        const oldestHit = Math.min(...validHits);
        const retryAfter = Math.ceil((config.window - (now - oldestHit)) / 1000);
        return {
            allowed: false,
            retryAfter
        };
    }
    validHits.push(now);
    endpointMap.set(ip, validHits);
    return {
        allowed: true
    };
}
function getClientIp(req) {
    const xff = req.headers.get('x-forwarded-for');
    if (xff) return xff.split(',')[0].trim();
    const xri = req.headers.get('x-real-ip');
    if (xri) return xri.trim();
    return 'unknown';
}
function proxy(req) {
    const { pathname } = req.nextUrl;
    const res = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].next();
    // 1. Apply security headers to ALL responses
    for (const [key, value] of Object.entries(SECURITY_HEADERS)){
        res.headers.set(key, value);
    }
    // 2. Rate limit sensitive auth endpoints
    const rateLimitConfig = RATE_LIMITS[pathname];
    if (rateLimitConfig && (req.method === 'POST' || req.method === 'GET')) {
        const ip = getClientIp(req);
        const { allowed, retryAfter } = checkRateLimit(pathname, ip);
        if (!allowed) {
            return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"](JSON.stringify({
                error: 'تم تجاوز عدد المحاولات المسموح. حاول لاحقاً.',
                retryAfter
            }), {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                    'Retry-After': String(retryAfter || 60),
                    ...SECURITY_HEADERS
                }
            });
        }
    }
    // 3. HTTPS redirect in production (skip for localhost / preview domains)
    const protocol = req.headers.get('x-forwarded-proto') || '';
    if (("TURBOPACK compile-time value", "development") === 'production' && protocol === 'http' && !req.nextUrl.hostname.includes('localhost') && !req.nextUrl.hostname.includes('preview')) //TURBOPACK unreachable
    ;
    return res;
}
const config = {
    // Run on all routes except static files in /_next and /brand
    matcher: [
        '/((?!_next/static|_next/image|brand|favicon.ico|manifest.json|robots.txt|sw.js).*)'
    ]
};
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__117aaa33._.js.map