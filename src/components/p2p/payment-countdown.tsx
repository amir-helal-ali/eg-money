'use client'

import { useState, useEffect } from 'react'
import { Clock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  /** ISO date string when the trade was created */
  createdAt: string
  /** Minutes from creation before auto-cancel (default 30) */
  deadlineMinutes?: number
  /** Status — only show countdown while PENDING_PAYMENT */
  status: string
  className?: string
}

/**
 * Countdown timer that shows remaining payment time.
 * Goes red and pulses in the last 5 minutes. Shows 'انتهت' when expired.
 */
export function PaymentCountdown({ createdAt, deadlineMinutes = 30, status, className }: Props) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (status !== 'PENDING_PAYMENT') return
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [status])

  if (status !== 'PENDING_PAYMENT') return null

  const created = new Date(createdAt).getTime()
  const deadline = created + deadlineMinutes * 60 * 1000
  const remaining = deadline - now

  if (remaining <= 0) {
    return (
      <div className={cn('inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 font-medium', className)}>
        <AlertCircle className="w-3.5 h-3.5" />
        انتهت مهلة الدفع
      </div>
    )
  }

  const totalSeconds = Math.floor(remaining / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const isUrgent = remaining < 5 * 60 * 1000 // last 5 min

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-num font-medium',
        isUrgent
          ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 animate-pulse'
          : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400',
        className,
      )}
      title={`ينتهي في ${new Date(deadline).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`}
    >
      <Clock className="w-3.5 h-3.5" />
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </div>
  )
}
