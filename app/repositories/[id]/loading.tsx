import { PageLoading } from '@/components/app/page-loading'

export default function Loading() {
  return (
    <PageLoading
      variant="detail"
      title="Loading repository"
      description="Loading rules, pull requests, and activity for this repository"
    />
  )
}
