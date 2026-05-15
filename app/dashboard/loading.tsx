import { PageLoading } from '@/components/app/page-loading'

export default function Loading() {
  return (
    <PageLoading
      variant="dashboard"
      title="Loading dashboard"
      description="Gathering repositories, pull requests, and activity"
    />
  )
}
