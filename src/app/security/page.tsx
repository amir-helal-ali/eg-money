'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BrandLogo } from '@/components/brand-logo'
import { useAuth, apiCall } from '@/lib/client'
import {
  ArrowRight, Loader2, ShieldCheck, ShieldAlert, LogIn, LogOut, AlertCircle,
  KeyRound, MailCheck, Phone, Clock, MapPin, Monitor, Fingerprint,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

type LoginEvent = {
  id: string
  eventType: string // LOGIN | LOGOUT | FAILED_LOGIN | PASSWORD_RESET | EMAIL_VERIFIED | PHONE_VERIFIED
  success: boolean
  failureReason: string | null
  ipAddress: string | null
  userAgent: string | null
  country: string | null
  city: string | null
  metadata: Record<string, any> | null
  createdAt: string
}

type Stats = {
  totalLogins: number
  failedAttempts: number
  lastLogin: string | null
  recentFailures: number
}

const EVENT_META: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  LOGIN: { label: 'تسجيل دخول', icon: LogIn, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-950' },
  LOGOUT: { label: 'تسجيل خروج', icon: LogOut, color: 'text-muted-foreground', bg: 'bg-muted' },
  FAILED_LOGIN: { label: 'محاولة فاشلة', icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-950' },
  PASSWORD_RESET: { label: 'تغيير كلمة المرور', icon: KeyRound, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-950' },
  EMAIL_VERIFIED: { label: 'تأكيد البريد', icon: MailCheck, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-950' },
  PHONE_VERIFIED: { label: 'تأكيد الهاتف', icon: Phone, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-950' },
  PROFILE_UPDATE: { label: 'تحديث الملف الشخصي', icon: Fingerprint, color: 'text-violet-600', bg: 'bg-violet-100 dark:bg-violet-950' },
  SESSION_TOKEN_ISSUED: { label: 'إصدار جلسة', icon: KeyRound, color: 'text-muted-foreground', bg: 'bg-muted' },
}

const FAILURE_REASONS: Record<string, string> = {
  WRONG_PASSWORD: 'كلمة مرور خاطئة',
  USER_NOT_FOUND: 'المستخدم غير موجود',
  SUSPENDED: 'الحساب موقوف',
  EXPIRED_OTP: 'انتهت صلاحية الرمز',
  RATE_LIMITED: 'تجاوز عدد المحاولات',
}

function parseUserAgent(ua: string | null): { device: string; browser: string; os: string } {
  if (!ua) return { device: 'غير معروف', browser: 'غير معروف', os: 'غير معروف' }
  let browser = 'غير معروف'
  let os = 'غير معروف'
  let device = 'كمبيوتر'

  if (ua.includes('Firefox')) browser = 'Firefox'
  else if (ua.includes('Edg')) browser = 'Edge'
  else if (ua.includes('Chrome')) browser = 'Chrome'
  else if (ua.includes('Safari')) browser = 'Safari'

  if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Mac')) os = 'macOS'
  else if (ua.includes('Linux')) os = 'Linux'
  else if (ua.includes('Android')) { os = 'Android'; device = 'جوال' }
  else if (ua.includes('iPhone') || ua.includes('iPad')) { os = 'iOS'; device = 'جوال' }

  if (ua.includes('Mobile')) device = 'جوال'
  return { device, browser, os }
}

export default function SecurityPage() {
  const router = useRouter()
  const { user, initialized, fetchUser } = useAuth()
  const [events, setEvents] = useState<LoginEvent[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasNext, setHasNext] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)

  async function load(cursor?: string) {
    const params = new URLSearchParams()
    params.set('limit', '30')
    if (cursor) params.set('cursor', cursor)
    const { data } = await apiCall<{ events: LoginEvent[]; stats: Stats; pagination: any }>(
      `/api/login-history?${params.toString()}`,
    )
    if (data) {
      if (cursor) {
        setEvents((prev) => [...prev, ...data.events])
      } else {
        setEvents(data.events)
      }
      setStats(data.stats)
      setHasNext(data.pagination.hasNext)
      setNextCursor(data.pagination.nextCursor)
    }
  }

  useEffect(() => {
    if (!initialized) {
      fetchUser()
      return
    }
    if (!user) {
      router.push('/')
      return
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, user])

  async function loadMore() {
    if (!hasNext || !nextCursor) return
    setLoadingMore(true)
    await load(nextCursor)
    setLoadingMore(false)
  }

  if (!initialized || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

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
        {/* Page title */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-primary" />
            السجل الأمني
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            تابع نشاط حسابك وحمايته
          </p>
        </div>

        {/* Stats summary */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4">
                <LogIn className="w-5 h-5 text-emerald-500 mb-1" />
                <div className="text-2xl font-bold font-num">{stats.totalLogins}</div>
                <div className="text-[10px] text-muted-foreground">إجمالي الدخول</div>
              </CardContent>
            </Card>
            <Card className={stats.recentFailures > 0 ? 'border-rose-300' : ''}>
              <CardContent className="p-4">
                <AlertCircle className={`w-5 h-5 mb-1 ${stats.recentFailures > 0 ? 'text-rose-500' : 'text-muted-foreground'}`} />
                <div className={`text-2xl font-bold font-num ${stats.recentFailures > 0 ? 'text-rose-600' : ''}`}>
                  {stats.recentFailures}
                </div>
                <div className="text-[10px] text-muted-foreground">محاولات فاشلة (24س)</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <Clock className="w-5 h-5 text-blue-500 mb-1" />
                <div className="text-xs font-medium">
                  {stats.lastLogin
                    ? new Date(stats.lastLogin).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })
                    : '—'}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">آخر دخول</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <Fingerprint className="w-5 h-5 text-violet-500 mb-1" />
                <div className="text-2xl font-bold font-num">{stats.failedAttempts}</div>
                <div className="text-[10px] text-muted-foreground">إجمالي الفاشلة</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Security alert */}
        {stats && stats.recentFailures > 0 && (
          <Card className="border-rose-300 bg-rose-50 dark:bg-rose-950/30">
            <CardContent className="p-4 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
              <div>
                <div className="font-medium text-rose-700 dark:text-rose-400 text-sm">
                  تم رصد {stats.recentFailures} محاولة دخول فاشلة في آخر 24 ساعة
                </div>
                <div className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-1">
                  إن لم تكن أنت، ننصح بتغيير كلمة المرور فوراً وتفعيل التحقق بخطوتين.
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Events list */}
        <div>
          <h2 className="text-lg font-semibold mb-3">سجل الأحداث</h2>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : events.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>لا توجد أحداث أمنية بعد</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {events.map((ev) => {
                const meta = EVENT_META[ev.eventType] || EVENT_META.LOGIN
                const Icon = meta.icon
                const ua = parseUserAgent(ev.userAgent)
                return (
                  <Card key={ev.id}>
                    <CardContent className="p-3 flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.bg} ${meta.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{meta.label}</span>
                          <Badge
                            variant="outline"
                            className={`text-[9px] ${ev.success ? 'text-emerald-600 border-emerald-300' : 'text-rose-600 border-rose-300'}`}
                          >
                            {ev.success ? 'نجح' : 'فشل'}
                          </Badge>
                          {ev.failureReason && (
                            <span className="text-[10px] text-rose-500">
                              {FAILURE_REASONS[ev.failureReason] || ev.failureReason}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                          {ev.ipAddress && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {ev.ipAddress}
                              {ev.city && ` · ${ev.city}`}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <Monitor className="w-3 h-3" />
                            {ua.device} · {ua.browser} · {ua.os}
                          </span>
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(ev.createdAt).toLocaleString('en-GB', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              {hasNext && (
                <div className="flex justify-center pt-3">
                  <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                    {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تحميل المزيد'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
