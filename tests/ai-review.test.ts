import { describe, expect, it } from 'vitest'
import {
  parseAiReviewResponse,
  validateAiReviewComments,
} from '../lib/ai/review'

describe('AI review response guardrails', () => {
  it('parses valid AI review JSON', () => {
    expect(
      parseAiReviewResponse(
        JSON.stringify({
          comments: [
            {
              severity: 'high',
              category: 'correctness',
              confidence: 0.9,
              filePath: 'lib/review.ts',
              lineNumber: 2,
              body: 'This path misses the fallback case.',
            },
          ],
          summary: 'One issue found.',
        }),
      ),
    ).toEqual({
      comments: [
        {
          severity: 'high',
          category: 'correctness',
          confidence: 0.9,
          filePath: 'lib/review.ts',
          lineNumber: 2,
          body: 'This path misses the fallback case.',
        },
      ],
      summary: 'One issue found.',
    })
  })

  it('keeps only inline comments on added diff lines', () => {
    const response = parseAiReviewResponse({
      comments: [
        {
          severity: 'medium',
          category: 'correctness',
          confidence: 0.8,
          filePath: 'lib/review.ts',
          lineNumber: 2,
          body: 'Valid inline finding.',
        },
        {
          severity: 'low',
          category: 'style',
          confidence: 0.6,
          filePath: 'lib/review.ts',
          lineNumber: 4,
          body: 'Outside the changed lines.',
        },
        {
          severity: 'high',
          category: 'security',
          confidence: 0.7,
          body: 'High-level issue without a precise line.',
        },
      ],
    })

    expect(
      validateAiReviewComments(
        response,
        new Map([['lib/review.ts', new Set([2])]]),
      ),
    ).toEqual({
      inlineComments: [
        {
          severity: 'medium',
          category: 'correctness',
          confidence: 0.8,
          filePath: 'lib/review.ts',
          lineNumber: 2,
          body: 'Valid inline finding.',
          side: 'RIGHT',
        },
      ],
      summaryFindings: [
        {
          severity: 'high',
          category: 'security',
          confidence: 0.7,
          body: 'High-level issue without a precise line.',
        },
      ],
      skippedCommentsCount: 1,
    })
  })

  it('rejects invalid JSON and invalid schemas', () => {
    expect(() => parseAiReviewResponse('{')).toThrow()
    expect(() =>
      parseAiReviewResponse({
        comments: [
          {
            severity: 'urgent',
            category: 'correctness',
            confidence: 0.5,
            body: 'Invalid severity.',
          },
        ],
      }),
    ).toThrow()
  })
})
