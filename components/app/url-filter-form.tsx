'use client'

import * as React from 'react'
import { useQueryStates, type UseQueryStatesKeysMap } from 'nuqs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'

type FilterOption = {
  value: string
  label: string
}

type FilterField = {
  name: string
  label: string
  type?: 'date' | 'search' | 'select' | 'text'
  placeholder?: string
  options?: FilterOption[]
}

function buildDraft(
  fields: FilterField[],
  values: Record<string, string | number | boolean | null>,
) {
  return fields
    .map((field) => `${field.name}:${values[field.name] ?? ''}`)
    .join('|')
}

export function UrlFilterForm({
  parsers,
  fields,
  className,
}: {
  parsers: UseQueryStatesKeysMap
  fields: FilterField[]
  className?: string
}) {
  const [isPending, startTransition] = React.useTransition()
  const [values, setValues] = useQueryStates(parsers, {
    shallow: false,
    startTransition,
  })
  const formKey = buildDraft(fields, values)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    void setValues(
      Object.fromEntries(
        fields.map((field) => {
          const value = String(formData.get(field.name) ?? '').trim()
          return [field.name, value || null]
        }),
      ),
    )
  }

  function handleReset() {
    void setValues(null)
  }

  return (
    <form
      key={formKey}
      className={cn('grid gap-3 md:items-end', className)}
      onSubmit={handleSubmit}
    >
      {fields.map((field) => (
        <label key={field.name} className="space-y-1.5">
          <span className="block text-xs font-medium text-muted-foreground">
            {field.label}
          </span>
          {field.type === 'select' ? (
            <Select
              name={field.name}
              defaultValue={String(values[field.name] ?? '')}
            >
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          ) : (
            <Input
              name={field.name}
              type={
                field.type === 'date'
                  ? 'date'
                  : field.type === 'text'
                    ? 'text'
                    : 'search'
              }
              defaultValue={String(values[field.name] ?? '')}
              placeholder={field.placeholder}
            />
          )}
        </label>
      ))}
      <div className="flex gap-2">
        <Button type="submit" variant="secondary" disabled={isPending}>
          {isPending ? 'Applying...' : 'Apply'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={isPending}
          onClick={handleReset}
        >
          Reset
        </Button>
      </div>
    </form>
  )
}
