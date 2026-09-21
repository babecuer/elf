import type { ElfHostKnowledge } from './index.d.ts'

export type ElfWikiRelation = {
  type: string
  target: string
}

export type ElfWikiEntry = ElfHostKnowledge & {
  kind?: ElfHostKnowledge['kind'] | 'page-family' | 'navigation-node' | 'skill'
  summary?: string
  aliases?: string[]
  relations?: ElfWikiRelation[]
  metadata?: Record<string, unknown>
  status?: 'draft' | 'verified' | 'published' | 'deprecated'
  sourceType?: string
  sourceRef?: string
  confidence?: number
  revision?: number
}

export type SqliteWikiManifest = {
  databasePath: string
  bundleId: string
  schemaVersion: number
  knowledgeVersion: string
  entryCount: number
  sourceHash: string
  generatedAt?: string
  reused?: boolean
}

export type SqliteWikiProvider = {
  manifest: SqliteWikiManifest
  search(input?: { query?: string; context?: Record<string, unknown>; task?: Record<string, unknown>; limit?: number }): ElfHostKnowledge[]
  list(input?: { includeDisabled?: boolean; limit?: number }): ElfHostKnowledge[]
  browse(input?: { query?: string; includeDisabled?: boolean; offset?: number; limit?: number }): { items: ElfHostKnowledge[]; total: number; offset: number; limit: number; hasMore: boolean }
  close(): void
}

export function buildSqliteWikiBundle(options: {
  databasePath: string
  bundleId?: string
  namespace?: string
  knowledgeVersion?: string
  version?: string
  entries: ReadonlyArray<ElfWikiEntry>
}): SqliteWikiManifest

export function openSqliteWikiBundle(options: { databasePath: string }): SqliteWikiProvider
export function createSqliteWikiBundle(options: Parameters<typeof buildSqliteWikiBundle>[0]): SqliteWikiProvider
export const SQLITE_WIKI_SCHEMA_VERSION: number
