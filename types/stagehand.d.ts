export type BrowserGenieModel = { baseUrl: string; apiKey: string; model: string }
export type ViewportSemanticSnapshotOptions = {
  maxChars?: number
  maxTableRows?: number
  maxValueChars?: number
  onCompact?: (metrics: { beforeChars: number; afterChars: number; savedChars: number }) => void
}
export type BrowserGenieViewportInfo = {
  width: number
  height: number
  scrollX: number
  scrollY: number
  documentWidth: number
  documentHeight: number
  canScrollUp: boolean
  canScrollDown: boolean
  canScrollLeft: boolean
  canScrollRight: boolean
}
export type StagehandScope = {
  allowedOrigins: string[]
  allowedResourceDomains?: string[]
  currentUrl: string
  extensionId?: string
  targetId?: string
  getVisiblePageText?: () => Promise<string> | string
  getVisiblePageAttributes?: () => Promise<string> | string
  getViewportInfo?: () => Promise<BrowserGenieViewportInfo> | BrowserGenieViewportInfo
  executePageAction?: (action: unknown, signal?: AbortSignal) => Promise<{ success: boolean; url?: string; message?: string; error?: string }> | { success: boolean; url?: string; message?: string; error?: string }
  navigatePage?: (url: string, signal?: AbortSignal) => Promise<{ url?: string } | string> | { url?: string } | string
}

export function createConfiguredGenerator(getModel: () => BrowserGenieModel, messages?: Record<string, any>): (params: any) => Promise<any>
export function compactAccessibilityTree(input: string, options?: ViewportSemanticSnapshotOptions): string
export function compactStagehandGeneratorParams(params: any, options?: ViewportSemanticSnapshotOptions): any
export function createViewportSemanticGenerator(generator: (params: any) => Promise<any>, options?: ViewportSemanticSnapshotOptions): (params: any) => Promise<any>
export const VIEWPORT_SEMANTIC_SNAPSHOT_DEFAULTS: Readonly<{ maxChars: 2900; maxTableRows: 6; maxValueChars: 180 }>

export function createStagehandWebAgentHost(options: {
  cdpPort: number
  getModel?: () => BrowserGenieModel
  generator?: (params: any) => Promise<any>
  stagehandApi: {
    localBrowser: { connect(options: Record<string, unknown>): Promise<any> }
    Stagehand: { create(options: Record<string, unknown>): Promise<any> }
  }
  discoverAttempts?: number
  logLevel?: string
  selfHeal?: boolean
  successMessage?: string
  summaryInstruction?: (instruction: string) => string
  messages?: Record<string, any>
  viewportSnapshot?: ViewportSemanticSnapshotOptions
  ui?: {
    evaluate?(script: string): Promise<unknown> | unknown
    handleEvent?(event: Record<string, unknown>): Promise<void> | void
    [key: string]: unknown
  }
}): {
  observe(request: StagehandScope & { instruction: string; options?: Record<string, unknown> }): Promise<any>
  act(request: StagehandScope & { instruction?: string; action?: unknown; options?: Record<string, unknown> }): Promise<any>
  extract(request: StagehandScope & { instruction: string; schema?: unknown; options?: Record<string, unknown> }): Promise<any>
  navigate(request: StagehandScope & { url: string; options?: Record<string, unknown> }): Promise<any>
  run(request: StagehandScope & {
    instruction: string
    onEvent?: (event: { type: string; at: number; visualSelectors?: string[]; error?: string }) => Promise<void> | void
  }): Promise<{ success: boolean; message: string; url: string; visualSelectors: string[] }>
  close(): Promise<void>
  ui?: Record<string, unknown>
}
