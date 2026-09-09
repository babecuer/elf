# Usage Guide

This guide covers the main runtime APIs after ELF has been configured. See the [Integration Guide](./INTEGRATION.md) for host setup.

## 1. Package entry points

```js
import {
  createElf,
  createGenieRuntime,
  createInMemorySkillStore,
  createElfPluginRegistry,
} from '@xwlib/browser-genie'

import { createNodeElf } from '@xwlib/browser-genie/node'
import {
  createConfiguredGenerator,
  createStagehandWebAgentHost,
} from '@xwlib/browser-genie/stagehand'
import { createSqliteSkillStore } from '@xwlib/browser-genie/storage/sqlite'
import { openSqliteWikiBundle } from '@xwlib/browser-genie/wiki/sqlite'
```

Prefer `createNodeElf()` for a standard Node.js or Electron host. The lower-level exports are intended for adapter replacement and advanced composition.

## 2. Execute a browser task

```js
const result = await elf.run(
  'Open the matching item and verify its visible status',
  {
    currentUrl: browserView.webContents.getURL(),
    pageType: 'list',
    extensionId: stagehandExtensionId,
    targetId: browserTargetId,
    allowedResourceDomains: ['*.cdn.example.com'],
  },
  {
    signal: abortController.signal,
    fallbackOnSkillError: true,
    onEvent(event) {
      renderTaskEvent(event)
    },
  },
)
```

Important runtime context fields:

| Field | Purpose |
| --- | --- |
| `currentUrl` | The real URL of the current browser page |
| `pageType` | Optional stable host-defined page classification |
| `extensionId` | Optional Stagehand or browser-extension identifier |
| `targetId` | Optional browser target identifier |
| `allowedResourceDomains` | Optional domains allowed only for subordinate page resources |

The result is a structured object containing the normalized task, execution result, and validation information relevant to that run.

## 3. Cancel a task

```js
const controller = new AbortController()

const pending = elf.run(text, context, {
  signal: controller.signal,
})

controller.abort()
await pending
```

Forward the same signal through host browser adapters, model gateways, plugins, and custom policy hooks where supported.

## 4. Consume events

Register a global handler during creation and an optional task-local handler during `run()`:

```js
const elf = createNodeElf({
  // other configuration
  onEvent(event) {
    applicationEventLog.write(event)
  },
})

await elf.run(text, context, {
  onEvent(event) {
    currentTaskView.update(event)
  },
})
```

Use public progress messages to update one pending assistant response. Do not expose hidden reasoning or append a new chat message for every execution stage.

## 5. Understand task runtime ownership

When `agentRuntime` is configured, one `elf.run()` call creates one fresh task session. ELF retrieves relevant workflows, knowledge, stable skills, and formal memory, then gives the host runtime a task-scoped prompt and governed `executeTool()` function. Corrective turns inside that task reuse the same session ID; a later user request receives a different ID.

The host runtime owns continuous reasoning and final response generation. ELF owns capability checks, tool execution, browser scope, limits, validation, and learning. Stagehand remains behind the browser adapter and does not replace the task-level agent runtime.

Real response text can stream through `onDelta`; ELF emits it as `agent.reply.delta`. Progress events update task state, but they are not synthetic response tokens.

## 6. Teach and search knowledge

Save knowledge explicitly provided by a user:

```js
await elf.teach({
  kind: 'procedure',
  content: 'Use the workspace navigation to reach the requested page.',
  origins: ['https://app.example.com'],
  pageTypes: ['workspace'],
  tags: ['navigation'],
})
```

Search the merged knowledge view:

```js
const matches = await elf.searchKnowledge(
  'How do I reach the requested page?',
  {
    currentUrl: 'https://app.example.com/home',
    pageType: 'workspace',
  },
  { limit: 5 },
)
```

Inspect and browse named sources:

```js
const sources = elf.listKnowledgeSources()

const page = await elf.browseKnowledgeSource('site-map', {
  query: 'settings',
  offset: 0,
  limit: 30,
})
```

Remove only knowledge that the current host and policy allow the user to manage:

```js
await elf.removeKnowledge(knowledgeId)
```

## 7. Configure named knowledge sources

Named sources are declared during creation:

```js
knowledgeSources: [
  {
    id: 'site-map',
    name: 'Application map',
    owner: 'host',
    category: 'site-map',
    authority: 80,
    readonly: true,
    version: '1',
    provider: [
      {
        id: 'workspace-home',
        kind: 'site-map',
        title: 'Workspace home',
        url: 'https://app.example.com/home',
        content: 'Entry point for the authorized workspace.',
        keywords: ['home', 'workspace'],
      },
    ],
  },
]
```

A provider may be an array, `{ entries }`, an async search function, or an object with `search()` and optional `close()` methods.

Use `mode: 'shared'` when the provider queries a central knowledge service rather than a bundle shipped with the host. Shared providers must implement `search()` and may implement `browse()`, `list()`, and `submitImprovement()`:

```js
knowledgeSources: [{
  id: 'shared-reference',
  name: 'Shared reference',
  owner: 'host',
  category: 'reference',
  mode: 'shared',
  readonly: true,
  provider: {
    search: (request) => knowledgeService.search(request),
    browse: (request) => knowledgeService.browse(request),
    submitImprovement: (request) => knowledgeService.createProposal(request),
  },
}]
```

`readonly` still prevents direct editing of authoritative entries. `submitImprovement()` creates a governed proposal; it does not imply direct overwrite permission. Submit one through ELF with the source version or content hash used as the proposal baseline:

```js
await elf.submitKnowledgeImprovement('shared-reference', {
  operation: 'update',
  targetId: 'existing-entry',
  baseVersion: '12',
  reason: 'The verified page now describes a different workflow.',
  proposedEntry: { content: 'Use the newly verified workflow.' },
  evidence: [{ url: currentUrl, observedAt: new Date().toISOString() }],
}, context)
```

The host may gate proposals with `policy.authorizeKnowledgeImprovement`. Central review, conflict handling, persistence, and publication remain host responsibilities.

Knowledge describes facts and procedures. It cannot add capabilities, expand allowed origins, lower risk, or bypass host policy.

## 8. Store chat archives, work logs, and formal memory

These are separate stores with different purposes. Chat archives are user-visible history and work logs are execution records; neither is recalled into later model turns.

Archive chat messages:

```js
await elf.archiveChatMessage({
  role: 'assistant',
  content: 'The requested task was completed.',
  sessionId,
})

const chatPage = elf.browseChatArchive({ offset: 0, limit: 30 })
```

Append and browse work logs:

```js
await elf.appendWorkLog({
  task: 'Inspect the requested page',
  result: 'The visible state was verified.',
  status: 'completed',
  url: 'https://app.example.com/items/1',
})

const workPage = elf.browseWorkLogs({ status: 'completed', offset: 0, limit: 30 })
```

Create and govern durable formal memory only for stable collaboration preferences, goals, decisions, entities, commitments, and constraints:

```js
const memory = await elf.proposeMemory({
  kind: 'preference',
  statement: 'Lead status reports with the outcome.',
  origin: 'user-explicit',
  status: 'active',
  triggerTerms: ['status report', 'progress update'],
  importance: 7,
})

const memoryPage = elf.browseMemoryItems({
  status: 'active',
  offset: 0,
  limit: 30,
})

const recalled = await elf.searchActiveMemories('How should I format this update?', context, { limit: 3 })

await elf.setMemoryStatus(memory.id, 'superseded')
await elf.forgetMemory(memory.id)
```

The legacy `remember()`, `listMemories()`, `browseMemories()`, and `searchMemories()` methods exist only for migration of older mixed `chat`/`work` data. New integrations should not use them.

## 9. Manage user workflows

Save user-authored workflows and browse or match them independently from knowledge:

```js
const workflow = await elf.saveUserWorkflow({
  name: 'Review then update',
  description: 'Inspect the current record, verify its visible state, apply the requested update, then validate the saved result.',
  enabled: true,
})

const page = elf.browseUserWorkflows({ query: 'review', offset: 0, limit: 30 })
const matches = await elf.matchUserWorkflows('Review and update this record', context, { limit: 3 })
```

Host-shipped presets should use `syncPresetWorkflows()`. Preset copies can be reset, recoverably removed, and restored; manually created workflows are permanently removed.

## 10. Manage tasks, schedules, and deliverables

Create or update a work item:

```js
const item = await elf.saveWorkItem({
  kind: 'task',
  title: 'Review the requested page',
  content: 'Inspect the current page and record the visible result.',
  status: 'pending',
  dateKey: '2026-09-07',
})
```

Browse work items:

```js
const page = elf.browseWorkItems({
  kind: 'deliverable',
  offset: 0,
  limit: 30,
})
```

Analyze a natural-language task into one-time or recurring schedule items:

```js
const plan = await elf.saveAnalyzedTask({
  content: 'Review the workspace every Monday morning',
  currentDate: '2026-09-07',
  timeZone: 'Asia/Shanghai',
  signal,
})
```

Remove a work item:

```js
await elf.removeWorkItem(item.id)
```

The host must apply its own authorization and user-interaction flow for destructive actions through trusted policy and UI boundaries.

## 11. Use structured data tables

The `data` capability must be declared before using dynamic business tables.

Design a table from a purpose and optional samples:

```js
const table = await elf.designDataTable({
  purpose: 'Store records collected from the current page',
  sampleRows: [{ label: 'Example', status: 'Open' }],
  signal,
})
```

Create a table deterministically:

```js
await elf.createDataTable({
  id: 'collected-records',
  title: 'Collected records',
  fields: [
    { key: 'id', label: 'ID', type: 'text', required: true, identity: true },
    { key: 'label', label: 'Label', type: 'text' },
    { key: 'status', label: 'Status', type: 'text' },
  ],
})
```

Save and query rows:

```js
await elf.upsertDataRows('collected-records', rows)

const page = elf.queryDataTable('collected-records', {
  offset: 0,
  limit: 30,
})
```

Collect from the current browser page:

```js
const result = await elf.collectData(
  {
    purpose: 'Collect the visible matching records',
    maxRows: 100,
    signal,
  },
  {
    currentUrl: browserView.webContents.getURL(),
    allowedOrigins: ['https://app.example.com'],
  },
)
```

## 12. Register and invoke plugins

```js
elf.registerPlugin({
  id: 'host-export',
  kind: 'capability',
  title: 'Host export',
  description: 'Create an export through the trusted host',
  capabilityId: 'export',
  version: '1.0.0',
  async run(request) {
    return hostExport(request.input, request.context)
  },
})
```

Invoke, inspect, and remove plugins:

```js
const plugins = elf.listPlugins({ kind: 'capability' })
const result = await elf.invokePlugin('host-export', input, context, { signal })
await elf.unregisterPlugin('host-export')
```

An extension plugin can run only when its `capabilityId` exactly matches a declared `extension` capability and host policy authorizes the invocation.

## 13. Use a custom browser adapter

When Stagehand is not used, provide `observe`, `act`, and `extract`:

```js
const elf = createElf({
  // other configuration
  browser: {
    observe: (request) => adapter.observe(request),
    act: (request) => adapter.act(request),
    extract: (request) => adapter.extract(request),
    navigate: (request) => adapter.navigate(request),
  },
})
```

Selectors and XPath mappings should remain inside the trusted adapter. Model-facing observations should use short semantic element identifiers and bounded visible-page context.

## 14. Close the instance

```js
await elf.close()
```

Create one ELF instance for an appropriate host lifecycle, create a fresh task-level Harness session for every new user request, and close the instance when the assistant or application shuts down.
