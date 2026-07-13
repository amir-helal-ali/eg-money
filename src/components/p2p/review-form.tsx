'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Star, Loader2 } from 'lucide-react'
import { apiCall, showSuccess, showError } from '@/lib/client'
import { cn } from '@/lib/utils'

type Props = {
  tradeId: string
  counterpartyName: string
  onSubmitted?: () => void
}

const RATING_LABELS: Record<number, string> = {
  1: 'سيء جداً',
  2: 'سيء',
  3: 'مقبول',
  4: 'جيد',
  5: 'ممتاز',
}

/**
 * Submit a star rating + optional comment after a trade is RELEASED.
 */
export function ReviewForm({ tradeId, counterpartyName, onSubmitted }: Props) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    if (rating < 1 || rating > 5) {
      showError('اختر تقييم من 1 إلى 5')
      return
    }
    setSubmitting(true)
    const { data, error } = await apiCall('/api/p2p/reviews', {
      method: 'POST',
      body: JSON.stringify({
        tradeId,
        rating,
        comment: comment.trim() || undefined,
      }),
    })
    setSubmitting(false)
    if (error) {
      showError(error)
      return
    }
    showSuccess(data?.message || 'تم إرسال التقييم')
    onSubmitted?.()
  }

  return (
    <div className="space-y-3 p-4 rounded-lg border bg-card">
      <div className="text-sm font-medium">
        قيّم تجربتك مع <span className="text-primary">{counterpartyName}</span>
      </div>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
            className="p-1 transition-transform hover:scale-110"
            aria-label={`تقييم ${n} نجوم`}
          >
            <Star
              className={cn(
                'w-7 h-7 transition-colors',
                (hover || rating) >= n
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-muted-foreground/40',
              )}
            />
          </button>
        ))}
        <span className="mr-2 text-sm text-muted-foreground">
          {(hover || rating) > 0 ? RATING_LABELS[hover || rating] : 'اختر تقييماً'}
        </span>
      </div>
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="اكتب تعليقاً (اختياري)..."
        maxLength={300}
        className="resize-none"
        rows={3}
      />
      <Button onClick={submit} disabled={submitting || rating === 0} className="w-full">
        {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        إرسال التقييم
      </Button>
    </div>
  )
}

/**
 * Compact 5-star display + rating count (for offer cards).
 */
export function ReputationDisplay({
  ratingAvg,
  ratingCount,
  tradesCount,
  verified,
  size = 'sm',
}: {
  ratingAvg: number
  ratingCount: number
  tradesCount: number
  verified?: boolean
  size?: 'xs' | 'sm' | 'md'
}) {
  const star = size === 'xs' ? 'w-3 h-3' : size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'
  const text = size === 'xs' ? 'text-[10px]' : size === 'sm' ? 'text-xs' : 'text-sm'
  return (
    <div className={cn('flex items-center gap-1.5 flex-wrap', text)}>
      {ratingCount > 0 ? (
        <>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                className={cn(
                  star,
                  n <= Math.round(ratingAvg)
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-muted-foreground/40',
                )}
              />
            ))}
          </div>
          <span className="font-num font-medium">{ratingAvg.toFixed(1)}</span>
          <span className="text-muted-foreground">({ratingCount})</span>
        </>
      ) : (
        <span className="text-muted-foreground">جديد</span>
      )}
      <span className="text-muted-foreground">·</span>
      <span className="text-muted-foreground">{tradesCount} صفقة</span>
      {verified && (
        <>
          <span className="text-muted-foreground">·</span>
          <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
            موثّق
          </span>
        </>
      )}
    </div>
  )
}
