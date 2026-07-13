'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Coins, Zap, Shield, Users, TrendingUp, ArrowDownToLine, ArrowUpFromLine,
  Check, Menu, X, Phone, Mail, MessageCircle, Moon, Sun, Star,
  ArrowRightLeft, Lock, Sparkles, Clock, Wallet, ChevronDown, Activity,
  Cpu, Database, Layers, Boxes, Globe, Quote, ArrowLeft,
  Building2, Bitcoin, Banknote, Gauge, Eye, Fingerprint, ServerOff,
  BookOpen, Smartphone, GraduationCap, Newspaper, Radio, Gift,
  Trophy, Target, BarChart3, LayoutGrid, HelpCircle, LogIn, Rocket, Languages,
} from 'lucide-react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose,
} from '@/components/ui/sheet'
import { useAuth, fmtEgp } from '@/lib/client'
import { useTicker } from '@/hooks/use-ticker'
import { useLanguage } from '@/hooks/use-language'
import { Coin3D } from '@/components/coin-3d'
import { Counter } from '@/components/counter'
import { LiveTicker, TickerBar } from '@/components/live-ticker'
import { LiveActivityFeed } from '@/components/live-activity-feed'
import { LiveStatsGrid } from '@/components/live-stats-grid'
import { TrustPartners, Newsletter, CookieConsent } from '@/components/trust-partners'
import { ConnectionBanner } from '@/components/connection-status'
import { BrandLogo } from '@/components/brand-logo'
import { PAYMENT_ICONS } from '@/components/payment-icons'
import { NotificationsBell } from '@/components/notifications-bell'
import { LanguageSwitcher } from '@/components/language-switcher'
import { EDU_ARTICLES, type EduLevel, type EduCategory } from '@/lib/edu-content'

// Education level + category labels (mirror of the config in /learn page)
const LEVEL_CONFIG: Record<EduLevel, { ar: string; en: string; color: string }> = {
  beginner: { ar: 'مبتدئ', en: 'Beginner', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' },
  intermediate: { ar: 'متوسط', en: 'Intermediate', color: 'bg-amber-500/10 text-amber-500 border-amber-500/30' },
  advanced: { ar: 'متقدم', en: 'Advanced', color: 'bg-rose-500/10 text-rose-500 border-rose-500/30' },
}
const EDU_CATEGORY_LABELS: Record<EduCategory, { ar: string; en: string }> = {
  basics: { ar: 'الأساسيات', en: 'Basics' },
  strategy: { ar: 'استراتيجيات', en: 'Strategy' },
  security: { ar: 'الأمان', en: 'Security' },
  economy: { ar: 'اقتصاد', en: 'Economy' },
  p2p: { ar: 'P2P', en: 'P2P' },
  risk: { ar: 'المخاطر', en: 'Risk' },
}

type LandingPageProps = {
  onGetStarted: () => void
  onLogin: () => void
}

export function LandingPage({ onGetStarted, onLogin }: LandingPageProps) {
  const { settings } = useAuth()
  const { data: tickerData } = useTicker()
  const { lang, t } = useLanguage()
  const [dark, setDark] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<{id: string; name: string; nameAr: string; icon: string; logoUrl: string | null}[]>([])

  useEffect(() => {
    if (dark) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [dark])

  useEffect(() => {
    fetch('/api/payment-methods').then(r => r.ok ? r.json() : null).then(d => { if (d?.methods) setPaymentMethods(d.methods) }).catch(() => {})
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Use LIVE prices from WebSocket (live market) only — no static fallbacks.
  // While connecting, price is 0 and the LiveTicker component shows dashes.
  const buyPrice = tickerData?.buyPriceEgp ?? 0
  const sellPrice = tickerData?.sellPriceEgp ?? 0

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ===== Top Navigation ===== */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass-strong border-b border-border/50 shadow-lg shadow-background/50' : 'bg-transparent border-transparent'
      }`}>
        <div className="container-fluid">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo — official brand mark + name */}
            <BrandLogo size="sm" />

            {/* Desktop nav (lg+) */}
            <nav className="hidden lg:flex items-center gap-1">
              <a href="#features" className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors nav-underline flex items-center gap-1.5">
                <LayoutGrid className="w-3.5 h-3.5" />
                {t('landing.nav.features')}
              </a>
              <a href="#how" className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors nav-underline flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                {t('landing.nav.how')}
              </a>
              <a href="#pricing" className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors nav-underline flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                {t('landing.nav.pricing')}
              </a>
              <a href="#faq" className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors nav-underline flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                {t('landing.nav.faq')}
              </a>
            </nav>

            {/* Desktop actions (sm+) */}
            <div className="hidden sm:flex items-center gap-1.5">
              <LanguageSwitcher />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDark(!dark)}
                className="h-9 w-9"
              >
                {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" onClick={onLogin} className="text-sm gap-1.5">
                <LogIn className="w-4 h-4" />
                {t('landing.nav.login')}
              </Button>
              <Button
                onClick={onGetStarted}
                className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground glow-primary-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {t('landing.nav.getStarted')}
              </Button>
            </div>

            {/* Mobile actions (sm-) */}
            <div className="flex sm:hidden items-center gap-0.5">
              <Button
                onClick={onGetStarted}
                size="sm"
                className="gap-1 bg-primary hover:bg-primary/90 text-primary-foreground glow-primary-sm h-8 px-3 text-xs"
              >
                <Rocket className="w-3 h-3" />
                {t('landing.nav.getStartedShort')}
              </Button>
              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    aria-label={t('landing.nav.openMenu')}
                  >
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[85vw] max-w-sm p-0 glass-strong border-border/50">
                  <SheetHeader className="p-5 border-b border-border/50">
                    <div className="flex items-center justify-between">
                      <SheetTitle asChild>
                        <div><BrandLogo size="md" /></div>
                      </SheetTitle>
                      <SheetClose asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <X className="w-4 h-4" />
                        </Button>
                      </SheetClose>
                    </div>
                  </SheetHeader>

                  <div className="p-5 space-y-1 overflow-y-auto">
                    {/* Live price mini-card in menu */}
                    <div className="glass rounded-xl p-3 mb-4 border-primary/20">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-muted-foreground">USDT / EGP</span>
                        <span className="flex items-center gap-1 text-[10px] text-success">
                          <span className="w-1 h-1 rounded-full bg-success animate-pulse" />
                          {t('landing.mobileMenu.marketPrice')}
                        </span>
                      </div>
                      <div className="font-num text-xl font-bold text-primary">
                        {buyPrice > 0 ? fmtEgp(buyPrice) : '—'}
                        <span className="text-xs text-muted-foreground mr-1"> EGP</span>
                      </div>
                    </div>

                    {/* Navigation links */}
                    <div className="space-y-1">
                      <MobileNavLink
                        href="#features"
                        icon={LayoutGrid}
                        label={t('landing.nav.features')}
                        description={t('landing.mobileMenu.featuresDesc')}
                        onClick={() => setMenuOpen(false)}
                      />
                      <MobileNavLink
                        href="#how"
                        icon={Zap}
                        label={t('landing.nav.how')}
                        description={t('landing.mobileMenu.howDesc')}
                        onClick={() => setMenuOpen(false)}
                      />
                      <MobileNavLink
                        href="#pricing"
                        icon={TrendingUp}
                        label={t('landing.nav.pricing')}
                        description={t('landing.mobileMenu.pricingDesc')}
                        onClick={() => setMenuOpen(false)}
                      />
                      <MobileNavLink
                        href="#faq"
                        icon={HelpCircle}
                        label={t('landing.nav.faq')}
                        description={t('landing.mobileMenu.faqDesc')}
                        onClick={() => setMenuOpen(false)}
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="pt-4 mt-4 border-t border-border/50 space-y-2">
                      <Button
                        variant="outline"
                        className="w-full gap-2 h-11"
                        onClick={() => { onLogin(); setMenuOpen(false) }}
                      >
                        <LogIn className="w-4 h-4" />
                        {t('landing.nav.login')}
                      </Button>
                      <Button
                        className="w-full gap-2 h-11 bg-primary hover:bg-primary/90 text-primary-foreground glow-primary-sm"
                        onClick={() => { onGetStarted(); setMenuOpen(false) }}
                      >
                        <Sparkles className="w-4 h-4" />
                        {t('landing.mobileMenu.createAccount')}
                      </Button>
                    </div>

                    {/* Language + Theme toggles in menu */}
                    <div className="pt-4 mt-4 border-t border-border/50 space-y-2">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          className="flex-1 gap-2 h-10"
                          onClick={() => setDark(!dark)}
                        >
                          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                          {dark ? t('landing.mobileMenu.lightMode') : t('landing.mobileMenu.darkMode')}
                        </Button>
                        <Button
                          variant="ghost"
                          className="flex-1 gap-2 h-10"
                          onClick={() => {
                            // Toggle language directly
                            const newLang = (localStorage.getItem('eg-money-lang') || 'ar') === 'ar' ? 'en' : 'ar'
                            localStorage.setItem('eg-money-lang', newLang)
                            const html = document.documentElement
                            html.lang = newLang
                            html.dir = newLang === 'ar' ? 'rtl' : 'ltr'
                            import('sonner').then(({ toast }) => {
                              toast.info(newLang === 'en' ? t('language.comingSoon') : t('language.switched'))
                            })
                          }}
                        >
                          <Languages className="w-4 h-4" />
                          {t('landing.mobileMenu.langToggle')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Connection status banner (shows when disconnected) */}
      <ConnectionBanner />

      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden bg-aurora min-h-[90vh] sm:min-h-0">
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />

        {/* Glow orbs */}
        <div className="absolute top-0 right-1/4 w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-primary/20 blur-[100px] sm:blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-60 h-60 sm:w-80 sm:h-80 rounded-full bg-cyan-500/15 blur-[90px] sm:blur-[100px] pointer-events-none" />

        <div className="container-fluid relative z-10 py-10 sm:py-16 lg:py-24">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left content */}
            <div className="lg:col-span-7 text-center lg:text-right">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border-primary/20 text-[10px] sm:text-xs mb-5 sm:mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-muted-foreground">{t('landing.hero.badge')}</span>
                <span className="text-primary font-medium">· {t('landing.hero.badgeSuffix')}</span>
              </div>

              <h1 className="text-fluid-hero font-display font-bold mb-4 sm:mb-5 tracking-tight text-balance">
                {t('landing.hero.title1')} <span className="text-aurora">USDT</span>
                <br />
                {t('landing.hero.title2')}
                <br />
                <span className="text-fluid-h3 text-muted-foreground font-medium block mt-2">
                  {t('landing.hero.subtitle')}
                </span>
              </h1>

              <p className="text-fluid-body text-muted-foreground mb-6 sm:mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0 lg:ml-auto text-pretty">
                {t('landing.hero.description')}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-8 sm:mb-10 max-w-md sm:max-w-none mx-auto lg:mx-0 lg:ml-auto">
                <Button
                  size="lg"
                  onClick={onGetStarted}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 h-11 sm:h-12 px-6 sm:px-7 glow-primary-sm hover-lift w-full sm:w-auto"
                >
                  <Sparkles className="w-4 h-4" />
                  {t('landing.hero.ctaPrimary')}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={onLogin}
                  className="gap-2 h-11 sm:h-12 px-6 sm:px-7 border-border hover:bg-muted/50 w-full sm:w-auto"
                >
                  {t('landing.hero.ctaSecondary')}
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-4 sm:gap-x-6 gap-y-2 text-[10px] sm:text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span>{t('landing.hero.trust1')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span>{t('landing.hero.trust2')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span>{t('landing.hero.trust3')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span>{t('landing.hero.trust4')}</span>
                </div>
              </div>
            </div>

            {/* Right - Live price ticker card with 3D coin */}
            <div className="lg:col-span-5">
              <div className="relative flex flex-col items-center gap-4 max-w-md mx-auto lg:max-w-none">
                {/* 3D Coin on top */}
                <div className="hidden lg:block mb-2">
                  <Coin3D size={120} />
                </div>

                <div className="relative w-full">
                  {/* Floating glow */}
                  <div className="absolute -inset-2 bg-gradient-to-br from-primary/20 via-cyan-500/10 to-primary/10 rounded-3xl blur-2xl" />

                  <LiveTicker fallback={{
                    buyPriceEgp: buyPrice,
                    sellPriceEgp: sellPrice,
                    p2pFeePercent: settings?.p2pFeePercent || 0.3,
                    platformFeePercent: settings?.platformFeePercent || 1.5,
                  }} />

                  {/* Floating chips — hide on mobile to avoid overlap */}
                  <div className="absolute -top-3 -right-3 glass rounded-lg px-2.5 py-1.5 text-[10px] flex items-center gap-1.5 animate-float hide-on-mobile">
                    <Zap className="w-3 h-3 text-primary" />
                    <span className="font-medium">{t('landing.hero.instantExecution')}</span>
                  </div>
                  <div className="absolute -bottom-3 -left-3 glass rounded-lg px-2.5 py-1.5 text-[10px] flex items-center gap-1.5 animate-float hide-on-mobile" style={{ animationDelay: '1s' }}>
                    <Shield className="w-3 h-3 text-success" />
                    <span className="font-medium">{t('landing.hero.escrowProtected')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Live Ticker Bar ===== */}
      <TickerBar />

      {/* ===== Trust & Partners ===== */}
      <TrustPartners />

      {/* ===== Bento Features Grid ===== */}
      <section id="features" className="py-16 lg:py-28 relative">
        <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <Badge variant="outline" className="mb-4 bg-primary/5 border-primary/20 text-primary">
              <Sparkles className="w-3 h-3 ml-1" />
              {t('landing.features.badge')}
            </Badge>
            <h2 className="font-display text-3xl lg:text-5xl font-bold mb-4 tracking-tight">
              {t('landing.features.title1')}
              <br />
              <span className="text-gradient-primary">{t('landing.features.title2')}</span>
            </h2>
            <p className="text-muted-foreground text-base lg:text-lg">
              {t('landing.features.description')}
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 auto-rows-auto">
            {/* Large feature - P2P */}
            <Card className="col-span-2 lg:col-span-2 lg:row-span-2 glass border-border/50 hover-lift group">
              <CardContent className="p-5 sm:p-7 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Users className="w-5 h-5" />
                    </div>
                    <Badge variant="outline" className="border-primary/30 text-primary text-[10px]">0.3% {t('landing.features.only')}</Badge>
                  </div>
                  <h3 className="font-display text-xl sm:text-2xl font-bold mb-2">{t('landing.features.p2pTitle')}</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                    {t('landing.features.p2pDesc')}
                  </p>
                </div>
                <div className="flex items-center gap-4 sm:gap-6 mt-4 pt-4 border-t border-border/50">
                  <div className="min-w-0">
                    <div className="font-num text-base sm:text-xl font-bold text-primary">0.3%</div>
                    <div className="text-[9px] sm:text-[10px] text-muted-foreground uppercase truncate">{t('landing.features.p2pFee')}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="font-num text-base sm:text-xl font-bold">&lt;5min</div>
                    <div className="text-[9px] sm:text-[10px] text-muted-foreground uppercase truncate">{t('landing.features.p2pTime')}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="font-num text-base sm:text-xl font-bold">100%</div>
                    <div className="text-[9px] sm:text-[10px] text-muted-foreground uppercase truncate">{t('landing.features.p2pEscrow')}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Small - Instant trade */}
            <Card className="glass border-border/50 hover-lift group">
              <CardContent className="p-4 sm:p-5 h-full flex flex-col justify-between min-h-[140px]">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="mt-2">
                  <h3 className="font-bold text-sm sm:text-base mb-1">{t('landing.features.instantTitle')}</h3>
                  <p className="text-[11px] sm:text-xs text-muted-foreground leading-snug">{t('landing.features.instantDesc')}</p>
                </div>
              </CardContent>
            </Card>

            {/* Small - Security */}
            <Card className="glass border-border/50 hover-lift group">
              <CardContent className="p-4 sm:p-5 h-full flex flex-col justify-between min-h-[140px]">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-success/15 text-success flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="mt-2">
                  <h3 className="font-bold text-sm sm:text-base mb-1">{t('landing.features.securityTitle')}</h3>
                  <p className="text-[11px] sm:text-xs text-muted-foreground leading-snug">{t('landing.features.securityDesc')}</p>
                </div>
              </CardContent>
            </Card>

            {/* Wide - Payment methods */}
            <Card className="col-span-2 glass border-border/50 hover-lift group">
              <CardContent className="p-4 sm:p-5 h-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center flex-shrink-0">
                      <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <h3 className="font-bold text-sm sm:text-base">
                      {lang === 'ar' ? 'طرق الدفع المصرية المتاحة في سوق P2P' : 'Egyptian Payment Methods Available in P2P Market'}
                    </h3>
                  </div>
                  <p className="text-[11px] sm:text-xs text-muted-foreground">
                    {lang === 'ar' ? 'جميع طرق الدفع المتاحة في السوق المصري' : 'All payment methods available in the Egyptian market'}
                  </p>
                </div>
                {/* Payment methods - from database (admin-managed) */}
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 sm:gap-2 sm:flex-shrink-0">
                  {paymentMethods.map((m) => (
                    <div key={m.id} className="flex flex-col items-center gap-1" title={lang === 'ar' ? m.nameAr : m.name}>
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg overflow-hidden flex items-center justify-center bg-background/50 border border-border/30">
                        {m.logoUrl ? (
                          <img src={m.logoUrl} alt={m.name} className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-base sm:text-lg">{m.icon}</span>
                        )}
                      </div>
                      <span className="text-[7px] sm:text-[8px] text-muted-foreground truncate max-w-[40px]">{lang === 'ar' ? m.nameAr : m.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tall - Tech stack */}
            <Card className="col-span-2 lg:col-span-1 lg:row-span-2 glass border-border/50 hover-lift group">
              <CardContent className="p-4 sm:p-5 h-full flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center mb-2 sm:mb-3">
                    <Cpu className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <h3 className="font-bold text-sm sm:text-base mb-1.5 sm:mb-2">{t('landing.features.techTitle')}</h3>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mb-3 sm:mb-4 leading-snug">
                    {t('landing.features.techDesc')}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                  <TechBadge icon={Database} label="Prisma" />
                  <TechBadge icon={Layers} label="TypeScript" />
                  <TechBadge icon={Boxes} label="Atomic TX" />
                  <TechBadge icon={Globe} label="Edge Ready" />
                </div>
              </CardContent>
            </Card>

            {/* Stats card */}
            <Card className="glass border-border/50 hover-lift">
              <CardContent className="p-4 sm:p-5 h-full flex flex-col justify-center items-center text-center min-h-[120px]">
                <div className="font-num text-2xl sm:text-3xl font-bold text-gradient-primary mb-1">
                  <Counter end={99.7} decimals={1} suffix="%" />
                </div>
                <div className="text-[11px] sm:text-xs text-muted-foreground">{t('landing.features.successRate')}</div>
              </CardContent>
            </Card>

            {/* Stats card */}
            <Card className="glass border-border/50 hover-lift">
              <CardContent className="p-4 sm:p-5 h-full flex flex-col justify-center items-center text-center min-h-[120px]">
                <div className="font-num text-2xl sm:text-3xl font-bold text-gradient-primary mb-1">
                  &lt;<Counter end={5} />min
                </div>
                <div className="text-[11px] sm:text-xs text-muted-foreground">{t('landing.features.avgTime')}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ===== How it works ===== */}
      <section id="how" className="py-16 lg:py-28 bg-card/30 border-y border-border/50 relative">
        <div className="absolute inset-0 bg-dots opacity-30 pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="outline" className="mb-4 bg-primary/5 border-primary/20 text-primary">
              <Activity className="w-3 h-3 ml-1" />
              {t('landing.how.badge')}
            </Badge>
            <h2 className="font-display text-3xl lg:text-5xl font-bold mb-4 tracking-tight">
              {t('landing.how.title1')} <span className="text-gradient-primary">{t('landing.how.title2')}</span>
            </h2>
            <p className="text-muted-foreground text-base lg:text-lg">
              {t('landing.how.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <StepCard
              number="01"
              title={t('landing.how.step1Title')}
              description={t('landing.how.step1Desc')}
              icon={Users}
            />
            <StepCard
              number="02"
              title={t('landing.how.step2Title')}
              description={t('landing.how.step2Desc')}
              icon={ArrowDownToLine}
            />
            <StepCard
              number="03"
              title={t('landing.how.step3Title')}
              description={t('landing.how.step3Desc')}
              icon={ArrowRightLeft}
            />
          </div>
        </div>
      </section>

      {/* ===== Comparison vs Competitors ===== */}
      <section className="py-16 lg:py-24 bg-card/30 border-y border-border/50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="outline" className="mb-4 bg-primary/5 border-primary/20 text-primary">
              <Trophy className="w-3 h-3 ml-1" />
              {t('landing.comparison.badge')}
            </Badge>
            <h2 className="font-display text-3xl lg:text-5xl font-bold mb-4 tracking-tight">
              {t('landing.comparison.title1')} <span className="text-gradient-primary">{t('landing.comparison.title2')}</span>
            </h2>
            <p className="text-muted-foreground text-base lg:text-lg">
              {t('landing.comparison.subtitle')}
            </p>
          </div>

          <Card className="glass border-border/50 overflow-hidden max-w-5xl mx-auto">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-right p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">{t('landing.comparison.criteria')}</th>
                    <th className="p-4 text-center bg-primary/5 border-x border-primary/20">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-primary font-bold text-base">Eg-Money</span>
                        <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">{t('landing.comparison.best')}</Badge>
                      </div>
                    </th>
                    <th className="p-4 text-center text-muted-foreground">Western Union</th>
                    <th className="p-4 text-center text-muted-foreground">{t('landing.comparison.banks')}</th>
                    <th className="p-4 text-center text-muted-foreground">{t('landing.comparison.foreign')}</th>
                  </tr>
                </thead>
                <tbody>
                  <CompareRow label={t('landing.comparison.fees')} misr="0.3% - 1.5%" others={['5-12%', '1-3% + fixed fees', '0.5-2%']} highlight />
                  <CompareRow label={t('landing.comparison.execTime')} misr="< 5 min" others={['1-3 business days', '2-5 business days', '10-60 min']} highlight />
                  <CompareRow label={t('landing.comparison.localDeposit')} misr="✓ Vodafone/InstaPay" others={['✗ International only', '✗ SWIFT only', '✗ International card']} />
                  <CompareRow label={t('landing.comparison.localWithdraw')} misr="✓ 4 instant methods" others={['✗ Cash pickup', '✗ Branch only', '✗ N/A']} />
                  <CompareRow label={t('landing.comparison.fairRate')} misr="✓ Market price" others={['✗ 3-7% discount', '✗ Central bank rate', '✕ High spread']} />
                  <CompareRow label={t('landing.comparison.minAmount')} misr="100 EGP" others={['50 USD+', '500 USD+', '10-50 USD']} />
                  <CompareRow label={t('landing.comparison.arabicSupport')} misr="✓ 24/7" others={['✗ English', '✓ Business hours', '✗ English']} highlight />
                  <CompareRow label={t('landing.comparison.transparency')} misr="✓ All fees visible" others={['✗ Hidden commissions', '✗ Broker fees', '✗ Hidden spread']} highlight />
                </tbody>
              </table>
            </div>
          </Card>

          <div className="text-center mt-6">
            <p className="text-xs text-muted-foreground">
              {t('landing.comparison.disclaimer')}
            </p>
          </div>
        </div>
      </section>

      {/* ===== Security Deep-Dive ===== */}
      <section className="py-16 lg:py-28 relative">
        <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="outline" className="mb-4 bg-primary/5 border-primary/20 text-primary">
              <Shield className="w-3 h-3 ml-1" />
              {t('landing.security.badge')}
            </Badge>
            <h2 className="font-display text-3xl lg:text-5xl font-bold mb-4 tracking-tight">
              {t('landing.security.title1')} <span className="text-gradient-primary">{t('landing.security.title2')}</span>
            </h2>
            <p className="text-muted-foreground text-base lg:text-lg">
              {t('landing.security.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            <SecurityCard
              icon={Fingerprint}
              title={t('landing.security.pbkdf2Title')}
              stat="10,000"
              statLabel={t('landing.security.pbkdf2Stat')}
              description={t('landing.security.pbkdf2Desc')}
            />
            <SecurityCard
              icon={Lock}
              title={t('landing.security.escrowTitle')}
              stat="100%"
              statLabel={t('landing.security.escrowStat')}
              description={t('landing.security.escrowDesc')}
            />
            <SecurityCard
              icon={Gauge}
              title={t('landing.security.atomicTitle')}
              stat="0"
              statLabel={t('landing.security.atomicStat')}
              description={t('landing.security.atomicDesc')}
            />
            <SecurityCard
              icon={Eye}
              title={t('landing.security.reviewTitle')}
              stat="24/7"
              statLabel={t('landing.security.reviewStat')}
              description={t('landing.security.reviewDesc')}
            />
            <SecurityCard
              icon={Database}
              title={t('landing.security.auditTitle')}
              stat="100%"
              statLabel={t('landing.security.auditStat')}
              description={t('landing.security.auditDesc')}
            />
            <SecurityCard
              icon={ServerOff}
              title={t('landing.security.ddosTitle')}
              stat="99.9%"
              statLabel={t('landing.security.ddosStat')}
              description={t('landing.security.ddosDesc')}
            />
            <SecurityCard
              icon={Building2}
              title={t('landing.security.segregatedTitle')}
              stat="segre"
              statLabel="gated accounts"
              description={t('landing.security.segregatedDesc')}
            />
            <SecurityCard
              icon={Radio}
              title={t('landing.security.alertsTitle')}
              stat="instant"
              statLabel={t('landing.security.alertsStat')}
              description={t('landing.security.alertsDesc')}
            />
          </div>
        </div>
      </section>

      {/* ===== Live Activity + Stats ===== */}
      <section className="py-16 lg:py-24 bg-card/30 border-y border-border/50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Live Activity Feed */}
            <div>
              <div className="mb-6">
                <Badge variant="outline" className="mb-3 bg-success/5 border-success/30 text-success">
                  <Radio className="w-3 h-3 ml-1 animate-pulse" />
                  {t('landing.activity.badgeLive')}
                </Badge>
                <h2 className="font-display text-3xl lg:text-4xl font-bold mb-2 tracking-tight">
                  {t('landing.activity.title1')} <span className="text-gradient-primary">{t('landing.activity.title2')}</span>
                </h2>
                <p className="text-muted-foreground text-sm">
                  {t('landing.activity.subtitle')}
                </p>
              </div>
              <LiveActivityFeed />
            </div>

            {/* Live Stats */}
            <div className="space-y-4">
              <div className="mb-6">
                <Badge variant="outline" className="mb-3 bg-primary/5 border-primary/20 text-primary">
                  <BarChart3 className="w-3 h-3 ml-1" />
                  {t('landing.stats.badge')}
                </Badge>
                <h2 className="font-display text-3xl lg:text-4xl font-bold mb-2 tracking-tight">
                  {t('landing.stats.title1')} <span className="text-gradient-primary">{t('landing.stats.title2')}</span>
                </h2>
                <p className="text-muted-foreground text-sm">
                  {t('landing.stats.subtitle')}
                </p>
              </div>

              <LiveStatsGrid />

              <Card className="glass border-border/50">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Gift className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-sm">{t('landing.stats.joinUsers')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                    {t('landing.stats.joinDesc')}
                  </p>
                  <Button
                    className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={onGetStarted}
                  >
                    <Sparkles className="w-4 h-4" />
                    {t('landing.stats.createNow')}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Resources / Education ===== */}
      <section className="py-16 lg:py-24 relative">
        <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="outline" className="mb-4 bg-primary/5 border-primary/20 text-primary">
              <GraduationCap className="w-3 h-3 ml-1" />
              {t('landing.resources.badge')}
            </Badge>
            <h2 className="font-display text-3xl lg:text-5xl font-bold mb-4 tracking-tight">
              {t('landing.resources.title1')} <span className="text-gradient-primary">{t('landing.resources.title2')}</span>
            </h2>
            <p className="text-muted-foreground text-base lg:text-lg">
              {t('landing.resources.subtitle')}
            </p>
          </div>

          {/* Featured articles from edu-content */}
          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {(() => {
              const featured = EDU_ARTICLES.slice(0, 3)
              return featured.map((article) => {
                const isAr = lang === 'ar'
                const lvlCfg = LEVEL_CONFIG[article.level]
                return (
                  <a
                    key={article.slug}
                    href={`/learn/${article.slug}`}
                    className="group block"
                  >
                    <div className="h-full rounded-xl border border-border/50 bg-card/30 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 hover:translate-y-[-2px] p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">
                          {article.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className={`text-[9px] h-4 px-1.5 ${lvlCfg.color}`}>
                              {isAr ? lvlCfg.ar : lvlCfg.en}
                            </Badge>
                            <Badge variant="outline" className="text-[9px] h-4 px-1.5">
                              {isAr ? EDU_CATEGORY_LABELS[article.category].ar : EDU_CATEGORY_LABELS[article.category].en}
                            </Badge>
                          </div>
                          <h3 className="font-bold text-sm leading-snug group-hover:text-primary transition-colors">
                            {isAr ? article.title.ar : article.title.en}
                          </h3>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">
                        {isAr ? article.excerpt.ar : article.excerpt.en}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span className="font-num">{article.readTime}</span>
                          {isAr ? 'دقائق' : 'min'}
                        </span>
                        <span className="text-primary flex items-center gap-1">
                          {isAr ? 'اقرأ' : 'Read'}
                          <ArrowLeft className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </a>
                )
              })
            })()}
          </div>

          <div className="text-center mt-8">
            <a href="/learn">
              <Button variant="outline" size="lg" className="gap-2 border-border hover:bg-muted/50">
                <BookOpen className="w-4 h-4" />
                {t('landing.resources.viewAll')}
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ===== Mobile App Teaser ===== */}
      <section className="py-16 lg:py-24 bg-card/30 border-y border-border/50 relative overflow-hidden">
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-96 h-96 rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <div>
              <Badge variant="outline" className="mb-4 bg-primary/5 border-primary/20 text-primary">
                <Smartphone className="w-3 h-3 ml-1" />
                {t('landing.mobileApp.badge')}
              </Badge>
              <h2 className="font-display text-3xl lg:text-5xl font-bold mb-4 tracking-tight">
                {t('landing.mobileApp.title1')} <span className="text-gradient-primary">{t('landing.mobileApp.title2')}</span>
                <br />
                {t('landing.mobileApp.title3')}
              </h2>
              <p className="text-muted-foreground text-base lg:text-lg mb-8 leading-relaxed">
                {t('landing.mobileApp.description')}
                
              </p>

              <div className="space-y-3 mb-8">
                <AppFeature icon={Zap} text={t('landing.mobileApp.feat1')} />
                <AppFeature icon={Fingerprint} text={t('landing.mobileApp.feat2')} />
                <AppFeature icon={Radio} text={t('landing.mobileApp.feat3')} />
                <AppFeature icon={BarChart3} text={t('landing.mobileApp.feat4')} />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" size="lg" className="gap-2 border-border hover:bg-muted/50 h-12 px-6">
                  <Smartphone className="w-4 h-4" />
                  App Store
                </Button>
                <Button variant="outline" size="lg" className="gap-2 border-border hover:bg-muted/50 h-12 px-6">
                  <Smartphone className="w-4 h-4" />
                  Google Play
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">{t('landing.mobileApp.registerInterest')}</p>
            </div>

            {/* Phone mockup */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-64 h-[520px] rounded-[3rem] glass-strong border-2 border-border/60 p-3 relative">
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-background rounded-b-2xl z-10" />
                  <div className="w-full h-full rounded-[2.3rem] bg-background overflow-hidden p-4 flex flex-col gap-3">
                    {/* Mock app content */}
                    <div className="flex items-center justify-between mt-4">
                      <div>
                        <div className="text-[10px] text-muted-foreground">{lang === 'ar' ? 'أهلاً،' : 'Welcome,'}</div>
                        <div className="font-bold text-sm">{lang === 'ar' ? 'محمد أحمد' : 'Mohamed Ahmed'}</div>
                      </div>
                      <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center">
                        <span className="text-primary font-bold text-sm">{lang === 'ar' ? 'م' : 'M'}</span>
                      </div>
                    </div>

                    <div className="glass rounded-xl p-3">
                      <div className="text-[9px] text-muted-foreground mb-1">{lang === 'ar' ? 'رصيدك' : 'Balance'}</div>
                      <div className="font-num text-xl font-bold text-primary">1,247.50 USDT</div>
                      <div className="text-[9px] text-muted-foreground font-num">≈ 60,494 EGP</div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="glass rounded-lg p-2.5 text-center">
                        <ArrowDownToLine className="w-4 h-4 text-success mx-auto mb-1" />
                        <div className="text-[10px] font-medium">{lang === 'ar' ? 'شراء' : 'Buy'}</div>
                      </div>
                      <div className="glass rounded-lg p-2.5 text-center">
                        <ArrowUpFromLine className="w-4 h-4 text-rose-400 mx-auto mb-1" />
                        <div className="text-[10px] font-medium">{lang === 'ar' ? 'بيع' : 'Sell'}</div>
                      </div>
                    </div>

                    <div className="glass rounded-xl p-3 flex-1">
                      <div className="text-[10px] font-medium mb-2">{lang === 'ar' ? 'آخر المعاملات' : 'Recent'}</div>
                      <div className="space-y-2">
                        {[
                          { type: 'Buy', amount: '+50.00', color: 'text-success' },
                          { type: 'P2P', amount: '+120.00', color: 'text-blue-400' },
                          { type: 'Deposit', amount: '+5,000 EGP', color: 'text-primary' },
                        ].map((t, i) => (
                          <div key={i} className="flex justify-between items-center text-[10px]">
                            <span className="text-muted-foreground">{t.type}</span>
                            <span className={`font-num font-medium ${t.color}`}>{t.amount}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Glow */}
                <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 via-transparent to-primary/10 rounded-[4rem] blur-2xl -z-10" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Pricing ===== */}
      <section id="pricing" className="py-16 lg:py-28 relative">
        <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="outline" className="mb-4 bg-primary/5 border-primary/20 text-primary">
              <TrendingUp className="w-3 h-3 ml-1" />
              {t('landing.pricing.badge')}
            </Badge>
            <h2 className="font-display text-3xl lg:text-5xl font-bold mb-4 tracking-tight">
              {t('landing.pricing.badge')}
            </h2>
            <p className="text-muted-foreground text-base lg:text-lg">
              {t('landing.pricing.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            <PricingCard
              title={t('landing.pricing.directTitle')}
              price={`${settings?.platformFeePercent || 1.5}%`}
              unit={t('landing.pricing.perTrade')}
              description={t('landing.pricing.directDesc')}
              features={[
                t('landing.pricing.features.instantExec'),
                t('landing.pricing.features.spreadIncluded'),
                `${settings?.platformFeePercent || 1.5}% ${t('landing.pricing.features.feeOnAmount')}`,
                t('landing.pricing.features.minExcept'),
                t('landing.pricing.features.support247'),
              ]}
              highlight={false}
              onCta={onGetStarted}
              startNowText={t('landing.pricing.startNow')}
              popularText={t('landing.pricing.popular')}
            />
            <PricingCard
              title={t('landing.pricing.p2pTitle')}
              price={`${settings?.p2pFeePercent || 0.3}%`}
              unit={t('landing.pricing.perTrade')}
              description={t('landing.pricing.p2pDesc')}
              features={[
                t('landing.pricing.features.youSetPrice'),
                `${settings?.p2pFeePercent || 0.3}% ${t('landing.pricing.features.feeSplit')}`,
                t('landing.pricing.features.escrowAuto'),
                t('landing.pricing.features.multiPayment'),
                t('landing.pricing.features.autoNoAdmin'),
              ]}
              highlight={true}
              onCta={onGetStarted}
              startNowText={t('landing.pricing.startNow')}
              popularText={t('landing.pricing.popular')}
            />
            <PricingCard
              title={t('landing.pricing.walletTitle')}
              price="0%"
              unit={t('landing.pricing.depositFee')}
              description={t('landing.pricing.walletDesc')}
              features={[
                t('landing.pricing.features.depositFree'),
                t('landing.pricing.features.withdrawFree'),
                t('landing.pricing.features.egyptMethods'),
                t('landing.pricing.features.humanReview'),
                t('landing.pricing.features.within24h'),
              ]}
              highlight={false}
              onCta={onGetStarted}
              startNowText={t('landing.pricing.startNow')}
              popularText={t('landing.pricing.popular')}
            />
          </div>
        </div>
      </section>

      {/* ===== Testimonials ===== */}
      <section className="py-16 lg:py-24 bg-card/30 border-y border-border/50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="outline" className="mb-4 bg-primary/5 border-primary/20 text-primary">
              <Quote className="w-3 h-3 ml-1" />
              {t('landing.testimonials.badge')}
            </Badge>
            <h2 className="font-display text-3xl lg:text-5xl font-bold tracking-tight">
              {t('landing.testimonials.title1')} <span className="text-gradient-primary">{t('landing.testimonials.title2')}</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            <TestimonialCard
              name="Ahmed M."
              role={t('landing.testimonials.t1Author')}
              content={t('landing.testimonials.t1')}
              rating={5}
            />
            <TestimonialCard
              name="Mona S."
              role={t('landing.testimonials.t2Author')}
              content={t('landing.testimonials.t2')}
              rating={5}
            />
            <TestimonialCard
              name="Khaled O."
              role={t('landing.testimonials.t3Author')}
              content={t('landing.testimonials.t3')}
              rating={5}
            />
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className="py-16 lg:py-24 relative">
        <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
        <div className="container mx-auto px-4 max-w-3xl relative z-10">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 bg-primary/5 border-primary/20 text-primary">
              <Sparkles className="w-3 h-3 ml-1" />
              {t('landing.faq.badge')}
            </Badge>
            <h2 className="font-display text-3xl lg:text-5xl font-bold tracking-tight">
              {t('landing.faq.title1')} <span className="text-gradient-primary">{t('landing.faq.title2')}</span>
            </h2>
          </div>

          <div className="space-y-3">
            <FaqItem
              q={t('landing.faq.q1')}
              a={t('landing.faq.a1')}
            />
            <FaqItem
              q={t('landing.faq.q2')}
              a={t('landing.faq.a2')}
            />
            <FaqItem
              q={t('landing.faq.q3')}
              a={t('landing.faq.a3')}
            />
            <FaqItem
              q={t('landing.faq.q4')}
              a={t('landing.faq.a4')}
            />
            <FaqItem
              q={t('landing.faq.q5')}
              a={t('landing.faq.a5')}
            />
            <FaqItem
              q={t('landing.faq.q6')}
              a={t('landing.faq.a6')}
            />
          </div>
        </div>
      </section>

      {/* ===== Final CTA ===== */}
      <section className="py-16 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh" />
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/15 blur-[120px] pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border-primary/20 text-xs mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-muted-foreground">{t('landing.cta.ready')}</span>
          </div>

          <h2 className="font-display text-4xl lg:text-6xl font-bold mb-5 tracking-tight">
            {t('landing.cta.title1')}
            <br />
            <span className="text-gradient-primary">{t('landing.cta.title2')}</span>
          </h2>

          <p className="text-base lg:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            {t('landing.cta.description')}
            
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              onClick={onGetStarted}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 h-12 px-8 glow-primary"
            >
              <Sparkles className="w-4 h-4" />
              {t('landing.cta.createAccount')}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={onLogin}
              className="h-12 px-8 border-border hover:bg-muted/50"
            >
              {t('landing.cta.haveAccount')}
            </Button>
          </div>
        </div>
      </section>

      {/* ===== Newsletter ===== */}
      <Newsletter />

      {/* ===== Cookie Consent (fixed position) ===== */}
      <CookieConsent />

      {/* ===== Footer ===== */}
      <footer className="border-t border-border/50 bg-card/30 mt-auto">
        <div className="container-fluid py-10 sm:py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <BrandLogo size="lg" variant="banner" className="mb-4" />
              <p className="text-xs sm:text-sm text-muted-foreground mb-4 leading-relaxed">
                {t('landing.footer.description')}
              </p>
              {/* Social links */}
              <div className="flex gap-2">
                {[
                  { label: 'X', icon: '𝕏' },
                  { label: 'Telegram', icon: '✈' },
                  { label: 'WhatsApp', icon: '💬' },
                  { label: 'Instagram', icon: '📷' },
                ].map((s) => (
                  <a
                    key={s.label}
                    href="#"
                    aria-label={s.label}
                    className="w-8 h-8 rounded-lg glass border-border/50 flex items-center justify-center text-xs hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">{t('landing.footer.product')}</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-primary transition-colors">{t('landing.nav.features')}</a></li>
                <li><a href="#how" className="hover:text-primary transition-colors">{t('landing.nav.how')}</a></li>
                <li><a href="#pricing" className="hover:text-primary transition-colors">{t('landing.nav.pricing')}</a></li>
                <li><a href="#faq" className="hover:text-primary transition-colors">{t('landing.nav.faq')}</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">{t('landing.footer.support')}</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> <span className="font-num">01000000000</span></li>
                <li className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> support@misrusdt.com</li>
                <li className="flex items-center gap-2"><MessageCircle className="w-3.5 h-3.5" /> {t('landing.footer.support')} · WhatsApp</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">{t('landing.footer.legal')}</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">{t('landing.footer.terms')}</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">{t('landing.footer.privacy')}</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">{t('landing.footer.aml')}</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">{t('landing.footer.disclaimer')}</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border/50 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>© <span className="font-num">2026</span> Eg-Money — {t('landing.footer.rights')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-success" />
              <span>{t('landing.footer.protected')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <span>{t('landing.footer.livePrices')}</span>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-warning/5 border border-warning/20 text-xs text-warning/90 leading-relaxed">
            <strong>{t('landing.footer.disclaimer')}:</strong> {t('landing.footer.disclaimerText')}
            
          </div>
        </div>
      </footer>
    </div>
  )
}

// ===== Sub-components =====

function MobileNavLink({
  href, icon: Icon, label, description, onClick,
}: {
  href: string; icon: any; label: string; description: string; onClick: () => void
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
    >
      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm">{label}</div>
        <div className="text-xs text-muted-foreground truncate">{description}</div>
      </div>
      <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:-translate-x-1 transition-all flex-shrink-0" />
    </a>
  )
}

function TechBadge({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground bg-muted/30 rounded-md px-2 py-1.5 min-w-0">
      <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary flex-shrink-0" />
      <span className="truncate">{label}</span>
    </div>
  )
}

function CompareRow({ label, misr, others, highlight }: {
  label: string; misr: string; others: string[]; highlight?: boolean
}) {
  return (
    <tr className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors">
      <td className="p-4 text-muted-foreground font-medium">{label}</td>
      <td className={`p-4 text-center font-medium ${highlight ? 'text-primary bg-primary/5' : ''}`}>
        {misr}
      </td>
      {others.map((o, i) => (
        <td key={i} className="p-4 text-center text-muted-foreground text-xs">{o}</td>
      ))}
    </tr>
  )
}

function SecurityCard({ icon: Icon, title, stat, statLabel, description }: {
  icon: any; title: string; stat: string; statLabel: string; description: string
}) {
  return (
    <Card className="glass border-border/50 hover-lift group">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <Icon className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="font-num text-lg font-bold text-primary">{stat}</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">{statLabel}</div>
          </div>
        </div>
        <h3 className="font-bold text-sm mb-1.5">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  )
}

function StatTile({ icon: Icon, label, value, trend, color }: {
  icon: any; label: string; value: React.ReactNode; trend: string; color: string
}) {
  const colorMap: Record<string, string> = {
    primary: 'text-primary bg-primary/10',
    success: 'text-success bg-success/10',
    blue: 'text-blue-400 bg-blue-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
  }
  const trendUp = trend.startsWith('+') || trend.startsWith('−')
  return (
    <Card className="glass border-border/50 hover-lift">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className={`w-8 h-8 rounded-lg ${colorMap[color]} flex items-center justify-center`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className={`text-[10px] font-num font-medium ${trend.startsWith('−') ? 'text-success' : 'text-success'}`}>
            {trend}
          </span>
        </div>
        <div className="font-num text-2xl font-bold">{value}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
      </CardContent>
    </Card>
  )
}

function ResourceCard({ icon: Icon, category, title, description, readTime }: {
  icon: any; category: string; title: string; description: string; readTime: string
}) {
  return (
    <Card className="glass border-border/50 hover-lift group cursor-pointer">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <Icon className="w-5 h-5" />
          </div>
          <Badge variant="outline" className="text-[10px]">{category}</Badge>
        </div>
        <h3 className="font-bold text-base mb-2 leading-snug">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed mb-4">{description}</p>
        <div className="flex items-center justify-between pt-3 border-t border-border/30">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {readTime}
          </span>
          <ArrowLeft className="w-3.5 h-3.5 text-primary group-hover:translate-x-1 transition-transform" />
        </div>
      </CardContent>
    </Card>
  )
}

function AppFeature({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-sm">{text}</span>
    </div>
  )
}

function StepCard({ number, title, description, icon: Icon }: {
  number: string; title: string; description: string; icon: any
}) {
  return (
    <div className="relative glass border border-border/50 rounded-2xl p-6 hover-lift group">
      <div className="absolute top-4 left-4 font-num text-5xl font-bold text-primary/10 group-hover:text-primary/20 transition-colors">
        {number}
      </div>
      <div className="relative z-10">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          <Icon className="w-7 h-7" />
        </div>
        <h3 className="font-bold text-lg mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

function PricingCard({ title, price, unit, description, features, highlight, onCta, startNowText, popularText }: {
  title: string; price: string; unit: string; description: string;
  features: string[]; highlight: boolean; onCta: () => void; startNowText: string; popularText: string
}) {
  return (
    <Card className={`relative ${highlight ? 'glass-strong border-primary/40 glow-primary-sm' : 'glass border-border/50'} hover-lift`}>
      {highlight && (
        <div className="absolute -top-3 right-1/2 translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground gap-1">
            <Star className="w-3 h-3" />
            {popularText}
          </Badge>
        </div>
      )}
      <CardContent className="p-6">
        <h3 className="font-display font-bold text-lg mb-1">{title}</h3>
        <p className="text-xs text-muted-foreground mb-5">{description}</p>
        <div className="mb-5">
          <span className="font-num text-4xl font-bold text-gradient-primary">{price}</span>
          <span className="text-sm text-muted-foreground mr-1.5"> {unit}</span>
        </div>
        <ul className="space-y-2.5 mb-6">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">{f}</span>
            </li>
          ))}
        </ul>
        <Button
          className="w-full gap-2"
          variant={highlight ? 'default' : 'outline'}
          onClick={onCta}
        >
          {startNowText}
          <ArrowLeft className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  )
}

function TestimonialCard({ name, role, content, rating }: {
  name: string; role: string; content: string; rating: number
}) {
  return (
    <Card className="glass border-border/50 hover-lift">
      <CardContent className="p-6">
        <div className="flex gap-0.5 mb-3">
          {Array.from({ length: rating }).map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
          ))}
        </div>
        <Quote className="w-6 h-6 text-primary/30 mb-2" />
        <p className="text-sm mb-5 leading-relaxed">{content}</p>
        <div className="flex items-center gap-3 pt-4 border-t border-border/50">
          <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold">
            {name[0]}
          </div>
          <div>
            <div className="font-semibold text-sm">{name}</div>
            <div className="text-xs text-muted-foreground">{role}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`glass border rounded-xl overflow-hidden transition-all ${open ? 'border-primary/30' : 'border-border/50'}`}>
      <button
        className="w-full p-4 text-right flex items-center justify-between hover:bg-muted/30 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="font-medium text-sm">{q}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border/30 pt-3">
          {a}
        </div>
      )}
    </div>
  )
}
