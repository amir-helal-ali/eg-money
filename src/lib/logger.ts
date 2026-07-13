/**
 * Structured logger.
 *
 * Replaces ad-hoc `console.log` / `console.error` calls with structured
 * JSON logging that's easier to aggregate, filter, and search in
 * production (e.g., Datadog, Logtail, ELK).
 *
 * In development: pretty-prints to console for readability.
 * In production: emits JSON lines for machine parsing.
 *
 * Usage:
 *   logger.info('trade completed', { userId, tradeId, usdtAmount })
 *   logger.warn('rate limit hit', { ip, endpoint })
 *   logger.error('db transaction failed', { error: e, userId })
 *
 * Always include a context object with at least `userId` (if available)
 * and any relevant IDs (tradeId, depositId, etc.).
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

type LogContext = Record<string, unknown>

const isProduction = process.env.NODE_ENV === 'production'

function formatLog(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString()
  if (isProduction) {
    // JSON lines for log aggregators
    return JSON.stringify({
      ts: timestamp,
      level,
      msg: message,
      ...context,
    })
  }
  // Pretty-print for dev
  const ctxStr = context && Object.keys(context).length > 0
    ? ' ' + JSON.stringify(context)
    : ''
  return `[${timestamp}] ${level.toUpperCase()} ${message}${ctxStr}`
}

function shouldLog(level: LogLevel): boolean {
  const minLevel = (process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug')) as LogLevel
  const order: LogLevel[] = ['debug', 'info', 'warn', 'error']
  return order.indexOf(level) >= order.indexOf(minLevel)
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    if (!shouldLog('debug')) return
    console.debug(formatLog('debug', message, context))
  },

  info(message: string, context?: LogContext): void {
    if (!shouldLog('info')) return
    console.log(formatLog('info', message, context))
  },

  warn(message: string, context?: LogContext): void {
    if (!shouldLog('warn')) return
    console.warn(formatLog('warn', message, context))
  },

  error(message: string, context?: LogContext): void {
    if (!shouldLog('error')) return
    console.error(formatLog('error', message, context))
  },

  /**
   * Log an error with full context, including the error stack.
   * Use this in catch blocks: `logger.errorFromException('trade failed', e, { userId })`
   */
  errorFromException(message: string, error: unknown, context?: LogContext): void {
    const err = error instanceof Error ? error : new Error(String(error))
    this.error(message, {
      ...context,
      errorName: err.name,
      errorMessage: err.message,
      stack: isProduction ? undefined : err.stack,
    })
  },
}
