export type DiffLine = {
  type: 'add' | 'delete' | 'context'
  content: string
  position: number
  oldLine?: number
  newLine?: number
}

export type DiffHunk = {
  header: string
  oldStart: number
  oldLines: number
  newStart: number
  newLines: number
  lines: DiffLine[]
}

export type DiffFile = {
  path: string
  oldPath?: string
  hunks: DiffHunk[]
  additions: number
  deletions: number
  raw: string
}

export type FilteredDiff = {
  files: DiffFile[]
  skippedFiles: Array<{ path: string; reason: string }>
  totalBytes: number
}

const generatedPathPatterns = [
  '.min.js',
  '.min.css',
  '.generated.',
  '.gen.',
  'generated/',
  '__generated__/',
]

const lockfileNames = new Set([
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'bun.lockb',
  'composer.lock',
  'Gemfile.lock',
  'Cargo.lock',
  'poetry.lock',
  'Pipfile.lock',
  'go.sum',
])

const vendoredPathPatterns = [
  'vendor/',
  'vendors/',
  'third_party/',
  'third-party/',
  'node_modules/',
  'dist/',
  'build/',
]

const binaryExtensions = new Set([
  '.avif',
  '.gif',
  '.ico',
  '.jpeg',
  '.jpg',
  '.pdf',
  '.png',
  '.webp',
  '.zip',
])

function normalizeDiffPath(value: string) {
  if (value === '/dev/null') return undefined
  return value.replace(/^[ab]\//, '')
}

function parseHunkHeader(header: string) {
  const match = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(header)
  if (!match) return null

  return {
    oldStart: Number(match[1]),
    oldLines: Number(match[2] ?? 1),
    newStart: Number(match[3]),
    newLines: Number(match[4] ?? 1),
  }
}

function fileName(path: string) {
  return path.split('/').at(-1) ?? path
}

function lowerPath(path: string) {
  return path.replaceAll('\\', '/').toLowerCase()
}

export function isLikelyGeneratedPath(path: string) {
  const normalized = lowerPath(path)
  return generatedPathPatterns.some((pattern) => normalized.includes(pattern))
}

export function isLockfilePath(path: string) {
  return lockfileNames.has(fileName(path))
}

export function isVendoredPath(path: string) {
  const normalized = lowerPath(path)
  return vendoredPathPatterns.some((pattern) => normalized.includes(pattern))
}

export function isBinaryPath(path: string) {
  const normalized = lowerPath(path)
  return Array.from(binaryExtensions).some((extension) =>
    normalized.endsWith(extension),
  )
}

export function matchesIgnoredPath(path: string, ignoredPaths: string[] = []) {
  const normalizedPath = lowerPath(path)

  return ignoredPaths.some((pattern) => {
    const normalizedPattern = lowerPath(pattern.trim())
    if (!normalizedPattern) return false
    if (normalizedPattern.endsWith('/')) {
      return normalizedPath.startsWith(normalizedPattern)
    }
    if (normalizedPattern.includes('*')) {
      const expression = new RegExp(
        `^${normalizedPattern
          .split('*')
          .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
          .join('.*')}$`,
      )
      return expression.test(normalizedPath)
    }

    return normalizedPath === normalizedPattern
  })
}

export function parseUnifiedDiff(diff: string): DiffFile[] {
  const files: DiffFile[] = []
  const lines = diff.split(/\r?\n/)
  let currentFile: DiffFile | null = null
  let currentHunk: DiffHunk | null = null
  let oldLine = 0
  let newLine = 0
  let position = 0
  let rawLines: string[] = []
  let pendingOldPath: string | undefined

  function finishFile() {
    if (!currentFile) return
    currentFile.raw = rawLines.join('\n')
    files.push(currentFile)
  }

  for (const line of lines) {
    if (line.startsWith('diff --git ')) {
      finishFile()
      currentFile = null
      currentHunk = null
      rawLines = [line]
      pendingOldPath = undefined
      continue
    }

    if (!currentFile && line.startsWith('--- ')) {
      pendingOldPath = normalizeDiffPath(line.slice(4).trim())
      rawLines.push(line)
      continue
    }

    if (!currentFile && line.startsWith('+++ ')) {
      const path = normalizeDiffPath(line.slice(4).trim())
      if (path) {
        currentFile = {
          path,
          oldPath: pendingOldPath,
          hunks: [],
          additions: 0,
          deletions: 0,
          raw: '',
        }
      }
      rawLines.push(line)
      continue
    }

    if (!currentFile) {
      rawLines.push(line)
      continue
    }

    rawLines.push(line)

    if (line.startsWith('--- ')) {
      currentFile.oldPath = normalizeDiffPath(line.slice(4).trim())
      continue
    }

    if (line.startsWith('+++ ')) {
      currentFile.path =
        normalizeDiffPath(line.slice(4).trim()) ?? currentFile.path
      continue
    }

    if (line.startsWith('@@ ')) {
      const parsed = parseHunkHeader(line)
      if (!parsed) continue

      currentHunk = { header: line, ...parsed, lines: [] }
      currentFile.hunks.push(currentHunk)
      oldLine = parsed.oldStart
      newLine = parsed.newStart
      position = 0
      continue
    }

    if (!currentHunk || line.startsWith('\\ No newline at end of file')) {
      continue
    }

    if (line === '') continue

    const marker = line[0]
    const content = line.slice(1)
    position += 1

    if (marker === '+') {
      currentFile.additions += 1
      currentHunk.lines.push({
        type: 'add',
        content,
        position,
        newLine,
      })
      newLine += 1
      continue
    }

    if (marker === '-') {
      currentFile.deletions += 1
      currentHunk.lines.push({
        type: 'delete',
        content,
        position,
        oldLine,
      })
      oldLine += 1
      continue
    }

    currentHunk.lines.push({
      type: 'context',
      content,
      position,
      oldLine,
      newLine,
    })
    oldLine += 1
    newLine += 1
  }

  finishFile()
  return files
}

export function getCommentableLines(files: DiffFile[]) {
  const commentable = new Map<string, Set<number>>()

  for (const file of files) {
    const lines = new Set<number>()
    for (const hunk of file.hunks) {
      for (const line of hunk.lines) {
        if (line.type === 'add' && line.newLine) lines.add(line.newLine)
      }
    }
    commentable.set(file.path, lines)
  }

  return commentable
}

export function filterDiffFiles(
  files: DiffFile[],
  options: {
    ignoredPaths?: string[]
    maxFileBytes?: number
    maxFiles?: number
  } = {},
): FilteredDiff {
  const maxFileBytes = options.maxFileBytes ?? 80_000
  const maxFiles = options.maxFiles ?? 50
  const filtered: DiffFile[] = []
  const skippedFiles: FilteredDiff['skippedFiles'] = []

  for (const file of files) {
    let reason: string | null = null
    if (matchesIgnoredPath(file.path, options.ignoredPaths)) {
      reason = 'ignored_path'
    } else if (isLikelyGeneratedPath(file.path)) {
      reason = 'generated'
    } else if (isLockfilePath(file.path)) {
      reason = 'lockfile'
    } else if (isVendoredPath(file.path)) {
      reason = 'vendored'
    } else if (isBinaryPath(file.path)) {
      reason = 'binary'
    } else if (Buffer.byteLength(file.raw, 'utf8') > maxFileBytes) {
      reason = 'too_large'
    } else if (!getCommentableLines([file]).get(file.path)?.size) {
      reason = 'no_commentable_lines'
    }

    if (reason) {
      skippedFiles.push({ path: file.path, reason })
      continue
    }

    if (filtered.length >= maxFiles) {
      skippedFiles.push({ path: file.path, reason: 'file_limit' })
      continue
    }

    filtered.push(file)
  }

  return {
    files: filtered,
    skippedFiles,
    totalBytes: filtered.reduce(
      (sum, file) => sum + Buffer.byteLength(file.raw, 'utf8'),
      0,
    ),
  }
}
