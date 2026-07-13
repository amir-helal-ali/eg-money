import { Loader2 } from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6">
      <BrandLogo size="md" />
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">جاري التحميل…</span>
      </div>
    </div>
  )
}
