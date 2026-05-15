import { PageLoading } from '@/components/app/page-loading'

export default function Loading() {
  return (
    <PageLoading
      variant="detail"
      title="Loading pull request"
      description="Pulling risk score, test gaps, and approval history"
    />
  )
}
