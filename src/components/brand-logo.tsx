'use client'

import { cn } from '@/lib/utils'

type LogoVariant = 'icon' | 'banner'

type LogoProps = {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  /** Which variant of the official brand mark to render.
   *  - 'icon'   : the square-ish Eg-Money symbol only (best for headers, favicons, mobile)
   *  - 'banner' : the horizontal full lockup (icon + "Eg-Money" text + tagline) for marketing surfaces
   * Defaults to 'icon'.
   */
  variant?: LogoVariant
  /** Show the "Eg-Money" text label beside the icon. Defaults to true for the
   *  icon variant (since the icon doesn't contain the brand name). The banner
   *  variant already contains the brand name in the image, so showText is
   *  ignored for it. */
  showText?: boolean
  className?: string
  /** No glow / shadow / rounding by default — the logo is a flat mark. */
  glow?: boolean
}

/**
 * Icon variant sizes — the height (since icon is roughly square-ish, ~1.35:1
 * wider than tall, we lock the height and let width follow aspect ratio).
 */
const ICON_HEIGHT: Record<NonNullable<LogoProps['size']>, number> = {
  xs: 20,
  sm: 28,
  md: 36,
  lg: 44,
  xl: 60,
  '2xl': 88,
}

/** Banner variant sizes — width is the primary dimension (aspect ~3.11:1). */
const BANNER_WIDTH: Record<NonNullable<LogoProps['size']>, number> = {
  xs: 100,
  sm: 140,
  md: 180,
  lg: 230,
  xl: 300,
  '2xl': 440,
}

const TEXT_SIZES: Record<NonNullable<LogoProps['size']>, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-2xl',
  '2xl': 'text-3xl',
}

const SUB_SIZES: Record<NonNullable<LogoProps['size']>, string> = {
  xs: 'text-[8px]',
  sm: 'text-[9px]',
  md: 'text-[10px]',
  lg: 'text-[10px]',
  xl: 'text-xs',
  '2xl': 'text-sm',
}

/**
 * Eg-Money brand logo — uses the official PNG assets directly.
 *  - variant="icon"   → /brand/logo.png   (icon-only crop, 331×245, height-driven)
 *                       Renders the icon + an "Eg-Money" text label beside it
 *                       (the text can be hidden with showText={false}).
 *  - variant="banner" → /brand/banner.png (full lockup 826×266, width-driven)
 *                       The image already contains the brand name + tagline,
 *                       so no additional text label is rendered.
 *
 * No background, no rounded corners, no shadow. The PNG is the brand mark itself.
 */
export function BrandLogo({
  size = 'md',
  variant = 'icon',
  showText = true,
  className,
  glow = false,
}: LogoProps) {
  if (variant === 'banner') {
    const w = BANNER_WIDTH[size]
    // banner.png is 826×266 → aspect 3.11
    const h = Math.round(w / 3.11)
    return (
      <div className={cn('flex items-center gap-2.5', className)}>
        <img
          src="/brand/banner.png"
          alt="Eg-Money"
          width={w}
          height={h}
          style={{ width: w, height: h }}
          className={cn('block object-contain select-none', glow && 'glow-primary-sm')}
          draggable={false}
        />
      </div>
    )
  }

  // Icon variant — PNG + optional text label
  const h = ICON_HEIGHT[size]
  // logo.png (icon-only crop) is 331×245 → aspect 1.351
  const w = Math.round(h * 1.35)
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <img
        src="/brand/logo.png"
        alt="Eg-Money"
        width={w}
        height={h}
        style={{ width: w, height: h }}
        className={cn('block object-contain select-none shrink-0', glow && 'glow-primary-sm')}
        draggable={false}
      />
      {showText && (
        <div className="leading-tight">
          <div className={cn('font-bold tracking-tight font-display', TEXT_SIZES[size])}>
            Eg-<span className="text-primary">Money</span>
          </div>
          <div className={cn('text-muted-foreground font-num', SUB_SIZES[size])}>
            USDT/EGP · LIVE
          </div>
        </div>
      )}
    </div>
  )
}
