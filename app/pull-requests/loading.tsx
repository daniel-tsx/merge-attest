import { PageLoading } from '@/components/app/page-loading'

export default function Loading() {
  return (
    <PageLoading
      variant="list"
      title="Loading pull requests"
      description="Scanning AI-assisted pull requests"
    />
  )
}
