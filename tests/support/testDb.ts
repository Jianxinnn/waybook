import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import Database from 'better-sqlite3'
import { vi } from 'vitest'

export interface TestDatabaseContext {
  dbPath: string
  exec(sql: string): void
  query<T = Record<string, unknown>>(sql: string): T[]
}

export async function withTestDatabase<T>(
  callback: (context: TestDatabaseContext) => Promise<T>,
): Promise<T> {
  const previousDbPath = process.env.WAYBOOK_DB_PATH
  const tempRoot = await mkdtemp(path.join(tmpdir(), 'waybook-db-'))
  const dbPath = path.join(tempRoot, 'waybook.db')
  const migrationSql = await readFile(
    new URL('../../drizzle/0000_futuristic_miek.sql', import.meta.url),
    'utf8',
  )

  const connection = new Database(dbPath)
  connection.exec(migrationSql)
  connection.close()

  process.env.WAYBOOK_DB_PATH = dbPath
  vi.resetModules()

  try {
    return await callback({
      dbPath,
      exec(sql: string) {
        const db = new Database(dbPath)

        try {
          db.exec(sql)
        } finally {
          db.close()
        }
      },
      query<T = Record<string, unknown>>(sql: string) {
        const db = new Database(dbPath)

        try {
          return db.prepare(sql).all() as T[]
        } finally {
          db.close()
        }
      },
    })
  } finally {
    if (previousDbPath === undefined) {
      delete process.env.WAYBOOK_DB_PATH
    } else {
      process.env.WAYBOOK_DB_PATH = previousDbPath
    }

    vi.resetModules()
    await rm(tempRoot, { recursive: true, force: true })
  }
}
