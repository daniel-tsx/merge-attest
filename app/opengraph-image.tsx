import { ImageResponse } from 'next/og'
import { siteConfig } from '@/lib/site'

export const alt = siteConfig.defaultTitle
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// "Paper of Record" register: light paper, ink type, ruled hairlines, and the
// attestation seal. Colors approximate the app's light tokens (satori needs
// hex). Type stays on the bundled default face — loading Fraunces here would
// add a runtime font fetch for marginal gain on a 630px card.
const paper = '#f5f6f9'
const ink = '#161c2a'
const inkDim = '#5a6579'
const rule = '#d6dbe4'
const seal = '#20758c'

function SealMark({ size: s }: { size: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 108 108" fill="none">
      <circle cx="54" cy="54" r="52" stroke={seal} strokeWidth="1.5" />
      <circle
        cx="54"
        cy="54"
        r="41"
        stroke={seal}
        strokeWidth="0.75"
        strokeDasharray="2 3"
      />
      <g
        transform="translate(37, 37)"
        stroke={seal}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5.5 27 V7 L17 19.5 L28.5 7 V27" />
        <path d="M9.5 21.5 L15 27 L25.5 14.5" />
      </g>
    </svg>
  )
}

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        height: '100%',
        width: '100%',
        flexDirection: 'column',
        backgroundColor: paper,
        color: ink,
        padding: '56px 72px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          paddingBottom: 18,
          borderBottom: `1px solid ${rule}`,
          fontSize: 17,
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color: inkDim,
        }}
      >
        <div>Public register · AI-assisted pull requests</div>
        <div>Free early access</div>
      </div>

      <div
        style={{
          display: 'flex',
          flex: 1,
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 48,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 26,
            maxWidth: 780,
          }}
        >
          <div
            style={{
              fontSize: 76,
              fontWeight: 600,
              lineHeight: 1.06,
              letterSpacing: '-0.03em',
            }}
          >
            Every AI pull request, on the record.
          </div>
          <div
            style={{
              fontSize: 27,
              lineHeight: 1.45,
              color: inkDim,
              maxWidth: 720,
            }}
          >
            Agent attribution, deterministic risk scoring, recorded approvals,
            and audit-ready evidence — GitHub-native.
          </div>
        </div>
        <SealMark size={190} />
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 20,
          borderTop: `1px solid ${rule}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: '-0.02em',
          }}
        >
          <svg width="34" height="34" viewBox="0 0 32 32" fill="none">
            <path
              d="M6.5 25 V7.5 L16 18.5 L25.5 7.5 V25"
              stroke={ink}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10 21 L14.3 25 L23 15.25"
              stroke={seal}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {siteConfig.name}
        </div>
        <div
          style={{
            fontSize: 17,
            color: seal,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
          }}
        >
          Attested · on the record
        </div>
      </div>
    </div>,
    { ...size },
  )
}
