import { PrismaClient } from '../lib/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import {
  auditEvents,
  organization,
  pullRequests,
  repositories,
  repoRules,
  users,
} from '../lib/demo-data'
import { plans } from '../lib/plans'

const adapter = new PrismaPg({
  connectionString:
    process.env.DATABASE_URL ??
    'postgresql://postgres:postgres@localhost:5432/auteur',
})
const prisma = new PrismaClient({ adapter })

async function main() {
  await prisma.auditEvent.deleteMany()
  await prisma.agentActivity.deleteMany()
  await prisma.approval.deleteMany()
  await prisma.ruleViolation.deleteMany()
  await prisma.repoRule.deleteMany()
  await prisma.testGapSuggestion.deleteMany()
  await prisma.testGapAnalysis.deleteMany()
  await prisma.riskSignal.deleteMany()
  await prisma.pullRequestFile.deleteMany()
  await prisma.pullRequest.deleteMany()
  await prisma.repository.deleteMany()
  await prisma.organizationMember.deleteMany()
  await prisma.usageRecord.deleteMany()
  await prisma.apiKey.deleteMany()
  await prisma.gitHubWebhookDelivery.deleteMany()
  await prisma.plan.deleteMany()
  await prisma.verification.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.organization.deleteMany()
  await prisma.user.deleteMany()

  const org = await prisma.organization.create({
    data: {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      planKey: organization.planKey,
      githubInstallationId: 'demo-installation-001',
    },
  })

  for (const plan of plans) {
    await prisma.plan.create({
      data: {
        key: plan.key,
        name: plan.name,
        priceMonthly: Number.parseInt(
          plan.priceMonthly.replace(/\D/g, '') || '0',
          10,
        ),
        repositoryLimit: plan.repositoryLimit,
        prCheckLimit: plan.prCheckLimit,
        auditRetentionDays: Number.parseInt(plan.auditRetention, 10) || null,
        features: plan.features,
        organizationId: org.id,
      },
    })
  }

  for (const user of users) {
    await prisma.user.create({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        memberships: {
          create: {
            organizationId: org.id,
            role: user.role as 'owner' | 'admin' | 'member' | 'viewer',
          },
        },
      },
    })
  }

  for (const repository of repositories) {
    await prisma.repository.create({
      data: {
        id: repository.id,
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
        organizationId: org.id,
      },
    })
  }

  for (const rule of repoRules) {
    await prisma.repoRule.create({
      data: {
        id: rule.id,
        name: rule.name,
        description: rule.description,
        enabled: rule.enabled,
        triggerType: rule.triggerType,
        actionType: rule.actionType,
        severity: rule.severity,
        repositoryId: rule.repositoryId,
        organizationId: org.id,
      },
    })
  }

  for (const pullRequest of pullRequests) {
    await prisma.pullRequest.create({
      data: {
        id: pullRequest.id,
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
        repositoryId: pullRequest.repositoryId,
        organizationId: org.id,
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
            reviewerId: users[0].id,
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
          ruleId: rule.id,
          pullRequestId: pullRequest.id,
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
        organizationId: org.id,
        repositoryId: repository?.id,
        pullRequestId: pullRequest?.id,
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
      organizationId: org.id,
    },
  })
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
