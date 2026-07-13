'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { BrandLogo } from '@/components/brand-logo'
import {
  ArrowRight, Search, HelpCircle, Wallet, Users, ShieldCheck, CreditCard,
  AlertTriangle, MessageSquare, Phone, Mail, TrendingUp, Settings,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

// FAQ content — organized by category
type FaqItem = {
  q: string
  a: string
}

type FaqCategory = {
  id: string
  label: string
  icon: any
  color: string
  questions: FaqItem[]
}

const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: 'getting-started',
    label: 'البداية',
    icon: HelpCircle,
    color: 'bg-blue-500/10 text-blue-500',
    questions: [
      {
        q: 'كيف أنشئ حساباً على المنصة؟',
        a: 'اضغط على "ابدأ الآن" في الصفحة الرئيسية، أدخل بريدك الإلكتروني واسم مستخدم وكلمة مرور قوية. ستصلك رسالة تحقق على بريدك. بعد تأكيد البريد، يمكنك تسجيل الدخول والبدء في التداول.',
      },
      {
        q: 'هل التسجيل مجاني؟',
        a: 'نعم، إنشاء الحساب مجاني تماماً. لا توجد رسوم خفية. رسوم المنصة تُطبق فقط على الصفقات (1.5% للتداول المباشر، 0.3% لصفقات P2P).',
      },
      {
        q: 'ما هي المستندات المطلوبة للتحقق؟',
        a: 'حالياً نطلب تأكيد البريد الإلكتروني ورقم الهاتف عبر رمز OTP. للحسابات كبيرة الحجم قد نطلب لاحقاً وثيقة هوية (بطاقة رقم قومي أو جواز سفر) كجزء من إجراءات KYC.',
      },
    ],
  },
  {
    id: 'trading',
    label: 'التداول المباشر',
    icon: TrendingUp,
    color: 'bg-emerald-500/10 text-emerald-500',
    questions: [
      {
        q: 'ما الفرق بين التداول المباشر و P2P؟',
        a: 'التداول المباشر هو بيع/شراء فوري من المنصة بأسعار السوق الحية + رسوم 1.5%. أما P2P فهو تداول بين المستخدمين أنفسهم برسوم أقل (0.3%) لكنه يتطلب انتظار الطرف الآخر لتأكيد الدفع والإفراج.',
      },
      {
        q: 'من أين تأتي أسعار USDT/EGP؟',
        a: 'نجلب الأسعار مباشرة من Binance P2P API كل 10 ثوانٍ. هذه هي الأسعار الحقيقية للسوق المصري. لا نضيف هوامش على السعر — رسومنا تظهر بشكل منفصل وواضح.',
      },
      {
        q: 'هل يمكنني إلغاء صفقة مباشرة؟',
        a: 'التداول المباشر لحظي — بمجرد تنفيذه لا يمكن إلغاؤه. تأكد من الكمية والسعر قبل التأكيد. للتداول الأبطأ، استخدم سوق P2P حيث يمكنك الإلغاء قبل تأكيد الدفع.',
      },
      {
        q: 'ما الحد الأقصى للصفقة الواحدة؟',
        a: 'الحد الأقصى للتداول المباشر يعتمد على رصيدك المتاح. لصفقات P2P يحدد صاحب العرض الحدود (عادة 100 - 100,000 جنيه).',
      },
    ],
  },
  {
    id: 'p2p',
    label: 'سوق P2P',
    icon: Users,
    color: 'bg-violet-500/10 text-violet-500',
    questions: [
      {
        q: 'كيف يعمل نظام الضمان (Escrow)؟',
        a: 'عند إنشاء صفقة P2P بيع، يتم حجز USDT من البائع في escrow. المشتري يدفع EGP خارج المنصة (فودافون كاش، إنستا باي، إلخ)، ثم يضغط "أكدت الدفع". البائع يتحقق من وصول المبلغ ويضغط "إفراج عن USDT" — يتم تحويل USDT تلقائياً للمشتري.',
      },
      {
        q: 'ماذا لو لم يفرج البائع؟',
        a: 'لديك مهلة 30 دقيقة للدفع. إذا أكدت الدفع ولم يفرج البائع خلال وقت معقول، افتح نزاع من زر "محادثة + فتح نزاع". ستتدخل الإدارة لمراجعة الصفقة، وتستطيع رؤية كل الرسائل والإيصالات. الإدارة ستحل النزاع لصالح الطرف المحق.',
      },
      {
        q: 'هل يمكنني إلغاء صفقة P2P؟',
        a: 'نعم، يمكن لأي طرف الإلغاء طالما الصفقة في حالة "بانتظار الدفع" أو "تم الدفع" (قبل الإفراج). يتم استرجاع الأموال تلقائياً للطرفين. لكن الإلغاء المتكرر قد يؤثر على سمعتك.',
      },
      {
        q: 'كيف أتجنب الاحتيال في P2P؟',
        a: '(1) تداول فقط مع مستخدمين موثّقين (شارة "موثّق"). (2) ارفع دائماً صورة إيصال الدفع. (3) لا تدفع خارج المنصة ثم تنتظر — استخدم نظام الـ Escrow. (4) افتح نزاع فوراً عند أي مشكلة. (5) راجع تقييمات المستخدم قبل التداول معه.',
      },
      {
        q: 'ما هي رسوم P2P؟',
        a: 'رسوم P2P هي 0.3% من قيمة الصفقة، يتقاسمها الطرفان (0.15% لكل طرف). تُخصم تلقائياً عند التسوية. لا توجد رسوم خفية.',
      },
    ],
  },
  {
    id: 'wallet',
    label: 'المحفظة',
    icon: Wallet,
    color: 'bg-amber-500/10 text-amber-500',
    questions: [
      {
        q: 'كيف أودع EGP في حسابي؟',
        a: 'اذهب لتبويب "الإيداع والسحب"، اختر "إيداع"، أدخل المبلغ. ستحصل على رقم محفظة إدارية (فودافون كاش أو إنستا باي). حوّل المبلغ لهذه المحفظة من رقم هاتفك، ارفع صورة الإيصال، واكتب رقم المرسل. يتم اعتماد الإيداع خلال دقائق.',
      },
      {
        q: 'كم يستغرق السحب؟',
        a: 'السحب يُعالج يدوياً من الإدارة لأمان أكبر. عادة يتم خلال ساعة في أوقات العمل (9 ص - 11 م). السحوبات الكبيرة (>10,000 جنيه) قد تستغرق حتى 24 ساعة لمزيد من التحقق.',
      },
      {
        q: 'ما الحد الأدنى للإيداع والسحب؟',
        a: 'الحد الأدنى للإيداع 100 جنيه. الحد الأدنى للسحب 200 جنيه. الحد الأقصى اليومي للسحب 50,000 جنيه (يمكن رفعه بالتواصل مع الإدارة).',
      },
      {
        q: 'هل أموالي آمنة على المنصة؟',
        a: 'نعم. USDT الخاص بك محفوظ في محافظ باردة (cold wallets) لأغراض الحفظ. EGP محفوظة في حسابات بنكية منفصلة. نستخدم تشفير TLS لكل الاتصالات ولا نخزن كلمات المرور كنص واضح.',
      },
    ],
  },
  {
    id: 'security',
    label: 'الأمان',
    icon: ShieldCheck,
    color: 'bg-rose-500/10 text-rose-500',
    questions: [
      {
        q: 'كيف أحافظ على أمان حسابي؟',
        a: '(1) استخدم كلمة مرور قوية (12+ حرف، أحرف كبيرة وصغيرة، أرقام، رموز). (2) لا تشارك كلمة المرور مع أحد. (3) فعّل إشعارات تسجيل الدخول لتصلك تنبيهات. (4) راجع "السجل الأمني" بانتظام. (5) سجل خروج من الأجهزة العامة.',
      },
      {
        q: 'ماذا أفعل إذا نسيت كلمة المرور؟',
        a: 'اضغط "نسيت كلمة المرور" في صفحة الدخول. أدخل بريدك، ستصلك رسالة OTP. بعد التحقق، يمكنك تعيين كلمة مرور جديدة. لأمان أكبر، ننصح بتغييرها فوراً بعد استعادة الوصول.',
      },
      {
        q: 'هل تدعمون التحقق بخطوتين (2FA)؟',
        a: 'حالياً نعتمد على OTP عبر البريد والهاتف. التحقق بخطوتين عبر تطبيقات TOTP (Google Authenticator) قيد التطوير وسيُضاف قريباً.',
      },
      {
        q: 'كيف أبلغ عن نشاط مشبوه؟',
        a: 'تواصل مع الإدارة فوراً عبر زر "الدعم" في الإعدادات، أو راسلنا على support@eg-money.com. اشرح المشكلة بالتفصيل مع لقطات شاشة إن أمكن. الإدارة ترد خلال ساعات.',
      },
    ],
  },
  {
    id: 'account',
    label: 'إدارة الحساب',
    icon: Settings,
    color: 'bg-blue-500/10 text-blue-500',
    questions: [
      {
        q: 'كيف أغير اسمي أو رقم هاتفي؟',
        a: 'اذهب لـ "الإعدادات" → "الملف الشخصي". يمكنك تعديل الاسم. لتغيير رقم الهاتف، يجب تأكيده برمز OTP. البريد الإلكتروني لا يمكن تغييره (لأسباب أمنية) — تواصل مع الدعم إن لزم.',
      },
      {
        q: 'كيف أغير كلمة المرور؟',
        a: 'الإعدادات → الأمان → تغيير كلمة المرور. ستحتاج لإدخال كلمة المرور الحالية + الجديدة مرتين. ننصح بتغييرها كل 3-6 أشهر.',
      },
      {
        q: 'هل يمكنني حذف حسابي؟',
        a: 'نعم. تواصل مع الدعم لطلب حذف الحساب. يجب أن يكون رصيدك صفراً (اسحب كل شيء أولاً). بعد الحذف، تُحفظ سجلات المعاملات لمدة 5 سنوات (التزام قانوني) لكن بياناتك الشخصية تُحذف.',
      },
      {
        q: 'هل لديكم نظام إحالة؟',
        a: 'نعم! كل مستخدم لديه كود إحالة فريد (موجود في الـ Dashboard). شاركه مع أصدقائك — عند تسجيلهم وإيداعهم الأول، تحصل على مكافأة. تفاصيل أكثر في صفحة الإحالات.',
      },
    ],
  },
]

export default function HelpPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')

  // Filter questions by search + category
  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase()
    return FAQ_CATEGORIES.filter((cat) => {
      if (activeCategory !== 'all' && cat.id !== activeCategory) return false
      if (!q) return true
      // Show category if any question matches the search
      return cat.questions.some(
        (item) => item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q),
      )
    }).map((cat) => ({
      ...cat,
      questions: q
        ? cat.questions.filter(
            (item) => item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q),
          )
        : cat.questions,
    }))
  }, [search, activeCategory])

  const totalQuestions = FAQ_CATEGORIES.reduce((s, c) => s + c.questions.length, 0)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container-fluid">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Button variant="ghost" size="sm" className="gap-1" onClick={() => router.push('/')}>
              <ArrowRight className="w-4 h-4" />
              رجوع
            </Button>
            <BrandLogo size="sm" />
            <div className="w-16" />
          </div>
        </div>
      </header>

      <main className="container-fluid py-6 space-y-6 max-w-4xl mx-auto">
        {/* Hero */}
        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-3">
            <HelpCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold">مركز المساعدة</h1>
          <p className="text-muted-foreground mt-2 text-sm max-w-md mx-auto">
            لدينا {totalQuestions} سؤال وجواب covering كل جوانب المنصة. ابحث أو تصفح حسب الفئة.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-xl mx-auto">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="ابحث عن سؤالك..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10 h-12 text-base"
          />
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
              activeCategory === 'all'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            الكل
          </button>
          {FAQ_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-full border transition-colors ${
                activeCategory === cat.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <cat.icon className={`w-3 h-3 ${cat.color.split(' ')[1]}`} />
              {cat.label}
            </button>
          ))}
        </div>

        {/* FAQ accordion */}
        <div className="space-y-4">
          {filteredCategories.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>لا توجد نتائج لـ "{search}"</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setSearch('')}>
                  مسح البحث
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredCategories.map((cat) => (
              <div key={cat.id}>
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-2 px-1">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cat.color}`}>
                    <cat.icon className="w-4 h-4" />
                  </div>
                  {cat.label}
                  <Badge variant="outline" className="text-[10px]">
                    {cat.questions.length}
                  </Badge>
                </h2>
                <Card>
                  <CardContent className="p-2">
                    <Accordion type="single" collapsible>
                      {cat.questions.map((item, idx) => (
                        <AccordionItem key={idx} value={`${cat.id}-${idx}`}>
                          <AccordionTrigger className="text-right hover:no-underline px-3 py-3 text-sm font-medium">
                            {item.q}
                          </AccordionTrigger>
                          <AccordionContent className="px-3 pb-3 text-sm text-muted-foreground leading-relaxed">
                            {item.a}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              </div>
            ))
          )}
        </div>

        {/* Contact CTA */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6 text-center">
            <MessageSquare className="w-10 h-10 text-primary mx-auto mb-3" />
            <h3 className="text-lg font-bold">لم تجد إجابتك؟</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              فريق الدعم متاح لمساعدتك على مدار اليوم
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button variant="default" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                محادثة مع الدعم
              </Button>
              <a href="mailto:support@eg-money.com">
                <Button variant="outline" className="gap-2 w-full sm:w-auto">
                  <Mail className="w-4 h-4" />
                  support@eg-money.com
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
