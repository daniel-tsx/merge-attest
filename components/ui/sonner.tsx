'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

export function Toaster(props: ToasterProps) {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      position="bottom-right"
      // Map Sonner's internal CSS variables to our design tokens so toasts
      // re-theme with the rest of the app in both light and dark.
      style={
        {
          '--normal-bg': 'var(--surface-elevated)',
          '--normal-text': 'var(--foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius-card)',
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: 'shadow-overlay',
          description: 'text-muted-foreground',
        },
      }}
      {...props}
    />
  )
}
