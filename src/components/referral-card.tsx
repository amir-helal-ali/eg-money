'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog'
import {
  Gift, Copy, Users, Check, TrendingUp, Award, Share2,
} from 'lucide-react'
import { useLanguage } from '@/hooks/use-language'
import { toast } from 'sonner'
import { fmtEgp } from '@/lib/client'

type ReferralData = {
  referralCode: string
  stats: {
    total: number
    completed: number
    pending: number
    totalReward: number
  }
  referrals: {
    id: string
    status: string
    rewardEgp: number
    createdAt: string
    completedAt: string | null
    referred: { name: string; email: string; joinedAt: string }
  }[]
}

export function ReferralCard() {
  const { lang } = useLanguage()
  const [data, setData] = useState<ReferralData | null>(null)
  const [open, setOpen] = useState(false)
  const [referredEmail, setReferredEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const isAr = lang === 'ar'

  const fetchReferrals = useCallback(async () => {
    try {
      const res = await fetch('/api/referrals', { credentials: 'include' })
       
    if (res.ok) setData(await res.json())
    } catch {}
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReferrals()
  }, [fetchReferrals])

  function copyCode() {
    if (!data) return
    const link = `${window.location.origin}/?ref=${data.referralCode}`
    navigator.clipboard.writeText(link)
    toast.success(isAr ? 'تم نسخ رابط الإحالة' : 'Referral link copied')
  }

  async function submitReferral() {
    if (!referredEmail) {
      toast.error(isAr ? 'أدخل بريد المستخدم' : 'Enter user email')
      return
    }
    setLoading(true)
    const res = await fetch('/api/referrals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referredEmail }),
      credentials: 'include',
    })
    setLoading(false)
    const result = await res.json()
    if (res.ok) {
      toast.success(result.message)
      setOpen(false)
      setReferredEmail('')
      fetchReferrals()
    } else {
      toast.error(result.error || 'Error')
    }
  }

  if (!data) return null

  return (
    <Card className="glass border-border/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">
              {isAr ? 'نظام الإحالة' : 'Referral Program'}
            </span>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-7 gap-1 text-xs">
                <Users className="w-3 h-3" />
                {isAr ? 'دعوة صديق' : 'Invite Friend'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm glass-strong border-border/50">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-primary" />
                  {isAr ? 'ادعُ صديقاً واربح 50 جنيه' : 'Invite a friend, earn 50 EGP'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isAr
                    ? 'اكسب 50 جنيه عن كل صديق يدعوه ويقوم بأول إيداع أو صفقة. شارك رابط الإحالة أو أدخل بريد صديقك مباشرة.'
                    : 'Earn 50 EGP for each friend who joins and makes their first deposit or trade. Share your referral link or enter your friend\'s email directly.'}
                </p>
                {/* Referral link */}
                <div>
                  <Label2>{isAr ? 'رابط الإحالة' : 'Referral Link'}</Label2>
                  <div className="flex gap-2 mt-1">
                    <Input
                      readOnly
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/?ref=${data.referralCode}`}
                      className="font-num text-xs"
                    />
                    <Button size="sm" variant="outline" onClick={copyCode} className="gap-1">
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                {/* Direct referral */}
                <div className="pt-2 border-t border-border/50">
                  <Label2>{isAr ? 'أو أدخل بريد صديقك' : 'Or enter friend\'s email'}</Label2>
                  <Input
                    type="email"
                    placeholder="friend@example.com"
                    value={referredEmail}
                    onChange={(e) => setReferredEmail(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)} className="text-xs">
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button onClick={submitReferral} disabled={loading} className="text-xs gap-1">
                  {loading ? null : <Check className="w-3 h-3" />}
                  {isAr ? 'إرسال' : 'Submit'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <StatBox
            icon={Users}
            value={data.stats.total}
            label={isAr ? 'إجمالي' : 'Total'}
            color="text-blue-400"
          />
          <StatBox
            icon={Check}
            value={data.stats.completed}
            label={isAr ? 'مكتمل' : 'Completed'}
            color="text-success"
          />
          <StatBox
            icon={Award}
            value={fmtEgp(data.stats.totalReward)}
            label={isAr ? 'جنيه مكافآت' : 'EGP earned'}
            color="text-primary"
          />
        </div>

        {/* Referral code */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-primary/5 border border-primary/20">
          <div>
            <div className="text-[10px] text-muted-foreground">
              {isAr ? 'كود الإحالة' : 'Referral Code'}
            </div>
            <div className="font-num font-bold text-primary text-sm">{data.referralCode}</div>
          </div>
          <Button size="sm" variant="ghost" onClick={copyCode} className="h-7 gap-1 text-xs">
            <Share2 className="w-3 h-3" />
            {isAr ? 'مشاركة' : 'Share'}
          </Button>
        </div>

        {/* Recent referrals */}
        {data.referrals.length > 0 && (
          <div className="mt-3 space-y-1.5 max-h-[120px] overflow-y-auto">
            {data.referrals.slice(0, 5).map(r => (
              <div key={r.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {r.referred.name[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate">{r.referred.name}</div>
                    <div className="text-[9px] text-muted-foreground truncate">{r.referred.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {r.rewardEgp > 0 && (
                    <span className="font-num text-xs font-bold text-success">+{fmtEgp(r.rewardEgp)}</span>
                  )}
                  <Badge
                    variant="outline"
                    className={`text-[9px] h-4 px-1 ${
                      r.status === 'REWARDED' ? 'bg-success/10 text-success' :
                      r.status === 'COMPLETED' ? 'bg-primary/10 text-primary' :
                      'bg-amber-500/10 text-amber-400'
                    }`}
                  >
                    {r.status === 'REWARDED' ? (isAr ? 'مكافأة' : 'Rewarded') :
                     r.status === 'COMPLETED' ? (isAr ? 'مكتمل' : 'Completed') :
                     (isAr ? 'معلّق' : 'Pending')}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function StatBox({ icon: Icon, value, label, color }: { icon: any; value: any; label: string; color: string }) {
  return (
    <div className="p-2 rounded-lg bg-muted/20 text-center">
      <Icon className={`w-3.5 h-3.5 mx-auto mb-1 ${color}`} />
      <div className={`font-num text-sm font-bold ${color}`}>{value}</div>
      <div className="text-[9px] text-muted-foreground">{label}</div>
    </div>
  )
}

function Label2({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-medium text-muted-foreground">{children}</label>
}
