import { z } from 'zod'

const envSchema = z.object({
  WAYBOOK_DB_PATH: z.string().default('./data/waybook.db'),
  WAYBOOK_OBSIDIAN_PATH: z.string().default('./exports/obsidian'),
  CLAUDE_MEM_BASE_URL: z.string().default('http://localhost:37777'),
})

export type WaybookConfig = z.infer<typeof envSchema>

export function getConfig(env: NodeJS.ProcessEnv = process.env): WaybookConfig {
  return envSchema.parse(env)
}

export const config = getConfig()
