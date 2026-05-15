import { PageLoading } from '@/components/app/page-loading'

export default function Loading() {
  return (
    <PageLoading
      variant="log"
      title="Loading audit log"
      description="Replaying recorded gate events"
    />
  )
}
