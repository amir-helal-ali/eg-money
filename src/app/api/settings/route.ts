import { NextResponse } from 'next/server'
import { getPublicSettings } from '@/lib/money'

/**
 * GET /api/settings
 * Public endpoint returning trade-related configuration.
 * SECURITY: Never expose `googleClientSecret` or other secrets here.
 * Use `getPublicSettings()` which strips secrets; admin-only routes
 * should call `getSettings()` directly.
 */
export async function GET() {
  const settings = await getPublicSettings()
  return NextResponse.json({ settings })
}
