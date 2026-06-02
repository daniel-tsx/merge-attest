import { describe, expect, it } from 'vitest'
import { cursorQuery, cursorResult } from '../lib/admin/pagination'

const SIZE = 2

function rows(...ids: string[]) {
  return ids.map((id) => ({ id }))
}

describe('cursorQuery', () => {
  it('fetches the first page with no cursor', () => {
    expect(cursorQuery({ after: null, before: null }, SIZE)).toEqual({
      backward: false,
      take: SIZE + 1,
      skip: 0,
    })
  })

  it('skips past the cursor when paging forward', () => {
    expect(cursorQuery({ after: 'a', before: null }, SIZE)).toEqual({
      backward: false,
      take: SIZE + 1,
      cursor: { id: 'a' },
      skip: 1,
    })
  })

  it('queries backward (ascending) for a before cursor', () => {
    expect(cursorQuery({ after: null, before: 'b' }, SIZE)).toEqual({
      backward: true,
      take: SIZE + 1,
      cursor: { id: 'b' },
      skip: 1,
    })
  })
})

describe('cursorResult', () => {
  it('first page: next when an extra row exists, no prev', () => {
    const page = cursorResult(
      rows('10', '9', '8'),
      { after: null, before: null },
      SIZE,
    )
    expect(page.rows.map((r) => r.id)).toEqual(['10', '9'])
    expect(page.nextCursor).toBe('9')
    expect(page.prevCursor).toBeNull()
  })

  it('first page: no next when the page is not full', () => {
    const page = cursorResult(
      rows('10', '9'),
      { after: null, before: null },
      SIZE,
    )
    expect(page.nextCursor).toBeNull()
    expect(page.prevCursor).toBeNull()
  })

  it('forward page: exposes both prev and next cursors', () => {
    const page = cursorResult(
      rows('8', '7', '6'),
      { after: '9', before: null },
      SIZE,
    )
    expect(page.rows.map((r) => r.id)).toEqual(['8', '7'])
    expect(page.nextCursor).toBe('7')
    expect(page.prevCursor).toBe('8')
  })

  it('backward page: reverses to descending and sets next', () => {
    // ascending fetch of rows newer than the cursor
    const page = cursorResult(
      rows('9', '10'),
      { after: null, before: '8' },
      SIZE,
    )
    expect(page.rows.map((r) => r.id)).toEqual(['10', '9'])
    expect(page.nextCursor).toBe('9')
    expect(page.prevCursor).toBeNull()
  })

  it('backward page: prev cursor when even-newer rows exist', () => {
    const page = cursorResult(
      rows('7', '8', '9'),
      { after: null, before: '6' },
      SIZE,
    )
    expect(page.rows.map((r) => r.id)).toEqual(['8', '7'])
    expect(page.nextCursor).toBe('7')
    expect(page.prevCursor).toBe('8')
  })
})
