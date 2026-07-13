'use client'

import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/components/brand-logo'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="flex justify-center">
          <BrandLogo size="md" showText={false} />
        </div>
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-primary font-num">404</h1>
          <h2 className="text-xl font-semibold">الصفحة غير موجودة</h2>
          <p className="text-muted-foreground text-sm">
            الصفحة التي تبحث عنها غير موجودة أو تم نقلها أو حذفها.
          </p>
        </div>
        <div className="flex gap-2 justify-center">
          <Button onClick={() => window.location.href = '/'} className="gap-2">
            <Home className="w-4 h-4" />
            العودة للرئيسية
          </Button>
        </div>
      </div>
    </div>
  )
}
