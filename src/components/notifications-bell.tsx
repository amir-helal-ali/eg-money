'use client'

import { useRef, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Bell, TrendingUp, TrendingDown, Shield, Zap, Gift,
  ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft, Clock,
  Trash2, X, ChevronLeft, ExternalLink,
} from 'lucide-react'
import { useSound } from '@/hooks/use-sound'
import { usePushNotifications } from '@/hooks/use-push-notifications'
import { useNotifications, type Notification } from '@/hooks/use-notifications'
import { useLanguage } from '@/hooks/use-language'
import { useAuth } from '@/lib/client'

// Map notification type to icon + color
const NOTIFICATION_STYLES: Record<string, { icon: any; color: string }> = {
  PRICE: { icon: TrendingUp, color: 'text-success bg-success/10' },
  TRADE: { icon: ArrowRightLeft, color: 'text-blue-400 bg-blue-500/10' },
  SECURITY: { icon: Shield, color: 'text-primary bg-primary/10' },
  SYSTEM: { icon: Zap, color: 'text-purple-400 bg-purple-500/10' },
  PROMO: { icon: Gift, color: 'text-amber-400 bg-amber-500/10' },
  DEPOSIT: { icon: ArrowDownToLine, color: 'text-success bg-success/10' },
  WITHDRAWAL: { icon: ArrowUpFromLine, color: 'text-rose-400 bg-rose-500/10' },
  P2P: { icon: ArrowRightLeft, color: 'text-blue-400 bg-blue-500/10' },
}

// Format time ago in Arabic/English based on current language
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

// Map notification action to tab label
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

export function NotificationsBell() {
  const router = useRouter()
  const { playNotification, playAdminAlert } = useSound()
  const { notify } = usePushNotifications()
  const prevUnreadRef = useRef(0)
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    deleteNotification,
    deleteAllRead,
    handleNotificationClick,
  } = useNotifications()

  // Play sound + push notification when unread count increases
  useEffect(() => {
    if (unreadCount > prevUnreadRef.current && prevUnreadRef.current !== -1) {
      const newest = notifications.find(n => !n.read)
      if (newest) {
        // Admin-specific notifications (deposit/withdrawal requests) get the STRONG 10s alert
        const isAdminNotif = newest.metadata?.action?.startsWith('admin_')
        if (isAdmin && isAdminNotif) {
          playAdminAlert()
        } else {
          playNotification()
        }
        notify(newest.title, newest.message)
      }
    }
    prevUnreadRef.current = unreadCount
  }, [unreadCount, notifications, playNotification, playAdminAlert, notify, isAdmin])

  // Handle click on a notification: mark read + navigate if action exists
  function handleClick(n: Notification) {
    const targetTab = handleNotificationClick(n)
    if (targetTab) {
      setOpen(false)
      // Navigate to the app with the target tab
      // Since the app uses internal tab state, we use a custom event to switch tabs
      window.dispatchEvent(new CustomEvent('switch-tab', { detail: targetTab }))
    }
  }

  // Show only last 4 in the dropdown (full list on /notifications page)
  const dropdownItems = notifications.slice(0, 4)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          aria-label={t('notifications.title')}
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 sm:w-96 p-0 glass-strong border-border/50" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">{t('notifications.title')}</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-rose-500/15 text-rose-400">
                {unreadCount} {t('notifications.new')}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-[10px] h-6 px-2 text-primary hover:text-primary"
                onClick={markAllRead}
              >
                {t('notifications.markAllRead')}
              </Button>
            )}
            {notifications.some(n => n.read) && (
              <Button
                variant="ghost"
                size="sm"
                className="text-[10px] h-6 px-2 text-muted-foreground hover:text-rose-400"
                onClick={deleteAllRead}
                title={t('notifications.deleteRead')}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Notifications list — show last 4 only */}
        <ScrollArea className="max-h-[400px]">
          <div className="divide-y divide-border/30">
            {dropdownItems.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">{t('notifications.none')}</p>
              </div>
            ) : (
              dropdownItems.map((n) => {
                const style = NOTIFICATION_STYLES[n.type] || NOTIFICATION_STYLES.SYSTEM
                const Icon = style.icon
                const action = n.metadata?.action
                const actionLabel = action ? ACTION_LABELS[action] : null
                return (
                  <div
                    key={n.id}
                    className={`group relative flex items-start gap-3 p-3 hover:bg-muted/30 transition-colors text-right cursor-pointer ${
                      !n.read ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => handleClick(n)}
                  >
                    <div className={`w-9 h-9 rounded-lg ${style.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-xs">{n.title}</span>
                        {!n.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-snug mb-1">{n.message}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
                          <Clock className="w-2.5 h-2.5" />
                          {formatTimeAgo(new Date(n.createdAt))}
                        </div>
                        {actionLabel && (
                          <span className="text-[10px] text-primary flex items-center gap-0.5">
                            <ExternalLink className="w-2.5 h-2.5" />
                            {actionLabel.ar}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Delete button (appears on hover) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteNotification(n.id)
                      }}
                      className="absolute top-2 left-2 p-1 rounded-md text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      title={t('notifications.delete')}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>

        {/* Footer — view all */}
        <div className="p-2 border-t border-border/50 flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-xs h-8 gap-1"
            onClick={() => {
              setOpen(false)
              router.push('/notifications')
            }}
          >
            {t('notifications.viewAll')}
            <ChevronLeft className="w-3 h-3" />
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
