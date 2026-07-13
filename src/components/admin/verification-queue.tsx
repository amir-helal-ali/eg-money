'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { apiCall, showSuccess, showError } from '@/lib/client'
import {
  Loader2, Mail, Phone, Shield, CheckCircle2, XCircle, Key, Clock,
  AlertCircle, Users,
} from 'lucide-react'

type VerificationUser = {
  id: string
  email: string
  username: string
  name: string | null
  phone: string | null
  emailVerified: boolean
  phoneVerified: boolean
  hasActiveOtp: boolean
  otpCode: string | null
  otpChannel: string | null
  otpExpires: string | null
  createdAt: string
}

export function VerificationQueue() {
  const [users, setUsers] = useState<VerificationUser[]>([])
  const [stats, setStats] = useState({ total: 0, emailUnverified: 0, phoneUnverified: 0, noPhone: 0, activeOtps: 0 })
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const { data, error } = await apiCall<{ users: VerificationUser[]; stats: any }>('/api/admin/verifications')
    setLoading(false)
    if (data) {
      setUsers(data.users)
      setStats(data.stats)
    }
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [])

  async function verifyUser(userId: string, action: string) {
    const { data, error } = await apiCall(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action }),
    })
    if (error) { showError(error); return }
    showSuccess('تم التحديث')
    load()
  }

  if (loading) {
    return <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
  }

  if (users.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-emerald-500" />
          <p className="text-sm">جميع المستخدمين مؤكدون ✅</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <StatBox label="إجمالي" value={stats.total} icon={Users} color="text-primary" />
        <StatBox label="بريد غير مؤكد" value={stats.emailUnverified} icon={Mail} color="text-amber-500" />
        <StatBox label="هاتف غير مؤكد" value={stats.phoneUnverified} icon={Phone} color="text-amber-500" />
        <StatBox label="بدون هاتف" value={stats.noPhone} icon={AlertCircle} color="text-rose-400" />
        <StatBox label="OTP نشط" value={stats.activeOtps} icon={Key} color="text-blue-400" />
      </div>

      {/* Users list */}
      {users.map((u) => (
        <Card key={u.id}>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex-1 space-y-2">
                {/* User info */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    {(u.name || u.email)[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{u.name || u.username}</div>
                    <div className="text-[10px] text-muted-foreground">{u.email}</div>
                  </div>
                </div>

                {/* Verification badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={u.emailVerified ? 'text-emerald-500' : 'text-rose-400'}>
                    <Mail className="w-2.5 h-2.5 ml-1" />
                    {u.emailVerified ? 'بريد مؤكد' : 'بريد غير مؤكد'}
                  </Badge>
                  {u.phone && (
                    <Badge variant="outline" className={u.phoneVerified ? 'text-emerald-500' : 'text-rose-400'}>
                      <Phone className="w-2.5 h-2.5 ml-1" />
                      {u.phoneVerified ? 'هاتف مؤكد' : 'هاتف غير مؤكد'}
                    </Badge>
                  )}
                  {!u.phone && (
                    <Badge variant="outline" className="text-rose-400">
                      <AlertCircle className="w-2.5 h-2.5 ml-1" />
                      بدون هاتف
                    </Badge>
                  )}
                </div>

                {/* Active OTP */}
                {u.hasActiveOtp && u.otpCode && (
                  <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-2 flex items-center gap-2">
                    <Key className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">رمز {u.otpChannel === 'EMAIL' ? 'البريد' : 'الهاتف'}:</span>
                    <span className="font-num font-bold text-blue-400 tracking-wider">{u.otpCode}</span>
                    {u.otpExpires && (
                      <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        ينتهي {new Date(u.otpExpires).toLocaleTimeString('ar-EG')}
                      </span>
                    )}
                  </div>
                )}

                {u.phone && (
                  <div className="text-[10px] text-muted-foreground font-num" dir="ltr">{u.phone}</div>
                )}
              </div>

              {/* Admin actions */}
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                {!u.emailVerified && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs h-8"
                    onClick={() => verifyUser(u.id, 'VERIFY_EMAIL')}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    تأكيد البريد
                  </Button>
                )}
                {!u.phoneVerified && u.phone && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs h-8"
                    onClick={() => verifyUser(u.id, 'VERIFY_PHONE')}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    تأكيد الهاتف
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1.5 text-xs h-8 text-rose-400"
                  onClick={() => {
                    if (u.emailVerified) verifyUser(u.id, 'UNVERIFY_EMAIL')
                    if (u.phoneVerified) verifyUser(u.id, 'UNVERIFY_PHONE')
                  }}
                >
                  <XCircle className="w-3 h-3" />
                  إلغاء التأكيد
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function StatBox({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  return (
    <div className="rounded-lg bg-muted/30 p-2.5 text-center">
      <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
      <div className={`font-num text-lg font-bold ${color}`}>{value}</div>
      <div className="text-[9px] text-muted-foreground">{label}</div>
    </div>
  )
}
