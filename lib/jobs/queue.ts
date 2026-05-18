export const PR_REVIEW_JOB_NAME = 'pr_review'

export function getQueueJobId(jobName: string, key: string) {
  return `${jobName}:${key}`
}

export function parseJobLimit(
  value: string | null,
  input: { fallback: number; max: number },
) {
  const parsed = Number(value ?? input.fallback)
  return Number.isFinite(parsed)
    ? Math.min(Math.max(Math.trunc(parsed), 1), input.max)
    : input.fallback
}
