'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useTicker } from '@/hooks/use-ticker'
import { useLanguage } from '@/hooks/use-language'
import { Calculator, TrendingUp, TrendingDown } from 'lucide-react'

export function ProfitCalculator() {
  const { data: ticker } = useTicker()
  const { lang } = useLanguage()
  const isAr = lang === 'ar'

  const [amount, setAmount] = useState('1000')
  const [buyPrice, setBuyPrice] = useState('')
  const [sellPrice, setSellPrice] = useState('')
  const [feePercent, setFeePercent] = useState('0.3')

  // Use live price as default for buy price
  const effectiveBuyPrice = buyPrice || (ticker?.buyPriceEgp?.toString() ?? '50')
  const effectiveSellPrice = sellPrice || (ticker?.sellPriceEgp?.toString() ?? '50')

  const calc = useMemo(() => {
    const amt = parseFloat(amount) || 0
    const bp = parseFloat(effectiveBuyPrice) || 0
    const sp = parseFloat(effectiveSellPrice) || 0
    const fee = parseFloat(feePercent) || 0

    if (amt <= 0 || bp <= 0 || sp <= 0) {
      return null
    }

    const costEgp = amt * bp
    const feeEgp = costEgp * (fee / 100)
    const totalCost = costEgp + feeEgp
    const revenue = amt * sp
    const profit = revenue - totalCost
    const profitPercent = (profit / totalCost) * 100

    return {
      costEgp,
      feeEgp,
      totalCost,
      revenue,
      profit,
      profitPercent,
    }
  }, [amount, effectiveBuyPrice, effectiveSellPrice, feePercent])

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

  return (
    <Card className="glass border-border/50">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
            <Calculator className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm sm:text-base">
            {isAr ? 'حاسبة أرباح التداول' : 'Trading profit calculator'}
          </h3>
          {ticker && (
            <Badge variant="outline" className="text-[9px] gap-1 ml-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              {isAr ? 'سعر مباشر' : 'Live price'}
            </Badge>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <div className="space-y-1.5">
            <Label className="text-xs">{isAr ? 'كمية USDT' : 'USDT amount'}</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1000"
              className="font-num"
              dir="ltr"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{isAr ? 'سعر الشراء (EGP)' : 'Buy price (EGP)'}</Label>
            <Input
              type="number"
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              placeholder={ticker?.buyPriceEgp?.toString() ?? '50'}
              className="font-num"
              dir="ltr"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{isAr ? 'سعر البيع (EGP)' : 'Sell price (EGP)'}</Label>
            <Input
              type="number"
              value={sellPrice}
              onChange={(e) => setSellPrice(e.target.value)}
              placeholder={ticker?.sellPriceEgp?.toString() ?? '50'}
              className="font-num"
              dir="ltr"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{isAr ? 'الرسوم (%)' : 'Fee (%)'}</Label>
            <Input
              type="number"
              value={feePercent}
              onChange={(e) => setFeePercent(e.target.value)}
              placeholder="0.3"
              className="font-num"
              dir="ltr"
            />
          </div>
        </div>

        {calc ? (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-muted/30 p-2.5">
                <div className="text-muted-foreground">{isAr ? 'تكلفة الشراء' : 'Buy cost'}</div>
                <div className="font-num font-semibold mt-0.5">{fmt(calc.costEgp)} EGP</div>
              </div>
              <div className="rounded-lg bg-muted/30 p-2.5">
                <div className="text-muted-foreground">{isAr ? 'الرسوم' : 'Fee'}</div>
                <div className="font-num font-semibold mt-0.5">{fmt(calc.feeEgp)} EGP</div>
              </div>
              <div className="rounded-lg bg-muted/30 p-2.5">
                <div className="text-muted-foreground">{isAr ? 'إجمالي التكلفة' : 'Total cost'}</div>
                <div className="font-num font-semibold mt-0.5">{fmt(calc.totalCost)} EGP</div>
              </div>
              <div className="rounded-lg bg-muted/30 p-2.5">
                <div className="text-muted-foreground">{isAr ? 'إيراد البيع' : 'Sell revenue'}</div>
                <div className="font-num font-semibold mt-0.5">{fmt(calc.revenue)} EGP</div>
              </div>
            </div>
            <div
              className={`rounded-lg p-3 flex items-center justify-between ${
                calc.profit >= 0
                  ? 'bg-emerald-500/10 border border-emerald-500/30'
                  : 'bg-rose-500/10 border border-rose-500/30'
              }`}
            >
              <div className="flex items-center gap-2">
                {calc.profit >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-rose-500" />
                )}
                <span className="text-sm font-medium">
                  {isAr ? (calc.profit >= 0 ? 'الربح' : 'الخسارة') : calc.profit >= 0 ? 'Profit' : 'Loss'}
                </span>
              </div>
              <div className="text-right">
                <div className={`font-num font-bold text-lg ${calc.profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {calc.profit >= 0 ? '+' : ''}{fmt(calc.profit)} EGP
                </div>
                <div className={`text-[10px] font-num ${calc.profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {calc.profit >= 0 ? '+' : ''}{calc.profitPercent.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-xs text-muted-foreground py-4">
            {isAr ? 'أدخل قيم لحساب الربح' : 'Enter values to calculate profit'}
          </div>
        )}

        <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">
          {isAr
            ? '⚠️ هذه الحاسبة للأغراض التعليمية فقط. الأسعار الفعلية قد تختلف. الأرباح/الخسائر ليست مضمونة.'
            : '⚠️ This calculator is for educational purposes only. Actual prices may vary. Profits/losses are not guaranteed.'}
        </p>
      </CardContent>
    </Card>
  )
}
