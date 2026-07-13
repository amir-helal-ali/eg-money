'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Loader2, Send, ShieldCheck, AlertTriangle, Phone, Check, CheckCheck,
  Search, Edit2, Trash2, X, ShieldAlert, Megaphone,
} from 'lucide-react'
import { apiCall, showSuccess, showError, fmtEgp, fmtUsdt } from '@/lib/client'
import { useLanguage } from '@/hooks/use-language'
import { useP2pEvents } from '@/hooks/use-p2p-events'
import { cn } from '@/lib/utils'

type TradeMessage = {
  id: string
  senderId: string
  senderName: string
  senderRole: 'USER' | 'ADMIN' | 'SYSTEM' // SYSTEM = auto-generated lifecycle
  senderUserRole?: 'USER' | 'ADMIN'
  message: string
  originalMessage?: string | null
  attachmentUrl?: string | null
  isSystem: boolean
  isEdited: boolean
  isDeleted: boolean
  editedAt?: string | null
  isMine: boolean
  readByOther: boolean
  readAt?: string | null
  createdAt: string
}

type Trade = {
  id: string
  usdtAmount: number
  egpAmount: number
  priceEgp: number
  paymentMethod: string
  status: string
  myRole: 'BUYER' | 'SELLER' | 'ADMIN'
  counterparty: { id: string; name: string; phone: string | null }
  offer: { id: string; type: string; paymentMethods: string[] }
}

type Props = {
  trade: Trade
  onClose: () => void
  onTradeUpdated?: () => void
}

/** Quick canned replies for fast communication. */
const CANNED_REPLIES = [
  'تم الدفع ✅',
  'تأكد من وصول المبلغ',
  'بانتظار إفراجك',
  'شكراً لك',
  'لحظة من فضلك',
  'تم الإفراج عن USDT',
]

const ADMIN_CANNED_REPLIES = [
  'مرحباً، الإدارة هنا للمساعدة في حل النزاع',
  'يرجى تقديم إثبات الدفع (صورة الإيصال)',
  'يرجى الانتظار حتى نراجع الصفقة',
  'تم حل النزاع — شكراً لتعاونكم',
]

export function TradeChat({ trade, onClose, onTradeUpdated }: Props) {
  const { t } = useLanguage()
  const [messages, setMessages] = useState<TradeMessage[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [disputeOpen, setDisputeOpen] = useState(false)
  const [disputeReason, setDisputeReason] = useState('NO_RELEASE')
  const [disputeDesc, setDisputeDesc] = useState('')
  const [disputing, setDisputing] = useState(false)
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isAdmin = trade.myRole === 'ADMIN'

  async function loadMessages() {
    const { data } = await apiCall<{ messages: TradeMessage[] }>(
      `/api/p2p/messages?tradeId=${trade.id}`,
    )
    if (data) {
      setMessages(data.messages)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadMessages()
    const interval = setInterval(loadMessages, 5000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trade.id])

  // Subscribe to real-time NEW_MESSAGE events for this trade
  useP2pEvents('NEW_MESSAGE', (event) => {
    if (event.tradeId !== trade.id) return
    loadMessages()
  })

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current && !search) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages.length, search])

  async function handleSend() {
    if (!text.trim()) return
    setSending(true)
    const { data, error } = await apiCall('/api/p2p/messages', {
      method: 'POST',
      body: JSON.stringify({ tradeId: trade.id, message: text.trim() }),
    })
    setSending(false)
    if (error) {
      showError(error)
      return
    }
    if (data?.message) {
      setMessages((prev) => [...prev, data.message])
    }
    setText('')
    inputRef.current?.focus()
  }

  async function handleEdit(messageId: string) {
    if (!editText.trim()) return
    const { data, error } = await apiCall('/api/p2p/messages', {
      method: 'PATCH',
      body: JSON.stringify({ messageId, action: 'EDIT', text: editText.trim() }),
    })
    if (error) {
      showError(error)
      return
    }
    showSuccess('تم التعديل')
    setEditingId(null)
    setEditText('')
    loadMessages()
  }

  async function handleDelete(messageId: string) {
    if (!confirm('حذف هذه الرسالة؟')) return
    const { data, error } = await apiCall('/api/p2p/messages', {
      method: 'PATCH',
      body: JSON.stringify({ messageId, action: 'DELETE' }),
    })
    if (error) {
      showError(error)
      return
    }
    showSuccess(data?.message || 'تم الحذف')
    loadMessages()
  }

  async function handleDispute() {
    setDisputing(true)
    const { data, error } = await apiCall('/api/p2p/trades', {
      method: 'PATCH',
      body: JSON.stringify({
        tradeId: trade.id,
        action: 'DISPUTE',
        reason: disputeReason,
        description: disputeDesc,
      }),
    })
    setDisputing(false)
    if (error) {
      showError(error)
      return
    }
    showSuccess(data?.message || 'تم فتح النزاع')
    setDisputeOpen(false)
    setDisputeDesc('')
    onTradeUpdated?.()
    loadMessages() // refresh to show system message
  }

  const isClosed = trade.status === 'CANCELLED' || trade.status === 'RELEASED'

  // Filter messages by search query
  const filteredMessages = search
    ? messages.filter((m) => m.message.toLowerCase().includes(search.toLowerCase()))
    : messages

  return (
    <div className="flex flex-col h-[100dvh] sm:h-[60vh] sm:min-h-[400px] max-h-[100dvh]">
      {/* Header */}
      <div className="border-b p-3 space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="w-9 h-9">
              <AvatarFallback>
                {trade.counterparty.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-sm flex items-center gap-1.5">
                {trade.counterparty.name}
                {isAdmin && (
                  <Badge variant="outline" className="text-[9px] text-violet-600 border-violet-300">
                    <ShieldAlert className="w-2.5 h-2.5" />
                    أدمن
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {trade.counterparty.phone || '—'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setShowSearch((s) => !s)}
              title="بحث في الرسائل"
            >
              <Search className="w-3.5 h-3.5" />
            </Button>
            <Badge variant="outline" className="text-xs">
              {trade.myRole === 'BUYER' ? 'مشتري' : trade.myRole === 'SELLER' ? 'بائع' : 'إدارة'}
            </Badge>
          </div>
        </div>
        {/* Search bar */}
        {showSearch && (
          <div className="relative">
            <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث في الرسائل..."
              className="h-7 pr-7 text-xs"
              autoFocus
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="rounded bg-muted/50 p-1.5">
            <div className="text-muted-foreground">الكمية</div>
            <div className="font-medium">{fmtUsdt(trade.usdtAmount)} USDT</div>
          </div>
          <div className="rounded bg-muted/50 p-1.5">
            <div className="text-muted-foreground">المبلغ</div>
            <div className="font-medium">{fmtEgp(trade.egpAmount)} EGP</div>
          </div>
          <div className="rounded bg-muted/50 p-1.5">
            <div className="text-muted-foreground">السعر</div>
            <div className="font-medium">{fmtEgp(trade.priceEgp)}</div>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-muted/10">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground text-sm py-8">
            <ShieldCheck className="w-10 h-10 mb-2 opacity-30" />
            <p>{search ? 'لا توجد نتائج للبحث' : 'لا توجد رسائل بعد'}</p>
            <p className="text-xs mt-1">
              {search ? 'جرّب كلمات أخرى' : 'ابدأ محادثة مع الطرف الآخر'}
            </p>
          </div>
        ) : (
          filteredMessages.map((m) => {
            // System message: centered gray pill
            if (m.isSystem) {
              return (
                <div key={m.id} className="flex justify-center my-1">
                  <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-[11px] max-w-[85%] text-center">
                    {m.message}
                  </div>
                </div>
              )
            }

            // Deleted message
            if (m.isDeleted) {
              return (
                <div
                  key={m.id}
                  className={cn('flex', m.isMine ? 'justify-start' : 'justify-end')}
                >
                  <div className="max-w-[75%] rounded-2xl px-3 py-2 text-sm italic bg-muted/30 text-muted-foreground/60 border border-dashed border-muted-foreground/30">
                    {m.message}
                  </div>
                </div>
              )
            }

            const isAdminSender = m.senderRole === 'ADMIN'
            return (
              <div
                key={m.id}
                className={cn('group flex flex-col', m.isMine ? 'items-start' : 'items-end')}
              >
                {/* Sender name + admin badge (only show for non-mine admin messages) */}
                {!m.isMine && isAdminSender && (
                  <div className="text-[10px] text-violet-600 dark:text-violet-400 mb-0.5 px-2 flex items-center gap-1">
                    <ShieldAlert className="w-2.5 h-2.5" />
                    {m.senderName} (إدارة)
                  </div>
                )}
                <div className="flex items-end gap-1">
                  {m.isMine && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                      <button
                        onClick={() => {
                          setEditingId(m.id)
                          setEditText(m.message)
                        }}
                        className="text-muted-foreground hover:text-foreground p-1"
                        title="تعديل (خلال 5 دقائق)"
                        disabled={m.isDeleted}
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="text-muted-foreground hover:text-rose-500 p-1"
                        title="حذف"
                        disabled={m.isDeleted}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <div
                    className={cn(
                      'max-w-[75%] rounded-2xl px-3 py-2 text-sm',
                      m.isMine
                        ? isAdminSender
                          ? 'bg-violet-600 text-white rounded-bl-sm'
                          : 'bg-primary text-primary-foreground rounded-bl-sm'
                        : isAdminSender
                        ? 'bg-violet-100 dark:bg-violet-950 text-violet-900 dark:text-violet-100 border border-violet-300 dark:border-violet-800 rounded-br-sm'
                        : 'bg-card border rounded-br-sm',
                    )}
                  >
                    {/* Editing mode */}
                    {editingId === m.id ? (
                      <div className="space-y-1">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full text-foreground bg-background rounded p-1.5 text-xs resize-none"
                          rows={2}
                          autoFocus
                        />
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            className="h-6 text-[10px] px-2"
                            onClick={() => handleEdit(m.id)}
                          >
                            حفظ
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-[10px] px-2"
                            onClick={() => {
                              setEditingId(null)
                              setEditText('')
                            }}
                          >
                            إلغاء
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>{m.message}</div>
                        {m.attachmentUrl && (
                          <a
                            href={m.attachmentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="block mt-1"
                          >
                            <img
                              src={m.attachmentUrl}
                              alt="attachment"
                              className="max-w-full max-h-40 rounded-lg"
                            />
                          </a>
                        )}
                        <div
                          className={cn(
                            'text-[10px] mt-0.5 flex items-center gap-0.5',
                            m.isMine
                              ? isAdminSender
                                ? 'text-violet-200'
                                : 'text-primary-foreground/70'
                              : 'text-muted-foreground',
                          )}
                        >
                          {new Date(m.createdAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {m.isEdited && <span className="opacity-70">· معدّلة</span>}
                          {/* Read receipt (only for my own messages, not admin) */}
                          {m.isMine && !isAdminSender && (
                            m.readByOther ? (
                              <CheckCheck className="w-3 h-3 text-blue-400" />
                            ) : (
                              <Check className="w-3 h-3 opacity-60" />
                            )
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Input area */}
      <div className="border-t p-3 space-y-2 shrink-0">
        {/* Quick canned replies */}
        {!isClosed && (
          <div className="flex flex-wrap gap-1">
            {(isAdmin ? ADMIN_CANNED_REPLIES : CANNED_REPLIES).slice(0, 4).map((reply) => (
              <button
                key={reply}
                onClick={() => setText(reply)}
                className="px-2 py-0.5 text-[10px] rounded-full border border-border bg-background hover:bg-muted/50 text-muted-foreground"
              >
                {reply}
              </button>
            ))}
          </div>
        )}

        {!isClosed && (
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder={isAdmin ? 'اكتب رسالة كإدارة...' : 'اكتب رسالة...'}
              disabled={sending}
              maxLength={1000}
            />
            <Button onClick={handleSend} disabled={sending || !text.trim()} size="icon">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        )}

        {/* Dispute button (only for buyers/sellers, not admin) */}
        {!isAdmin && (trade.status === 'PENDING_PAYMENT' || trade.status === 'PAID') && (
          <>
            {!disputeOpen ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950"
                onClick={() => setDisputeOpen(true)}
              >
                <AlertTriangle className="w-4 h-4" />
                فتح نزاع (تخالف مع الطرف الآخر)
              </Button>
            ) : (
              <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3 space-y-2">
                <div className="text-xs font-medium text-amber-700 dark:text-amber-400">
                  فتح نزاع — سيتم إبلاغ الإدارة لمراجعة الصفقة
                </div>
                <select
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full text-sm rounded border border-border bg-background px-2 py-1.5"
                >
                  <option value="NO_PAYMENT">المشتري لم يدفع</option>
                  <option value="NO_RELEASE">البائع لم يفرج عن USDT</option>
                  <option value="OTHER">سبب آخر</option>
                </select>
                <textarea
                  value={disputeDesc}
                  onChange={(e) => setDisputeDesc(e.target.value)}
                  placeholder="اشرح المشكلة بالتفصيل..."
                  className="w-full text-sm rounded border border-border bg-background px-2 py-1.5 min-h-[60px] resize-y"
                  maxLength={500}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleDispute}
                    disabled={disputing}
                    className="flex-1"
                  >
                    {disputing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    تأكيد فتح النزاع
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setDisputeOpen(false)}>
                    إلغاء
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
        {trade.status === 'DISPUTED' && (
          <div className="rounded-lg bg-amber-100 dark:bg-amber-950 p-2 text-xs text-amber-700 dark:text-amber-400 text-center">
            <AlertTriangle className="w-4 h-4 inline ml-1" />
            الصفقة في حالة نزاع — الإدارة تراجع الأمر
            {isAdmin && <span className="block mt-1 text-violet-600 dark:text-violet-400">أنت الآن في المحادثة كإدارة</span>}
          </div>
        )}
        {isClosed && (
          <div className="rounded-lg bg-muted/30 p-2 text-xs text-muted-foreground text-center">
            {trade.status === 'RELEASED' ? '✅ الصفقة مكتملة' : '❌ الصفقة ملغاة'} — المحادثة للقراءة فقط
          </div>
        )}
      </div>
    </div>
  )
}
