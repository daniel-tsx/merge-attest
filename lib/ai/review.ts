import { z } from 'zod'

export const aiReviewCommentSchema = z
  .object({
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    category: z.string().trim().min(1).max(80),
    confidence: z.number().min(0).max(1),
    filePath: z.string().trim().min(1).max(500).optional(),
    lineNumber: z.number().int().positive().optional(),
    body: z.string().trim().min(1).max(1200),
  })
  .strict()

export const aiReviewResponseSchema = z
  .object({
    comments: z.array(aiReviewCommentSchema).max(100).default([]),
    summary: z.string().trim().max(4000).optional(),
  })
  .strict()

export type AiReviewComment = z.infer<typeof aiReviewCommentSchema>
export type AiReviewResponse = z.infer<typeof aiReviewResponseSchema>

export type ValidatedAiReview = {
  inlineComments: Array<
    AiReviewComment & {
      filePath: string
      lineNumber: number
      side: 'RIGHT'
    }
  >
  summaryFindings: AiReviewComment[]
  skippedCommentsCount: number
}

export function parseAiReviewResponse(value: unknown): AiReviewResponse {
  const parsed =
    typeof value === 'string' ? (JSON.parse(value) as unknown) : value
  return aiReviewResponseSchema.parse(parsed)
}

export function validateAiReviewComments(
  response: AiReviewResponse,
  commentableLines: Map<string, Set<number>>,
): ValidatedAiReview {
  const inlineComments: ValidatedAiReview['inlineComments'] = []
  const summaryFindings: AiReviewComment[] = []
  let skippedCommentsCount = 0

  for (const comment of response.comments) {
    if (!comment.filePath || !comment.lineNumber) {
      summaryFindings.push(comment)
      continue
    }

    const lines = commentableLines.get(comment.filePath)
    if (!lines?.has(comment.lineNumber)) {
      skippedCommentsCount += 1
      continue
    }

    inlineComments.push({
      ...comment,
      filePath: comment.filePath,
      lineNumber: comment.lineNumber,
      side: 'RIGHT',
    })
  }

  return { inlineComments, summaryFindings, skippedCommentsCount }
}
