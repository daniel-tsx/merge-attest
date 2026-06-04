'use client'

import type { ReactNode } from 'react'
import { useFormStatus } from 'react-dom'
import { Button, type ButtonProps } from '@/components/ui/button'

type SubmitButtonProps = Omit<ButtonProps, 'type'> & {
  pendingChildren?: ReactNode
}

export function SubmitButton({
  children,
  disabled,
  pendingChildren,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={disabled || pending} {...props}>
      {pending ? (pendingChildren ?? children) : children}
    </Button>
  )
}
