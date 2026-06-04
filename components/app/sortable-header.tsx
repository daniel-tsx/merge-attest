'use client'

import { useQueryStates } from 'nuqs'
import { ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react'
import {
  pullRequestSearchParams,
  type PullRequestSortKey,
} from '@/app/pull-requests/search-params'
import { cn } from '@/lib/utils'

export function SortableHeader({
  sortKey,
  label,
}: {
  sortKey: PullRequestSortKey
  label: string
}) {
  const [{ sort, dir }, setQuery] = useQueryStates(
    { sort: pullRequestSearchParams.sort, dir: pullRequestSearchParams.dir },
    { shallow: false },
  )
  const active = sort === sortKey
  const nextDir = active && dir === 'desc' ? 'asc' : 'desc'
  const Icon = !active
    ? ChevronsUpDown
    : dir === 'desc'
      ? ChevronDown
      : ChevronUp

  return (
    <button
      type="button"
      onClick={() => setQuery({ sort: sortKey, dir: nextDir })}
      aria-label={
        active
          ? `Sort by ${label}, ${dir === 'desc' ? 'descending' : 'ascending'}`
          : `Sort by ${label}`
      }
      className={cn(
        'group/sort -mx-1 inline-flex items-center gap-1 rounded-control px-1 py-0.5 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring',
        active ? 'text-foreground' : 'text-subtle-foreground',
      )}
    >
      {label}
      <Icon
        className={cn(
          'size-3 shrink-0',
          active
            ? 'opacity-100'
            : 'opacity-0 transition-opacity group-hover/sort:opacity-60',
        )}
        aria-hidden="true"
      />
    </button>
  )
}
