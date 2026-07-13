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
"[project]/src/lib/validation.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "generateOtp",
    ()=>generateOtp,
    "generateReferralCode",
    ()=>generateReferralCode,
    "isStrongPassword",
    ()=>isStrongPassword,
    "isValidEmail",
    ()=>isValidEmail,
    "isValidInternationalPhone",
    ()=>isValidInternationalPhone,
    "isValidUsername",
    ()=>isValidUsername,
    "maskEmail",
    ()=>maskEmail,
    "maskPhone",
    ()=>maskPhone,
    "normalizePhone",
    ()=>normalizePhone,
    "normalizeUsername",
    ()=>normalizeUsername,
    "passwordStrength",
    ()=>passwordStrength
]);
// Shared validation helpers used by auth API routes
// Keeps server-side rules in one place so they stay consistent.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Username: 3-20 chars, letters, digits, underscore, dot, hyphen
const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,20}$/;
function isValidEmail(email) {
    return EMAIL_RE.test(email.trim().toLowerCase());
}
function isValidUsername(username) {
    return USERNAME_RE.test(username.trim());
}
function normalizeUsername(username) {
    return username.trim().toLowerCase();
}
function normalizePhone(countryCode, phone) {
    const cc = countryCode.replace(/\s+/g, '');
    const local = phone.replace(/[\s\-()]/g, '').replace(/^0+/, '');
    return `${cc}${local}`;
}
function isValidInternationalPhone(fullPhone) {
    // +CC followed by 7-14 digits
    return /^\+\d{7,15}$/.test(fullPhone);
}
function isStrongPassword(password) {
    if (password.length < 8) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    if (!/[^A-Za-z0-9]/.test(password)) return false;
    return true;
}
function passwordStrength(password) {
    const checks = {
        length: password.length >= 8,
        lower: /[a-z]/.test(password),
        upper: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
        symbol: /[^A-Za-z0-9]/.test(password)
    };
    const score = Object.values(checks).filter(Boolean).length;
    const mapped = Math.max(0, Math.min(4, score - 1));
    const labels = [
        'weak',
        'fair',
        'good',
        'strong',
        'veryStrong'
    ];
    return {
        score: mapped,
        label: labels[mapped],
        checks
    };
}
function generateReferralCode(name) {
    const prefix = (name || 'EG').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase().padEnd(3, 'EG');
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `${prefix}${rand}`;
}
function generateOtp() {
    // 6-digit code
    return Math.floor(100000 + Math.random() * 900000).toString();
}
function maskEmail(email) {
    const [user, domain] = email.split('@');
    if (!domain || user.length <= 2) return email;
    const visible = user.slice(0, 2);
    return `${visible}${'*'.repeat(Math.min(user.length - 2, 6))}@${domain}`;
}
function maskPhone(phone) {
    // Show last 2 digits visible, mask middle
    if (phone.length <= 4) return phone;
    const last2 = phone.slice(-2);
    const prefix = phone.slice(0, Math.min(4, phone.length - 2));
    return `${prefix}${'*'.repeat(Math.min(phone.length - 4, 8))}${last2}`;
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
"[project]/src/lib/email.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "EMAIL_TEMPLATES",
    ()=>EMAIL_TEMPLATES,
    "sendEmail",
    ()=>sendEmail
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
;
let transporter = null;
let smtpConfigured = false;
async function getTransporter() {
    if (transporter) return transporter;
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!host || !user || !pass) {
        smtpConfigured = false;
        return null;
    }
    try {
        const nodemailer = await __turbopack_context__.A("[project]/node_modules/nodemailer/lib/nodemailer.js [app-route] (ecmascript, async loader)");
        transporter = nodemailer.default.createTransport({
            host,
            port: Number(port) || 587,
            secure: Number(port) === 465,
            auth: {
                user,
                pass
            }
        });
        smtpConfigured = true;
        return transporter;
    } catch (e) {
        console.error('[email] Failed to create transporter:', e);
        return null;
    }
}
/**
 * Check if the user has opted into a specific email category.
 */ async function checkUserPreference(userId, category) {
    try {
        const settings = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].userSettings.findUnique({
            where: {
                userId
            }
        });
        if (!settings) return true // default: allow
        ;
        if (!settings.notifyEmail) return false // master switch off
        ;
        switch(category){
            case 'security':
                return settings.emailSecurity;
            case 'deposits':
                return settings.emailDeposits;
            case 'withdrawals':
                return settings.emailWithdrawals;
            case 'p2p':
                return settings.emailP2p;
            case 'marketing':
                return settings.emailMarketing;
            default:
                return true;
        }
    } catch  {
        return true;
    }
}
async function sendEmail(userId, category, template) {
    try {
        // Check user preferences
        const allowed = await checkUserPreference(userId, category);
        if (!allowed) {
            return false // user opted out
            ;
        }
        // Get user email
        const user = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].user.findUnique({
            where: {
                id: userId
            },
            select: {
                email: true,
                name: true
            }
        });
        if (!user) return false;
        const transport = await getTransporter();
        const from = process.env.SMTP_FROM || 'no-reply@eg-money.com';
        if (!transport) {
            // Development mode: log to console
            console.log(`\n📧 [EMAIL DEV] To: ${user.email}`);
            console.log(`   Subject: ${template.subject}`);
            console.log(`   Category: ${category}`);
            console.log(`   Body: ${template.text.substring(0, 200)}...`);
            return true;
        }
        await transport.sendMail({
            from: `"Eg-Money" <${from}>`,
            to: user.email,
            subject: template.subject,
            text: template.text,
            html: template.html
        });
        return true;
    } catch (e) {
        console.error('[email] Send error:', e);
        return false;
    }
}
const EMAIL_TEMPLATES = {
    loginAlert: (ip, userAgent, time)=>({
            subject: '🔐 تسجيل دخول جديد لحسابك على Eg-Money',
            text: `تم تسجيل الدخول لحسابك من IP: ${ip} في ${time}\nالجهاز: ${userAgent}\nإن لم تكن أنت، يرجى تغيير كلمة المرور فوراً.`,
            html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #10b981;">🔐 تسجيل دخول جديد</h2>
        <p>تم تسجيل الدخول لحسابك على Eg-Money:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb; background: #f9fafb;">IP:</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${ip}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb; background: #f9fafb;">الوقت:</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${time}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb; background: #f9fafb;">الجهاز:</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${userAgent}</td></tr>
        </table>
        <p style="color: #ef4444; font-weight: bold;">إن لم تكن أنت، يرجى تغيير كلمة المرور فوراً.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="color: #6b7280; font-size: 12px;">Eg-Money — منصة تداول USDT بالجنيه المصري</p>
      </div>
    `
        }),
    depositApproved: (amount, currency)=>({
            subject: '✅ تم اعتماد إيداعك',
            text: `تم اعتماد إيداعك بقيمة ${amount} ${currency}. الرصيد متاح في محفظتك الآن.`,
            html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #10b981;">✅ تم اعتماد الإيداع</h2>
        <p>تم اعتماد إيداعك بنجاح:</p>
        <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <div style="font-size: 24px; font-weight: bold; color: #10b981;">${amount} ${currency}</div>
        </div>
        <p>الرصيد متاح في محفظتك الآن.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="color: #6b7280; font-size: 12px;">Eg-Money — منصة تداول USDT بالجنيه المصري</p>
      </div>
    `
        }),
    depositRejected: (amount, reason)=>({
            subject: '❌ تم رفض إيداعك',
            text: `تم رفض إيداعك بقيمة ${amount} EGP. السبب: ${reason}`,
            html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #ef4444;">❌ تم رفض الإيداع</h2>
        <p>نأسف، تم رفض إيداعك:</p>
        <div style="background: #fef2f2; border: 1px solid #ef4444; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <div style="font-size: 18px; font-weight: bold; color: #ef4444;">${amount} EGP</div>
          <div style="margin-top: 8px; color: #6b7280;">السبب: ${reason}</div>
        </div>
        <p>للمساعدة، تواصل مع الدعم على support@eg-money.com</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="color: #6b7280; font-size: 12px;">Eg-Money — منصة تداول USDT بالجنيه المصري</p>
      </div>
    `
        }),
    withdrawalProcessed: (amount, currency, method)=>({
            subject: '✅ تم معالجة سحبك',
            text: `تم معالجة سحبك بقيمة ${amount} ${currency} عبر ${method}.`,
            html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #10b981;">✅ تم معالجة السحب</h2>
        <p>تم معالجة طلب السحب بنجاح:</p>
        <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <div style="font-size: 24px; font-weight: bold; color: #10b981;">${amount} ${currency}</div>
          <div style="margin-top: 8px; color: #6b7280;">عبر: ${method}</div>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="color: #6b7280; font-size: 12px;">Eg-Money — منصة تداول USDT بالجنيه المصري</p>
      </div>
    `
        }),
    p2pTradeUpdate: (eventType, usdtAmount, details)=>{
        const subjects = {
            TAKEN: '🔔 عرضك P2P تم أخذه',
            PAID: '💰 تم تأكيد الدفع في صفقتك P2P',
            RELEASED: '✅ تم الإفراج عن USDT في صفقتك',
            CANCELLED: '❌ تم إلغاء صفقة P2P',
            DISPUTED: '⚠️ تم فتح نزاع في صفقتك',
            RESOLVED: '⚖️ تم حل النزاع في صفقتك'
        };
        return {
            subject: subjects[eventType] || 'تحديث صفقة P2P',
            text: `${details}\nالكمية: ${usdtAmount} USDT`,
            html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #8b5cf6;">${subjects[eventType] || 'تحديث صفقة P2P'}</h2>
          <div style="background: #f5f3ff; border: 1px solid #8b5cf6; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <div style="font-size: 20px; font-weight: bold; color: #8b5cf6;">${usdtAmount} USDT</div>
            <div style="margin-top: 8px; color: #6b7280;">${details}</div>
          </div>
          <p>تفاصيل أكثر في حسابك على Eg-Money.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
          <p style="color: #6b7280; font-size: 12px;">Eg-Money — منصة تداول USDT بالجنيه المصري</p>
        </div>
      `
        };
    },
    passwordChanged: ()=>({
            subject: '🔑 تم تغيير كلمة المرور',
            text: 'تم تغيير كلمة المرور لحسابك. إن لم تكن أنت، تواصل مع الدعم فوراً.',
            html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #f59e0b;">🔑 تم تغيير كلمة المرور</h2>
        <p>تم تغيير كلمة المرور الخاصة بحسابك على Eg-Money.</p>
        <p style="color: #ef4444;">إن لم تقم أنت بهذا التغيير، يرجى التواصل مع الدعم فوراً.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="color: #6b7280; font-size: 12px;">Eg-Money — منصة تداول USDT بالجنيه المصري</p>
      </div>
    `
        })
};
}),
"[project]/src/app/api/auth/login/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$validation$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/validation.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$notifications$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/notifications.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$login$2d$history$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/login-history.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$email$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/email.ts [app-route] (ecmascript)");
;
;
;
;
;
;
;
// Rate limiting: max 10 failed attempts per IP per 15 min
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const attempts = new Map();
function checkRateLimit(ip) {
    const now = Date.now();
    const entry = attempts.get(ip);
    if (!entry || now - entry.firstAt > RATE_LIMIT_WINDOW_MS) {
        attempts.set(ip, {
            count: 1,
            firstAt: now
        });
        return {
            allowed: true
        };
    }
    if (entry.count >= MAX_ATTEMPTS) {
        const retryAfterSec = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - entry.firstAt)) / 1000);
        return {
            allowed: false,
            retryAfterSec
        };
    }
    entry.count++;
    return {
        allowed: true
    };
}
function clearRateLimit(ip) {
    attempts.delete(ip);
}
// Resolve the identifier (username / email / phone) to a user
async function findUserByIdentifier(identifier) {
    const trimmed = identifier.trim();
    if (!trimmed) return null;
    // Try as email
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$validation$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isValidEmail"])(trimmed)) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].user.findUnique({
            where: {
                email: trimmed.toLowerCase()
            }
        });
    }
    // Try as international phone (starts with +)
    if (trimmed.startsWith('+') && (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$validation$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isValidInternationalPhone"])(trimmed)) {
        // Phone is nullable → use findFirst
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].user.findFirst({
            where: {
                phone: trimmed
            }
        });
    }
    // Try as username (normalized lowercase)
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$validation$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isValidUsername"])(trimmed)) {
        const normalized = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$validation$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["normalizeUsername"])(trimmed);
        return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].user.findUnique({
            where: {
                username: normalized
            }
        });
    }
    return null;
}
async function POST(req) {
    try {
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
        const rate = checkRateLimit(ip);
        if (!rate.allowed) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: `محاولات كثيرة فاشلة. حاول مرة أخرى بعد ${rate.retryAfterSec} ثانية`
            }, {
                status: 429
            });
        }
        const body = await req.json();
        const { identifier, password } = body;
        if (!identifier || !password) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'أدخل اسم المستخدم أو البريد أو الهاتف وكلمة المرور',
                field: 'identifier'
            }, {
                status: 400
            });
        }
        const user = await findUserByIdentifier(identifier);
        if (!user || !user.passwordHash || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["verifyPassword"])(password, user.passwordHash)) {
            // Log failed login attempt (if user exists)
            if (user) {
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$login$2d$history$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["logLoginEvent"])(user.id, 'FAILED_LOGIN', req, {
                    success: false,
                    failureReason: 'WRONG_PASSWORD'
                });
            }
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'بيانات الدخول غير صحيحة',
                field: 'identifier'
            }, {
                status: 401
            });
        }
        if (user.status !== 'ACTIVE') {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$login$2d$history$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["logLoginEvent"])(user.id, 'FAILED_LOGIN', req, {
                success: false,
                failureReason: 'SUSPENDED'
            });
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'هذا الحساب موقوف. تواصل مع الإدارة'
            }, {
                status: 403
            });
        }
        clearRateLimit(ip);
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].user.update({
            where: {
                id: user.id
            },
            data: {
                lastLoginAt: new Date()
            }
        });
        // Security notification: new login
        const userAgent = req.headers.get('user-agent') || 'unknown';
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$notifications$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createNotification"])({
            userId: user.id,
            type: 'SECURITY',
            title: '🔐 تسجيل دخول جديد',
            message: `تم تسجيل الدخول لحسابك من IP: ${ip} في ${new Date().toLocaleString('ar-EG')}`,
            metadata: {
                ip,
                userAgent: userAgent.substring(0, 100),
                action: 'LOGIN'
            }
        }).catch(()=>{}); // non-critical
        const token = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createSession"])(user.id);
        // Log successful login
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$login$2d$history$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["logLoginEvent"])(user.id, 'LOGIN', req, {
            success: true,
            sessionToken: token.substring(0, 16)
        });
        // Send email alert (respects user's emailSecurity preference)
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$email$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sendEmail"])(user.id, 'security', __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$email$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["EMAIL_TEMPLATES"].loginAlert(ip, userAgent.substring(0, 200), new Date().toLocaleString('ar-EG'))).catch(()=>{}); // non-critical
        const response = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            user: {
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
                emailVerified: user.emailVerified,
                phoneVerified: user.phoneVerified
            },
            token
        });
        response.cookies.set('session_token', token, {
            httpOnly: true,
            secure: ("TURBOPACK compile-time value", "development") === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
            path: '/'
        });
        return response;
    } catch (e) {
        console.error('Login error:', e);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'حدث خطأ غير متوقع'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__f70be316._.js.map