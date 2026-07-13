'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  ArrowRight, ArrowLeft, Bell, TrendingUp, TrendingDown, Shield, Zap, Gift,
  ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft, Clock,
  Trash2, X, ExternalLink, CheckCheck, Inbox, Calendar,
} from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'
import { useLanguage } from '@/hooks/use-language'
import { useNotifications, type Notification } from '@/hooks/use-notifications'

const NOTIFICATION_STYLES: Record<string, { icon: any; color: string; labelAr: string; labelEn: string }> = {
  PRICE: { icon: TrendingUp, color: 'text-success bg-success/10', labelAr: 'أسعار', labelEn: 'Price' },
  TRADE: { icon: ArrowRightLeft, color: 'text-blue-400 bg-blue-500/10', labelAr: 'تداول', labelEn: 'Trade' },
  SECURITY: { icon: Shield, color: 'text-primary bg-primary/10', labelAr: 'أمان', labelEn: 'Security' },
  SYSTEM: { icon: Zap, color: 'text-purple-400 bg-purple-500/10', labelAr: 'نظام', labelEn: 'System' },
  PROMO: { icon: Gift, color: 'text-amber-400 bg-amber-500/10', labelAr: 'عروض', labelEn: 'Promo' },
  DEPOSIT: { icon: ArrowDownToLine, color: 'text-success bg-success/10', labelAr: 'إيداع', labelEn: 'Deposit' },
  WITHDRAWAL: { icon: ArrowUpFromLine, color: 'text-rose-400 bg-rose-500/10', labelAr: 'سحب', labelEn: 'Withdrawal' },
  P2P: { icon: ArrowRightLeft, color: 'text-blue-400 bg-blue-500/10', labelAr: 'P2P', labelEn: 'P2P' },
}

const ACTION_LABELS: Record<string, { ar: string; en: string }> = {
  'view_wallet': { ar: 'الذهاب للمحفظة', en: 'Go to wallet' },
  'view_dashboard': { ar: 'الذهاب للرئيسية', en: 'Go to dashboard' },
  'view_trade': { ar: 'الذهاب للتداول', en: 'Go to trade' },
  'view_p2p': { ar: 'الذهاب لـ P2P', en: 'Go to P2P' },
  'admin_deposits': { ar: 'مراجعة الإيداعات', en: 'Review deposits' },
  'admin_withdrawals': { ar: 'مراجعة السحوبات', en: 'Review withdrawals' },
  'admin_users': { ar: 'إدارة المستخدمين', en: 'Manage users' },
  'admin_p2p': { ar: 'مراجعة P2P', en: 'Review P2P' },
}

function formatTimeAgo(date: Date): string {
  const now = Date.now()
  const diff = now - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const lang = typeof document !== 'undefined' ? document.documentElement.lang : 'ar'
  const isAr = lang === 'ar'

  if (seconds < 60) return isAr ? 'الآن' : 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 2) return isAr ? 'منذ دقيقة' : 'minute ago'
  if (minutes < 10) return isAr ? `منذ ${minutes} دقائق` : `${minutes} minutes ago`
  if (minutes < 60) return isAr ? `منذ ${minutes} دقيقة` : `${minutes} minutes ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 2) return isAr ? 'منذ ساعة' : 'hour ago'
  if (hours < 10) return isAr ? `منذ ${hours} ساعات` : `${hours} hours ago`
  const days = Math.floor(hours / 24)
  if (days < 2) return isAr ? 'منذ يوم' : 'day ago'
  return isAr ? `منذ ${days} أيام` : `${days} days ago`
}

function formatDateGroup(date: Date): { ar: string; en: string } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const notifDate = new Date(date)
  notifDate.setHours(0, 0, 0, 0)

  if (notifDate.getTime() === today.getTime()) return { ar: 'اليوم', en: 'Today' }
  if (notifDate.getTime() === yesterday.getTime()) return { ar: 'أمس', en: 'Yesterday' }
  return {
    ar: notifDate.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' }),
    en: notifDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long' }),
  }
}

type FilterType = 'all' | 'unread' | string

export default function NotificationsPage() {
  const router = useRouter()
  const { lang } = useLanguage()
  const isAr = lang === 'ar'
  const [filter, setFilter] = useState<FilterType>('all')

  const {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    deleteNotification,
    deleteAllRead,
    handleNotificationClick,
    fetchNotifications,
  } = useNotifications()

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Filtered + grouped by date
  const { filtered, grouped } = useMemo(() => {
    const filtered = filter === 'all'
      ? notifications
      : filter === 'unread'
        ? notifications.filter(n => !n.read)
        : notifications.filter(n => n.type === filter)

    // Group by date
    const groups: { date: { ar: string; en: string }; items: Notification[] }[] = []
    let currentGroup: { date: { ar: string; en: string }; items: Notification[] } | null = null
    for (const n of filtered) {
      const dateLabel = formatDateGroup(new Date(n.createdAt))
      if (!currentGroup || currentGroup.date.ar !== dateLabel.ar) {
        currentGroup = { date: dateLabel, items: [n] }
        groups.push(currentGroup)
      } else {
        currentGroup.items.push(n)
      }
    }
    return { filtered, grouped: groups }
  }, [notifications, filter])

  function handleClick(n: Notification) {
    const targetTab = handleNotificationClick(n)
    if (targetTab) {
      window.dispatchEvent(new CustomEvent('switch-tab', { detail: targetTab }))
      router.push('/')
    }
  }

  // Available types for filter chips
  const availableTypes = useMemo(() => {
    const types = new Set(notifications.map(n => n.type))
    return Array.from(types)
  }, [notifications])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/')}
            className="gap-2"
          >
            {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {isAr ? 'رجوع' : 'Back'}
          </Button>
          <BrandLogo size="sm" />
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllRead}
                className="gap-1.5 text-xs"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isAr ? 'قراءة الكل' : 'Read all'}</span>
              </Button>
            )}
            {notifications.some(n => n.read) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={deleteAllRead}
                className="gap-1.5 text-xs text-muted-foreground hover:text-rose-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isAr ? 'حذف المقروء' : 'Clear read'}</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-primary/10 to-transparent">
        <div className="container mx-auto px-4 py-8 max-w-3xl text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/15 text-primary flex items-center justify-center mb-3">
            <Bell className="w-7 h-7" />
          </div>
          <h1 className="font-display text-2xl font-bold mb-1">
            {isAr ? 'كل الإشعارات' : 'All Notifications'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isAr
              ? `${notifications.length} إشعار · ${unreadCount} غير مقروء`
              : `${notifications.length} notifications · ${unreadCount} unread`}
          </p>
        </div>
      </section>

      {/* Filters */}
      <div className="container mx-auto px-4 py-4 max-w-3xl">
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            {isAr ? 'الكل' : 'All'} ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === 'unread'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            {isAr ? 'غير مقروء' : 'Unread'} ({unreadCount})
          </button>
          {availableTypes.map((type) => {
            const style = NOTIFICATION_STYLES[type]
            if (!style) return null
            const count = notifications.filter(n => n.type === type).length
            return (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  filter === type
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                {isAr ? style.labelAr : style.labelEn} ({count})
              </button>
            )
          })}
        </div>

        {/* Notifications grouped by date */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Inbox className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              {filter === 'unread'
                ? (isAr ? 'لا توجد إشعارات غير مقروءة' : 'No unread notifications')
                : (isAr ? 'لا توجد إشعارات' : 'No notifications')}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map((group, gi) => (
              <div key={gi}>
                {/* Date header */}
                <div className="flex items-center gap-2 mb-3 px-1">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {isAr ? group.date.ar : group.date.en}
                  </span>
                  <div className="flex-1 h-px bg-border/30" />
                  <span className="text-[10px] text-muted-foreground/60 font-num">{group.items.length}</span>
                </div>

                {/* Notifications for this date */}
                <div className="space-y-2">
                  {group.items.map((n) => {
                    const style = NOTIFICATION_STYLES[n.type] || NOTIFICATION_STYLES.SYSTEM
                    const Icon = style.icon
                    const action = n.metadata?.action
                    const actionLabel = action ? ACTION_LABELS[action] : null
                    return (
                      <Card
                        key={n.id}
                        className={`group relative hover:border-primary/30 transition-all cursor-pointer ${
                          !n.read ? 'border-primary/30 bg-primary/5' : ''
                        }`}
                        onClick={() => handleClick(n)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-xl ${style.color} flex items-center justify-center flex-shrink-0`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm">{n.title}</span>
                                {!n.read && (
                                  <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed mb-2">{n.message}</p>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
                                  <Clock className="w-2.5 h-2.5" />
                                  {formatTimeAgo(new Date(n.createdAt))}
                                </div>
                                {actionLabel && (
                                  <span className="text-[10px] text-primary flex items-center gap-0.5 font-medium">
                                    <ExternalLink className="w-2.5 h-2.5" />
                                    {isAr ? actionLabel.ar : actionLabel.en}
                                  </span>
                                )}
                              </div>
                            </div>
                            {/* Action buttons */}
                            <div className="flex flex-col gap-1 flex-shrink-0">
                              {!n.read && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    markRead(n.id)
                                  }}
                                  className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                  title={isAr ? 'تعليم كمقروء' : 'Mark as read'}
                                >
                                  <CheckCheck className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteNotification(n.id)
                                }}
                                className="p-1.5 rounded-md text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                title={isAr ? 'حذف' : 'Delete'}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
