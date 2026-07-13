'use client'

/**
 * P2P offer templates — saved to localStorage so the user can quickly
 * recreate common offer configurations without re-entering all fields.
 *
 * Each template stores: type, usdtAmount, priceEgp (optional, often left
 * empty so it defaults to market price), minOrderEgp, maxOrderEgp,
 * paymentMethods, and a user-chosen label.
 */

export type OfferTemplate = {
  id: string
  label: string
  type: 'BUY' | 'SELL'
  usdtAmount: string
  priceEgp: string
  minOrderEgp: string
  maxOrderEgp: string
  paymentMethods: string[]
  createdAt: number
}

const STORAGE_KEY = 'eg-money:p2p-templates'
const MAX_TEMPLATES = 12

export function getTemplates(): OfferTemplate[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.sort((a: OfferTemplate, b: OfferTemplate) => b.createdAt - a.createdAt)
  } catch {
    return []
  }
}

export function saveTemplate(template: Omit<OfferTemplate, 'id' | 'createdAt'>): OfferTemplate {
  if (typeof window === 'undefined') throw new Error('localStorage not available')
  const newTemplate: OfferTemplate = {
    ...template,
    id: `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  }
  const all = getTemplates()
  all.unshift(newTemplate)
  // Cap at MAX_TEMPLATES
  const trimmed = all.slice(0, MAX_TEMPLATES)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  return newTemplate
}

export function deleteTemplate(id: string): void {
  if (typeof window === 'undefined') return
  const all = getTemplates().filter((t) => t.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

export function renameTemplate(id: string, newLabel: string): void {
  if (typeof window === 'undefined') return
  const all = getTemplates().map((t) => (t.id === id ? { ...t, label: newLabel } : t))
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}
