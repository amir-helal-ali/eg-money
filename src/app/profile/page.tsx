'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { BrandLogo } from '@/components/brand-logo'
import { useAuth, apiCall, fmtEgp, fmtUsdt, showSuccess, showError } from '@/lib/client'
import {
  ArrowRight, Loader2, User, Mail, Phone, Shield, KeyRound, Calendar,
  Check, AlertTriangle, Save, Coins, Wallet, Users as UsersIcon,
  TrendingUp, Bell, BellOff,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const router = useRouter()
  const { user, initialized, fetchUser } = useAuth()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  // Change password state
  const [currentPass, setCurrentPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [changingPass, setChangingPass] = useState(false)

  // Notification preferences
  type Prefs = {
    notifyEmail: boolean
    notifyPush: boolean
    emailSecurity: boolean
    emailDeposits: boolean
    emailWithdrawals: boolean
    emailP2p: boolean
    emailMarketing: boolean
    pushSecurity: boolean
    pushDeposits: boolean
    pushWithdrawals: boolean
    pushP2p: boolean
  }
  const [prefs, setPrefs] = useState<Prefs | null>(null)
  const [savingPrefs, setSavingPrefs] = useState(false)

  // Load notification preferences
  useEffect(() => {
    if (!user) return
    apiCall<{ preferences: Prefs }>('/api/settings/notifications').then(({ data }) => {
      if (data) setPrefs(data.preferences)
    })
  }, [user])

  async function togglePref(key: keyof Prefs, value: boolean) {
    if (!prefs) return
    const updated = { ...prefs, [key]: value }
    setPrefs(updated)
    setSavingPrefs(true)
    const { error } = await apiCall('/api/settings/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ [key]: value }),
    })
    setSavingPrefs(false)
    if (error) {
      showError(error)
      setPrefs(prefs) // revert
    }
  }

  // Trigger auth initialization on mount
  useEffect(() => {
    if (!initialized) {
      fetchUser()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!initialized) return
    if (!user) {
      router.push('/')
      return
    }
    setName(user.name || '')
  }, [initialized, user])

  async function handleSaveName() {
    if (!name.trim()) {
      showError('الاسم مطلوب')
      return
    }
    setSaving(true)
    const { data, error } = await apiCall('/api/auth/update-profile', {
      method: 'POST',
      body: JSON.stringify({ name: name.trim() }),
    })
    setSaving(false)
    if (error) {
      showError(error)
      return
    }
    showSuccess(data?.message || 'تم التحديث')
    await fetchUser()
  }

  async function handleChangePassword() {
    if (!currentPass || !newPass || !confirmPass) {
      showError('املأ جميع الحقول')
      return
    }
    if (newPass !== confirmPass) {
      showError('كلمتا المرور غير متطابقتين')
      return
    }
    if (newPass.length < 8) {
      showError('كلمة المرور يجب أن تكون 8 أحرف على الأقل')
      return
    }
    setChangingPass(true)
    const { data, error } = await apiCall('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword: currentPass,
        newPassword: newPass,
      }),
    })
    setChangingPass(false)
    if (error) {
      showError(error)
      return
    }
    showSuccess(data?.message || 'تم تغيير كلمة المرور')
    setCurrentPass('')
    setNewPass('')
    setConfirmPass('')
  }

  if (!initialized || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container-fluid">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Button variant="ghost" size="sm" className="gap-1" onClick={() => router.push('/')}>
              <ArrowRight className="w-4 h-4" />
              رجوع
            </Button>
            <BrandLogo size="sm" />
            <div className="w-16" />
          </div>
        </div>
      </header>

      <main className="container-fluid py-6 space-y-6 max-w-3xl mx-auto">
        {/* Profile header */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarFallback className="text-2xl font-bold bg-primary/20">
                  {(user?.name || user?.username || '?').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold truncate">{user.name || user.username}</h1>
                <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  {user.emailVerified && (
                    <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300">
                      <Check className="w-2.5 h-2.5" />
                      بريد مؤكد
                    </Badge>
                  )}
                  {user.phoneVerified && (
                    <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300">
                      <Check className="w-2.5 h-2.5" />
                      هاتف مؤكد
                    </Badge>
                  )}
                  {user.role === 'ADMIN' && (
                    <Badge variant="outline" className="text-[10px] text-primary border-primary/50">
                      <Shield className="w-2.5 h-2.5" />
                      مدير
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account summary */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-lg font-bold font-num">{fmtEgp(user.egpBalance)}</div>
                <div className="text-[10px] text-muted-foreground">رصيد EGP</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Coins className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <div className="text-lg font-bold font-num">{fmtUsdt(user.usdtBalance)}</div>
                <div className="text-[10px] text-muted-foreground">رصيد USDT</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Edit profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4" />
              الملف الشخصي
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name (editable) */}
            <div className="space-y-2">
              <Label>الاسم المعروض</Label>
              <div className="flex gap-2">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="اكتب اسمك"
                  maxLength={50}
                />
                <Button onClick={handleSaveName} disabled={saving || name === (user.name || '')}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                هذا الاسم يظهر للآخرين في سوق P2P والملف العام
              </p>
            </div>

            <Separator />

            {/* Email (read-only if verified) */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">البريد الإلكتروني</Label>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate">{user.email}</span>
                </div>
                {user.emailVerified ? (
                  <Badge variant="outline" className="text-[9px] text-emerald-600 border-emerald-300 shrink-0">
                    <Check className="w-2.5 h-2.5" />
                    مؤكد
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[9px] text-amber-600 border-amber-300 shrink-0">
                    <AlertTriangle className="w-2.5 h-2.5" />
                    غير مؤكد
                  </Badge>
                )}
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">رقم الهاتف</Label>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate">{user.phone || 'غير مُدخل'}</span>
                </div>
                {user.phone && (
                  user.phoneVerified ? (
                    <Badge variant="outline" className="text-[9px] text-emerald-600 border-emerald-300 shrink-0">
                      <Check className="w-2.5 h-2.5" />
                      مؤكد
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[9px] text-amber-600 border-amber-300 shrink-0">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      غير مؤكد
                    </Badge>
                  )
                )}
              </div>
            </div>

            {/* Referral code */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">كود الإحالة</Label>
              <div className="flex items-center gap-2">
                <UsersIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">{user.referralCode}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px] mr-auto"
                  onClick={() => {
                    navigator.clipboard.writeText(user?.referralCode || '')
                    showSuccess('تم نسخ كود الإحالة')
                  }}
                >
                  نسخ
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change password */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <KeyRound className="w-4 h-4" />
              تغيير كلمة المرور
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs">كلمة المرور الحالية</Label>
              <Input
                type="password"
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">كلمة المرور الجديدة</Label>
              <Input
                type="password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="••••••••"
              />
              {newPass && newPass.length < 8 && (
                <p className="text-[10px] text-amber-600">8 أحرف على الأقل</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-xs">تأكيد كلمة المرور</Label>
              <Input
                type="password"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="••••••••"
              />
              {confirmPass && confirmPass !== newPass && (
                <p className="text-[10px] text-rose-600">غير متطابقة</p>
              )}
            </div>
            <Button
              onClick={handleChangePassword}
              disabled={changingPass || !currentPass || !newPass || !confirmPass || newPass !== confirmPass}
              className="w-full"
            >
              {changingPass ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              تغيير كلمة المرور
            </Button>
          </CardContent>
        </Card>

        {/* Notification preferences */}
        {prefs && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {prefs.notifyEmail || prefs.notifyPush ? (
                  <Bell className="w-4 h-4" />
                ) : (
                  <BellOff className="w-4 h-4" />
                )}
                تفضيلات الإشعارات
                {savingPrefs && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Master switches */}
              <div className="space-y-3 p-3 rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">إشعارات البريد الإلكتروني</div>
                    <div className="text-[10px] text-muted-foreground">تفعيل/تعطيل كل رسائل البريد</div>
                  </div>
                  <Switch
                    checked={prefs.notifyEmail}
                    onCheckedChange={(v) => togglePref('notifyEmail', v)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">إشعارات Push</div>
                    <div className="text-[10px] text-muted-foreground">تفعيل/تعطيل كل الإشعارات الفورية</div>
                  </div>
                  <Switch
                    checked={prefs.notifyPush}
                    onCheckedChange={(v) => togglePref('notifyPush', v)}
                  />
                </div>
              </div>

              {/* Email categories */}
              {prefs.notifyEmail && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">فئات البريد الإلكتروني</div>
                  {[
                    { key: 'emailSecurity' as const, label: 'تنبيهات أمنية', desc: 'تسجيل دخول، تغيير كلمة مرور' },
                    { key: 'emailDeposits' as const, label: 'الإيداعات', desc: 'اعتماد/رفض الإيداع' },
                    { key: 'emailWithdrawals' as const, label: 'السحوبات', desc: 'معالجة/رفض السحب' },
                    { key: 'emailP2p' as const, label: 'صفقات P2P', desc: 'تحديثات الصفقات والنزاعات' },
                    { key: 'emailMarketing' as const, label: 'عروض وأخبار', desc: 'نشرة بريدية، ترقيات' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-1">
                      <div>
                        <div className="text-sm">{item.label}</div>
                        <div className="text-[10px] text-muted-foreground">{item.desc}</div>
                      </div>
                      <Switch
                        checked={prefs[item.key]}
                        onCheckedChange={(v) => togglePref(item.key, v)}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Push categories */}
              {prefs.notifyPush && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">فئات الإشعارات الفورية</div>
                  {[
                    { key: 'pushSecurity' as const, label: 'تنبيهات أمنية', desc: 'تسجيل دخول جديد' },
                    { key: 'pushDeposits' as const, label: 'الإيداعات', desc: 'اعتماد/رفض الإيداع' },
                    { key: 'pushWithdrawals' as const, label: 'السحوبات', desc: 'معالجة/رفض السحب' },
                    { key: 'pushP2p' as const, label: 'صفقات P2P', desc: 'رسائل، تحديثات، نزاعات' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-1">
                      <div>
                        <div className="text-sm">{item.label}</div>
                        <div className="text-[10px] text-muted-foreground">{item.desc}</div>
                      </div>
                      <Switch
                        checked={prefs[item.key]}
                        onCheckedChange={(v) => togglePref(item.key, v)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick links */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">روابط سريعة</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <a href="/transactions">
              <Button variant="outline" className="w-full gap-2 justify-start">
                <TrendingUp className="w-4 h-4" />
                سجل المعاملات
              </Button>
            </a>
            <a href="/security">
              <Button variant="outline" className="w-full gap-2 justify-start">
                <Shield className="w-4 h-4" />
                السجل الأمني
              </Button>
            </a>
            <a href="/help">
              <Button variant="outline" className="w-full gap-2 justify-start">
                <Calendar className="w-4 h-4" />
                مركز المساعدة
              </Button>
            </a>
            <a href="/learn">
              <Button variant="outline" className="w-full gap-2 justify-start">
                <TrendingUp className="w-4 h-4" />
                أكاديمية التداول
              </Button>
            </a>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
