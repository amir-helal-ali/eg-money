import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/auth/verify-reset?token=XXX
// Validates the OTP-verified reset token without consuming it.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.json({ valid: false }, { status: 400 })
  }
  const user = await db.user.findFirst({ where: { resetToken: token } })
  if (!user || !user.resetExpires || user.resetExpires.getTime() < Date.now()) {
    return NextResponse.json({ valid: false }, { status: 400 })
  }
  return NextResponse.json({ valid: true })
}
