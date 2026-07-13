'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Animated count-up hook.
 * - Triggers when the element is scrolled into view (via IntersectionObserver)
 * - Animates from 0 to `end` over `duration` ms using requestAnimationFrame
 * - Returns { ref, value } where ref should be attached to the element
 */
export function useCountUp<T extends HTMLElement = HTMLDivElement>(
  end: number,
  options: {
    duration?: number
    decimals?: number
    startOnView?: boolean
    prefix?: string
    suffix?: string
  } = {},
) {
  const { duration = 1800, decimals = 0, startOnView = true } = options
  const [value, setValue] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef<T | null>(null)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    if (startOnView) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting && !started) {
             
            setStarted(true)
          }
        },
        { threshold: 0.3 },
      )
      observer.observe(node)
      return () => observer.disconnect()
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStarted(true)
    }
  }, [startOnView, started])

  useEffect(() => {
    if (!started) return

    const startTime = performance.now()
    const startVal = 0

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = startVal + (end - startVal) * eased
      setValue(current)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setValue(end)
      }
    }

    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [started, end, duration])

  const formatted = value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return { ref, value, formatted, started }
}
