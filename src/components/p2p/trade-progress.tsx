'use client'

import { Check, X, Clock, AlertTriangle, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  status: string // PENDING_PAYMENT | PAID | RELEASED | DISPUTED | CANCELLED
  hasReview?: boolean
  className?: string
}

/**
 * 5-step horizontal progress indicator showing the lifecycle of a P2P trade:
 *   1. تم الإنشاء (Created)
 *   2. تم الدفع (Paid)
 *   3. تم الإفراج (Released)
 *   4. تم التقييم (Reviewed) — only reached if user submitted a review
 *
 * If the trade is CANCELLED or DISPUTED, we show a special "off-track" state.
 */
const STEPS = [
  { key: 'CREATED', label: 'تم الإنشاء' },
  { key: 'PAID', label: 'تم الدفع' },
  { key: 'RELEASED', label: 'تم الإفراج' },
  { key: 'REVIEWED', label: 'تم التقييم' },
]

export function TradeProgress({ status, hasReview, className }: Props) {
  // Off-track states: show a banner instead of the progress steps
  if (status === 'CANCELLED') {
    return (
      <div className={cn('flex items-center gap-2 p-2 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 text-xs', className)}>
        <X className="w-4 h-4" />
        تم إلغاء الصفقة
      </div>
    )
  }
  if (status === 'DISPUTED') {
    return (
      <div className={cn('flex items-center gap-2 p-2 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 text-xs', className)}>
        <AlertTriangle className="w-4 h-4" />
        الصفقة في نزاع — الإدارة تراجعها
      </div>
    )
  }

  // Compute current step
  let currentStep = 0
  if (status === 'PENDING_PAYMENT') currentStep = 1
  else if (status === 'PAID') currentStep = 2
  else if (status === 'RELEASED') currentStep = 3
  if (hasReview && currentStep === 3) currentStep = 4

  return (
    <div className={cn('flex items-center', className)}>
      {STEPS.map((step, idx) => {
        const stepNum = idx + 1
        const isComplete = stepNum < currentStep
        const isCurrent = stepNum === currentStep
        const isFuture = stepNum > currentStep
        const isLast = idx === STEPS.length - 1

        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            {/* Step circle + label */}
            <div className="flex flex-col items-center gap-1 min-w-[60px]">
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center border-2 transition-colors',
                  isComplete && 'bg-emerald-500 border-emerald-500 text-white',
                  isCurrent && 'bg-primary border-primary text-primary-foreground animate-pulse',
                  isFuture && 'bg-muted border-muted-foreground/30 text-muted-foreground',
                )}
              >
                {isComplete ? (
                  <Check className="w-3.5 h-3.5" />
                ) : step.key === 'REVIEWED' ? (
                  <Star className="w-3.5 h-3.5" />
                ) : (
                  <span className="text-[10px] font-bold">{stepNum}</span>
                )}
              </div>
              <div
                className={cn(
                  'text-[9px] text-center leading-tight',
                  isComplete && 'text-emerald-600 dark:text-emerald-400 font-medium',
                  isCurrent && 'text-primary font-medium',
                  isFuture && 'text-muted-foreground',
                )}
              >
                {step.label}
              </div>
            </div>
            {/* Connector line */}
            {!isLast && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-1 mb-4 transition-colors',
                  stepNum < currentStep ? 'bg-emerald-500' : 'bg-muted-foreground/20',
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
