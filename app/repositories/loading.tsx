import { PageLoading } from '@/components/app/page-loading'

export default function Loading() {
  return (
    <PageLoading
      variant="list"
      title="Loading repositories"
      description="Reading connected repositories and rules"
    />
  )
}
