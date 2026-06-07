// Dev-only helper: load the demo repositories + pull requests into a real,
// signed-in account's organization so authenticated UI surfaces can be verified
// against representative data. Re-runnable (clears its own prior rows first).
//
//   pnpm tsx prisma/seed-dev-org.ts [user-email]
//
// Defaults to the dev@mergeattest.test account created during the UI revamp.
import 'dotenv/config'
import { PrismaClient } from '../lib/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import {
  auditEvents,
  pullRequests,
  repositories,
  repoRules,
} from '../lib/demo-data'

const TARGET_EMAIL = process.argv[2] ?? 'dev@mergeattest.test'
const pid = (id: string) => `dev_${id}`

const adapter = new PrismaPg({
  connectionString:
    process.env.DATABASE_URL ??
    'postgresql://postgres:postgres@localhost:5432/mergeattest',
})
const prisma = new PrismaClient({ adapter })

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: TARGET_EMAIL },
    include: { memberships: true },
  })
  const membership = user?.memberships[0]
  if (!user || !membership) {
    throw new Error(
      `No user/org found for ${TARGET_EMAIL}. Sign up first, then re-run.`,
    )
  }
  const organizationId = membership.organizationId
  const reviewerId = user.id

  // Idempotent cleanup: repository delete cascades PRs, rules, files, signals,
  // test-gap, violations, approvals. Audit events are SetNull, so clear them too.
  await prisma.auditEvent.deleteMany({ where: { organizationId } })
  await prisma.repository.deleteMany({ where: { organizationId } })
  await prisma.usageRecord.deleteMany({ where: { organizationId } })

  for (const repository of repositories) {
    await prisma.repository.create({
      data: {
        id: pid(repository.id),
        name: repository.name,
        provider: 'github',
        owner: repository.owner,
        defaultBranch: repository.defaultBranch,
        visibility: repository.visibility,
        connectedStatus: repository.connectedStatus,
        lastSyncedAt: new Date(repository.lastSyncedAt),
        activeRulesCount: repository.activeRulesCount,
        monthlyPrCheckUsage: repository.monthlyPrCheckUsage,
        riskProfile: repository.riskProfile,
        providerMetadata: { demo: true },
        organizationId,
      },
    })
  }

  for (const rule of repoRules) {
    await prisma.repoRule.create({
      data: {
        id: pid(rule.id),
        name: rule.name,
        description: rule.description,
        enabled: rule.enabled,
        triggerType: rule.triggerType,
        actionType: rule.actionType,
        severity: rule.severity,
        repositoryId: pid(rule.repositoryId),
        organizationId,
      },
    })
  }

  for (const pullRequest of pullRequests) {
    await prisma.pullRequest.create({
      data: {
        id: pid(pullRequest.id),
        number: pullRequest.number,
        title: pullRequest.title,
        author: pullRequest.author,
        branch: pullRequest.branch,
        baseBranch: pullRequest.baseBranch,
        status: pullRequest.status,
        aiAssisted: pullRequest.aiAssisted,
        agentSource: pullRequest.agentSource,
        riskScore: pullRequest.riskScore,
        riskLevel: pullRequest.riskLevel,
        testGapStatus: pullRequest.testGapStatus,
        ciStatus: pullRequest.ciStatus,
        approvalStatus: pullRequest.approvalStatus,
        filesChangedCount: pullRequest.filesChangedCount,
        linesAdded: pullRequest.linesAdded,
        linesDeleted: pullRequest.linesDeleted,
        repositoryId: pid(pullRequest.repositoryId),
        organizationId,
        createdAt: new Date(pullRequest.createdAt),
        updatedAt: new Date(pullRequest.updatedAt),
        files: {
          create: pullRequest.files.map((file) => ({
            path: file.path,
            additions: file.additions,
            deletions: file.deletions,
            changeType: file.changeType,
          })),
        },
        riskSignals: {
          create: pullRequest.riskSignals.map((signal) => ({
            key: signal.key,
            label: signal.label,
            score: signal.score,
            level: signal.level,
            filePaths: signal.filePaths,
          })),
        },
        testGapAnalysis: {
          create: {
            status: pullRequest.testGapAnalysis.status,
            summary: pullRequest.testGapAnalysis.summary,
            affectedFiles: pullRequest.testGapAnalysis.affectedFiles,
            confidence: pullRequest.testGapAnalysis.confidence,
            suggestions: {
              create: pullRequest.testGapAnalysis.suggestedTestFiles.map(
                (testFile, index) => ({
                  testFile,
                  testCase:
                    pullRequest.testGapAnalysis.suggestedTestCases[index] ??
                    pullRequest.testGapAnalysis.suggestedTestCases[0] ??
                    'Add coverage.',
                }),
              ),
            },
          },
        },
        approvals: {
          create: pullRequest.approvals.map((approval) => ({
            decision: approval.decision,
            note: approval.note,
            reviewerId,
            createdAt: new Date(approval.createdAt),
          })),
        },
      },
    })

    for (const violation of pullRequest.ruleViolations) {
      const rule = repoRules.find(
        (item) =>
          item.repositoryId === pullRequest.repositoryId &&
          item.name === violation.ruleName,
      )
      if (!rule) continue
      await prisma.ruleViolation.create({
        data: {
          summary: violation.summary,
          resolved: violation.resolved,
          ruleId: pid(rule.id),
          pullRequestId: pid(pullRequest.id),
          createdAt: new Date(violation.createdAt),
        },
      })
    }
  }

  for (const event of auditEvents) {
    const repository = repositories.find(
      (item) => item.name === event.repositoryName,
    )
    const pullRequest = pullRequests.find(
      (item) =>
        item.repositoryName === event.repositoryName &&
        item.number === event.pullRequestNumber,
    )
    await prisma.auditEvent.create({
      data: {
        eventType: event.eventType,
        actor: event.actor,
        summary: event.summary,
        metadata: event.metadata,
        organizationId,
        repositoryId: repository ? pid(repository.id) : undefined,
        pullRequestId: pullRequest ? pid(pullRequest.id) : undefined,
        createdAt: new Date(event.createdAt),
      },
    })
  }

  await prisma.usageRecord.create({
    data: {
      metric: 'pr_checks',
      quantity: repositories.reduce(
        (sum, repository) => sum + repository.monthlyPrCheckUsage,
        0,
      ),
      periodStart: new Date('2026-04-01T00:00:00.000Z'),
      periodEnd: new Date('2026-04-30T23:59:59.000Z'),
      organizationId,
    },
  })

  console.log(
    `Seeded ${repositories.length} repositories and ${pullRequests.length} pull requests into org ${organizationId} (${TARGET_EMAIL}).`,
  )
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
