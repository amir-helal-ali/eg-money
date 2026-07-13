'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Settings, Bell, Volume2, Languages, Moon, Sun, Smartphone, Vibrate,
  Check, Mail, Phone, Shield, Lock, Loader2, KeyRound,
} from 'lucide-react'
import { useLanguage } from '@/hooks/use-language'
import { useSound } from '@/hooks/use-sound'
import { usePushNotifications } from '@/hooks/use-push-notifications'
import { useAuth, apiCall } from '@/lib/client'
import { toast } from 'sonner'

export function SettingsPanel() {
  const { lang, changeLang, t } = useLanguage()
  const { user } = useAuth()
  const { isEnabled: soundEnabled, setEnabled: setSoundEnabled, playNotification } = useSound()
  const { isEnabled: pushEnabled, setEnabled: setPushEnabled, permission, requestPermission, isSupported } = usePushNotifications()
  const [open, setOpen] = useState(false)

  // Change password state
  const [showChangePass, setShowChangePass] = useState(false)
  const [currentPass, setCurrentPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [changingPass, setChangingPass] = useState(false)

  // Load dark mode preference
  const [dark, setDark] = useState(true)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDark(document.documentElement.classList.contains("dark"))
  }, [])

  function toggleDark() {
    const newDark = !dark
    setDark(newDark)
    if (newDark) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }

  function handleSoundToggle() {
    const newVal = !soundEnabled()
    setSoundEnabled(newVal)
    if (newVal) playNotification()
    toast.success(newVal ? (lang === 'ar' ? 'تم تفعيل الأصوات' : 'Sounds enabled') : (lang === 'ar' ? 'تم كتم الأصوات' : 'Sounds disabled'))
  }

  async function handlePushToggle() {
    const newVal = !pushEnabled()
    setPushEnabled(newVal)
    if (newVal) {
      if (permission !== 'granted') {
        const result = await requestPermission()
        if (result !== 'granted') {
          toast.error(lang === 'ar' ? 'تم رفض إذن الإشعارات' : 'Notification permission denied')
          setPushEnabled(false)
          return
        }
      }
      toast.success(lang === 'ar' ? 'تم تفعيل الإشعارات' : 'Push notifications enabled')
    } else {
      toast.success(lang === 'ar' ? 'تم إيقاف الإشعارات' : 'Push notifications disabled')
    }
  }

  function handleLangChange(newLang: 'ar' | 'en') {
    changeLang(newLang)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9" aria-label={lang === 'ar' ? 'الإعدادات' : 'Settings'}>
          <Settings className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md glass-strong border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            {lang === 'ar' ? 'الإعدادات' : 'Settings'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-1 py-2">
          {/* Language */}
          <SettingRow
            icon={Languages}
            label={lang === 'ar' ? 'اللغة' : 'Language'}
            desc={lang === 'ar' ? 'اختر لغة الواجهة' : 'Choose interface language'}
          >
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={lang === 'ar' ? 'default' : 'outline'}
                className="h-7 px-2 text-xs"
                onClick={() => handleLangChange('ar')}
              >
                🇪🇬 عربي
              </Button>
              <Button
                size="sm"
                variant={lang === 'en' ? 'default' : 'outline'}
                className="h-7 px-2 text-xs"
                onClick={() => handleLangChange('en')}
              >
                🇬🇧 EN
              </Button>
            </div>
          </SettingRow>

          {/* Dark Mode */}
          <SettingRow
            icon={dark ? Moon : Sun}
            label={lang === 'ar' ? (dark ? 'الوضع الداكن' : 'الوضع الفاتح') : (dark ? 'Dark Mode' : 'Light Mode')}
            desc={lang === 'ar' ? 'تبديل مظهر الواجهة' : 'Toggle interface appearance'}
          >
            <Switch checked={dark} onCheckedChange={toggleDark} />
          </SettingRow>

          {/* Sound Effects */}
          <SettingRow
            icon={Volume2}
            label={lang === 'ar' ? 'المؤثرات الصوتية' : 'Sound Effects'}
            desc={lang === 'ar' ? 'أصوات الإشعارات والصفقات' : 'Notification and trade sounds'}
          >
            <Switch checked={soundEnabled()} onCheckedChange={handleSoundToggle} />
          </SettingRow>

          {/* Push Notifications */}
          <SettingRow
            icon={Bell}
            label={lang === 'ar' ? 'إشعارات المتصفح' : 'Push Notifications'}
            desc={
              !isSupported
                ? (lang === 'ar' ? 'غير مدعوم في هذا المتصفح' : 'Not supported in this browser')
                : permission === 'denied'
                  ? (lang === 'ar' ? 'تم رفض الإذن — فعّله من إعدادات المتصفح' : 'Permission denied — enable in browser settings')
                  : (lang === 'ar' ? 'إشعارات native على مستوى OS' : 'Native OS-level notifications')
            }
          >
            <Switch
              checked={pushEnabled() && permission === 'granted'}
              onCheckedChange={handlePushToggle}
              disabled={!isSupported || permission === 'denied'}
            />
          </SettingRow>

          {/* Account & Verification */}
          <div className="pt-3 mt-3 border-t border-border/50 space-y-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">الحساب</div>

            {/* Verification status */}
            {user && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/20">
                <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="flex-1 flex flex-wrap gap-1.5">
                  <Badge variant="outline" className={user.emailVerified ? 'text-emerald-500' : 'text-rose-400'}>
                    <Mail className="w-2.5 h-2.5 ml-0.5" />
                    {user.emailVerified ? 'بريد مؤكد' : 'بريد غير مؤكد'}
                  </Badge>
                  {user.phone && (
                    <Badge variant="outline" className={user.phoneVerified ? 'text-emerald-500' : 'text-rose-400'}>
                      <Phone className="w-2.5 h-2.5 ml-0.5" />
                      {user.phoneVerified ? 'هاتف مؤكد' : 'هاتف غير مؤكد'}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Change password */}
            {!showChangePass ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 h-9"
                onClick={() => setShowChangePass(true)}
              >
                <KeyRound className="w-4 h-4" />
                تغيير كلمة المرور
              </Button>
            ) : (
              <div className="space-y-2 p-3 rounded-lg border border-border/50">
                <div className="space-y-1">
                  <Label className="text-[10px]">كلمة المرور الحالية</Label>
                  <Input
                    type="password"
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                    placeholder="••••••••"
                    dir="ltr"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">كلمة المرور الجديدة</Label>
                  <Input
                    type="password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="8+ أحرف، أحرف كبيرة/صغيرة، أرقام، رموز"
                    dir="ltr"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">تأكيد كلمة المرور</Label>
                  <Input
                    type="password"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    placeholder="••••••••"
                    dir="ltr"
                    className="h-9"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 gap-1.5 h-8"
                    onClick={async () => {
                      if (!currentPass || !newPass) { toast.error('أدخل كل الحقول'); return }
                      if (newPass !== confirmPass) { toast.error('كلمتا المرور غير متطابقتين'); return }
                      setChangingPass(true)
                      const { data, error } = await apiCall('/api/auth/change-password', {
                        method: 'POST',
                        body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass }),
                      })
                      setChangingPass(false)
                      if (error) { toast.error(error); return }
                      toast.success(data.message)
                      setShowChangePass(false)
                      setCurrentPass(''); setNewPass(''); setConfirmPass('')
                    }}
                    disabled={changingPass || !currentPass || !newPass || newPass !== confirmPass}
                  >
                    {changingPass ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    تغيير
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8"
                    onClick={() => { setShowChangePass(false); setCurrentPass(''); setNewPass(''); setConfirmPass('') }}
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Test buttons */}
          <div className="pt-3 mt-3 border-t border-border/50 space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 h-9"
              onClick={() => {
                playNotification()
                toast.success(lang === 'ar' ? 'تم تشغيل صوت تجريبي' : 'Test sound played')
              }}
              disabled={!soundEnabled()}
            >
              <Volume2 className="w-4 h-4" />
              {lang === 'ar' ? 'تجربة الصوت' : 'Test Sound'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 h-9"
              onClick={() => {
                if (pushEnabled() && permission === 'granted') {
                  new Notification('Eg-Money', {
                    body: lang === 'ar' ? 'هذا إشعار تجريبي ✅' : 'This is a test notification ✅',
                    icon: '/brand/favicon-64.png',
                  })
                  toast.success(lang === 'ar' ? 'تم إرسال إشعار تجريبي' : 'Test notification sent')
                } else {
                  toast.error(lang === 'ar' ? 'فعّل الإشعارات أولاً' : 'Enable notifications first')
                }
              }}
              disabled={!pushEnabled() || permission !== 'granted'}
            >
              <Bell className="w-4 h-4" />
              {lang === 'ar' ? 'تجربة الإشعار' : 'Test Notification'}
            </Button>
          </div>

          {/* Info */}
          <div className="pt-3 mt-3 border-t border-border/50">
            <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
              {lang === 'ar'
                ? 'يتم حفظ تفضيلاتك تلقائياً على هذا الجهاز'
                : 'Your preferences are saved automatically on this device'}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SettingRow({
  icon: Icon, label, desc, children,
}: {
  icon: any; label: string; desc: string; children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">{label}</div>
          <div className="text-[10px] text-muted-foreground leading-snug">{desc}</div>
        </div>
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}
