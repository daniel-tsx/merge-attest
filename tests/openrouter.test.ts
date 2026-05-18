import { describe, expect, it, vi } from 'vitest'
import {
  decryptProviderKey,
  encryptProviderKey,
  redactSecret,
} from '../lib/ai/credentials'
import {
  MAX_OPENROUTER_KEY_LENGTH,
  normalizeOpenRouterKey,
  verifyOpenRouterKey,
} from '../lib/ai/openrouter'

describe('AI provider credentials', () => {
  it('encrypts and decrypts provider keys without preserving plaintext', () => {
    const env = { BETTER_AUTH_SECRET: 'test-secret' }
    const encrypted = encryptProviderKey('sk-or-v1-secret', env)

    expect(encrypted).not.toContain('sk-or-v1-secret')
    expect(decryptProviderKey(encrypted, env)).toBe('sk-or-v1-secret')
  })

  it('redacts short and long secrets', () => {
    expect(redactSecret('short')).toBe('********')
    expect(redactSecret('sk-or-v1-abcdef123456')).toBe('sk-or-...3456')
  })
})

describe('OpenRouter verification', () => {
  it('rejects empty keys without calling OpenRouter', async () => {
    const fetchImpl = vi.fn()

    await expect(
      verifyOpenRouterKey('', fetchImpl as never),
    ).resolves.toEqual({
      valid: false,
      modelCount: 0,
      message: 'OpenRouter API key is required.',
    })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('normalizes keys and rejects oversized keys without calling OpenRouter', async () => {
    const fetchImpl = vi.fn()
    expect(normalizeOpenRouterKey('  sk-or-v1-test  ')).toBe('sk-or-v1-test')

    await expect(
      verifyOpenRouterKey('x'.repeat(MAX_OPENROUTER_KEY_LENGTH + 1), fetchImpl as never),
    ).resolves.toEqual({
      valid: false,
      modelCount: 0,
      message: 'OpenRouter API key is too long.',
    })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('returns invalid when OpenRouter rejects the key', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 401 }))

    await expect(
      verifyOpenRouterKey('bad-key', fetchImpl as never),
    ).resolves.toEqual({
      valid: false,
      modelCount: 0,
      message: 'OpenRouter rejected this API key.',
    })
  })

  it('verifies valid keys and counts user-visible models', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          data: {
            label: 'sk-or-v1-test',
            limit_remaining: 10,
            is_free_tier: false,
          },
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          data: [{ id: 'openai/gpt-5.2' }, { id: 'anthropic/claude' }],
        }),
      )

    await expect(
      verifyOpenRouterKey('sk-or-v1-test', fetchImpl as never),
    ).resolves.toEqual({
      valid: true,
      modelCount: 2,
      message: 'OpenRouter key verified with access to 2 models.',
    })
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/key',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer sk-or-v1-test',
        }),
      }),
    )
  })
})
