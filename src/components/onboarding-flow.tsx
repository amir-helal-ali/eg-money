'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Coins, Zap, Shield, Users, Wallet, ArrowRight, ArrowLeft, Check,
  TrendingUp, Sparkles,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/hooks/use-language'

type Step = {
  icon: any
  title: string
  description: string
  bullets: string[]
  color: string
}

const STEPS: Step[] = [
  {
    icon: Coins,
    title: 'onboarding.step1Title',
    description: 'onboarding.step1Desc',
    bullets: [
      'onboarding.step1B1',
      'onboarding.step1B2',
      'onboarding.step1B3',
    ],
    color: 'primary',
  },
  {
    icon: Wallet,
    title: 'onboarding.step2Title',
    description: 'onboarding.step2Desc',
    bullets: [
      'onboarding.step2B1',
      'onboarding.step2B2',
      'onboarding.step2B3',
      'onboarding.step2B4',
    ],
    color: 'rose',
  },
  {
    icon: Zap,
    title: 'onboarding.step3Title',
    description: 'onboarding.step3Desc',
    bullets: [
      'onboarding.step3B1',
      'onboarding.step3B2',
      'onboarding.step3B3',
      'onboarding.step3B4',
    ],
    color: 'amber',
  },
  {
    icon: Users,
    title: 'onboarding.step4Title',
    description: 'onboarding.step4Desc',
    bullets: [
      'onboarding.step4B1',
      'onboarding.step4B2',
      'onboarding.step4B3',
      'onboarding.step4B4',
    ],
    color: 'blue',
  },
  {
    icon: Shield,
    title: 'onboarding.step5Title',
    description: 'onboarding.step5Desc',
    bullets: [
      'onboarding.step5B1',
      'onboarding.step5B2',
      'onboarding.step5B3',
    ],
    color: 'success',
  },
]

export function OnboardingFlow({ open, onComplete }: { open: boolean; onComplete: () => void }) {
  const [step, setStep] = useState(0)
  const { t } = useLanguage()
  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  function handleNext() {
    if (isLast) {
      // Save to localStorage so it doesn't show again
      try {
        localStorage.setItem('onboarding_completed', 'true')
      } catch {}
      onComplete()
      setStep(0)
    } else {
      setStep((s) => s + 1)
    }
  }

  function handleSkip() {
    try {
      localStorage.setItem('onboarding_completed', 'true')
    } catch {}
    onComplete()
    setStep(0)
  }

  function handleBack() {
    if (step > 0) setStep((s) => s - 1)
  }

  const Icon = current.icon

  const colorMap: Record<string, { bg: string; text: string; ring: string }> = {
    primary: { bg: 'bg-primary/15', text: 'text-primary', ring: 'ring-primary/30' },
    rose: { bg: 'bg-rose-500/15', text: 'text-rose-400', ring: 'ring-rose-500/30' },
    amber: { bg: 'bg-amber-500/15', text: 'text-amber-400', ring: 'ring-amber-500/30' },
    blue: { bg: 'bg-blue-500/15', text: 'text-blue-400', ring: 'ring-blue-500/30' },
    success: { bg: 'bg-success/15', text: 'text-success', ring: 'ring-success/30' },
  }
  const colors = colorMap[current.color]

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleSkip()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden glass-strong border-border/50">
        {/* Progress bar */}
        <div className="h-1 bg-muted/50 relative">
          <div
            className="absolute inset-y-0 right-0 bg-primary transition-all duration-500 ease-out"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="p-7">
          {/* Top row: step count + skip */}
          <div className="flex items-center justify-between mb-6">
            <Badge variant="outline" className="font-num text-[10px]">
              {step + 1} / {STEPS.length}
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleSkip} className="text-xs text-muted-foreground hover:text-foreground">
              تخطّي
            </Button>
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-5">
            <div className={`w-20 h-20 rounded-3xl ${colors.bg} ${colors.text} flex items-center justify-center ring-4 ${colors.ring} relative`}>
              <Icon className="w-9 h-9" />
              {isLast && (
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-success text-success-foreground flex items-center justify-center">
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          </div>

          {/* Title + description */}
          <DialogHeader className="text-center mb-5 space-y-2">
            <DialogTitle className="font-display text-2xl">{t(current.title)}</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              {t(current.description)}
            </DialogDescription>
          </DialogHeader>

          {/* Bullets */}
          <div className="space-y-2 mb-7">
            {current.bullets.map((b, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                style={{ animation: `slideIn 0.4s ease-out ${i * 0.08}s both` }}
              >
                <Check className={`w-4 h-4 ${colors.text} flex-shrink-0`} />
                <span className="text-sm">{t(b)}</span>
              </div>
            ))}
          </div>

          {/* Step dots */}
          <div className="flex justify-center gap-1.5 mb-6">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-8 bg-primary' : i < step ? 'w-1.5 bg-primary/50' : 'w-1.5 bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" onClick={handleBack} className="gap-1">
                <ArrowRight className="w-4 h-4" />
                السابق
              </Button>
            )}
            <Button
              onClick={handleNext}
              className="flex-1 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground glow-primary-sm"
            >
              {isLast ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  'onboarding.startTrading'
                </>
              ) : (
                <>
                  التالي
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(8px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </Dialog>
  )
}
