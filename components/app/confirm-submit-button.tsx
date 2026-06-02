'use client'

import * as React from 'react'
import { Button, type ButtonProps } from '@/components/ui/button'

export function ConfirmSubmitButton({
  message,
  onClick,
  children,
  ...props
}: ButtonProps & { message: string }) {
  return (
    <Button
      {...props}
      type="submit"
      onClick={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault()
          return
        }
        onClick?.(event)
      }}
    >
      {children}
    </Button>
  )
}
