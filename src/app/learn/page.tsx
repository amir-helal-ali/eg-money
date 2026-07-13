'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  ArrowRight, ArrowLeft, Search, Clock, BookOpen, GraduationCap,
  TrendingUp, Shield, DollarSign, AlertTriangle, Users, Scale,
} from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'
import { useLanguage } from '@/hooks/use-language'
import { EDU_ARTICLES, GLOSSARY, type EduLevel, type EduCategory } from '@/lib/edu-content'
import { ProfitCalculator } from '@/components/profit-calculator'

const LEVEL_CONFIG: Record<EduLevel, { ar: string; en: string; color: string }> = {
  beginner: { ar: 'مبتدئ', en: 'Beginner', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' },
  intermediate: { ar: 'متوسط', en: 'Intermediate', color: 'bg-amber-500/10 text-amber-500 border-amber-500/30' },
  advanced: { ar: 'متقدم', en: 'Advanced', color: 'bg-rose-500/10 text-rose-500 border-rose-500/30' },
}

const CATEGORY_CONFIG: Record<EduCategory, { ar: string; en: string; icon: any }> = {
  basics: { ar: 'الأساسيات', en: 'Basics', icon: BookOpen },
  strategy: { ar: 'استراتيجيات', en: 'Strategy', icon: TrendingUp },
  security: { ar: 'الأمان', en: 'Security', icon: Shield },
  economy: { ar: 'اقتصاد', en: 'Economy', icon: DollarSign },
  p2p: { ar: 'P2P', en: 'P2P', icon: Users },
  risk: { ar: 'المخاطر', en: 'Risk', icon: AlertTriangle },
}

export default function LearnPage() {
  const { lang, t } = useLanguage()
  const isAr = lang === 'ar'
  const [search, setSearch] = useState('')
  const [filterLevel, setFilterLevel] = useState<EduLevel | 'all'>('all')
  const [filterCategory, setFilterCategory] = useState<EduCategory | 'all'>('all')
  const [showGlossary, setShowGlossary] = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)

  const filtered = useMemo(() => {
    return EDU_ARTICLES.filter((a) => {
      if (filterLevel !== 'all' && a.level !== filterLevel) return false
      if (filterCategory !== 'all' && a.category !== filterCategory) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        const title = isAr ? a.title.ar : a.title.en
        const excerpt = isAr ? a.excerpt.ar : a.excerpt.en
        return title.toLowerCase().includes(q) || excerpt.toLowerCase().includes(q)
      }
      return true
    })
  }, [search, filterLevel, filterCategory, isAr])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="gap-2"
          >
            {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {isAr ? 'رجوع' : 'Back'}
          </Button>
          <BrandLogo size="sm" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.print()}
            className="gap-2"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">{isAr ? 'طباعة' : 'Print'}</span>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-primary/10 to-transparent">
        <div className="container mx-auto px-4 py-12 max-w-5xl text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/15 text-primary flex items-center justify-center mb-4">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">
            {isAr ? 'أكاديمية التداول' : 'Trading Academy'}
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            {isAr
              ? 'تعلّم التداول من الصفر للاحتراف — مقالات حقيقية، أمثلة عملية، وآلات حاسبة تفاعلية'
              : 'Learn trading from zero to pro — real articles, practical examples, and interactive calculators'}
          </p>

          {/* Quick stats */}
          <div className="flex items-center justify-center gap-6 mt-6 text-xs text-muted-foreground">
            <div>
              <div className="font-num text-xl font-bold text-primary">{EDU_ARTICLES.length}</div>
              <div>{isAr ? 'مقال' : 'Articles'}</div>
            </div>
            <div>
              <div className="font-num text-xl font-bold text-primary">{EDU_ARTICLES.reduce((s, a) => s + a.readTime, 0)}</div>
              <div>{isAr ? 'دقيقة قراءة' : 'min total'}</div>
            </div>
            <div>
              <div className="font-num text-xl font-bold text-primary">{GLOSSARY.length}</div>
              <div>{isAr ? 'مصطلح' : 'Terms'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Tools bar */}
      <div className="border-b bg-card/30">
        <div className="container mx-auto px-4 py-3 max-w-5xl flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCalculator(!showCalculator)}
            className="gap-2"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            {isAr ? 'حاسبة الأرباح' : 'Profit calculator'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowGlossary(!showGlossary)}
            className="gap-2"
          >
            <BookOpen className="w-3.5 h-3.5" />
            {isAr ? 'قاموس المصطلحات' : 'Glossary'}
          </Button>
        </div>
      </div>

      {/* Profit calculator (collapsible) */}
      {showCalculator && (
        <div className="border-b bg-card/30">
          <div className="container mx-auto px-4 py-4 max-w-5xl">
            <ProfitCalculator />
          </div>
        </div>
      )}

      {/* Glossary (collapsible) */}
      {showGlossary && (
        <div className="border-b bg-card/30">
          <div className="container mx-auto px-4 py-4 max-w-5xl">
            <h3 className="font-semibold mb-3 text-sm">{isAr ? 'قاموس المصطلحات' : 'Glossary'}</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {GLOSSARY.map((g, i) => (
                <div key={i} className="rounded-lg border border-border/50 bg-background/50 p-3">
                  <div className="font-semibold text-sm text-primary">{isAr ? g.term.ar : g.term.en}</div>
                  <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {isAr ? g.definition.ar : g.definition.en}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={isAr ? 'ابحث في المقالات...' : 'Search articles...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>

        {/* Level filters */}
        <div className="flex flex-wrap gap-2 mb-3">
          <FilterChip
            active={filterLevel === 'all'}
            onClick={() => setFilterLevel('all')}
            label={isAr ? 'كل المستويات' : 'All levels'}
          />
          {(Object.keys(LEVEL_CONFIG) as EduLevel[]).map((lvl) => (
            <FilterChip
              key={lvl}
              active={filterLevel === lvl}
              onClick={() => setFilterLevel(lvl)}
              label={isAr ? LEVEL_CONFIG[lvl].ar : LEVEL_CONFIG[lvl].en}
            />
          ))}
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <FilterChip
            active={filterCategory === 'all'}
            onClick={() => setFilterCategory('all')}
            label={isAr ? 'كل التصنيفات' : 'All categories'}
          />
          {(Object.keys(CATEGORY_CONFIG) as EduCategory[]).map((cat) => {
            const Icon = CATEGORY_CONFIG[cat].icon
            return (
              <FilterChip
                key={cat}
                active={filterCategory === cat}
                onClick={() => setFilterCategory(cat)}
                label={isAr ? CATEGORY_CONFIG[cat].ar : CATEGORY_CONFIG[cat].en}
                icon={<Icon className="w-3 h-3" />}
              />
            )
          })}
        </div>

        {/* Articles grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {isAr ? 'لا توجد مقالات مطابقة' : 'No matching articles'}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map((article) => {
              const lvlCfg = LEVEL_CONFIG[article.level]
              const catCfg = CATEGORY_CONFIG[article.category]
              const CatIcon = catCfg.icon
              return (
                <a
                  key={article.slug}
                  href={`/learn/${article.slug}`}
                  className="group block"
                >
                  <Card className="h-full hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 hover:translate-y-[-2px]">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">
                          {article.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className={`text-[9px] h-4 px-1.5 ${lvlCfg.color}`}>
                              {isAr ? lvlCfg.ar : lvlCfg.en}
                            </Badge>
                            <Badge variant="outline" className="text-[9px] h-4 px-1.5 gap-0.5">
                              <CatIcon className="w-2.5 h-2.5" />
                              {isAr ? catCfg.ar : catCfg.en}
                            </Badge>
                          </div>
                          <h3 className="font-bold text-sm leading-snug group-hover:text-primary transition-colors">
                            {isAr ? article.title.ar : article.title.en}
                          </h3>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">
                        {isAr ? article.excerpt.ar : article.excerpt.en}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span className="font-num">{article.readTime}</span>
                          {isAr ? 'دقائق' : 'min'}
                        </span>
                        <span className="text-primary group-hover:translate-x-[-2px] transition-transform flex items-center gap-1">
                          {isAr ? 'اقرأ' : 'Read'}
                          {isAr ? <ArrowLeft className="w-3 h-3" /> : <ArrowLeft className="w-3 h-3" />}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </a>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <section className="border-t bg-card/30 py-10">
        <div className="container mx-auto px-4 max-w-5xl text-center">
          <Scale className="w-8 h-8 text-primary mx-auto mb-3" />
          <h3 className="font-bold text-lg mb-1">
            {isAr ? 'جاهز للبدء؟' : 'Ready to start?'}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {isAr
              ? 'ابدأ التداول بثقة بعد تعلم الأساسيات'
              : 'Start trading with confidence after learning the basics'}
          </p>
          <Button onClick={() => window.location.href = '/'} className="gap-2">
            {isAr ? 'ابدأ التداول' : 'Start trading'}
            {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          </Button>
        </div>
      </section>
    </div>
  )
}

function FilterChip({
  active, onClick, label, icon,
}: {
  active: boolean
  onClick: () => void
  label: string
  icon?: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
        active
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
