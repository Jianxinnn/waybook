import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import { migrate } from 'drizzle-orm/better-sqlite3/migrator'

import { db } from './client'

const databasePath = resolve(
  process.cwd(),
  process.env.WAYBOOK_DB_PATH ?? './data/waybook.db',
)
mkdirSync(dirname(databasePath), { recursive: true })

migrate(db, { migrationsFolder: resolve(process.cwd(), 'drizzle') })
