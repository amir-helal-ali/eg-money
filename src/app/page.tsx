'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/client'
import { AuthScreen } from '@/components/auth-screen'
import { LandingPage } from '@/components/landing-page'
import { DashboardTab } from '@/components/dashboard-tab'
import { TradeTab } from '@/components/trade-tab'
import { P2PTab } from '@/components/p2p-tab'
import { WalletTab } from '@/components/wallet-tab'
import { AdminTab } from '@/components/admin-tab'
import {
  LayoutDashboard, ArrowRightLeft, Users, Wallet, ShieldCheck, LogOut, Coins,
  Moon, Sun, Loader2, ArrowLeft, Bell, HelpCircle, GraduationCap, User,
  Menu,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { fmtEgp, fmtUsdt } from '@/lib/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { OnboardingFlow } from '@/components/onboarding-flow'
import { VerificationModal } from '@/components/verification-modal'
import { BrandLogo } from '@/components/brand-logo'
import { NotificationsBell } from '@/components/notifications-bell'
import { LanguageSwitcher } from '@/components/language-switcher'
import { ConnectionStatus, ConnectionBanner } from '@/components/connection-status'
import { useLanguage } from '@/hooks/use-language'
import { SettingsPanel } from '@/components/settings-panel'

type TabId = 'dashboard' | 'trade' | 'p2p' | 'wallet' | 'admin'
type View = 'landing' | 'auth' | 'app'

export default function Home() {
  const { user, initialized, fetchUser, fetchSettings } = useAuth()
  const [view, setView] = useState<View>('landing')
  const { t } = useLanguage()

  useEffect(() => {
    fetchUser()
    fetchSettings()
    // Auto-route to auth screen if a reset token is in the URL
    try {
      const url = new URL(window.location.href)
      if (url.searchParams.get('reset')) {
        setView('auth')
      }
    } catch {}
  }, [])

  // Once auth state is determined, show appropriate view.
  // A logged-in user is ALWAYS redirected to the app view — they should never
  // see the landing page's "Get Started" CTA or the auth screen.
  useEffect(() => {
    if (!initialized) return
    if (user) {
       
      setView('app')
    } else {
      // Logged-out user: keep them on landing or auth (whichever they were on).
      // If they were on the app view (e.g., session expired), send to landing.
       
      if (view === 'app') setView('landing')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, initialized])

  if (!initialized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <img
          src="/brand/banner.png"
          alt="Eg-Money"
          width={300}
          height={96}
          className="w-56 sm:w-72 h-auto object-contain animate-pulse"
        />
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm font-num">Eg-Money · Loading…</span>
        </div>
      </div>
    )
  }

  // ===== Authenticated user: ALWAYS show the app dashboard =====
  // This guards against a logged-in user somehow landing on landing/auth views
  // (e.g., they opened /?reset=... while already logged in, or session was
  // restored from cookie after the view was set to 'landing').
  if (user) {
    return <AppView />
  }

  // ===== Logged-out user: landing or auth =====
  // Auth screen (login/signup) — only when explicitly requested AND not logged in
  if (view === 'auth') {
    return (
      <div className="min-h-screen">
        <div className="absolute top-4 right-4 z-50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView('landing')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('landing.nav.backHome')}
          </Button>
        </div>
        <AuthScreen />
      </div>
    )
  }

  // Landing page (default for logged-out users)
  return (
    <LandingPage
      onGetStarted={() => setView('auth')}
      onLogin={() => setView('auth')}
    />
  )
}

// ===== App view (extracted for clarity) =====
function AppView() {
  const { user, logout, settings } = useAuth()
  const [tab, setTab] = useState<TabId>('dashboard')
  const [dark, setDark] = useState(true)
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [moreSheetOpen, setMoreSheetOpen] = useState(false)
  const { t } = useLanguage()

  // Check if onboarding should be shown (new user who just signed up)
  useEffect(() => {
    if (!user) return
    try {
      const completed = localStorage.getItem('onboarding_completed')
      const justSignedUp = sessionStorage.getItem('just_signed_up')
      if (!completed && justSignedUp) {
        setOnboardingOpen(true)
        sessionStorage.removeItem('just_signed_up')
      }
    } catch {}
  }, [user])

  useEffect(() => {
    if (dark) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [dark])

  // Listen for switch-tab events from notification clicks
  useEffect(() => {
    const handler = (e: Event) => {
      const tabId = (e as CustomEvent).detail as TabId
      if (tabId) setTab(tabId)
    }
    window.addEventListener('switch-tab', handler)
    return () => window.removeEventListener('switch-tab', handler)
  }, [])

  // Safety: if user somehow becomes null (session expired), the parent
  // component will re-render and show landing. We don't need to handle it here.

  if (!user) return null // type safety; parent handles this case

  const tabs: { id: TabId; label: string; icon: any }[] = [
    { id: 'dashboard', label: t('app.dashboard'), icon: LayoutDashboard },
    { id: 'trade', label: t('app.trade'), icon: ArrowRightLeft },
    { id: 'p2p', label: t('app.p2p'), icon: Users },
    { id: 'wallet', label: t('app.wallet'), icon: Wallet },
  ]
  if (user.role === 'ADMIN') {
    tabs.push({ id: 'admin', label: t('app.admin'), icon: ShieldCheck })
  }

  async function handleLogout() {
    await logout()
    // Parent will re-render and show landing (user becomes null)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container-fluid">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo — official brand mark + name */}
            <div className="sm:hidden">
              <BrandLogo size="sm" />
            </div>
            <div className="hidden sm:block">
              <BrandLogo size="md" />
            </div>

            {/* Balances (visible on md+) */}
            <div className="hidden md:flex items-center gap-2">
              <Badge variant="secondary" className="bg-muted font-mono">
                <span className="opacity-60 ml-1">EGP</span>
                {fmtEgp(user.egpBalance)}
              </Badge>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 font-mono">
                <span className="opacity-60 ml-1">USDT</span>
                {fmtUsdt(user.usdtBalance)}
              </Badge>
            </div>

            {/* User menu */}
            <div className="flex items-center gap-1.5">
              <LanguageSwitcher />
              <ConnectionStatus variant="badge" />
              <NotificationsBell />
              <SettingsPanel />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDark(!dark)}
                className="hidden sm:flex h-9 w-9"
              >
                {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 px-1.5 sm:px-2">
                    <Avatar className="w-8 h-8 ring-2 ring-primary/20">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xs font-bold">
                        {(user.name || user.email)[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block text-right">
                      <div className="text-xs font-medium leading-tight">
                        {user.name || t('app.member')}
                      </div>
                      <div className="text-[10px] text-muted-foreground leading-tight flex items-center gap-1 justify-end">
                        {user.role === 'ADMIN' ? (
                          <>
                            <ShieldCheck className="w-2.5 h-2.5 text-primary" />
                            <span>{t('app.adminRole')}</span>
                          </>
                        ) : (
                          <span>{t('app.member')}</span>
                        )}
                      </div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 glass-strong border-border/50">
                  <DropdownMenuLabel className="pb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 ring-2 ring-primary/20">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-sm font-bold">
                          {(user.name || user.email)[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{user.name || t('app.member')}</div>
                        <div className="text-xs text-muted-foreground font-normal truncate">{user.email}</div>
                        {user.role === 'ADMIN' && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <ShieldCheck className="w-3 h-3 text-primary" />
                            <span className="text-[10px] text-primary font-medium">حساب {t('app.adminRole')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-2 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">{t('app.egpBalanceLabel')}</span>
                      <span className="font-num font-semibold text-success">{fmtEgp(user.egpBalance)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">{t('app.usdtBalanceLabel')}</span>
                      <span className="font-num font-semibold text-primary">{fmtUsdt(user.usdtBalance)}</span>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a href="/profile" className="cursor-pointer flex items-center">
                      <User className="w-4 h-4 ml-2" />
                      الملف الشخصي
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="/transactions" className="cursor-pointer flex items-center">
                      <Wallet className="w-4 h-4 ml-2" />
                      سجل المعاملات
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="/security" className="cursor-pointer flex items-center">
                      <ShieldCheck className="w-4 h-4 ml-2" />
                      السجل الأمني
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="/help" className="cursor-pointer flex items-center">
                      <HelpCircle className="w-4 h-4 ml-2" />
                      مركز المساعدة
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="/learn" className="cursor-pointer flex items-center">
                      <GraduationCap className="w-4 h-4 ml-2" />
                      أكاديمية التداول
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-rose-600 focus:text-rose-700 cursor-pointer">
                    <LogOut className="w-4 h-4 ml-2" />
                    {t('app.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Connection status banner (shows when disconnected) */}
      <ConnectionBanner />

      {/* Tabs navigation - desktop */}
      <nav className="sticky top-14 sm:top-16 z-30 border-b bg-background/95 backdrop-blur hidden md:block">
        <div className="container-fluid">
          <div className="flex overflow-x-auto gap-1 py-2 no-scrollbar">
            {tabs.map((t) => {
              const Icon = t.icon
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                    tab === t.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Mobile bottom nav - fixed at bottom */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 glass-strong border-t border-border/50 safe-area-bottom">
        <div className="grid grid-cols-6 gap-0.5 p-1.5">
          {tabs.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 rounded-lg transition-colors ${
                  tab === t.id
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[9px] font-medium">{t.label.split(' ')[0]}</span>
              </button>
            )
          })}
          {/* More button — opens bottom sheet with secondary pages */}
          <button
            onClick={() => setMoreSheetOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 py-2 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
          >
            <Menu className="w-4 h-4" />
            <span className="text-[9px] font-medium">المزيد</span>
          </button>
        </div>
      </nav>

      {/* Mobile "More" bottom sheet */}
      <Sheet open={moreSheetOpen} onOpenChange={setMoreSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="text-right">المزيد</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-4 gap-2 p-4">
            {[
              { label: 'الملف الشخصي', icon: User, href: '/profile' },
              { label: 'سجل المعاملات', icon: Wallet, href: '/transactions' },
              { label: 'السجل الأمني', icon: ShieldCheck, href: '/security' },
              { label: 'مركز المساعدة', icon: HelpCircle, href: '/help' },
              { label: 'الأكاديمية', icon: GraduationCap, href: '/learn' },
              { label: 'الإشعارات', icon: Bell, href: '/notifications' },
              { label: 'تسجيل خروج', icon: LogOut, action: handleLogout, danger: true },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={item.action ? (e) => { e.preventDefault(); item.action() } : undefined}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors ${
                  item.danger
                    ? 'border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950'
                    : 'border-border hover:bg-muted/50 text-foreground'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] text-center font-medium">{item.label}</span>
              </a>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Content */}
      <main className="flex-1 container-fluid py-4 sm:py-6 pb-20 md:pb-6">
        {tab === 'dashboard' && <DashboardTab />}
        {tab === 'trade' && <TradeTab />}
        {tab === 'p2p' && <P2PTab />}
        {tab === 'wallet' && <WalletTab />}
        {tab === 'admin' && user.role === 'ADMIN' && <AdminTab />}
      </main>

      {/* Footer */}
      <footer className="border-t py-4 px-4 mt-auto hidden md:block">
        <div className="container-fluid text-center text-xs text-muted-foreground">
          © <span className="font-num">2026</span> Eg-Money — منصة تداول USDT بالجنيه المصري
        </div>
      </footer>

      {/* Onboarding flow for new users */}
      <OnboardingFlow
        open={onboardingOpen}
        onComplete={() => setOnboardingOpen(false)}
      />

      {/* Email/Phone verification modal (blocks all actions until verified) */}
      <VerificationModal />
    </div>
  )
}
