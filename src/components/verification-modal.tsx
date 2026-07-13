'use client'

import { useState, useEffect } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { OtpInput } from '@/components/otp-input'
import { apiCall, useAuth } from '@/lib/client'
import { useLanguage } from '@/hooks/use-language'
import {
  Mail, Phone, Shield, CheckCircle2, Loader2, ArrowLeft, ArrowRight,
  Edit3, RefreshCw, AlertCircle, Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'

type Step = 'email_intro' | 'email_otp' | 'phone_intro' | 'phone_otp' | 'phone_setup' | 'done'

export function VerificationModal() {
  const { user, fetchUser } = useAuth()
  const { t, lang } = useLanguage()
  const isAr = lang === 'ar'

  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('email_intro')
  const [loading, setLoading] = useState(false)
  const [otp, setOtp] = useState('')
  const [editEmailMode, setEditEmailMode] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [resendTimer, setResendTimer] = useState(0)
  const [devOtp, setDevOtp] = useState<string | null>(null)
  const [maskedPhone, setMaskedPhone] = useState<string | null>(null)

  // Phone setup (for Google users without phone)
  const [setupPhone, setSetupPhone] = useState('')
  const [setupCountryCode, setSetupCountryCode] = useState('+20')

  // Determine if verification is needed
  useEffect(() => {
    if (!user) return
    const needsEmail = !user.emailVerified
    const needsPhone = !user.phoneVerified
    const hasNoPhone = !user.phone

    if (needsEmail) {
      setStep('email_intro')
      setOpen(true)
    } else if (hasNoPhone) {
      // Google user without phone — go to phone setup
      setStep('phone_setup')
      setOpen(true)
    } else if (needsPhone) {
      setStep('phone_intro')
      setOpen(true)
    } else {
      setOpen(false)
    }
  }, [user])

  // Resend timer
  useEffect(() => {
    if (resendTimer <= 0) return
    const id = setTimeout(() => setResendTimer((t) => t - 1), 1000)
    return () => clearTimeout(id)
  }, [resendTimer])

  // Prevent closing the dialog
  function handleOpenChange(o: boolean) {
    // Never allow closing until verification is complete
    if (!o && step !== 'done') return
    setOpen(o)
  }

  // ===== Email verification =====
  async function sendEmailOtp() {
    setLoading(true)
    setOtp('')
    const { data, error } = await apiCall<any>('/api/auth/verify-email/send', { method: 'POST' })
    setLoading(false)
    if (error) {
      toast.error(error)
      return
    }
    if (data?.devOtp) setDevOtp(data.devOtp)
    setStep('email_otp')
    setResendTimer(60)
    toast.success(data.message)
  }

  async function confirmEmailOtp() {
    if (otp.length !== 6) return
    setLoading(true)
    const { data, error } = await apiCall<any>('/api/auth/verify-email/confirm', {
      method: 'POST',
      body: JSON.stringify({ otp }),
    })
    setLoading(false)
    if (error) {
      toast.error(error)
      setOtp('')
      return
    }
    toast.success(data.message)
    setDevOtp(null)
    await fetchUser()

    // Check if phone needs verification
    if (data.phoneNeedsVerification) {
      setMaskedPhone(data.phone?.replace(/(\d{3})(\d{4})(\d{4})/, '$1****$3') || null)
      setStep('phone_intro')
    } else {
      setStep('done')
    }
  }

  // ===== Phone verification =====
  async function sendPhoneOtp() {
    setLoading(true)
    setOtp('')
    const { data, error } = await apiCall<any>('/api/auth/verify-phone/send', { method: 'POST' })
    setLoading(false)
    if (error) {
      toast.error(error)
      return
    }
    if (data?.devOtp) setDevOtp(data.devOtp)
    if (data?.maskedPhone) setMaskedPhone(data.maskedPhone)
    setStep('phone_otp')
    setResendTimer(60)
    toast.success(data.message)
  }

  async function confirmPhoneOtp() {
    if (otp.length !== 6) return
    setLoading(true)
    const { data, error } = await apiCall<any>('/api/auth/verify-phone/confirm', {
      method: 'POST',
      body: JSON.stringify({ otp }),
    })
    setLoading(false)
    if (error) {
      toast.error(error)
      setOtp('')
      return
    }
    toast.success(data.message)
    setDevOtp(null)
    await fetchUser()
    setStep('done')
  }

  // ===== Update email =====
  async function handleUpdateEmail() {
    if (!newEmail.trim()) return
    setLoading(true)
    const { data, error } = await apiCall<any>('/api/auth/update-email', {
      method: 'POST',
      body: JSON.stringify({ email: newEmail }),
    })
    setLoading(false)
    if (error) {
      toast.error(error)
      return
    }
    toast.success(data.message)
    await fetchUser()
    setEditEmailMode(false)
    setNewEmail('')
    // Now send OTP to the new email
    sendEmailOtp()
  }

  // ===== Phone setup (Google users without phone) =====
  async function handlePhoneSetup() {
    if (!setupPhone.trim()) {
      toast.error('أدخل رقم الهاتف')
      return
    }
    setLoading(true)
    const { data, error } = await apiCall<any>('/api/auth/update-phone', {
      method: 'POST',
      body: JSON.stringify({ phone: setupPhone, countryCode: setupCountryCode }),
    })
    setLoading(false)
    if (error) {
      toast.error(error)
      return
    }
    if (data?.devOtp) setDevOtp(data.devOtp)
    if (data?.maskedPhone) setMaskedPhone(data.maskedPhone)
    await fetchUser()
    setStep('phone_otp')
    setResendTimer(60)
    toast.success(data.message)
  }

  // ===== Render =====
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-md p-0 overflow-hidden glass-strong border-border/50"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        showCloseButton={false}
      >
        {/* Progress bar */}
        <div className="h-1 bg-muted/50">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: step === 'email_intro' ? '20%' : step === 'email_otp' ? '40%' : step === 'phone_setup' ? '60%' : step === 'phone_intro' ? '60%' : step === 'phone_otp' ? '80%' : '100%' }}
          />
        </div>

        <div className="p-6">
          {/* ===== Step: Email Intro ===== */}
          {step === 'email_intro' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/15 text-primary flex items-center justify-center">
                <Mail className="w-8 h-8" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold mb-1">تأكيد البريد الإلكتروني</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  يجب تأكيد بريدك الإلكتروني لضمان أمان حسابك. سنرسل رمز تحقق مكوّن من 6 أرقام.
                </p>
              </div>

              {/* Current email */}
              <div className="rounded-lg bg-muted/30 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm font-medium truncate">{user?.email}</span>
                </div>
                <button
                  onClick={() => { setEditEmailMode(true); setNewEmail(user?.email || '') }}
                  className="text-[10px] text-primary hover:underline flex items-center gap-1 flex-shrink-0"
                >
                  <Edit3 className="w-2.5 h-2.5" />
                  تعديل
                </button>
              </div>

              {/* Edit email mode */}
              {editEmailMode && (
                <div className="space-y-2 p-3 rounded-lg border border-border/50">
                  <Label className="text-xs">البريد الإلكتروني الجديد</Label>
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="new@example.com"
                    dir="ltr"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 gap-1.5" onClick={handleUpdateEmail} disabled={loading || !newEmail.trim()}>
                      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                      حفظ وتأكيد
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditEmailMode(false)}>إلغاء</Button>
                  </div>
                </div>
              )}

              {!editEmailMode && (
                <Button
                  className="w-full gap-2 h-12 bg-primary hover:bg-primary/90 text-primary-foreground glow-primary-sm"
                  onClick={sendEmailOtp}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  إرسال رمز التحقق
                </Button>
              )}
            </div>
          )}

          {/* ===== Step: Email OTP ===== */}
          {step === 'email_otp' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/15 text-primary flex items-center justify-center">
                <Shield className="w-8 h-8" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold mb-1">أدخل رمز التحقق</h2>
                <p className="text-sm text-muted-foreground">
                  أرسلنا رمز التحقق إلى <span className="font-medium text-foreground">{user?.email}</span>
                </p>
              </div>

              {devOtp && (
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-2 text-xs text-amber-600">
                  رمز التحقق (للتجربة): <span className="font-num font-bold">{devOtp}</span>
                </div>
              )}

              <OtpInput
                value={otp}
                onChange={(v) => setOtp(v)}
                onComplete={confirmEmailOtp}
                error={false}
                disabled={loading}
              />

              <Button
                className="w-full gap-2 h-12 bg-primary hover:bg-primary/90 text-primary-foreground glow-primary-sm"
                onClick={confirmEmailOtp}
                disabled={loading || otp.length !== 6}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                تأكيد الرمز
              </Button>

              <div className="flex items-center justify-between text-xs">
                <button
                  onClick={() => { resendTimer === 0 && sendEmailOtp() }}
                  disabled={resendTimer > 0 || loading}
                  className="text-primary hover:underline disabled:text-muted-foreground disabled:no-underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  {resendTimer > 0 ? `إعادة الإرسال خلال ${resendTimer}ث` : 'إعادة إرسال الرمز'}
                </button>
                <button onClick={() => setStep('email_intro')} className="text-muted-foreground hover:text-foreground">
                  تغيير البريد
                </button>
              </div>
            </div>
          )}

          {/* ===== Step: Phone Intro ===== */}
          {step === 'phone_intro' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/15 text-primary flex items-center justify-center">
                <Phone className="w-8 h-8" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold mb-1">تأكيد رقم الهاتف</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  تم تأكيد بريدك الإلكتروني ✅ الآن أكد رقم هاتفك لإكمال الحماية.
                </p>
              </div>

              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2 flex items-center gap-2 justify-center text-xs text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                البريد الإلكتروني مؤكد
              </div>

              <div className="rounded-lg bg-muted/30 p-3 flex items-center justify-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium font-num" dir="ltr">{maskedPhone || user?.phone}</span>
              </div>

              <Button
                className="w-full gap-2 h-12 bg-primary hover:bg-primary/90 text-primary-foreground glow-primary-sm"
                onClick={sendPhoneOtp}
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                إرسال رمز التحقق
              </Button>
            </div>
          )}

          {/* ===== Step: Phone OTP ===== */}
          {step === 'phone_otp' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/15 text-primary flex items-center justify-center">
                <Shield className="w-8 h-8" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold mb-1">أدخل رمز التحقق</h2>
                <p className="text-sm text-muted-foreground">
                  أرسلنا رمز التحقق إلى <span className="font-medium font-num" dir="ltr">{maskedPhone || user?.phone}</span>
                </p>
              </div>

              {devOtp && (
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-2 text-xs text-amber-600">
                  رمز التحقق (للتجربة): <span className="font-num font-bold">{devOtp}</span>
                </div>
              )}

              <OtpInput
                value={otp}
                onChange={(v) => setOtp(v)}
                onComplete={confirmPhoneOtp}
                error={false}
                disabled={loading}
              />

              <Button
                className="w-full gap-2 h-12 bg-primary hover:bg-primary/90 text-primary-foreground glow-primary-sm"
                onClick={confirmPhoneOtp}
                disabled={loading || otp.length !== 6}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                تأكيد الرمز
              </Button>

              <div className="flex items-center justify-between text-xs">
                <button
                  onClick={() => { resendTimer === 0 && sendPhoneOtp() }}
                  disabled={resendTimer > 0 || loading}
                  className="text-primary hover:underline disabled:text-muted-foreground disabled:no-underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  {resendTimer > 0 ? `إعادة الإرسال خلال ${resendTimer}ث` : 'إعادة إرسال الرمز'}
                </button>
              </div>
            </div>
          )}

          {/* ===== Step: Phone Setup (Google users without phone) ===== */}
          {step === 'phone_setup' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/15 text-primary flex items-center justify-center">
                <Phone className="w-8 h-8" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold mb-1">أدخل رقم هاتفك</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  بريدك الإلكتروني مؤكد ✅ لإكمال حماية حسابك، أدخل رقم هاتفك للتحقق منه.
                </p>
              </div>

              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2 flex items-center gap-2 justify-center text-xs text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                البريد الإلكتروني مؤكد
              </div>

              {/* Country code + phone input */}
              <div className="space-y-2 text-left">
                <Label className="text-xs uppercase tracking-wider">رقم الهاتف</Label>
                <div className="flex gap-2" dir="ltr">
                  <select
                    value={setupCountryCode}
                    onChange={(e) => setSetupCountryCode(e.target.value)}
                    className="w-[100px] h-11 rounded-lg border border-border/50 bg-background/50 px-2 text-sm"
                  >
                    <option value="+20">🇪🇬 +20</option>
                    <option value="+966">🇸🇦 +966</option>
                    <option value="+971">🇦🇪 +971</option>
                    <option value="+965">🇰🇼 +965</option>
                    <option value="+974">🇶🇦 +974</option>
                    <option value="+973">🇧🇭 +973</option>
                    <option value="+968">🇴🇲 +968</option>
                    <option value="+962">🇯🇴 +962</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                  </select>
                  <Input
                    type="tel"
                    placeholder="10 1234 5678"
                    value={setupPhone}
                    onChange={(e) => setSetupPhone(e.target.value)}
                    className="flex-1 font-num h-11"
                    dir="ltr"
                  />
                </div>
              </div>

              <Button
                className="w-full gap-2 h-12 bg-primary hover:bg-primary/90 text-primary-foreground glow-primary-sm"
                onClick={handlePhoneSetup}
                disabled={loading || !setupPhone.trim()}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                إرسال رمز التحقق
              </Button>
            </div>
          )}

          {/* ===== Step: Done ===== */}
          {step === 'done' && (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center animate-auth-check">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold mb-1">تم التحقق بنجاح! 🎉</h2>
                <p className="text-sm text-muted-foreground">
                  تم تأكيد بريدك الإلكتروني ورقم هاتفك. حسابك الآن محمي بالكامل.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" /> بريد مؤكد
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" /> هاتف مؤكد
                </div>
              </div>
              <Button
                className="w-full gap-2 h-12 bg-primary hover:bg-primary/90 text-primary-foreground glow-primary-sm"
                onClick={() => { setOpen(false); fetchUser() }}
              >
                <Sparkles className="w-4 h-4" />
                ابدأ التداول
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
