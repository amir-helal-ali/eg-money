import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/session'

// POST — admin only: seed default payment methods
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const defaults = [
    { name: 'InstaPay', nameAr: 'إنستا باي', icon: '⚡', logoUrl: '/payment-logos/instapay.jpg', type: 'WALLET', sortOrder: 1 },
    { name: 'Vodafone Cash', nameAr: 'فودافون كاش', icon: '📱', logoUrl: '/payment-logos/vodafone.jpg', type: 'WALLET', sortOrder: 2 },
    { name: 'Orange Money', nameAr: 'أورنج موني', icon: '🟠', logoUrl: '/payment-logos/orange.png', type: 'WALLET', sortOrder: 3 },
    { name: 'Etisalat Cash', nameAr: 'إتصالات كاش', icon: '🟢', logoUrl: '/payment-logos/etisalat.png', type: 'WALLET', sortOrder: 4 },
    { name: 'NBE', nameAr: 'البنك الأهلي المصري', icon: '🏦', logoUrl: '/payment-logos/nbe.jpg', type: 'BANK', sortOrder: 5 },
    { name: 'Banque Misr', nameAr: 'بنك مصر', icon: '🏛️', logoUrl: '/payment-logos/misr.png', type: 'BANK', sortOrder: 6 },
    { name: 'CIB', nameAr: 'البنك التجاري الدولي', icon: '💳', logoUrl: '/payment-logos/cib.jpg', type: 'BANK', sortOrder: 7 },
    { name: 'Bank of Cairo', nameAr: 'بنك القاهرة', icon: '🏙️', logoUrl: '/payment-logos/cairo.jpg', type: 'BANK', sortOrder: 8 },
    { name: 'Emirates NBD', nameAr: 'الإمارات دبي الوطني', icon: '🌐', logoUrl: '/payment-logos/emirates.jpg', type: 'BANK', sortOrder: 9 },
    { name: 'Alex Bank', nameAr: 'بنك الإسكندرية', icon: '🏞️', logoUrl: '/payment-logos/alex.png', type: 'BANK', sortOrder: 10 },
    { name: 'Mashreq Bank', nameAr: 'بنك المشرق', icon: '🌟', logoUrl: '/payment-logos/mashreq.png', type: 'BANK', sortOrder: 11 },
    { name: 'Bank Transfer', nameAr: 'تحويل بنكي', icon: '🏦', logoUrl: null, type: 'BANK', sortOrder: 12 },
  ]

  // Check if already seeded
  const existing = await db.paymentMethod.count()
  if (existing > 0) {
    return NextResponse.json({ error: 'Already seeded', count: existing })
  }

  await db.paymentMethod.createMany({ data: defaults })

  return NextResponse.json({ message: 'Sealed successfully', count: defaults.length })
}
