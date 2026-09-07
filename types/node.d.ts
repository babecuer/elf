import type { ElfOptions } from './index.d.ts'
import type { ElfKnowledgeNamespace, ElfSkillGovernance } from './storage-sqlite.d.ts'

export type NodeElfOptions = Omit<ElfOptions, 'storage'> & {
  storage?: ElfOptions['storage']
  knowledge?: {
    directory?: string
    databasePath?: string
    namespace?: ElfKnowledgeNamespace
    governance?: ElfSkillGovernance
  }
}

export function createNodeElf(options: NodeElfOptions): ReturnType<typeof import('./index.d.ts')['createElf']>
export { createSqliteSkillStore, sqliteSkillSearch } from './storage-sqlite.d.ts'
export { buildSqliteWikiBundle, openSqliteWikiBundle, createSqliteWikiBundle, SQLITE_WIKI_SCHEMA_VERSION } from './wiki-sqlite.d.ts'
