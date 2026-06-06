'use client'

import * as React from 'react'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
} from 'react-day-picker'

import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = 'label',
  buttonVariant = 'ghost',
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>['variant']
}) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      className={cn('group/calendar p-3 [--cell-size:2rem]', className)}
      classNames={{
        root: cn('w-fit', defaultClassNames.root),
        months: cn(
          'relative flex flex-col gap-4 md:flex-row',
          defaultClassNames.months,
        ),
        month: cn('flex w-full flex-col gap-4', defaultClassNames.month),
        nav: cn(
          'absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1',
          defaultClassNames.nav,
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          'size-(--cell-size) select-none p-0 aria-disabled:opacity-50',
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          'size-(--cell-size) select-none p-0 aria-disabled:opacity-50',
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          'flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)',
          defaultClassNames.month_caption,
        ),
        dropdowns: cn(
          'flex h-(--cell-size) w-full items-center justify-center gap-1.5 text-sm font-medium',
          defaultClassNames.dropdowns,
        ),
        dropdown_root: cn(
          'relative rounded-control border border-border has-focus:border-focus has-focus:ring-2 has-focus:ring-focus-ring',
          defaultClassNames.dropdown_root,
        ),
        dropdown: cn(
          'absolute inset-0 bg-surface-elevated opacity-0',
          defaultClassNames.dropdown,
        ),
        caption_label: cn(
          'select-none font-medium',
          captionLayout === 'label'
            ? 'text-sm'
            : 'flex h-8 items-center gap-1 rounded-control pl-2 pr-1 text-sm [&>svg]:size-3.5 [&>svg]:text-subtle-foreground',
          defaultClassNames.caption_label,
        ),
        month_grid: cn('w-full border-collapse', defaultClassNames.month_grid),
        weekdays: cn('flex', defaultClassNames.weekdays),
        weekday: cn(
          'flex-1 select-none rounded-control text-[0.8rem] font-normal text-muted-foreground',
          defaultClassNames.weekday,
        ),
        week: cn('mt-2 flex w-full', defaultClassNames.week),
        week_number_header: cn(
          'w-(--cell-size) select-none',
          defaultClassNames.week_number_header,
        ),
        week_number: cn(
          'select-none text-[0.8rem] text-muted-foreground',
          defaultClassNames.week_number,
        ),
        day: cn(
          'group/day relative aspect-square h-full w-full select-none p-0 text-center [&:first-child[data-selected=true]_button]:rounded-l-control [&:last-child[data-selected=true]_button]:rounded-r-control',
          defaultClassNames.day,
        ),
        range_start: cn(
          'rounded-l-control bg-accent-soft',
          defaultClassNames.range_start,
        ),
        range_middle: cn('rounded-none', defaultClassNames.range_middle),
        range_end: cn(
          'rounded-r-control bg-accent-soft',
          defaultClassNames.range_end,
        ),
        today: cn(
          'rounded-control bg-surface-muted text-foreground data-[selected=true]:bg-transparent',
          defaultClassNames.today,
        ),
        outside: cn(
          'text-subtle-foreground aria-selected:text-subtle-foreground',
          defaultClassNames.outside,
        ),
        disabled: cn(
          'text-muted-foreground opacity-50',
          defaultClassNames.disabled,
        ),
        hidden: cn('invisible', defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => (
          <div
            data-slot="calendar"
            ref={rootRef}
            className={cn(className)}
            {...props}
          />
        ),
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === 'left') {
            return (
              <ChevronLeft className={cn('size-4', className)} {...props} />
            )
          }
          if (orientation === 'right') {
            return (
              <ChevronRight className={cn('size-4', className)} {...props} />
            )
          }
          return <ChevronDown className={cn('size-4', className)} {...props} />
        },
        DayButton: CalendarDayButton,
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames()
  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <button
      ref={ref}
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        buttonVariants({ variant: 'ghost', size: 'icon' }),
        'flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 font-normal leading-none',
        'group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:border-focus group-data-[focused=true]/day:ring-2 group-data-[focused=true]/day:ring-focus-ring',
        'data-[selected-single=true]:bg-accent data-[selected-single=true]:text-accent-foreground data-[selected-single=true]:hover:bg-accent-hover data-[selected-single=true]:hover:text-accent-foreground',
        'data-[range-start=true]:rounded-l-control data-[range-start=true]:bg-accent data-[range-start=true]:text-accent-foreground',
        'data-[range-end=true]:rounded-r-control data-[range-end=true]:bg-accent data-[range-end=true]:text-accent-foreground',
        'data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-accent-soft data-[range-middle=true]:text-foreground',
        '[&>span]:text-xs [&>span]:opacity-70',
        defaultClassNames.day,
        className,
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
