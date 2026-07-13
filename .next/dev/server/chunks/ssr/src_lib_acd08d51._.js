module.exports = [
"[project]/src/lib/client.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PAYMENT_METHODS",
    ()=>PAYMENT_METHODS,
    "apiCall",
    ()=>apiCall,
    "fmtEgp",
    ()=>fmtEgp,
    "fmtUsdt",
    ()=>fmtUsdt,
    "methodIcon",
    ()=>methodIcon,
    "methodLabel",
    ()=>methodLabel,
    "showError",
    ()=>showError,
    "showSuccess",
    ()=>showSuccess,
    "useAuth",
    ()=>useAuth
]);
// Lightweight API client + auth store using Zustand
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/sonner/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$socket$2e$io$2d$client$2f$build$2f$esm$2d$debug$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/socket.io-client/build/esm-debug/index.js [app-ssr] (ecmascript) <locals>");
'use client';
;
;
;
// Singleton WebSocket for balance updates (separate from ticker/notif sockets)
let balanceSocket = null;
const useAuth = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["create"])((set, get)=>({
        user: null,
        loading: false,
        initialized: false,
        settings: null,
        fetchUser: async ()=>{
            try {
                const res = await fetch('/api/auth/me', {
                    credentials: 'include'
                });
                if (res.ok) {
                    const data = await res.json();
                    set({
                        user: data.user,
                        initialized: true
                    });
                    // Connect balance WS after login
                    connectBalanceWS(data.user.id);
                } else {
                    set({
                        user: null,
                        initialized: true
                    });
                    disconnectBalanceWS();
                }
            } catch  {
                set({
                    user: null,
                    initialized: true
                });
            }
        },
        fetchSettings: async ()=>{
            try {
                const res = await fetch('/api/settings', {
                    credentials: 'include'
                });
                if (res.ok) {
                    const data = await res.json();
                    set({
                        settings: data.settings
                    });
                }
            } catch  {}
        },
        logout: async ()=>{
            disconnectBalanceWS();
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
            set({
                user: null
            });
        },
        setUser: (u)=>set({
                user: u
            }),
        updateBalance: (egp, usdt)=>{
            const current = get().user;
            if (!current) return;
            set({
                user: {
                    ...current,
                    egpBalance: egp,
                    usdtBalance: usdt
                }
            });
        }
    }));
// Connect to WebSocket for real-time balance updates
function connectBalanceWS(userId) {
    if (balanceSocket) return; // already connected
    const isDev = ("TURBOPACK compile-time value", "development") !== 'production';
    const tickerUrl = ("TURBOPACK compile-time truthy", 1) ? `${window.location.protocol}//${window.location.hostname}:3003` : "TURBOPACK unreachable";
    balanceSocket = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$socket$2e$io$2d$client$2f$build$2f$esm$2d$debug$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["io"])(tickerUrl, {
        transports: [
            'websocket',
            'polling'
        ],
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 3000,
        reconnectionDelayMax: 10000,
        timeout: 10000,
        query: {
            XTransformPort: '3003'
        }
    });
    balanceSocket.on('connect', ()=>{
        // Authenticate with session token
        fetch('/api/notifications/ws-token', {
            credentials: 'include'
        }).then((res)=>res.ok ? res.json() : null).then((data)=>{
            if (data?.token) {
                balanceSocket.emit('authenticate', {
                    token: data.token
                });
            }
        }).catch(()=>{});
    });
    // Listen for real-time balance updates
    balanceSocket.on('balance:update', (data)=>{
        useAuth.getState().updateBalance(data.egpBalance, data.usdtBalance);
    });
    // Silently handle connection errors (ticker-service may not be running yet)
    balanceSocket.on('connect_error', ()=>{});
    balanceSocket.on('reconnect_failed', ()=>{
        // After 10 failed attempts, stop trying silently
        if (balanceSocket) {
            balanceSocket.disconnect();
            balanceSocket = null;
        }
    });
    balanceSocket.on('disconnect', ()=>{});
}
function disconnectBalanceWS() {
    if (balanceSocket) {
        balanceSocket.disconnect();
        balanceSocket = null;
    }
}
async function apiCall(url, options = {}) {
    try {
        const res = await fetch(url, {
            ...options,
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers || {}
            }
        });
        const data = await res.json().catch(()=>({}));
        if (!res.ok) {
            return {
                error: data.error || 'حدث خطأ غير متوقع',
                status: res.status
            };
        }
        return {
            data,
            status: res.status
        };
    } catch (e) {
        return {
            error: e?.message || 'فشل الاتصال بالخادم',
            status: 0
        };
    }
}
function showError(error) {
    if (error) __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toast"].error(error);
}
function showSuccess(msg) {
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toast"].success(msg);
}
function fmtEgp(n) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(n || 0);
}
function fmtUsdt(n) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6
    }).format(n || 0);
}
const PAYMENT_METHODS = [
    {
        value: 'VODAFONE_CASH',
        label: 'فودافون كاش',
        icon: '📱'
    },
    {
        value: 'INSTAPAY',
        label: 'إنستا باي',
        icon: '⚡'
    },
    {
        value: 'FAWRY',
        label: 'فوري',
        icon: '🏪'
    },
    {
        value: 'BANK_TRANSFER',
        label: 'تحويل بنكي',
        icon: '🏦'
    }
];
function methodLabel(value) {
    return PAYMENT_METHODS.find((m)=>m.value === value)?.label || value;
}
function methodIcon(value) {
    return PAYMENT_METHODS.find((m)=>m.value === value)?.icon || '💳';
}
}),
"[project]/src/lib/translations.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// ===== Translation dictionary =====
// Every user-facing string in the platform is here.
// To add a new language: copy the 'en' object, change the key, translate values.
__turbopack_context__.s([
    "t",
    ()=>t,
    "translations",
    ()=>translations
]);
const translations = {
    // ===== Landing Page =====
    landing: {
        nav: {
            features: {
                ar: 'المميزات',
                en: 'Features'
            },
            how: {
                ar: 'كيف نعمل',
                en: 'How It Works'
            },
            pricing: {
                ar: 'الأسعار',
                en: 'Pricing'
            },
            faq: {
                ar: 'الأسئلة الشائعة',
                en: 'FAQ'
            },
            login: {
                ar: 'دخول',
                en: 'Login'
            },
            getStarted: {
                ar: 'ابدأ الآن',
                en: 'Get Started'
            },
            getStartedShort: {
                ar: 'ابدأ',
                en: 'Start'
            },
            openMenu: {
                ar: 'فتح القائمة',
                en: 'Open menu'
            },
            backHome: {
                ar: 'العودة للرئيسية',
                en: 'Back to home'
            }
        },
        mobileMenu: {
            marketPrice: {
                ar: 'سعر السوق',
                en: 'Market Price'
            },
            featuresDesc: {
                ar: 'كل ما تحتاجه في منصة واحدة',
                en: 'Everything in one platform'
            },
            howDesc: {
                ar: 'ابدأ في 3 خطوات بسيطة',
                en: 'Start in 3 simple steps'
            },
            pricingDesc: {
                ar: 'رسوم شفافة بدون مفاجآت',
                en: 'Transparent fees, no surprises'
            },
            faqDesc: {
                ar: 'إجابات على كل أسئلتك',
                en: 'Answers to all your questions'
            },
            createAccount: {
                ar: 'أنشئ حسابك مجاناً',
                en: 'Create your free account'
            },
            lightMode: {
                ar: 'الوضع الفاتح',
                en: 'Light Mode'
            },
            darkMode: {
                ar: 'الوضع الداكن',
                en: 'Dark Mode'
            },
            langToggle: {
                ar: 'EN / عربي',
                en: 'EN / عربي'
            }
        },
        hero: {
            badge: {
                ar: 'منصة مصرية متكاملة',
                en: 'Integrated Egyptian Platform'
            },
            badgeSuffix: {
                ar: 'أسعار السوق الحية',
                en: 'Live Market Prices'
            },
            title1: {
                ar: 'بِع واشترِ',
                en: 'Buy & Sell'
            },
            title2: {
                ar: 'بالجنيه المصري',
                en: 'in Egyptian Pounds'
            },
            subtitle: {
                ar: 'بثقة المصارف وسرعة التقنية',
                en: 'Bank-grade trust, tech speed'
            },
            description: {
                ar: 'منصة مصرية متكاملة لتداول USDT بالجنيه المصري. تداول مباشر، سوق P2P ذكي بنظام ضمان Escrow، وإيداع وسحب عبر فودافون كاش، إنستا باي، وفوري.',
                en: 'An integrated Egyptian platform for trading USDT with EGP. Direct trading, smart P2P market with Escrow, and deposits/withdrawals via Vodafone Cash, InstaPay, and Fawry.'
            },
            ctaPrimary: {
                ar: 'أنشئ حسابك مجاناً',
                en: 'Create your free account'
            },
            ctaSecondary: {
                ar: 'لديّ حساب',
                en: 'I have an account'
            },
            trust1: {
                ar: 'بدون رسوم خفية',
                en: 'No hidden fees'
            },
            trust2: {
                ar: 'تنفيذ فوري',
                en: 'Instant execution'
            },
            trust3: {
                ar: 'نظام ضمان Escrow',
                en: 'Escrow protection'
            },
            trust4: {
                ar: 'مراجعة بشرية',
                en: 'Human review'
            },
            instantExecution: {
                ar: 'تنفيذ فوري',
                en: 'Instant execution'
            },
            escrowProtected: {
                ar: 'Escrow محمي',
                en: 'Escrow protected'
            }
        },
        ticker: {
            lastPrice: {
                ar: 'آخر سعر',
                en: 'Last price'
            },
            buy: {
                ar: 'شراء USDT',
                en: 'Buy USDT'
            },
            buyHint: {
                ar: '(تدفع)',
                en: '(you pay)'
            },
            sell: {
                ar: 'بيع USDT',
                en: 'Sell USDT'
            },
            sellHint: {
                ar: '(تستلم)',
                en: '(you receive)'
            },
            spread: {
                ar: 'Spread (هامش المنصة)',
                en: 'Spread (platform margin)'
            },
            perUSDT: {
                ar: '/ USDT',
                en: '/ USDT'
            },
            volume24h: {
                ar: '24h حجم',
                en: '24h Volume'
            },
            change24h: {
                ar: '24h تغيّر',
                en: '24h Change'
            },
            high24h: {
                ar: 'أعلى 24h',
                en: 'High 24h'
            },
            low24h: {
                ar: 'أدنى 24h',
                en: 'Low 24h'
            },
            activeOffers: {
                ar: 'عروض نشطة',
                en: 'Active offers'
            },
            onlineUsers: {
                ar: 'مستخدمين أونلاين',
                en: 'Users online'
            },
            p2pFee: {
                ar: 'رسوم P2P',
                en: 'P2P Fee'
            },
            directFee: {
                ar: 'رسوم مباشر',
                en: 'Direct Fee'
            },
            connected: {
                ar: 'سعر السوق',
                en: 'Market Price'
            },
            connecting: {
                ar: 'جارٍ الاتصال',
                en: 'Connecting'
            },
            reconnecting: {
                ar: 'إعادة الاتصال',
                en: 'Reconnecting'
            },
            disconnected: {
                ar: 'غير متصل',
                en: 'Offline'
            },
            reconnectingMsg: {
                ar: 'جارٍ إعادة الاتصال...',
                en: 'Reconnecting...'
            },
            offlineMsg: {
                ar: 'غير متصل — البيانات قد لا تكون محدّثة',
                en: 'Offline — data may be outdated'
            }
        },
        trust: {
            title1: {
                ar: 'معتمد بأعلى معايير الأمان',
                en: 'Certified to highest security standards'
            },
            sub1: {
                ar: 'شهادات وامتثالات دولية',
                en: 'International certifications & compliance'
            },
            title2: {
                ar: 'شركاؤنا في النجاح',
                en: 'Our partners'
            },
            sub2: {
                ar: 'نعمل مع أفضل العلامات في مصر والعالم',
                en: 'Working with top brands in Egypt & worldwide'
            }
        },
        features: {
            badge: {
                ar: 'التقنية والقوة',
                en: 'Tech & Power'
            },
            title1: {
                ar: 'كل ما تحتاجه لتبادل USDT',
                en: 'Everything you need to trade USDT'
            },
            title2: {
                ar: 'في منصة واحدة قوية',
                en: 'in one powerful platform'
            },
            description: {
                ar: 'تصميم حديث يجمع بين السرعة، الأمان، وسهولة الاستخدام — مُحسّن للمستخدم المصري',
                en: 'Modern design combining speed, security, and ease of use — optimized for Egyptian users'
            },
            p2pTitle: {
                ar: 'سوق P2P ذكي',
                en: 'Smart P2P Market'
            },
            p2pDesc: {
                ar: 'تداول مباشر بين المستخدمين بأسعار حرة تحددها أنت. نظام ضمان Escrow آلي يحجز USDT حتى تأكيد استلام الجنيه — حماية كاملة من الاحتيال.',
                en: 'Direct trading between users at prices you set. Automated Escrow system locks USDT until EGP receipt is confirmed — complete fraud protection.'
            },
            p2pFee: {
                ar: 'رسوم الصفقة',
                en: 'Trade fee'
            },
            p2pTime: {
                ar: 'وقت التنفيذ',
                en: 'Execution time'
            },
            p2pEscrow: {
                ar: 'محمي Escrow',
                en: 'Escrow protected'
            },
            only: {
                ar: 'فقط',
                en: 'only'
            },
            instantTitle: {
                ar: 'تداول فوري',
                en: 'Instant Trading'
            },
            instantDesc: {
                ar: 'شراء/بيع USDT مباشرة من المنصة. تنفيذ لحظي.',
                en: 'Buy/sell USDT directly from the platform. Instant execution.'
            },
            securityTitle: {
                ar: 'أمان متقدم',
                en: 'Advanced Security'
            },
            securityDesc: {
                ar: 'PBKDF2 + معاملات atomic مسجّلة بالكامل.',
                en: 'PBKDF2 + fully logged atomic transactions.'
            },
            paymentsTitle: {
                ar: 'طرق دفع مصرية',
                en: 'Egyptian Payment Methods'
            },
            paymentsDesc: {
                ar: 'كل وسائل الدفع المحلية في مكان واحد',
                en: 'All local payment methods in one place'
            },
            techTitle: {
                ar: 'معمارية حديثة',
                en: 'Modern Architecture'
            },
            techDesc: {
                ar: 'مبنية على Next.js 16 + Prisma + TypeScript. APIs atomic مع rollback تلقائي.',
                en: 'Built on Next.js 16 + Prisma + TypeScript. Atomic APIs with auto rollback.'
            },
            successRate: {
                ar: 'نسبة نجاح الصفقات',
                en: 'Trade success rate'
            },
            avgTime: {
                ar: 'متوسط وقت التنفيذ',
                en: 'Avg execution time'
            }
        },
        how: {
            badge: {
                ar: 'بساطة الاستخدام',
                en: 'Simplicity'
            },
            title1: {
                ar: 'ابدأ في',
                en: 'Start in'
            },
            title2: {
                ar: '3 خطوات',
                en: '3 Steps'
            },
            subtitle: {
                ar: 'من التسجيل إلى أول صفقة في أقل من 5 دقائق',
                en: 'From signup to first trade in under 5 minutes'
            },
            step1Title: {
                ar: 'أنشئ حسابك',
                en: 'Create your account'
            },
            step1Desc: {
                ar: 'سجّل ببريدك ورقم هاتفك. لا حاجة لـ KYC معقد — فقط بياناتك الأساسية.',
                en: 'Register with your email and phone. No complex KYC — just your basic info.'
            },
            step2Title: {
                ar: 'أودع الجنيه',
                en: 'Deposit EGP'
            },
            step2Desc: {
                ar: 'حوّل جنيهاتك عبر فودافون كاش أو إنستا باي. الاعتماد خلال دقائق.',
                en: 'Transfer your EGP via Vodafone Cash or InstaPay. Approved in minutes.'
            },
            step3Title: {
                ar: 'ابدأ التداول',
                en: 'Start trading'
            },
            step3Desc: {
                ar: 'اشترِ USDT مباشرة، أو اعرضه في P2P، أو انضم لصفقة جاهزة.',
                en: 'Buy USDT directly, list it on P2P, or join an existing trade.'
            }
        },
        comparison: {
            badge: {
                ar: 'لماذا نحن أفضل؟',
                en: 'Why we are better?'
            },
            title1: {
                ar: 'مقارنة',
                en: 'Transparent'
            },
            title2: {
                ar: 'شفافة',
                en: 'Comparison'
            },
            subtitle: {
                ar: 'لا نطلب منك أن تصدقنا — قارن الأرقام بنفسك',
                en: 'Don\'t take our word for it — compare the numbers yourself'
            },
            best: {
                ar: 'الأفضل',
                en: 'Best'
            },
            criteria: {
                ar: 'المعيار',
                en: 'Criteria'
            },
            banks: {
                ar: 'البنوك التقليدية',
                en: 'Traditional Banks'
            },
            foreign: {
                ar: 'منصات أجنبية',
                en: 'Foreign Platforms'
            },
            fees: {
                ar: 'الرسوم',
                en: 'Fees'
            },
            execTime: {
                ar: 'وقت التنفيذ',
                en: 'Execution Time'
            },
            localDeposit: {
                ar: 'إيداع محلي',
                en: 'Local Deposit'
            },
            localWithdraw: {
                ar: 'سحب محلي',
                en: 'Local Withdrawal'
            },
            fairRate: {
                ar: 'سعر صرف عادل',
                en: 'Fair Exchange Rate'
            },
            minAmount: {
                ar: 'حد أدنى',
                en: 'Minimum'
            },
            arabicSupport: {
                ar: 'دعم عربي',
                en: 'Arabic Support'
            },
            transparency: {
                ar: 'شفافية الرسوم',
                en: 'Fee Transparency'
            },
            disclaimer: {
                ar: '* المقارنة استرشادية بناءً على الأسعار السائدة في السوق المصري · قد تتغير حسب المزود',
                en: '* Comparison is indicative based on prevailing market rates in Egypt · may vary by provider'
            }
        },
        security: {
            badge: {
                ar: 'الأمان أولاً',
                en: 'Security First'
            },
            title1: {
                ar: 'أمان بمستوى',
                en: 'Bank-grade'
            },
            title2: {
                ar: 'المصارف',
                en: 'Security'
            },
            subtitle: {
                ar: 'طبقات حماية متعددة تحفظ أموالك وبياناتك في كل خطوة',
                en: 'Multiple layers of protection safeguard your funds and data at every step'
            },
            pbkdf2Title: {
                ar: 'PBKDF2 تشفير',
                en: 'PBKDF2 Encryption'
            },
            pbkdf2Stat: {
                ar: 'جولة تشفير',
                en: 'rounds'
            },
            pbkdf2Desc: {
                ar: 'كلمات المرور تُخزّن بـ PBKDF2 متعدد الجولات مع salt فريد لكل مستخدم. مستحيل كسرها.',
                en: 'Passwords stored with multi-round PBKDF2 + unique salt per user. Impossible to crack.'
            },
            escrowTitle: {
                ar: 'Escrow آلي',
                en: 'Automated Escrow'
            },
            escrowStat: {
                ar: 'حماية الصفقات',
                en: 'trade protection'
            },
            escrowDesc: {
                ar: 'USDT يُحجز تلقائياً في كل صفقة P2P ولا يُفرج إلا بعد تأكيد استلام الجنيه. لا احتيال ممكن.',
                en: 'USDT is automatically locked in every P2P trade and only released after EGP receipt is confirmed. No fraud possible.'
            },
            atomicTitle: {
                ar: 'Atomic Transactions',
                en: 'Atomic Transactions'
            },
            atomicStat: {
                ar: 'حالات فشل جزئي',
                en: 'partial failures'
            },
            atomicDesc: {
                ar: 'كل المعاملات المالية atomic: إما تنجح كاملة أو تفشل بالكامل. لا أموال عالقة.',
                en: 'All financial transactions are atomic: either fully succeed or fully fail. No stuck funds.'
            },
            reviewTitle: {
                ar: 'مراجعة بشرية',
                en: 'Human Review'
            },
            reviewStat: {
                ar: 'فريق إدارة',
                en: 'admin team'
            },
            reviewDesc: {
                ar: 'كل طلبات الإيداع والسحب تمر بمراجعة بشرية لمنع الغسيل المالي والاحتيال.',
                en: 'All deposit and withdrawal requests go through human review to prevent money laundering and fraud.'
            },
            auditTitle: {
                ar: 'سجل تدقيق كامل',
                en: 'Full Audit Trail'
            },
            auditStat: {
                ar: 'معاملات مسجّلة',
                en: 'logged transactions'
            },
            auditDesc: {
                ar: 'كل معاملة تُسجّل في سجل تدقيق كامل مع balance before/after — قابل للمراجعة في أي وقت.',
                en: 'Every transaction is logged in a full audit trail with balance before/after — reviewable at any time.'
            },
            ddosTitle: {
                ar: 'حماية من الـ DDoS',
                en: 'DDoS Protection'
            },
            ddosStat: {
                ar: 'وقت تشغيل',
                en: 'uptime'
            },
            ddosDesc: {
                ar: 'البنية التحتية محمية من هجمات DDoS مع موازنة حمل تلقائية ونظام failover.',
                en: 'Infrastructure protected against DDoS attacks with auto load balancing and failover.'
            },
            segregatedTitle: {
                ar: 'فصل الأرصدة',
                en: 'Segregated Accounts'
            },
            segregatedDesc: {
                ar: 'أرصدة المستخدمين مفصولة عن رأس مال المنصة — لا تستخدم أموالك في عمليات المنصة.',
                en: 'User balances are segregated from platform capital — your funds are never used for platform operations.'
            },
            alertsTitle: {
                ar: 'تنبيهات لحظية',
                en: 'Instant Alerts'
            },
            alertsStat: {
                ar: 'إشعارات',
                en: 'notifications'
            },
            alertsDesc: {
                ar: 'تنبيه فوري على كل عملية دخول، صفقة، أو معاملة حساسة عبر البريد والـ push notifications.',
                en: 'Instant alert on every login, trade, or sensitive transaction via email and push notifications.'
            }
        },
        activity: {
            badgeLive: {
                ar: 'مباشر الآن',
                en: 'Live now'
            },
            title1: {
                ar: 'المجتمع',
                en: 'Community is'
            },
            title2: {
                ar: 'نشط',
                en: 'Active'
            },
            subtitle: {
                ar: 'شوف المعاملات الحقيقية وهي تحصل الآن على المنصة',
                en: 'See real transactions happening now on the platform'
            },
            title: {
                ar: 'النشاط المباشر',
                en: 'Live Activity'
            },
            subtitle2: {
                ar: 'معاملات تتم الآن',
                en: 'Transactions happening now'
            },
            completed: {
                ar: 'مكتمل',
                en: 'Completed'
            },
            processing: {
                ar: 'قيد المعالجة',
                en: 'Processing'
            },
            now: {
                ar: 'الآن',
                en: 'Just now'
            },
            buyLabel: {
                ar: 'شراء USDT',
                en: 'Buy USDT'
            },
            sellLabel: {
                ar: 'بيع USDT',
                en: 'Sell USDT'
            },
            p2pLabel: {
                ar: 'صفقة P2P',
                en: 'P2P Trade'
            },
            depositLabel: {
                ar: 'إيداع',
                en: 'Deposit'
            },
            withdrawLabel: {
                ar: 'سحب',
                en: 'Withdrawal'
            }
        },
        stats: {
            badge: {
                ar: 'إحصائيات حية',
                en: 'Live Stats'
            },
            title1: {
                ar: 'أرقام',
                en: 'Numbers'
            },
            title2: {
                ar: 'تتحدث',
                en: 'Speak'
            },
            subtitle: {
                ar: 'إحصائيات حقيقية محدّثة لحظياً من نشاط المنصة',
                en: 'Real stats updated in real-time from platform activity'
            },
            tradesToday: {
                ar: 'معاملات اليوم',
                en: 'Trades Today'
            },
            volume24h: {
                ar: 'حجم التداول 24h',
                en: '24h Trading Volume'
            },
            activeUsers: {
                ar: 'مستخدمين نشطين',
                en: 'Active Users'
            },
            avgTime: {
                ar: 'متوسط الوقت',
                en: 'Avg Time'
            },
            successRate: {
                ar: 'نسبة النجاح',
                en: 'Success Rate'
            },
            usdtTraded: {
                ar: 'USDT متداول',
                en: 'USDT Traded'
            },
            joinUsers: {
                ar: 'انضم لـ 5,000+ مستخدم نشط',
                en: 'Join 5,000+ active users'
            },
            joinDesc: {
                ar: 'انضم لآلاف المصريين الذين يثقون بنا لإدارة تحويلاتهم اليومية. ابدأ بمبلغ بسيط واكتشف الفرق.',
                en: 'Join thousands of Egyptians who trust us for their daily transfers. Start with a small amount and discover the difference.'
            },
            createNow: {
                ar: 'أنشئ حسابك الآن',
                en: 'Create your account now'
            }
        },
        resources: {
            badge: {
                ar: 'موارد تعليمية',
                en: 'Educational Resources'
            },
            title1: {
                ar: 'تعلّم قبل أن',
                en: 'Learn before you'
            },
            title2: {
                ar: 'تتداول',
                en: 'trade'
            },
            subtitle: {
                ar: 'كل ما تحتاج معرفته عن USDT والعملات الرقمية باللغة العربية',
                en: 'Everything you need to know about USDT and crypto in Arabic'
            },
            article1Title: {
                ar: 'ما هو USDT ولماذا يُستخدم؟',
                en: 'What is USDT and why is it used?'
            },
            article1Desc: {
                ar: 'دليل شامل لفهم عملة تِثر (USDT)، الفرق بينها وبين الدولار، ولماذا تُستخدم في مصر.',
                en: 'A comprehensive guide to understanding Tether (USDT), its difference from the dollar, and why it\'s used in Egypt.'
            },
            article2Title: {
                ar: 'كيف تحمي نفسك من الاحتيال',
                en: 'How to protect yourself from fraud'
            },
            article2Desc: {
                ar: 'نصائح عملية للتعامل بأمان مع منصات العملات الرقمية وكيفية التعرّف على المحتالين.',
                en: 'Practical tips for safely dealing with crypto platforms and how to spot scammers.'
            },
            article3Title: {
                ar: 'لماذا يهرب المصريون من الجنيه؟',
                en: 'Why do Egyptians flee the pound?'
            },
            article3Desc: {
                ar: 'تحليل اقتصادي لأسباب لجوء المصريين لـ USDT كأداة حفظ قيمة في ظل التضخم.',
                en: 'Economic analysis of why Egyptians turn to USDT as a store of value amid inflation.'
            },
            readTime: {
                ar: 'دقائق',
                en: 'min read'
            },
            viewAll: {
                ar: 'استعرض كل المقالات',
                en: 'View all articles'
            },
            beginner: {
                ar: 'مبتدئ',
                en: 'Beginner'
            },
            securityCat: {
                ar: 'أمان',
                en: 'Security'
            },
            economy: {
                ar: 'اقتصاد',
                en: 'Economy'
            }
        },
        mobileApp: {
            badge: {
                ar: 'قريباً',
                en: 'Coming soon'
            },
            title1: {
                ar: 'تداول من',
                en: 'Trade from your'
            },
            title2: {
                ar: 'جوالك',
                en: 'phone'
            },
            title3: {
                ar: 'في أي وقت',
                en: 'anytime'
            },
            description: {
                ar: 'تطبيق الموبايل قادم قريباً لنظامي iOS و Android. تداول USDT، استقبل تنبيهات الأسعار، وأدِر محفظتك من أي مكان في العالم.',
                en: 'Mobile app coming soon for iOS and Android. Trade USDT, receive price alerts, and manage your wallet from anywhere in the world.'
            },
            feat1: {
                ar: 'تنبيهات فورية للأسعار والصفقات',
                en: 'Instant price and trade alerts'
            },
            feat2: {
                ar: 'دخول ببصمة الإصبع أو Face ID',
                en: 'Login with fingerprint or Face ID'
            },
            feat3: {
                ar: 'إشعارات لحظية لكل معاملة',
                en: 'Instant notifications for every transaction'
            },
            feat4: {
                ar: 'رسوم بيانية متقدمة للمحفظة',
                en: 'Advanced portfolio charts'
            },
            registerInterest: {
                ar: 'سجّل اهتمامك — سنخبرك عند الإطلاق',
                en: 'Register interest — we\'ll notify you at launch'
            }
        },
        pricing: {
            badge: {
                ar: 'شفافية كاملة',
                en: 'Full Transparency'
            },
            title1: {
                ar: 'لا رسوم خفية',
                en: 'No hidden fees'
            },
            subtitle: {
                ar: 'ندفع أرباحنا من هامش بسيط بين سعر الشراء والبيع، ورسوم رمزية على P2P',
                en: 'We earn from a small spread between buy and sell prices, plus a nominal P2P fee'
            },
            directTitle: {
                ar: 'تداول مباشر',
                en: 'Direct Trading'
            },
            directDesc: {
                ar: 'شراء/بيع USDT مباشرة من المنصة',
                en: 'Buy/sell USDT directly from the platform'
            },
            perTrade: {
                ar: 'لكل صفقة',
                en: 'per trade'
            },
            p2pTitle: {
                ar: 'سوق P2P',
                en: 'P2P Market'
            },
            p2pDesc: {
                ar: 'تداول مباشر بين المستخدمين بأسعار حرة',
                en: 'Direct trading between users at custom prices'
            },
            walletTitle: {
                ar: 'إيداع وسحب',
                en: 'Deposit & Withdraw'
            },
            walletDesc: {
                ar: 'كل ما تحتاجه لإدارة أموالك',
                en: 'Everything you need to manage your funds'
            },
            depositFee: {
                ar: 'رسوم إيداع',
                en: 'Deposit fee'
            },
            free: {
                ar: 'مجاني تماماً',
                en: 'Completely free'
            },
            popular: {
                ar: 'الأكثر شيوعاً',
                en: 'Most popular'
            },
            startNow: {
                ar: 'ابدأ الآن',
                en: 'Start now'
            },
            features: {
                instantExec: {
                    ar: 'تنفيذ فوري لحظي',
                    en: 'Instant execution'
                },
                spreadIncluded: {
                    ar: 'أسعار مضمّنة (Spread)',
                    en: 'Spread included'
                },
                feeOnAmount: {
                    ar: 'رسوم على المبلغ',
                    en: 'Fee on amount'
                },
                minExcept: {
                    ar: 'بدون حد أدنى عدا 100 جنيه',
                    en: 'No minimum except 100 EGP'
                },
                support247: {
                    ar: 'دعم 24/7',
                    en: '24/7 support'
                },
                youSetPrice: {
                    ar: 'أنت تحدد السعر',
                    en: 'You set the price'
                },
                feeSplit: {
                    ar: 'فقط (مقسومة 50/50)',
                    en: 'only (split 50/50)'
                },
                escrowAuto: {
                    ar: 'نظام ضمان Escrow آلي',
                    en: 'Automated Escrow system'
                },
                multiPayment: {
                    ar: '4 طرق دفع متعددة',
                    en: '4 multiple payment methods'
                },
                autoNoAdmin: {
                    ar: 'التنفيذ آلي بدون أدمن',
                    en: 'Auto execution, no admin'
                },
                depositFree: {
                    ar: 'إيداع مجاني تماماً',
                    en: 'Deposit completely free'
                },
                withdrawFree: {
                    ar: 'سحب مجاني تماماً',
                    en: 'Withdrawal completely free'
                },
                egyptMethods: {
                    ar: '4 طرق دفع مصرية',
                    en: '4 Egyptian payment methods'
                },
                humanReview: {
                    ar: 'مراجعة بشرية للطلبات',
                    en: 'Human review of requests'
                },
                within24h: {
                    ar: 'تحويل خلال 24 ساعة كحد أقصى',
                    en: 'Transfer within 24 hours max'
                }
            }
        },
        testimonials: {
            badge: {
                ar: 'ثقة المصريين',
                en: 'Trusted by Egyptians'
            },
            title1: {
                ar: 'بيثق بنا',
                en: 'Egyptians'
            },
            title2: {
                ar: 'المصريين',
                en: 'trust us'
            },
            t1: {
                ar: 'أخيراً منصة مصرية تفهم احتياجاتنا. السرعة والأسعار ممتازة، ونظام Escrow خلاني أتداول بثقة.',
                en: 'Finally an Egyptian platform that understands our needs. Speed and prices are excellent, and Escrow made me trade with confidence.'
            },
            t1Author: {
                ar: 'تاجر، القاهرة',
                en: 'Trader, Cairo'
            },
            t2: {
                ar: 'كنت أستخدم منصات أجنبية وأعاني من التحويل. مع Eg-Money، الإيداع بفودافون كاش خلص كل مشاكلي.',
                en: 'I used foreign platforms and struggled with transfers. With Eg-Money, Vodafone Cash deposits solved all my problems.'
            },
            t2Author: {
                ar: 'مستثمرة، الإسكندرية',
                en: 'Investor, Alexandria'
            },
            t3: {
                ar: 'أرسل USDT من هنا ويستلمه أهلي بالجنيه في دقائق. أرخص بكثير من Western Union وأسرع.',
                en: 'I send USDT from here and my family receives it in EGP in minutes. Much cheaper than Western Union and faster.'
            },
            t3Author: {
                ar: 'مغترب، السعودية',
                en: 'Expatriate, Saudi Arabia'
            }
        },
        faq: {
            badge: {
                ar: 'أسئلة شائعة',
                en: 'FAQ'
            },
            title1: {
                ar: 'عندك سؤال؟',
                en: 'Have a question?'
            },
            title2: {
                ar: 'عندنا الجواب',
                en: 'We have the answer'
            },
            q1: {
                ar: 'هل المنصة آمنة؟',
                en: 'Is the platform safe?'
            },
            a1: {
                ar: 'نعم تماماً. كلمات المرور مشفّرة بـ PBKDF2 متعدد الجولات، وكل المعاملات المالية atomic ومسجّلة في سجل قابل للتدقيق. بالإضافة إلى نظام ضمان (Escrow) في P2P الذي يحجز USDT حتى تأكيد استلام الجنيه.',
                en: 'Yes, completely. Passwords are encrypted with multi-round PBKDF2, all financial transactions are atomic and logged in an auditable trail. Plus the Escrow system in P2P locks USDT until EGP receipt is confirmed.'
            },
            q2: {
                ar: 'كم تستغرق معالجة الإيداع؟',
                en: 'How long does deposit processing take?'
            },
            a2: {
                ar: 'بعد تحويل المبلغ إلى حساب المنصة ورفع الطلب، يقوم فريق الإدارة بمراجعته خلال دقائق إلى 24 ساعة كحد أقصى. بمجرد الاعتماد، يُضاف الرصيد فوراً لحسابك.',
                en: 'After transferring the amount to the platform account and submitting the request, the admin team reviews it within minutes to 24 hours max. Once approved, the balance is added to your account immediately.'
            },
            q3: {
                ar: 'ما هي طرق الدفع المتاحة؟',
                en: 'What payment methods are available?'
            },
            a3: {
                ar: 'ندعم 4 طرق دفع مصرية: فودافون كاش، إنستا باي، فوري، والتحويل البنكي المباشر. كلها طرق محلية سريعة وآمنة.',
                en: 'We support 4 Egyptian payment methods: Vodafone Cash, InstaPay, Fawry, and direct bank transfer. All are fast and secure local methods.'
            },
            q4: {
                ar: 'كيف يعمل نظام P2P؟',
                en: 'How does the P2P system work?'
            },
            a4: {
                ar: 'تنشئ إعلان شراء أو بيع USDT بالسعر الذي تحدده. إذا كان إعلان بيع، يُحجز USDT تلقائياً كضمان. عندما يأخذ مستخدم آخر الإعلان، يبدأ التداول: المشتري يحوّل الجنيه، يؤكد الدفع، ثم البائع يفرج عن USDT. كل هذا آلياً بدون تدخل الأدمن.',
                en: 'You create a buy or sell ad for USDT at your chosen price. If selling, USDT is automatically locked as collateral. When another user takes the ad, trading begins: the buyer sends EGP, confirms payment, then the seller releases USDT. All automated without admin intervention.'
            },
            q5: {
                ar: 'ما الرسوم؟',
                en: 'What are the fees?'
            },
            a5: {
                ar: 'التداول المباشر: 1.5% من المبلغ. سوق P2P: 0.3% فقط (مقسومة على الطرفين). الإيداع والسحب: مجاني تماماً. لا توجد رسوم خفية أو اشتراكات.',
                en: 'Direct trading: 1.5% of the amount. P2P market: 0.3% only (split between both parties). Deposit and withdrawal: completely free. No hidden fees or subscriptions.'
            },
            q6: {
                ar: 'هل أحتاج لتقديم مستندات KYC؟',
                en: 'Do I need to submit KYC documents?'
            },
            a6: {
                ar: 'لا، لا نطلب KYC معقد. فقط بريدك الإلكتروني ورقم هاتفك للتسجيل. نوصي دائماً باستخدام بيانات حقيقية لتسهيل الدعم في حال أي مشكلة.',
                en: 'No, we don\'t require complex KYC. Just your email and phone number to register. We always recommend using real data to facilitate support in case of any issue.'
            }
        },
        cta: {
            ready: {
                ar: 'جاهز للانطلاق',
                en: 'Ready to launch'
            },
            title1: {
                ar: 'ابدأ رحلتك مع',
                en: 'Start your journey with'
            },
            title2: {
                ar: 'USDT اليوم',
                en: 'USDT today'
            },
            description: {
                ar: 'انضم لـ community المصريين اللي بيتبادلوا USDT بثقة وأمان. التسجيل مجاني، وبدون أي التزام.',
                en: 'Join the community of Egyptians trading USDT with confidence and security. Registration is free, with no commitment.'
            },
            createAccount: {
                ar: 'أنشئ حسابك الآن',
                en: 'Create your account now'
            },
            haveAccount: {
                ar: 'لديّ حساب، سجّل دخولي',
                en: 'I have an account, log me in'
            }
        },
        newsletter: {
            title: {
                ar: 'ابق على اطلاع بأخبار المنصة',
                en: 'Stay updated with platform news'
            },
            subtitle: {
                ar: 'أحدث الأسعار، الميزات الجديدة، ونصائح التداول — مرة كل أسبوع',
                en: 'Latest prices, new features, and trading tips — once a week'
            },
            subscribe: {
                ar: 'اشترك',
                en: 'Subscribe'
            },
            done: {
                ar: 'تم',
                en: 'Done'
            },
            emailPlaceholder: {
                ar: 'you@example.com',
                en: 'you@example.com'
            }
        },
        cookie: {
            title: {
                ar: 'ملفات تعريف الارتباط (Cookies)',
                en: 'Cookies'
            },
            description: {
                ar: 'نستخدم ملفات تعريف الارتباط لتحسين تجربتك وتحليل أداء المنصة. يمكنك قبولها أو رفضها.',
                en: 'We use cookies to improve your experience and analyze platform performance. You can accept or decline.'
            },
            acceptAll: {
                ar: 'قبول الكل',
                en: 'Accept all'
            },
            decline: {
                ar: 'رفض',
                en: 'Decline'
            },
            details: {
                ar: 'التفاصيل',
                en: 'Details'
            }
        },
        footer: {
            description: {
                ar: 'منصة مصرية متكاملة لبيع وشراء USDT مقابل الجنيه المصري، بأمان وسرعة.',
                en: 'An integrated Egyptian platform for buying and selling USDT for EGP, with security and speed.'
            },
            product: {
                ar: 'المنتج',
                en: 'Product'
            },
            support: {
                ar: 'الدعم',
                en: 'Support'
            },
            legal: {
                ar: 'قانوني',
                en: 'Legal'
            },
            terms: {
                ar: 'الشروط والأحكام',
                en: 'Terms & Conditions'
            },
            privacy: {
                ar: 'سياسة الخصوصية',
                en: 'Privacy Policy'
            },
            aml: {
                ar: 'سياسة AML',
                en: 'AML Policy'
            },
            disclaimer: {
                ar: 'إخلاء المسؤولية',
                en: 'Disclaimer'
            },
            rights: {
                ar: '© 2026 Eg-Money — جميع الحقوق محفوظة',
                en: '© 2026 Eg-Money — All rights reserved'
            },
            protected: {
                ar: 'معاملات محمية بنظام ضمان Escrow',
                en: 'Transactions protected by Escrow'
            },
            livePrices: {
                ar: 'أسعار السوق مباشرة',
                en: 'Live market prices'
            },
            disclaimerText: {
                ar: 'إخلاء مسؤولية: تنطوي تجارة العملات الرقمية على مخاطر عالية. لا تستثمر إلا ما تستطيع تحمل خسارته. هذه المنصة موجّهة للمصريين وفق القوانين المحلية.',
                en: 'Disclaimer: Cryptocurrency trading involves high risks. Only invest what you can afford to lose. This platform is intended for Egyptians in accordance with local laws.'
            }
        }
    },
    // ===== Auth Screen =====
    auth: {
        welcome: {
            ar: 'أهلاً بعودتك',
            en: 'Welcome back'
        },
        welcomeDesc: {
            ar: 'سجّل دخولك للمتابعة إلى Eg-Money',
            en: 'Sign in to continue to Eg-Money'
        },
        login: {
            ar: 'تسجيل الدخول',
            en: 'Login'
        },
        signup: {
            ar: 'حساب جديد',
            en: 'Sign up'
        },
        createAccount: {
            ar: 'أنشئ حسابك',
            en: 'Create your account'
        },
        createDesc: {
            ar: 'ابدأ التداول في دقيقة واحدة',
            en: 'Start trading in one minute'
        },
        email: {
            ar: 'البريد الإلكتروني',
            en: 'Email'
        },
        emailPlaceholder: {
            ar: 'you@example.com',
            en: 'you@example.com'
        },
        password: {
            ar: 'كلمة المرور',
            en: 'Password'
        },
        passwordPlaceholder: {
            ar: '••••••••',
            en: '••••••••'
        },
        name: {
            ar: 'الاسم الكامل',
            en: 'Full name'
        },
        namePlaceholder: {
            ar: 'مثال: أحمد محمد',
            en: 'e.g. Ahmed Mohamed'
        },
        username: {
            ar: 'اسم المستخدم',
            en: 'Username'
        },
        usernamePlaceholder: {
            ar: 'ahmed_2026',
            en: 'ahmed_2026'
        },
        usernameHint: {
            ar: '3-20 حرف: أحرف وأرقام و _ . -',
            en: '3-20 chars: letters, digits, _ . -'
        },
        phone: {
            ar: 'رقم الهاتف',
            en: 'Phone number'
        },
        phonePlaceholder: {
            ar: '10 1234 5678',
            en: '10 1234 5678'
        },
        country: {
            ar: 'الدولة',
            en: 'Country'
        },
        searchCountry: {
            ar: 'ابحث عن دولة...',
            en: 'Search country...'
        },
        identifier: {
            ar: 'اسم المستخدم / البريد / الهاتف',
            en: 'Username / Email / Phone'
        },
        identifierPlaceholder: {
            ar: 'ahmed_2026 أو you@example.com أو +20...',
            en: 'ahmed_2026 or you@example.com or +20...'
        },
        referralCode: {
            ar: 'كود الإحالة (اختياري)',
            en: 'Referral code (optional)'
        },
        referralPlaceholder: {
            ar: 'أدخل كود الإحالة إن وجد',
            en: 'Enter referral code if any'
        },
        enter: {
            ar: 'تسجيل الدخول',
            en: 'Sign in'
        },
        create: {
            ar: 'إنشاء الحساب',
            en: 'Create account'
        },
        termsAgree: {
            ar: 'بالتسجيل، أنت توافق على',
            en: 'By registering, you agree to the'
        },
        termsLink: {
            ar: 'الشروط والأحكام',
            en: 'Terms'
        },
        and: {
            ar: 'و',
            en: 'and'
        },
        privacyLink: {
            ar: 'سياسة الخصوصية',
            en: 'Privacy Policy'
        },
        acceptTerms: {
            ar: 'أوافق على الشروط والأحكام وسياسة الخصوصية',
            en: 'I agree to the Terms & Conditions and Privacy Policy'
        },
        readTerms: {
            ar: 'اقرأ الشروط والأحكام',
            en: 'Read Terms & Conditions'
        },
        readPrivacy: {
            ar: 'اقرأ سياسة الخصوصية',
            en: 'Read Privacy Policy'
        },
        forgotPassword: {
            ar: 'نسيت كلمة المرور؟',
            en: 'Forgot password?'
        },
        rememberMe: {
            ar: 'تذكّرني',
            en: 'Remember me'
        },
        noAccount: {
            ar: 'ليس لديك حساب؟',
            en: "Don't have an account?"
        },
        haveAccount: {
            ar: 'لديك حساب بالفعل؟',
            en: 'Already have an account?'
        },
        backHome: {
            ar: 'العودة للرئيسية',
            en: 'Back to home'
        },
        heroTitle1: {
            ar: 'بِع واشترِ USDT',
            en: 'Buy & Sell USDT'
        },
        heroTitle2: {
            ar: 'بثقة المصارف',
            en: 'with bank-grade trust'
        },
        heroDesc: {
            ar: 'منصة مصرية متكاملة لتداول USDT بالجنيه المصري — تداول مباشر، سوق P2P ذكي، وإيداع وسحب عبر فودافون كاش وإنستا باي وفوري.',
            en: 'An integrated Egyptian platform for trading USDT with EGP — direct trading, smart P2P market, and deposits/withdrawals via Vodafone Cash, InstaPay, and Fawry.'
        },
        feat1Title: {
            ar: 'تداول فوري',
            en: 'Instant Trading'
        },
        feat1Desc: {
            ar: 'شراء وبيع مباشر بأسعار منافسة',
            en: 'Direct buy and sell at competitive prices'
        },
        feat2Title: {
            ar: 'سوق P2P',
            en: 'P2P Market'
        },
        feat2Desc: {
            ar: 'تداول مباشر بين المستخدمين برسوم منخفضة',
            en: 'Direct trading between users at low fees'
        },
        feat3Title: {
            ar: 'حماية وأمان',
            en: 'Protection & Security'
        },
        feat3Desc: {
            ar: 'نظام ضمان Escrow يحفظ حقوق الأطراف',
            en: 'Escrow system protecting all parties'
        },
        // Validation
        errEmailRequired: {
            ar: 'البريد الإلكتروني مطلوب',
            en: 'Email is required'
        },
        errEmailInvalid: {
            ar: 'صيغة البريد الإلكتروني غير صحيحة',
            en: 'Invalid email format'
        },
        errPasswordRequired: {
            ar: 'كلمة المرور مطلوبة',
            en: 'Password is required'
        },
        errPasswordShort: {
            ar: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل',
            en: 'Password must be at least 8 characters'
        },
        errPasswordWeak: {
            ar: 'كلمة المرور يجب أن تحتوي على أحرف كبيرة وصغيرة وأرقام ورموز',
            en: 'Password must include upper, lower, digits and symbols'
        },
        errNameRequired: {
            ar: 'الاسم مطلوب',
            en: 'Name is required'
        },
        errNameShort: {
            ar: 'الاسم يجب أن يكون حرفين على الأقل',
            en: 'Name must be at least 2 characters'
        },
        errUsernameRequired: {
            ar: 'اسم المستخدم مطلوب',
            en: 'Username is required'
        },
        errUsernameInvalid: {
            ar: 'اسم المستخدم غير صحيح (3-20 حرف: أحرف وأرقام و _ . -)',
            en: 'Invalid username (3-20 chars: letters, digits, _ . -)'
        },
        errUsernameTaken: {
            ar: 'اسم المستخدم محجوز مسبقاً',
            en: 'Username already taken'
        },
        errIdentifierRequired: {
            ar: 'أدخل اسم المستخدم أو البريد أو الهاتف',
            en: 'Enter username, email or phone'
        },
        errPhoneRequired: {
            ar: 'رقم الهاتف مطلوب',
            en: 'Phone number is required'
        },
        errPhoneInvalid: {
            ar: 'رقم هاتف غير صحيح',
            en: 'Invalid phone number'
        },
        errTermsRequired: {
            ar: 'يجب الموافقة على الشروط للمتابعة',
            en: 'You must accept the terms to continue'
        },
        errReferralInvalid: {
            ar: 'كود الإحالة غير صحيح',
            en: 'Invalid referral code'
        },
        errOtpRequired: {
            ar: 'الرمز مطلوب',
            en: 'OTP is required'
        },
        errOtpInvalid: {
            ar: 'الرمز غير صحيح أو منتهي',
            en: 'OTP is invalid or expired'
        },
        errChannelRequired: {
            ar: 'اختر طريقة الاستلام',
            en: 'Choose a delivery channel'
        },
        // Password strength
        strengthLabel: {
            ar: 'قوة كلمة المرور',
            en: 'Password strength'
        },
        strengthWeak: {
            ar: 'ضعيفة',
            en: 'Weak'
        },
        strengthFair: {
            ar: 'متوسطة',
            en: 'Fair'
        },
        strengthGood: {
            ar: 'جيدة',
            en: 'Good'
        },
        strengthStrong: {
            ar: 'قوية',
            en: 'Strong'
        },
        strengthVeryStrong: {
            ar: 'قوية جداً',
            en: 'Very strong'
        },
        passwordHint: {
            ar: 'يجب 8+ أحرف، أحرف كبيرة وصغيرة، أرقام، ورموز',
            en: 'Must include 8+ chars, upper/lower, digits, and symbols'
        },
        checkLength: {
            ar: '8 أحرف على الأقل',
            en: 'At least 8 characters'
        },
        checkUpper: {
            ar: 'حرف كبير (A-Z)',
            en: 'Uppercase (A-Z)'
        },
        checkLower: {
            ar: 'حرف صغير (a-z)',
            en: 'Lowercase (a-z)'
        },
        checkNumber: {
            ar: 'رقم (0-9)',
            en: 'Number (0-9)'
        },
        checkSymbol: {
            ar: 'رمز (@#$...)',
            en: 'Symbol (@#$...)'
        },
        // Success / general
        loginSuccess: {
            ar: 'تم تسجيل الدخول بنجاح',
            en: 'Login successful'
        },
        signupSuccess: {
            ar: 'تم إنشاء حسابك بنجاح',
            en: 'Account created successfully'
        },
        welcomeBack: {
            ar: 'مرحباً بعودتك',
            en: 'Welcome back'
        },
        // Forgot password flow
        forgotTitle: {
            ar: 'استعادة كلمة المرور',
            en: 'Reset password'
        },
        forgotDesc: {
            ar: 'أدخل اسم المستخدم أو البريد أو الهاتف للبحث عن حسابك',
            en: 'Enter username, email or phone to find your account'
        },
        forgotIdentifierPlaceholder: {
            ar: 'ahmed_2026 / you@example.com / +20...',
            en: 'ahmed_2026 / you@example.com / +20...'
        },
        sendOtp: {
            ar: 'متابعة',
            en: 'Continue'
        },
        backToLogin: {
            ar: 'العودة لتسجيل الدخول',
            en: 'Back to login'
        },
        accountNotFound: {
            ar: 'لم يتم العثور على حساب بهذه البيانات',
            en: 'No account found with this information'
        },
        chooseChannel: {
            ar: 'اختر طريقة استلام الرمز',
            en: 'Choose how to receive the code'
        },
        channelEmail: {
            ar: 'عبر البريد الإلكتروني',
            en: 'Via email'
        },
        channelPhone: {
            ar: 'عبر الهاتف (SMS)',
            en: 'Via phone (SMS)'
        },
        channelEmailDesc: {
            ar: 'سيرسل رمز التحقق إلى بريدك الإلكتروني المسجل',
            en: 'OTP will be sent to your registered email'
        },
        channelPhoneDesc: {
            ar: 'سيرسل رمز التحقق إلى رقم هاتفك المسجل',
            en: 'OTP will be sent to your registered phone'
        },
        sendOtpBtn: {
            ar: 'إرسال الرمز',
            en: 'Send code'
        },
        otpSentTo: {
            ar: 'تم إرسال الرمز إلى',
            en: 'Code sent to'
        },
        otpSentEmail: {
            ar: 'أرسلنا رمز التحقق إلى بريدك الإلكتروني',
            en: 'We sent an OTP to your email'
        },
        otpSentPhone: {
            ar: 'أرسلنا رمز التحقق إلى هاتفك',
            en: 'We sent an OTP to your phone'
        },
        otpTitle: {
            ar: 'أدخل رمز التحقق',
            en: 'Enter verification code'
        },
        otpDesc: {
            ar: 'أدخل الرمز المكوّن من 6 أرقام',
            en: 'Enter the 6-digit code'
        },
        otpPlaceholder: {
            ar: '000000',
            en: '000000'
        },
        verifyOtp: {
            ar: 'تأكيد الرمز',
            en: 'Verify code'
        },
        resendOtp: {
            ar: 'إعادة إرسال الرمز',
            en: 'Resend code'
        },
        resendIn: {
            ar: 'إعادة الإرسال خلال',
            en: 'Resend in'
        },
        resetTitle: {
            ar: 'كلمة المرور الجديدة',
            en: 'New password'
        },
        resetDesc: {
            ar: 'أدخل كلمة المرور الجديدة لحسابك',
            en: 'Enter your new account password'
        },
        confirmPassword: {
            ar: 'تأكيد كلمة المرور',
            en: 'Confirm password'
        },
        confirmPlaceholder: {
            ar: 'أعد إدخال كلمة المرور',
            en: 'Re-enter password'
        },
        errPasswordMatch: {
            ar: 'كلمتا المرور غير متطابقتين',
            en: 'Passwords do not match'
        },
        resetSubmit: {
            ar: 'تحديث كلمة المرور',
            en: 'Update password'
        },
        resetSuccess: {
            ar: 'تم تحديث كلمة المرور، يمكنك تسجيل الدخول الآن',
            en: 'Password updated, you can now sign in'
        },
        invalidResetToken: {
            ar: 'رابط الاستعادة غير صالح أو منتهي',
            en: 'Reset link is invalid or expired'
        },
        // Google OAuth
        googleSignIn: {
            ar: 'تسجيل الدخول عبر جوجل',
            en: 'Sign in with Google'
        },
        googleSignUp: {
            ar: 'التسجيل عبر جوجل',
            en: 'Sign up with Google'
        },
        googleDisabled: {
            ar: 'تسجيل الدخول عبر جوجل غير مفعل حالياً',
            en: 'Google sign-in is currently disabled'
        },
        googleLinkSuccess: {
            ar: 'تم ربط حسابك بجوجل بنجاح',
            en: 'Your account is now linked with Google'
        },
        googleLoginSuccess: {
            ar: 'تم تسجيل الدخول عبر جوجل',
            en: 'Signed in with Google'
        },
        googleError: {
            ar: 'فشل تسجيل الدخول عبر جوجل',
            en: 'Google sign-in failed'
        },
        googleEmailExists: {
            ar: 'هذا البريد مسجل بكلمة مرور. سجّل الدخول أولاً ثم اربط جوجل من الإعدادات',
            en: 'Email exists with a password. Sign in first then link Google from settings'
        },
        // Multi-step wizard
        stepAccount: {
            ar: 'الحساب',
            en: 'Account'
        },
        stepContact: {
            ar: 'التواصل',
            en: 'Contact'
        },
        stepSecurity: {
            ar: 'الأمان',
            en: 'Security'
        },
        stepReview: {
            ar: 'المراجعة',
            en: 'Review'
        },
        stepOf: {
            ar: 'خطوة',
            en: 'Step'
        },
        ofTotal: {
            ar: 'من',
            en: 'of'
        },
        nextStep: {
            ar: 'التالي',
            en: 'Next'
        },
        prevStep: {
            ar: 'السابق',
            en: 'Previous'
        },
        backToLogin2: {
            ar: 'العودة لتسجيل الدخول',
            en: 'Back to login'
        },
        stepAccountTitle: {
            ar: 'بيانات الحساب',
            en: 'Account details'
        },
        stepAccountDesc: {
            ar: 'اسم المستخدم والبريد الإلكتروني',
            en: 'Username and email address'
        },
        stepContactTitle: {
            ar: 'بيانات التواصل',
            en: 'Contact details'
        },
        stepContactDesc: {
            ar: 'رقم الهاتف مع رمز الدولة',
            en: 'Phone number with country code'
        },
        stepSecurityTitle: {
            ar: 'كلمة المرور',
            en: 'Password'
        },
        stepSecurityDesc: {
            ar: 'كلمة مرور قوية وتأكيدها',
            en: 'Strong password and confirmation'
        },
        stepReviewTitle: {
            ar: 'مراجعة وإنشاء',
            en: 'Review & create'
        },
        stepReviewDesc: {
            ar: 'راجع بياناتك وأنشئ حسابك',
            en: 'Review your details and create account'
        },
        reviewSummary: {
            ar: 'ملخص البيانات',
            en: 'Information summary'
        },
        edit: {
            ar: 'تعديل',
            en: 'Edit'
        },
        referralAndTerms: {
            ar: 'الإحالة والشروط',
            en: 'Referral & terms'
        },
        completeSignup: {
            ar: 'إكمال التسجيل',
            en: 'Complete signup'
        },
        skipForNow: {
            ar: 'تخطّي الآن',
            en: 'Skip for now'
        },
        // Hero stats
        statFee: {
            ar: 'رسوم P2P',
            en: 'P2P Fee'
        },
        statTime: {
            ar: 'وقت التنفيذ',
            en: 'Execution time'
        },
        statEscrow: {
            ar: 'محمي Escrow',
            en: 'Escrow protected'
        },
        orContinueWith: {
            ar: 'أو تابع بـ',
            en: 'Or continue with'
        },
        secureLogin: {
            ar: 'تسجيل دخول آمن',
            en: 'Secure login'
        },
        protectedByEscrow: {
            ar: 'معاملات محمية بنظام Escrow',
            en: 'Transactions protected by Escrow'
        }
    },
    // ===== Connection Status =====
    connection: {
        connected: {
            ar: 'متصل',
            en: 'Connected'
        },
        connecting: {
            ar: 'جارٍ الاتصال',
            en: 'Connecting'
        },
        reconnecting: {
            ar: 'إعادة الاتصال',
            en: 'Reconnecting'
        },
        disconnected: {
            ar: 'غير متصل',
            en: 'Offline'
        },
        attempt: {
            ar: 'محاولة',
            en: 'attempt'
        },
        reconnectingMsg: {
            ar: 'جارٍ إعادة الاتصال بالسوق...',
            en: 'Reconnecting to market...'
        },
        restored: {
            ar: 'تم استعادة الاتصال ✓',
            en: 'Connection restored ✓'
        },
        lostMsg: {
            ar: 'انقطع الاتصال — بعض البيانات قد لا تكون محدّثة',
            en: 'Connection lost — some data may be outdated'
        }
    },
    // ===== Notifications =====
    notifications: {
        title: {
            ar: 'الإشعارات',
            en: 'Notifications'
        },
        new: {
            ar: 'جديد',
            en: 'new'
        },
        markAllRead: {
            ar: 'تعليم الكل كمقروء',
            en: 'Mark all as read'
        },
        none: {
            ar: 'لا توجد إشعارات',
            en: 'No notifications'
        },
        loading: {
            ar: 'جارٍ التحميل...',
            en: 'Loading...'
        },
        viewAll: {
            ar: 'عرض كل الإشعارات',
            en: 'View all notifications'
        },
        delete: {
            ar: 'حذف',
            en: 'Delete'
        },
        deleteRead: {
            ar: 'حذف المقروء',
            en: 'Clear read'
        }
    },
    // ===== Language Switcher =====
    language: {
        label: {
            ar: 'اللغة / Language',
            en: 'Language / اللغة'
        },
        arabic: {
            ar: 'العربية',
            en: 'Arabic'
        },
        english: {
            ar: 'English',
            en: 'English'
        },
        comingSoon: {
            ar: 'سيتم تطبيق اللغة الإنجليزية قريباً!',
            en: 'English coming soon!'
        },
        switched: {
            ar: 'تم التحويل للعربية',
            en: 'Switched to English'
        }
    },
    // ===== App (after login) =====
    app: {
        dashboard: {
            ar: 'الرئيسية',
            en: 'Home'
        },
        trade: {
            ar: 'تداول مباشر',
            en: 'Trade'
        },
        p2p: {
            ar: 'سوق P2P',
            en: 'P2P'
        },
        wallet: {
            ar: 'الإيداع والسحب',
            en: 'Wallet'
        },
        admin: {
            ar: 'الإدارة',
            en: 'Admin'
        },
        egpBalance: {
            ar: 'رصيد الجنيه المصري',
            en: 'EGP Balance'
        },
        usdtBalance: {
            ar: 'رصيد USDT',
            en: 'USDT Balance'
        },
        netWorth: {
            ar: 'صافي الثروة',
            en: 'Net Worth'
        },
        totalInUsd: {
            ar: 'إجمالي بالدولار',
            en: 'Total in USD'
        },
        usdtEquivalent: {
            ar: '~USDT مكافئ',
            en: '~USDT equivalent'
        },
        recentTransactions: {
            ar: 'آخر المعاملات',
            en: 'Recent Transactions'
        },
        recentDesc: {
            ar: 'سجل نشاط حسابك الأخير',
            en: 'Your recent account activity'
        },
        noTransactions: {
            ar: 'لا توجد معاملات بعد',
            en: 'No transactions yet'
        },
        noTransactionsHint: {
            ar: 'ابدأ بإيداع رصيد أو تداول USDT',
            en: 'Start by depositing or trading USDT'
        },
        transactionsCount: {
            ar: 'عدد المعاملات',
            en: 'Transactions'
        },
        inLastPeriod: {
            ar: 'في آخر فترة',
            en: 'in recent period'
        },
        member: {
            ar: 'عضو',
            en: 'Member'
        },
        adminRole: {
            ar: 'مدير',
            en: 'Admin'
        },
        adminAccount: {
            ar: 'حساب مدير',
            en: 'Admin account'
        },
        egpBalanceLabel: {
            ar: 'رصيد EGP',
            en: 'EGP Balance'
        },
        usdtBalanceLabel: {
            ar: 'رصيد USDT',
            en: 'USDT Balance'
        },
        logout: {
            ar: 'تسجيل الخروج',
            en: 'Logout'
        }
    },
    // ===== Activity Feed =====
    activityFeed: {
        title: {
            ar: 'النشاط المباشر',
            en: 'Live Activity'
        },
        subtitle: {
            ar: 'معاملات تتم الآن · مباشر',
            en: 'Transactions happening now · live'
        },
        buy: {
            ar: 'شراء USDT',
            en: 'Buy USDT'
        },
        sell: {
            ar: 'بيع USDT',
            en: 'Sell USDT'
        },
        p2p: {
            ar: 'صفقة P2P',
            en: 'P2P Trade'
        },
        deposit: {
            ar: 'إيداع',
            en: 'Deposit'
        },
        withdraw: {
            ar: 'سحب',
            en: 'Withdrawal'
        },
        now: {
            ar: 'الآن',
            en: 'Just now'
        },
        completed: {
            ar: 'مكتمل',
            en: 'Completed'
        },
        processing: {
            ar: 'قيد المعالجة',
            en: 'Processing'
        },
        ago_seconds: {
            ar: 'منذ ثوانٍ',
            en: 'seconds ago'
        },
        ago_second: {
            ar: 'منذ ثانية',
            en: 'second ago'
        },
        ago_minutes: {
            ar: 'منذ دقائق',
            en: 'minutes ago'
        },
        ago_minute: {
            ar: 'منذ دقيقة',
            en: 'minute ago'
        },
        ago_hours: {
            ar: 'منذ ساعات',
            en: 'hours ago'
        },
        ago_hour: {
            ar: 'منذ ساعة',
            en: 'hour ago'
        },
        ago_days: {
            ar: 'منذ أيام',
            en: 'days ago'
        },
        ago_day: {
            ar: 'منذ يوم',
            en: 'day ago'
        }
    },
    // ===== Live Stats Grid =====
    liveStats: {
        tradesToday: {
            ar: 'معاملات اليوم',
            en: 'Trades Today'
        },
        volume24h: {
            ar: 'حجم التداول 24h',
            en: '24h Volume'
        },
        activeUsers: {
            ar: 'مستخدمين نشطين',
            en: 'Active Users'
        },
        avgTime: {
            ar: 'متوسط الوقت',
            en: 'Avg Time'
        },
        successRate: {
            ar: 'نسبة النجاح',
            en: 'Success Rate'
        },
        usdtTraded: {
            ar: 'USDT متداول',
            en: 'USDT Traded'
        }
    },
    // ===== Onboarding =====
    onboarding: {
        step1Title: {
            ar: 'أهلاً بك في Eg-Money 👋',
            en: 'Welcome to Eg-Money 👋'
        },
        step1Desc: {
            ar: 'منصة مصرية متكاملة لتبادل USDT بالجنيه المصري. لنأخذ جولة سريعة لتتعرف على المنصة.',
            en: 'An integrated Egyptian platform for trading USDT with EGP. Let\'s take a quick tour.'
        },
        step1B1: {
            ar: 'تداول مباشر بأسعار تنافسية',
            en: 'Direct trading at competitive prices'
        },
        step1B2: {
            ar: 'سوق P2P ذكي بنظام ضمان',
            en: 'Smart P2P market with Escrow'
        },
        step1B3: {
            ar: 'إيداع وسحب بطرق مصرية',
            en: 'Deposit & withdraw via Egyptian methods'
        },
        step2Title: {
            ar: 'الإيداع والسحب',
            en: 'Deposits & Withdrawals'
        },
        step2Desc: {
            ar: 'أودع جنيهاتك عبر أي طريقة دفع مصرية تثق بها. كل الطلبات تتم مراجعتها يدوياً من فريق الإدارة لضمان الأمان.',
            en: 'Deposit your EGP via any trusted Egyptian payment method. All requests are manually reviewed by our admin team for security.'
        },
        step2B1: {
            ar: '📱 فودافون كاش — تحويل فوري',
            en: '📱 Vodafone Cash — instant transfer'
        },
        step2B2: {
            ar: '⚡ إنستا باي — تحويل بنكي فوري',
            en: '⚡ InstaPay — instant bank transfer'
        },
        step2B3: {
            ar: '🏪 فوري — من أي منشأة',
            en: '🏪 Fawry — from any location'
        },
        step2B4: {
            ar: '🏦 تحويل بنكي مباشر',
            en: '🏦 Direct bank transfer'
        },
        step3Title: {
            ar: 'التداول المباشر',
            en: 'Direct Trading'
        },
        step3Desc: {
            ar: 'اشترِ أو بِع USDT مباشرة من المنصة بأسعار محدّثة لحظياً. التنفيذ فوري والرصيد يُحدّث في الحال.',
            en: 'Buy or sell USDT directly from the platform with real-time prices. Instant execution, balance updates immediately.'
        },
        step3B1: {
            ar: 'تنفيذ لحظي بدون انتظار',
            en: 'Instant execution, no waiting'
        },
        step3B2: {
            ar: 'أسعار شفافة مع spread بسيط',
            en: 'Transparent prices with small spread'
        },
        step3B3: {
            ar: 'رسوم منخفضة 1.5% فقط',
            en: 'Low fees, only 1.5%'
        },
        step3B4: {
            ar: 'حد أدنى 100 جنيه فقط',
            en: 'Minimum 100 EGP only'
        },
        step4Title: {
            ar: 'سوق P2P الذكي',
            en: 'Smart P2P Market'
        },
        step4Desc: {
            ar: 'تداول مباشر بين المستخدمين بأسعار حرة تحددها أنت. نظام ضمان Escrow يحجز USDT تلقائياً حتى تأكيد استلام الجنيه — حماية كاملة من الاحتيال.',
            en: 'Direct trading between users at custom prices. Escrow system automatically locks USDT until EGP receipt is confirmed — complete fraud protection.'
        },
        step4B1: {
            ar: 'أنت تحدد السعر والكمية',
            en: 'You set the price and amount'
        },
        step4B2: {
            ar: 'نظام ضمان Escrow آلي',
            en: 'Automated Escrow system'
        },
        step4B3: {
            ar: 'رسوم منخفضة 0.3% فقط',
            en: 'Low fees, only 0.3%'
        },
        step4B4: {
            ar: 'تنفيذ بدون تدخل الأدمن',
            en: 'Auto execution, no admin needed'
        },
        step5Title: {
            ar: 'جاهز للانطلاق! 🚀',
            en: 'Ready to go! 🚀'
        },
        step5Desc: {
            ar: 'رصيدك آمن، معاملاتك محمية، وفريق الإدارة يراقب كل شيء. ابدأ بإيداع جنيهاتك ثم انطلق في أول صفقة.',
            en: 'Your balance is safe, transactions are protected, and the admin team monitors everything. Start by depositing EGP then make your first trade.'
        },
        step5B1: {
            ar: 'رصيدك محمي بنظام atomic',
            en: 'Balance protected by atomic system'
        },
        step5B2: {
            ar: 'كل المعاملات مسجّلة في سجل كامل',
            en: 'All transactions fully logged'
        },
        step5B3: {
            ar: 'دعم متواصل في أي وقت',
            en: 'Continuous support anytime'
        },
        next: {
            ar: 'التالي',
            en: 'Next'
        },
        prev: {
            ar: 'السابق',
            en: 'Previous'
        },
        skip: {
            ar: 'تخطّي',
            en: 'Skip'
        },
        startTrading: {
            ar: 'ابدأ التداول',
            en: 'Start trading'
        }
    },
    // ===== Dashboard =====
    dashboard: {
        egpBalanceTitle: {
            ar: 'رصيد الجنيه المصري',
            en: 'EGP Balance'
        },
        usdtBalanceTitle: {
            ar: 'رصيد USDT',
            en: 'USDT Balance'
        },
        netWorthTitle: {
            ar: 'صافي الثروة',
            en: 'Net Worth'
        },
        totalInUsd: {
            ar: 'إجمالي بالدولار',
            en: 'Total in USD'
        },
        usdtEquivalent: {
            ar: '~USDT مكافئ',
            en: '~USDT equivalent'
        },
        recentTransactions: {
            ar: 'آخر المعاملات',
            en: 'Recent Transactions'
        },
        recentDesc: {
            ar: 'سجل نشاط حسابك الأخير',
            en: 'Your recent account activity'
        },
        noTransactions: {
            ar: 'لا توجد معاملات بعد',
            en: 'No transactions yet'
        },
        noTransactionsHint: {
            ar: 'ابدأ بإيداع رصيد أو تداول USDT',
            en: 'Start by depositing or trading USDT'
        },
        transactionsCount: {
            ar: 'عدد المعاملات',
            en: 'Transactions'
        },
        inLastPeriod: {
            ar: 'في آخر فترة',
            en: 'in recent period'
        },
        loading: {
            ar: 'جارٍ التحميل...',
            en: 'Loading...'
        }
    },
    // ===== Trade Tab =====
    trade: {
        title: {
            ar: 'تداول مباشر',
            en: 'Direct Trading'
        },
        desc: {
            ar: 'اشترِ أو بِع USDT مباشرةً من المنصة بأسعار فورية',
            en: 'Buy or sell USDT directly from the platform at instant prices'
        },
        buy: {
            ar: 'شراء USDT',
            en: 'Buy USDT'
        },
        sell: {
            ar: 'بيع USDT',
            en: 'Sell USDT'
        },
        buyPrice: {
            ar: 'سعر الشراء (تدفع)',
            en: 'Buy price (you pay)'
        },
        sellPrice: {
            ar: 'سعر البيع (تستلم)',
            en: 'Sell price (you receive)'
        },
        amount: {
            ar: 'الكمية (USDT)',
            en: 'Amount (USDT)'
        },
        egpAmount: {
            ar: 'المبلغ (جنيه)',
            en: 'Amount (EGP)'
        },
        fee: {
            ar: 'رسوم',
            en: 'Fee'
        },
        totalDeducted: {
            ar: 'إجمالي الخصم من جنيهك',
            en: 'Total deducted from EGP'
        },
        netAdded: {
            ar: 'الصافي الذي يضاف لجنيهك',
            en: 'Net added to EGP'
        },
        buyBtn: {
            ar: 'شراء USDT',
            en: 'Buy USDT'
        },
        sellBtn: {
            ar: 'بيع USDT',
            en: 'Sell USDT'
        },
        confirmTitle: {
            ar: 'تأكيد العملية',
            en: 'Confirm Transaction'
        },
        insufficientEgp: {
            ar: 'رصيد الجنيه غير كافٍ',
            en: 'Insufficient EGP balance'
        },
        insufficientUsdt: {
            ar: 'رصيد USDT غير كافٍ',
            en: 'Insufficient USDT balance'
        },
        specifyAmount: {
            ar: 'حدد كمية USDT أو مبلغ الجنيه',
            en: 'Specify USDT amount or EGP amount'
        },
        balanceTitle: {
            ar: 'رصيدك الحالي',
            en: 'Your current balance'
        },
        howTitle: {
            ar: 'كيف يعمل التداول؟',
            en: 'How trading works'
        },
        step1: {
            ar: 'اختر عملية شراء أو بيع USDT',
            en: 'Choose buy or sell USDT'
        },
        step2: {
            ar: 'أدخل الكمية بالمبلغ الذي تريده',
            en: 'Enter the amount you want'
        },
        step3: {
            ar: 'سيتم تنفيذ العملية فوراً وتحديث رصيدك',
            en: 'Transaction executes instantly, balance updates'
        },
        step4: {
            ar: 'السعر يشمل هامش ربح المنصة',
            en: 'Price includes platform margin'
        }
    },
    // ===== P2P Tab =====
    p2p: {
        title: {
            ar: 'سوق P2P',
            en: 'P2P Market'
        },
        desc: {
            ar: 'تداول مباشر بين المستخدمين — نظام ضمان (Escrow) ذكي يحفظ حقوق الأطراف، تنفيذ آلي بدون تدخل الأدمن',
            en: 'Direct trading between users — smart Escrow system protects all parties, automated execution without admin'
        },
        createAd: {
            ar: 'إنشاء إعلان',
            en: 'Create Ad'
        },
        market: {
            ar: 'سوق الإعلانات',
            en: 'Market'
        },
        myTrades: {
            ar: 'صفقاتي',
            en: 'My Trades'
        },
        buyers: {
            ar: 'مشترون',
            en: 'Buyers'
        },
        sellers: {
            ar: 'بائعون',
            en: 'Sellers'
        },
        all: {
            ar: 'الكل',
            en: 'All'
        },
        buyFrom: {
            ar: 'شراء منه',
            en: 'Buy from'
        },
        sellTo: {
            ar: 'بيع له',
            en: 'Sell to'
        },
        cancelAd: {
            ar: 'إلغاء الإعلان',
            en: 'Cancel ad'
        },
        noAds: {
            ar: 'لا توجد إعلانات حالياً',
            en: 'No ads available'
        },
        noTrades: {
            ar: 'لا توجد صفقات بعد',
            en: 'No trades yet'
        },
        wantBuy: {
            ar: 'أريد شراء USDT',
            en: 'I want to BUY USDT'
        },
        wantSell: {
            ar: 'أريد بيع USDT',
            en: 'I want to SELL USDT'
        },
        amount: {
            ar: 'الكمية (USDT)',
            en: 'Amount (USDT)'
        },
        price: {
            ar: 'السعر للوحدة (جنيه/USDT)',
            en: 'Price per unit (EGP/USDT)'
        },
        minOrder: {
            ar: 'أقل طلب (جنيه)',
            en: 'Min order (EGP)'
        },
        maxOrder: {
            ar: 'أقصى طلب (جنيه)',
            en: 'Max order (EGP)'
        },
        paymentMethods: {
            ar: 'طرق الدفع المقبولة',
            en: 'Accepted payment methods'
        },
        publish: {
            ar: 'نشر الإعلان',
            en: 'Publish ad'
        },
        buyer: {
            ar: 'مشتري',
            en: 'Buyer'
        },
        seller: {
            ar: 'بائع',
            en: 'Seller'
        },
        counterparty: {
            ar: 'الطرف الآخر',
            en: 'Counterparty'
        },
        pendingPayment: {
            ar: 'بانتظار الدفع',
            en: 'Pending payment'
        },
        paid: {
            ar: 'تم الدفع',
            en: 'Paid'
        },
        released: {
            ar: 'مكتملة',
            en: 'Completed'
        },
        cancelled: {
            ar: 'ملغاة',
            en: 'Cancelled'
        },
        confirmedPayment: {
            ar: 'أكدت الدفع',
            en: 'I confirmed payment'
        },
        releaseUsdt: {
            ar: 'إفراج عن USDT',
            en: 'Release USDT'
        },
        cancelTrade: {
            ar: 'إلغاء الصفقة',
            en: 'Cancel trade'
        },
        waitingSeller: {
            ar: 'بانتظار إفراج البائع...',
            en: 'Waiting for seller to release...'
        },
        waitingBuyer: {
            ar: 'بانتظار دفع المشتري...',
            en: 'Waiting for buyer payment...'
        },
        tradeCompleted: {
            ar: '✅ تمت الصفقة بنجاح',
            en: '✅ Trade completed successfully'
        },
        confirmCancel: {
            ar: 'تأكيد إلغاء الصفقة',
            en: 'Confirm trade cancellation'
        },
        cancelDesc: {
            ar: 'سيتم إلغاء الصفقة واسترجاع الأموال المحجوزة لكلا الطرفين. لا يمكن التراجع عن هذا الإجراء.',
            en: 'The trade will be cancelled and held funds returned to both parties. This action cannot be undone.'
        },
        confirmTakeTitle: {
            ar: 'تأكيد الصفقة',
            en: 'Confirm trade'
        },
        useMarketPrice: {
            ar: 'استخدام سعر السوق',
            en: 'Use market price'
        },
        aboveMarket: {
            ar: 'فوق سعر السوق',
            en: 'above market'
        },
        belowMarket: {
            ar: 'تحت سعر السوق',
            en: 'below market'
        },
        marketPriceNow: {
            ar: 'سعر السوق الآن',
            en: 'Market price now'
        }
    },
    // ===== Wallet Tab =====
    wallet: {
        title: {
            ar: 'الإيداع والسحب',
            en: 'Deposit & Withdraw'
        },
        desc: {
            ar: 'تتم معالجة الطلبات يدوياً بواسطة فريق الإدارة خلال دقائق إلى 24 ساعة كحد أقصى',
            en: 'Requests are processed manually by admin team within minutes to 24 hours max'
        },
        deposit: {
            ar: 'إيداع',
            en: 'Deposit'
        },
        withdraw: {
            ar: 'سحب',
            en: 'Withdraw'
        },
        newDeposit: {
            ar: 'طلب إيداع جديد',
            en: 'New deposit request'
        },
        newWithdraw: {
            ar: 'طلب سحب',
            en: 'Withdrawal request'
        },
        depositDesc: {
            ar: 'اختر طريقة الإيداع، حوّل المبلغ إلى حساب المنصة، ثم ارفع الطلب للمراجعة',
            en: 'Choose deposit method, transfer to platform account, then submit for review'
        },
        withdrawDesc: {
            ar: 'سيتم خصم المبلغ فوراً وتحويله خلال 24 ساعة بعد مراجعة الأدمن',
            en: 'Amount deducted immediately, transferred within 24 hours after admin review'
        },
        method: {
            ar: 'طريقة الإيداع',
            en: 'Deposit method'
        },
        withdrawMethod: {
            ar: 'طريقة السحب',
            en: 'Withdrawal method'
        },
        amount: {
            ar: 'المبلغ (جنيه مصري)',
            en: 'Amount (EGP)'
        },
        reference: {
            ar: 'مرجع العملية (اختياري)',
            en: 'Transaction reference (optional)'
        },
        referencePlaceholder: {
            ar: 'رقم العملية من فودافون كاش / إنستا باي...',
            en: 'Transaction number from Vodafone Cash / InstaPay...'
        },
        referenceHint: {
            ar: 'يسرّع عملية التحقق',
            en: 'Speeds up verification'
        },
        destination: {
            ar: 'وجهة التحويل',
            en: 'Transfer destination'
        },
        destinationLabel: {
            ar: 'رقم محفظة فودافون كاش',
            en: 'Vodafone Cash wallet number'
        },
        minAmount: {
            ar: 'أقل مبلغ 100 جنيه',
            en: 'Minimum 100 EGP'
        },
        availableBalance: {
            ar: 'رصيدك المتاح',
            en: 'Available balance'
        },
        submit: {
            ar: 'إرسال طلب الإيداع',
            en: 'Submit deposit request'
        },
        submitWithdraw: {
            ar: 'إرسال طلب السحب',
            en: 'Submit withdrawal'
        },
        history: {
            ar: 'سجل الإيداعات',
            en: 'Deposit history'
        },
        withdrawHistory: {
            ar: 'سجل السحوبات',
            en: 'Withdrawal history'
        },
        noHistory: {
            ar: 'لا توجد طلبات سابقة',
            en: 'No previous requests'
        },
        pending: {
            ar: 'قيد المراجعة',
            en: 'Pending review'
        },
        approved: {
            ar: 'مكتمل',
            en: 'Completed'
        },
        rejected: {
            ar: 'مرفوض',
            en: 'Rejected'
        },
        platformAccount: {
            ar: 'رقم محفظة المنصة',
            en: 'Platform wallet number'
        },
        copy: {
            ar: 'تم النسخ',
            en: 'Copied'
        },
        confirmDeposit: {
            ar: 'تأكيد طلب الإيداع',
            en: 'Confirm deposit request'
        },
        confirmDepositDesc: {
            ar: 'تأكد من إتمام التحويل إلى حساب المنصة قبل المتابعة',
            en: 'Make sure you completed the transfer to the platform account before proceeding'
        },
        minDepositError: {
            ar: 'أقل مبلغ للإيداع 100 جنيه',
            en: 'Minimum deposit is 100 EGP'
        },
        minWithdrawError: {
            ar: 'أقل مبلغ للسحب 100 جنيه',
            en: 'Minimum withdrawal is 100 EGP'
        }
    },
    // ===== Admin Tab =====
    admin: {
        title: {
            ar: 'لوحة الإدارة',
            en: 'Admin Panel'
        },
        desc: {
            ar: 'معالجة طلبات الإيداع والسحب، إدارة المستخدمين، وإعدادات المنصة',
            en: 'Process deposits and withdrawals, manage users, and platform settings'
        },
        deposits: {
            ar: 'الإيداعات',
            en: 'Deposits'
        },
        withdrawals: {
            ar: 'السحوبات',
            en: 'Withdrawals'
        },
        users: {
            ar: 'المستخدمون',
            en: 'Users'
        },
        settings: {
            ar: 'الإعدادات',
            en: 'Settings'
        },
        pending: {
            ar: 'قيد الانتظار',
            en: 'Pending'
        },
        completed: {
            ar: 'مكتمل',
            en: 'Completed'
        },
        rejected: {
            ar: 'مرفوض',
            en: 'Rejected'
        },
        all: {
            ar: 'الكل',
            en: 'All'
        },
        approve: {
            ar: 'اعتماد',
            en: 'Approve'
        },
        reject: {
            ar: 'رفض',
            en: 'Reject'
        },
        transferred: {
            ar: 'تم التحويل',
            en: 'Transferred'
        },
        confirmApprove: {
            ar: 'تأكيد الاعتماد',
            en: 'Confirm approval'
        },
        confirmReject: {
            ar: 'تأكيد الرفض',
            en: 'Confirm rejection'
        },
        adminNote: {
            ar: 'ملاحظة للأدمن (اختياري)',
            en: 'Admin note (optional)'
        },
        adminNotePlaceholder: {
            ar: 'مثال: تم رفض الطلب بسبب عدم وصول المبلغ...',
            en: 'e.g. Rejected due to payment not received...'
        },
        pendingDeposits: {
            ar: 'إيداعات بانتظار المراجعة',
            en: 'Deposits pending review'
        },
        pendingWithdrawals: {
            ar: 'سحوبات بانتظار المراجعة',
            en: 'Withdrawals pending review'
        },
        totalUsers: {
            ar: 'إجمالي المسجلين',
            en: 'Total users'
        },
        liquidity: {
            ar: 'السيولة',
            en: 'Liquidity'
        },
        user: {
            ar: 'المستخدم',
            en: 'User'
        },
        phone: {
            ar: 'الهاتف',
            en: 'Phone'
        },
        egpBalance: {
            ar: 'رصيد EGP',
            en: 'EGP Balance'
        },
        usdtBalance: {
            ar: 'رصيد USDT',
            en: 'USDT Balance'
        },
        activity: {
            ar: 'النشاط',
            en: 'Activity'
        },
        status: {
            ar: 'الحالة',
            en: 'Status'
        },
        action: {
            ar: 'إجراء',
            en: 'Action'
        },
        suspend: {
            ar: 'إيقاف',
            en: 'Suspend'
        },
        activate: {
            ar: 'تفعيل',
            en: 'Activate'
        },
        active: {
            ar: 'نشط',
            en: 'Active'
        },
        suspended: {
            ar: 'موقوف',
            en: 'Suspended'
        },
        adminRole: {
            ar: 'أدمن',
            en: 'Admin'
        },
        buyPrice: {
            ar: 'سعر الشراء (جنيه/USDT)',
            en: 'Buy price (EGP/USDT)'
        },
        sellPrice: {
            ar: 'سعر البيع (جنيه/USDT)',
            en: 'Sell price (EGP/USDT)'
        },
        minTrade: {
            ar: 'أقل تداول مباشر',
            en: 'Min direct trade'
        },
        maxTrade: {
            ar: 'أعلى تداول مباشر',
            en: 'Max direct trade'
        },
        minP2p: {
            ar: 'أقل صفقة P2P',
            en: 'Min P2P trade'
        },
        maxP2p: {
            ar: 'أعلى صفقة P2P',
            en: 'Max P2P trade'
        },
        platformFee: {
            ar: 'رسوم التداول المباشر (%)',
            en: 'Direct trading fee (%)'
        },
        p2pFee: {
            ar: 'رسوم P2P (%)',
            en: 'P2P fee (%)'
        },
        saveSettings: {
            ar: 'حفظ الإعدادات',
            en: 'Save settings'
        },
        priceSettings: {
            ar: 'أسعار التداول المباشر',
            en: 'Direct trading prices'
        },
        limitSettings: {
            ar: 'حدود التداول',
            en: 'Trading limits'
        },
        feeSettings: {
            ar: 'الرسوم',
            en: 'Fees'
        },
        noRequests: {
            ar: 'لا توجد طلبات',
            en: 'No requests'
        },
        noUsers: {
            ar: 'لا يوجد مستخدمون',
            en: 'No users'
        },
        livePriceInfo: {
            ar: 'الأسعار حية تلقائياً',
            en: 'Prices are live automatically'
        },
        livePriceDesc: {
            ar: 'أسعار التداول تأتي مباشرة من السوق العالمي ولا يمكن تعديلها يدوياً. التحكم هنا في حدود التداول والرسوم فقط.',
            en: 'Trading prices come live from the global market and cannot be set manually. You control only trade limits and fees here.'
        },
        // Google OAuth admin management
        googleOAuth: {
            ar: 'تسجيل الدخول عبر جوجل',
            en: 'Google Sign-In'
        },
        googleOAuthDesc: {
            ar: 'تفعيل وإعداد تسجيل الدخول عبر حساب جوجل للمستخدمين',
            en: 'Enable and configure Google sign-in for users'
        },
        googleEnabled: {
            ar: 'مفعّل',
            en: 'Enabled'
        },
        googleDisabled: {
            ar: 'معطّل',
            en: 'Disabled'
        },
        googleEnable: {
            ar: 'تفعيل تسجيل جوجل',
            en: 'Enable Google sign-in'
        },
        googleClientId: {
            ar: 'Google Client ID',
            en: 'Google Client ID'
        },
        googleClientSecret: {
            ar: 'Google Client Secret',
            en: 'Google Client Secret'
        },
        googleClientIdHint: {
            ar: 'من Google Cloud Console → Credentials',
            en: 'From Google Cloud Console → Credentials'
        },
        googleSave: {
            ar: 'حفظ إعدادات جوجل',
            en: 'Save Google settings'
        },
        googleSaved: {
            ar: 'تم حفظ إعدادات جوجل',
            en: 'Google settings saved'
        },
        googleHelp: {
            ar: 'لتفعيل تسجيل الدخول عبر جوجل: أنشئ مشروعاً في Google Cloud Console، فعّل Google+ API، أنشئ OAuth 2.0 Client ID، وانسخ Client ID هنا',
            en: 'To enable Google sign-in: create a project in Google Cloud Console, enable Google+ API, create an OAuth 2.0 Client ID, and paste the Client ID here'
        }
    },
    // ===== Legal: Terms & Privacy =====
    legal: {
        termsTitle: {
            ar: 'الشروط والأحكام',
            en: 'Terms & Conditions'
        },
        privacyTitle: {
            ar: 'سياسة الخصوصية',
            en: 'Privacy Policy'
        },
        lastUpdated: {
            ar: 'آخر تحديث',
            en: 'Last updated'
        },
        close: {
            ar: 'إغلاق',
            en: 'Close'
        },
        print: {
            ar: 'طباعة',
            en: 'Print'
        },
        // Terms sections
        termsIntro: {
            ar: 'مرحباً بك في منصة Eg-Money. باستخدامك لمنصتنا فإنك توافق على الالتزام بالشروط والأحكام التالية. يُرجى قراءتها بعناية قبل البدء في استخدام أي خدمة من خدماتنا. إذا كنت لا توافق على أي بند من هذه الشروط، فيُرجى عدم استخدام المنصة.',
            en: 'Welcome to Eg-Money. By using our platform, you agree to comply with the following Terms & Conditions. Please read them carefully before using any of our services. If you do not agree to any of these terms, please do not use the platform.'
        },
        termsAcceptanceTitle: {
            ar: '1. قبول الشروط',
            en: '1. Acceptance of Terms'
        },
        termsAcceptanceBody: {
            ar: 'بدخولك أو استخدامك لمنصة Eg-Money بأي طريقة، فإنك تقر بأنك قرأت وفهمت ووافقت على هذه الشروط والأحكام بالإضافة إلى سياسة الخصوصية. إذا كان المستخدم قاصراً (أقل من 18 عاماً)، فيجب الحصول على موافقة ولي الأمر قبل استخدام المنصة.',
            en: 'By accessing or using Eg-Money in any way, you acknowledge that you have read, understood, and agreed to these Terms & Conditions along with the Privacy Policy. If the user is a minor (under 18 years old), parental consent must be obtained before using the platform.'
        },
        termsEligibilityTitle: {
            ar: '2. أهلية المستخدم',
            en: '2. User Eligibility'
        },
        termsEligibilityBody: {
            ar: 'يجب أن يكون عمر المستخدم 18 عاماً على الأقل لإنشاء حساب وإجراء معاملات. كما يُشترط تقديم معلومات صحيحة ودقيقة عند التسجيل، بما في ذلك اسم المستخدم، البريد الإلكتروني، ورقم الهاتف مع رمز الدولة. يتحمل المستخدم المسؤولية الكاملة عن حفظ سرية بيانات الدخول وكلمة المرور.',
            en: 'Users must be at least 18 years old to create an account and perform transactions. Users must also provide true and accurate information during registration, including username, email, and phone number with country code. The user bears full responsibility for keeping login credentials and password confidential.'
        },
        termsServicesTitle: {
            ar: '3. الخدمات المقدمة',
            en: '3. Services Provided'
        },
        termsServicesBody: {
            ar: 'تقدم Eg-Money خدمات بيع وشراء USDT مقابل الجنيه المصري، تداول مباشر، سوق P2P بنظام ضمان Escrow، إيداع وسحب عبر طرق دفع مصرية معتمدة. كما تتيح المنصة نظام إحالة لمكافأة المستخدمين. تحتفظ الإدارة بحق تعديل أو إيقاف أي خدمة في أي وقت دون إشعار مسبق.',
            en: 'Eg-Money offers services for buying and selling USDT against the Egyptian Pound, direct trading, a P2P market with Escrow protection, and deposits/withdrawals via approved Egyptian payment methods. The platform also offers a referral program to reward users. The administration reserves the right to modify or discontinue any service at any time without prior notice.'
        },
        termsKycTitle: {
            ar: '4. التحقق من الهوية (KYC)',
            en: '4. Identity Verification (KYC)'
        },
        termsKycBody: {
            ar: 'يجوز للمنصة طلب وثائق إثبات الهوية (بطاقة شخصية، جواز سفر، فاتورة مرافق) للتحقق من هوية المستخدم قبل معالجة المعاملات الكبيرة أو السحوبات. عدم تقديم الوثائق المطلوبة قد يؤدي إلى تقييد الحساب.',
            en: 'The platform may request identity verification documents (national ID, passport, utility bill) to verify the user\'s identity before processing large transactions or withdrawals. Failure to provide requested documents may result in account restriction.'
        },
        termsFeesTitle: {
            ar: '5. الرسوم والعمولات',
            en: '5. Fees and Commissions'
        },
        termsFeesBody: {
            ar: 'تفرض المنصة رسوماً على التداول المباشر (نسبة مئوية محددة في الإعدادات) ورسوماً على صفقات P2P. يتم عرض الرسوم بوضوح قبل تأكيد أي معاملة. قد تتغير الرسوم ويتم تحديثها في لوحة الإدارة، ويسري التغيير على المعاملات الجديدة فقط.',
            en: 'The platform charges fees on direct trading (a percentage specified in settings) and fees on P2P trades. Fees are clearly displayed before confirming any transaction. Fees may change and be updated in the admin panel, with changes applying only to new transactions.'
        },
        termsProhibitedTitle: {
            ar: '6. الأنشطة المحظورة',
            en: '6. Prohibited Activities'
        },
        termsProhibitedBody: {
            ar: 'يُحظر على المستخدم استخدام المنصة في غسل الأموال، تمويل الإرهاب، الاحتيال، أو أي نشاط مخالف للقوانين المصرية. كما يُحظر إنشاء حسابات متعددة لنفس الشخص، استخدام بيانات مزورة، أو محاولة اختراق النظام. أي مخالفة تؤدي لإيقاف الحساب فوراً ومصادرة الأرصدة.',
            en: 'Users are prohibited from using the platform for money laundering, terrorism financing, fraud, or any activity contrary to Egyptian laws. Creating multiple accounts for the same person, using forged data, or attempting to breach the system is also prohibited. Any violation results in immediate account suspension and balance forfeiture.'
        },
        termsLiabilityTitle: {
            ar: '7. حدود المسؤولية',
            en: '7. Limitation of Liability'
        },
        termsLiabilityBody: {
            ar: 'لا تتحمل Eg-Money مسؤولية أي خسائر ناتجة عن تقلبات سوق العملات الرقمية، أعطال مؤقتة في الخدمة، أو قرارات استثمارية للمستخدم. مسؤولية المنصة تقتصر على الحفاظ على أرصدة المستخدمين المسجلة وقت وقوع الحادث. العملات الرقمية ذات طبيعة متقلبة، استثمر بحذر.',
            en: 'Eg-Money is not liable for losses resulting from cryptocurrency market volatility, temporary service outages, or user investment decisions. The platform\'s responsibility is limited to safeguarding registered user balances at the time of the incident. Cryptocurrencies are volatile by nature, invest with caution.'
        },
        termsAccountTitle: {
            ar: '8. إدارة الحساب والإيقاف',
            en: '8. Account Management & Suspension'
        },
        termsAccountBody: {
            ar: 'تحتفظ الإدارة بحق إيقاف أو إنهاء أي حساب مخالف للشروط، أو يشتبه في نشاطه الضار، بناءً على طلب الجهات الرسمية. يمكن للمستخدم إغلاق حسابه في أي وقت عبر التواصل مع الدعم، شريطة تصفية جميع المعاملات المعلقة.',
            en: 'The administration reserves the right to suspend or terminate any account violating the terms, or suspected of malicious activity, upon request from official authorities. Users can close their account at any time by contacting support, provided all pending transactions are settled.'
        },
        termsReferralTitle: {
            ar: '9. نظام الإحالة',
            en: '9. Referral Program'
        },
        termsReferralBody: {
            ar: 'يحصل كل مستخدم على كود إحالة فريد يمكن مشاركته. عند تسجيل مستخدم جديد باستخدام الكود وإتمامه أول إيداع أو صفقة، يحصل المُحيل على مكافأة 50 جنيه. يُحظر إساءة استخدام نظام الإحالة بإنشاء حسابات وهمية، وقد تُلغى المكافآت في حال الاشتباه.',
            en: 'Each user receives a unique referral code that can be shared. When a new user registers using the code and completes their first deposit or trade, the referrer receives a 50 EGP reward. Abuse of the referral program by creating fake accounts is prohibited, and rewards may be cancelled upon suspicion.'
        },
        termsChangesTitle: {
            ar: '10. تعديل الشروط',
            en: '10. Changes to Terms'
        },
        termsChangesBody: {
            ar: 'يجوز للمنصة تعديل هذه الشروط في أي وقت. يتم نشر التعديلات على هذه الصفحة مع تحديث تاريخ "آخر تحديث". استمرارك في استخدام المنصة بعد التعديلات يُعد قبولاً ضمنياً للشروط المعدّلة.',
            en: 'The platform may modify these terms at any time. Changes will be published on this page with an updated "Last updated" date. Your continued use of the platform after changes constitutes implicit acceptance of the modified terms.'
        },
        termsContactTitle: {
            ar: '11. التواصل والدعم',
            en: '11. Contact & Support'
        },
        termsContactBody: {
            ar: 'للاستفسارات أو الشكاوى، يمكن التواصل مع الدعم عبر البريد الإلكتروني support@eg-money.com. يتم الرد على الاستفسارات خلال 48 ساعة عمل.',
            en: 'For inquiries or complaints, you can contact support via email at support@eg-money.com. Inquiries are responded to within 48 business hours.'
        },
        // Privacy sections
        privacyIntro: {
            ar: 'تحترم Eg-Money خصوصية مستخدميها وتلتزم بحماية بياناتهم الشخصية. توضح هذه السياسة أنواع البيانات التي نجمعها، كيفية استخدامها، وم حقوقك في التحكم بها. باستخدامك للمنصة فإنك توافق على ممارسات جمع البيانات الموضحة هنا.',
            en: 'Eg-Money respects the privacy of its users and is committed to protecting their personal data. This policy explains the types of data we collect, how it is used, and your rights to control it. By using the platform, you agree to the data collection practices described here.'
        },
        privacyCollectTitle: {
            ar: '1. البيانات التي نجمعها',
            en: '1. Data We Collect'
        },
        privacyCollectBody: {
            ar: 'نجمع البيانات التالية: (أ) بيانات التسجيل: اسم المستخدم، البريد الإلكتروني، رقم الهاتف مع رمز الدولة، كلمة المرور (مشفّرة). (ب) بيانات المعاملات: الإيداعات، السحوبات، التداولات، صفقات P2P. (ج) بيانات تقنية: عنوان IP، نوع المتصفح، نظام التشغيل. (د) بيانات Google OAuth (اختيارية): الاسم، البريد، صورة الحساب عند ربط جوجل.',
            en: 'We collect the following data: (a) Registration data: username, email, phone number with country code, password (hashed). (b) Transaction data: deposits, withdrawals, trades, P2P deals. (c) Technical data: IP address, browser type, operating system. (d) Google OAuth data (optional): name, email, account picture when Google is linked.'
        },
        privacyUseTitle: {
            ar: '2. كيفية استخدام البيانات',
            en: '2. How We Use Data'
        },
        privacyUseBody: {
            ar: 'تُستخدم بياناتك في: توفير خدمات التداول، التحقق من الهوية، معالجة المعاملات، إرسال إشعارات (أسعار، معاملات، أمان)، الرد على استفساراتك، الالتزام بالقوانين المصرية لمكافحة غسل الأموال. لا نبيع بياناتك لأي طرف ثالث لأغراض تسويقية.',
            en: 'Your data is used to: provide trading services, verify identity, process transactions, send notifications (prices, transactions, security), respond to inquiries, and comply with Egyptian anti-money laundering laws. We do not sell your data to any third party for marketing purposes.'
        },
        privacyStoreTitle: {
            ar: '3. تخزين البيانات وحمايتها',
            en: '3. Data Storage & Protection'
        },
        privacyStoreBody: {
            ar: 'تُخزَّن بياناتك على خوادم مؤمّنة باستخدام بروتوكولات تشفير حديثة. كلمات المرور تُشفّر باستخدام خوارزمية PBKDF2 مع 10000 جولة. الوصول للبيانات يقتصر على موظفين معتمدين فقط ولأغراض تشغيلية. نحتفظ بالبيانات طوال فترة نشاط الحساب плюс المدة المطلوبة قانوناً.',
            en: 'Your data is stored on secured servers using modern encryption protocols. Passwords are hashed using PBKDF2 with 10,000 iterations. Access to data is restricted to authorized personnel for operational purposes only. We retain data for the duration of account activity plus the legally required period.'
        },
        privacyShareTitle: {
            ar: '4. مشاركة البيانات',
            en: '4. Data Sharing'
        },
        privacyShareBody: {
            ar: 'قد نشارك بياناتك في الحالات التالية فقط: (أ) بناءً على أمر قضائي من الجهات المصرية المختصة. (ب) مع مزودي خدمات الدفع (فودافون كاش، إنستا باي، فوري) لتنفيذ معاملاتك. (ج) مع Google عند استخدام تسجيل الدخول عبر جوجل، وفقاً لسياسة جوجل للخصوصية. لا نشارك البيانات لأغراض إعلانية.',
            en: 'We may share your data only in the following cases: (a) Upon judicial order from competent Egyptian authorities. (b) With payment providers (Vodafone Cash, InstaPay, Fawry) to execute your transactions. (c) With Google when using Google sign-in, per Google\'s privacy policy. We do not share data for advertising purposes.'
        },
        privacyRightsTitle: {
            ar: '5. حقوقك',
            en: '5. Your Rights'
        },
        privacyRightsBody: {
            ar: 'لديك الحقوق التالية: (أ) الوصول لبياناتك وتنزيل نسخة منها. (ب) تصحيح أي بيانات غير صحيحة. (ج) طلب حذف الحساب والبيانات المرتبطة (مع مراعاة الالتزامات القانونية بالاحتفاظ بسجلات المعاملات). (د) سحب الموافقة على استخدام Google OAuth في أي وقت. لتمارس هذه الحقوق، تواصل مع support@eg-money.com.',
            en: 'You have the following rights: (a) Access your data and download a copy. (b) Correct any inaccurate data. (c) Request account deletion and associated data (subject to legal obligations to retain transaction records). (d) Withdraw consent for Google OAuth usage at any time. To exercise these rights, contact support@eg-money.com.'
        },
        privacyCookiesTitle: {
            ar: '6. ملفات تعريف الارتباط (Cookies)',
            en: '6. Cookies'
        },
        privacyCookiesBody: {
            ar: 'نستخدم ملفات تعريف الارتباط لحفظ جلسة الدخول، تفضيلات اللغة والوضع (داكن/فاتح)، وتحسين تجربة الاستخدام. يمكنك التحكم في ملفات الارتباط عبر إعدادات متصفحك، لكن قد يؤثر ذلك على وظائف المنصة.',
            en: 'We use cookies to save your login session, language and mode preferences (dark/light), and to improve user experience. You can control cookies through your browser settings, but this may affect platform functionality.'
        },
        privacySecurityTitle: {
            ar: '7. إجراءات الأمان',
            en: '7. Security Measures'
        },
        privacySecurityBody: {
            ar: 'نطبق إجراءات أمان تشمل: تشفير كلمات المرور، حد معدل محاولات الدخول، إبطال الجلسات عند تغيير كلمة المرور، نظام ضمان Escrow للصفقات، مراجعة بشرية للمعاملات الكبيرة. على الرغم من هذه الإجراءات، لا يمكن ضمان أمان مطلق على الإنترنت، ويُنصح المستخدمون باتخاذ احتياطاتهم (كلمة مرور قوية، تفعيل التحقق الثنائي إن توفر).',
            en: 'We apply security measures including: password hashing, login rate limiting, session invalidation on password change, Escrow system for trades, and human review for large transactions. Despite these measures, absolute online security cannot be guaranteed, and users are advised to take their own precautions (strong password, enabling 2FA when available).'
        },
        privacyContactTitle: {
            ar: '8. التواصل بخصوص الخصوصية',
            en: '8. Contact About Privacy'
        },
        privacyContactBody: {
            ar: 'لأي استفسار يتعلق بسياسة الخصوصية أو بياناتك الشخصية، يُرجى التواصل عبر support@eg-money.com أو العنوان: Eg-Money Privacy Office, Cairo, Egypt.',
            en: 'For any inquiry regarding the privacy policy or your personal data, please contact support@eg-money.com or the address: Eg-Money Privacy Office, Cairo, Egypt.'
        }
    },
    // ===== Payment Methods =====
    paymentMethods: {
        vodafone: {
            ar: 'فودافون كاش',
            en: 'Vodafone Cash'
        },
        instapay: {
            ar: 'إنستا باي',
            en: 'InstaPay'
        },
        fawry: {
            ar: 'فوري',
            en: 'Fawry'
        },
        bank: {
            ar: 'تحويل بنكي',
            en: 'Bank Transfer'
        }
    },
    // ===== Common =====
    common: {
        cancel: {
            ar: 'إلغاء',
            en: 'Cancel'
        },
        confirm: {
            ar: 'تأكيد',
            en: 'Confirm'
        },
        close: {
            ar: 'إغلاق',
            en: 'Close'
        },
        save: {
            ar: 'حفظ',
            en: 'Save'
        },
        delete: {
            ar: 'حذف',
            en: 'Delete'
        },
        edit: {
            ar: 'تعديل',
            en: 'Edit'
        },
        loading: {
            ar: 'جارٍ التحميل...',
            en: 'Loading...'
        },
        error: {
            ar: 'حدث خطأ غير متوقع',
            en: 'An unexpected error occurred'
        },
        success: {
            ar: 'تم بنجاح',
            en: 'Done successfully'
        },
        retry: {
            ar: 'إعادة المحاولة',
            en: 'Retry'
        },
        back: {
            ar: 'رجوع',
            en: 'Back'
        },
        next: {
            ar: 'التالي',
            en: 'Next'
        },
        yes: {
            ar: 'نعم',
            en: 'Yes'
        },
        no: {
            ar: 'لا',
            en: 'No'
        },
        optional: {
            ar: 'اختياري',
            en: 'optional'
        }
    }
};
function t(lang, path) {
    const keys = path.split('.');
    let result = translations;
    for (const key of keys){
        if (result && typeof result === 'object' && key in result) {
            result = result[key];
        } else {
            return path // fallback: return the path itself
            ;
        }
    }
    if (result && typeof result === 'object' && lang in result) {
        return result[lang];
    }
    return path;
}
}),
"[project]/src/lib/countries.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// All world countries with ISO codes, dial codes, and flag emojis.
// Flag emoji is derived from the country's ISO 3166-1 alpha-2 code by
// mapping each letter to a regional indicator symbol.
__turbopack_context__.s([
    "COUNTRIES",
    ()=>COUNTRIES,
    "DEFAULT_COUNTRY",
    ()=>DEFAULT_COUNTRY,
    "getCountryByCode",
    ()=>getCountryByCode,
    "getCountryByDialCode",
    ()=>getCountryByDialCode
]);
function flag(code) {
    return String.fromCodePoint(...[
        ...code.toUpperCase()
    ].map((c)=>0x1f1e6 - 65 + c.charCodeAt(0)));
}
const rawCountries = [
    // [ISO, EN name, AR name, dial code]
    [
        'EG',
        'Egypt',
        'مصر',
        '+20'
    ],
    [
        'SA',
        'Saudi Arabia',
        'السعودية',
        '+966'
    ],
    [
        'AE',
        'United Arab Emirates',
        'الإمارات',
        '+971'
    ],
    [
        'KW',
        'Kuwait',
        'الكويت',
        '+965'
    ],
    [
        'QA',
        'Qatar',
        'قطر',
        '+974'
    ],
    [
        'BH',
        'Bahrain',
        'البحرين',
        '+973'
    ],
    [
        'OM',
        'Oman',
        'عُمان',
        '+968'
    ],
    [
        'JO',
        'Jordan',
        'الأردن',
        '+962'
    ],
    [
        'PS',
        'Palestine',
        'فلسطين',
        '+970'
    ],
    [
        'LB',
        'Lebanon',
        'لبنان',
        '+961'
    ],
    [
        'SY',
        'Syria',
        'سوريا',
        '+963'
    ],
    [
        'IQ',
        'Iraq',
        'العراق',
        '+964'
    ],
    [
        'YE',
        'Yemen',
        'اليمن',
        '+967'
    ],
    [
        'SD',
        'Sudan',
        'السودان',
        '+249'
    ],
    [
        'LY',
        'Libya',
        'ليبيا',
        '+218'
    ],
    [
        'TN',
        'Tunisia',
        'تونس',
        '+216'
    ],
    [
        'DZ',
        'Algeria',
        'الجزائر',
        '+213'
    ],
    [
        'MA',
        'Morocco',
        'المغرب',
        '+212'
    ],
    [
        'MR',
        'Mauritania',
        'موريتانيا',
        '+222'
    ],
    [
        'SO',
        'Somalia',
        'الصومال',
        '+252'
    ],
    [
        'DJ',
        'Djibouti',
        'جيبوتي',
        '+253'
    ],
    [
        'KM',
        'Comoros',
        'جزر القمر',
        '+269'
    ],
    [
        'US',
        'United States',
        'الولايات المتحدة',
        '+1'
    ],
    [
        'CA',
        'Canada',
        'كندا',
        '+1'
    ],
    [
        'GB',
        'United Kingdom',
        'المملكة المتحدة',
        '+44'
    ],
    [
        'FR',
        'France',
        'فرنسا',
        '+33'
    ],
    [
        'DE',
        'Germany',
        'ألمانيا',
        '+49'
    ],
    [
        'IT',
        'Italy',
        'إيطاليا',
        '+39'
    ],
    [
        'ES',
        'Spain',
        'إسبانيا',
        '+34'
    ],
    [
        'PT',
        'Portugal',
        'البرتغال',
        '+351'
    ],
    [
        'NL',
        'Netherlands',
        'هولندا',
        '+31'
    ],
    [
        'BE',
        'Belgium',
        'بلجيكا',
        '+32'
    ],
    [
        'CH',
        'Switzerland',
        'سويسرا',
        '+41'
    ],
    [
        'AT',
        'Austria',
        'النمسا',
        '+43'
    ],
    [
        'SE',
        'Sweden',
        'السويد',
        '+46'
    ],
    [
        'NO',
        'Norway',
        'النرويج',
        '+47'
    ],
    [
        'DK',
        'Denmark',
        'الدانمرك',
        '+45'
    ],
    [
        'FI',
        'Finland',
        'فنلندا',
        '+358'
    ],
    [
        'IS',
        'Iceland',
        'آيسلندا',
        '+354'
    ],
    [
        'IE',
        'Ireland',
        'أيرلندا',
        '+353'
    ],
    [
        'PL',
        'Poland',
        'بولندا',
        '+48'
    ],
    [
        'CZ',
        'Czech Republic',
        'التشيك',
        '+420'
    ],
    [
        'SK',
        'Slovakia',
        'سلوفاكيا',
        '+421'
    ],
    [
        'HU',
        'Hungary',
        'المجر',
        '+36'
    ],
    [
        'RO',
        'Romania',
        'رومانيا',
        '+40'
    ],
    [
        'BG',
        'Bulgaria',
        'بلغاريا',
        '+359'
    ],
    [
        'GR',
        'Greece',
        'اليونان',
        '+30'
    ],
    [
        'HR',
        'Croatia',
        'كرواتيا',
        '+385'
    ],
    [
        'RS',
        'Serbia',
        'صربيا',
        '+381'
    ],
    [
        'SI',
        'Slovenia',
        'سلوفينيا',
        '+386'
    ],
    [
        'BA',
        'Bosnia and Herzegovina',
        'البوسنة والهرسك',
        '+387'
    ],
    [
        'MK',
        'North Macedonia',
        'مقدونيا الشمالية',
        '+389'
    ],
    [
        'AL',
        'Albania',
        'ألبانيا',
        '+355'
    ],
    [
        'ME',
        'Montenegro',
        'الجبل الأسود',
        '+382'
    ],
    [
        'RU',
        'Russia',
        'روسيا',
        '+7'
    ],
    [
        'UA',
        'Ukraine',
        'أوكرانيا',
        '+380'
    ],
    [
        'BY',
        'Belarus',
        'بيلاروس',
        '+375'
    ],
    [
        'MD',
        'Moldova',
        'مولدوفا',
        '+373'
    ],
    [
        'LT',
        'Lithuania',
        'ليتوانيا',
        '+370'
    ],
    [
        'LV',
        'Latvia',
        'لاتفيا',
        '+371'
    ],
    [
        'EE',
        'Estonia',
        'إستونيا',
        '+372'
    ],
    [
        'TR',
        'Turkey',
        'تركيا',
        '+90'
    ],
    [
        'CY',
        'Cyprus',
        'قبرص',
        '+357'
    ],
    [
        'MT',
        'Malta',
        'مالطة',
        '+356'
    ],
    [
        'LU',
        'Luxembourg',
        'لوكسمبورغ',
        '+352'
    ],
    [
        'MC',
        'Monaco',
        'موناكو',
        '+377'
    ],
    [
        'AD',
        'Andorra',
        'أندورا',
        '+376'
    ],
    [
        'SM',
        'San Marino',
        'سان مارينو',
        '+378'
    ],
    [
        'VA',
        'Vatican City',
        'الفاتيكان',
        '+379'
    ],
    [
        'CN',
        'China',
        'الصين',
        '+86'
    ],
    [
        'JP',
        'Japan',
        'اليابان',
        '+81'
    ],
    [
        'KR',
        'South Korea',
        'كوريا الجنوبية',
        '+82'
    ],
    [
        'KP',
        'North Korea',
        'كوريا الشمالية',
        '+850'
    ],
    [
        'IN',
        'India',
        'الهند',
        '+91'
    ],
    [
        'PK',
        'Pakistan',
        'باكستان',
        '+92'
    ],
    [
        'BD',
        'Bangladesh',
        'بنغلاديش',
        '+880'
    ],
    [
        'LK',
        'Sri Lanka',
        'سريلانكا',
        '+94'
    ],
    [
        'NP',
        'Nepal',
        'نيبال',
        '+977'
    ],
    [
        'BT',
        'Bhutan',
        'بوتان',
        '+975'
    ],
    [
        'MV',
        'Maldives',
        'المالديف',
        '+960'
    ],
    [
        'TH',
        'Thailand',
        'تايلاند',
        '+66'
    ],
    [
        'MY',
        'Malaysia',
        'ماليزيا',
        '+60'
    ],
    [
        'SG',
        'Singapore',
        'سنغافورة',
        '+65'
    ],
    [
        'ID',
        'Indonesia',
        'إندونيسيا',
        '+62'
    ],
    [
        'PH',
        'Philippines',
        'الفلبين',
        '+63'
    ],
    [
        'VN',
        'Vietnam',
        'فيتنام',
        '+84'
    ],
    [
        'LA',
        'Laos',
        'لاوس',
        '+856'
    ],
    [
        'KH',
        'Cambodia',
        'كمبوديا',
        '+855'
    ],
    [
        'MM',
        'Myanmar',
        'ميانمار',
        '+95'
    ],
    [
        'BN',
        'Brunei',
        'بروناي',
        '+673'
    ],
    [
        'TL',
        'Timor-Leste',
        'تيمور الشرقية',
        '+670'
    ],
    [
        'AF',
        'Afghanistan',
        'أفغانستان',
        '+93'
    ],
    [
        'IR',
        'Iran',
        'إيران',
        '+98'
    ],
    [
        'UZ',
        'Uzbekistan',
        'أوزبكستان',
        '+998'
    ],
    [
        'KZ',
        'Kazakhstan',
        'كازاخستان',
        '+7'
    ],
    [
        'KG',
        'Kyrgyzstan',
        'قيرغيزستان',
        '+996'
    ],
    [
        'TJ',
        'Tajikistan',
        'طاجيكستان',
        '+992'
    ],
    [
        'TM',
        'Turkmenistan',
        'تركمانستان',
        '+993'
    ],
    [
        'MN',
        'Mongolia',
        'منغوليا',
        '+976'
    ],
    [
        'AU',
        'Australia',
        'أستراليا',
        '+61'
    ],
    [
        'NZ',
        'New Zealand',
        'نيوزيلندا',
        '+64'
    ],
    [
        'FJ',
        'Fiji',
        'فيجي',
        '+679'
    ],
    [
        'PG',
        'Papua New Guinea',
        'بابوا غينيا الجديدة',
        '+675'
    ],
    [
        'SB',
        'Solomon Islands',
        'جزر سليمان',
        '+677'
    ],
    [
        'VU',
        'Vanuatu',
        'فانواتو',
        '+678'
    ],
    [
        'WS',
        'Samoa',
        'ساموا',
        '+685'
    ],
    [
        'TO',
        'Tonga',
        'تونغا',
        '+676'
    ],
    [
        'BR',
        'Brazil',
        'البرازيل',
        '+55'
    ],
    [
        'AR',
        'Argentina',
        'الأرجنتين',
        '+54'
    ],
    [
        'CL',
        'Chile',
        'تشيلي',
        '+56'
    ],
    [
        'CO',
        'Colombia',
        'كولومبيا',
        '+57'
    ],
    [
        'PE',
        'Peru',
        'بيرو',
        '+51'
    ],
    [
        'VE',
        'Venezuela',
        'فنزويلا',
        '+58'
    ],
    [
        'BO',
        'Bolivia',
        'بوليفيا',
        '+591'
    ],
    [
        'EC',
        'Ecuador',
        'الإكوادور',
        '+593'
    ],
    [
        'PY',
        'Paraguay',
        'باراغواي',
        '+595'
    ],
    [
        'UY',
        'Uruguay',
        'الأوروغواي',
        '+598'
    ],
    [
        'GY',
        'Guyana',
        'غيانا',
        '+592'
    ],
    [
        'SR',
        'Suriname',
        'سورينام',
        '+597'
    ],
    [
        'MX',
        'Mexico',
        'المكسيك',
        '+52'
    ],
    [
        'GT',
        'Guatemala',
        'غواتيمالا',
        '+502'
    ],
    [
        'HN',
        'Honduras',
        'هندوراس',
        '+504'
    ],
    [
        'SV',
        'El Salvador',
        'السلفادور',
        '+503'
    ],
    [
        'NI',
        'Nicaragua',
        'نيكاراغوا',
        '+505'
    ],
    [
        'CR',
        'Costa Rica',
        'كوستاريكا',
        '+506'
    ],
    [
        'PA',
        'Panama',
        'بنما',
        '+507'
    ],
    [
        'BZ',
        'Belize',
        'بليز',
        '+501'
    ],
    [
        'CU',
        'Cuba',
        'كوبا',
        '+53'
    ],
    [
        'DO',
        'Dominican Republic',
        'جمهورية الدومينيكان',
        '+1'
    ],
    [
        'HT',
        'Haiti',
        'هايتي',
        '+509'
    ],
    [
        'JM',
        'Jamaica',
        'جامايكا',
        '+1'
    ],
    [
        'TT',
        'Trinidad and Tobago',
        'ترينيداد وتوباغو',
        '+1'
    ],
    [
        'BS',
        'Bahamas',
        'الباهاما',
        '+1'
    ],
    [
        'BB',
        'Barbados',
        'بربادوس',
        '+1'
    ],
    [
        'GD',
        'Grenada',
        'غرينادا',
        '+1'
    ],
    [
        'LC',
        'Saint Lucia',
        'سانت لوسيا',
        '+1'
    ],
    [
        'VC',
        'Saint Vincent and the Grenadines',
        'سانت فينسنت',
        '+1'
    ],
    [
        'AG',
        'Antigua and Barbuda',
        'أنتيغوا وباربودا',
        '+1'
    ],
    [
        'DM',
        'Dominica',
        'دومينيكا',
        '+1'
    ],
    [
        'KN',
        'Saint Kitts and Nevis',
        'سانت كيتس ونيفيس',
        '+1'
    ],
    [
        'ZA',
        'South Africa',
        'جنوب أفريقيا',
        '+27'
    ],
    [
        'NG',
        'Nigeria',
        'نيجيريا',
        '+234'
    ],
    [
        'KE',
        'Kenya',
        'كينيا',
        '+254'
    ],
    [
        'GH',
        'Ghana',
        'غانا',
        '+233'
    ],
    [
        'ET',
        'Ethiopia',
        'إثيوبيا',
        '+251'
    ],
    [
        'TZ',
        'Tanzania',
        'تنزانيا',
        '+255'
    ],
    [
        'UG',
        'Uganda',
        'أوغندا',
        '+256'
    ],
    [
        'CM',
        'Cameroon',
        'الكاميرون',
        '+237'
    ],
    [
        'CI',
        "Côte d'Ivoire",
        'ساحل العاج',
        '+225'
    ],
    [
        'SN',
        'Senegal',
        'السنغال',
        '+221'
    ],
    [
        'ZM',
        'Zambia',
        'زامبيا',
        '+260'
    ],
    [
        'ZW',
        'Zimbabwe',
        'زيمبابوي',
        '+263'
    ],
    [
        'RW',
        'Rwanda',
        'رواندا',
        '+250'
    ],
    [
        'BI',
        'Burundi',
        'بوروندي',
        '+257'
    ],
    [
        'MZ',
        'Mozambique',
        'موزمبيق',
        '+258'
    ],
    [
        'AO',
        'Angola',
        'أنغولا',
        '+244'
    ],
    [
        'MZ2',
        'Madagascar',
        'مدغشقر',
        '+261'
    ],
    [
        'MW',
        'Malawi',
        'مالاوي',
        '+265'
    ],
    [
        'ML',
        'Mali',
        'مالي',
        '+223'
    ],
    [
        'BF',
        'Burkina Faso',
        'بوركينا فاسو',
        '+226'
    ],
    [
        'NE',
        'Niger',
        'النيجر',
        '+227'
    ],
    [
        'TG',
        'Togo',
        'توغو',
        '+228'
    ],
    [
        'BJ',
        'Benin',
        'بنين',
        '+229'
    ],
    [
        'SL',
        'Sierra Leone',
        'سيراليون',
        '+232'
    ],
    [
        'LR',
        'Liberia',
        'ليبيريا',
        '+231'
    ],
    [
        'GN',
        'Guinea',
        'غينيا',
        '+224'
    ],
    [
        'GW',
        'Guinea-Bissau',
        'غينيا بيساو',
        '+245'
    ],
    [
        'CV',
        'Cape Verde',
        'الرأس الأخضر',
        '+238'
    ],
    [
        'ST',
        'São Tomé and Príncipe',
        'ساو تومي وبرينسيبي',
        '+239'
    ],
    [
        'GA',
        'Gabon',
        'الغابون',
        '+241'
    ],
    [
        'CG',
        'Congo',
        'الكونغو',
        '+242'
    ],
    [
        'CD',
        'DR Congo',
        'الكونغو الديمقراطية',
        '+243'
    ],
    [
        'CF',
        'Central African Republic',
        'أفريقيا الوسطى',
        '+236'
    ],
    [
        'TD',
        'Chad',
        'تشاد',
        '+235'
    ],
    [
        'EH',
        'Western Sahara',
        'الصحراء الغربية',
        '+212'
    ],
    [
        'LS',
        'Lesotho',
        'ليسوتو',
        '+266'
    ],
    [
        'SZ',
        'Eswatini',
        'إسواتيني',
        '+268'
    ],
    [
        'NA',
        'Namibia',
        'ناميبيا',
        '+264'
    ],
    [
        'BW',
        'Botswana',
        'بوتسوانا',
        '+267'
    ],
    [
        'MU',
        'Mauritius',
        'موريشيوس',
        '+230'
    ],
    [
        'SC',
        'Seychelles',
        'سيشل',
        '+248'
    ],
    [
        'RE',
        'Réunion',
        'ريونيون',
        '+262'
    ],
    [
        'YT',
        'Mayotte',
        'مايوت',
        '+262'
    ],
    [
        'TW',
        'Taiwan',
        'تايوان',
        '+886'
    ],
    [
        'HK',
        'Hong Kong',
        'هونغ كونغ',
        '+852'
    ],
    [
        'MO',
        'Macao',
        'ماكاو',
        '+853'
    ],
    [
        'GE',
        'Georgia',
        'جورجيا',
        '+995'
    ],
    [
        'AM',
        'Armenia',
        'أرمينيا',
        '+374'
    ],
    [
        'AZ',
        'Azerbaijan',
        'أذربيجان',
        '+994'
    ]
];
const COUNTRIES = rawCountries.filter(([code])=>!code.endsWith('2')).map(([code, name, nameAr, dialCode])=>({
        code,
        name,
        nameAr,
        dialCode,
        flag: flag(code)
    })).concat(// Add Madagascar which was tagged MZ2 above
rawCountries.filter(([code])=>code === 'MZ2').map(([code, name, nameAr, dialCode])=>({
        code: 'MG',
        name,
        nameAr,
        dialCode,
        flag: flag('MG')
    }))).sort((a, b)=>a.code.localeCompare(b.code));
function getCountryByCode(code) {
    return COUNTRIES.find((c)=>c.code === code);
}
function getCountryByDialCode(dial) {
    return COUNTRIES.find((c)=>c.dialCode === dial);
}
const DEFAULT_COUNTRY = getCountryByCode('EG') || COUNTRIES[0];
}),
"[project]/src/lib/edu-content.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Comprehensive trading education articles — real, practical content for Egyptian
// users trading USDT/EGP. Each article has AR + EN versions, realistic examples
// with actual numbers, and actionable advice.
__turbopack_context__.s([
    "EDU_ARTICLES",
    ()=>EDU_ARTICLES,
    "GLOSSARY",
    ()=>GLOSSARY
]);
const EDU_ARTICLES = [
    // ===================================================================
    {
        slug: 'what-is-usdt',
        level: 'beginner',
        category: 'basics',
        icon: '💵',
        readTime: 6,
        title: {
            ar: 'ما هو USDT وكيف يعمل؟',
            en: 'What is USDT and how does it work?'
        },
        excerpt: {
            ar: 'دليل شامل لفهم عملة تِثر (USDT)، الفرق بينها وبين الدولار، وآلية ربطها بالدولار الأمريكي.',
            en: 'A comprehensive guide to understanding Tether (USDT), how it\'s pegged to the US dollar, and why it matters.'
        },
        content: {
            ar: [
                {
                    type: 'paragraph',
                    text: 'USDT (Tether) هي عملة رقمية مستقرة (Stablecoin) قيمتها مربوطة بالدولار الأمريكي بنسبة 1:1 تقريباً. أي أن 1 USDT ≈ 1 دولار أمريكي. أُطلقت عام 2014 تحت اسم "Realcoin" ثم تغيّر الاسم إلى Tether.'
                },
                {
                    type: 'heading',
                    text: 'كيف تظل قيمتها ثابتة؟'
                },
                {
                    type: 'paragraph',
                    text: 'تقول شركة Tether Limited أنها تحتفظ باحتياطي من الدولار الأمريكي والأصول السائلة يعادل كمية USDT المصدرة. عند إصدار 1 USDT جديد، يتم إيداع 1 دولار في الاحتياطي. هذا ما يُسمى "الربط بالدولار" (Fiat Peg).'
                },
                {
                    type: 'warning',
                    text: 'في الواقع، احتياطيات Tether ليست مدققة بالكامل بنسبة 100% نقداً. تشمل سندات حكومية، قروض، وأصول أخرى. لذلك قد تنحرف السعر قليلاً (±0.5%) في أوقات الضغط.'
                },
                {
                    type: 'heading',
                    text: 'لماذا يستخدمها المصريون؟'
                },
                {
                    type: 'list',
                    items: [
                        'حماية المدخرات من تقلبات الجنيه المصري',
                        'تحويل أموال عبر الحدود بدون قيود بنكية',
                        'التحوط من التضخم (الدولار يحافظ على قيمته أفضل من الجنيه)',
                        'وسيط لشراء عملات رقمية أخرى (Bitcoin, Ethereum)',
                        'الدفع الدولي للخدمات (Freelance, E-commerce)'
                    ]
                },
                {
                    type: 'heading',
                    text: 'الفرق بين USDT و USDC و DAI'
                },
                {
                    type: 'paragraph',
                    text: 'هناك عدة عملات مستقرة مربوطة بالدولار. USDT هي الأكبر والأكثر سيولة، لكنها الأقل شفافية. USDC تُدار بواسطة Circle وتقدم تقارير تدقيق شهري. DAI لامركزية ومربوطة بالضمانات (Collateralized) بدلاً من الاحتياطي النقدي.'
                },
                {
                    type: 'example',
                    title: 'مثال واقعي',
                    body: 'إذا كان لديك 50,000 جنيه مصري وتريد حفظ قيمتها. في 2022، كان الدولار = 19 جنيه. في 2024، أصبح = 48 جنيه. لو حولت لـ USDT في 2022 (2,631 USDT)، اليوم قيمتها 2,631 × 48 = 126,288 جنيه. لو أبقيتها جنيه، ستظل 50,000 جنيه (خسرت 60% من القيمة الشرائية).'
                },
                {
                    type: 'tip',
                    text: 'USDT ليس استثماراً يربح — هو أداة حفظ قيمة. هدفه أن يكون 1 USDT = 1$ غداً وبعد سنة. الربح يأتي من التداول (شراء بسعر منخفض وبيع بسعر مرتفع).'
                }
            ],
            en: [
                {
                    type: 'paragraph',
                    text: 'USDT (Tether) is a stablecoin whose value is pegged to the US dollar at approximately 1:1. 1 USDT ≈ 1 USD. It launched in 2014 as "Realcoin" and later rebranded to Tether.'
                },
                {
                    type: 'heading',
                    text: 'How does it stay stable?'
                },
                {
                    type: 'paragraph',
                    text: 'Tether Limited claims to hold reserves of USD and liquid assets equal to the amount of USDT in circulation. For every 1 USDT issued, $1 is deposited in reserve. This is called a "fiat peg."'
                },
                {
                    type: 'warning',
                    text: 'In reality, Tether\'s reserves are not 100% cash. They include government bonds, loans, and other assets. The price can deviate slightly (±0.5%) during stress periods.'
                },
                {
                    type: 'heading',
                    text: 'Why do Egyptians use it?'
                },
                {
                    type: 'list',
                    items: [
                        'Protecting savings from EGP volatility',
                        'Cross-border transfers without banking restrictions',
                        'Hedging against inflation',
                        'A medium to buy other cryptocurrencies (Bitcoin, Ethereum)',
                        'International payments for freelancers and e-commerce'
                    ]
                },
                {
                    type: 'heading',
                    text: 'USDT vs USDC vs DAI'
                },
                {
                    type: 'paragraph',
                    text: 'There are several dollar-pegged stablecoins. USDT is the largest and most liquid but least transparent. USDC is managed by Circle with monthly audits. DAI is decentralized and collateralized rather than cash-backed.'
                },
                {
                    type: 'example',
                    title: 'Real-world example',
                    body: 'If you had 50,000 EGP in 2022 when USD = 19 EGP, and converted to USDT (2,631 USDT), today at USD = 48 EGP your holdings are worth 2,631 × 48 = 126,288 EGP. If you kept it in EGP, it would still be 50,000 EGP (losing 60% of purchasing power).'
                },
                {
                    type: 'tip',
                    text: 'USDT is not an investment that appreciates — it\'s a store of value. The goal is 1 USDT = $1 tomorrow and next year. Profit comes from trading (buying low, selling high).'
                }
            ]
        }
    },
    // ===================================================================
    {
        slug: 'how-p2p-trading-works',
        level: 'beginner',
        category: 'p2p',
        icon: '🤝',
        readTime: 8,
        title: {
            ar: 'كيف يعمل التداول P2P؟ شرح نظام Escrow',
            en: 'How P2P trading works — Escrow explained'
        },
        excerpt: {
            ar: 'فهم آلية الضمان (Escrow) في التداول من شخص لشخص، ولماذا هي آمنة وكيف تتم الصفقة خطوة بخطوة.',
            en: 'Understanding the Escrow mechanism in peer-to-peer trading, why it\'s safe, and how a trade executes step by step.'
        },
        content: {
            ar: [
                {
                    type: 'paragraph',
                    text: 'التداول P2P (Peer-to-Peer) يعني بيع وشراء USDT مباشرة بين مستخدمين، وليس من المنصة نفسها. المنصة تعمل كوسيط يضمن الأمان عبر نظام الضمان (Escrow).'
                },
                {
                    type: 'heading',
                    text: 'ما هو الـ Escrow؟'
                },
                {
                    type: 'paragraph',
                    text: 'الـ Escrow هو حساب ضمان مؤقت. عندما يضع البائع USDT للبيع، يتم "تجميدها" في حساب Escrow لا يمكن لأي طرف الوصول إليه. لا تُحرر إلا بعد أن يؤكد المشتري أنه دفع الجنيه واستلم البائع المبلغ.'
                },
                {
                    type: 'heading',
                    text: 'خطوات الصفقة (مثال عملي)'
                },
                {
                    type: 'list',
                    items: [
                        'أحمد يعرض بيع 1000 USDT بسعر 50 جنيه (يستلم 50,000 جنيه)',
                        'سارة ترى العرض وتضغط "شراء"',
                        'المنصة تجمد 1000 USDT من محفظة أحمد في Escrow',
                        'سارة تحوّل 50,000 جنيه إلى فودافون كاش الخاص بأحمد',
                        'سارة ترفع إيصال التحويل على المنصة',
                        'أحمد يؤكد استلام الـ 50,000 جنيه',
                        'المنصة تحرر 1000 USDT من Escrow إلى محفظة سارة',
                        'الصفقة مكتملة ✓'
                    ]
                },
                {
                    type: 'warning',
                    text: 'لا تؤكد استلام المبلغ في المنصة قبل أن تتأكد فعلاً أنه وصل إلى حسابك. بمجرد التأكيد، تُحرر USDT ولا يمكن استرجاعها.'
                },
                {
                    type: 'heading',
                    text: 'ماذا لو حدث نزاع؟'
                },
                {
                    type: 'paragraph',
                    text: 'إذا ادعى المشتري أنه دفع ولم يؤكد البائع، يتم فتح نزاع (Dispute). يراجع فريق الدعم الإيصالات والسجلات. إذا أثبت المشتري الدفع عبر إيصال صحيح، تُحرر USDT له. إذا لم يكن هناك دفع، تُعاد USDT للبائع.'
                },
                {
                    type: 'example',
                    title: 'مثال على احتيال شائع',
                    body: 'محتال يدعي أنه حوّل المال ويضغط "تم الدفع" على المنصة، لكنه لم يحول شيئاً. البائع المتمرس ينتظر وصول المبلغ فعلياً إلى فودافون كاش/إنستا باي قبل التأكيد. إذا لم يصل خلال 15 دقيقة، يفتح نزاعاً.'
                },
                {
                    type: 'heading',
                    text: 'رسوم P2P'
                },
                {
                    type: 'paragraph',
                    text: 'في Eg-Money، رسوم P2P هي 0.3% من قيمة الصفقة، يدفعها البائع من USDT. على صفقة 1000 USDT، الرسوم = 3 USDT، يستلم البائع 997 USDT صافي.'
                },
                {
                    type: 'calculation',
                    title: 'حساب صفقة P2P',
                    lines: [
                        {
                            label: 'كمية USDT',
                            value: '1,000 USDT'
                        },
                        {
                            label: 'السعر',
                            value: '50 EGP/USDT'
                        },
                        {
                            label: 'قيمة الصفقة',
                            value: '50,000 EGP'
                        },
                        {
                            label: 'رسوم المنصة (0.3%)',
                            value: '3 USDT'
                        }
                    ],
                    result: 'البائع يستلم: 997 USDT محفظة + 50,000 EGP فودافون'
                },
                {
                    type: 'tip',
                    text: 'تداول دائماً مع مستخدمين لديهم تقييمات عالية (نجمات) وصفقات سابقة كثيرة. تجنب العروض بأسعار "مغرية جداً" — غالباً فخ.'
                }
            ],
            en: [
                {
                    type: 'paragraph',
                    text: 'P2P (Peer-to-Peer) trading means buying and selling USDT directly between users, not from the platform itself. The platform acts as an intermediary guaranteeing safety via an Escrow system.'
                },
                {
                    type: 'heading',
                    text: 'What is Escrow?'
                },
                {
                    type: 'paragraph',
                    text: 'Escrow is a temporary holding account. When a seller lists USDT for sale, it\'s "frozen" in an Escrow that neither party can access. It\'s only released after the buyer confirms they paid EGP and the seller confirms receipt.'
                },
                {
                    type: 'heading',
                    text: 'Trade steps (practical example)'
                },
                {
                    type: 'list',
                    items: [
                        'Ahmed lists 1,000 USDT for sale at 50 EGP (receives 50,000 EGP)',
                        'Sara sees the offer and clicks "Buy"',
                        'Platform freezes 1,000 USDT from Ahmed\'s wallet in Escrow',
                        'Sara transfers 50,000 EGP to Ahmed\'s Vodafone Cash',
                        'Sara uploads the transfer receipt to the platform',
                        'Ahmed confirms receipt of 50,000 EGP',
                        'Platform releases 1,000 USDT from Escrow to Sara\'s wallet',
                        'Trade complete ✓'
                    ]
                },
                {
                    type: 'warning',
                    text: 'Never confirm receipt in the platform before verifying the money actually arrived in your account. Once confirmed, USDT is released and cannot be reversed.'
                },
                {
                    type: 'heading',
                    text: 'What if there\'s a dispute?'
                },
                {
                    type: 'paragraph',
                    text: 'If the buyer claims they paid but the seller didn\'t confirm, a dispute is opened. Support reviews receipts and records. If the buyer proves payment with a valid receipt, USDT is released to them. If no payment was made, USDT is returned to the seller.'
                },
                {
                    type: 'example',
                    title: 'Common scam example',
                    body: 'A scammer claims they sent money and clicks "Paid" on the platform, but sent nothing. An experienced seller waits until the money actually arrives in their Vodafone Cash/InstaPay before confirming. If it doesn\'t arrive within 15 minutes, they open a dispute.'
                },
                {
                    type: 'heading',
                    text: 'P2P fees'
                },
                {
                    type: 'paragraph',
                    text: 'On Eg-Money, the P2P fee is 0.3% of the trade value, paid by the seller from USDT. On a 1,000 USDT trade, the fee = 3 USDT, and the seller receives 997 USDT net.'
                },
                {
                    type: 'calculation',
                    title: 'P2P trade calculation',
                    lines: [
                        {
                            label: 'USDT amount',
                            value: '1,000 USDT'
                        },
                        {
                            label: 'Price',
                            value: '50 EGP/USDT'
                        },
                        {
                            label: 'Trade value',
                            value: '50,000 EGP'
                        },
                        {
                            label: 'Platform fee (0.3%)',
                            value: '3 USDT'
                        }
                    ],
                    result: 'Seller receives: 997 USDT in wallet + 50,000 EGP in Vodafone'
                },
                {
                    type: 'tip',
                    text: 'Always trade with users who have high ratings (stars) and many previous trades. Avoid offers with "too good" prices — usually a trap.'
                }
            ]
        }
    },
    // ===================================================================
    {
        slug: 'price-spread-explained',
        level: 'beginner',
        category: 'basics',
        icon: '📊',
        readTime: 5,
        title: {
            ar: 'فهم فارق السعر (Spread) وكيف تربح المنصة',
            en: 'Understanding the spread — how the platform earns'
        },
        excerpt: {
            ar: 'ما هو الـ Spread؟ ولماذا سعر الشراء أعلى من سعر البيع؟ شرح بسيط لآلية الربح في منصات التداول.',
            en: 'What is the spread? Why is the buy price higher than the sell price? A simple explanation of how trading platforms profit.'
        },
        content: {
            ar: [
                {
                    type: 'paragraph',
                    text: 'الـ Spread هو الفرق بين سعر الشراء (Buy) وسعر البيع (Sell). سعر الشراء دائماً أعلى قليلاً من سعر البيع. هذا الفرق هو كيف تربح المنصة من التداول المباشر.'
                },
                {
                    type: 'heading',
                    text: 'لماذا يوجد فارق؟'
                },
                {
                    type: 'paragraph',
                    text: 'المنصة تشتري USDT من السوق العالمي بأفضل سعر متاح، ثم تبيعه للمستخدمين بسعر أعلى قليلاً. الفرق هو ربح المنصة مقابل خدمة التنفيذ الفوري والسيولة.'
                },
                {
                    type: 'example',
                    title: 'مثال عملي',
                    body: 'السعر في السوق العالمي الآن: شراء 49.90 جنيه، بيع 50.10 جنيه. المنصة تعرض: شراء 50.00 جنيه، بيع 49.80 جنيه. المستخدم يشتري بـ 50.00 (أعلى من 49.90 بـ 0.10). المستخدم يبيع بـ 49.80 (أقل من 50.10 بـ 0.30). الفارق الكلي = 0.20 جنيه لكل USDT.'
                },
                {
                    type: 'heading',
                    text: 'حساب ربح المنصة'
                },
                {
                    type: 'calculation',
                    title: 'صفقة 1000 USDT',
                    lines: [
                        {
                            label: 'المستخدم يشتري 1000 USDT',
                            value: 'بسعر 50.00 = 50,000 EGP'
                        },
                        {
                            label: 'المنصة تشتري من السوق العالمي',
                            value: 'بسعر 49.90 = 49,900 EGP'
                        },
                        {
                            label: 'ربح المنصة من الصفقة',
                            value: '100 EGP (0.2%)'
                        }
                    ],
                    result: 'ربح المنصة = 100 جنيه على كل 1000 USDT'
                },
                {
                    type: 'heading',
                    text: 'الـ Spread في P2P vs التداول المباشر'
                },
                {
                    type: 'paragraph',
                    text: 'في التداول المباشر، الـ Spread مضمّن في السعر (0.10-0.20 جنيه/USDT). في P2P، المستخدمون يحددون الأسعار، والمنصة تأخذ عمولة 0.3% فقط. P2P أرخص لكن أبطأ، التداول المباشر أسرع لكن أغلى قليلاً.'
                },
                {
                    type: 'tip',
                    text: 'إذا كنت تريد توفير المال ولديك وقت، استخدم P2P. إذا كنت تريد التنفيذ الفوري، استخدم التداول المباشر. الفرق في التكلفة على 1000 USDT ≈ 50-100 جنيه.'
                }
            ],
            en: [
                {
                    type: 'paragraph',
                    text: 'The spread is the difference between the buy price and sell price. The buy price is always slightly higher than the sell price. This difference is how the platform earns from direct trading.'
                },
                {
                    type: 'heading',
                    text: 'Why does a spread exist?'
                },
                {
                    type: 'paragraph',
                    text: 'The platform buys USDT from the global market at the best available price, then sells it to users at a slightly higher price. The difference is the platform\'s profit for providing instant execution and liquidity.'
                },
                {
                    type: 'example',
                    title: 'Practical example',
                    body: 'Global market price now: buy 49.90 EGP, sell 50.10 EGP. Platform shows: buy 50.00 EGP, sell 49.80 EGP. User buys at 50.00 (0.10 above 49.90). User sells at 49.80 (0.30 below 50.10). Total spread = 0.20 EGP per USDT.'
                },
                {
                    type: 'heading',
                    text: 'Calculating platform profit'
                },
                {
                    type: 'calculation',
                    title: '1,000 USDT trade',
                    lines: [
                        {
                            label: 'User buys 1,000 USDT',
                            value: 'at 50.00 = 50,000 EGP'
                        },
                        {
                            label: 'Platform buys from global market',
                            value: 'at 49.90 = 49,900 EGP'
                        },
                        {
                            label: 'Platform profit from trade',
                            value: '100 EGP (0.2%)'
                        }
                    ],
                    result: 'Platform profit = 100 EGP per 1,000 USDT'
                },
                {
                    type: 'heading',
                    text: 'Spread in P2P vs Direct trading'
                },
                {
                    type: 'paragraph',
                    text: 'In direct trading, the spread is built into the price (0.10-0.20 EGP/USDT). In P2P, users set prices and the platform takes only 0.3% commission. P2P is cheaper but slower; direct trading is faster but slightly more expensive.'
                },
                {
                    type: 'tip',
                    text: 'If you want to save money and have time, use P2P. If you want instant execution, use direct trading. The cost difference on 1,000 USDT is about 50-100 EGP.'
                }
            ]
        }
    },
    // ===================================================================
    {
        slug: 'arbitrage-strategy',
        level: 'intermediate',
        category: 'strategy',
        icon: '⚖️',
        readTime: 10,
        title: {
            ar: 'استراتيجية المراجحة (Arbitrage) في سوق USDT',
            en: 'Arbitrage strategy in the USDT market'
        },
        excerpt: {
            ar: 'كيف تستغل فروق الأسعار بين منصات مختلفة لتحقيق ربح بدون مخاطر؟ شرح استراتيجية المراجحة مع أمثلة عملية.',
            en: 'How to exploit price differences between platforms for risk-free profit? Arbitrage strategy explained with practical examples.'
        },
        content: {
            ar: [
                {
                    type: 'paragraph',
                    text: 'المراجحة (Arbitrage) هي شراء أصل بسعر منخفض في مكان وبيعه بسعر مرتفع في مكان آخر في نفس الوقت. في سوق USDT المصري، توجد فروق أسعار بين منصات مختلفة يمكن استغلالها.'
                },
                {
                    type: 'heading',
                    text: 'كيف تعمل المراجحة؟'
                },
                {
                    type: 'paragraph',
                    text: 'تقارن أسعار USDT بين منصتين. إذا كان السعر في منصة A أقل من منصة B، تشتري من A وتبيع في B. الربح = الفرق - الرسوم.'
                },
                {
                    type: 'example',
                    title: 'مثال عملي',
                    body: 'منصة عالمية: سعر شراء USDT = 49.80 جنيه. Eg-Money P2P: أحد المستخدمين يعرض شراء USDT بـ 50.50 جنيه. تشتري 1000 USDT من السوق العالمي بـ 49,800 جنيه. تبيعها في Eg-Money بـ 50,500 جنيه. الربح الإجمالي = 700 جنيه. رسوم Eg-Money (0.3%) = 3 USDT ≈ 150 جنيه. صافي الربح = 550 جنيه.'
                },
                {
                    type: 'heading',
                    text: 'شروط نجاح المراجحة'
                },
                {
                    type: 'list',
                    items: [
                        'الفرق بين السعرين يجب أن يغطي الرسوم + رسوم التحويل',
                        'يجب أن يكون لديك سيولة (جنيه + USDT) في المنصتين',
                        'التنفيذ يجب أن يكون سريعاً (الأسعار تتغير كل ثانية)',
                        'احسب رسوم الإيداع/السحب لكل منصة'
                    ]
                },
                {
                    type: 'calculation',
                    title: 'حساب ربح المراجحة',
                    lines: [
                        {
                            label: 'شراء 1000 USDT من السوق العالمي',
                            value: '49,800 EGP'
                        },
                        {
                            label: 'بيع 1000 USDT في Eg-Money',
                            value: '50,500 EGP'
                        },
                        {
                            label: 'الربح الإجمالي',
                            value: '+700 EGP'
                        },
                        {
                            label: 'رسوم Eg-Money (0.3%)',
                            value: '-150 EGP'
                        },
                        {
                            label: 'رسوم تحويل EGP',
                            value: '-20 EGP'
                        }
                    ],
                    result: 'صافي الربح = 530 EGP (1.06% ربح)'
                },
                {
                    type: 'heading',
                    text: 'مخاطر المراجحة'
                },
                {
                    type: 'warning',
                    text: 'السعر قد يتغير بين شرائك وبيعك. إذا انخفض سعر البيع قبل إتمام الصفقة، قد تخسر. استخدم أوامر محددة السعر (Limit orders) عند الإمكان.'
                },
                {
                    type: 'paragraph',
                    text: 'أيضاً، بعض المنصات لها حدود يومية للسحب/الإيداع. تأكد من أن السيولة متاحة في كلا المنصتين قبل البدء.'
                },
                {
                    type: 'heading',
                    text: 'أدوات مساعدة'
                },
                {
                    type: 'list',
                    items: [
                        'تطبيق CoinMarketCap لمتابعة أسعار USDT في منصات مختلفة',
                        'بوتات مراجحة (مثل Pionex) — لكنها مدفوعة ومخاطرة عالية',
                        'جداول Google لتتبع الأسعار وحساب الأرباح يدوياً'
                    ]
                },
                {
                    type: 'tip',
                    text: 'ابدأ بمبالغ صغيرة (500-1000 USDT) للتدريب. لا تستثمر كل رأس مالك في صفقة واحدة. المراجحة تتطلب صبر وانضباط.'
                }
            ],
            en: [
                {
                    type: 'paragraph',
                    text: 'Arbitrage is buying an asset at a low price in one place and selling it at a higher price elsewhere simultaneously. In the Egyptian USDT market, price differences exist between platforms that can be exploited.'
                },
                {
                    type: 'heading',
                    text: 'How does arbitrage work?'
                },
                {
                    type: 'paragraph',
                    text: 'You compare USDT prices between two platforms. If platform A\'s price is lower than platform B, you buy from A and sell on B. Profit = difference - fees.'
                },
                {
                    type: 'example',
                    title: 'Practical example',
                    body: 'Global platform: buy USDT at 49.80 EGP. Eg-Money P2P: a user offers to buy USDT at 50.50 EGP. You buy 1,000 USDT from the global market for 49,800 EGP. Sell on Eg-Money for 50,500 EGP. Gross profit = 700 EGP. Eg-Money fee (0.3%) = 3 USDT ≈ 150 EGP. Net profit = 550 EGP.'
                },
                {
                    type: 'heading',
                    text: 'Conditions for successful arbitrage'
                },
                {
                    type: 'list',
                    items: [
                        'The price difference must cover fees + transfer costs',
                        'You need liquidity (EGP + USDT) on both platforms',
                        'Execution must be fast (prices change every second)',
                        'Calculate deposit/withdrawal fees for each platform'
                    ]
                },
                {
                    type: 'calculation',
                    title: 'Arbitrage profit calculation',
                    lines: [
                        {
                            label: 'Buy 1,000 USDT from global market',
                            value: '49,800 EGP'
                        },
                        {
                            label: 'Sell 1,000 USDT on Eg-Money',
                            value: '50,500 EGP'
                        },
                        {
                            label: 'Gross profit',
                            value: '+700 EGP'
                        },
                        {
                            label: 'Eg-Money fee (0.3%)',
                            value: '-150 EGP'
                        },
                        {
                            label: 'EGP transfer fee',
                            value: '-20 EGP'
                        }
                    ],
                    result: 'Net profit = 530 EGP (1.06% gain)'
                },
                {
                    type: 'heading',
                    text: 'Arbitrage risks'
                },
                {
                    type: 'warning',
                    text: 'The price may change between your buy and sell. If the sell price drops before completing the trade, you could lose. Use limit orders when possible.'
                },
                {
                    type: 'paragraph',
                    text: 'Also, some platforms have daily withdrawal/deposit limits. Ensure liquidity is available on both platforms before starting.'
                },
                {
                    type: 'heading',
                    text: 'Helpful tools'
                },
                {
                    type: 'list',
                    items: [
                        'CoinMarketCap app to track USDT prices across platforms',
                        'Arbitrage bots (like Pionex) — but paid and high risk',
                        'Google Sheets to track prices and calculate profits manually'
                    ]
                },
                {
                    type: 'tip',
                    text: 'Start with small amounts (500-1,000 USDT) to practice. Don\'t invest all your capital in one trade. Arbitrage requires patience and discipline.'
                }
            ]
        }
    },
    // ===================================================================
    {
        slug: 'dollar-cost-averaging',
        level: 'intermediate',
        category: 'strategy',
        icon: '📅',
        readTime: 7,
        title: {
            ar: 'استراتيجية المتوسط الحسابي للدولار (DCA)',
            en: 'Dollar-Cost Averaging (DCA) strategy'
        },
        excerpt: {
            ar: 'أفضل استراتيجية للمستثمر المبتدئ: اشترِ USDT بمبالغ ثابتة على فترات منتظمة لتقليل تأثير تقلبات السعر.',
            en: 'The best strategy for beginner investors: buy USDT with fixed amounts at regular intervals to reduce price volatility impact.'
        },
        content: {
            ar: [
                {
                    type: 'paragraph',
                    text: 'استراتيجية DCA (Dollar-Cost Averaging) تعني شراء مبلغ ثابت من USDT على فترات منتظمة (أسبوعياً، شهرياً)، بغض النظر عن السعر. الهدف هو تقليل تأثير تقلبات السعر وعدم محاولة "توقيت السوق".'
                },
                {
                    type: 'heading',
                    text: 'لماذا DCA فعّالة؟'
                },
                {
                    type: 'paragraph',
                    text: 'لا أحد يستطيع التنبؤ بالسعر بدقة. إذا اشتريت كل شيء مرة واحدة والسعر انخفض بعدها، تخسر. مع DCA، تشتري بأسعار مختلفة (أحياناً عالية، أحياناً منخفضة)، فيتوسط السعر النهائي.'
                },
                {
                    type: 'example',
                    title: 'مثال عملي — 6 أشهر',
                    body: 'تقرر شراء 2000 جنيه USDT كل شهر لمدة 6 أشهر. الأسعار كانت: 48, 49, 47, 50, 48, 49. الكمية المشتراة: 41.67 + 40.82 + 42.55 + 40.00 + 41.67 + 40.82 = 247.53 USDT. لو اشتريت كل شيء (12,000 جنيه) في الشهر الأول بسعر 48، كنت ستحصل على 250 USDT. الفرق بسيط، لكنك تجنبت خطر الشراء في القمة.'
                },
                {
                    type: 'heading',
                    text: 'مقارنة DCA vs الشراء مرة واحدة'
                },
                {
                    type: 'calculation',
                    title: 'سيناريو الأسعار المتذبذبة',
                    lines: [
                        {
                            label: 'DCA: 2000 EGP شهرياً لـ 6 أشهر',
                            value: '247.53 USDT'
                        },
                        {
                            label: 'مرة واحدة: 12,000 EGP في الشهر 1 (سعر 48)',
                            value: '250.00 USDT'
                        },
                        {
                            label: 'مرة واحدة: 12,000 EGP في الشهر 3 (سعر 47 - الأدنى)',
                            value: '255.32 USDT'
                        },
                        {
                            label: 'مرة واحدة: 12,000 EGP في الشهر 4 (سعر 50 - الأعلى)',
                            value: '240.00 USDT'
                        }
                    ],
                    result: 'DCA يعطيك متوسط آمن بدون الحاجة لتوقع السوق'
                },
                {
                    type: 'heading',
                    text: 'كيف تطبق DCA على Eg-Money'
                },
                {
                    type: 'list',
                    items: [
                        'حدد مبلغ ثابت (مثلاً 1000-5000 جنيه شهرياً)',
                        'حدد فترة منتظمة (كل أسبوع، كل شهر، كل راتب)',
                        'اشترِ USDT عبر التداول المباشر (التنفيذ الفوري)',
                        'لا تتأثر بتقلبات السعر اليومي — التزم بالخطة',
                        'راجع كل 3-6 أشهر وعدّل المبلغ إذا زاد دخلك'
                    ]
                },
                {
                    type: 'warning',
                    text: 'DCA ممتاز للحفاظ على القيمة (Hedging ضد التضخم)، لكنه ليس استراتيجية تداول نشط. لا تصلح لمن يريد أرباحاً سريعة.'
                },
                {
                    type: 'heading',
                    text: 'متى تتوقف عن DCA؟'
                },
                {
                    type: 'paragraph',
                    text: 'توقف عندما: (1) تحتاج المال لشيء عاجل، (2) تغيرت أهدافك المالية، (3) وصلت لهدف ادخار محدد. لا تتوقف بسبب انخفاض السعر — هذا أفضل وقت للاستمرار (تشتري بسعر أقل).'
                },
                {
                    type: 'tip',
                    text: 'اضبط تنبيهات الأسعار على Eg-Money لتعرف أفضل أوقات الشراء. مع DCA، التوقيت المثالي ليس مهماً — الالتزام بالخطة هو الأهم.'
                }
            ],
            en: [
                {
                    type: 'paragraph',
                    text: 'DCA (Dollar-Cost Averaging) means buying a fixed amount of USDT at regular intervals (weekly, monthly), regardless of price. The goal is to reduce price volatility impact and avoid "timing the market."'
                },
                {
                    type: 'heading',
                    text: 'Why is DCA effective?'
                },
                {
                    type: 'paragraph',
                    text: 'No one can predict prices accurately. If you buy everything at once and the price drops, you lose. With DCA, you buy at different prices (sometimes high, sometimes low), averaging out the final price.'
                },
                {
                    type: 'example',
                    title: 'Practical example — 6 months',
                    body: 'You decide to buy 2,000 EGP of USDT monthly for 6 months. Prices were: 48, 49, 47, 50, 48, 49. USDT bought: 41.67 + 40.82 + 42.55 + 40.00 + 41.67 + 40.82 = 247.53 USDT. If you bought everything (12,000 EGP) in month 1 at 48, you\'d have 250 USDT. The difference is small, but you avoided the risk of buying at the peak.'
                },
                {
                    type: 'heading',
                    text: 'DCA vs lump sum comparison'
                },
                {
                    type: 'calculation',
                    title: 'Volatile price scenario',
                    lines: [
                        {
                            label: 'DCA: 2,000 EGP monthly for 6 months',
                            value: '247.53 USDT'
                        },
                        {
                            label: 'Lump sum: 12,000 EGP in month 1 (price 48)',
                            value: '250.00 USDT'
                        },
                        {
                            label: 'Lump sum: 12,000 EGP in month 3 (price 47 - lowest)',
                            value: '255.32 USDT'
                        },
                        {
                            label: 'Lump sum: 12,000 EGP in month 4 (price 50 - highest)',
                            value: '240.00 USDT'
                        }
                    ],
                    result: 'DCA gives you a safe average without needing to predict the market'
                },
                {
                    type: 'heading',
                    text: 'How to apply DCA on Eg-Money'
                },
                {
                    type: 'list',
                    items: [
                        'Set a fixed amount (e.g., 1,000-5,000 EGP monthly)',
                        'Choose a regular interval (weekly, monthly, each payday)',
                        'Buy USDT via direct trading (instant execution)',
                        'Don\'t react to daily price fluctuations — stick to the plan',
                        'Review every 3-6 months and adjust the amount if your income grows'
                    ]
                },
                {
                    type: 'warning',
                    text: 'DCA is excellent for value preservation (inflation hedging), but it\'s not an active trading strategy. It doesn\'t suit those seeking quick profits.'
                },
                {
                    type: 'heading',
                    text: 'When to stop DCA?'
                },
                {
                    type: 'paragraph',
                    text: 'Stop when: (1) you need money urgently, (2) your financial goals changed, (3) you reached a specific savings target. Don\'t stop because the price dropped — that\'s the best time to continue (you buy cheaper).'
                },
                {
                    type: 'tip',
                    text: 'Set price alerts on Eg-Money to know the best buying times. With DCA, perfect timing doesn\'t matter — sticking to the plan does.'
                }
            ]
        }
    },
    // ===================================================================
    {
        slug: 'avoiding-scams',
        level: 'beginner',
        category: 'security',
        icon: '🛡️',
        readTime: 9,
        title: {
            ar: 'كيف تحمي نفسك من الاحتيال في تداول العملات الرقمية',
            en: 'How to protect yourself from crypto trading scams'
        },
        excerpt: {
            ar: 'دليل شامل لأنواع الاحتيال الشائع في سوق USDT وعلامات التحذير وكيف تحمي أموالك.',
            en: 'A comprehensive guide to common USDT market scams, warning signs, and how to protect your money.'
        },
        content: {
            ar: [
                {
                    type: 'paragraph',
                    text: 'سوق العملات الرقمية يجذب المحتالين بسبب سرعة المعاملات وصعوبة استرجاع الأموال. تعرّف على أنواع الاحتيال الشائع تحمي أموالك.'
                },
                {
                    type: 'heading',
                    text: '1. احتيال "السعر المغري جداً"'
                },
                {
                    type: 'paragraph',
                    text: 'محتال يعرض بيع USDT بسعر أقل بكثير من السوق (مثلاً 45 جنيه بينما السوق 50). الهدف يجذبك لتضع أموالك قبل أن تكتشف الخدعة. بمجرد تحويل المال، يختفي.'
                },
                {
                    type: 'warning',
                    text: 'القاعدة الذهبية: إذا كان العرض جيداً جداً ليكون حقيقياً، فهو احتيال. الفرق المعقول بين العروض هو 0.5-2% كحد أقصى.'
                },
                {
                    type: 'heading',
                    text: '2. احتيال الإيصال المزوّر'
                },
                {
                    type: 'paragraph',
                    text: 'المشتري يرسل إيصال تحويل مزوّر (Photoshop) ويؤكد "تم الدفع". البائع المتمرس يتحقق من حساب Vodafone Cash/InstaPay مباشرة، وليس من الإيصال فقط.'
                },
                {
                    type: 'list',
                    items: [
                        'افتح تطبيق Vodafone Cash/InstaPay وتأكد من وصول المبلغ فعلياً',
                        'لا تعتمد على صورة الإيصال — يمكن تزويرها بسهولة',
                        'انتظر إشعار SMS من البنك/المحفظة بتأكيد الاستلام',
                        'إذا لم يصل المبلغ خلال 15 دقيقة، افتح نزاع (Dispute)'
                    ]
                },
                {
                    type: 'heading',
                    text: '3. احتيال التحويل لخارج المنصة'
                },
                {
                    type: 'paragraph',
                    text: 'محتال يقول "حوّل لي على واتساب مباشرة، سأعطيك سعر أفضل". هذا خارج نظام Escrow — لا حماية لك. بمجرد التحويل، لا يمكنك فتح نزاع أو استرجاع المال.'
                },
                {
                    type: 'warning',
                    text: 'لا تقم بأي صفقة خارج المنصة. الـ Escrow هو حمايتك الوحيدة. أي طلب للتحويل خارج المنصة = احتيال.'
                },
                {
                    type: 'heading',
                    text: '4. احتيال الدعم الفني المزيف'
                },
                {
                    type: 'paragraph',
                    text: 'محتال يتظاهر بأنه من دعم المنصة، يطلب بيانات دخولك أو كود تحقق. الدعم الحقيقي لا يطلب أبداً كلمة المرور أو كود OTP.'
                },
                {
                    type: 'heading',
                    text: '5. احتيال "الاستثمار المضمون"'
                },
                {
                    type: 'paragraph',
                    text: 'شخص يعدك بأرباح يومية مضمونة (5%, 10%) مقابل إيداع USDT. هذا مخطط بونزي — يدفع الأرباح الأولى من أموال المستثمرين الجدد، ثم ينهار.'
                },
                {
                    type: 'example',
                    title: 'مثال واقعي',
                    body: 'صفحة فيسبوك تدعي "استثمر 1000 USDT واحصل على 1500 بعد أسبوع". في البداية يدفعون لأشخاص قليل لإقناع آخرين. بعد تجميع مبالغ كبيرة، يختفون. هذه ليست تداول — هذه سرقة.'
                },
                {
                    type: 'heading',
                    text: 'علامات تحذير يجب الانتباه لها'
                },
                {
                    type: 'list',
                    items: [
                        'أسعار تختلف عن السوق بأكثر من 3%',
                        'ضغط لإتمام الصفقة بسرعة ("العرض ينتهي خلال ساعة")',
                        'طلب التحويل خارج المنصة',
                        'طلب بيانات دخولك أو أكواد تحقق',
                        'وعود بأرباح مضمونة بدون مخاطر',
                        'صفحات التواصل الاجتماعي بدون تقييمات حقيقية'
                    ]
                },
                {
                    type: 'heading',
                    text: 'كيف تحمي نفسك'
                },
                {
                    type: 'list',
                    items: [
                        'تداول دائماً داخل المنصة مع Escrow مفعّل',
                        'تحقق من تقييمات الطرف الآخر وعدد صفقاته السابقة',
                        'لا تتعجل — الصفقات الجيدة لا تختفي في ثانية',
                        'فعّل المصادقة الثنائية (2FA) على حسابك',
                        'لا تشارك كلمة المرور أو كود OTP مع أحد أبداً',
                        'بلغ عن أي سلوك مشبوه فوراً'
                    ]
                },
                {
                    type: 'tip',
                    text: 'المنصة الموثوقة لا تطلب أبداً تحويل أموال خارج نظامها. الـ Escrow هو خط الدفاع الأول — استخدمه دائماً.'
                }
            ],
            en: [
                {
                    type: 'paragraph',
                    text: 'The cryptocurrency market attracts scammers due to fast transactions and difficulty recovering funds. Knowing common scam types protects your money.'
                },
                {
                    type: 'heading',
                    text: '1. The "too good to be true" price scam'
                },
                {
                    type: 'paragraph',
                    text: 'A scammer offers USDT well below market (e.g., 45 EGP while market is 50). The goal is to lure you into sending money before discovering the trick. Once paid, they disappear.'
                },
                {
                    type: 'warning',
                    text: 'Golden rule: if an offer seems too good to be true, it\'s a scam. Reasonable offer differences are 0.5-2% maximum.'
                },
                {
                    type: 'heading',
                    text: '2. Fake receipt scam'
                },
                {
                    type: 'paragraph',
                    text: 'The buyer sends a forged (Photoshopped) transfer receipt and confirms "Paid." An experienced seller checks their Vodafone Cash/InstaPay app directly, not just the receipt.'
                },
                {
                    type: 'list',
                    items: [
                        'Open Vodafone Cash/InstaPay app and verify the money actually arrived',
                        'Don\'t rely on receipt images — easily forged',
                        'Wait for SMS notification from bank/wallet confirming receipt',
                        'If money doesn\'t arrive within 15 minutes, open a dispute'
                    ]
                },
                {
                    type: 'heading',
                    text: '3. Off-platform transfer scam'
                },
                {
                    type: 'paragraph',
                    text: 'A scammer says "transfer to me directly on WhatsApp, I\'ll give you a better price." This bypasses the Escrow system — you have no protection. Once transferred, you can\'t dispute or recover funds.'
                },
                {
                    type: 'warning',
                    text: 'Never do any trade outside the platform. Escrow is your only protection. Any request to transfer off-platform = scam.'
                },
                {
                    type: 'heading',
                    text: '4. Fake support agent scam'
                },
                {
                    type: 'paragraph',
                    text: 'A scammer impersonates platform support, asking for your login details or verification code. Real support never asks for your password or OTP code.'
                },
                {
                    type: 'heading',
                    text: '5. "Guaranteed investment" scam'
                },
                {
                    type: 'paragraph',
                    text: 'Someone promises guaranteed daily returns (5%, 10%) for depositing USDT. This is a Ponzi scheme — early payouts come from new investors\' money, then it collapses.'
                },
                {
                    type: 'example',
                    title: 'Real-world example',
                    body: 'A Facebook page claims "Invest 1,000 USDT and get 1,500 after a week." Initially they pay a few people to convince others. After collecting large amounts, they vanish. This isn\'t trading — it\'s theft.'
                },
                {
                    type: 'heading',
                    text: 'Warning signs to watch for'
                },
                {
                    type: 'list',
                    items: [
                        'Prices differing from market by more than 3%',
                        'Pressure to complete quickly ("offer ends in an hour")',
                        'Requests to transfer off-platform',
                        'Requests for your login details or verification codes',
                        'Promises of guaranteed risk-free returns',
                        'Social media pages with no real reviews'
                    ]
                },
                {
                    type: 'heading',
                    text: 'How to protect yourself'
                },
                {
                    type: 'list',
                    items: [
                        'Always trade within the platform with Escrow enabled',
                        'Check the other party\'s rating and number of past trades',
                        'Don\'t rush — good trades don\'t disappear in a second',
                        'Enable two-factor authentication (2FA) on your account',
                        'Never share your password or OTP code with anyone',
                        'Report any suspicious behavior immediately'
                    ]
                },
                {
                    type: 'tip',
                    text: 'A trustworthy platform never asks you to transfer funds outside its system. Escrow is your first line of defense — always use it.'
                }
            ]
        }
    },
    // ===================================================================
    {
        slug: 'egypt-economic-context',
        level: 'intermediate',
        category: 'economy',
        icon: '🇪🇬',
        readTime: 8,
        title: {
            ar: 'لماذا يلجأ المصريون لـ USDT؟ السياق الاقتصادي',
            en: 'Why do Egyptians turn to USDT? The economic context'
        },
        excerpt: {
            ar: 'تحليل واقعي لأسباب لجوء المصريين لـ USDT: التضخم، تخفيض الجنيه، القيود على النقد الأجنبي.',
            en: 'A realistic analysis of why Egyptians turn to USDT: inflation, EGP devaluation, foreign currency restrictions.'
        },
        content: {
            ar: [
                {
                    type: 'paragraph',
                    text: 'اللجوء المصري لـ USDT ليس مضاربة بل ضرورة اقتصادية. فهم السياق يساعدك على اتخاذ قرارات مالية أفضل.'
                },
                {
                    type: 'heading',
                    text: '1. تخفيض الجنيه المصري'
                },
                {
                    type: 'paragraph',
                    text: 'من 2016 لـ 2024، تخفض الجنيه عدة مرات: من 8.88 (2016) إلى 19 (2022) إلى 48 (2024) مقابل الدولار. كل تخفيض يفقد الجنيه 30-50% من قيمته. من يحتفظ بـ USDT يحمي مدخراته من هذا التآكل.'
                },
                {
                    type: 'calculation',
                    title: 'تآكل قيمة الجنيه',
                    lines: [
                        {
                            label: '100,000 EGP في 2016 (سعر 8.88)',
                            value: '= 11,261 $'
                        },
                        {
                            label: '100,000 EGP في 2022 (سعر 19)',
                            value: '= 5,263 $'
                        },
                        {
                            label: '100,000 EGP في 2024 (سعر 48)',
                            value: '= 2,083 $'
                        }
                    ],
                    result: 'القيمة الشرائية بالدولار انخفضت 81% خلال 8 سنوات'
                },
                {
                    type: 'heading',
                    text: '2. التضخم المحلي'
                },
                {
                    type: 'paragraph',
                    text: 'معدل التضخم في مصر وصل لـ 30-40% في 2023-2024. الأسعار تتضاعف كل 2-3 سنوات. الجنيه في البنك يفقد قيمته يومياً، بينما USDT مربوط بالدولار الذي تضخمه 2-3% سنوياً فقط.'
                },
                {
                    type: 'heading',
                    text: '3. القيود على النقد الأجنبي'
                },
                {
                    type: 'paragraph',
                    text: 'البنوك المصرية تفرض قيوداً على شراء الدولار: حد أقصى شهري، مستندات، موافقات. USDT يوفر بديلاً سريعاً بدون قيود — تشتري وتبيع في دقائق.'
                },
                {
                    type: 'heading',
                    text: '4. تحويلات العاملين بالخارج'
                },
                {
                    type: 'paragraph',
                    text: 'المصريون العاملون بالخارج يحتاجون لإرسال أموال للعائلة. التحويل البنكي بطيء ومكلف. USDT عبر P2P أسرع وأرخص: تحويل من محفظة لأخرى خلال دقائق، رسوم 0.3%.'
                },
                {
                    type: 'example',
                    title: 'مثال: عامل في السعودية',
                    body: 'أحمد يعمل في السعودية ويرسل 5000 ريال شهرياً لعائلته. عبر البنك: 3-5 أيام عمل، رسوم 2-3%. عبر USDT: يحول ريالات لـ USDT، يرسلها لمحفظة عائلته على Eg-Money، تبيع USDT لجنيه. إجمالي الوقت: 10 دقائق. الرسوم: 0.6% (شراء + بيع).'
                },
                {
                    type: 'heading',
                    text: '5. التجارة الإلكترونية والـ Freelance'
                },
                {
                    type: 'paragraph',
                    text: 'المصريون الذين يعملون أونلاين (Upwork, Fiverr) يتقاضون بالدولار. تحويل البنكي للجنيه يخسر من سعر الصرف والرسوم. USDT يوفر استلام مباشر بسعر السوق.'
                },
                {
                    type: 'heading',
                    text: 'مخاطر الاحتفاظ بـ USDT'
                },
                {
                    type: 'warning',
                    text: 'USDT ليس خالي المخاطر: (1) مخاطر تنظيمية — الحكومة قد تقيّد استخدامه، (2) مخاطر تقنية — اختراق المحفظة أو فقدان المفتاح، (3) مخاطر الاحتياطي — Tether قد تواجه مشاكل قانونية. لا تضع كل مدخراتك في USDT — نوّع.'
                },
                {
                    type: 'heading',
                    text: 'الخلاصة العملية'
                },
                {
                    type: 'list',
                    items: [
                        'احتفظ بـ 30-50% من مدخراتك في USDT للحماية من التضخم',
                        'أبقِ 20-30% بالجنيه للمصاريف اليومية والطارئة',
                        'نوّع الباقي في أصول أخرى (ذهب، شهادات إيداع)',
                        'راقب الأخبار الاقتصادية — التخفيضات تحدث فجأة',
                        'لا تحول كل أموالك دفعة واحدة — استخدم DCA'
                    ]
                },
                {
                    type: 'tip',
                    text: 'الهدف من USDT ليس الثراء السريع بل الحفاظ على قيمة كدهبك. فكر فيه كـ "حساب دولاري" بدون قيود بنكية.'
                }
            ],
            en: [
                {
                    type: 'paragraph',
                    text: 'Egyptians turning to USDT isn\'t speculation — it\'s economic necessity. Understanding the context helps you make better financial decisions.'
                },
                {
                    type: 'heading',
                    text: '1. Egyptian pound devaluation'
                },
                {
                    type: 'paragraph',
                    text: 'From 2016 to 2024, the EGP was devalued multiple times: from 8.88 (2016) to 19 (2022) to 48 (2024) against the dollar. Each devaluation costs the pound 30-50% of its value. Holding USDT protects savings from this erosion.'
                },
                {
                    type: 'calculation',
                    title: 'EGP value erosion',
                    lines: [
                        {
                            label: '100,000 EGP in 2016 (rate 8.88)',
                            value: '= $11,261'
                        },
                        {
                            label: '100,000 EGP in 2022 (rate 19)',
                            value: '= $5,263'
                        },
                        {
                            label: '100,000 EGP in 2024 (rate 48)',
                            value: '= $2,083'
                        }
                    ],
                    result: 'Dollar purchasing power dropped 81% in 8 years'
                },
                {
                    type: 'heading',
                    text: '2. Local inflation'
                },
                {
                    type: 'paragraph',
                    text: 'Egypt\'s inflation rate reached 30-40% in 2023-2024. Prices double every 2-3 years. Money in the bank loses value daily, while USDT is pegged to the dollar which has only 2-3% annual inflation.'
                },
                {
                    type: 'heading',
                    text: '3. Foreign currency restrictions'
                },
                {
                    type: 'paragraph',
                    text: 'Egyptian banks impose restrictions on buying dollars: monthly caps, documentation, approvals. USDT offers a quick alternative without restrictions — buy and sell in minutes.'
                },
                {
                    type: 'heading',
                    text: '4. Remittances from abroad'
                },
                {
                    type: 'paragraph',
                    text: 'Egyptians working abroad need to send money home. Bank transfers are slow and expensive. USDT via P2P is faster and cheaper: wallet-to-wallet transfer in minutes, 0.3% fees.'
                },
                {
                    type: 'example',
                    title: 'Example: Worker in Saudi Arabia',
                    body: 'Ahmed works in Saudi Arabia and sends 5,000 SAR monthly to his family. Via bank: 3-5 business days, 2-3% fees. Via USDT: converts SAR to USDT, sends to family\'s Eg-Money wallet, they sell USDT for EGP. Total time: 10 minutes. Fees: 0.6% (buy + sell).'
                },
                {
                    type: 'heading',
                    text: '5. E-commerce and Freelance'
                },
                {
                    type: 'paragraph',
                    text: 'Egyptians working online (Upwork, Fiverr) earn in dollars. Bank conversion to EGP loses on exchange rate and fees. USDT offers direct receipt at market price.'
                },
                {
                    type: 'heading',
                    text: 'Risks of holding USDT'
                },
                {
                    type: 'warning',
                    text: 'USDT isn\'t risk-free: (1) regulatory risk — government may restrict it, (2) technical risk — wallet hacking or lost keys, (3) reserve risk — Tether may face legal issues. Don\'t put all your savings in USDT — diversify.'
                },
                {
                    type: 'heading',
                    text: 'Practical conclusion'
                },
                {
                    type: 'list',
                    items: [
                        'Keep 30-50% of savings in USDT for inflation protection',
                        'Keep 20-30% in EGP for daily and emergency expenses',
                        'Diversify the rest in other assets (gold, certificates)',
                        'Monitor economic news — devaluations happen suddenly',
                        'Don\'t convert all your money at once — use DCA'
                    ]
                },
                {
                    type: 'tip',
                    text: 'The goal of USDT isn\'t quick wealth but preserving your money\'s value. Think of it as a "dollar account" without banking restrictions.'
                }
            ]
        }
    },
    // ===================================================================
    {
        slug: 'risk-management',
        level: 'intermediate',
        category: 'risk',
        icon: '⚠️',
        readTime: 8,
        title: {
            ar: 'إدارة المخاطر: لا تخسر كل أموالك',
            en: 'Risk management: don\'t lose all your money'
        },
        excerpt: {
            ar: 'قواعد ذهبية لإدارة المخاطر في التداول: قاعدة 1%, وقف الخسارة, التنويع, وإدارة رأس المال.',
            en: 'Golden rules for trading risk management: the 1% rule, stop-loss, diversification, and capital management.'
        },
        content: {
            ar: [
                {
                    type: 'paragraph',
                    text: 'إدارة المخاطر هي الفرق بين التاجر الناجح والفاشل. ليس مهم كم تربح، بل كم لا تخسر. التداول بدون إدارة مخاطر = قمار.'
                },
                {
                    type: 'heading',
                    text: 'القاعدة الذهبية: لا تخاطر بأكثر من 1-2%'
                },
                {
                    type: 'paragraph',
                    text: 'في كل صفقة، لا تخاطر بأكثر من 1-2% من رأس مالك. إذا كان رأس مالك 50,000 جنيه، الحد الأقصى للخسارة في صفقة واحدة = 500-1000 جنيه. بهذا، حتى لو خسرت 10 صفقات متتالية (نادر جداً)، يبقى لديك 90% من رأس مالك.'
                },
                {
                    type: 'calculation',
                    title: 'حساب حجم المخاطرة',
                    lines: [
                        {
                            label: 'رأس المال',
                            value: '50,000 EGP'
                        },
                        {
                            label: 'نسبة المخاطرة (1%)',
                            value: '500 EGP'
                        },
                        {
                            label: 'سعر USDT',
                            value: '50 EGP'
                        },
                        {
                            label: 'أقصى كمية تخسرها',
                            value: '10 USDT'
                        }
                    ],
                    result: 'إذا كان وقف الخسارة 0.5 جنيه، حجم الصفقة = 20 USDT (1000 EGP)'
                },
                {
                    type: 'heading',
                    text: 'قاعدة وقف الخسارة (Stop-Loss)'
                },
                {
                    type: 'paragraph',
                    text: 'قبل دخول أي صفقة، حدد السعر الذي ستخرج عنده إذا خسرت. مثلاً: تشتري USDT بـ 50 جنيه، تضع وقف خسارة عند 49.5. إذا انخفض السعر لـ 49.5، تبيع تلقائياً وتخسر 0.5 جنيه فقط لكل USDT.'
                },
                {
                    type: 'warning',
                    text: 'لا تحرك وقف الخسارة لأسفل أبداً. إذا كان السعر يصل لوقف الخسارة، اخرج. تحريك الوقف = خسائر أكبر.'
                },
                {
                    type: 'heading',
                    text: 'التنويع (Diversification)'
                },
                {
                    type: 'paragraph',
                    text: 'لا تضع كل أموالك في صفقة واحدة أو استراتيجية واحدة. نوّع:'
                },
                {
                    type: 'list',
                    items: [
                        '60-70% استثمار طويل المدى (DCA في USDT)',
                        '20-30% تداول نشط (P2P, مراجحة)',
                        '10% نقد/جنيه للفرص الطارئة',
                        'لا تتجاوز 5% في صفقة واحدة'
                    ]
                },
                {
                    type: 'heading',
                    text: 'نسبة المخاطرة/العائد (Risk/Reward)'
                },
                {
                    type: 'paragraph',
                    text: 'قبل كل صفقة، احسب النسبة. مثلاً: تخاطر بـ 500 جنيه (وقف خسارة) لتكسب 1500 جنيه (هدف). النسبة = 1:3. هذه صفقة جيدة. حتى لو خسرت 2 من 3 صفقات، أنت مربح.'
                },
                {
                    type: 'calculation',
                    title: 'مثال نسبة 1:3',
                    lines: [
                        {
                            label: 'صفقة 1: ربح',
                            value: '+1,500 EGP'
                        },
                        {
                            label: 'صفقة 2: خسارة',
                            value: '-500 EGP'
                        },
                        {
                            label: 'صفقة 3: خسارة',
                            value: '-500 EGP'
                        },
                        {
                            label: 'صفقة 4: ربح',
                            value: '+1,500 EGP'
                        }
                    ],
                    result: 'الصافي = +2,000 EGP (50% نجاح لكن ربح إجمالي)'
                },
                {
                    type: 'heading',
                    text: 'قاعدة عدم التداول العاطفي'
                },
                {
                    type: 'paragraph',
                    text: 'الخوف والطمع هما أعداء المتداول. لا تبيع بخوف عند أول انخفاض، ولا تشتري بطمع عند أول ارتفاع. التزم بخطتك ووقف الخسارة.'
                },
                {
                    type: 'list',
                    items: [
                        'لا تتداول وأنت غاضب أو متعب',
                        'لا تطارد خسائرك (محاولة تعويض بسرعة = خسائر أكبر)',
                        'لا تزيد حجم الصفقة بعد ربح (Overconfidence)',
                        'سجّل كل صفقة وسببها لتتعلم من أخطائك'
                    ]
                },
                {
                    type: 'tip',
                    text: 'المتداول الناجح ليس من يربح في كل صفقة، بل من يخسر قليلاً ويربح كثيراً. إدارة المخاطر هي ما يبقيك في اللعبة طويلاً.'
                }
            ],
            en: [
                {
                    type: 'paragraph',
                    text: 'Risk management is the difference between successful and failed traders. It\'s not about how much you earn, but how much you don\'t lose. Trading without risk management = gambling.'
                },
                {
                    type: 'heading',
                    text: 'Golden rule: never risk more than 1-2%'
                },
                {
                    type: 'paragraph',
                    text: 'In each trade, never risk more than 1-2% of your capital. If your capital is 50,000 EGP, the maximum loss per trade = 500-1,000 EGP. This way, even if you lose 10 consecutive trades (very rare), you still have 90% of your capital.'
                },
                {
                    type: 'calculation',
                    title: 'Risk size calculation',
                    lines: [
                        {
                            label: 'Capital',
                            value: '50,000 EGP'
                        },
                        {
                            label: 'Risk percentage (1%)',
                            value: '500 EGP'
                        },
                        {
                            label: 'USDT price',
                            value: '50 EGP'
                        },
                        {
                            label: 'Max loss amount',
                            value: '10 USDT'
                        }
                    ],
                    result: 'If stop-loss is 0.5 EGP, trade size = 20 USDT (1,000 EGP)'
                },
                {
                    type: 'heading',
                    text: 'Stop-loss rule'
                },
                {
                    type: 'paragraph',
                    text: 'Before entering any trade, set the price at which you\'ll exit if losing. For example: buy USDT at 50 EGP, set stop-loss at 49.5. If price drops to 49.5, sell automatically and lose only 0.5 EGP per USDT.'
                },
                {
                    type: 'warning',
                    text: 'Never move your stop-loss down. If price hits stop-loss, exit. Moving the stop = bigger losses.'
                },
                {
                    type: 'heading',
                    text: 'Diversification'
                },
                {
                    type: 'paragraph',
                    text: 'Don\'t put all your money in one trade or one strategy. Diversify:'
                },
                {
                    type: 'list',
                    items: [
                        '60-70% long-term investment (DCA in USDT)',
                        '20-30% active trading (P2P, arbitrage)',
                        '10% cash/EGP for emergency opportunities',
                        'Never exceed 5% in a single trade'
                    ]
                },
                {
                    type: 'heading',
                    text: 'Risk/Reward ratio'
                },
                {
                    type: 'paragraph',
                    text: 'Before each trade, calculate the ratio. For example: risk 500 EGP (stop-loss) to earn 1,500 EGP (target). Ratio = 1:3. This is a good trade. Even if you lose 2 of 3 trades, you\'re profitable.'
                },
                {
                    type: 'calculation',
                    title: '1:3 ratio example',
                    lines: [
                        {
                            label: 'Trade 1: profit',
                            value: '+1,500 EGP'
                        },
                        {
                            label: 'Trade 2: loss',
                            value: '-500 EGP'
                        },
                        {
                            label: 'Trade 3: loss',
                            value: '-500 EGP'
                        },
                        {
                            label: 'Trade 4: profit',
                            value: '+1,500 EGP'
                        }
                    ],
                    result: 'Net = +2,000 EGP (50% success but overall profit)'
                },
                {
                    type: 'heading',
                    text: 'No emotional trading'
                },
                {
                    type: 'paragraph',
                    text: 'Fear and greed are traders\' enemies. Don\'t sell out of fear at the first drop, and don\'t buy out of greed at the first rise. Stick to your plan and stop-loss.'
                },
                {
                    type: 'list',
                    items: [
                        'Don\'t trade when angry or tired',
                        'Don\'t chase losses (trying to recover quickly = bigger losses)',
                        'Don\'t increase trade size after a win (overconfidence)',
                        'Log every trade and its reason to learn from mistakes'
                    ]
                },
                {
                    type: 'tip',
                    text: 'A successful trader isn\'t one who wins every trade, but one who loses little and earns much. Risk management keeps you in the game long-term.'
                }
            ]
        }
    },
    // ===================================================================
    {
        slug: 'technical-analysis-basics',
        level: 'advanced',
        category: 'strategy',
        icon: '📈',
        readTime: 11,
        title: {
            ar: 'أساسيات التحليل الفني لسوق USDT',
            en: 'Technical analysis basics for the USDT market'
        },
        excerpt: {
            ar: 'مقدمة في قراءة الرسوم البيانية، خطوط الدعم والمقاومة, المتوسطات المتحركة, وكيف تستخدمها في قرارات التداول.',
            en: 'Introduction to reading charts, support and resistance lines, moving averages, and how to use them in trading decisions.'
        },
        content: {
            ar: [
                {
                    type: 'paragraph',
                    text: 'التحليل الفني (Technical Analysis) هو دراسة حركة السعر عبر الرسوم البيانية للتنبؤ بالاتجاه المستقبلي. لا يتنبأ بالمستقبل بدقة 100%، لكنه يساعد في اتخاذ قرارات مدروسة بدلاً من عشوائية.'
                },
                {
                    type: 'heading',
                    text: '1. خطوط الدعم والمقاومة'
                },
                {
                    type: 'paragraph',
                    text: 'الدعم (Support) هو سعر يجد فيه الطلب كافياً لمنع المزيد من الانخفاض. المقاومة (Resistance) هو سعر يجد فيه العرض كافياً لمنع المزيد من الارتفاع.'
                },
                {
                    type: 'example',
                    title: 'مثال عملي',
                    body: 'سعر USDT يتذبذب بين 48 و 51 جنيه لمدة شهر. 48 = دعم (كلما وصل، يعود للارتفاع). 51 = مقاومة (كلما وصل، يعود للانخفاض). استراتيجية: شراء عند 48-49, بيع عند 50-51.'
                },
                {
                    type: 'heading',
                    text: '2. المتوسطات المتحركة (Moving Averages)'
                },
                {
                    type: 'paragraph',
                    text: 'المتوسط المتحرك يحسب متوسط السعر خلال فترة معينة. الأكثر استخداماً: MA-7 (أسبوع), MA-30 (شهر), MA-90 (3 أشهر). عندما يقطع MA-7 خط MA-30 للأعلى = إشارة شراء. للأسفل = إشارة بيع.'
                },
                {
                    type: 'example',
                    title: 'إشارة تقاطع',
                    body: 'USDT كان سعره 49 جنيه. MA-7 = 49.5, MA-30 = 50.5. السعر بدأ يرتفع و MA-7 قطع MA-30 للأعلى. إشارة شراء. بعد أسبوع، السعر وصل 51. هذا ربح 2 جنيه/USDT.'
                },
                {
                    type: 'heading',
                    text: '3. مؤشر RSI (القوة النسبية)'
                },
                {
                    type: 'paragraph',
                    text: 'RSI يقيس قوة الحركة من 0-100. فوق 70 = تشبع شرائي (السعر مرتفع جداً، قد ينخفض). تحت 30 = تشبع بيعي (السعر منخفض جداً، قد يرتفع). في سوق USDT المصري، RSI مفيد لكن ليس حاسماً لأن السعر مربوط بالدولار.'
                },
                {
                    type: 'heading',
                    text: '4. حجم التداول (Volume)'
                },
                {
                    type: 'paragraph',
                    text: 'الحجم يؤكد قوة الحركة. إذا ارتفع السعر بحجم كبير = حركة قوية ومستدامة. إذا ارتفع بحجم ضعيف = قد تكون حركة مؤقتة. راقب حجم الصفقات على Eg-Money P2P.'
                },
                {
                    type: 'heading',
                    text: '5. الأنماط (Patterns)'
                },
                {
                    type: 'list',
                    items: [
                        'رأس وكتفان (Head & Shoulders): نمط انعكاسي — بعد اكتماله، ينعكس الاتجاه',
                        'مثلث صاعد (Ascending Triangle): استمراري — السعر يكمل في اتجاه الصعود',
                        'قمة مزدوجة (Double Top): السعر يصطدم بنفس المقاومة مرتين ثم ينخفض',
                        'قاع مزدوج (Double Bottom): السعر يصطدم بنفس الدعم مرتين ثم يرتفع'
                    ]
                },
                {
                    type: 'warning',
                    text: 'التحليل الفني ليس سحراً. الأنماط قد تنكسر. استخدمه كأداة مساعدة وليس كنبوءة. ادمجه مع إدارة المخاطر ووقف الخسارة.'
                },
                {
                    type: 'heading',
                    text: 'كيف تطبق التحليل الفني على Eg-Money'
                },
                {
                    type: 'list',
                    items: [
                        'استخدم الرسم البياني في صفحة التداول لرؤية حركة السعر',
                        'ارسم خطوط الدعم والمقاومة على فترة 7-30 يوم',
                        'راقب تقاطعات المتوسطات المتحركة',
                        'لا تتداول بناءً على إشارة واحدة — ابحث عن تأكيدات',
                        'سجّل توقعاتك وراجعها لاحقاً لقياس دقتك'
                    ]
                },
                {
                    type: 'calculation',
                    title: 'مثال صفقة مبنية على تحليل',
                    lines: [
                        {
                            label: 'الدعم الحالي',
                            value: '48 EGP'
                        },
                        {
                            label: 'المقاومة الحالية',
                            value: '51 EGP'
                        },
                        {
                            label: 'السعر الحالي',
                            value: '49 EGP (قرب الدعم)'
                        },
                        {
                            label: 'هدف الربح',
                            value: '50.5 EGP (قرب المقاومة)'
                        },
                        {
                            label: 'وقف الخسارة',
                            value: '47.5 EGP (أسفل الدعم)'
                        }
                    ],
                    result: 'مخاطرة 1.5 جنيه / عائد محتمل 1.5 جنيه = نسبة 1:1 (مقبولة)'
                },
                {
                    type: 'tip',
                    text: 'التحليل الفني يعمل بشكل أفضل في الأسواق ذات السيولة العالية. سوق USDT المصري صغير نسبياً، لذا قد تكون الإشارات أقل دقة. ادمج التحليل الفني مع التحليل الأساسي (الأخبار الاقتصادية).'
                }
            ],
            en: [
                {
                    type: 'paragraph',
                    text: 'Technical Analysis is the study of price movement through charts to predict future direction. It doesn\'t predict the future with 100% accuracy, but helps make informed decisions rather than random ones.'
                },
                {
                    type: 'heading',
                    text: '1. Support and resistance lines'
                },
                {
                    type: 'paragraph',
                    text: 'Support is a price where demand is strong enough to stop further decline. Resistance is a price where supply is strong enough to stop further rise.'
                },
                {
                    type: 'example',
                    title: 'Practical example',
                    body: 'USDT price oscillates between 48 and 51 EGP for a month. 48 = support (whenever it reaches, it bounces back up). 51 = resistance (whenever it reaches, it drops back). Strategy: buy at 48-49, sell at 50-51.'
                },
                {
                    type: 'heading',
                    text: '2. Moving Averages'
                },
                {
                    type: 'paragraph',
                    text: 'A moving average calculates the average price over a period. Most used: MA-7 (week), MA-30 (month), MA-90 (3 months). When MA-7 crosses MA-30 upward = buy signal. Downward = sell signal.'
                },
                {
                    type: 'example',
                    title: 'Crossover signal',
                    body: 'USDT was at 49 EGP. MA-7 = 49.5, MA-30 = 50.5. Price started rising and MA-7 crossed MA-30 upward. Buy signal. A week later, price reached 51. That\'s a 2 EGP/USDT profit.'
                },
                {
                    type: 'heading',
                    text: '3. RSI (Relative Strength Index)'
                },
                {
                    type: 'paragraph',
                    text: 'RSI measures momentum from 0-100. Above 70 = overbought (price too high, may drop). Below 30 = oversold (price too low, may rise). In the Egyptian USDT market, RSI is useful but not decisive since the price is dollar-pegged.'
                },
                {
                    type: 'heading',
                    text: '4. Volume'
                },
                {
                    type: 'paragraph',
                    text: 'Volume confirms move strength. If price rises with high volume = strong, sustainable move. If it rises with low volume = may be temporary. Watch trade volume on Eg-Money P2P.'
                },
                {
                    type: 'heading',
                    text: '5. Patterns'
                },
                {
                    type: 'list',
                    items: [
                        'Head & Shoulders: reversal pattern — after completion, trend reverses',
                        'Ascending Triangle: continuation — price continues upward',
                        'Double Top: price hits same resistance twice then drops',
                        'Double Bottom: price hits same support twice then rises'
                    ]
                },
                {
                    type: 'warning',
                    text: 'Technical analysis isn\'t magic. Patterns can break. Use it as a helper, not a prophecy. Combine it with risk management and stop-loss.'
                },
                {
                    type: 'heading',
                    text: 'How to apply TA on Eg-Money'
                },
                {
                    type: 'list',
                    items: [
                        'Use the trading page chart to see price movement',
                        'Draw support/resistance lines on 7-30 day periods',
                        'Watch moving average crossovers',
                        'Don\'t trade on a single signal — look for confirmations',
                        'Log your predictions and review later to measure accuracy'
                    ]
                },
                {
                    type: 'calculation',
                    title: 'Analysis-based trade example',
                    lines: [
                        {
                            label: 'Current support',
                            value: '48 EGP'
                        },
                        {
                            label: 'Current resistance',
                            value: '51 EGP'
                        },
                        {
                            label: 'Current price',
                            value: '49 EGP (near support)'
                        },
                        {
                            label: 'Profit target',
                            value: '50.5 EGP (near resistance)'
                        },
                        {
                            label: 'Stop-loss',
                            value: '47.5 EGP (below support)'
                        }
                    ],
                    result: 'Risk 1.5 EGP / potential return 1.5 EGP = 1:1 ratio (acceptable)'
                },
                {
                    type: 'tip',
                    text: 'Technical analysis works best in highly liquid markets. The Egyptian USDT market is relatively small, so signals may be less accurate. Combine TA with fundamental analysis (economic news).'
                }
            ]
        }
    },
    // ===================================================================
    {
        slug: 'payment-methods-guide',
        level: 'beginner',
        category: 'p2p',
        icon: '💳',
        readTime: 6,
        title: {
            ar: 'دليل طرق الدفع المصرية: فودافون كاش، إنستا باي، فوري',
            en: 'Guide to Egyptian payment methods: Vodafone Cash, InstaPay, Fawry'
        },
        excerpt: {
            ar: 'مقارنة شاملة بين طرق الدفع المتاحة، الرسوم، السرعة، وحدود التحويل لكل منها.',
            en: 'A comprehensive comparison of available payment methods, fees, speed, and transfer limits for each.'
        },
        content: {
            ar: [
                {
                    type: 'paragraph',
                    text: 'عند التداول على Eg-Money، تختار طريقة دفع لإيداع/سحب الجنيه. كل طريقة لها مميزاتها وعيوبها. إليك المقارنة الكاملة.'
                },
                {
                    type: 'heading',
                    text: '1. فودافون كاش (Vodafone Cash)'
                },
                {
                    type: 'list',
                    items: [
                        'السرعة: فوري (ثوانٍ)',
                        'الرسوم: 1% للتحويل لغير فودافون، مجاني لفودافون',
                        'الحد اليومي: 60,000 جنيه (حسب فئة الحساب)',
                        'الحد الشهري: 200,000 جنيه',
                        'الانتشار: الأكثر شيوعاً في مصر'
                    ]
                },
                {
                    type: 'paragraph',
                    text: 'الأفضل للصفقات الصغيرة والمتوسطة (حتى 30,000 جنيه). سريع جداً ومناسب لـ P2P.'
                },
                {
                    type: 'heading',
                    text: '2. إنستا باي (InstaPay)'
                },
                {
                    type: 'list',
                    items: [
                        'السرعة: فوري (ثوانٍ)',
                        'الرسوم: مجاني تماماً (حتى 100,000 جنيه شهرياً)',
                        'الحد اليومي: 60,000-250,000 جنيه (حسب البنك)',
                        'الحد الشهري: 200,000-6,000,000 جنيه',
                        'الانتشار: متزايد، يحتاج حساب بنكي'
                    ]
                },
                {
                    type: 'paragraph',
                    text: 'الأفضل للصفقات الكبيرة (فوق 30,000 جنيه). مجاني وحدود أعلى، لكن يحتاج حساب بنكي.'
                },
                {
                    type: 'heading',
                    text: '3. فوري (Fawry)'
                },
                {
                    type: 'list',
                    items: [
                        'السرعة: فوري (دقائق)',
                        'الرسوم: 5-10 جنيه لكل عملية',
                        'الحد اليومي: 6,000 جنيه للإيداع، 30,000 للسحب',
                        'الانتشار: واسع جداً، متاح في 200,000 منفذ'
                    ]
                },
                {
                    type: 'paragraph',
                    text: 'الأفضل للصفقات الصغيرة جداً (حتى 6,000 جنيه). مناسب لمن ليس لديه حساب بنكي أو فودافون كاش.'
                },
                {
                    type: 'heading',
                    text: '4. التحويل البنكي'
                },
                {
                    type: 'list',
                    items: [
                        'السرعة: 1-3 أيام عمل (محلي)، فوري (نفس البنك)',
                        'الرسوم: 5-50 جنيه حسب البنك',
                        'الحد: لا يوجد (حسب سياسة البنك)',
                        'الانتشار: متطلب لمستندات'
                    ]
                },
                {
                    type: 'paragraph',
                    text: 'الأفضل للصفقات الكبيرة جداً (فوق 100,000 جنيه) حيث فودافون كاش وإنستا باي لها حدود.'
                },
                {
                    type: 'calculation',
                    title: 'مقارنة رسوم صفقة 50,000 جنيه',
                    lines: [
                        {
                            label: 'فودافون كاش → فودافون كاش',
                            value: 'مجاني'
                        },
                        {
                            label: 'فودافون كاش → بنك',
                            value: '500 EGP (1%)'
                        },
                        {
                            label: 'إنستا باي',
                            value: 'مجاني'
                        },
                        {
                            label: 'فوري',
                            value: '10 EGP'
                        },
                        {
                            label: 'تحويل بنكي',
                            value: '20-50 EGP'
                        }
                    ],
                    result: 'إنستا باي الأرخص للصفقات الكبيرة'
                },
                {
                    type: 'heading',
                    text: 'نصائح لاختيار طريقة الدفع'
                },
                {
                    type: 'list',
                    items: [
                        'صفقات أقل من 6,000 جنيه: فودافون كاش أو فوري',
                        'صفقات 6,000-30,000 جنيه: فودافون كاش',
                        'صفقات 30,000-200,000 جنيه: إنستا باي (مجاني + حدود عالية)',
                        'صفقات فوق 200,000 جنيه: تحويل بنكي متعدد',
                        'دائماً احتفظ بأكثر من طريقة كاحتياط'
                    ]
                },
                {
                    type: 'warning',
                    text: 'لا تستخدم طريقة دفع ليست باسمك. إذا اكتشفت المنصة عدم تطابق الأسماء، قد تُجمّد حسابك للاشتباه.'
                },
                {
                    type: 'tip',
                    text: 'فعّل إشعارات Vodafone Cash و InstaPay لتتأكد فوراً من وصول المال في صفقات P2P. لا تعتمد على إشعار الطرف الآخر.'
                }
            ],
            en: [
                {
                    type: 'paragraph',
                    text: 'When trading on Eg-Money, you choose a payment method to deposit/withdraw EGP. Each method has pros and cons. Here\'s the full comparison.'
                },
                {
                    type: 'heading',
                    text: '1. Vodafone Cash'
                },
                {
                    type: 'list',
                    items: [
                        'Speed: instant (seconds)',
                        'Fees: 1% for non-Vodafone transfers, free for Vodafone',
                        'Daily limit: 60,000 EGP (depending on account tier)',
                        'Monthly limit: 200,000 EGP',
                        'Adoption: most widespread in Egypt'
                    ]
                },
                {
                    type: 'paragraph',
                    text: 'Best for small-to-medium trades (up to 30,000 EGP). Very fast and suitable for P2P.'
                },
                {
                    type: 'heading',
                    text: '2. InstaPay'
                },
                {
                    type: 'list',
                    items: [
                        'Speed: instant (seconds)',
                        'Fees: completely free (up to 100,000 EGP monthly)',
                        'Daily limit: 60,000-250,000 EGP (depending on bank)',
                        'Monthly limit: 200,000-6,000,000 EGP',
                        'Adoption: growing, requires bank account'
                    ]
                },
                {
                    type: 'paragraph',
                    text: 'Best for large trades (above 30,000 EGP). Free with higher limits, but requires a bank account.'
                },
                {
                    type: 'heading',
                    text: '3. Fawry'
                },
                {
                    type: 'list',
                    items: [
                        'Speed: instant (minutes)',
                        'Fees: 5-10 EGP per transaction',
                        'Daily limit: 6,000 EGP for deposits, 30,000 for withdrawals',
                        'Adoption: very wide, available at 200,000 outlets'
                    ]
                },
                {
                    type: 'paragraph',
                    text: 'Best for very small trades (up to 6,000 EGP). Suitable for those without bank accounts or Vodafone Cash.'
                },
                {
                    type: 'heading',
                    text: '4. Bank transfer'
                },
                {
                    type: 'list',
                    items: [
                        'Speed: 1-3 business days (domestic), instant (same bank)',
                        'Fees: 5-50 EGP depending on bank',
                        'Limit: none (depending on bank policy)',
                        'Adoption: requires documentation'
                    ]
                },
                {
                    type: 'paragraph',
                    text: 'Best for very large trades (above 100,000 EGP) where Vodafone Cash and InstaPay have limits.'
                },
                {
                    type: 'calculation',
                    title: 'Fee comparison for 50,000 EGP trade',
                    lines: [
                        {
                            label: 'Vodafone Cash → Vodafone Cash',
                            value: 'Free'
                        },
                        {
                            label: 'Vodafone Cash → Bank',
                            value: '500 EGP (1%)'
                        },
                        {
                            label: 'InstaPay',
                            value: 'Free'
                        },
                        {
                            label: 'Fawry',
                            value: '10 EGP'
                        },
                        {
                            label: 'Bank transfer',
                            value: '20-50 EGP'
                        }
                    ],
                    result: 'InstaPay is cheapest for large trades'
                },
                {
                    type: 'heading',
                    text: 'Tips for choosing a payment method'
                },
                {
                    type: 'list',
                    items: [
                        'Trades under 6,000 EGP: Vodafone Cash or Fawry',
                        'Trades 6,000-30,000 EGP: Vodafone Cash',
                        'Trades 30,000-200,000 EGP: InstaPay (free + high limits)',
                        'Trades above 200,000 EGP: multiple bank transfers',
                        'Always keep more than one method as backup'
                    ]
                },
                {
                    type: 'warning',
                    text: 'Don\'t use a payment method not in your name. If the platform discovers name mismatch, your account may be frozen for suspicion.'
                },
                {
                    type: 'tip',
                    text: 'Enable Vodafone Cash and InstaPay notifications to instantly confirm money arrival in P2P trades. Don\'t rely on the other party\'s notification.'
                }
            ]
        }
    },
    // ===================================================================
    {
        slug: 'taxes-and-legal',
        level: 'advanced',
        category: 'economy',
        icon: '⚖️',
        readTime: 7,
        title: {
            ar: 'الضرائب والقوانين: الوضع القانوني لـ USDT في مصر',
            en: 'Taxes and laws: the legal status of USDT in Egypt'
        },
        excerpt: {
            ar: 'ماذا يقول القانون المصري عن تداول العملات الرقمية؟ هل تدفع ضرائب؟ مخاطر قانونية يجب معرفتها.',
            en: 'What does Egyptian law say about crypto trading? Do you pay taxes? Legal risks you should know.'
        },
        content: {
            ar: [
                {
                    type: 'paragraph',
                    text: 'الوضع القانوني للعملات الرقمية في مصر معقد وغير واضح تماماً. هذا المقال يلخص الوضع الحالي حتى تاريخ نشره — استشر محامياً للاستشارة الخاصة.'
                },
                {
                    type: 'warning',
                    text: 'هذا المقال للمعلومات العامة فقط وليس استشارة قانونية. القوانين تتغير. راجع محامياً مختصاً قبل اتخاذ قرارات مالية كبيرة.'
                },
                {
                    type: 'heading',
                    text: 'موقف البنك المركزي المصري'
                },
                {
                    type: 'paragraph',
                    text: 'في 2018، أصدر البنك المركزي تحذيراً من العملات الرقمية، لكنه لم يحظرها صراحة. في 2020، أقر قانون البنك المركزي والجهاز المصرفي الذي يجرم إصدار أو ترويج عملات رقمية بدون ترخيص. لكن التداول الشخصي بين الأفراد ليس محظوراً صراحة.'
                },
                {
                    type: 'heading',
                    text: 'موقف هيئة الرقابة المالية'
                },
                {
                    type: 'paragraph',
                    text: 'هيئة الرقابة المالية تنظم منصات التداول المرخصة. معظم منصات العملات الرقمية العاملة في مصر غير مرخصة. هذا يضع المستخدم في منطقة رمادية قانونياً.'
                },
                {
                    type: 'heading',
                    text: 'الضرائب على الأرباح'
                },
                {
                    type: 'paragraph',
                    text: 'قانونياً، أي ربح من تداول الأصول يخضع لضريبة الدخل. لكن في الواقع، لا توجد آلية واضحة للإبلاغ عن أرباح العملات الرقمية. إذا حولت أرباحاً كبيرة لجنيه عبر بنك، قد يطلب البنك مصدر الأموال.'
                },
                {
                    type: 'list',
                    items: [
                        'أرباح التداول = دخل خاضع للضريبة (قانونياً)',
                        'لا يوجد نموذج محدد للإبلاغ عن أرباح العملات الرقمية',
                        'البنوك قد تطلب مستندات للتحويلات الكبيرة (>10,000$)',
                        'التخفيضات الكبيرة قد تثير شبهات غسيل أموال'
                    ]
                },
                {
                    type: 'heading',
                    text: 'غسيل الأموال والامتثال'
                },
                {
                    type: 'paragraph',
                    text: 'مصر عضو في مجموعة الـ FATF المالية. القانون المصري يلزم المنصات المالية بتطبيق إجراءات اعرف عميلك (KYC) والإبلاغ عن المعاملات المشبوهة. Eg-Money يطبق KYC عند التسجيل.'
                },
                {
                    type: 'heading',
                    text: 'مخاطر قانونية محتملة'
                },
                {
                    type: 'list',
                    items: [
                        'الحظر المستقبلي — الحكومة قد تحظر التداول في أي وقت',
                        'تجميد الحسابات البنكية — إذا اشتبه البنك في نشاطك',
                        'التحقيق الضريبي — إذا أبلغ البنك عن تحويلات كبيرة',
                        'فقدان الأموال — إذا أُغلقت المنصة بدون تنظيم'
                    ]
                },
                {
                    type: 'heading',
                    text: 'كيف تحمي نفسك قانونياً'
                },
                {
                    type: 'list',
                    items: [
                        'سجّل كل صفقاتك وأرباحك (للإبلاغ الضريبي عند الطلب)',
                        'لا تحول مبالغ كبيرة دفعة واحدة — جزّئها',
                        'استخدم طرق دفع رسمية (بنوك، محافظ مرخصة)',
                        'لا تعلن عن أرباحك على وسائل التواصل',
                        'احتفظ بـ USDT في محافظ متعددة لتقليل المخاطر',
                        'استشر محامياً قبل التحويلات الكبيرة (>500,000 جنيه)'
                    ]
                },
                {
                    type: 'example',
                    title: 'سيناريو واقعي',
                    body: 'تاجر يحقق ربح 200,000 جنيه من USDT ويحولها لبنكه. البنك يطلب مصدر الأموال. التاجر يقدم سجلات التداول. البنك قد يطلب ضرائب (10-22.5%) على الأرباح قبل تحرير المبلغ. النتيجة: الربح الصافي بعد الضرائب ≈ 155,000-180,000 جنيه.'
                },
                {
                    type: 'heading',
                    text: 'مستقبل التنظيم'
                },
                {
                    type: 'paragraph',
                    text: 'الحكومة المصرية تدرس تنظيم العملات الرقمية منذ 2023. من المتوقع إصدار قانون ينظم التداول والمنصات. حتى ذلك الحين، الوضع رمادي — تداول بحذر واحتفظ بسجلات.'
                },
                {
                    type: 'tip',
                    text: 'القاعدة الذهبية: لا تستثمر أكثر مما تستطيع خسارته، واحتفظ بسجلات دقيقة، واستشر محامياً للتحويلات الكبيرة. الشفافية مع البنك أفضل من إخفاء الأموال.'
                }
            ],
            en: [
                {
                    type: 'paragraph',
                    text: 'The legal status of cryptocurrencies in Egypt is complex and not entirely clear. This article summarizes the current situation as of publication — consult a lawyer for specific advice.'
                },
                {
                    type: 'warning',
                    text: 'This article is for general information only and is not legal advice. Laws change. Consult a specialist lawyer before making major financial decisions.'
                },
                {
                    type: 'heading',
                    text: 'Central Bank of Egypt\'s position'
                },
                {
                    type: 'paragraph',
                    text: 'In 2018, the CBE issued a warning about cryptocurrencies but didn\'t explicitly ban them. In 2020, a banking law criminalized issuing or promoting cryptocurrencies without a license. However, personal trading between individuals isn\'t explicitly prohibited.'
                },
                {
                    type: 'heading',
                    text: 'Financial Regulatory Authority position'
                },
                {
                    type: 'paragraph',
                    text: 'The FRA regulates licensed trading platforms. Most crypto platforms operating in Egypt are unlicensed. This puts users in a legal gray area.'
                },
                {
                    type: 'heading',
                    text: 'Taxes on profits'
                },
                {
                    type: 'paragraph',
                    text: 'Legally, any trading profit is subject to income tax. But in practice, there\'s no clear mechanism for reporting crypto profits. If you convert large profits to EGP via bank, the bank may ask for the source of funds.'
                },
                {
                    type: 'list',
                    items: [
                        'Trading profits = taxable income (legally)',
                        'No specific form for reporting crypto profits',
                        'Banks may request documents for large transfers (>10,000$)',
                        'Large conversions may raise money laundering suspicions'
                    ]
                },
                {
                    type: 'heading',
                    text: 'AML and compliance'
                },
                {
                    type: 'paragraph',
                    text: 'Egypt is a FATF member. Egyptian law requires financial platforms to apply KYC (Know Your Customer) and report suspicious transactions. Eg-Money applies KYC at registration.'
                },
                {
                    type: 'heading',
                    text: 'Potential legal risks'
                },
                {
                    type: 'list',
                    items: [
                        'Future ban — government may ban trading at any time',
                        'Bank account freeze — if bank suspects your activity',
                        'Tax investigation — if bank reports large transfers',
                        'Loss of funds — if platform closes without regulation'
                    ]
                },
                {
                    type: 'heading',
                    text: 'How to protect yourself legally'
                },
                {
                    type: 'list',
                    items: [
                        'Log all trades and profits (for tax reporting if requested)',
                        'Don\'t convert large amounts at once — split them',
                        'Use official payment methods (banks, licensed wallets)',
                        'Don\'t announce profits on social media',
                        'Keep USDT in multiple wallets to reduce risk',
                        'Consult a lawyer before large transfers (>500,000 EGP)'
                    ]
                },
                {
                    type: 'example',
                    title: 'Realistic scenario',
                    body: 'A trader makes 200,000 EGP profit from USDT and transfers to their bank. The bank asks for source of funds. The trader provides trading records. The bank may request taxes (10-22.5%) on profits before releasing the amount. Result: net profit after taxes ≈ 155,000-180,000 EGP.'
                },
                {
                    type: 'heading',
                    text: 'Future regulation'
                },
                {
                    type: 'paragraph',
                    text: 'The Egyptian government has been studying crypto regulation since 2023. A law regulating trading and platforms is expected. Until then, the situation is gray — trade cautiously and keep records.'
                },
                {
                    type: 'tip',
                    text: 'Golden rule: don\'t invest more than you can lose, keep accurate records, and consult a lawyer for large transfers. Transparency with your bank is better than hiding funds.'
                }
            ]
        }
    }
];
const GLOSSARY = [
    {
        term: {
            ar: 'USDT',
            en: 'USDT'
        },
        definition: {
            ar: 'عملة رقمية مستقرة مربوطة بالدولار الأمريكي. 1 USDT ≈ 1 دولار.',
            en: 'A stablecoin pegged to the US dollar. 1 USDT ≈ 1 USD.'
        }
    },
    {
        term: {
            ar: 'الـ Spread',
            en: 'Spread'
        },
        definition: {
            ar: 'الفرق بين سعر الشراء وسعر البيع. هذا كيف تربح المنصة.',
            en: 'The difference between buy and sell prices. This is how the platform earns.'
        }
    },
    {
        term: {
            ar: 'الـ Escrow',
            en: 'Escrow'
        },
        definition: {
            ar: 'حساب ضمان مؤقت تحفظ فيه USDT حتى اكتمال الصفقة.',
            en: 'A temporary holding account where USDT is locked until trade completion.'
        }
    },
    {
        term: {
            ar: 'P2P',
            en: 'P2P'
        },
        definition: {
            ar: 'تداول من شخص لشخص، بدون وسيط (المنصة توفر فقط الضمان).',
            en: 'Peer-to-peer trading without intermediary (platform only provides escrow).'
        }
    },
    {
        term: {
            ar: 'الـ DCA',
            en: 'DCA'
        },
        definition: {
            ar: 'استراتيجية شراء مبالغ ثابتة على فترات منتظمة لتقليل تأثير تقلبات السعر.',
            en: 'Strategy of buying fixed amounts at regular intervals to reduce volatility impact.'
        }
    },
    {
        term: {
            ar: 'وقف الخسارة',
            en: 'Stop-loss'
        },
        definition: {
            ar: 'أمر بيع تلقائي عند سعر محدد لتقليل الخسارة.',
            en: 'Automatic sell order at a specified price to limit loss.'
        }
    },
    {
        term: {
            ar: 'المراجحة',
            en: 'Arbitrage'
        },
        definition: {
            ar: 'شراء أصل بسعر منخفض في مكان وبيعه بسعر مرتفع في مكان آخر.',
            en: 'Buying an asset at a low price in one place and selling at a higher price elsewhere.'
        }
    },
    {
        term: {
            ar: 'السيولة',
            en: 'Liquidity'
        },
        definition: {
            ar: 'مدى سهولة شراء/بيع أصل بدون التأثير على السعر.',
            en: 'How easily an asset can be bought/sold without affecting the price.'
        }
    },
    {
        term: {
            ar: 'الـ KYC',
            en: 'KYC'
        },
        definition: {
            ar: 'اعرف عميلك — إجراءات التحقق من هوية المستخدم.',
            en: 'Know Your Customer — user identity verification procedures.'
        }
    },
    {
        term: {
            ar: 'الـ FUD',
            en: 'FUD'
        },
        definition: {
            ar: 'الخوف، عدم اليقين، والشك — تكتيك لنشر الذعر للتأثير على الأسعار.',
            en: 'Fear, Uncertainty, Doubt — tactic to spread panic affecting prices.'
        }
    }
];
}),
"[project]/src/lib/p2p-templates.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "deleteTemplate",
    ()=>deleteTemplate,
    "getTemplates",
    ()=>getTemplates,
    "renameTemplate",
    ()=>renameTemplate,
    "saveTemplate",
    ()=>saveTemplate
]);
'use client';
const STORAGE_KEY = 'eg-money:p2p-templates';
const MAX_TEMPLATES = 12;
function getTemplates() {
    if ("TURBOPACK compile-time truthy", 1) return [];
    //TURBOPACK unreachable
    ;
}
function saveTemplate(template) {
    if ("TURBOPACK compile-time truthy", 1) throw new Error('localStorage not available');
    const newTemplate = {
        ...template,
        id: `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        createdAt: Date.now()
    };
    const all = getTemplates();
    all.unshift(newTemplate);
    // Cap at MAX_TEMPLATES
    const trimmed = all.slice(0, MAX_TEMPLATES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    return newTemplate;
}
function deleteTemplate(id) {
    if ("TURBOPACK compile-time truthy", 1) return;
    //TURBOPACK unreachable
    ;
    const all = undefined;
}
function renameTemplate(id, newLabel) {
    if ("TURBOPACK compile-time truthy", 1) return;
    //TURBOPACK unreachable
    ;
    const all = undefined;
}
}),
];

//# sourceMappingURL=src_lib_acd08d51._.js.map