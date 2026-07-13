import { NextRequest, NextResponse } from 'next/server'
import { destroySession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  let token: string | null = null
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  } else {
    token = req.cookies.get('session_token')?.value ?? null
  }
  if (token) await destroySession(token)

  const response = NextResponse.json({ success: true })
  response.cookies.delete('session_token')
  return response
}
