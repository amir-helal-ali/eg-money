import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createNotification } from '@/lib/notifications'

/**
 * Called by the ticker-service every 10 seconds with the current price.
 * Checks all active price alerts and triggers any that match.
 *
 * SECURITY: This endpoint is internal (called from localhost by the
 * ticker-service). It requires an `x-cron-secret` header that matches
 * the CRON_SECRET env var. Without this, anyone could spam fake
 * "USDT above 99 EGP" notifications to all users with active alerts.
 */
export async function POST(req: NextRequest) {
  try {
    // ===== Shared-secret auth =====
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret || cronSecret.length < 32) {
      return NextResponse.json(
        { error: 'CRON_SECRET not configured (must be ≥32 chars)' },
        { status: 503 },
      )
    }
    const supplied = req.headers.get('x-cron-secret')
    if (supplied !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const currentPrice = Number(body.currentPrice)
    if (isNaN(currentPrice) || currentPrice < 30 || currentPrice > 100) {
      return NextResponse.json({ triggered: [] })
    }

    // Find all active alerts that should be triggered
    const alerts = await db.priceAlert.findMany({
      where: { status: 'ACTIVE' },
    })

    const triggered: { userId: string; condition: string; targetPrice: number; alertId: string }[] = []

    for (const alert of alerts) {
      const target = Number(alert.targetPrice)
      const shouldTrigger =
        (alert.condition === 'ABOVE' && currentPrice >= target) ||
        (alert.condition === 'BELOW' && currentPrice <= target)

      if (shouldTrigger) {
        // Mark as triggered
        await db.priceAlert.update({
          where: { id: alert.id },
          data: {
            status: 'TRIGGERED',
            triggeredAt: new Date(),
            currentPrice,
          },
        })

        // Create a notification for the user
        const title = alert.condition === 'ABOVE'
          ? '📈 تنبيه سعر: USDT تجاوز ' + target + ' EGP'
          : '📉 تنبيه سعر: USDT انخفض تحت ' + target + ' EGP'
        const message = `السعر الحالي: ${currentPrice.toFixed(2)} EGP — تم تفعيل تنبيهك!`

        await createNotification({
          userId: alert.userId,
          type: 'PRICE',
          title,
          message,
          metadata: { alertId: alert.id, condition: alert.condition, targetPrice: target, currentPrice },
        })

        triggered.push({
          userId: alert.userId,
          condition: alert.condition,
          targetPrice: target,
          alertId: alert.id,
        })
      }
    }

    return NextResponse.json({ triggered })
  } catch (e) {
    console.error('[price-alerts/check] Error:', e)
    return NextResponse.json({ triggered: [] })
  }
}
