'use client'

import * as React from 'react'
import { Command as CommandPrimitive } from 'cmdk'
import * as Dialog from '@radix-ui/react-dialog'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

function Command({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        'flex h-full w-full flex-col overflow-hidden rounded-card bg-surface-elevated text-foreground',
        className,
      )}
      {...props}
    />
  )
}

function CommandDialog({
  open,
  onOpenChange,
  label = 'Command menu',
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  label?: string
  children: React.ReactNode
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-scrim/50 backdrop-blur-sm" />
        <Dialog.Content
          aria-label={label}
          className="fixed left-1/2 top-[18vh] z-50 w-[min(40rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-card border border-border bg-surface-elevated shadow-overlay focus:outline-none"
        >
          <Dialog.Title className="sr-only">{label}</Dialog.Title>
          <Command>{children}</Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div className="flex items-center gap-2 border-b border-border px-3">
      <Search
        className="size-4 shrink-0 text-subtle-foreground"
        aria-hidden="true"
      />
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn(
          'h-11 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-subtle-foreground disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
    </div>
  )
}

function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        'max-h-80 overflow-y-auto overflow-x-hidden p-1.5',
        className,
      )}
      {...props}
    />
  )
}

function CommandEmpty(
  props: React.ComponentProps<typeof CommandPrimitive.Empty>,
) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className="py-8 text-center text-sm text-muted-foreground"
      {...props}
    />
  )
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        'overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-eyebrow [&_[cmdk-group-heading]]:text-subtle-foreground',
        className,
      )}
      {...props}
    />
  )
}

function CommandItem({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        'relative flex cursor-pointer select-none items-center gap-2.5 rounded-control px-2 py-2 text-sm text-foreground outline-none transition-colors',
        'data-[selected=true]:bg-surface-hover data-[selected=true]:text-foreground',
        'data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
        '[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-subtle-foreground',
        className,
      )}
      {...props}
    />
  )
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn('-mx-1 my-1 h-px bg-divider', className)}
      {...props}
    />
  )
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
}
