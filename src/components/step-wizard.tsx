'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useLanguage } from '@/hooks/use-language'

type StepWizardProps = {
  /** Total number of steps */
  total: number
  /** Step labels (short, e.g. "Account") */
  labels?: string[]
  /** Step titles (longer, e.g. "Account details") */
  titles: string[]
  /** Step descriptions */
  descriptions?: string[]
  /** Validator per step (returns error message or undefined) */
  validateStep?: (step: number) => string | null
  /** Called when user clicks finish on the last step */
  onFinish: () => void | Promise<void>
  /** Called when user clicks back on the first step */
  onBack?: () => void
  /** Render function for the current step content */
  children: (step: number) => React.ReactNode
  /** Is the finish action loading? */
  loading?: boolean
  /** Show skip button on certain steps (return true to show) */
  canSkip?: (step: number) => boolean
  /** Called when skip is clicked */
  onSkip?: () => void
  /** Hide labels on mobile (just show numbers) */
  compactOnMobile?: boolean
}

export function StepWizard({
  total,
  labels,
  titles,
  descriptions,
  validateStep,
  onFinish,
  onBack,
  children,
  loading = false,
  canSkip,
  onSkip,
  compactOnMobile = true,
}: StepWizardProps) {
  const { t, lang } = useLanguage()
  const [step, setStep] = useState(0) // 0-indexed
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')
  const [stepError, setStepError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const isLast = step === total - 1
  const isFirst = step === 0
  const progress = ((step + 1) / total) * 100

  // Scroll to top of step content on step change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
    // Also scroll the page to top on mobile
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [step])

  const goNext = useCallback(() => {
    setStepError(null)
    if (validateStep) {
      const err = validateStep(step)
      if (err) {
        setStepError(err)
        return
      }
    }
    if (isLast) {
      onFinish()
      return
    }
    setDirection('forward')
    setStep((s) => Math.min(s + 1, total - 1))
  }, [step, validateStep, isLast, onFinish, total])

  const goBack = useCallback(() => {
    setStepError(null)
    if (isFirst) {
      onBack?.()
      return
    }
    setDirection('backward')
    setStep((s) => Math.max(s - 1, 0))
  }, [isFirst, onBack])

  const goTo = useCallback((target: number) => {
    if (target < 0 || target >= total) return
    if (target === step) return
    // Only allow going back freely, forward requires validation
    if (target < step) {
      setDirection('backward')
      setStep(target)
      setStepError(null)
    } else {
      // Forward: validate all intermediate steps
      if (validateStep) {
        for (let i = step; i < target; i++) {
          const err = validateStep(i)
          if (err) {
            setStepError(err)
            return
          }
        }
      }
      setDirection('forward')
      setStep(target)
      setStepError(null)
    }
  }, [step, total, validateStep])

  return (
    <div className="flex flex-col h-full">
      {/* Compact step indicator — single line on mobile, dots+labels on desktop */}
      <div className="mb-3 sm:mb-5">
        {/* Mobile: ultra-compact (badge + progress bar only) */}
        <div className="sm:hidden">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline" className="font-num text-[10px] h-5 px-2 bg-primary/10 text-primary border-primary/20 gap-1">
              {t('auth.stepOf')} {step + 1} / {total}
            </Badge>
            <span className="text-[11px] font-medium text-foreground">
              {labels?.[step] || ''}
            </span>
            {canSkip?.(step) && (
              <button
                type="button"
                onClick={onSkip}
                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('auth.skipForNow')}
              </button>
            )}
          </div>
          {/* Progress bar with clickable segments */}
          <div className="flex items-center gap-1">
            {Array.from({ length: total }).map((_, i) => {
              const isDone = i < step
              const isActive = i === step
              const isClickable = i <= step
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => isClickable && goTo(i)}
                  disabled={!isClickable}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                    isActive
                      ? 'bg-primary'
                      : isDone
                        ? 'bg-success/60'
                        : 'bg-muted'
                  } ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                  aria-label={`Step ${i + 1}`}
                />
              )
            })}
          </div>
        </div>

        {/* Desktop: full step indicator with circles + labels */}
        <div className="hidden sm:flex items-center gap-2">
          {Array.from({ length: total }).map((_, i) => {
            const isDone = i < step
            const isActive = i === step
            const isClickable = i <= step
            return (
              <button
                key={i}
                type="button"
                onClick={() => isClickable && goTo(i)}
                disabled={!isClickable}
                className={`flex-1 group flex flex-col items-center gap-1.5 ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
              >
                <div
                  className={`wizard-step-badge w-8 h-8 rounded-full flex items-center justify-center text-xs font-num font-bold transition-all duration-300 ${
                    isActive
                      ? 'active bg-primary text-primary-foreground shadow-[0_0_12px_oklch(0.82_0.20_145/0.5)] scale-110'
                      : isDone
                        ? 'bg-success/20 text-success border border-success/40'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span
                  className={`text-[10px] transition-colors leading-tight text-center ${
                    isActive
                      ? 'text-foreground font-semibold'
                      : isDone
                        ? 'text-success'
                        : 'text-muted-foreground'
                  }`}
                >
                  {labels?.[i] || ''}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Step content (animated) */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 wizard-step-content"
        key={step}
      >
        <div className={direction === 'forward' ? 'animate-wizard-in' : 'animate-wizard-back'}>
          {/* Step title — compact on mobile, full on desktop */}
          <div className="mb-3 sm:mb-5">
            <h3 className="font-display text-lg sm:text-2xl font-bold leading-tight">
              {titles[step]}
            </h3>
            {descriptions?.[step] && (
              <p className="text-[11px] sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 leading-relaxed">
                {descriptions[step]}
              </p>
            )}
          </div>

          {/* Step content body */}
          <div className="space-y-3 sm:space-y-4">
            {children(step)}
          </div>

          {/* Step error */}
          {stepError && (
            <div className="mt-3 rounded-lg bg-rose-500/10 border border-rose-500/30 px-3 py-2.5 flex items-start gap-2 animate-auth-shake">
              <X className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <span className="text-xs text-rose-600 dark:text-rose-400 leading-relaxed">{stepError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation footer */}
      <div className="flex items-center gap-2 mt-3 sm:mt-6 pt-3 sm:pt-4 border-t border-border/30">
        <Button
          type="button"
          variant="ghost"
          onClick={goBack}
          disabled={loading}
          className="gap-1 h-11 sm:h-11 px-3 sm:px-4 text-xs sm:text-sm flex-shrink-0"
        >
          {lang === 'ar' ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          <span className="hidden sm:inline">{t('auth.prevStep')}</span>
        </Button>
        <Button
          type="button"
          onClick={goNext}
          disabled={loading}
          className="flex-1 gap-2 h-11 bg-primary hover:bg-primary/90 text-primary-foreground glow-primary-sm auth-btn-shine font-medium text-xs sm:text-sm"
        >
          {loading ? null : isLast ? <Check className="w-4 h-4" /> : null}
          {loading
            ? <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            : isLast
              ? t('auth.completeSignup')
              : t('auth.nextStep')}
          {!loading && !isLast && (lang === 'ar' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
        </Button>
      </div>
    </div>
  )
}
