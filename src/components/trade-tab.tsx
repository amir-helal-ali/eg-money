'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { apiCall, fmtEgp, fmtUsdt, useAuth, showSuccess, showError } from '@/lib/client'
import { useLanguage } from '@/hooks/use-language'
import { useTicker } from '@/hooks/use-ticker'
import { Loader2, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export function TradeTab() {
  const { user, settings, fetchUser, fetchSettings } = useAuth()
  const { t } = useLanguage()
  const { data: ticker } = useTicker()
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const [mode, setMode] = useState<'BUY' | 'SELL'>('BUY')
  const [usdtInput, setUsdtInput] = useState('')
  const [egpInput, setEgpInput] = useState('')

  useEffect(() => {
    if (!settings) fetchSettings()
  }, [settings, fetchSettings])

  // Live prices from live market (unified across the platform)
  const buyPrice = ticker?.buyPriceEgp ?? 0
  const sellPrice = ticker?.sellPriceEgp ?? 0
  const price = mode === 'BUY' ? buyPrice : sellPrice
  const feePercent = settings?.platformFeePercent || 0

  // Compute derived amounts
  const usdtAmount = usdtInput ? Number(usdtInput) : 0
  const egpAmount = egpInput ? Number(egpInput) : 0
  const derivedEgp = mode === 'BUY'
    ? usdtAmount * buyPrice
    : usdtAmount * sellPrice
  const derivedUsdt = mode === 'BUY'
    ? egpAmount / buyPrice
    : egpAmount / sellPrice
  const fee = (usdtInput ? derivedEgp : egpAmount) * (feePercent / 100)
  const total = (usdtInput ? derivedEgp : egpAmount) + (mode === 'BUY' ? fee : 0)

  function switchMode(m: 'BUY' | 'SELL') {
    setMode(m)
    setUsdtInput('')
    setEgpInput('')
  }

  async function handleTrade() {
    if (!user) return
    setLoading(true)
    const payload: any = { type: mode }
    if (usdtInput) payload.usdtAmount = usdtInput
    else if (egpInput) payload.egpAmount = egpInput
    else {
      showError(t('trade.specifyAmount'))
      setLoading(false)
      return
    }

    const { data, error } = await apiCall('/api/trades', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    setLoading(false)
    setConfirmOpen(false)
    if (error) {
      showError(error)
      return
    }
    showSuccess(data?.message || t('common.success'))
    setUsdtInput('')
    setEgpInput('')
    await fetchUser()
  }

  const balanceUsdt = user?.usdtBalance || 0
  const balanceEgp = user?.egpBalance || 0
  const effectiveEgp = usdtInput ? derivedEgp : egpAmount
  const insufficient = mode === 'BUY'
    ? balanceEgp < total
    : balanceUsdt < usdtAmount

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Trade form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5" />
                {t('trade.title')}
              </CardTitle>
              <CardDescription>
                {t('trade.desc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={mode} onValueChange={(v) => switchMode(v as 'BUY' | 'SELL')}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="BUY" className="gap-2">
                    <TrendingUp className="w-4 h-4" />
                    شراء USDT
                  </TabsTrigger>
                  <TabsTrigger value="SELL" className="gap-2">
                    <TrendingDown className="w-4 h-4" />
                    بيع USDT
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="BUY" className="space-y-4">
                  <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">{t('trade.buyPrice')}</div>
                      <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                        {fmtEgp(buyPrice)} <span className="text-sm font-normal">EGP/USDT</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400">
                      {t('trade.fee')} {feePercent}%
                    </Badge>
                  </div>
                </TabsContent>

                <TabsContent value="SELL" className="space-y-4">
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">{t('trade.sellPrice')}</div>
                      <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {fmtEgp(sellPrice)} <span className="text-sm font-normal">EGP/USDT</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                      {t('trade.fee')} {feePercent}%
                    </Badge>
                  </div>
                </TabsContent>

                <div className="grid md:grid-cols-2 gap-4 mt-2">
                  <div className="space-y-2">
                    <Label htmlFor="usdt">{t('trade.amount')}</Label>
                    <Input
                      id="usdt"
                      type="number"
                      placeholder="0.00"
                      value={usdtInput}
                      onChange={(e) => {
                        setUsdtInput(e.target.value)
                        setEgpInput('')
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="egp">{t('trade.egpAmount')}</Label>
                    <Input
                      id="egp"
                      type="number"
                      placeholder="0.00"
                      value={egpInput}
                      onChange={(e) => {
                        setEgpInput(e.target.value)
                        setUsdtInput('')
                      }}
                    />
                  </div>
                </div>

                {/* Summary */}
                <div className="mt-6 space-y-2 text-sm border-t pt-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">سعر الوحدة</span>
                    <span className="font-medium">{fmtEgp(price)} جنيه</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الكمية</span>
                    <span className="font-medium">{fmtUsdt(usdtInput ? usdtAmount : derivedUsdt)} USDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المبلغ قبل الرسوم</span>
                    <span className="font-medium">{fmtEgp(usdtInput ? derivedEgp : egpAmount)} جنيه</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الرسوم ({feePercent}%)</span>
                    <span className="font-medium text-rose-600 dark:text-rose-400">{fmtEgp(fee)} EGP</span>
                  </div>
                  <div className="flex justify-between text-base font-bold border-t pt-2">
                    <span>{mode === 'BUY' ? t('trade.totalDeducted') : t('trade.netAdded')}</span>
                    <span className={mode === 'BUY' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                      {fmtEgp(mode === 'BUY' ? total : effectiveEgp - fee)} EGP
                    </span>
                  </div>
                </div>

                <Button
                  className="w-full mt-6"
                  size="lg"
                  disabled={loading || (!usdtInput && !egpInput) || insufficient}
                  onClick={() => setConfirmOpen(true)}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {mode === 'BUY' ? t('trade.buyBtn') : t('trade.sellBtn')}
                </Button>
                {insufficient && (usdtInput || egpInput) && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 text-center mt-2">
                    {mode === 'BUY' ? t('trade.insufficientEgp') : t('trade.insufficientUsdt')}
                  </p>
                )}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar info */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('trade.balanceTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">جنيه مصري</span>
                <span className="font-bold">{fmtEgp(balanceEgp)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">USDT</span>
                <span className="font-bold">{fmtUsdt(balanceUsdt)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('trade.howTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">١</span>
                  <span>{t('trade.step1')}</span>
                </li>
                <li className="flex gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">٢</span>
                  <span>{t('trade.step2')}</span>
                </li>
                <li className="flex gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">٣</span>
                  <span>{t('trade.step3')}</span>
                </li>
                <li className="flex gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">٤</span>
                  <span>{t('trade.step4')}</span>
                </li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirm dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('trade.confirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {mode === 'BUY' ? t('trade.buy') : t('trade.sell')}{' '}
              {fmtUsdt(usdtInput ? usdtAmount : derivedUsdt)} USDT @ {fmtEgp(price)} EGP/USDT
              <br />
              {mode === 'BUY'
                ? `${fmtEgp(total)} EGP`
                : `${fmtEgp(effectiveEgp - fee)} EGP`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleTrade} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              تأكيد
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// End of component
