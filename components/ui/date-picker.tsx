'use client'

import * as React from 'react'
import { Calendar as CalendarIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

const displayFormatter = new Intl.DateTimeFormat('en', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

// Local YYYY-MM-DD so the submitted value is not shifted by the UTC offset.
function toISODate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseISODate(value?: string) {
  if (!value) return undefined
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return undefined
  const date = new Date(year, month - 1, day)
  return Number.isNaN(date.getTime()) ? undefined : date
}

// Date Picker for uncontrolled FormData forms: a Popover + Calendar trigger that
// mirrors the native control's styling, backed by a hidden input so the server
// action still receives `name` as a YYYY-MM-DD string (empty when unset).
export function DatePicker({
  name,
  defaultValue,
  id,
  disabled,
  placeholder = 'Select date',
  className,
}: {
  name: string
  defaultValue?: string
  id?: string
  disabled?: boolean
  placeholder?: string
  className?: string
}) {
  const [date, setDate] = React.useState<Date | undefined>(() =>
    parseISODate(defaultValue),
  )
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <input type="hidden" name={name} value={date ? toISODate(date) : ''} />
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          className={cn(
            'flex h-9 w-full items-center justify-between rounded-control border border-border bg-surface-elevated px-3 text-sm outline-none transition-[background-color,border-color,box-shadow] duration-150 hover:border-border-strong focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted-foreground disabled:opacity-70',
            date ? 'text-foreground' : 'text-subtle-foreground',
            className,
          )}
        >
          <span className="truncate">
            {date ? displayFormatter.format(date) : placeholder}
          </span>
          <CalendarIcon
            aria-hidden="true"
            className="ml-2 size-3.5 shrink-0 text-subtle-foreground"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          defaultMonth={date}
          onSelect={(next) => {
            setDate(next)
            setOpen(false)
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}
