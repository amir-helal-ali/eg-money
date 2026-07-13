import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/session'
import { logLoginEvent } from '@/lib/login-history'

// POST /api/auth/update-profile
// Body: { name?: string }
// Updates the user's display name. Other fields (email, phone) have
// dedicated endpoints because they require verification.
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { name } = body as { name?: string }

    const updates: any = {}
    if (typeof name === 'string') {
      const trimmed = name.trim()
      if (trimmed.length < 2) {
        return NextResponse.json({ error: 'الاسم قصير جداً' }, { status: 400 })
      }
      if (trimmed.length > 50) {
        return NextResponse.json({ error: 'الاسم طويل جداً (الحد الأقصى 50 حرف)' }, { status: 400 })
      }
      updates.name = trimmed
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'لا توجد تعديلات' }, { status: 400 })
    }

    const updated = await db.user.update({
      where: { id: user.id },
      data: updates,
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        phone: true,
        countryCode: true,
        emailVerified: true,
        phoneVerified: true,
        role: true,
        egpBalance: true,
        usdtBalance: true,
        referralCode: true,
      },
    })

    // Log the profile update as a security event
    await logLoginEvent(user.id, 'PROFILE_UPDATE', req, {
      success: true,
      metadata: { updatedFields: Object.keys(updates) },
    })

    return NextResponse.json({
      success: true,
      user: {
        ...updated,
        egpBalance: Number(updated.egpBalance),
        usdtBalance: Number(updated.usdtBalance),
      },
      message: 'تم تحديث الملف الشخصي',
    })
  } catch (e) {
    console.error('Update profile error:', e)
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 })
  }
}
