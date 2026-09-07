export type ElfKnowledgeNamespace = string | {
  app?: string
  plugin?: string
  user?: string | number
  site?: string
  [key: string]: unknown
}

export type ElfSkillGovernance = {
  validateAfterSuccesses?: number
  stableAfterSuccesses?: number
  staleAfterConsecutiveFailures?: number
  disableAfterConsecutiveFailures?: number
  minDistinctContexts?: number
}

export function createSqliteSkillStore(options: {
  databasePath?: string
  path?: string
  namespace?: ElfKnowledgeNamespace
  governance?: ElfSkillGovernance
  database?: unknown
}): {
  kind: 'sqlite-elf-skill-store'
  databasePath: string
  namespace: string
  governance: Required<ElfSkillGovernance>
  find(input: Record<string, any>): Promise<Record<string, any> | null>
  findCandidates(input: Record<string, any>): Promise<Array<Record<string, any>>>
  findValidationCandidate(input: Record<string, any>): Promise<Record<string, any> | null>
  saveCandidate(input: Record<string, any>): Promise<boolean>
  recordOutcome(input: Record<string, any>): Promise<Record<string, any> | null>
  saveKnowledge(input: Record<string, any>): Promise<Record<string, any>>
  searchKnowledge(input: Record<string, any>): Promise<Array<Record<string, any>>>
  removeKnowledge(id: string): Promise<boolean>
  listKnowledge(input?: { includeDisabled?: boolean }): Array<Record<string, any>>
  browseKnowledge(input?: { query?: string; includeDisabled?: boolean; offset?: number; limit?: number }): { items: Array<Record<string, any>>; total: number; offset: number; limit: number; hasMore: boolean }
  knowledgeInfo(): { entryCount: number }
  skillInfo(): { entryCount: number; statuses: Record<string, number> }
  saveMemory(input: Record<string, any>): Promise<Record<string, any>>
  listMemories(input?: { kind?: 'chat' | 'work'; dateKey?: string; limit?: number }): Array<Record<string, any>>
  browseMemories(input?: { kind?: 'chat' | 'work'; dateKey?: string; offset?: number; limit?: number }): { items: Array<Record<string, any>>; total: number; offset: number; limit: number; hasMore: boolean }
  searchMemories(input: { query: string; kind?: 'chat' | 'work'; limit?: number }): Promise<Array<Record<string, any>>>
  saveWorkItem(input: Record<string, any>): Promise<Record<string, any>>
  listWorkItems(input?: { kind?: 'task' | 'schedule' | 'deliverable'; dateKey?: string; limit?: number }): Array<Record<string, any>>
  browseWorkItems(input?: { kind?: 'task' | 'schedule' | 'deliverable'; parentId?: string; offset?: number; limit?: number }): { items: Array<Record<string, any>>; total: number; offset: number; limit: number; hasMore: boolean }
  removeWorkItem(id: string): Promise<boolean>
  createDataTable(input: { id: string; title: string; fields: Array<{ key: string; label: string; type: 'text' | 'integer' | 'real' | 'boolean' | 'datetime' | 'json'; required?: boolean; identity?: boolean }> }): Promise<Record<string, any>>
  listDataTables(): Array<Record<string, any>>
  upsertDataRows(tableId: string, rows: Array<Record<string, any>>): Promise<{ tableId: string; changed: number }>
  queryDataTable(tableId: string, input?: { offset?: number; limit?: number }): { table: Record<string, any>; rows: Array<Record<string, any>>; total: number; offset: number; limit: number; hasMore: boolean }
  saveUiState(key: string, value: unknown): Promise<unknown>
  getUiState(key: string): unknown
  list(input?: { status?: string }): Array<Record<string, any>>
  outcomes(input?: { limit?: number }): Array<Record<string, any>>
  close(): void
}

export const sqliteSkillSearch: Readonly<{
  normalizeText(value: unknown): string
  searchTokens(value: unknown): string[]
  localVector(value: unknown, dimensions?: number): number[]
  cosine(left: number[], right: number[]): number
  lexicalScore(left: unknown, right: unknown): number
}>
