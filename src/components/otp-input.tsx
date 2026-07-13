'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  length?: number
  value: string
  onChange: (v: string) => void
  onComplete?: (v: string) => void
  error?: boolean
  disabled?: boolean
  autoFocus?: boolean
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  error = false,
  disabled = false,
  autoFocus = true,
}: Props) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])
  const [activeIndex, setActiveIndex] = useState<number>(-1)

  // Ensure value is exactly `length` chars (padded with empty)
  const chars = Array.from({ length }, (_, i) => value[i] || '')

  // Auto-focus first box on mount
  useEffect(() => {
    if (autoFocus && !disabled) {
      const firstEmpty = chars.findIndex((c) => !c)
      const focusIdx = firstEmpty === -1 ? 0 : firstEmpty
      setTimeout(() => inputsRef.current[focusIdx]?.focus(), 100)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setChar = (idx: number, char: string) => {
    const newChars = [...chars]
    newChars[idx] = char
    const newVal = newChars.join('').slice(0, length)
    onChange(newVal)
    if (newVal.length === length && onComplete) {
      onComplete(newVal)
    }
  }

  const handleChange = (idx: number, raw: string) => {
    // Strip non-digits
    const cleaned = raw.replace(/\D/g, '')
    if (!cleaned) {
      setChar(idx, '')
      return
    }
    // If user pasted multiple chars, distribute them
    if (cleaned.length > 1) {
      const newChars = [...chars]
      for (let i = 0; i < cleaned.length && idx + i < length; i++) {
        newChars[idx + i] = cleaned[i]
      }
      const newVal = newChars.join('').slice(0, length)
      onChange(newVal)
      // Focus the last filled box or next empty
      const lastIdx = Math.min(idx + cleaned.length, length) - 1
      inputsRef.current[lastIdx]?.focus()
      if (newVal.length === length && onComplete) onComplete(newVal)
      return
    }
    setChar(idx, cleaned)
    // Auto-advance
    if (idx < length - 1) {
      inputsRef.current[idx + 1]?.focus()
    }
  }

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      if (chars[idx]) {
        // Clear current
        setChar(idx, '')
      } else if (idx > 0) {
        // Move back and clear previous
        inputsRef.current[idx - 1]?.focus()
        setChar(idx - 1, '')
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      e.preventDefault()
      inputsRef.current[idx - 1]?.focus()
    } else if (e.key === 'ArrowRight' && idx < length - 1) {
      e.preventDefault()
      inputsRef.current[idx + 1]?.focus()
    } else if (e.key === 'Enter') {
      // Let parent handle Enter
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!text) return
    const newChars = Array.from({ length }, (_, i) => text[i] || '')
    onChange(newChars.join(''))
    const focusIdx = Math.min(text.length, length - 1)
    inputsRef.current[focusIdx]?.focus()
    if (text.length === length && onComplete) onComplete(text)
  }

  const handleFocus = (idx: number) => setActiveIndex(idx)
  const handleBlur = () => setActiveIndex(-1)

  return (
    <div
      className="flex items-center justify-between gap-2 sm:gap-3"
      dir="ltr"
      onPaste={handlePaste}
    >
      {chars.map((c, i) => (
        <input
          key={i}
          ref={(el) => { inputsRef.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={c}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={() => handleFocus(i)}
          onBlur={handleBlur}
          className={cn(
            'w-11 h-14 sm:w-12 sm:h-14 text-center text-2xl font-num font-bold rounded-xl',
            'bg-background/60 border-2 transition-all duration-200',
            'focus:outline-none',
            error
              ? 'border-rose-500/60 focus:border-rose-500'
              : activeIndex === i
                ? 'border-primary scale-105 shadow-[0_0_0_3px_oklch(0.82_0.20_145/0.25),0_8px_24px_oklch(0.82_0.20_145/0.2)]'
                : c
                  ? 'border-primary/40 bg-primary/5'
                  : 'border-border/50 hover:border-primary/30',
          )}
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  )
}
