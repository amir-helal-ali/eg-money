'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { apiCall, fmtEgp, fmtUsdt, useAuth, showSuccess, showError, PAYMENT_METHODS, methodLabel, methodIcon } from '@/lib/client'
import { useLanguage } from '@/hooks/use-language'
import { useTicker } from '@/hooks/use-ticker'
import { Loader2, ArrowDownToLine, ArrowUpFromLine, Clock, CheckCircle2, XCircle, Copy, Wallet, Coins } from 'lucide-react'
import { DepositModal } from '@/components/deposit-modal'

type Deposit = {
  id: string; amountEgp: number; method: string; reference: string | null;
  status: string; adminNote: string | null; createdAt: string; processedAt: string | null;
}
type Withdrawal = {
  id: string; amountEgp: number; method: string; destination: string;
  status: string; adminNote: string | null; createdAt: string; processedAt: string | null;
}

export function WalletTab() {
  const { user, fetchUser } = useAuth()
  const { t } = useLanguage()
  const { data: ticker } = useTicker()
  const [tab, setTab] = useState('deposit')

  // Deposit form
  const [depAmount, setDepAmount] = useState('')
  const [depMethod, setDepMethod] = useState('VODAFONE_CASH')
  const [depReference, setDepReference] = useState('')
  const [depDialogOpen, setDepDialogOpen] = useState(false)
  const [depSubmitting, setDepSubmitting] = useState(false)
  const [newDepositOpen, setNewDepositOpen] = useState(false)

  // Withdrawal form
  const [wdAmount, setWdAmount] = useState('')
  const [wdMethod, setWdMethod] = useState('VODAFONE_CASH')
  const [wdDestination, setWdDestination] = useState('')
  const [wdSubmitting, setWdSubmitting] = useState(false)

  // Lists
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])

  // Payment methods from DB (managed by admin)
  type PaymentMethodDB = { id: string; name: string; nameAr: string; icon: string; logoUrl: string | null; type: string; active: boolean; sortOrder: number }
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodDB[]>([])

  async function loadDeposits() {
    const { data } = await apiCall<{ deposits: Deposit[] }>('/api/deposits')
    if (data) setDeposits(data.deposits)
  }
  async function loadWithdrawals() {
    const { data } = await apiCall<{ withdrawals: Withdrawal[] }>('/api/withdrawals')
    if (data) setWithdrawals(data.withdrawals)
  }
  async function loadPaymentMethods() {
    const { data } = await apiCall<{ methods: PaymentMethodDB[] }>('/api/payment-methods')
    if (data?.methods) setPaymentMethods(data.methods.filter((m) => m.active))
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDeposits()
     
    loadWithdrawals()
     
    loadPaymentMethods()
    // Auto-refresh history every 20s (so user sees admin approvals live)
    const interval = setInterval(() => {
      loadDeposits()
      loadWithdrawals()
    }, 20000)
    return () => clearInterval(interval)
  }, [])

  // Build platform accounts map from DB payment methods (logoUrl holds the account number)
  const platformAccounts: Record<string, { label: string; value: string; logo: string | null }> = {}
  paymentMethods.forEach((m) => {
    // Use logoUrl as the account number/destination (admin sets this)
    platformAccounts[m.name] = {
      label: m.nameAr || m.name,
      value: m.logoUrl || '—', // admin configures the account number as logoUrl
      logo: m.logoUrl,
    }
  })
  // Fallback: if no DB methods, use old hardcoded values
  if (Object.keys(platformAccounts).length === 0) {
    platformAccounts['VODAFONE_CASH'] = { label: 'فودافون كاش', value: '01000000000', logo: null }
    platformAccounts['INSTAPAY'] = { label: 'إنستا باي', value: 'misrusdt@instapay', logo: null }
    platformAccounts['FAWRY'] = { label: 'فوري', value: '789456', logo: null }
    platformAccounts['BANK_TRANSFER'] = { label: 'تحويل بنكي', value: 'بنك مصر', logo: null }
  }

  // Destination labels per method
  const destinationLabels: Record<string, string> = {
    VODAFONE_CASH: t('paymentMethods.vodafone'),
    INSTAPAY: t('paymentMethods.instapay'),
    FAWRY: t('paymentMethods.fawry'),
    BANK_TRANSFER: t('paymentMethods.bank'),
  }

  async function submitDeposit() {
    if (!depAmount || Number(depAmount) < 100) {
      showError(t('wallet.minDepositError'))
      return
    }
    setDepSubmitting(true)
    const { data, error } = await apiCall('/api/deposits', {
      method: 'POST',
      body: JSON.stringify({
        amountEgp: Number(depAmount),
        method: depMethod,
        reference: depReference,
      }),
    })
    setDepSubmitting(false)
    if (error) {
      showError(error)
      return
    }
    showSuccess(data?.message || t('wallet.deposit'))
    setDepAmount('')
    setDepReference('')
    setDepDialogOpen(false)
    loadDeposits()
  }

  async function submitWithdrawal() {
    if (!wdAmount || Number(wdAmount) < 100) {
      showError(t('wallet.minWithdrawError'))
      return
    }
    if (!wdDestination) {
      showError(t('wallet.destination'))
      return
    }
    if (Number(wdAmount) > (user?.egpBalance || 0)) {
      showError(t('trade.insufficientEgp'))
      return
    }
    setWdSubmitting(true)
    const { data, error } = await apiCall('/api/withdrawals', {
      method: 'POST',
      body: JSON.stringify({
        amountEgp: Number(wdAmount),
        method: wdMethod,
        destination: wdDestination,
      }),
    })
    setWdSubmitting(false)
    if (error) {
      showError(error)
      return
    }
    showSuccess(data?.message || t('wallet.withdraw'))
    setWdAmount('')
    setWdDestination('')
    await fetchUser()
    loadWithdrawals()
  }

  // platformAccounts is built from DB payment methods above (no hardcoded values)

  const livePrice = ticker?.buyPriceEgp ?? 0
  const egpBalance = user?.egpBalance || 0
  const usdtBalance = user?.usdtBalance || 0
  const usdtValueInEgp = livePrice > 0 ? usdtBalance * livePrice : 0
  const totalNetWorthEgp = egpBalance + usdtValueInEgp

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">{t('wallet.title')}</h2>
        <p className="text-muted-foreground text-sm">
          {t('wallet.desc')}
        </p>
      </div>

      {/* Balance summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-primary/80 to-primary/60 text-primary-foreground border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Wallet className="w-4 h-4 opacity-80" />
              <span className="text-[9px] opacity-80 uppercase tracking-wider">EGP</span>
            </div>
            <div className="text-lg font-bold font-num">{fmtEgp(egpBalance)}</div>
            <div className="text-[10px] opacity-80">{t('app.egpBalanceLabel')}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-600/80 to-emerald-700/60 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Coins className="w-4 h-4 opacity-80" />
              <span className="text-[9px] opacity-80 uppercase tracking-wider">USDT</span>
            </div>
            <div className="text-lg font-bold font-num">{fmtUsdt(usdtBalance)}</div>
            <div className="text-[10px] opacity-80">{t('app.usdtBalanceLabel')}</div>
          </CardContent>
        </Card>
        <Card className="glass border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-5 h-5 rounded-md bg-primary/15 text-primary flex items-center justify-center text-[10px] font-bold">₮</div>
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{t('landing.ticker.connected')}</span>
            </div>
            <div className="text-lg font-bold font-num text-primary">
              {livePrice > 0 ? fmtEgp(livePrice) : '—'}
            </div>
            <div className="text-[10px] text-muted-foreground">{t('auth.marketPriceNow')}</div>
          </CardContent>
        </Card>
        <Card className="glass border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{t('app.netWorth')}</span>
            </div>
            <div className="text-lg font-bold font-num text-success">
              {fmtEgp(totalNetWorthEgp)}
            </div>
            <div className="text-[10px] text-muted-foreground">
              ≈ {livePrice > 0 ? fmtUsdt(totalNetWorthEgp / livePrice) : '—'} USDT
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="deposit" className="gap-2">
            <ArrowDownToLine className="w-4 h-4" />
            {t('wallet.deposit')}
          </TabsTrigger>
          <TabsTrigger value="withdraw" className="gap-2">
            <ArrowUpFromLine className="w-4 h-4" />
            {t('wallet.withdraw')}
          </TabsTrigger>
        </TabsList>

        {/* Deposit */}
        <TabsContent value="deposit" className="grid lg:grid-cols-2 gap-6">
          {/* New smart deposit button */}
          <Card className="lg:col-span-2 bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold text-sm">إيداع سريع وذكي</div>
                <div className="text-xs text-muted-foreground">اختر العملة والمبلغ — النظام يختار المحفظة المناسبة تلقائياً</div>
              </div>
              <Button className="gap-2" onClick={() => setNewDepositOpen(true)}>
                <ArrowDownToLine className="w-4 h-4" />
                إيداع جديد
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>طلب {t('wallet.deposit')} جديد</CardTitle>
              <CardDescription>
                اختر طريقة ال{t('wallet.deposit')}، حوّل المبلغ إلى حساب المنصة، ثم ارفع الطلب للمراجعة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>طريقة ال{t('wallet.deposit')}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map((m) => (
                    <label
                      key={m.value}
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                        depMethod === m.value ? 'bg-primary/10 border-primary' : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <input
                        type="radio"
                        checked={depMethod === m.value}
                        onChange={() => setDepMethod(m.value)}
                        className="accent-primary"
                      />
                      <span className="text-sm">
                        {m.icon} {m.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted/50">
                <div className="text-xs text-muted-foreground mb-1">{platformAccounts[depMethod].label}</div>
                <div className="flex items-center justify-between">
                  <code className="text-sm font-mono font-bold">{platformAccounts[depMethod].value}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(platformAccounts[depMethod].value)
                      showSuccess(t('wallet.copy'))
                    }}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('wallet.amount')}</Label>
                <Input
                  type="number"
                  placeholder="100"
                  value={depAmount}
                  onChange={(e) => setDepAmount(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">أقل مبلغ 100 جنيه</p>
              </div>

              <div className="space-y-2">
                <Label>{t('wallet.reference')}</Label>
                <Input
                  placeholder={t('wallet.referencePlaceholder')}
                  value={depReference}
                  onChange={(e) => setDepReference(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">يسرّع عملية التحقق</p>
              </div>

              <Dialog open={depDialogOpen} onOpenChange={setDepDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full" size="lg" disabled={!depAmount || Number(depAmount) < 100}>
                    إرسال طلب ال{t('wallet.deposit')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>تأكيد طلب ال{t('wallet.deposit')}</DialogTitle>
                    <DialogDescription>
                      {t('wallet.confirmDepositDesc')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">المبلغ</span>
                      <span className="font-bold">{fmtEgp(Number(depAmount))} جنيه</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">طريقة ال{t('wallet.deposit')}</span>
                      <span>{methodIcon(depMethod)} {methodLabel(depMethod)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">إلى</span>
                      <code className="font-mono">{platformAccounts[depMethod].value}</code>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDepDialogOpen(false)}>{t('common.cancel')}</Button>
                    <Button onClick={submitDeposit} disabled={depSubmitting}>
                      {depSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      تأكيد الطلب
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>سجل ال{t('wallet.deposit')}ات</CardTitle>
            </CardHeader>
            <CardContent>
              {deposits.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  {t('wallet.noHistory')}
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {deposits.map((d) => (
                    <div key={d.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <div className="font-semibold text-sm">{fmtEgp(d.amountEgp)} جنيه</div>
                        <div className="text-xs text-muted-foreground">
                          {methodIcon(d.method)} {methodLabel(d.method)}
                          {d.reference && ` · ${d.reference}`}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(d.createdAt).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                        {d.adminNote && (
                          <div className="text-xs text-amber-600 mt-1">ملاحظة: {d.adminNote}</div>
                        )}
                      </div>
                      <DepositStatusBadge status={d.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Withdraw */}
        <TabsContent value="withdraw" className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>طلب {t('wallet.withdraw')}</CardTitle>
              <CardDescription>
                {t('wallet.withdrawDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="text-xs text-muted-foreground">رصيدك المتاح</div>
                <div className="text-xl font-bold">{fmtEgp(user?.egpBalance || 0)} جنيه</div>
              </div>

              <div className="space-y-2">
                <Label>طريقة ال{t('wallet.withdraw')}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map((m) => (
                    <label
                      key={m.value}
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                        wdMethod === m.value ? 'bg-primary/10 border-primary' : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <input
                        type="radio"
                        checked={wdMethod === m.value}
                        onChange={() => setWdMethod(m.value)}
                        className="accent-primary"
                      />
                      <span className="text-sm">
                        {m.icon} {m.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>{destinationLabels[wdMethod]}</Label>
                <Input
                  placeholder={destinationLabels[wdMethod]}
                  value={wdDestination}
                  onChange={(e) => setWdDestination(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>{t('wallet.amount')}</Label>
                <Input
                  type="number"
                  placeholder="100"
                  value={wdAmount}
                  onChange={(e) => setWdAmount(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">أقل مبلغ 100 جنيه</p>
              </div>

              <Button
                className="w-full"
                size="lg"
                disabled={!wdAmount || !wdDestination || Number(wdAmount) < 100 || wdSubmitting}
                onClick={submitWithdrawal}
              >
                {wdSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                إرسال طلب ال{t('wallet.withdraw')}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('wallet.withdrawHistory')}</CardTitle>
            </CardHeader>
            <CardContent>
              {withdrawals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  {t('wallet.noHistory')}
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {withdrawals.map((w) => (
                    <div key={w.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <div className="font-semibold text-sm">{fmtEgp(w.amountEgp)} جنيه</div>
                        <div className="text-xs text-muted-foreground">
                          {methodIcon(w.method)} {methodLabel(w.method)}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {w.destination}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(w.createdAt).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                        {w.adminNote && (
                          <div className="text-xs text-amber-600 mt-1">ملاحظة: {w.adminNote}</div>
                        )}
                      </div>
                      <DepositStatusBadge status={w.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Smart deposit modal */}
      <DepositModal open={newDepositOpen} onOpenChange={setNewDepositOpen} />
    </div>
  )
}

function DepositStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: any }> = {
    PENDING: { label: 'PENDING', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400', icon: Clock },
    APPROVED: { label: 'APPROVED', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400', icon: CheckCircle2 },
    REJECTED: { label: 'REJECTED', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400', icon: XCircle },
  }
  const { label, cls, icon: Icon } = map[status] || { label: status, cls: '', icon: Clock }
  return (
    <Badge variant="outline" className={cls}>
      <Icon className="w-3 h-3 ml-1" />
      {label}
    </Badge>
  )
}
