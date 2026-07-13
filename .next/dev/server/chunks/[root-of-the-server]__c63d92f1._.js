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
"[project]/src/lib/balance-sync.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "pushBalanceUpdate",
    ()=>pushBalanceUpdate,
    "pushBalanceUpdates",
    ()=>pushBalanceUpdates
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
;
async function pushBalanceUpdate(userId) {
    try {
        // Fetch the current balances from DB
        const user = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].user.findUnique({
            where: {
                id: userId
            },
            select: {
                egpBalance: true,
                usdtBalance: true
            }
        });
        if (!user) return;
        const balances = {
            egpBalance: Number(user.egpBalance),
            usdtBalance: Number(user.usdtBalance),
            timestamp: Date.now()
        };
        // Push to ticker-service which will broadcast via WebSocket to the user's sockets
        fetch('http://localhost:3004/balance-update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId,
                balances
            })
        }).catch(()=>{
        // Silently fail — balance will update on next fetchUser() call
        });
    } catch (e) {
    // Non-critical — don't block the transaction
    }
}
async function pushBalanceUpdates(userIds) {
    for (const userId of userIds){
        await pushBalanceUpdate(userId);
    }
}
}),
"[project]/src/app/api/p2p/cleanup-expired/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/money.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$notifications$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/notifications.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$balance$2d$sync$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/balance-sync.ts [app-route] (ecmascript)");
;
;
;
;
;
/**
 * POST /api/p2p/cleanup-expired
 * Auto-cancels P2P trades that have been in PENDING_PAYMENT for more than 30
 * minutes (default) without the buyer marking them as paid.
 *
 * This endpoint is meant to be called by the ticker-service cron job every
 * minute, but it's also safe to call manually.
 *
 * Settlement on auto-cancel:
 *  - Buyer's held EGP is refunded in full (including their fee side)
 *  - Seller's escrowed USDT is returned to the offer pool
 *  - Offer's usdtAmount is restored so it can be taken by other users
 *  - Both parties get a notification
 */ const AUTO_CANCEL_MINUTES = 30;
async function POST(req) {
    // Optional shared-secret check (cron jobs pass it via header)
    const authHeader = req.headers.get('x-cron-secret');
    const expectedSecret = process.env.CRON_SECRET;
    if (expectedSecret && authHeader !== expectedSecret) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Unauthorized'
        }, {
            status: 401
        });
    }
    const cutoff = new Date(Date.now() - AUTO_CANCEL_MINUTES * 60 * 1000);
    // Find expired PENDING_PAYMENT trades
    const expired = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].p2pTrade.findMany({
        where: {
            status: 'PENDING_PAYMENT',
            createdAt: {
                lt: cutoff
            }
        },
        include: {
            offer: true
        },
        take: 50
    });
    if (expired.length === 0) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            cancelled: 0,
            message: 'No expired trades'
        });
    }
    let cancelled = 0;
    const errors = [];
    for (const trade of expired){
        try {
            const feePerSide = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["roundEgp"])(Number(trade.feeEgp) / 2);
            const totalBuyerHeldEgp = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["roundEgp"])(Number(trade.egpAmount) + feePerSide);
            const usdtAmount = Number(trade.usdtAmount);
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].$transaction(async (tx)=>{
                // Refund buyer EGP
                const buyer = await tx.user.findUnique({
                    where: {
                        id: trade.buyerId
                    }
                });
                if (buyer) {
                    const newBuyerEgp = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["roundEgp"])(Number(buyer.egpBalance) + totalBuyerHeldEgp);
                    await tx.user.update({
                        where: {
                            id: trade.buyerId
                        },
                        data: {
                            egpBalance: newBuyerEgp
                        }
                    });
                    await tx.transaction.create({
                        data: {
                            userId: trade.buyerId,
                            type: 'P2P_TRADE',
                            direction: 'CREDIT',
                            currency: 'EGP',
                            amount: totalBuyerHeldEgp,
                            balanceAfter: newBuyerEgp,
                            description: `استرجاع EGP من إلغاء تلقائي (انتهاء مهلة الدفع) - ${trade.id}`,
                            referenceId: trade.id,
                            referenceType: 'P2P_TRADE_AUTO_CANCEL'
                        }
                    });
                }
                // Refund seller USDT (escrow)
                const seller = await tx.user.findUnique({
                    where: {
                        id: trade.sellerId
                    }
                });
                if (seller) {
                    const newSellerUsdt = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["roundUsdt"])(Number(seller.usdtBalance) + usdtAmount);
                    await tx.user.update({
                        where: {
                            id: trade.sellerId
                        },
                        data: {
                            usdtBalance: newSellerUsdt
                        }
                    });
                    await tx.transaction.create({
                        data: {
                            userId: trade.sellerId,
                            type: 'P2P_TRADE',
                            direction: 'CREDIT',
                            currency: 'USDT',
                            amount: usdtAmount,
                            balanceAfter: newSellerUsdt,
                            description: `استرجاع USDT من إلغاء تلقائي (انتهاء مهلة الدفع) - ${trade.id}`,
                            referenceId: trade.id,
                            referenceType: 'P2P_TRADE_AUTO_CANCEL'
                        }
                    });
                }
                // Restore offer's USDT amount
                if (trade.offer && trade.offer.status === 'ACTIVE') {
                    await tx.p2pOffer.update({
                        where: {
                            id: trade.offerId
                        },
                        data: {
                            usdtAmount: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["roundUsdt"])(Number(trade.offer.usdtAmount) + usdtAmount)
                        }
                    });
                }
                // Mark trade as cancelled
                await tx.p2pTrade.update({
                    where: {
                        id: trade.id
                    },
                    data: {
                        status: 'CANCELLED',
                        cancelledAt: new Date()
                    }
                });
            });
            // Push balance updates to both parties
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$balance$2d$sync$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["pushBalanceUpdates"])([
                trade.buyerId,
                trade.sellerId
            ]);
            // Notify both parties
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$notifications$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createNotification"])({
                userId: trade.buyerId,
                type: 'P2P',
                title: '⏰ انتهت مهلة الدفع',
                message: `تم إلغاء صفقة ${usdtAmount} USDT تلقائياً لعدم تأكيد الدفع خلال 30 دقيقة. تم استرجاع ${totalBuyerHeldEgp} EGP.`,
                metadata: {
                    tradeId: trade.id,
                    action: 'auto_cancel',
                    reason: 'PAYMENT_TIMEOUT'
                }
            });
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$notifications$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createNotification"])({
                userId: trade.sellerId,
                type: 'P2P',
                title: '⏰ انتهت مهلة دفع المشتري',
                message: `تم إلغاء صفقة ${usdtAmount} USDT تلقائياً لعدم تأكيد المشتري الدفع خلال 30 دقيقة. تم استرجاع USDT إلى رصيدك.`,
                metadata: {
                    tradeId: trade.id,
                    action: 'auto_cancel',
                    reason: 'PAYMENT_TIMEOUT'
                }
            });
            cancelled++;
        } catch (e) {
            console.error(`[cleanup] Failed to cancel trade ${trade.id}:`, e);
            errors.push(trade.id);
        }
    }
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        cancelled,
        errors: errors.length > 0 ? errors : undefined,
        message: `تم إلغاء ${cancelled} صفقة منتهية الصلاحية`
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__c63d92f1._.js.map