'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { apiCall, fmtEgp, fmtUsdt } from '@/lib/client'
import { Loader2, ShieldCheck, Star, TrendingUp, TrendingDown, Calendar } from 'lucide-react'
import { ReputationDisplay } from './review-form'

type UserProfile = {
  user: {
    id: string
    name: string
    username: string
    memberSince: string
    verified: boolean
    emailVerified: boolean
    phoneVerified: boolean
  }
  reputation: {
    ratingAvg: number
    ratingCount: number
    ratingSum: number
    ratingDistribution: Record<number, number>
    totalTrades: number
  }
  stats: {
    asBuyer: { count: number; volumeUsdt: number; volumeEgp: number }
    asSeller: { count: number; volumeUsdt: number; volumeEgp: number }
  }
  reviews: {
    id: string
    rating: number
    comment: string | null
    createdAt: string
    reviewer: { id: string; name: string; username: string }
    trade: { usdtAmount: number; egpAmount: number; priceEgp: number; createdAt: string }
  }[]
}

type Props = {
  userId: string
  userName: string
  open: boolean
  onOpenChange: (o: boolean) => void
}

export function UserProfileDialog({ userId, userName, open, onOpenChange }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !userId) return
    setLoading(true)
    apiCall<UserProfile>(`/api/p2p/user?userId=${userId}`).then(({ data }) => {
      if (data) setProfile(data)
      setLoading(false)
    })
  }, [open, userId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>ملف المستخدم</DialogTitle>
          <DialogDescription>سمعة وإحصائيات {userName}</DialogDescription>
        </DialogHeader>

        {loading || !profile ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <Avatar className="w-14 h-14">
                <AvatarFallback className="text-xl">
                  {profile.user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">{profile.user.name}</span>
                  {profile.user.verified && (
                    <Badge variant="outline" className="text-emerald-600 border-emerald-300 gap-0.5">
                      <ShieldCheck className="w-3 h-3" />
                      موثّق
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">@{profile.user.username}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3" />
                  عضو منذ {new Date(profile.user.memberSince).toLocaleDateString('ar-EG')}
                </div>
              </div>
            </div>

            {/* Reputation */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-muted/30 p-3 text-center">
                <div className="text-2xl font-bold font-num text-amber-500">
                  {profile.reputation.ratingAvg > 0 ? profile.reputation.ratingAvg.toFixed(1) : '—'}
                </div>
                <div className="text-[10px] text-muted-foreground">متوسط التقييم</div>
              </div>
              <div className="rounded-lg bg-muted/30 p-3 text-center">
                <div className="text-2xl font-bold font-num">{profile.reputation.ratingCount}</div>
                <div className="text-[10px] text-muted-foreground">عدد التقييمات</div>
              </div>
              <div className="rounded-lg bg-muted/30 p-3 text-center">
                <div className="text-2xl font-bold font-num">{profile.reputation.totalTrades}</div>
                <div className="text-[10px] text-muted-foreground">إجمالي الصفقات</div>
              </div>
            </div>

            {/* Rating distribution */}
            {profile.reputation.ratingCount > 0 && (
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground mb-2">توزيع التقييمات</div>
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = profile.reputation.ratingDistribution[star] || 0
                  const pct = profile.reputation.ratingCount > 0 ? (count / profile.reputation.ratingCount) * 100 : 0
                  return (
                    <div key={star} className="flex items-center gap-2 text-xs">
                      <span className="w-3 text-muted-foreground">{star}</span>
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-amber-400" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-6 text-left font-num text-muted-foreground">{count}</span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Trade stats */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border p-3">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <TrendingDown className="w-3 h-3 text-blue-500" />
                  كمشتري
                </div>
                <div className="font-num text-lg font-bold">{profile.stats.asBuyer.count} صفقة</div>
                <div className="text-[10px] text-muted-foreground">
                  حجم تداول: {fmtUsdt(profile.stats.asBuyer.volumeUsdt)} USDT
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                  كبائع
                </div>
                <div className="font-num text-lg font-bold">{profile.stats.asSeller.count} صفقة</div>
                <div className="text-[10px] text-muted-foreground">
                  حجم تداول: {fmtUsdt(profile.stats.asSeller.volumeUsdt)} USDT
                </div>
              </div>
            </div>

            {/* Recent reviews */}
            <div className="space-y-2">
              <div className="text-sm font-medium">آخر التقييمات</div>
              {profile.reviews.length === 0 ? (
                <div className="text-center text-muted-foreground text-xs py-4">
                  لا توجد تقييمات بعد
                </div>
              ) : (
                profile.reviews.slice(0, 10).map((r) => (
                  <div key={r.id} className="rounded-lg border p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{r.reviewer.name}</span>
                        <span className="text-[10px] text-muted-foreground">
                          @{r.reviewer.username}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'}`}
                          />
                        ))}
                      </div>
                    </div>
                    {r.comment && (
                      <div className="text-xs text-muted-foreground italic">&quot;{r.comment}&quot;</div>
                    )}
                    <div className="text-[10px] text-muted-foreground">
                      صفقة {fmtUsdt(r.trade.usdtAmount)} USDT @ {fmtEgp(r.trade.priceEgp)} EGP ·{' '}
                      {new Date(r.createdAt).toLocaleDateString('ar-EG')}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
