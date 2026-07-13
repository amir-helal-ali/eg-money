'use client'

import { useState, useRef } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { apiCall, useAuth, showSuccess, showError } from '@/lib/client'
import { useLanguage } from '@/hooks/use-language'
import {
  ArrowDownToLine, ArrowLeft, ArrowRight, Check, Loader2, Copy,
  Wallet, Upload, Phone, Shield, AlertCircle, CheckCircle2, ImageIcon,
} from 'lucide-react'
import { toast } from 'sonner'

type Step = 'currency' | 'method' | 'confirm' | 'payment' | 'receipt' | 'done'

type AssignedWallet = {
  id: string
  method: string
  number: string
  holderName: string | null
  label: string | null
  dailyLimit: number
  monthlyLimit: number
  remainingDaily: number
  remainingMonthly: number
}

type DepositResult = {
  deposit: { id: string; amountEgp: number; method: string; status: string }
  wallet: AssignedWallet
}

const METHOD_INFO: Record<string, { label: string; icon: string; desc: string }> = {
  VODAFONE_CASH: { label: 'فودافون كاش', icon: '📱', desc: 'تحويل فوري عبر فودافون كاش' },
  INSTAPAY: { label: 'إنستا باي', icon: '⚡', desc: 'تحويل بنكي فوري عبر إنستا باي' },
  FAWRY: { label: 'فوري', icon: '🏪', desc: 'إيداع نقدي في أي فرع فوري' },
  BANK_TRANSFER: { label: 'تحويل بنكي', icon: '🏦', desc: 'تحويل بنكي تقليدي' },
}

export function DepositModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { fetchUser } = useAuth()
  const { t } = useLanguage()
  const [step, setStep] = useState<Step>('currency')
  const [loading, setLoading] = useState(false)

  // Form data
  const [currency, setCurrency] = useState<'EGP' | 'USDT'>('EGP')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('')

  // Deposit result (with assigned wallet)
  const [depositResult, setDepositResult] = useState<DepositResult | null>(null)

  // Receipt
  const [senderNumber, setSenderNumber] = useState('')
  const [receiptImage, setReceiptImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function reset() {
    setStep('currency')
    setCurrency('EGP')
    setAmount('')
    setMethod('')
    setDepositResult(null)
    setSenderNumber('')
    setReceiptImage(null)
  }

  function handleClose(o: boolean) {
    if (!o) reset()
    onOpenChange(o)
  }

  // Step 1 → 2: proceed from currency/amount to method selection
  function proceedToMethod() {
    const amt = Number(amount)
    if (!amt || amt < 100) {
      toast.error('أقل مبلغ للإيداع هو 100 جنيه')
      return
    }
    setStep('method')
  }

  // Step 2 → 3: proceed from method to confirmation
  function proceedToConfirm() {
    if (!method) {
      toast.error('اختر طريقة الدفع')
      return
    }
    setStep('confirm')
  }

  // Step 3 → 4: create deposit + get assigned wallet
  async function createDeposit() {
    setLoading(true)
    const { data, error } = await apiCall<DepositResult>('/api/deposits/create', {
      method: 'POST',
      body: JSON.stringify({ amountEgp: amount, method, currency }),
    })
    setLoading(false)
    if (error) {
      showError(error)
      return
    }
    setDepositResult(data ?? null)
    setStep('payment')
  }

  // Step 4 → 5: user confirmed they sent the money, go to receipt upload
  function proceedToReceipt() {
    setStep('receipt')
  }

  // Handle file upload
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الصورة يجب أن يكون أقل من 5 ميجابايت')
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      setReceiptImage(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Step 5 → 6: submit receipt + sender number
  async function submitReceipt() {
    if (!senderNumber.trim()) {
      toast.error('أدخل رقم المرسل')
      return
    }
    if (!receiptImage) {
      toast.error('ارفع صورة إثبات الدفع')
      return
    }
    setLoading(true)
    const { data, error } = await apiCall('/api/deposits/confirm', {
      method: 'POST',
      body: JSON.stringify({
        depositId: depositResult?.deposit.id,
        senderNumber,
        receiptImage,
      }),
    })
    setLoading(false)
    if (error) {
      showError(error)
      return
    }
    showSuccess(data?.message || 'تم رفع إثبات الدفع')
    setStep('done')
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    toast.success('تم النسخ')
  }

  const progress = step === 'currency' ? 20 : step === 'method' ? 40 : step === 'confirm' ? 60 : step === 'payment' ? 75 : step === 'receipt' ? 90 : 100

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden glass-strong border-border/50">
        {/* Progress bar */}
        <div className="h-1 bg-muted/50">
          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        <div className="p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <ArrowDownToLine className="w-5 h-5 text-primary" />
              إيداع جديد
            </DialogTitle>
            <DialogDescription className="text-xs">
              {step === 'currency' && 'الخطوة 1 من 5 — اختر العملة وأدخل المبلغ'}
              {step === 'method' && 'الخطوة 2 من 5 — اختر طريقة الدفع'}
              {step === 'confirm' && 'الخطوة 3 من 5 — مراجعة وتأكيد'}
              {step === 'payment' && 'الخطوة 4 من 5 — حوّل المال للمحفظة'}
              {step === 'receipt' && 'الخطوة 5 من 5 — ارفع إثبات الدفع'}
              {step === 'done' && 'تم!'}
            </DialogDescription>
          </DialogHeader>

          {/* ===== Step 1: Currency + Amount ===== */}
          {step === 'currency' && (
            <div className="space-y-4">
              {/* Currency selection */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider">العملة</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setCurrency('EGP')}
                    className={`p-3 rounded-xl border-2 transition-all text-center ${
                      currency === 'EGP' ? 'border-primary bg-primary/10' : 'border-border/50 hover:border-border'
                    }`}
                  >
                    <div className="text-2xl mb-1">£</div>
                    <div className="text-sm font-medium">جنيه مصري</div>
                  </button>
                  <button
                    onClick={() => setCurrency('USDT')}
                    className={`p-3 rounded-xl border-2 transition-all text-center ${
                      currency === 'USDT' ? 'border-primary bg-primary/10' : 'border-border/50 hover:border-border'
                    }`}
                  >
                    <div className="text-2xl mb-1">₮</div>
                    <div className="text-sm font-medium">USDT</div>
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider">المبلغ</Label>
                <Input
                  type="number"
                  placeholder="100"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="font-num h-12 text-lg"
                  dir="ltr"
                />
                <p className="text-[10px] text-muted-foreground">أقل مبلغ: 100 جنيه</p>
              </div>

              {/* Quick amounts */}
              <div className="flex gap-2">
                {[100, 500, 1000, 5000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setAmount(String(amt))}
                    className="flex-1 py-1.5 rounded-lg bg-muted/30 hover:bg-muted/50 text-xs font-medium font-num transition-colors"
                  >
                    {amt}
                  </button>
                ))}
              </div>

              <Button className="w-full h-12 gap-2" onClick={proceedToMethod} disabled={!amount}>
                التالي
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* ===== Step 2: Method selection ===== */}
          {step === 'method' && (
            <div className="space-y-3">
              {Object.entries(METHOD_INFO).map(([key, info]) => (
                <button
                  key={key}
                  onClick={() => setMethod(key)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-right ${
                    method === key ? 'border-primary bg-primary/10' : 'border-border/50 hover:border-border'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center text-xl flex-shrink-0">
                    {info.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{info.label}</div>
                    <div className="text-[10px] text-muted-foreground">{info.desc}</div>
                  </div>
                  {method === key && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                </button>
              ))}

              <div className="flex gap-2 pt-2">
                <Button variant="ghost" className="gap-1" onClick={() => setStep('currency')}>
                  <ArrowRight className="w-4 h-4" />
                  السابق
                </Button>
                <Button className="flex-1 gap-2" onClick={proceedToConfirm} disabled={!method}>
                  التالي
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ===== Step 3: Confirmation ===== */}
          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">العملة</span>
                  <span className="font-medium">{currency === 'EGP' ? 'جنيه مصري' : 'USDT'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">المبلغ</span>
                  <span className="font-num font-bold text-primary">{amount} {currency}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">طريقة الدفع</span>
                  <span className="font-medium">{METHOD_INFO[method]?.label}</span>
                </div>
              </div>

              <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  سيتم اختيار رقم محفظة الدفع تلقائياً من قبل النظام. حوّل المبلغ ثم ارفع إثبات الدفع.
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" className="gap-1" onClick={() => setStep('method')}>
                  <ArrowRight className="w-4 h-4" />
                  السابق
                </Button>
                <Button className="flex-1 gap-2" onClick={createDeposit} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  تأكيد الإيداع
                </Button>
              </div>
            </div>
          )}

          {/* ===== Step 4: Payment (show assigned wallet) ===== */}
          {step === 'payment' && depositResult && (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
                <p className="text-sm font-medium">تم اختيار محفظة الدفع</p>
              </div>

              {/* Wallet card */}
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{METHOD_INFO[depositResult.wallet.method]?.icon}</span>
                      <div>
                        <div className="text-sm font-semibold">{METHOD_INFO[depositResult.wallet.method]?.label}</div>
                        {depositResult.wallet.label && (
                          <div className="text-[10px] text-muted-foreground">{depositResult.wallet.label}</div>
                        )}
                      </div>
                    </div>
                    {depositResult.wallet.holderName && (
                      <div className="text-[10px] text-muted-foreground text-left">
                        {depositResult.wallet.holderName}
                      </div>
                    )}
                  </div>

                  {/* Wallet number — big and copyable */}
                  <div className="rounded-lg bg-background/60 p-3 text-center">
                    <div className="text-[10px] text-muted-foreground mb-1">رقم المحفظة</div>
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-num text-xl font-bold tracking-wider" dir="ltr">{depositResult.wallet.number}</span>
                      <button
                        onClick={() => copyToClipboard(depositResult.wallet.number)}
                        className="p-1 rounded-md hover:bg-muted/50 text-primary"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Amount to send */}
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-border/30">
                    <span className="text-muted-foreground">المبلغ المطلوب تحويله</span>
                    <span className="font-num font-bold text-primary">{amount} {currency}</span>
                  </div>

                  {/* Limits info */}
                  <div className="flex gap-3 text-[10px] text-muted-foreground">
                    <div className="flex-1">
                      <span>الحد اليومي المتبقي: </span>
                      <span className="font-num">{new Intl.NumberFormat('en-US').format(depositResult.wallet.remainingDaily)} EGP</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  حوّل المبلغ بالضبط من محفظتك إلى الرقم أعلاه، ثم اضغط "التالي" لرفع إثبات الدفع.
                </p>
              </div>

              <Button className="w-full h-12 gap-2" onClick={proceedToReceipt}>
                حوّلت المبلغ — رفع إثبات الدفع
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* ===== Step 5: Receipt upload ===== */}
          {step === 'receipt' && (
            <div className="space-y-4">
              {/* Sender number */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider">رقم المرسل (رقمك)</Label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="tel"
                    placeholder="01XXXXXXXXX"
                    value={senderNumber}
                    onChange={(e) => setSenderNumber(e.target.value)}
                    className="pr-10 font-num"
                    dir="ltr"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">رقم الهاتف/المحفظة الذي حوّلت منه</p>
              </div>

              {/* Receipt image upload */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider">صورة إثبات الدفع</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {receiptImage ? (
                  <div className="relative">
                    <img src={receiptImage} alt="receipt" className="w-full rounded-xl border border-border/50 max-h-48 object-contain" />
                    <button
                      onClick={() => setReceiptImage(null)}
                      className="absolute top-2 left-2 p-1.5 rounded-full bg-rose-500 text-white"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-8 rounded-xl border-2 border-dashed border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all flex flex-col items-center gap-2"
                  >
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">اضغط لرفع صورة الإثبات</span>
                    <span className="text-[10px] text-muted-foreground/70">PNG, JPG — حد أقصى 5MB</span>
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" className="gap-1" onClick={() => setStep('payment')}>
                  <ArrowRight className="w-4 h-4" />
                  السابق
                </Button>
                <Button className="flex-1 gap-2" onClick={submitReceipt} disabled={loading || !senderNumber.trim() || !receiptImage}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  رفع ومتابعة
                </Button>
              </div>
            </div>
          )}

          {/* ===== Step 6: Done ===== */}
          {step === 'done' && (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold mb-1">تم رفع إثبات الدفع! ✅</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  تم استلام طلبك بنجاح. سيتم مراجعة إثبات الدفع واعتماد الإيداع خلال دقائق.
                  ستصل إشعار فور اعتماده.
                </p>
              </div>
              <Button
                className="w-full gap-2"
                onClick={() => { handleClose(false); fetchUser() }}
              >
                <Check className="w-4 h-4" />
                تم
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
