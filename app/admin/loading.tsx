import { PageLoading } from '@/components/app/page-loading'

export default function AdminLoading() {
  return (
    <PageLoading
      variant="admin"
      title="Loading admin dashboard"
      description="Aggregating platform analytics across all workspaces."
    />
  )
}
