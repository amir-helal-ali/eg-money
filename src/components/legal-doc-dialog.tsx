'use client'

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/hooks/use-language'
import { FileText, Shield } from 'lucide-react'

type DocType = 'terms' | 'privacy'

export function LegalDocDialog({
  open, type, onOpenChange,
}: {
  open: boolean
  type: DocType
  onOpenChange: (o: boolean) => void
}) {
  const { t } = useLanguage()

  const isTerms = type === 'terms'
  const title = isTerms ? t('legal.termsTitle') : t('legal.privacyTitle')
  const intro = isTerms ? t('legal.termsIntro') : t('legal.privacyIntro')
  const Icon = isTerms ? FileText : Shield

  const sections = isTerms
    ? [
        { title: t('legal.termsAcceptanceTitle'), body: t('legal.termsAcceptanceBody') },
        { title: t('legal.termsEligibilityTitle'), body: t('legal.termsEligibilityBody') },
        { title: t('legal.termsServicesTitle'), body: t('legal.termsServicesBody') },
        { title: t('legal.termsKycTitle'), body: t('legal.termsKycBody') },
        { title: t('legal.termsFeesTitle'), body: t('legal.termsFeesBody') },
        { title: t('legal.termsProhibitedTitle'), body: t('legal.termsProhibitedBody') },
        { title: t('legal.termsLiabilityTitle'), body: t('legal.termsLiabilityBody') },
        { title: t('legal.termsAccountTitle'), body: t('legal.termsAccountBody') },
        { title: t('legal.termsReferralTitle'), body: t('legal.termsReferralBody') },
        { title: t('legal.termsChangesTitle'), body: t('legal.termsChangesBody') },
        { title: t('legal.termsContactTitle'), body: t('legal.termsContactBody') },
      ]
    : [
        { title: t('legal.privacyCollectTitle'), body: t('legal.privacyCollectBody') },
        { title: t('legal.privacyUseTitle'), body: t('legal.privacyUseBody') },
        { title: t('legal.privacyStoreTitle'), body: t('legal.privacyStoreBody') },
        { title: t('legal.privacyShareTitle'), body: t('legal.privacyShareBody') },
        { title: t('legal.privacyRightsTitle'), body: t('legal.privacyRightsBody') },
        { title: t('legal.privacyCookiesTitle'), body: t('legal.privacyCookiesBody') },
        { title: t('legal.privacySecurityTitle'), body: t('legal.privacySecurityBody') },
        { title: t('legal.privacyContactTitle'), body: t('legal.privacyContactBody') },
      ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 overflow-hidden glass-strong border-border/50">
        <DialogHeader className="p-6 pb-3 border-b border-border/50">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Icon className="w-5 h-5" />
            </div>
            {title}
            <Badge variant="outline" className="font-num text-[10px] ml-auto">
              {t('legal.lastUpdated')}: 2026-07-09
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-xs">
            {isTerms ? t('legal.termsIntro') : t('legal.privacyIntro')}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] px-6 pb-6">
          <div className="space-y-5 py-2">
            {sections.map((s, i) => (
              <div key={i} className="space-y-1.5">
                <h3 className="font-bold text-sm text-foreground">{s.title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            ))}
            <div className="pt-3 mt-3 border-t border-border/50 text-center">
              <a
                href={isTerms ? '/terms' : '/privacy'}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary hover:underline"
              >
                {isTerms ? t('legal.termsTitle') : t('legal.privacyTitle')} →
              </a>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
