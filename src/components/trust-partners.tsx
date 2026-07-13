'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ShieldCheck, Lock, FileCheck, Award, Globe2, Building2,
  Bitcoin, CreditCard, Wifi, X, Mail, Check,
} from 'lucide-react'
import { useLanguage } from '@/hooks/use-language'

const TRUST_BADGES = [
  { icon: ShieldCheck, labelAr: 'SSL مشفّر', labelEn: 'SSL Encrypted', subAr: 'TLS 1.3', subEn: 'TLS 1.3' },
  { icon: Lock, labelAr: 'PCI-DSS', labelEn: 'PCI-DSS', subAr: 'متوافق', subEn: 'Compliant' },
  { icon: FileCheck, labelAr: 'AML Policy', labelEn: 'AML Policy', subAr: 'معتمدة', subEn: 'Certified' },
  { icon: Award, labelAr: 'ISO 27001', labelEn: 'ISO 27001', subAr: 'قريباً', subEn: 'Coming soon' },
  { icon: Globe2, labelAr: 'GDPR Ready', labelEn: 'GDPR Ready', subAr: 'خصوصية EU', subEn: 'EU privacy' },
  { icon: Building2, labelAr: 'FRA Compliant', labelEn: 'FRA Compliant', subAr: 'مصر', subEn: 'Egypt' },
]

const PARTNERS = [
  { icon: Bitcoin, labelAr: 'Tether', labelEn: 'Tether', subAr: 'USDT Official', subEn: 'USDT Official' },
  { icon: CreditCard, labelAr: 'Visa', labelEn: 'Visa', subAr: 'بطاقات', subEn: 'Cards' },
  { icon: Wifi, labelAr: 'ميزة', labelEn: 'Meeza', subAr: 'كل المحافظ المصرية', subEn: 'All Egyptian Wallets' },
  { icon: Building2, labelAr: 'فودافون كاش', labelEn: 'Vodafone Cash', subAr: 'محافظ إلكترونية', subEn: 'E-Wallet' },
]

export function TrustPartners() {
  const { lang, t } = useLanguage()
  const isAr = lang === 'ar'

  return (
    <section className="py-12 lg:py-16 border-y border-border/50 bg-card/20">
      <div className="container mx-auto px-4">
        {/* Trust badges */}
        <div className="text-center mb-8">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">
            {t('landing.trust.title1')}
          </h3>
          <p className="text-xs text-muted-foreground/70">{t('landing.trust.sub1')}</p>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-12 max-w-5xl mx-auto">
          {TRUST_BADGES.map((b, i) => {
            const Icon = b.icon
            return (
              <div key={i} className="glass border-border/50 rounded-xl p-3 text-center hover-lift group">
                <div className="w-9 h-9 rounded-lg bg-success/10 text-success flex items-center justify-center mx-auto mb-2 group-hover:bg-success group-hover:text-success-foreground transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-[11px] font-medium">{isAr ? b.labelAr : b.labelEn}</div>
                <div className="text-[9px] text-muted-foreground font-num">{isAr ? b.subAr : b.subEn}</div>
              </div>
            )
          })}
        </div>

        {/* Partners */}
        <div className="text-center mb-6">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">
            {t('landing.trust.title2')}
          </h3>
          <p className="text-xs text-muted-foreground/70">{t('landing.trust.sub2')}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
          {PARTNERS.map((p, i) => {
            const Icon = p.icon
            return (
              <div key={i} className="glass border-border/50 rounded-xl p-4 text-center hover-lift group cursor-pointer">
                <Icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors mx-auto mb-1.5" />
                <div className="text-[11px] font-medium">{isAr ? p.labelAr : p.labelEn}</div>
                <div className="text-[9px] text-muted-foreground">{isAr ? p.subAr : p.subEn}</div>
              </div>
            )
          })}
        </div>

        {/* Supported wallets note */}
        <div className="text-center mt-5">
          <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
            {isAr
              ? 'يدعم ميزة جميع المحافظ الإلكترونية المصرية: فودافون كاش، أورنج موني، إتصالات كاش، و WE Pay'
              : 'Meeza supports all Egyptian e-wallets: Vodafone Cash, Orange Money, Etisalat Cash & WE Pay'}
          </p>
        </div>
      </div>
    </section>
  )
}

// ===== Newsletter signup =====
export function Newsletter() {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setSubmitted(true)
    setEmail('')
    setTimeout(() => setSubmitted(false), 4000)
  }

  return (
    <section className="py-12 lg:py-16 bg-card/30 border-y border-border/50">
      <div className="container mx-auto px-4 max-w-3xl">
        <Card className="glass-strong border-border/50">
          <CardContent className="p-6 lg:p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
                <Mail className="w-7 h-7" />
              </div>
              <div className="flex-1 text-center md:text-right">
                <h3 className="font-display font-bold text-lg mb-1">
                  {t('landing.newsletter.title')}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t('landing.newsletter.subtitle')}
                </p>
              </div>
              <form onSubmit={handleSubmit} className="flex gap-2 w-full md:w-auto">
                <Input
                  type="email"
                  placeholder={t('landing.newsletter.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background/50 w-full md:w-64"
                  required
                />
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                  {submitted ? (
                    <><Check className="w-4 h-4" />{t('landing.newsletter.done')}</>
                  ) : (
                    t('landing.newsletter.subscribe')
                  )}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

// ===== Cookie consent banner =====
export function CookieConsent() {
  const { t } = useLanguage()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const consent = localStorage.getItem('cookie_consent')
      if (!consent) {
        const timer = setTimeout(() => setVisible(true), 1500)
        return () => clearTimeout(timer)
      }
    } catch {}
  }, [])

  function handleAccept() {
    try { localStorage.setItem('cookie_consent', 'accepted') } catch {}
    setVisible(false)
  }

  function handleDecline() {
    try { localStorage.setItem('cookie_consent', 'declined') } catch {}
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50" style={{ animation: 'slideUp 0.4s ease-out' }}>
      <Card className="glass-strong border-border/50 shadow-2xl">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-1">{t('landing.cookie.title')}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                {t('landing.cookie.description')}
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAccept} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 h-8 text-xs">
                  <Check className="w-3.5 h-3.5" />
                  {t('landing.cookie.acceptAll')}
                </Button>
                <Button size="sm" variant="outline" onClick={handleDecline} className="h-8 text-xs">
                  {t('landing.cookie.decline')}
                </Button>
                <Button size="sm" variant="ghost" className="h-8 text-xs text-muted-foreground hover:text-foreground">
                  {t('landing.cookie.details')}
                </Button>
              </div>
            </div>
            <button onClick={handleDecline} className="text-muted-foreground hover:text-foreground" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>
        </CardContent>
      </Card>
      <style jsx>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
