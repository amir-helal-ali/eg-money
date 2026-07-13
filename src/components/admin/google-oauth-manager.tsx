'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { apiCall, showSuccess, showError } from '@/lib/client'
import { useLanguage } from '@/hooks/use-language'
import { Loader2, ShieldCheck, Info, ExternalLink } from 'lucide-react'

export function GoogleOAuthManager() {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data, error } = await apiCall<{ settings: any }>('/api/admin/settings')
    setLoading(false)
    if (error) {
      showError(error)
      return
    }
    if (data?.settings) {
      setEnabled(!!data.settings.googleOAuthEnabled)
      setClientId(data.settings.googleClientId || '')
      setClientSecret(data.settings.googleClientSecret || '')
    }
  }

  async function save() {
    setSaving(true)
    const payload: any = {
      googleOAuthEnabled: enabled,
      googleClientId: clientId,
    }
    // Only send secret if admin typed something new (not the masked placeholder)
    if (clientSecret && !clientSecret.startsWith('•••')) {
      payload.googleClientSecret = clientSecret
    }
    const { data, error } = await apiCall('/api/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    setSaving(false)
    if (error) {
      showError(error)
      return
    }
    showSuccess(t('admin.googleSaved'))
    load()
  }

  return (
    <Card className="glass border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            {t('admin.googleOAuth')}
          </div>
          <Badge
            variant="outline"
            className={enabled
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'bg-muted text-muted-foreground'}
          >
            {enabled ? t('admin.googleEnabled') : t('admin.googleDisabled')}
          </Badge>
        </CardTitle>
        <CardDescription className="text-xs">{t('admin.googleOAuthDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Enable toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div>
                <div className="text-sm font-medium">{t('admin.googleEnable')}</div>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>

            {/* Client ID */}
            <div className="space-y-1.5">
              <Label htmlFor="gcid" className="text-xs uppercase tracking-wider">
                {t('admin.googleClientId')}
              </Label>
              <Input
                id="gcid"
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="123456789-xxxxxxxx.apps.googleusercontent.com"
                className="font-mono text-xs bg-background/50"
                dir="ltr"
              />
              <div className="text-[10px] text-muted-foreground">
                {t('admin.googleClientIdHint')}
              </div>
            </div>

            {/* Client Secret */}
            <div className="space-y-1.5">
              <Label htmlFor="gcsec" className="text-xs uppercase tracking-wider">
                {t('admin.googleClientSecret')}
              </Label>
              <Input
                id="gcsec"
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder="GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxxx"
                className="font-mono text-xs bg-background/50"
                dir="ltr"
              />
              <div className="text-[10px] text-muted-foreground">
                {t('admin.googleClientIdHint')}
              </div>
            </div>

            <Separator />

            {/* Help block */}
            <div className="rounded-md bg-blue-500/5 border border-blue-500/20 p-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed text-muted-foreground">
                  {t('admin.googleHelp')}
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1 mr-1"
                  >
                    Google Cloud Console
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Save */}
            <div className="flex justify-end">
              <Button onClick={save} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                {t('admin.googleSave')}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
