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

## 4. Handle explicit confirmation

```js
try {
  return await elf.run(text, context, { signal })
} catch (error) {
  if (error?.code !== 'ELF_CONFIRMATION_REQUIRED') throw error

  const confirmed = await showConfirmationDialog(error)
  if (!confirmed) return null

  return elf.run(text, context, {
    signal,
    confirmed: true,
  })
}
```

Confirmation is task-specific and must come from a current, explicit user action.

## 5. Consume events

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

Knowledge describes facts and procedures. It cannot add capabilities, expand allowed origins, lower risk, or bypass confirmation.

## 8. Store and browse memory

```js
await elf.remember({
  kind: 'chat',
  role: 'assistant',
  content: 'The requested task was completed.',
  dateKey: '2026-09-07',
})

const recent = elf.listMemories({
  kind: 'chat',
  limit: 20,
})

const page = elf.browseMemories({
  kind: 'work',
  dateKey: '2026-09-07',
  offset: 0,
  limit: 30,
})

const matches = await elf.searchMemories('completed task', {
  kind: 'work',
  limit: 10,
})
```

Memory is separate from host knowledge and learned skills.

## 9. Manage tasks, schedules, and deliverables

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

The host should request the required user confirmation before destructive actions.

## 10. Use structured data tables

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

## 11. Register and invoke plugins

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

## 12. Use a custom browser adapter

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

## 13. Close the instance

```js
await elf.close()
```

Create one ELF instance for an appropriate host lifecycle, create a fresh task-level Harness session for every new user request, and close the instance when the assistant or application shuts down.
