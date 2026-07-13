'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft, Users,
  Check, Zap, TrendingUp, Clock,
} from 'lucide-react'

type Activity = {
  id: string
  type: 'buy' | 'sell' | 'p2p' | 'deposit' | 'withdraw'
  user: {
    name: string
    initials: string
    colorIndex: number
    verified?: boolean
  }
  amount: string
  currency: 'USDT' | 'EGP'
  method?: string
  timeAgo: string
  timestamp: number
  status: 'completed' | 'pending'
}

// ===== Realistic Egyptian name pool (50+ names) =====
// Mix of common Egyptian first names + last initials to look like real users
const EGYPTIAN_FIRST_NAMES = [
  'Ahmed', 'Mohamed', 'Mahmoud', 'Mostafa', 'Karim', 'Omar', 'Youssef', 'Khaled',
  'Amr', 'Tarek', 'Hossam', 'Sherif', 'Hatem', 'Wael', 'Emad', 'Rami',
  'Sara', 'Mariam', 'Nour', 'Habiba', 'Salma', 'Hana', 'Yasmin', 'Menna',
  'Farida', 'Aya', 'Esraa', 'Doaa', 'Reem', 'Marwa', 'Heba', 'Nermin',
  'Hend', 'Sherine', 'Dina', 'Rania', 'Mona', 'Samar', 'Dalia', 'Rasha',
  'Hany', 'Sameh', 'Adel', 'Nabil', 'Fady', 'Bishoy', 'Mina', 'Peter',
  'George', 'Mina', 'Abanoub', 'Mariam',
]

const EGYPTIAN_LAST_INITIALS = ['M', 'A', 'S', 'H', 'K', 'E', 'R', 'F', 'N', 'D', 'T', 'B', 'G', 'Z', 'L', 'Y', 'W', 'P', 'J', 'Q']

// Avatar color palette — varied but cohesive
const AVATAR_COLORS = [
  'bg-primary/15 text-primary',
  'bg-blue-500/15 text-blue-400',
  'bg-purple-500/15 text-purple-400',
  'bg-amber-500/15 text-amber-400',
  'bg-rose-500/15 text-rose-400',
  'bg-cyan-500/15 text-cyan-400',
  'bg-emerald-500/15 text-emerald-400',
  'bg-orange-500/15 text-orange-400',
  'bg-pink-500/15 text-pink-400',
  'bg-indigo-500/15 text-indigo-400',
]

const METHODS = ['Vodafone Cash', 'InstaPay', 'Fawry', 'Bank Transfer']

// Transaction type distribution — weighted toward common activities
// P2P is most common on a P2P-focused platform, then buy/sell, then deposits/withdraws
const TYPE_WEIGHTS: { type: Activity['type']; weight: number }[] = [
  { type: 'p2p', weight: 35 },
  { type: 'buy', weight: 25 },
  { type: 'sell', weight: 20 },
  { type: 'deposit', weight: 12 },
  { type: 'withdraw', weight: 8 },
]

// Realistic amount ranges by type
const AMOUNT_RANGES = {
  buy: { min: 10, max: 800, decimals: 2 },        // USDT
  sell: { min: 15, max: 600, decimals: 2 },        // USDT
  p2p: { min: 5, max: 1200, decimals: 2 },         // USDT
  deposit: { min: 200, max: 80000, decimals: 0 },  // EGP
  withdraw: { min: 300, max: 60000, decimals: 0 }, // EGP
}

// ===== Time ago formatter (Arabic) =====
function formatTimeAgo(timestamp: number, now: number): string {
  const lang = typeof document !== 'undefined' ? document.documentElement.lang : 'ar'
  const isAr = lang === 'ar'
  const seconds = Math.floor((now - timestamp) / 1000)
  if (seconds < 10) return isAr ? 'الآن' : 'Just now'
  if (seconds < 30) return isAr ? 'منذ ثوانٍ' : 'seconds ago'
  if (seconds < 60) return isAr ? 'منذ ثوانٍ' : 'seconds ago'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 2) return isAr ? 'منذ دقيقة' : 'minute ago'
  if (minutes < 10) return isAr ? 'منذ دقائق' : 'minutes ago'
  if (minutes < 60) return isAr ? 'منذ دقائق' : 'minutes ago'
  // Cap — never show hours since this is a LIVE feed
  return isAr ? 'منذ دقائق' : 'minutes ago'
}

// ===== Activity generator =====
// Generates a realistic activity with randomized user, type, amount, and timestamp
function generateActivity(now: number, maxAgeSeconds = 600): Activity {
  // Pick weighted random type
  const totalWeight = TYPE_WEIGHTS.reduce((s, t) => s + t.weight, 0)
  let r = Math.random() * totalWeight
  let type: Activity['type'] = 'p2p'
  for (const t of TYPE_WEIGHTS) {
    if (r < t.weight) {
      type = t.type
      break
    }
    r -= t.weight
  }

  // Pick random user
  const firstName = EGYPTIAN_FIRST_NAMES[Math.floor(Math.random() * EGYPTIAN_FIRST_NAMES.length)]
  const lastInitial = EGYPTIAN_LAST_INITIALS[Math.floor(Math.random() * EGYPTIAN_LAST_INITIALS.length)]
  const fullName = `${firstName} ${lastInitial}.`

  // ~25% of users are "verified" (shown with a checkmark)
  const verified = Math.random() < 0.25

  // Generate initials (first letter of first + last name)
  const initials = `${firstName[0]}${lastInitial}`

  // Random color
  const colorIndex = Math.floor(Math.random() * AVATAR_COLORS.length)

  // Generate amount
  const range = AMOUNT_RANGES[type]
  const amount = (Math.random() * (range.max - range.min) + range.min).toFixed(range.decimals)

  // Currency
  const isUsdt = type === 'buy' || type === 'sell' || type === 'p2p'

  // Method only for deposits/withdrawals
  const method = (type === 'deposit' || type === 'withdraw')
    ? METHODS[Math.floor(Math.random() * METHODS.length)]
    : undefined

  // Timestamp — random within last 10 minutes for initial fill, then "now" for new ones
  const ageSeconds = Math.random() * maxAgeSeconds
  const timestamp = now - ageSeconds * 1000

  // Status — 85% completed, 15% pending (realistic)
  const status = Math.random() < 0.85 ? 'completed' : 'pending'

  return {
    id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
    type,
    user: { name: fullName, initials, colorIndex, verified },
    amount,
    currency: isUsdt ? 'USDT' : 'EGP',
    method,
    timeAgo: formatTimeAgo(timestamp, now),
    timestamp,
    status,
  }
}

const ICONS = {
  buy: { icon: ArrowDownToLine, color: 'text-emerald-400 bg-emerald-500/10' },
  sell: { icon: ArrowUpFromLine, color: 'text-rose-400 bg-rose-500/10' },
  p2p: { icon: ArrowRightLeft, color: 'text-blue-400 bg-blue-500/10' },
  deposit: { icon: ArrowDownToLine, color: 'text-primary bg-primary/10' },
  withdraw: { icon: ArrowUpFromLine, color: 'text-amber-400 bg-amber-500/10' },
}

const LABELS_AR = { buy: 'شراء USDT', sell: 'بيع USDT', p2p: 'صفقة P2P', deposit: 'إيداع', withdraw: 'سحب' }
const LABELS_EN = { buy: 'Buy USDT', sell: 'Sell USDT', p2p: 'P2P Trade', deposit: 'Deposit', withdraw: 'Withdrawal' }

// Method label mapping
const METHOD_LABELS: Record<string, { ar: string; en: string }> = {
  VODAFONE_CASH: { ar: 'فودافون كاش', en: 'Vodafone Cash' },
  INSTAPAY: { ar: 'إنستا باي', en: 'InstaPay' },
  FAWRY: { ar: 'فوري', en: 'Fawry' },
  BANK_TRANSFER: { ar: 'تحويل بنكي', en: 'Bank Transfer' },
  InstaPay: { ar: 'إنستا باي', en: 'InstaPay' },
  VodafoneCash: { ar: 'فودافون كاش', en: 'Vodafone Cash' },
}

// Convert a real activity from the API to the Activity type
function parseRealActivity(raw: {
  type: string
  userName: string
  amount: string
  currency: string
  method?: string
  timestamp: number
}): Activity {
  const name = raw.userName
  const firstName = name.split(' ')[0] || name
  const lastInitial = (name.split(' ')[1]?.[0] || name[1] || 'X').toUpperCase()
  const initials = `${firstName[0]}${lastInitial}`
  const colorIndex = (firstName.charCodeAt(0) + (lastInitial.charCodeAt(0) || 0)) % AVATAR_COLORS.length

  const methodLabel = raw.method
    ? (typeof document !== 'undefined' && document.documentElement.lang === 'en'
      ? (METHOD_LABELS[raw.method]?.en || raw.method)
      : (METHOD_LABELS[raw.method]?.ar || raw.method))
    : undefined

  // Adjust timestamp to look recent — if the real activity is older than 5 minutes,
  // shift it to look like it happened within the last few minutes
  const now = Date.now()
  const ageMinutes = (now - raw.timestamp) / 60000
  let displayTimestamp = raw.timestamp
  if (ageMinutes > 5) {
    // Shift to a random time within the last 2-4 minutes so it looks live
    displayTimestamp = now - (Math.random() * 2 + 1) * 60000
  }

  return {
    id: `real-${raw.timestamp}-${raw.type}-${Math.random().toString(36).substr(2, 5)}`,
    type: raw.type as Activity['type'],
    user: { name, initials, colorIndex, verified: true },
    amount: raw.amount,
    currency: raw.currency as 'USDT' | 'EGP',
    method: methodLabel,
    timeAgo: formatTimeAgo(displayTimestamp, now),
    timestamp: displayTimestamp,
    status: 'completed',
  }
}

export function LiveActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [, setTick] = useState(0) // forces re-render to update "time ago"
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const now = Date.now()

    // Initial fill — simulated activities
    const simulated = Array.from({ length: 6 }, () => generateActivity(now, 600))
      .sort((a, b) => b.timestamp - a.timestamp)

    // Fetch real activities from the database
    fetch('/api/activity?limit=10')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data?.activities || data.activities.length === 0) {
          // No real activities — use simulated only
           
          setActivities(simulated)
          return
        }

        // Convert real activities to the Activity type
        const real = data.activities.map(parseRealActivity)

        // Merge real + simulated into one natural-looking list
        // No distinction — all mixed together sorted by timestamp
        const merged = [...real, ...simulated]
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 10)

         
        setActivities(merged)
      })
      .catch(() => {
        // Fallback to simulated only
         
        setActivities(simulated)
      })

    // Add a new SIMULATED activity every 3-7 seconds
    const scheduleNext = () => {
      const delay = 3000 + Math.random() * 4000
      intervalRef.current = setTimeout(() => {
        const newActivity = generateActivity(Date.now(), 0)
        newActivity.timestamp = Date.now()
        newActivity.timeAgo = typeof document !== 'undefined' && document.documentElement.lang === 'en' ? 'Just now' : 'الآن'
        setActivities((prev) => {
          // Add at top, keep max 10
          return [newActivity, ...prev].slice(0, 10)
        })
        scheduleNext()
      }, delay)
    }
    scheduleNext()

    // Poll for new REAL activities every 30 seconds
    const realInterval = setInterval(() => {
      fetch('/api/activity?limit=5')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (!data?.activities || data.activities.length === 0) return
          const newReal = data.activities.map(parseRealActivity)
          setActivities((prev) => {
            const existingIds = new Set(prev.map(a => a.id))
            const fresh = newReal.filter((r: { id: string }) => !existingIds.has(r.id))
            if (fresh.length === 0) return prev
            // Mix naturally — sort by timestamp
            return [...fresh, ...prev]
              .sort((a, b) => b.timestamp - a.timestamp)
              .slice(0, 10)
          })
        })
        .catch(() => {})
    }, 30000)

    // Update "time ago" labels every 5 seconds
    const timeInterval = setInterval(() => {
      setTick((t) => t + 1)
      setActivities((prev) =>
        prev.map((a) => ({
          ...a,
          timeAgo: formatTimeAgo(a.timestamp, Date.now()),
        })),
      )
    }, 5000)

    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current)
      clearInterval(timeInterval)
      clearInterval(realInterval)
    }
  }, [])

  return (
    <Card className="glass border-border/50 overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-success/15 text-success flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm">{(typeof document !== 'undefined' && document.documentElement.lang === 'en') ? 'Live Activity' : 'النشاط المباشر'}</h3>
            <div className="text-[10px] text-muted-foreground flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-success animate-pulse" />
              {(typeof document !== 'undefined' && document.documentElement.lang === 'en') ? 'Transactions happening now · live' : 'معاملات تتم الآن · مباشر'}
            </div>
          </div>
        </div>
        <Badge variant="outline" className="font-num text-[10px]">
          <TrendingUp className="w-3 h-3 ml-1" />
          LIVE
        </Badge>
      </div>
      <div className="divide-y divide-border/30 max-h-[500px] overflow-y-auto">
        {activities.map((a, i) => {
          const IconCfg = ICONS[a.type]
          const Icon = IconCfg.icon
          const avatarColor = AVATAR_COLORS[a.user.colorIndex]
          const isNew = i === 0 && a.timeAgo === 'الآن'
          return (
            <div
              key={a.id}
              className="flex items-center gap-2.5 sm:gap-3 p-3 sm:p-4 hover:bg-muted/30 transition-colors"
              style={{
                animation: isNew ? 'slideInActivity 0.4s ease-out' : undefined,
                opacity: 1 - i * 0.08,
              }}
            >
              {/* Avatar with initials */}
              <div className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full ${avatarColor} flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0`}>
                {a.user.initials}
                {a.user.verified && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-primary flex items-center justify-center border-2 border-background">
                    <Check className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-primary-foreground" />
                  </div>
                )}
              </div>

              {/* User + action info */}
              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-sm font-medium truncate flex items-center gap-1">
                  <span className="truncate">{a.user.name}</span>
                  <span className="text-muted-foreground font-normal flex-shrink-0">— {(typeof document !== 'undefined' && document.documentElement.lang === 'en' ? LABELS_EN : LABELS_AR)[a.type]}</span>
                </div>
                <div className="text-[9px] sm:text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  {a.method && (
                    <>
                      <span className="truncate">{a.method}</span>
                      <span>·</span>
                    </>
                  )}
                  <span className="flex items-center gap-0.5 flex-shrink-0">
                    <Clock className="w-2.5 h-2.5" />
                    <span className="font-num">{a.timeAgo}</span>
                  </span>
                </div>
              </div>

              {/* Amount + status */}
              <div className="text-left flex-shrink-0">
                <div className="font-num text-xs sm:text-sm font-bold">
                  {a.type === 'sell' || a.type === 'withdraw' ? '−' : '+'}{a.amount}
                  <span className="text-[9px] sm:text-[10px] text-muted-foreground mr-0.5"> {a.currency}</span>
                </div>
                <div className={`text-[9px] sm:text-[10px] flex items-center gap-1 justify-end ${a.status === 'completed' ? 'text-success' : 'text-amber-500'}`}>
                  {a.status === 'completed' ? (
                    <>
                      <Check className="w-2.5 h-2.5" />
                      <span>{(typeof document !== 'undefined' && document.documentElement.lang === 'en') ? 'Completed' : 'مكتمل'}</span>
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      <span>{(typeof document !== 'undefined' && document.documentElement.lang === 'en') ? 'Processing' : 'قيد المعالجة'}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <style jsx>{`
        @keyframes slideInActivity {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Card>
  )
}
