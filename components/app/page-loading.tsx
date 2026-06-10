import { GateScan } from '@/components/app/gate-scan'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export type PageLoadingVariant =
  | 'dashboard'
  | 'list'
  | 'detail'
  | 'log'
  | 'form'

type PageLoadingProps = {
  title?: string
  description?: string
  variant?: PageLoadingVariant
}

export function PageLoading({
  title = 'Loading workspace',
  description,
  variant = 'list',
}: PageLoadingProps) {
  return (
    <div
      className="space-y-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={title}
    >
      <PageLoadingHeader title={title} description={description} />
      {variant === 'dashboard' && <DashboardSkeleton />}
      {variant === 'list' && <ListSkeleton />}
      {variant === 'detail' && <DetailSkeleton />}
      {variant === 'log' && <LogSkeleton />}
      {variant === 'form' && <FormSkeleton />}
      <span className="sr-only">{title}</span>
    </div>
  )
}

function PageLoadingHeader({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div className="flex items-start gap-4 border-b border-border pb-5">
      <GateScan size="md" tone="accent" label={title} />
      <div className="flex-1 space-y-2 pt-1">
        <Skeleton className="h-6 w-56 max-w-full" />
        <Skeleton
          className="h-4 w-full max-w-xl"
          aria-label={description ?? undefined}
        />
      </div>
    </div>
  )
}

function MetricCardSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="size-9 rounded-control" />
        </div>
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-6 w-full" />
      </CardContent>
    </Card>
  )
}

function StatPanelSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <Skeleton className="h-4 w-32" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function TableRowsSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-12 gap-3 px-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={`th-${index}`} className="col-span-2 h-3" />
        ))}
      </div>
      <div className="divide-y divide-border rounded-control border border-border">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={`tr-${index}`}
            className="grid grid-cols-12 items-center gap-3 px-2 py-3"
          >
            <Skeleton className="col-span-3 h-4" />
            <Skeleton className="col-span-2 h-4" />
            <Skeleton className="col-span-1 h-5 rounded-full" />
            <Skeleton className="col-span-2 h-5 rounded-full" />
            <Skeleton className="col-span-2 h-4" />
            <Skeleton className="col-span-2 h-4" />
          </div>
        ))}
      </div>
    </div>
  )
}

function FilterBarSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Skeleton className="h-9 w-64 max-w-full" />
      <Skeleton className="h-9 w-32" />
      <Skeleton className="h-9 w-32" />
      <Skeleton className="h-9 w-24" />
      <Skeleton className="ml-auto h-9 w-28" />
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <section className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <MetricCardSkeleton key={index} />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <StatPanelSkeleton />
          <StatPanelSkeleton />
        </div>
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-3 p-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3 p-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardContent className="space-y-4 p-4">
          <Skeleton className="h-4 w-40" />
          <TableRowsSkeleton rows={5} />
        </CardContent>
      </Card>
    </div>
  )
}

export function ListSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <FilterBarSkeleton />
        <div className="flex items-center justify-between border-b border-border pb-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
        <TableRowsSkeleton rows={8} />
      </CardContent>
    </Card>
  )
}

export function LogSkeleton() {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-32" />
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        <FilterBarSkeleton />
        <div className="flex items-center justify-between border-b border-border pb-3">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <TableRowsSkeleton rows={12} />
      </CardContent>
    </Card>
  )
}

export function DetailSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3 p-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3 p-4">
            <Skeleton className="h-4 w-28" />
            <TableRowsSkeleton rows={4} />
          </CardContent>
        </Card>
      </div>
      <div className="space-y-4">
        <Card>
          <CardContent className="space-y-3 p-4">
            <Skeleton className="h-4 w-24" />
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex justify-between gap-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3 p-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function FormSkeleton() {
  return (
    <Card>
      <CardContent className="max-w-2xl space-y-5 p-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </CardContent>
    </Card>
  )
}

export function TableSkeleton({
  label = 'Loading results',
  rows = 8,
}: {
  label?: string
  rows?: number
}) {
  return (
    <div className="space-y-4" role="status" aria-label={label}>
      <div className="flex items-center justify-between border-b border-border pb-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-32" />
      </div>
      <TableRowsSkeleton rows={rows} />
      <span className="sr-only">{label}</span>
    </div>
  )
}
