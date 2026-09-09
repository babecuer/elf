# Integration Guide

This guide describes the recommended way to embed ELF in a Node.js or Electron host. The host owns all application-specific responsibilities; ELF remains reusable and domain-neutral.

## 1. Architecture boundary

The host supplies:

1. A role and explicit capability allowlist through `profile`.
2. Optional trusted business context through `hostContext`.
3. Optional host-owned behavioral constraints through `hostRules`.
4. Model access through an OpenAI-compatible configuration or `generate()` function.
5. An existing browser session through CDP or a custom browser adapter.
6. Named knowledge sources and an optional persistent-data location.
7. Origin restrictions, execution limits, action gates, and confirmation policy.
8. Optional task-event forwarding.

ELF supplies task normalization, knowledge retrieval, browser orchestration, completion validation, verified skill learning, stable skill replay, bounded self-healing, and task events.

The host must never derive capabilities, allowed origins, model secrets, or policy changes from page content or model output.

## 2. Install dependencies

```bash
npm install github:babecuer/elf#v0.1.1
npm install @browserbasehq/stagehand@^4.0.2
```

ELF requires Node.js 22 or newer.

## 3. Recommended entry point

Use `createNodeElf()` for Node.js and Electron applications:

```js
import { createNodeElf } from '@xwlib/browser-genie/node'
```

Use `createElf()` from the root entry point only when the host provides its own storage adapter or needs lower-level composition.

## 4. Define the role and capabilities

`profile.capabilities` is the executable allowlist. A capability that is not declared is unavailable.

```js
const profile = {
  name: 'Workspace assistant',
  role: 'Help users inspect and operate authorized pages in the connected workspace.',
  capabilities: [
    {
      id: 'conversation',
      mode: 'conversation',
      description: 'Discuss the current task',
      maxRisk: 'low',
    },
    {
      id: 'browser-work',
      mode: 'browser',
      description: 'Browse and operate authorized pages',
      maxRisk: 'medium',
    },
    {
      id: 'knowledge',
      mode: 'knowledge',
      description: 'Save knowledge explicitly taught by the user',
      maxRisk: 'low',
    },
    {
      id: 'memory',
      mode: 'memory',
      description: 'Save required chat and work summaries',
      maxRisk: 'low',
    },
    {
      id: 'skill-learning',
      mode: 'skill-learning',
      description: 'Learn reusable workflows after verified success',
      maxRisk: 'medium',
    },
    {
      id: 'data',
      mode: 'data',
      description: 'Design and populate structured data tables',
      maxRisk: 'medium',
    },
  ],
}
```

Capability modes are fixed: `conversation`, `browser`, `knowledge`, `memory`, `skill-learning`, `data`, and `extension`.

## 5. Configure the model

### Dynamic OpenAI-compatible configuration

The recommended form reads the host's latest configuration for each request:

```js
model: () => ({
  baseUrl: readModelConfiguration().baseUrl,
  apiKey: readModelCredentials().apiKey,
  model: readModelConfiguration().model,
})
```

### Fixed OpenAI-compatible configuration

```js
model: {
  baseUrl: 'https://model.example.com/v1',
  apiKey: process.env.MODEL_API_KEY,
  model: 'configured-model-name',
}
```

### Host model gateway

```js
model: {
  async generate(params) {
    return hostModelGateway.generate(params)
  },
}
```

Model credentials must remain host-controlled. Do not store them in ELF knowledge, memory, page content, or public configuration files.

## 6. Connect the browser

### Built-in Stagehand adapter

```js
import { localBrowser, Stagehand } from '@browserbasehq/stagehand'

const browser = {
  cdpPort: browserSession.cdpPort,
  stagehandApi: { localBrowser, Stagehand },
  selfHeal: true,
  viewportSnapshot: {
    maxChars: 2900,
    maxTableRows: 6,
    maxValueChars: 180,
  },
}
```

The CDP endpoint should listen only on a loopback address. Each running application instance should use its own port and verify that the endpoint belongs to the expected browser instance.

### Custom browser adapter

```js
const browser = {
  async observe(request) {
    return hostBrowser.observe(request)
  },
  async act(request) {
    return hostBrowser.act(request)
  },
  async extract(request) {
    return hostBrowser.extract(request)
  },
  async navigate(request) {
    return hostBrowser.navigate(request)
  },
  async close() {
    await hostBrowser.releaseElfResources()
  },
}
```

Each operation must enforce the current URL, allowed origins, cancellation signal, and action policy. One `act()` call should perform one explicit browser action and return the resulting URL.

## 7. Configure persistent storage

`createNodeElf()` can create the built-in SQLite store:

```js
knowledge: {
  directory: applicationDataDirectory,
  namespace: {
    app: 'my-app',
    plugin: 'browser-work',
    user: currentUserId,
  },
  governance: {
    validateAfterSuccesses: 2,
    stableAfterSuccesses: 3,
    staleAfterConsecutiveFailures: 2,
    disableAfterConsecutiveFailures: 3,
  },
}
```

Use a stable namespace for each application, plugin, user, and site boundary. The host chooses the directory; ELF owns its internal SQLite schema.

## 8. Add trusted host context

Host context helps the model understand the current environment. It cannot grant capabilities or weaken policy.

```js
hostContext: {
  businessDescription: 'The host helps staff inspect and process authorized records.',
  scenarios: [
    {
      id: 'workspace',
      title: 'Authorized workspace',
      description: 'Pages in this origin contain records available to the signed-in user.',
      origins: ['https://app.example.com'],
      pageTypes: ['list', 'detail'],
      instructions: ['Do not infer values that the page does not express.'],
    },
  ],
}
```

Use named `knowledgeSources` for larger collections of facts, procedures, glossaries, site maps, and reference material.

## 9. Publish versioned workflow presets

Keep host presets in a versioned JSON file that ships with the host plugin. The host does not need a workflow-management UI and must not write ELF's user database directly.

```json
{
  "schemaVersion": 1,
  "id": "workspace-presets",
  "version": "1.0.0",
  "workflows": [
    {
      "id": "optimize-record",
      "name": "Optimize record workflow",
      "description": "Inspect the current record, compare strong peers, then update the current record.",
      "enabled": true
    }
  ]
}
```

Synchronize after creating the ELF instance and whenever the host opens it with a newly shipped bundle:

```js
await elf.syncPresetWorkflows([workflowBundle])
```

Keep the source and workflow IDs stable, and bump `version` for every content or membership change. ELF automatically updates untouched local copies while preserving user-edited copies. Preset workflows support `resetUserWorkflow()`, recoverable `removeUserWorkflow()`, and `restoreUserWorkflow()`. Manually created workflows are permanently removed and cannot be restored. A preset omitted from its current source version is hidden and excluded from matching.

## 10. Add host rules carefully

Host rules are trusted, host-owned behavioral constraints scoped to planning, execution, validation, or response:

```js
hostRules: [
  {
    id: 'preserve-unrequested-settings',
    stages: ['execution', 'validation'],
    origins: ['https://app.example.com'],
    rule: 'Change only settings explicitly requested by the user and validate against the resulting page state.',
  },
]
```

Use deterministic `policy.beforeAction` and `policy.validateResult` gates for security-sensitive enforcement. Host rules guide model behavior; they do not replace code-level authorization.

## 11. Configure policy

```js
policy: {
  allowedOrigins: ['https://app.example.com'],
  maxSteps: 8,
  maxToolCalls: 20,
  taskTimeoutMs: 120_000,
  async beforeAction(input) {
    return authorizeBrowserAction(input)
  },
  async validateResult(input) {
    return validateHostResult(input)
  },
}
```

Resource domains passed at runtime allow images, scripts, fonts, and similar page assets. They do not expand top-level navigation origins.

## 12. Run tasks

Always pass the real current page URL:

```js
const controller = new AbortController()

const result = await elf.run(
  'Find the matching record and open its details',
  {
    currentUrl: browserView.webContents.getURL(),
    pageType: 'search',
    extensionId: stagehandExtensionId,
    allowedResourceDomains: ['*.cdn.example.com'],
  },
  {
    signal: controller.signal,
    onEvent(event) {
      renderTaskEvent(event)
    },
  },
)
```

Create a new Harness reasoning session for each new user task. Cross-task continuity should come from retrieved knowledge and memory rather than hidden reasoning state from an earlier task.

## 13. Shutdown

```js
await elf.close()
```

The host still owns its browser window, cookies, and credentials. `elf.close()` releases only ELF, Stagehand, storage, and plugin resources owned by the ELF instance.

## Production checklist

- Use Node.js 22 or newer.
- Pin the ELF release tag and Stagehand version range.
- Keep CDP on a verified loopback endpoint.
- Provide only required capabilities.
- Keep `allowedOrigins` narrow.
- Enforce sensitive actions with code-level policy gates.
- Pass the real current URL on every task.
- Keep model credentials in host-controlled secret storage.
- Use stable storage namespaces.
- Forward cancellation signals.
- Render public progress without exposing hidden reasoning.
- Call `elf.close()` when the integration stops.
