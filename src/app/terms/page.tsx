'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/components/brand-logo'
import { useLanguage } from '@/hooks/use-language'
import {
  ArrowRight, ArrowLeft, Printer, Shield, FileText, Scale, AlertTriangle,
  UserCheck, Receipt, Lock, RefreshCw, Gift, Mail, Settings,
} from 'lucide-react'

export default function TermsPage() {
  const { lang, t } = useLanguage()
  const isAr = lang === 'ar'

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = isAr ? 'rtl' : 'ltr'
  }, [lang, isAr])

  const sections = [
    { icon: FileText, title: t('legal.termsAcceptanceTitle'), body: t('legal.termsAcceptanceBody') },
    { icon: UserCheck, title: t('legal.termsEligibilityTitle'), body: t('legal.termsEligibilityBody') },
    { icon: Settings, title: t('legal.termsServicesTitle'), body: t('legal.termsServicesBody') },
    { icon: Shield, title: t('legal.termsKycTitle'), body: t('legal.termsKycBody') },
    { icon: Receipt, title: t('legal.termsFeesTitle'), body: t('legal.termsFeesBody') },
    { icon: AlertTriangle, title: t('legal.termsProhibitedTitle'), body: t('legal.termsProhibitedBody') },
    { icon: Scale, title: t('legal.termsLiabilityTitle'), body: t('legal.termsLiabilityBody') },
    { icon: Lock, title: t('legal.termsAccountTitle'), body: t('legal.termsAccountBody') },
    { icon: Gift, title: t('legal.termsReferralTitle'), body: t('legal.termsReferralBody') },
    { icon: RefreshCw, title: t('legal.termsChangesTitle'), body: t('legal.termsChangesBody') },
    { icon: Mail, title: t('legal.termsContactTitle'), body: t('legal.termsContactBody') },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="gap-2"
            >
              {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              {isAr ? 'رجوع' : 'Back'}
            </Button>
          </div>
          <BrandLogo size="sm" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.print()}
            className="gap-2"
          >
            <Printer className="w-4 h-4" />
            {t('legal.print')}
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-primary/10 to-transparent">
        <div className="container mx-auto px-4 py-12 max-w-4xl text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/15 text-primary flex items-center justify-center mb-4">
            <FileText className="w-8 h-8" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">
            {t('legal.termsTitle')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('legal.lastUpdated')}: <span className="font-num">2026-07-09</span>
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-base leading-relaxed text-muted-foreground mb-8 p-4 rounded-lg bg-muted/30 border-r-4 border-primary">
            {t('legal.termsIntro')}
          </p>

          <div className="space-y-8">
            {sections.map((s, i) => {
              const Icon = s.icon
              return (
                <section key={i} className="space-y-3">
                  <h2 className="flex items-center gap-2 text-xl font-bold">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    {s.title}
                  </h2>
                  <p className="text-sm leading-loose text-muted-foreground pl-10">
                    {s.body}
                  </p>
                </section>
              )
            })}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-12 p-6 rounded-xl bg-muted/30 border border-border/50 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            {isAr ? 'لديك أسئلة إضافية؟' : 'Have additional questions?'}
          </p>
          <a
            href="mailto:support@eg-money.com"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <Mail className="w-4 h-4" />
            support@eg-money.com
          </a>
        </div>
      </main>
    </div>
  )
}
