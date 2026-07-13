'use client'

import { useEffect, useState } from 'react'

/**
 * 3D-style rotating USDT coin using pure CSS 3D transforms.
 * - Two faces (front/back) with the ₮ symbol
 * - Continuous rotation
 * - Subtle floating motion
 * - Glow effect underneath
 */
export function Coin3D({ size = 200 }: { size?: number }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  return (
    <div
      className="relative"
      style={{
        width: size,
        height: size,
        perspective: '1200px',
      }}
    >
      {/* Glow underneath */}
      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-full bg-primary/30 blur-3xl"
        style={{
          width: size * 0.7,
          height: size * 0.7,
          bottom: -size * 0.15,
        }}
      />

      {/* Floating wrapper */}
      <div
        className="relative w-full h-full"
        style={{
          animation: 'coin-float 4s ease-in-out infinite',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Rotating coin */}
        <div
          className="relative w-full h-full"
          style={{
            animation: 'coin-rotate 8s linear infinite',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Front face */}
          <div
            className="absolute inset-0 rounded-full flex items-center justify-center"
            style={{
              backfaceVisibility: 'hidden',
              background: 'linear-gradient(135deg, oklch(0.85 0.19 155) 0%, oklch(0.72 0.18 165) 50%, oklch(0.65 0.16 155) 100%)',
              boxShadow: `
                inset 0 0 0 4px oklch(0.95 0.15 155),
                inset 0 0 0 8px oklch(0.72 0.18 165),
                inset 0 0 0 10px oklch(0.92 0.14 155),
                0 0 60px oklch(0.78 0.19 155 / 0.4)
              `,
            }}
          >
            <span
              className="font-bold text-primary-foreground"
              style={{
                fontSize: size * 0.45,
                fontFamily: 'var(--font-num), monospace',
                textShadow: '0 2px 8px oklch(0.13 0.02 165 / 0.5)',
              }}
            >
              ₮
            </span>
            {/* Ring detail */}
            <div
              className="absolute rounded-full border-2 border-dashed"
              style={{
                inset: size * 0.08,
                borderColor: 'oklch(0.13 0.02 165 / 0.3)',
              }}
            />
          </div>

          {/* Back face */}
          <div
            className="absolute inset-0 rounded-full flex items-center justify-center"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              background: 'linear-gradient(225deg, oklch(0.85 0.19 155) 0%, oklch(0.72 0.18 165) 50%, oklch(0.65 0.16 155) 100%)',
              boxShadow: `
                inset 0 0 0 4px oklch(0.95 0.15 155),
                inset 0 0 0 8px oklch(0.72 0.18 165),
                inset 0 0 0 10px oklch(0.92 0.14 155),
                0 0 60px oklch(0.78 0.19 155 / 0.4)
              `,
            }}
          >
            <div className="text-center">
              <div
                className="font-bold text-primary-foreground"
                style={{
                  fontSize: size * 0.18,
                  fontFamily: 'var(--font-num), monospace',
                }}
              >
                USDT
              </div>
              <div
                className="text-primary-foreground/70"
                style={{
                  fontSize: size * 0.07,
                  fontFamily: 'var(--font-num), monospace',
                }}
              >
                TETHER
              </div>
            </div>
            {/* Ring detail */}
            <div
              className="absolute rounded-full border-2 border-dashed"
              style={{
                inset: size * 0.08,
                borderColor: 'oklch(0.13 0.02 165 / 0.3)',
              }}
            />
          </div>

          {/* Edge thickness — simulate with multiple thin bands */}
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute inset-0 rounded-full"
              style={{
                transform: `rotateY(${i * 30}deg) translateZ(${size * 0.04}px)`,
                background: 'linear-gradient(to right, oklch(0.65 0.16 155), oklch(0.78 0.19 155), oklch(0.65 0.16 155))',
                opacity: 0.6,
              }}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes coin-rotate {
          0% { transform: rotateY(0deg) rotateX(8deg); }
          100% { transform: rotateY(360deg) rotateX(8deg); }
        }
        @keyframes coin-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </div>
  )
}
