import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    '**/.next/**',
    'out/**',
    '**/out/**',
    'build/**',
    '**/build/**',
    'next-env.d.ts',
    // Local agent worktrees and generated code should not be lint inputs.
    '.claude/**',
    '**/.claude/**',
    'lib/generated/**',
    'coverage/**',
    '.turbo/**',
  ]),
])

export default eslintConfig
