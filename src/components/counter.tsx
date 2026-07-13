'use client'

import { useCountUp } from '@/hooks/use-count-up'

type CounterProps = {
  end: number
  decimals?: number
  duration?: number
  prefix?: string
  suffix?: string
  className?: string
}

/** Animated counter that triggers on scroll into view */
export function Counter({ end, decimals = 0, duration = 1800, prefix = '', suffix = '', className = '' }: CounterProps) {
  const { ref, formatted, value } = useCountUp<HTMLSpanElement>(end, { duration, decimals })

  // Format with grouping
  const display = value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (
    <span ref={ref} className={className}>
      {prefix}{display}{suffix}
    </span>
  )
}

/** Convenience variants */
export function CounterMillion({ value, suffix = '', className = '' }: { value: number; suffix?: string; className?: string }) {
  return <Counter end={value} decimals={2} suffix={`M${suffix}`} className={className} />
}
