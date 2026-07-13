'use client'

import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  ArrowRight, ArrowLeft, Clock, AlertTriangle, Lightbulb, Calculator, TrendingUp,
} from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'
import { useLanguage } from '@/hooks/use-language'
import { EDU_ARTICLES, type EduBlock, type EduLevel, type EduCategory } from '@/lib/edu-content'

const LEVEL_CONFIG: Record<EduLevel, { ar: string; en: string; color: string }> = {
  beginner: { ar: 'مبتدئ', en: 'Beginner', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' },
  intermediate: { ar: 'متوسط', en: 'Intermediate', color: 'bg-amber-500/10 text-amber-500 border-amber-500/30' },
  advanced: { ar: 'متقدم', en: 'Advanced', color: 'bg-rose-500/10 text-rose-500 border-amber-500/30' },
}

const CATEGORY_CONFIG: Record<EduCategory, { ar: string; en: string }> = {
  basics: { ar: 'الأساسيات', en: 'Basics' },
  strategy: { ar: 'استراتيجيات', en: 'Strategy' },
  security: { ar: 'الأمان', en: 'Security' },
  economy: { ar: 'اقتصاد', en: 'Economy' },
  p2p: { ar: 'P2P', en: 'P2P' },
  risk: { ar: 'المخاطر', en: 'Risk' },
}

export default function ArticlePage() {
  const params = useParams()
  const slug = params.slug as string
  const { lang } = useLanguage()
  const isAr = lang === 'ar'

  const article = useMemo(() => EDU_ARTICLES.find((a) => a.slug === slug), [slug])
  const relatedArticles = useMemo(() => {
    if (!article) return []
    return EDU_ARTICLES
      .filter((a) => a.slug !== slug && (a.category === article.category || a.level === article.level))
      .slice(0, 3)
  }, [article, slug])

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">{isAr ? 'المقال غير موجود' : 'Article not found'}</p>
        <Button onClick={() => window.location.href = '/learn'} className="gap-2">
          <ArrowRight className="w-4 h-4" />
          {isAr ? 'العودة للأكاديمية' : 'Back to academy'}
        </Button>
      </div>
    )
  }

  const blocks = isAr ? article.content.ar : article.content.en
  const lvlCfg = LEVEL_CONFIG[article.level]
  const catCfg = CATEGORY_CONFIG[article.category]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.href = '/learn'}
            className="gap-2"
          >
            {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {isAr ? 'الأكاديمية' : 'Academy'}
          </Button>
          <BrandLogo size="sm" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.print()}
            className="gap-2"
          >
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">{isAr ? 'طباعة' : 'Print'}</span>
          </Button>
        </div>
      </header>

      {/* Article hero */}
      <section className="border-b bg-gradient-to-b from-primary/10 to-transparent">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline" className={`text-[10px] ${lvlCfg.color}`}>
              {isAr ? lvlCfg.ar : lvlCfg.en}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {isAr ? catCfg.ar : catCfg.en}
            </Badge>
            <Badge variant="outline" className="text-[10px] gap-1">
              <Clock className="w-2.5 h-2.5" />
              <span className="font-num">{article.readTime}</span>
              {isAr ? 'دقائق' : 'min'}
            </Badge>
          </div>
          <div className="flex items-start gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl flex-shrink-0">
              {article.icon}
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold leading-tight">
              {isAr ? article.title.ar : article.title.en}
            </h1>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {isAr ? article.excerpt.ar : article.excerpt.en}
          </p>
        </div>
      </section>

      {/* Article body */}
      <article className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="prose prose-sm dark:prose-invert max-w-none space-y-4">
          {blocks.map((block, i) => (
            <BlockRenderer key={i} block={block} />
          ))}
        </div>

        {/* Article footer */}
        <div className="mt-10 pt-6 border-t border-border/50 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => window.location.href = '/learn'}
            className="gap-2"
          >
            {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {isAr ? 'كل المقالات' : 'All articles'}
          </Button>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <BrandLogo size="sm" />
            <span>Eg-Money {isAr ? 'أكاديمية' : 'Academy'}</span>
          </div>
        </div>
      </article>

      {/* Related articles */}
      {relatedArticles.length > 0 && (
        <section className="border-t bg-card/30 py-8">
          <div className="container mx-auto px-4 max-w-3xl">
            <h3 className="font-bold text-base mb-4">
              {isAr ? 'مقالات ذات صلة' : 'Related articles'}
            </h3>
            <div className="grid sm:grid-cols-3 gap-3">
              {relatedArticles.map((rel) => (
                <a
                  key={rel.slug}
                  href={`/learn/${rel.slug}`}
                  className="group block"
                >
                  <Card className="h-full hover:border-primary/40 transition-colors">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{rel.icon}</span>
                        <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
                          {isAr ? CATEGORY_CONFIG[rel.category].ar : CATEGORY_CONFIG[rel.category].en}
                        </span>
                      </div>
                      <div className="text-xs font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                        {isAr ? rel.title.ar : rel.title.en}
                      </div>
                      <div className="text-[9px] text-muted-foreground mt-2 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        <span className="font-num">{rel.readTime}</span>
                        {isAr ? 'دقائق' : 'min'}
                      </div>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

function BlockRenderer({ block }: { block: EduBlock }) {
  switch (block.type) {
    case 'heading':
      return (
        <h2 className="font-display text-lg sm:text-xl font-bold mt-6 mb-2 flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-primary" />
          {block.text}
        </h2>
      )

    case 'paragraph':
      return (
        <p className="text-sm sm:text-base text-foreground/90 leading-relaxed">
          {block.text}
        </p>
      )

    case 'list':
      return (
        <ul className="space-y-1.5 my-3">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm sm:text-base text-foreground/90 leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      )

    case 'example':
      return (
        <div className="my-4 rounded-xl border border-blue-500/30 bg-blue-500/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-500 flex items-center justify-center">
              <Lightbulb className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-500">
              {block.title}
            </span>
          </div>
          <p className="text-sm text-foreground/90 leading-relaxed">{block.body}</p>
        </div>
      )

    case 'calculation':
      return (
        <div className="my-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
              <Calculator className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              {block.title}
            </span>
          </div>
          <div className="space-y-1.5 mb-3">
            {block.lines.map((line, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-border/30 last:border-0">
                <span className="text-muted-foreground">{line.label}</span>
                <span className="font-num font-medium text-foreground">{line.value}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-primary/20">
            <TrendingUp className="w-4 h-4 text-success flex-shrink-0" />
            <span className="text-sm font-semibold text-success">{block.result}</span>
          </div>
        </div>
      )

    case 'warning':
      return (
        <div className="my-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-foreground/90 leading-relaxed">{block.text}</p>
        </div>
      )

    case 'tip':
      return (
        <div className="my-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-foreground/90 leading-relaxed">{block.text}</p>
        </div>
      )

    default:
      return null
  }
}
