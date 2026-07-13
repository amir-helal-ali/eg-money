'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Check, Clock, Sparkles, Zap,
} from 'lucide-react'

type Milestone = {
  quarter: string
  status: 'done' | 'current' | 'next'
  title: string
  features: string[]
  icon: any
}

const MILESTONES: Milestone[] = [
  {
    quarter: 'Q1 2026',
    status: 'done',
    title: 'الإطلاق الأولي',
    icon: Check,
    features: [
      'منصة تداول مباشر USDT/EGP',
      'سوق P2P بنظام Escrow',
      'إيداع/سحب بـ 4 طرق مصرية',
      'لوحة إدارة كاملة',
    ],
  },
  {
    quarter: 'Q2 2026',
    status: 'current',
    title: 'النمو والتوسع',
    icon: Zap,
    features: [
      'تطبيق موبايل (iOS + Android)',
      'WebSockets للأسعار الحية',
      'نظام إحالة (Referral Program)',
      'دعم BTC و USDC',
    ],
  },
  {
    quarter: 'Q3 2026',
    status: 'next',
    title: 'ميزات متقدمة',
    icon: Sparkles,
    features: [
      'Staking & Earnings',
      'Cross-chain swaps (TRON, BSC, ETH)',
      'API للمطورين والتجار',
      'نظام ولاء (Loyalty tiers)',
    ],
  },
  {
    quarter: 'Q4 2026',
    status: 'next',
    title: 'التوسع الإقليمي',
    icon: Sparkles,
    features: [
      'دعم دول الخليج (UAE, KSA, Kuwait)',
      'فيزاكارد USDT مسبقة الدفع',
      'تكامل مع Shopify و Salla',
      'ATM network في مصر',
    ],
  },
]

const STATUS_CONFIG = {
  done: { color: 'text-success bg-success/10 border-success/20', label: 'منجز', badge: 'default' },
  current: { color: 'text-primary bg-primary/10 border-primary/20', label: 'جاري الآن', badge: 'default' },
  next: { color: 'text-muted-foreground bg-muted/30 border-border/50', label: 'قادم', badge: 'outline' },
} as const

export function Roadmap() {
  return (
    <section className="py-16 lg:py-24 bg-card/30 border-y border-border/50 relative">
      <div className="absolute inset-0 bg-dots opacity-30 pointer-events-none" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <Badge variant="outline" className="mb-4 bg-primary/5 border-primary/20 text-primary">
            <Clock className="w-3 h-3 ml-1" />
            خارطة الطريق
          </Badge>
          <h2 className="font-display text-3xl lg:text-5xl font-bold mb-4 tracking-tight">
            رحلتنا <span className="text-gradient-primary">نحو المستقبل</span>
          </h2>
          <p className="text-muted-foreground text-base lg:text-lg">
            شوف وين كنا ووين رايحين — خطتنا الواضحة لـ 2026
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Vertical line */}
          <div className="absolute right-1/2 translate-x-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-success via-primary to-muted hidden md:block" />

          <div className="space-y-8">
            {MILESTONES.map((m, i) => {
              const cfg = STATUS_CONFIG[m.status]
              const Icon = m.icon
              const isReversed = i % 2 === 1
              return (
                <div
                  key={i}
                  className={`relative flex flex-col md:flex-row gap-4 items-start md:items-center ${
                    isReversed ? 'md:flex-row-reverse' : ''
                  }`}
                >
                  {/* Card */}
                  <Card className={`glass ${cfg.color} border flex-1 max-w-md w-full hover-lift`}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-9 h-9 rounded-lg ${cfg.color} flex items-center justify-center border`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-num text-xs font-bold">{m.quarter}</div>
                            <div className="font-bold text-sm">{m.title}</div>
                          </div>
                        </div>
                        <Badge variant={cfg.badge as any} className="text-[10px]">{cfg.label}</Badge>
                      </div>
                      <ul className="space-y-1.5">
                        {m.features.map((f, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                            {m.status === 'done' ? (
                              <Check className="w-3 h-3 text-success flex-shrink-0 mt-0.5" />
                            ) : (
                              <span className={`w-1 h-1 rounded-full ${m.status === 'current' ? 'bg-primary' : 'bg-muted-foreground'} flex-shrink-0 mt-1.5`} />
                            )}
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Center dot */}
                  <div className="absolute right-1/2 translate-x-1/2 top-5 md:top-1/2 md:-translate-y-1/2 hidden md:block z-10">
                    <div className={`w-4 h-4 rounded-full border-2 border-background ${m.status === 'done' ? 'bg-success' : m.status === 'current' ? 'bg-primary animate-pulse' : 'bg-muted'}`} />
                  </div>

                  {/* Spacer for opposite side */}
                  <div className="hidden md:block flex-1 max-w-md" />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
