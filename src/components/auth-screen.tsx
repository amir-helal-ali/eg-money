'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { apiCall, useAuth } from '@/lib/client'
import {
  Loader2, Shield, Zap, Users, ArrowLeft, Lock, Mail, User, AtSign,
  Eye, EyeOff, Gift, AlertCircle, CheckCircle2, ArrowRight, KeyRound,
  Smartphone, MessageSquare, RefreshCw, FileText, ExternalLink,
  Sparkles, TrendingUp, TrendingDown, Globe, ChevronLeft, Coins, Server,
} from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'
import { useLanguage } from '@/hooks/use-language'
import { PasswordStrengthMeter } from '@/components/password-strength-meter'
import { PhoneField, formatFullPhone, DEFAULT_COUNTRY } from '@/components/phone-field'
import { GoogleSignInButton } from '@/components/google-signin-button'
import { LegalDocDialog } from '@/components/legal-doc-dialog'
import { OtpInput } from '@/components/otp-input'
import { StepWizard } from '@/components/step-wizard'
import { COUNTRIES, DEFAULT_COUNTRY as DC } from '@/lib/countries'
import { useTicker } from '@/hooks/use-ticker'
import { toast } from 'sonner'

// Local validators (mirror of /lib/validation.ts)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,20}$/

type Mode = 'login' | 'signup' | 'forgot-identifier' | 'forgot-channel' | 'forgot-otp' | 'reset'

type FieldErrors = Record<string, string>

export function AuthScreen() {
  const { fetchUser } = useAuth()
  const { t, lang } = useLanguage()
  const [mode, setMode] = useState<Mode>('login')
  const [loading, setLoading] = useState(false)

  // ===== URL pre-fills (referral, reset token) =====
  useEffect(() => {
    try {
      const url = new URL(window.location.href)
      const ref = url.searchParams.get('ref')
      if (ref) setSignupReferral(ref.toUpperCase())
      const reset = url.searchParams.get('reset')
      if (reset) {
        setMode('reset')
        setResetToken(reset)
      }
    } catch {}
  }, [])

  // ===== Login state =====
  const [loginIdentifier, setLoginIdentifier] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [showLoginPass, setShowLoginPass] = useState(false)

  // ===== Signup state =====
  const [signupUsername, setSignupUsername] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPhone, setSignupPhone] = useState('')
  const [signupCountryCode, setSignupCountryCode] = useState(DC.code)
  const [signupPassword, setSignupPassword] = useState('')
  const [signupConfirm, setSignupConfirm] = useState('')
  const [signupReferral, setSignupReferral] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [showSignupPass, setShowSignupPass] = useState(false)

  // ===== Forgot password state =====
  const [forgotIdentifier, setForgotIdentifier] = useState('')
  const [availableChannels, setAvailableChannels] = useState<('EMAIL' | 'PHONE')[]>([])
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null)
  const [maskedPhone, setMaskedPhone] = useState<string | null>(null)
  const [chosenChannel, setChosenChannel] = useState<'EMAIL' | 'PHONE' | null>(null)
  const [otp, setOtp] = useState('')
  const [resendTimer, setResendTimer] = useState(0)

  // ===== Reset password state =====
  const [resetToken, setResetToken] = useState('')
  const [resetPassword, setResetPassword] = useState('')
  const [resetConfirm, setResetConfirm] = useState('')
  const [showResetPass, setShowResetPass] = useState(false)

  // ===== Errors =====
  const [errors, setErrors] = useState<FieldErrors>({})
  const [legalDoc, setLegalDoc] = useState<'terms' | 'privacy' | null>(null)

  // Resend timer
  useEffect(() => {
    if (resendTimer <= 0) return
    const id = setTimeout(() => setResendTimer((t) => t - 1), 1000)
    return () => clearTimeout(id)
  }, [resendTimer])

  function clearErrors() {
    setErrors({})
  }

  function setFieldError(field: string, msg: string) {
    setErrors((prev) => ({ ...prev, [field]: msg }))
  }

  // ===== Validators =====
  function validateLogin(): boolean {
    const errs: FieldErrors = {}
    if (!loginIdentifier.trim()) errs.identifier = t('auth.errIdentifierRequired')
    if (!loginPassword) errs.password = t('auth.errPasswordRequired')
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function validateSignup(): boolean {
    const errs: FieldErrors = {}
    if (!signupUsername.trim()) errs.username = t('auth.errUsernameRequired')
    else if (!USERNAME_RE.test(signupUsername.trim())) errs.username = t('auth.errUsernameInvalid')
    if (!signupEmail.trim()) errs.email = t('auth.errEmailRequired')
    else if (!EMAIL_RE.test(signupEmail.trim())) errs.email = t('auth.errEmailInvalid')
    if (!signupPhone.trim()) errs.phone = t('auth.errPhoneRequired')
    if (!signupPassword) errs.password = t('auth.errPasswordRequired')
    else if (signupPassword.length < 8) errs.password = t('auth.errPasswordShort')
    else if (!/[A-Z]/.test(signupPassword) || !/[a-z]/.test(signupPassword) ||
             !/[0-9]/.test(signupPassword) || !/[^A-Za-z0-9]/.test(signupPassword)) {
      errs.password = t('auth.errPasswordWeak')
    }
    if (signupPassword !== signupConfirm) errs.confirm = t('auth.errPasswordMatch')
    if (!agreeTerms) errs.terms = t('auth.errTermsRequired')
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // ===== Wizard step validators (return single error or null) =====
  function validateSignupStep(step: number): string | null {
    if (step === 0) {
      // Account: username + email
      if (!signupUsername.trim()) {
        setErrors({ username: t('auth.errUsernameRequired') })
        return t('auth.errUsernameRequired')
      }
      if (!USERNAME_RE.test(signupUsername.trim())) {
        setErrors({ username: t('auth.errUsernameInvalid') })
        return t('auth.errUsernameInvalid')
      }
      if (!signupEmail.trim()) {
        setErrors({ email: t('auth.errEmailRequired') })
        return t('auth.errEmailRequired')
      }
      if (!EMAIL_RE.test(signupEmail.trim())) {
        setErrors({ email: t('auth.errEmailInvalid') })
        return t('auth.errEmailInvalid')
      }
      setErrors({})
      return null
    }
    if (step === 1) {
      // Contact: phone
      if (!signupPhone.trim()) {
        setErrors({ phone: t('auth.errPhoneRequired') })
        return t('auth.errPhoneRequired')
      }
      setErrors({})
      return null
    }
    if (step === 2) {
      // Security: password + confirm
      if (!signupPassword) {
        setErrors({ password: t('auth.errPasswordRequired') })
        return t('auth.errPasswordRequired')
      }
      if (signupPassword.length < 8) {
        setErrors({ password: t('auth.errPasswordShort') })
        return t('auth.errPasswordShort')
      }
      if (!/[A-Z]/.test(signupPassword) || !/[a-z]/.test(signupPassword) ||
          !/[0-9]/.test(signupPassword) || !/[^A-Za-z0-9]/.test(signupPassword)) {
        setErrors({ password: t('auth.errPasswordWeak') })
        return t('auth.errPasswordWeak')
      }
      if (signupPassword !== signupConfirm) {
        setErrors({ confirm: t('auth.errPasswordMatch') })
        return t('auth.errPasswordMatch')
      }
      setErrors({})
      return null
    }
    if (step === 3) {
      // Review: terms
      if (!agreeTerms) {
        setErrors({ terms: t('auth.errTermsRequired') })
        return t('auth.errTermsRequired')
      }
      setErrors({})
      return null
    }
    setErrors({})
    return null
  }

  function validateForgotIdentifier(): boolean {
    const errs: FieldErrors = {}
    if (!forgotIdentifier.trim()) errs.forgotIdentifier = t('auth.errIdentifierRequired')
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function validateOtp(): boolean {
    const errs: FieldErrors = {}
    if (!otp.trim()) errs.otp = t('auth.errOtpRequired')
    else if (!/^\d{6}$/.test(otp.trim())) errs.otp = t('auth.errOtpInvalid')
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function validateReset(): boolean {
    const errs: FieldErrors = {}
    if (!resetPassword) errs.resetPassword = t('auth.errPasswordRequired')
    else if (resetPassword.length < 8) errs.resetPassword = t('auth.errPasswordShort')
    else if (!/[A-Z]/.test(resetPassword) || !/[a-z]/.test(resetPassword) ||
             !/[0-9]/.test(resetPassword) || !/[^A-Za-z0-9]/.test(resetPassword)) {
      errs.resetPassword = t('auth.errPasswordWeak')
    }
    if (resetPassword !== resetConfirm) errs.resetConfirm = t('auth.errPasswordMatch')
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // ===== Handlers =====
  async function handleLogin() {
    if (!validateLogin()) return
    setLoading(true)
    clearErrors()
    const { error } = await apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier: loginIdentifier, password: loginPassword }),
    })
    setLoading(false)
    if (error) {
      setFieldError('form', error)
      toast.error(error)
      return
    }
    toast.success(t('auth.loginSuccess'))
    await fetchUser()
  }

  async function handleSignup() {
    if (!validateSignup()) return
    setLoading(true)
    clearErrors()
    const fullPhone = formatFullPhone(
      // Convert ISO code to dial code
      getDialCode(signupCountryCode),
      signupPhone,
    )
    const { error } = await apiCall('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: signupEmail,
        password: signupPassword,
        username: signupUsername,
        phone: signupPhone,
        countryCode: getDialCode(signupCountryCode),
        referralCode: signupReferral || undefined,
      }),
    })
    setLoading(false)
    if (error) {
      setFieldError('form', error)
      toast.error(error)
      return
    }
    toast.success(t('auth.signupSuccess'))
    try { sessionStorage.setItem('just_signed_up', 'true') } catch {}
    await fetchUser()
  }

  // Forgot password: step 1 — submit identifier
  async function handleForgotIdentifier() {
    if (!validateForgotIdentifier()) return
    setLoading(true)
    clearErrors()
    const { data, error } = await apiCall<any>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ identifier: forgotIdentifier }),
    })
    setLoading(false)
    if (error) {
      setFieldError('form', error)
      toast.error(error)
      return
    }
    if (data?.needsChannel) {
      // Username was used → user must pick a channel
      setAvailableChannels(data.availableChannels || [])
      setMaskedEmail(data.maskedEmail || null)
      setMaskedPhone(data.maskedPhone || null)
      setMode('forgot-channel')
    } else if (data?.otpSent) {
      // Email or phone was used directly → OTP sent
      setMode('forgot-otp')
      setResendTimer(60)
      toast.success(data.message)
    } else {
      // Account not found or other — show generic message
      toast.info(data?.message || t('auth.accountNotFound'))
    }
  }

  // Forgot password: step 2 (only for username) — choose channel & send OTP
  async function handleChooseChannel(channel: 'EMAIL' | 'PHONE') {
    setLoading(true)
    clearErrors()
    const { data, error } = await apiCall<any>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ identifier: forgotIdentifier, channel }),
    })
    setLoading(false)
    if (error) {
      setFieldError('form', error)
      toast.error(error)
      return
    }
    if (data?.otpSent) {
      setChosenChannel(channel)
      setMode('forgot-otp')
      setResendTimer(60)
      toast.success(data.message)
    } else {
      toast.info(data?.message)
    }
  }

  // Forgot password: step 3 — verify OTP
  async function handleVerifyOtp() {
    if (!validateOtp()) return
    setLoading(true)
    clearErrors()
    const { data, error } = await apiCall<any>('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ identifier: forgotIdentifier, otp }),
    })
    setLoading(false)
    if (error) {
      setFieldError('otp', error)
      toast.error(error)
      return
    }
    if (data?.valid && data?.resetToken) {
      setResetToken(data.resetToken)
      setMode('reset')
      toast.success(t('auth.otpSentEmail')) // generic success
    }
  }

  // Resend OTP
  async function handleResendOtp() {
    if (resendTimer > 0) return
    setLoading(true)
    const channel = chosenChannel || (forgotIdentifier.includes('@') ? 'EMAIL' : 'PHONE')
    const { data, error } = await apiCall<any>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ identifier: forgotIdentifier, channel }),
    })
    setLoading(false)
    if (data?.otpSent) {
      setResendTimer(60)
      toast.success(data.message)
    } else if (error) {
      toast.error(error)
    }
  }

  // Reset password
  async function handleReset() {
    if (!validateReset()) return
    setLoading(true)
    clearErrors()
    const { error } = await apiCall('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: resetToken, password: resetPassword }),
    })
    setLoading(false)
    if (error) {
      setFieldError('form', error)
      toast.error(error)
      return
    }
    toast.success(t('auth.resetSuccess'))
    try {
      const url = new URL(window.location.href)
      url.searchParams.delete('reset')
      window.history.replaceState({}, '', url.toString())
    } catch {}
    // Reset state
    setMode('login')
    setLoginIdentifier(forgotIdentifier)
    setLoginPassword('')
    setForgotIdentifier('')
    setOtp('')
    setResetToken('')
    setResetPassword('')
    setResetConfirm('')
    setChosenChannel(null)
    setAvailableChannels([])
  }

  // Helper: ISO code → dial code
  function getDialCode(iso: string): string {
    return COUNTRIES.find((c) => c.code === iso)?.dialCode || '+20'
  }

  // ===== Reset mode UI =====
  if (mode === 'reset') {
    return (
      <AuthLayout t={t} lang={lang} step={4}>
        <Card className="glass-strong border-border/50 animate-auth-card-in overflow-hidden relative auth-card-compact">
          <div className="auth-scan-line" style={{ top: '40%' }} />
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center ring-2 ring-primary/20">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="font-display text-2xl leading-tight">{t('auth.resetTitle')}</CardTitle>
                <CardDescription className="mt-0.5">{t('auth.resetDesc')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <PasswordField
              id="reset-pass" label={t('auth.password')} placeholder={t('auth.passwordPlaceholder')}
              value={resetPassword} onChange={(v) => setResetPassword(v)}
              show={showResetPass} onToggle={() => setShowResetPass(!showResetPass)}
              error={errors.resetPassword} onEnter={() => handleReset()}
            />
            {resetPassword && <PasswordStrengthMeter password={resetPassword} />}
            <PasswordField
              id="reset-confirm" label={t('auth.confirmPassword')} placeholder={t('auth.confirmPlaceholder')}
              value={resetConfirm} onChange={(v) => setResetConfirm(v)}
              show={showResetPass} onToggle={() => setShowResetPass(!showResetPass)}
              error={errors.resetConfirm} onEnter={() => handleReset()}
            />
            {errors.form && <FormError msg={errors.form} />}
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2 h-12 glow-primary-sm auth-btn-shine font-medium"
              onClick={handleReset} disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {t('auth.resetSubmit')}
            </Button>
            <Button variant="ghost" size="sm" className="w-full text-xs gap-1" onClick={() => setMode('login')}>
              <ArrowRight className="w-3.5 h-3.5" />
              {t('auth.backToLogin')}
            </Button>
          </CardFooter>
        </Card>
      </AuthLayout>
    )
  }

  // ===== Forgot OTP mode UI =====
  if (mode === 'forgot-otp') {
    const isEmailChannel = chosenChannel === 'EMAIL' ||
      (!chosenChannel && forgotIdentifier.includes('@'))
    return (
      <AuthLayout t={t} lang={lang} step={3}>
        <Card className="glass-strong border-border/50 animate-auth-card-in overflow-hidden relative auth-card-compact">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center ring-2 ring-primary/20 relative">
                <Shield className="w-5 h-5" />
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-success animate-auth-live-dot" />
              </div>
              <div>
                <CardTitle className="font-display text-2xl leading-tight">{t('auth.otpTitle')}</CardTitle>
                <CardDescription className="mt-0.5">{t('auth.otpDesc')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Channel confirmation banner */}
            <div className="rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/20 text-primary flex items-center justify-center flex-shrink-0">
                {isEmailChannel ? <Mail className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground">
                  {isEmailChannel ? t('auth.otpSentEmail') : t('auth.otpSentPhone')}
                </div>
                <div className="text-sm font-mono text-primary font-semibold mt-0.5" dir="ltr">
                  {isEmailChannel ? maskedEmail : maskedPhone}
                </div>
              </div>
            </div>

            {/* Segmented OTP input */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs uppercase tracking-wider">{t('auth.otpTitle')}</Label>
                <Badge variant="outline" className="font-num text-[10px] gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  6-digit
                </Badge>
              </div>
              <OtpInput
                value={otp}
                onChange={(v) => {
                  setOtp(v)
                  if (errors.otp) clearErrors()
                }}
                onComplete={() => handleVerifyOtp()}
                error={!!errors.otp}
                disabled={loading}
              />
              {errors.otp && <FieldError msg={errors.otp} />}
            </div>

            {errors.form && <FormError msg={errors.form} />}

            {/* Resend + back row */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendTimer > 0 || loading}
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline disabled:text-muted-foreground disabled:no-underline transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${resendTimer > 0 ? '' : 'group-hover:rotate-180'} transition-transform`} />
                {resendTimer > 0
                  ? `${t('auth.resendIn')} ${resendTimer}s`
                  : t('auth.resendOtp')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('forgot-identifier')
                  setOtp('')
                  setResendTimer(0)
                  clearErrors()
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
              >
                <ArrowRight className="w-3 h-3" />
                {t('auth.backToLogin')}
              </button>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2 h-12 glow-primary-sm auth-btn-shine font-medium"
              onClick={handleVerifyOtp} disabled={loading || otp.length !== 6}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {t('auth.verifyOtp')}
            </Button>
          </CardFooter>
        </Card>
      </AuthLayout>
    )
  }

  // ===== Forgot channel selection mode UI =====
  if (mode === 'forgot-channel') {
    return (
      <AuthLayout t={t} lang={lang} step={2}>
        <Card className="glass-strong border-border/50 animate-auth-card-in overflow-hidden relative auth-card-compact">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center ring-2 ring-primary/20">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="font-display text-2xl leading-tight">{t('auth.chooseChannel')}</CardTitle>
                <CardDescription className="mt-0.5">{t('auth.forgotDesc')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {availableChannels.includes('EMAIL') && (
              <ChannelOption
                icon={Mail} title={t('auth.channelEmail')} desc={t('auth.channelEmailDesc')}
                masked={maskedEmail} onClick={() => handleChooseChannel('EMAIL')}
                disabled={loading}
              />
            )}
            {availableChannels.includes('PHONE') && (
              <ChannelOption
                icon={Smartphone} title={t('auth.channelPhone')} desc={t('auth.channelPhoneDesc')}
                masked={maskedPhone} onClick={() => handleChooseChannel('PHONE')}
                disabled={loading}
              />
            )}
            {errors.form && <FormError msg={errors.form} />}
          </CardContent>
          <CardFooter>
            <Button
              variant="ghost" size="sm" className="w-full text-xs gap-1"
              onClick={() => { setMode('forgot-identifier'); clearErrors() }}
            >
              <ArrowRight className="w-3.5 h-3.5" />
              {t('auth.backToLogin')}
            </Button>
          </CardFooter>
        </Card>
      </AuthLayout>
    )
  }

  // ===== Forgot identifier mode UI =====
  if (mode === 'forgot-identifier') {
    return (
      <AuthLayout t={t} lang={lang} step={1}>
        <Card className="glass-strong border-border/50 animate-auth-card-in overflow-hidden relative auth-card-compact">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center ring-2 ring-primary/20">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="font-display text-2xl leading-tight">{t('auth.forgotTitle')}</CardTitle>
                <CardDescription className="mt-0.5">{t('auth.forgotDesc')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="forgot-id" className="text-xs uppercase tracking-wider">
                {t('auth.identifier')}
              </Label>
              <div className="auth-input-wrap relative">
                <AtSign className="auth-input-icon absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="forgot-id"
                  placeholder={t('auth.forgotIdentifierPlaceholder')}
                  value={forgotIdentifier}
                  onChange={(e) => {
                    setForgotIdentifier(e.target.value)
                    if (errors.forgotIdentifier) clearErrors()
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleForgotIdentifier()}
                  className={`pr-10 bg-background/50 transition-all duration-200 ${
                    errors.forgotIdentifier ? 'border-rose-500 focus-visible:ring-rose-500' : ''
                  }`}
                  dir="ltr"
                />
              </div>
              {errors.forgotIdentifier && <FieldError msg={errors.forgotIdentifier} />}
            </div>
            {errors.form && <FormError msg={errors.form} />}
            <div className="rounded-lg bg-muted/30 border border-border/40 px-3 py-2.5 text-[11px] text-muted-foreground leading-relaxed flex items-start gap-2">
              <Globe className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
              <span>
                {lang === 'ar'
                  ? 'يمكنك إدخال اسم المستخدم أو البريد الإلكتروني أو رقم الهاتف مع رمز الدولة (مثل +20).'
                  : 'You can enter username, email, or phone with country code (e.g. +20).'}
              </span>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2 h-12 glow-primary-sm auth-btn-shine font-medium"
              onClick={handleForgotIdentifier} disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowLeft className="w-4 h-4" />}
              {t('auth.sendOtp')}
            </Button>
            <Button
              variant="ghost" size="sm" className="w-full text-xs gap-1"
              onClick={() => { setMode('login'); clearErrors() }}
            >
              <ArrowRight className="w-3.5 h-3.5" />
              {t('auth.backToLogin')}
            </Button>
          </CardFooter>
        </Card>
      </AuthLayout>
    )
  }

  // ===== Login / Signup UI =====
  return (
    <AuthLayout t={t} lang={lang}>
      <Tabs
        defaultValue="login"
        value={mode === 'signup' ? 'signup' : 'login'}
        onValueChange={(v) => { setMode(v as Mode); clearErrors() }}
        className="w-full flex-1 flex flex-col min-h-0"
      >
        <div className="relative mb-4 sm:mb-6">
          <TabsList className="grid w-full grid-cols-2 glass border-border/50 h-11 sm:h-12 p-1">
            <TabsTrigger
              value="login"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300 text-xs sm:text-sm font-medium gap-1 sm:gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              {t('auth.login')}
            </TabsTrigger>
            <TabsTrigger
              value="signup"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300 text-xs sm:text-sm font-medium gap-1 sm:gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {t('auth.signup')}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ===== LOGIN ===== */}
        <TabsContent value="login" className="animate-auth-slide-in flex-1 flex flex-col min-h-0">
          <Card className="glass-strong border-border/50 overflow-hidden relative auth-card-compact">
            <CardHeader className="space-y-1 pb-2 sm:pb-3">
              <CardTitle className="font-display text-lg sm:text-2xl flex items-center gap-2">
                {t('auth.welcome')}
                <span className="text-base">👋</span>
              </CardTitle>
              <CardDescription className="text-[11px] sm:text-sm">{t('auth.welcomeDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              {/* Google sign-in (conditional) */}
              <GoogleSignInButton mode="signin" />
              <GoogleSignInSeparator t={t} />

              <div className="space-y-1.5">
                <Label htmlFor="lidentifier" className="text-xs uppercase tracking-wider font-medium">
                  {t('auth.identifier')}
                </Label>
                <div className="auth-input-wrap relative">
                  <AtSign className="auth-input-icon absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="lidentifier"
                    placeholder={t('auth.identifierPlaceholder')}
                    value={loginIdentifier}
                    onChange={(e) => {
                      setLoginIdentifier(e.target.value)
                      if (errors.identifier) clearErrors()
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    className={`auth-touch-input pr-10 bg-background/50 transition-all duration-200 ${
                      errors.identifier ? 'border-rose-500 focus-visible:ring-rose-500' : ''
                    }`}
                    dir="ltr"
                  />
                </div>
                {errors.identifier && <FieldError msg={errors.identifier} />}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="lpass" className="text-xs uppercase tracking-wider font-medium">
                  {t('auth.password')}
                </Label>
                <div className="auth-input-wrap relative">
                  <Lock className="auth-input-icon absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="lpass"
                    type={showLoginPass ? 'text' : 'password'}
                    placeholder={t('auth.passwordPlaceholder')}
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value)
                      if (errors.password) clearErrors()
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    className={`auth-touch-input pr-10 pl-10 bg-background/50 transition-all duration-200 ${
                      errors.password ? 'border-rose-500 focus-visible:ring-rose-500' : ''
                    }`}
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPass(!showLoginPass)}
                    tabIndex={-1}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors p-1 rounded-md hover:bg-primary/10"
                    aria-label={showLoginPass ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  >
                    {showLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <FieldError msg={errors.password} />}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors group">
                  <Checkbox
                    checked={remember} onCheckedChange={(v) => setRemember(!!v)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all"
                  />
                  <span className="group-hover:text-foreground transition-colors">{t('auth.rememberMe')}</span>
                </label>
                <button
                  type="button"
                  onClick={() => { setMode('forgot-identifier'); clearErrors() }}
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1 transition-colors"
                >
                  <KeyRound className="w-3 h-3" />
                  {t('auth.forgotPassword')}
                </button>
              </div>

              {errors.form && <FormError msg={errors.form} />}
            </CardContent>
            <CardFooter className="flex-col gap-3 pt-0">
              <Button
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2 h-12 glow-primary-sm auth-btn-shine font-medium text-sm"
                onClick={handleLogin} disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                {t('auth.enter')}
              </Button>
              <div className="text-center text-xs text-muted-foreground">
                {t('auth.noAccount')}{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signup'); clearErrors() }}
                  className="text-primary font-medium hover:underline inline-flex items-center gap-0.5"
                >
                  {t('auth.signup')}
                  <ArrowLeft className="w-3 h-3" />
                </button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* ===== SIGNUP (multi-step wizard) ===== */}
        <TabsContent value="signup" className="animate-auth-slide-in flex-1 flex flex-col min-h-0">
          <Card className="glass-strong border-border/50 overflow-hidden relative auth-card-compact">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="font-display text-lg sm:text-2xl flex items-center gap-2">
                {t('auth.createAccount')}
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </CardTitle>
              <CardDescription className="text-[11px] sm:text-sm">{t('auth.createDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <StepWizard
                total={4}
                labels={[t('auth.stepAccount'), t('auth.stepContact'), t('auth.stepSecurity'), t('auth.stepReview')]}
                titles={[t('auth.stepAccountTitle'), t('auth.stepContactTitle'), t('auth.stepSecurityTitle'), t('auth.stepReviewTitle')]}
                descriptions={[t('auth.stepAccountDesc'), t('auth.stepContactDesc'), t('auth.stepSecurityDesc'), t('auth.stepReviewDesc')]}
                validateStep={validateSignupStep}
                onFinish={handleSignup}
                loading={loading}
              >
                {(step) => (
                  <>
                    {/* ===== Step 0: Account ===== */}
                    {step === 0 && (
                      <>
                        {/* Google sign-up only on first step */}
                        <GoogleSignInButton mode="signup" />
                        <GoogleSignInSeparator t={t} />

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="susername" className="text-xs uppercase tracking-wider font-medium">
                              {t('auth.username')}
                            </Label>
                            {signupUsername && USERNAME_RE.test(signupUsername.trim()) && (
                              <Badge variant="outline" className="bg-success/10 text-success text-[9px] h-4 gap-0.5 px-1">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                {lang === 'ar' ? 'متاح' : 'Available'}
                              </Badge>
                            )}
                          </div>
                          <div className="auth-input-wrap relative">
                            <AtSign className="auth-input-icon absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="susername"
                              placeholder={t('auth.usernamePlaceholder')}
                              value={signupUsername}
                              onChange={(e) => {
                                setSignupUsername(e.target.value)
                                if (errors.username) clearErrors()
                              }}
                              className={`auth-touch-input pr-10 bg-background/50 transition-all duration-200 ${
                                errors.username ? 'border-rose-500 focus-visible:ring-rose-500' : ''
                              }`}
                              dir="ltr"
                            />
                          </div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 text-primary" />
                            {t('auth.usernameHint')}
                          </div>
                          {errors.username && <FieldError msg={errors.username} />}
                        </div>

                        <EmailField
                          id="semail" label={t('auth.email')} placeholder={t('auth.emailPlaceholder')}
                          value={signupEmail} onChange={(v) => {
                            setSignupEmail(v)
                            if (errors.email) clearErrors()
                          }}
                          error={errors.email}
                        />
                      </>
                    )}

                    {/* ===== Step 1: Contact ===== */}
                    {step === 1 && (
                      <>
                        <PhoneField
                          id="sphone" label={t('auth.phone')} placeholder={t('auth.phonePlaceholder')}
                          value={signupPhone} onPhoneChange={(v) => {
                            setSignupPhone(v)
                            if (errors.phone) clearErrors()
                          }}
                          countryCode={signupCountryCode} onCountryChange={setSignupCountryCode}
                          error={errors.phone}
                        />
                        <div className="rounded-lg bg-muted/30 border border-border/40 px-3 py-2.5 text-[11px] text-muted-foreground leading-relaxed flex items-start gap-2">
                          <Smartphone className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                          <span>
                            {lang === 'ar'
                              ? 'سيتم استخدام رقم هاتفك لاسترداد كلمة المرور وتنبيهات الأمان. لن نشاركه مع أي طرف ثالث.'
                              : 'Your phone will be used for password recovery and security alerts. We never share it with third parties.'}
                          </span>
                        </div>
                      </>
                    )}

                    {/* ===== Step 2: Security ===== */}
                    {step === 2 && (
                      <>
                        <PasswordField
                          id="spass" label={t('auth.password')} placeholder={t('auth.passwordPlaceholder')}
                          value={signupPassword} onChange={(v) => {
                            setSignupPassword(v)
                            if (errors.password) clearErrors()
                          }}
                          show={showSignupPass} onToggle={() => setShowSignupPass(!showSignupPass)}
                          error={errors.password}
                        />
                        {signupPassword && <PasswordStrengthMeter password={signupPassword} />}

                        <PasswordField
                          id="sconfirm" label={t('auth.confirmPassword')} placeholder={t('auth.confirmPlaceholder')}
                          value={signupConfirm} onChange={(v) => {
                            setSignupConfirm(v)
                            if (errors.confirm) clearErrors()
                          }}
                          show={showSignupPass} onToggle={() => setShowSignupPass(!showSignupPass)}
                          error={errors.confirm}
                        />
                      </>
                    )}

                    {/* ===== Step 3: Review + Referral + Terms ===== */}
                    {step === 3 && (
                      <>
                        {/* Summary card */}
                        <div className="rounded-xl border border-border/40 bg-muted/20 p-3 sm:p-4 space-y-2.5">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                              {t('auth.reviewSummary')}
                            </span>
                          </div>
                          <ReviewRow icon={AtSign} label={t('auth.username')} value={signupUsername} />
                          <ReviewRow icon={Mail} label={t('auth.email')} value={signupEmail} />
                          <ReviewRow
                            icon={Smartphone}
                            label={t('auth.phone')}
                            value={`${getDialCode(signupCountryCode)} ${signupPhone}`}
                            dir="ltr"
                          />
                          <ReviewRow
                            icon={Lock}
                            label={t('auth.password')}
                            value={'•'.repeat(Math.min(signupPassword.length, 12))}
                          />
                        </div>

                        {/* Referral code */}
                        <div className="space-y-1.5">
                          <Label htmlFor="sref" className="text-xs uppercase tracking-wider font-medium flex items-center gap-1.5">
                            <Gift className="w-3 h-3 text-primary" />
                            {t('auth.referralCode')}
                          </Label>
                          <div className="auth-input-wrap relative">
                            <Input
                              id="sref"
                              placeholder={t('auth.referralPlaceholder')}
                              value={signupReferral}
                              onChange={(e) => setSignupReferral(e.target.value.toUpperCase())}
                              className="auth-touch-input pr-10 bg-background/50 transition-all duration-200 font-num tracking-wider"
                              dir="ltr"
                            />
                            <Badge
                              variant="outline"
                              className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] h-5 px-1.5 bg-primary/10 text-primary border-primary/20"
                            >
                              +50 EGP
                            </Badge>
                          </div>
                        </div>

                        {/* Terms */}
                        <div className="rounded-xl border border-border/40 p-3 space-y-2 bg-muted/20">
                          <label className="flex items-start gap-2.5 cursor-pointer text-xs leading-relaxed group">
                            <Checkbox
                              checked={agreeTerms} onCheckedChange={(v) => {
                                setAgreeTerms(!!v)
                                if (errors.terms) clearErrors()
                              }}
                              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary mt-0.5 transition-all"
                            />
                            <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                              {t('auth.acceptTerms')}
                            </span>
                          </label>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 pl-6 text-[10px]">
                            <button
                              type="button"
                              onClick={() => setLegalDoc('terms')}
                              className="text-primary hover:underline inline-flex items-center gap-1 transition-colors"
                            >
                              <FileText className="w-3 h-3" />
                              {t('auth.readTerms')}
                              <ExternalLink className="w-2.5 h-2.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setLegalDoc('privacy')}
                              className="text-primary hover:underline inline-flex items-center gap-1 transition-colors"
                            >
                              <Shield className="w-3 h-3" />
                              {t('auth.readPrivacy')}
                              <ExternalLink className="w-2.5 h-2.5" />
                            </button>
                          </div>
                          {errors.terms && (
                            <div className="text-[10px] text-rose-500 pl-6 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {errors.terms}
                            </div>
                          )}
                        </div>

                        {errors.form && <FormError msg={errors.form} />}
                      </>
                    )}
                  </>
                )}
              </StepWizard>
            </CardContent>
            <CardFooter className="flex-col gap-1.5 pt-0 pb-3 sm:pb-4">
              <div className="text-center text-[11px] sm:text-xs text-muted-foreground w-full">
                {t('auth.haveAccount')}{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); clearErrors() }}
                  className="text-primary font-medium hover:underline"
                >
                  {t('auth.login')}
                </button>
              </div>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground text-center leading-relaxed">
                {t('auth.termsAgree')}{' '}
                <button onClick={() => setLegalDoc('terms')} className="text-primary hover:underline">
                  {t('auth.termsLink')}
                </button>{' '}{t('auth.and')}{' '}
                <button onClick={() => setLegalDoc('privacy')} className="text-primary hover:underline">
                  {t('auth.privacyLink')}
                </button>
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      <LegalDocDialog
        open={legalDoc !== null}
        type={legalDoc || 'terms'}
        onOpenChange={(o) => !o && setLegalDoc(null)}
      />
    </AuthLayout>
  )
}

// ===== Layout wrapper =====
function AuthLayout({
  children, t, lang, step,
}: {
  children: React.ReactNode
  t: (p: string) => string
  lang: 'ar' | 'en'
  step?: number // 1-4 for forgot password flow
}) {
  return (
    <div className="min-h-screen flex flex-col bg-mesh relative overflow-hidden">
      {/* Animated background layers */}
      <div className="absolute inset-0 bg-grid opacity-25 pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-[28rem] h-[28rem] rounded-full bg-primary/15 blur-[120px] pointer-events-none animate-auth-orb" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full bg-primary/10 blur-[100px] pointer-events-none animate-auth-orb" style={{ animationDelay: '-6s' }} />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-aurora-2/10 blur-[120px] pointer-events-none animate-auth-orb" style={{ animationDelay: '-12s' }} />

      {/* Mobile: full-height single column. Desktop: 2-column hero + form */}
      <div className="flex-1 grid lg:grid-cols-2 gap-0 relative z-10">
        {/* ===== Hero panel (desktop only) ===== */}
        <div className="hidden lg:flex flex-col justify-center p-10 xl:p-16 relative">
          <div className="max-w-md">
            <div className="mb-8 animate-auth-card-in">
              <BrandLogo size="xl" variant="banner" />
            </div>

            {/* Live ticker preview card — uses live live market data */}
            <AuthHeroTicker lang={lang} />

            <h2 className="font-display text-4xl xl:text-5xl font-bold mb-4 leading-[1.1] tracking-tight animate-auth-card-in" style={{ animationDelay: '0.15s' }}>
              {t('auth.heroTitle1')}
              <br />
              <span className="text-gradient-primary">{t('auth.heroTitle2')}</span>
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed text-sm animate-auth-card-in" style={{ animationDelay: '0.2s' }}>
              {t('auth.heroDesc')}
            </p>

            {/* Feature rows */}
            <div className="space-y-3 animate-auth-card-in" style={{ animationDelay: '0.25s' }}>
              <FeatureRow icon={Zap} title={t('auth.feat1Title')} desc={t('auth.feat1Desc')} />
              <FeatureRow icon={Users} title={t('auth.feat2Title')} desc={t('auth.feat2Desc')} />
              <FeatureRow icon={Shield} title={t('auth.feat3Title')} desc={t('auth.feat3Desc')} />
            </div>

            {/* Stats row */}
            <div className="mt-10 grid grid-cols-3 gap-3 animate-auth-card-in" style={{ animationDelay: '0.3s' }}>
              <HeroStat value="0.3%" label={t('auth.statFee')} />
              <HeroStat value="<5min" label={t('auth.statTime')} />
              <HeroStat value="100%" label={t('auth.statEscrow')} />
            </div>
          </div>
        </div>

        {/* ===== Form side =====
            Mobile: full-height, top-aligned, fills available space (no centering).
            Desktop: centered within a max-width column. */}
        <div className="auth-form-side flex flex-col p-3 sm:p-6 lg:p-12 lg:items-center lg:justify-center relative auth-safe-bottom">
          {/* Mobile: compact brand at top (icon only, not full logo) */}
          <div className="lg:hidden flex items-center justify-center mb-2 sm:mb-4 animate-auth-card-in">
            <BrandLogo size="md" />
          </div>

          {/* Form container: full width on mobile, max-w-md on desktop */}
          <div className="w-full lg:max-w-md flex-1 lg:flex-none flex flex-col min-h-0">
            {/* Step indicator (forgot password flow) */}
            {step && (
              <StepIndicator step={step} t={t} lang={lang} />
            )}

            {children}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 py-2.5 sm:py-3 px-4 sm:px-6 text-center text-[10px] sm:text-[11px] text-muted-foreground relative z-10">
        <div className="container mx-auto flex items-center justify-center gap-1.5">
          <Shield className="w-3 h-3 text-success" />
          © <span className="font-num">2026</span> Eg-Money — {t('auth.protectedByEscrow')}
        </div>
      </footer>
    </div>
  )
}

// Step indicator for forgot password flow
function StepIndicator({ step, t, lang }: { step: number; t: (p: string) => string; lang: 'ar' | 'en' }) {
  const steps = [
    { num: 1, label: lang === 'ar' ? 'البحث' : 'Find' },
    { num: 2, label: lang === 'ar' ? 'القناة' : 'Channel' },
    { num: 3, label: lang === 'ar' ? 'التحقق' : 'Verify' },
    { num: 4, label: lang === 'ar' ? 'تجديد' : 'Reset' },
  ]
  return (
    <div className="mb-5 flex items-center justify-between gap-1 animate-auth-card-in">
      {steps.map((s, i) => (
        <div key={s.num} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-num font-bold transition-all duration-300 ${
                step >= s.num
                  ? 'bg-primary text-primary-foreground shadow-[0_0_12px_oklch(0.82_0.20_145/0.5)]'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {step > s.num ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.num}
            </div>
            <div className={`text-[9px] ${step >= s.num ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              {s.label}
            </div>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`h-0.5 flex-1 mx-1.5 rounded-full transition-all duration-500 ${
                step > s.num ? 'bg-primary' : 'bg-muted'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// Hero stat card
function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="glass rounded-xl p-3 text-center hover-lift">
      <div className="font-num text-xl font-bold text-gradient-primary">{value}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
    </div>
  )
}

// ===== Sub-components =====
function GoogleSignInSeparator({ t }: { t: (p: string) => string }) {
  return (
    <div className="relative my-2.5 sm:my-3">
      <Separator />
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2.5 sm:px-3 text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider">
        {t('auth.orContinueWith')}
      </span>
    </div>
  )
}

function ChannelOption({
  icon: Icon, title, desc, masked, onClick, disabled,
}: {
  icon: any; title: string; desc: string; masked?: string | null
  onClick: () => void; disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="auth-glass-hover w-full text-left p-3.5 rounded-xl border border-border/50 hover:border-primary/50 hover:bg-primary/5 hover:translate-y-[-1px] transition-all duration-200 flex items-start gap-3 disabled:opacity-50 disabled:hover:translate-y-0 group"
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm">{title}</div>
        <div className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{desc}</div>
        {masked && (
          <div className="text-[11px] font-mono text-primary mt-1.5 px-2 py-0.5 rounded-md bg-primary/10 inline-block" dir="ltr">
            {masked}
          </div>
        )}
      </div>
      <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:-translate-x-0.5 flex-shrink-0 mt-1 transition-all" />
    </button>
  )
}

function FormError({ msg }: { msg: string }) {
  return (
    <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 px-3 py-2.5 flex items-start gap-2 animate-auth-shake">
      <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
      <span className="text-xs text-rose-600 dark:text-rose-400 leading-relaxed">{msg}</span>
    </div>
  )
}

function FieldError({ msg }: { msg: string }) {
  return (
    <div className="text-[10px] text-rose-500 flex items-center gap-1 animate-auth-slide-in">
      <AlertCircle className="w-3 h-3 flex-shrink-0" />
      {msg}
    </div>
  )
}

function EmailField({
  id, label, placeholder, value, onChange, error, onEnter,
}: {
  id: string; label: string; placeholder: string
  value: string; onChange: (v: string) => void
  error?: string; onEnter?: () => void
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs uppercase tracking-wider font-medium">{label}</Label>
      <div className="auth-input-wrap relative">
        <Mail className="auth-input-icon absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          id={id} type="email" placeholder={placeholder} value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
          className={`auth-touch-input pr-10 bg-background/50 transition-all duration-200 ${error ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
          dir="ltr"
        />
      </div>
      {error && <FieldError msg={error} />}
    </div>
  )
}

function PasswordField({
  id, label, placeholder, value, onChange, show, onToggle, error, onEnter,
}: {
  id: string; label: string; placeholder: string
  value: string; onChange: (v: string) => void
  show: boolean; onToggle: () => void
  error?: string; onEnter?: () => void
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs uppercase tracking-wider font-medium">{label}</Label>
      <div className="auth-input-wrap relative">
        <Lock className="auth-input-icon absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          id={id} type={show ? 'text' : 'password'} placeholder={placeholder} value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
          className={`auth-touch-input pr-10 pl-10 bg-background/50 transition-all duration-200 ${error ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
          dir="ltr"
        />
        <button
          type="button" onClick={onToggle} tabIndex={-1}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors p-1 rounded-md hover:bg-primary/10"
          aria-label={show ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <FieldError msg={error} />}
    </div>
  )
}

function FeatureRow({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="flex items-center gap-3 group">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="min-w-0">
        <div className="font-semibold text-sm">{title}</div>
        <div className="text-[11px] text-muted-foreground leading-snug">{desc}</div>
      </div>
    </div>
  )
}

// Review row (used in signup review step)
function ReviewRow({
  icon: Icon, label, value, dir,
}: {
  icon: any; label: string; value: string; dir?: 'ltr' | 'rtl'
}) {
  return (
    <div className="flex items-center gap-2.5 text-xs">
      <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
        <Icon className="w-3 h-3" />
      </div>
      <span className="text-muted-foreground flex-shrink-0 min-w-[60px]">{label}</span>
      <span className="font-medium text-foreground truncate flex-1 text-right" dir={dir || 'auto'}>
        {value || '—'}
      </span>
    </div>
  )
}

// ===== Live ticker card for the auth hero panel (desktop) =====
// Pulls live live market data via the same WebSocket the rest of the platform uses.
// No static fallback prices — shows dashes while connecting.
function AuthHeroTicker({ lang }: { lang: 'ar' | 'en' }) {
  const { data, connected } = useTicker()
  const hasData = !!data && connected
  const fmt = (n: number) => hasData ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) : '—'
  const change = data?.change24h ?? 0
  const isUp = change >= 0

  return (
    <div className="mb-8 glass rounded-2xl p-4 relative overflow-hidden animate-auth-card-in" style={{ animationDelay: '0.1s' }}>
      <div className="auth-scan-line" />
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-aurora-2 flex items-center justify-center font-bold text-primary-foreground text-xs">
            ₮
          </div>
          <div>
            <div className="text-xs font-semibold">USDT / EGP</div>
            <div className="text-[10px] text-muted-foreground flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-auth-live-dot" />
              {lang === 'ar' ? 'مباشر' : 'Live'}
            </div>
          </div>
        </div>
        <Badge variant="outline" className={`text-[10px] gap-0.5 ${isUp ? 'bg-success/10 text-success' : 'bg-rose-500/10 text-rose-400'}`}>
          {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
          <span className="font-num">{hasData ? `${isUp ? '+' : ''}${change.toFixed(2)}%` : '—'}</span>
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-background/40 p-2.5">
          <div className="text-[9px] text-muted-foreground uppercase tracking-wider">{lang === 'ar' ? 'شراء' : 'Buy'}</div>
          <div className="font-num text-lg font-bold text-success">{fmt(data?.buyPriceEgp ?? 0)}</div>
        </div>
        <div className="rounded-lg bg-background/40 p-2.5">
          <div className="text-[9px] text-muted-foreground uppercase tracking-wider">{lang === 'ar' ? 'بيع' : 'Sell'}</div>
          <div className="font-num text-lg font-bold text-primary">{fmt(data?.sellPriceEgp ?? 0)}</div>
        </div>
      </div>
    </div>
  )
}
