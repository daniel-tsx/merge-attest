/**
 * Pure cursor-pagination helpers for the admin list pages.
 *
 * Relay-style bidirectional paging over a newest-first (createdAt desc, id desc)
 * ordering. `after` walks toward older rows; `before` walks toward newer rows.
 * Kept free of Prisma so the boundary logic is unit-tested in isolation.
 */
export const ADMIN_PAGE_SIZE = 25

export type CursorInput = { after: string | null; before: string | null }

export type CursorQuery = {
  backward: boolean
  take: number
  cursor?: { id: string }
  skip: number
}

export type CursorPage<T> = {
  rows: T[]
  nextCursor: string | null
  prevCursor: string | null
}

/** Translate a cursor request into Prisma findMany arguments (fetches size + 1). */
export function cursorQuery(
  input: CursorInput,
  size = ADMIN_PAGE_SIZE,
): CursorQuery {
  if (input.before) {
    return {
      backward: true,
      take: size + 1,
      cursor: { id: input.before },
      skip: 1,
    }
  }
  if (input.after) {
    return {
      backward: false,
      take: size + 1,
      cursor: { id: input.after },
      skip: 1,
    }
  }
  return { backward: false, take: size + 1, skip: 0 }
}

/**
 * Trim the size + 1 fetch into a page and derive the next/prev cursors. For a
 * `before` request the fetch is ascending and is reversed back to descending.
 */
export function cursorResult<T extends { id: string }>(
  fetched: T[],
  input: CursorInput,
  size = ADMIN_PAGE_SIZE,
): CursorPage<T> {
  const hasExtra = fetched.length > size

  if (input.before) {
    const rows = fetched.slice(0, size).reverse()
    return {
      rows,
      // Arrived here from a forward page, so older rows (next) still exist.
      nextCursor: rows.length ? rows[rows.length - 1].id : null,
      prevCursor: hasExtra && rows.length ? rows[0].id : null,
    }
  }

  const rows = fetched.slice(0, size)
  return {
    rows,
    nextCursor: hasExtra && rows.length ? rows[rows.length - 1].id : null,
    prevCursor: input.after && rows.length ? rows[0].id : null,
  }
}
