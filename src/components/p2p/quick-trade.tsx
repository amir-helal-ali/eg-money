'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { apiCall, fmtEgp, fmtUsdt, useAuth, showSuccess, showError } from '@/lib/client'
import { Users, TrendingUp, TrendingDown, Zap, ArrowRight, Star } from 'lucide-react'

type QuickOffer = {
  id: string
  type: 'BUY' | 'SELL'
  usdtAmount: number
  priceEgp: number
  paymentMethods: string[]
  user: {
    id: string
    name: string
    tradesCount: number
    ratingAvg: number
    ratingCount: number
    verified: boolean
  }
}

function goP2p() {
  // Switch to the P2P tab (handled by AppView in src/app/page.tsx)
  window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'p2p' }))
}

/**
 * Quick-trade widget — surfaces the best (lowest-price) SELL offer and the
 * best (highest-price) BUY offer so users can act with one click from the
 * dashboard without navigating to the P2P market.
 */
export function P2pQuickTrade() {
  const { user } = useAuth()
  const [bestSell, setBestSell] = useState<QuickOffer | null>(null)
  const [bestBuy, setBestBuy] = useState<QuickOffer | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    // Fetch best SELL (lowest price = best for buyer)
    const { data: sellData } = await apiCall<{ offers: QuickOffer[] }>('/api/p2p/offers?type=SELL&sort=price_asc')
    if (sellData?.offers && sellData.offers.length > 0) {
      const filtered = sellData.offers.filter((o) => o.user.id !== user?.id)
      setBestSell(filtered[0] || null)
    } else {
      setBestSell(null)
    }

    // Fetch best BUY (highest price = best for seller)
    const { data: buyData } = await apiCall<{ offers: QuickOffer[] }>('/api/p2p/offers?type=BUY&sort=price_desc')
    if (buyData?.offers && buyData.offers.length > 0) {
      const filtered = buyData.offers.filter((o) => o.user.id !== user?.id)
      setBestBuy(filtered[0] || null)
    } else {
      setBestBuy(null)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000) // refresh every 30s
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            سوق P2P — أفضل العروض
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1 h-7"
            onClick={goP2p}
          >
            عرض الكل
            <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="text-center py-6 text-muted-foreground text-sm">جاري التحميل...</div>
        ) : !bestSell && !bestBuy ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>لا توجد عروض P2P نشطة حالياً</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={goP2p}
            >
              كن أول من ينشر عرضاً
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Best SELL offer (for buyers) */}
            <div className="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  <TrendingDown className="w-3.5 h-3.5" />
                  أفضل سعر بيع
                </div>
                <Badge variant="outline" className="text-[9px] text-emerald-600 border-emerald-300">
                  للمشتري
                </Badge>
              </div>
              {bestSell ? (
                <button
                  className="w-full text-right hover:bg-emerald-50/50 dark:hover:bg-emerald-950/40 rounded p-1 -m-1 transition-colors"
                  onClick={goP2p}
                >
                  <div className="text-2xl font-bold font-num text-emerald-700 dark:text-emerald-400">
                    {fmtEgp(bestSell.priceEgp)}
                    <span className="text-xs text-muted-foreground font-normal mr-1">EGP/USDT</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {fmtUsdt(bestSell.usdtAmount)} USDT متاح
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-[10px] text-muted-foreground">
                    <span>{bestSell.user.name}</span>
                    {bestSell.user.verified && <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />}
                    <span>· {bestSell.user.tradesCount} صفقة</span>
                  </div>
                </button>
              ) : (
                <div className="text-sm text-muted-foreground py-2">لا يوجد</div>
              )}
            </div>

            {/* Best BUY offer (for sellers) */}
            <div className="rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-400">
                  <TrendingUp className="w-3.5 h-3.5" />
                  أفضل سعر شراء
                </div>
                <Badge variant="outline" className="text-[9px] text-blue-600 border-blue-300">
                  للبائع
                </Badge>
              </div>
              {bestBuy ? (
                <button
                  className="w-full text-right hover:bg-blue-50/50 dark:hover:bg-blue-950/40 rounded p-1 -m-1 transition-colors"
                  onClick={goP2p}
                >
                  <div className="text-2xl font-bold font-num text-blue-700 dark:text-blue-400">
                    {fmtEgp(bestBuy.priceEgp)}
                    <span className="text-xs text-muted-foreground font-normal mr-1">EGP/USDT</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    يريد {fmtUsdt(bestBuy.usdtAmount)} USDT
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-[10px] text-muted-foreground">
                    <span>{bestBuy.user.name}</span>
                    {bestBuy.user.verified && <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />}
                    <span>· {bestBuy.user.tradesCount} صفقة</span>
                  </div>
                </button>
              ) : (
                <div className="text-sm text-muted-foreground py-2">لا يوجد</div>
              )}
            </div>
          </div>
        )}

        {/* CTA buttons */}
        {!loading && (bestSell || bestBuy) && (
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              variant="default"
              className="flex-1 gap-1.5"
              onClick={goP2p}
            >
              <Zap className="w-3.5 h-3.5" />
              تداول الآن
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={goP2p}
            >
              + إنشاء عرض
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
