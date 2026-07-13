'use client'

import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/components/brand-logo'
import { AlertTriangle, RotateCcw, Home } from 'lucide-react'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[App Error]', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="flex justify-center">
          <BrandLogo size="md" showText={false} />
        </div>
        <div className="space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-500/10 mb-2">
            <AlertTriangle className="w-8 h-8 text-rose-500" />
          </div>
          <h1 className="text-2xl font-bold">حدث خطأ غير متوقع</h1>
          <p className="text-muted-foreground text-sm">
            نعتذر عن هذا الخطأ. يمكنك المحاولة مرة أخرى أو العودة للرئيسية.
          </p>
          {error.digest && (
            <p className="text-[10px] text-muted-foreground font-mono mt-2">
              Error ID: {error.digest}
            </p>
          )}
        </div>
        <div className="flex gap-2 justify-center">
          <Button onClick={reset} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            إعادة المحاولة
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/'} className="gap-2">
            <Home className="w-4 h-4" />
            الرئيسية
          </Button>
        </div>
      </div>
    </div>
  )
}
