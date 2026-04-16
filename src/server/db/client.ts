import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'

import { schema } from './schema'

const databasePath = resolve(
  process.cwd(),
  process.env.WAYBOOK_DB_PATH ?? './data/waybook.db',
)
mkdirSync(dirname(databasePath), { recursive: true })

const connection = new Database(databasePath)

export const db = drizzle({ client: connection, schema })
export { schema }
