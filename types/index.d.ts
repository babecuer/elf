export type GenieTask = {
  mode?: 'chat' | 'browser' | 'data' | 'extension'
  capabilityId?: string
  intent: string
  variables?: Record<string, unknown>
  risk?: string
  reply?: string
  publicMessage?: string
  [key: string]: unknown
}

export type ElfCapability = {
  id: string
  mode: 'conversation' | 'browser' | 'knowledge' | 'memory' | 'skill-learning' | 'data' | 'extension'
  description: string
  maxRisk?: 'low' | 'medium' | 'high' | 'critical'
}

export type ElfProfile = {
  name: string
  role: string
  capabilities: ElfCapability[]
}

export type ElfAppearance = {
  /** Optional display-name override registered by the trusted host. */
  name?: string
  /** A single primary color is sufficient; ELF derives a light companion color when omitted. */
  themeColor?: string
  lightColor?: string
  theme?: { accentColor?: string; lightColor?: string }
}

export type ElfLoginEntryPage = {
  /** Human-readable label used when ELF retrieves the registered login route. */
  title?: string
  /** Trusted HTTPS login route registered by the host. */
  url: string
}

export type GenieValidation = {
  success: boolean
  allowExploration?: boolean
  reply?: string
  [key: string]: unknown
}

export type GenieRuntimeOptions = {
  intentResolver: { resolve(input: Record<string, unknown>): Promise<GenieTask | null> | GenieTask | null }
  skillStore: {
    find(input: Record<string, unknown>): Promise<Record<string, unknown> | null> | Record<string, unknown> | null
    findCandidates?(input: Record<string, unknown>): Promise<Array<Record<string, unknown>>> | Array<Record<string, unknown>>
    findValidationCandidate?(input: Record<string, unknown>): Promise<Record<string, unknown> | null> | Record<string, unknown> | null
    recordOutcome?(input: Record<string, unknown>): Promise<void> | void
    saveCandidate?(input: Record<string, unknown>): Promise<void> | void
  }
  executor: { execute(input: Record<string, unknown>): Promise<unknown> | unknown }
  validator: { validate(input: Record<string, unknown>): Promise<boolean | GenieValidation> | boolean | GenieValidation }
  explorer: { explore(input: Record<string, unknown>): Promise<unknown> | unknown }
  collector?: { collect(input: Record<string, unknown>): Promise<unknown> | unknown }
  extensionRunner?: { run(input: Record<string, unknown>): Promise<unknown> | unknown }
  compiler?: { compile(input: Record<string, unknown>): Promise<Record<string, unknown> | null> | Record<string, unknown> | null }
  skillSelector?: { select(input: Record<string, unknown>): Promise<Record<string, unknown> | null> | Record<string, unknown> | null }
  onEvent?: (event: Record<string, unknown>) => void
}

export type ElfPolicy = {
  allowedOrigins: string[] | ((context: Record<string, unknown>) => string[])
  maxSteps?: number
  maxToolCalls?: number
  taskTimeoutMs?: number
  confirmationRisks?: Array<'low' | 'medium' | 'high' | 'critical'>
  authorizeTask?(input: Record<string, unknown>): Promise<boolean | void> | boolean | void
  beforeAction?(input: Record<string, unknown>): Promise<boolean | void> | boolean | void
  validateResult?(input: Record<string, unknown>): Promise<boolean | GenieValidation | void> | boolean | GenieValidation | void
  allowSkillPersistence?(input: Record<string, unknown>): Promise<boolean | void> | boolean | void
  transformCandidate?(input: Record<string, unknown>): Promise<Record<string, unknown> | null | void> | Record<string, unknown> | null | void
  authorizeKnowledge?(input: Record<string, unknown>): Promise<boolean | void> | boolean | void
  authorizePlugin?(input: ElfPluginRunRequest): Promise<boolean | void> | boolean | void
}

export type ElfPluginKind = 'pet-script' | 'capability'

export type ElfPluginInfo = {
  id: string
  kind: ElfPluginKind
  title: string
  description: string
  capabilityId?: string
  version: string
  enabled: boolean
  pet?: {
    title: string
    detail: string
    sessionMode: 'share-genie' | 'isolated'
  }
}

export type ElfPluginRunRequest = {
  plugin: ElfPluginInfo
  input: unknown
  context: Record<string, unknown>
  signal?: AbortSignal
  source: 'host' | 'agent'
  pet?: Record<string, unknown>
}

export type ElfPlugin = {
  id: string
  kind: ElfPluginKind
  title: string
  description: string
  capabilityId?: string
  version?: string
  enabled?: boolean
  pet?: {
    title?: string
    detail?: string
    sessionMode?: 'share-genie' | 'isolated'
  }
  run(input: ElfPluginRunRequest): Promise<unknown> | unknown
  dispose?(): Promise<void> | void
}

export type ElfPetHost = {
  run(input: ElfPluginRunRequest & {
    execute(pet?: Record<string, unknown>): Promise<unknown>
  }): Promise<unknown>
}

export type ElfManualKnowledge = {
  id?: string
  kind?: 'fact' | 'procedure' | 'rule' | 'glossary'
  content: string
  origins?: string[]
  pageTypes?: string[]
  intents?: string[]
  tags?: string[]
  priority?: number
  alwaysApply?: boolean
  enabled?: boolean
}

export type ElfHostKnowledge = {
  id: string
  kind?: 'page-family' | 'navigation-node' | 'fact' | 'procedure' | 'rule' | 'glossary' | 'reference' | 'skill' | 'site-map'
  title?: string
  content: string
  url?: string
  origins?: string[]
  pageTypes?: string[]
  intents?: string[]
  tags?: string[]
  keywords?: string[]
  aliases?: string[]
  priority?: number
  alwaysApply?: boolean
  enabled?: boolean
}

export type ElfHostKnowledgeSource =
  | ReadonlyArray<ElfHostKnowledge>
  | { entries: ReadonlyArray<ElfHostKnowledge> }
  | { search(input: { query: string; context: Record<string, unknown>; task: Record<string, unknown>; signal?: AbortSignal; limit: number }): Promise<ReadonlyArray<ElfHostKnowledge>> | ReadonlyArray<ElfHostKnowledge>; close?(): Promise<void> | void }
  | ((input: { query: string; context: Record<string, unknown>; task: Record<string, unknown>; signal?: AbortSignal; limit: number }) => Promise<ReadonlyArray<ElfHostKnowledge>> | ReadonlyArray<ElfHostKnowledge>)

export type ElfKnowledgeSourceOwner = 'host' | 'human' | 'elf'
export type ElfKnowledgeSourceCategory = 'site-map' | 'business' | 'reference' | 'policy' | 'manual' | 'page-learning' | 'skill-learning' | 'other'

export type ElfKnowledgeSource = {
  id: string
  name: string
  owner: ElfKnowledgeSourceOwner
  category: ElfKnowledgeSourceCategory
  authority?: number
  readonly?: boolean
  version?: string
  entryCount?: number
  provider: ElfHostKnowledgeSource
}

export type ElfKnowledgeSourceInfo = Omit<ElfKnowledgeSource, 'provider'> & {
  statuses?: Record<string, number>
}

export type ElfHostScenario = {
  id: string
  title: string
  description?: string
  origins?: ReadonlyArray<string>
  pageTypes?: ReadonlyArray<string>
  instructions?: ReadonlyArray<string>
}

export type ElfHostContext = {
  businessDescription?: string
  scenarios?: ReadonlyArray<ElfHostScenario>
  specialInstructions?: ReadonlyArray<string>
}

export type ElfHostRuleStage = 'planning' | 'execution' | 'validation' | 'response'

export type ElfHostRule = {
  /**
   * Stable host-owned identifier used for review, tests and diagnostics.
   * Adding a host rule requires the user's consent; ordinary business knowledge
   * should remain in a knowledge source.
   */
  id: string
  /** Omit to apply the rule in all four model-facing stages. */
  stages?: ReadonlyArray<ElfHostRuleStage>
  /** Optional trusted page scope. */
  origins?: ReadonlyArray<string>
  pageTypes?: ReadonlyArray<string>
  /** Host-specific behavioral constraint; it cannot grant capabilities or bypass policy. */
  rule: string
}

export type ElfMemory = {
  id?: string
  kind: 'chat' | 'work'
  role?: 'user' | 'assistant' | 'system'
  content: string
  summary?: string
  dateKey?: string
  metadata?: Record<string, unknown>
}

export type ElfBrowser = {
  observe(input: Record<string, unknown>): Promise<unknown>
  act(input: Record<string, unknown>): Promise<unknown>
  extract(input: Record<string, unknown>): Promise<unknown>
  navigate?(input: Record<string, unknown> & { url: string }): Promise<unknown>
  summaryInstruction?(instruction: string): string
  close?(): Promise<void>
  ui?: ElfUiSurface
}

export type ElfUiSurface = {
  evaluate?(script: string): Promise<unknown> | unknown
  handleEvent?(event: Record<string, unknown>): Promise<void> | void
  mount?(input?: Record<string, unknown>): Promise<void> | void
  setState?(state: string, label?: string): Promise<unknown> | unknown
  pointAt?(selectors?: string[]): Promise<unknown> | unknown
  close?(): Promise<void> | void
  accentColor?: string
  lightColor?: string
  idleLabel?: string
  quickPrompts?: ReadonlyArray<string | { label: string; text: string }>
}

export type ElfOptions = {
  model: BrowserGenieModel | (() => BrowserGenieModel) | { generate(params: any): Promise<any> }
  agentHarness?: {
    run(input: {
      systemPrompt: string
      prompt: string
      sessionId?: string
      signal?: AbortSignal
      executeTool(name: string, input?: Record<string, unknown>): Promise<unknown>
      onDelta?(delta: string, detail?: { streamId?: string; turn?: number; step?: number; index?: number }): void
    }): Promise<{ finalResponse?: string; text?: string; events?: unknown[] }>
    close?(): Promise<void> | void
  }
  profile: ElfProfile
  hostContext?: ElfHostContext
  hostRules?: ReadonlyArray<ElfHostRule>
  appearance?: ElfAppearance
  loginEntryPage?: string | ElfLoginEntryPage
  browser: ElfBrowser | (Record<string, unknown> & { cdpPort: number })
  storage?: GenieRuntimeOptions['skillStore']
  knowledgeSources?: ReadonlyArray<ElfKnowledgeSource>
  /** @deprecated Use knowledgeSources for named and governed multi-source knowledge. */
  hostKnowledge?: ElfHostKnowledgeSource
  policy: ElfPolicy
  plugins?: ReadonlyArray<ElfPlugin>
  petHost?: ElfPetHost
  ui?: false | ElfUiSurface | { renderer: ElfUiSurface }
  adapters?: Partial<Omit<GenieRuntimeOptions, 'onEvent'>>
  messages?: Record<string, unknown>
  onEvent?: (event: Record<string, unknown>) => void
}

export type ElfDataField = { key: string; label: string; type: 'text' | 'integer' | 'real' | 'boolean' | 'datetime' | 'json'; required?: boolean; identity?: boolean }
export type ElfDataTable = { id: string; title: string; fields: ElfDataField[]; rowCount: number; createdAt?: string; updatedAt?: string }
export type ElfDataPage = { table: ElfDataTable | null; rows: Array<Record<string, unknown>>; total: number; offset: number; limit: number; hasMore: boolean }

export function createElf(options: ElfOptions): {
  run(text: string, context?: Record<string, unknown>, options?: { signal?: AbortSignal; fallbackOnSkillError?: boolean; confirmed?: boolean; onEvent?: (event: Record<string, unknown>) => void }): Promise<Record<string, unknown>>
  browser: ElfBrowser
  profile: ElfProfile
  hostContext: { businessDescription: string; scenarios: Array<{ id: string; title: string; description: string; origins: string[]; pageTypes: string[]; instructions: string[] }>; specialInstructions: string[] }
  appearance: { name: string; theme: { accentColor: string; lightColor: string } }
  loginEntryPage: { title: string; url: string } | null
  storage: GenieRuntimeOptions['skillStore']
  ui: ElfUiSurface | null
  knowledgeSources: ElfKnowledgeSourceInfo[]
  registerPlugin(plugin: ElfPlugin, options?: { replace?: boolean }): ElfPluginInfo
  unregisterPlugin(id: string): Promise<boolean>
  listPlugins(options?: { kind?: ElfPluginKind }): ElfPluginInfo[]
  invokePlugin(id: string, input?: unknown, context?: Record<string, unknown>, options?: { signal?: AbortSignal }): Promise<unknown>
  teach(input: string | ElfManualKnowledge, context?: Record<string, unknown>): Promise<Record<string, unknown>>
  searchKnowledge(query: string, context?: Record<string, unknown>, options?: { limit?: number }): Promise<Array<Record<string, unknown> & { source?: 'host' | 'human' | 'elf' | 'manual'; sourceId?: string; sourceName?: string; sourceOwner?: ElfKnowledgeSourceOwner; sourceCategory?: ElfKnowledgeSourceCategory; sourceAuthority?: number; readonly?: boolean }>>
  listKnowledgeSources(): ElfKnowledgeSourceInfo[]
  browseKnowledgeSource(sourceId: string, options?: { query?: string; offset?: number; limit?: number; includeDisabled?: boolean }): Promise<{ sourceId: string; query: string; items: Array<Record<string, unknown>>; total: number; offset: number; limit: number; hasMore: boolean }>
  listKnowledge(options?: { includeDisabled?: boolean }): Array<Record<string, unknown>>
  removeKnowledge(id: string): Promise<boolean>
  remember(input: ElfMemory): Promise<Record<string, unknown>>
  listMemories(options?: { kind?: 'chat' | 'work'; dateKey?: string; limit?: number }): Array<Record<string, unknown>>
  browseMemories(options?: { kind?: 'chat' | 'work'; dateKey?: string; offset?: number; limit?: number }): { items: Array<Record<string, unknown>>; total: number; offset: number; limit: number; hasMore: boolean }
  searchMemories(query: string, options?: { kind?: 'chat' | 'work'; limit?: number }): Promise<Array<Record<string, unknown>>>
  saveAnalyzedTask(input: { id?: string; content: string; currentDate?: string; timeZone?: string; signal?: AbortSignal }): Promise<{ task: Record<string, unknown>; subtasks: Array<Record<string, unknown>>; removed: number; retained: number; unchanged: boolean }>
  saveWorkItem(input: { id?: string; kind: 'task' | 'schedule' | 'deliverable'; title: string; content?: string; status?: string; dateKey?: string; metadata?: Record<string, unknown> }): Promise<Record<string, unknown>>
  listWorkItems(options?: { kind?: 'task' | 'schedule' | 'deliverable'; dateKey?: string; limit?: number }): Array<Record<string, unknown>>
  browseWorkItems(options?: { kind?: 'task' | 'schedule' | 'deliverable'; parentId?: string; offset?: number; limit?: number }): { items: Array<Record<string, unknown>>; total: number; offset: number; limit: number; hasMore: boolean }
  removeWorkItem(id: string): Promise<boolean>
  designDataTable(input: { purpose: string; id?: string; title?: string; sampleRows?: Array<Record<string, unknown>>; signal?: AbortSignal }): Promise<ElfDataTable>
  collectData(input: { purpose: string; id?: string; title?: string; sampleRows?: Array<Record<string, unknown>>; maxRows?: number; signal?: AbortSignal }, context: { currentUrl: string; allowedOrigins?: string[]; allowedResourceDomains?: string[]; extensionId?: string; targetId?: string }): Promise<{ table: ElfDataTable; changed: number; extracted: number }>
  createDataTable(input: { id: string; title: string; fields: ElfDataField[] }): Promise<ElfDataTable>
  listDataTables(): ElfDataTable[]
  upsertDataRows(tableId: string, rows: Array<Record<string, unknown>>): Promise<{ tableId: string; changed: number }>
  queryDataTable(tableId: string, options?: { offset?: number; limit?: number }): ElfDataPage
  saveUiState(key: string, value: unknown): Promise<unknown>
  getUiState(key: string): unknown
  close(): Promise<void>
}

export function createGenieRuntime(options: GenieRuntimeOptions): {
  run(text: string, context?: Record<string, unknown>, options?: { signal?: AbortSignal; fallbackOnSkillError?: boolean; onEvent?: (event: Record<string, unknown>) => void }): Promise<Record<string, unknown>>
}

export function createElfPluginRegistry(options?: {
  profile?: ElfProfile
  plugins?: ReadonlyArray<ElfPlugin>
  authorize?(input: ElfPluginRunRequest): Promise<boolean | void> | boolean | void
  runPet?: ElfPetHost['run']
  onEvent?(event: Record<string, unknown>): void
}): {
  register(plugin: ElfPlugin, options?: { replace?: boolean }): ElfPluginInfo
  unregister(id: string): Promise<boolean>
  list(options?: { kind?: ElfPluginKind }): ElfPluginInfo[]
  hasCapability(capabilityId: string): boolean
  matchesCapability(query: string): boolean
  invokeCapability(capabilityId: string, options?: { input?: unknown; context?: Record<string, unknown>; signal?: AbortSignal; source?: 'host' | 'agent' }): Promise<unknown>
  invoke(id: string, options?: { input?: unknown; context?: Record<string, unknown>; signal?: AbortSignal; source?: 'host' | 'agent' }): Promise<unknown>
  close(): Promise<void>
}

export function createInMemorySkillStore(initialSkills?: Array<Record<string, unknown>>): {
  find(input: Record<string, unknown>): Promise<Record<string, unknown> | null>
  findCandidates(input: Record<string, unknown>): Promise<Array<Record<string, unknown>>>
  findValidationCandidate(input: Record<string, unknown>): Promise<Record<string, unknown> | null>
  saveCandidate(input: Record<string, unknown>): Promise<void>
  recordOutcome(input: Record<string, unknown>): Promise<void>
  list(): Array<Record<string, unknown>>
  outcomes(): Array<Record<string, unknown>>
  saveKnowledge(input: ElfManualKnowledge & { id: string }): Promise<Record<string, unknown>>
  searchKnowledge(input: Record<string, unknown>): Promise<Array<Record<string, unknown>>>
  listKnowledge(): Array<Record<string, unknown>>
  browseKnowledge(input?: { query?: string; includeDisabled?: boolean; offset?: number; limit?: number }): { items: Array<Record<string, unknown>>; total: number; offset: number; limit: number; hasMore: boolean }
  knowledgeInfo(): { entryCount: number }
  skillInfo(): { entryCount: number; statuses: Record<string, number> }
  removeKnowledge(id: string): Promise<boolean>
  saveMemory(input: ElfMemory & { id: string }): Promise<Record<string, unknown>>
  listMemories(options?: { kind?: 'chat' | 'work'; dateKey?: string; limit?: number }): Array<Record<string, unknown>>
  browseMemories(options?: { kind?: 'chat' | 'work'; dateKey?: string; offset?: number; limit?: number }): { items: Array<Record<string, unknown>>; total: number; offset: number; limit: number; hasMore: boolean }
  searchMemories(input: { query: string; kind?: 'chat' | 'work'; limit?: number }): Promise<Array<Record<string, unknown>>>
  saveWorkItem(input: Record<string, unknown>): Promise<Record<string, unknown>>
  listWorkItems(options?: { kind?: 'task' | 'schedule' | 'deliverable'; dateKey?: string; limit?: number }): Array<Record<string, unknown>>
  browseWorkItems(options?: { kind?: 'task' | 'schedule' | 'deliverable'; parentId?: string; offset?: number; limit?: number }): { items: Array<Record<string, unknown>>; total: number; offset: number; limit: number; hasMore: boolean }
  removeWorkItem(id: string): Promise<boolean>
  createDataTable(input: { id: string; title: string; fields: ElfDataField[] }): Promise<ElfDataTable>
  listDataTables(): ElfDataTable[]
  upsertDataRows(tableId: string, rows: Array<Record<string, unknown>>): Promise<{ tableId: string; changed: number }>
  queryDataTable(tableId: string, options?: { offset?: number; limit?: number }): ElfDataPage
  saveUiState(key: string, value: unknown): Promise<unknown>
  getUiState(key: string): unknown
}

export {
  compactAccessibilityTree,
  compactStagehandGeneratorParams,
  createConfiguredGenerator,
  createStagehandWebAgentHost,
  createViewportSemanticGenerator,
  VIEWPORT_SEMANTIC_SNAPSHOT_DEFAULTS,
} from './stagehand.js'

import type { BrowserGenieModel } from './stagehand.js'
