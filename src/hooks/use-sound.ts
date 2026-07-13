'use client'

import { useCallback, useRef, useEffect } from 'react'

/**
 * Sound effects hook using Web Audio API.
 * Generates notification sounds programmatically — no audio files needed.
 *
 * Sounds:
 * - playNotification: gentle 2-tone chime (D5 → A5) — for regular users
 * - playAdminAlert: STRONG 10-second repeating alert — for admin notifications
 *    (loud, urgent, impossible to miss — 3 repeating bell bursts with siren-like
 *     frequency sweep, high volume, long duration)
 * - playSuccess: ascending 3-tone (C5 → E5 → G5)
 * - playError: descending 2-tone (E5 → C5)
 * - playClick: short click
 */

type SoundType = 'notification' | 'adminAlert' | 'success' | 'error' | 'click'

const SOUND_FREQUENCIES: Record<string, { freq: number; duration: number; delay?: number; type?: OscillatorType; volume?: number }[]> = {
  // Gentle 2-tone chime (notification bell) — for regular users
  notification: [
    { freq: 587.33, duration: 0.12 }, // D5
    { freq: 880, duration: 0.18, delay: 0.08 }, // A5
  ],
  // STRONG 10-second admin alert — urgent, loud, repeating
  // Pattern: 3 bursts of [bell + siren sweep], each burst ~3.3s, total ~10s
  adminAlert: [
    // Burst 1 (0-3.3s)
    { freq: 880, duration: 0.15, delay: 0, type: 'square', volume: 0.3 },      // sharp bell
    { freq: 1100, duration: 0.15, delay: 0.15, type: 'square', volume: 0.3 },  // higher bell
    { freq: 880, duration: 0.15, delay: 0.3, type: 'square', volume: 0.3 },
    { freq: 440, duration: 0.8, delay: 0.45, type: 'sawtooth', volume: 0.2 },  // siren base
    { freq: 880, duration: 0.8, delay: 0.45, type: 'sine', volume: 0.15 },      // siren overlay
    { freq: 1320, duration: 0.3, delay: 1.3, type: 'square', volume: 0.25 },   // urgent high
    { freq: 660, duration: 0.5, delay: 1.6, type: 'sawtooth', volume: 0.2 },
    { freq: 880, duration: 0.5, delay: 2.1, type: 'square', volume: 0.25 },
    { freq: 440, duration: 0.5, delay: 2.6, type: 'sawtooth', volume: 0.15 },

    // Burst 2 (3.3-6.6s) — same pattern, shifted
    { freq: 880, duration: 0.15, delay: 3.3, type: 'square', volume: 0.3 },
    { freq: 1100, duration: 0.15, delay: 3.45, type: 'square', volume: 0.3 },
    { freq: 880, duration: 0.15, delay: 3.6, type: 'square', volume: 0.3 },
    { freq: 440, duration: 0.8, delay: 3.75, type: 'sawtooth', volume: 0.2 },
    { freq: 880, duration: 0.8, delay: 3.75, type: 'sine', volume: 0.15 },
    { freq: 1320, duration: 0.3, delay: 4.6, type: 'square', volume: 0.25 },
    { freq: 660, duration: 0.5, delay: 4.9, type: 'sawtooth', volume: 0.2 },
    { freq: 880, duration: 0.5, delay: 5.4, type: 'square', volume: 0.25 },
    { freq: 440, duration: 0.5, delay: 5.9, type: 'sawtooth', volume: 0.15 },

    // Burst 3 (6.6-10s) — final, most urgent
    { freq: 880, duration: 0.15, delay: 6.6, type: 'square', volume: 0.3 },
    { freq: 1100, duration: 0.15, delay: 6.75, type: 'square', volume: 0.3 },
    { freq: 880, duration: 0.15, delay: 6.9, type: 'square', volume: 0.3 },
    { freq: 440, duration: 0.8, delay: 7.05, type: 'sawtooth', volume: 0.2 },
    { freq: 880, duration: 0.8, delay: 7.05, type: 'sine', volume: 0.15 },
    { freq: 1320, duration: 0.3, delay: 7.9, type: 'square', volume: 0.25 },
    { freq: 660, duration: 0.5, delay: 8.2, type: 'sawtooth', volume: 0.2 },
    { freq: 880, duration: 0.5, delay: 8.7, type: 'square', volume: 0.25 },
    { freq: 440, duration: 0.5, delay: 9.2, type: 'sawtooth', volume: 0.15 },
    // Final long bell
    { freq: 1100, duration: 0.6, delay: 9.4, type: 'square', volume: 0.3 },
  ],
  // Ascending 3-tone (success)
  success: [
    { freq: 523.25, duration: 0.1 },  // C5
    { freq: 659.25, duration: 0.1, delay: 0.08 }, // E5
    { freq: 783.99, duration: 0.18, delay: 0.16 }, // G5
  ],
  // Descending 2-tone (error)
  error: [
    { freq: 659.25, duration: 0.12 }, // E5
    { freq: 523.25, duration: 0.18, delay: 0.1 }, // C5
  ],
  // Short click
  click: [
    { freq: 1000, duration: 0.03 },
  ],
}

export function useSound() {
  const audioContextRef = useRef<AudioContext | null>(null)
  const enabledRef = useRef(true)

  // Load sound preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('eg-money-sound')
      if (saved !== null) enabledRef.current = saved === 'true'
    } catch {}
  }, [])

  // Initialize AudioContext on first user interaction (required by browsers)
  const getAudioContext = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null
    if (!audioContextRef.current) {
      try {
        const AC = window.AudioContext || (window as any).webkitAudioContext
        audioContextRef.current = new AC()
      } catch (e) {
        console.warn('[sound] Web Audio API not supported')
        return null
      }
    }
    // Resume if suspended (browsers suspend until user interaction)
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(() => {})
    }
    return audioContextRef.current
  }, [])

  const playSound = useCallback((type: SoundType = 'notification') => {
    if (!enabledRef.current) return
    const ctx = getAudioContext()
    if (!ctx) return

    const notes = SOUND_FREQUENCIES[type]
    if (!notes) return

    notes.forEach((note) => {
      const startTime = ctx.currentTime + (note.delay || 0)
      const vol = note.volume || 0.15

      // Create oscillator (the tone)
      const oscillator = ctx.createOscillator()
      oscillator.type = note.type || 'sine'
      oscillator.frequency.setValueAtTime(note.freq, startTime)

      // For admin alert: add frequency sweep for siren effect
      if (type === 'adminAlert' && note.type === 'sawtooth') {
        // Sweep up and down for urgent siren feel
        oscillator.frequency.linearRampToValueAtTime(note.freq * 1.5, startTime + note.duration * 0.3)
        oscillator.frequency.linearRampToValueAtTime(note.freq * 0.7, startTime + note.duration * 0.6)
        oscillator.frequency.linearRampToValueAtTime(note.freq, startTime + note.duration)
      }

      // Create gain (volume envelope — smooth fade in/out)
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(vol, startTime + 0.01) // quick fade in
      gain.gain.setValueAtTime(vol, startTime + note.duration * 0.7) // hold
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + note.duration) // smooth fade out

      // Connect: oscillator → gain → destination
      oscillator.connect(gain)
      gain.connect(ctx.destination)

      // Play
      oscillator.start(startTime)
      oscillator.stop(startTime + note.duration)
    })
  }, [getAudioContext])

  const playNotification = useCallback(() => playSound('notification'), [playSound])
  const playAdminAlert = useCallback(() => playSound('adminAlert'), [playSound])
  const playSuccess = useCallback(() => playSound('success'), [playSound])
  const playError = useCallback(() => playSound('error'), [playSound])
  const playClick = useCallback(() => playSound('click'), [playSound])

  const setEnabled = useCallback((enabled: boolean) => {
    enabledRef.current = enabled
    try { localStorage.setItem('eg-money-sound', String(enabled)) } catch {}
  }, [])

  const isEnabled = useCallback(() => enabledRef.current, [])

  return {
    playNotification,
    playAdminAlert,
    playSuccess,
    playError,
    playClick,
    setEnabled,
    isEnabled,
  }
}
