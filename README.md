# ELF Browser Genie

ELF is a reusable browser-agent library for natural-language web automation, page-verified task completion, durable skill learning, and reliable low-token replay.

The host application remains in control of the browser session, model credentials, authorization policy, and persistent storage. ELF supplies the reusable orchestration layer.

## Highlights

- Natural-language task execution in an existing Chromium or Electron session
- Host-provided task-level agent runtime with fresh reasoning isolation per request
- Explicit host-defined roles and capability allowlists
- Origin restrictions, step limits, and deterministic task and action gates
- Page observation and action through Stagehand or a custom browser adapter
- Verified skill learning with bounded self-healing
- Named knowledge sources, human-taught knowledge, memory, work items, and structured data
- Optional SQLite persistence for Node.js and Electron hosts
- Multiple package entry points for standard and advanced integrations

## Requirements

- Node.js 22 or newer
- An ESM project or an environment that supports ESM imports
- A host-owned Chromium or Electron browser session
- `@browserbasehq/stagehand@^4.0.2` when using the built-in Stagehand adapter
- An OpenAI-compatible model configuration or a compatible `generate()` function

## Installation

Install a pinned public GitHub release:

```bash
npm install github:babecuer/elf#v0.1.2
```

Install the Stagehand peer dependency when using the standard browser adapter:

```bash
npm install @browserbasehq/stagehand@^4.0.2
```

Pinning a version tag is recommended for production applications. Avoid depending on an unversioned branch because its contents can change without changing your dependency declaration.

## Quick start

```js
import { localBrowser, Stagehand } from '@browserbasehq/stagehand'
import { createNodeElf } from '@xwlib/browser-genie/node'

const elf = createNodeElf({
  profile: {
    name: 'Browser assistant',
    role: 'Help users complete authorized work in the connected browser.',
    capabilities: [
      {
        id: 'browser-work',
        mode: 'browser',
        description: 'Browse, inspect, and operate authorized pages',
        maxRisk: 'medium',
      },
      {
        id: 'skill-learning',
        mode: 'skill-learning',
        description: 'Learn reusable workflows from verified successes',
        maxRisk: 'medium',
      },
    ],
  },

  model: () => ({
    baseUrl: readModelConfiguration().baseUrl,
    apiKey: readModelCredentials().apiKey,
    model: readModelConfiguration().model,
  }),

  agentRuntime: {
    baseName: () => hostAgentRuntime.displayName,
    run(input) {
      return hostAgentRuntime.run(input)
    },
    close() {
      return hostAgentRuntime.close?.()
    },
  },

  browser: {
    cdpPort: browserSession.cdpPort,
    stagehandApi: { localBrowser, Stagehand },
    selfHeal: true,
  },

  knowledge: {
    directory: applicationDataDirectory,
    namespace: {
      app: 'my-app',
      plugin: 'browser-work',
      user: currentUserId,
    },
  },

  policy: {
    allowedOrigins: ['https://app.example.com'],
    maxSteps: 8,
  },

  onEvent(event) {
    renderElfEvent(event)
  },
})

const result = await elf.run(
  'Find the matching record and open its details',
  {
    currentUrl: browserView.webContents.getURL(),
    pageType: 'search',
    extensionId: stagehandExtensionId,
  },
  { signal: abortController.signal },
)

await elf.close()
```

Values such as `hostAgentRuntime`, `browserSession`, `applicationDataDirectory`, `currentUserId`, `browserView`, and `renderElfEvent` are supplied by the host application. ELF creates a fresh task session for every `elf.run()` call and exposes only its governed tools to the host runtime; Stagehand remains the page observation and action engine rather than the task controller.

## Documentation

- [Integration guide](./docs/INTEGRATION.md) — architecture boundaries, configuration, browser adapters, storage, and production checklist
- [Usage guide](./docs/USAGE.md) — task execution, agent-runtime behavior, events, knowledge, memory, workflows, work items, data, plugins, and API entry points

## Package entry points

| Entry point | Purpose |
| --- | --- |
| `@xwlib/browser-genie` | `createElf()` and lower-level composition APIs |
| `@xwlib/browser-genie/node` | Recommended Node.js/Electron setup with SQLite persistence |
| `@xwlib/browser-genie/stagehand` | Stagehand browser adapter and viewport compaction helpers |
| `@xwlib/browser-genie/storage/sqlite` | SQLite skill, knowledge, memory, work-item, and data storage |
| `@xwlib/browser-genie/wiki/sqlite` | Read-only SQLite knowledge bundles |

## Security model

ELF does not own browser windows, cookies, login state, model secrets, or business authorization. The trusted host must provide narrow capabilities and origin allowlists, enforce deterministic task and action authorization where required, and pass the real current page URL for every task. ELF does not add a risk-based second-confirmation flow.

Page content, user-authored knowledge, and model output cannot grant new capabilities, expand allowed origins, lower risk levels, or bypass host policy.

## Distribution contents

The public package contains bundled and minified runtime JavaScript, TypeScript declarations, and public documentation. It does not contain the original source tree, tests, internal design documents, build scripts, or source maps.
