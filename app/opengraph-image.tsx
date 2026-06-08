import { ImageResponse } from 'next/og'
import { siteConfig } from '@/lib/site'

export const alt = siteConfig.defaultTitle
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          height: '100%',
          width: '100%',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#0b1220',
          color: '#f8f9fc',
          padding: '72px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: '-0.02em',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: 14,
              backgroundColor: '#111827',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <svg
              width="30"
              height="30"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M14 50 V15 L32 37 L50 15 V50"
                stroke="#ffffff"
                strokeWidth="6.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20 42 L28.5 50 L46 30.5"
                stroke="#4f6df5"
                strokeWidth="6.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          {siteConfig.name}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: '-0.04em',
              maxWidth: 900,
            }}
          >
            Govern every AI pull request before it merges
          </div>
          <div
            style={{
              fontSize: 28,
              lineHeight: 1.45,
              color: 'rgba(248,249,252,0.72)',
              maxWidth: 920,
            }}
          >
            Risk scoring, agent attribution, repository rules, approvals, and
            audit evidence — GitHub-native.
          </div>
        </div>

        <div
          style={{
            fontSize: 22,
            color: '#4f6df5',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {siteConfig.tagline}
        </div>
      </div>
    ),
    { ...size },
  )
}
