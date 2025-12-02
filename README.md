#

**Vigilo** _(verb)_  
/ˈwi.ɡi.loː/ — _Latin, “to watch, stay alert, keep aware.”_

A lightweight task awareness overlay for development environments. Vigilo keeps tasks visible on top of your interface, helping you stay focused, plan effectively, and avoid forgetting important work. Designed for developers who want persistent task clarity without leaving the UI.

## Installation

```bash
npm install @remcostoeten/vigilo
# or
pnpm add @remcostoeten/vigilo
# or
yarn add @remcostoeten/vigilo
```

## Usage

### React

```tsx
import { Vigilo } from "@remcostoeten/vigilo/react";
import type { CategoryConfig } from "@remcostoeten/vigilo/react";

const categories: CategoryConfig[] = [
  {
    id: "my-tasks",
    displayName: "My Tasks",
    items: [
      { text: "Fix bug in login flow", action: "fix" },
      { text: "Add user profile page", action: "add" },
    ],
  },
];

function App() {
  return (
    <div>
      <Vigilo category="my-tasks" categories={categories} enabled={true} />
    </div>
  );
}
```

### Framework Agnostic Core

```typescript
import {
  createStorageKeys,
  loadState,
  savePosition,
  calculateBezier,
} from "vigilo";
import { generateSelector } from "@remcostoeten/vigilo/react";

const keys = createStorageKeys("my-instance");
const state = loadState(keys);
```

## API

### React Component

#### Props

- `category: string` - The category ID to display
- `categories: CategoryConfig[]` - Array of category configurations
- `instanceId?: string` - Optional instance identifier
- `enabled?: boolean` - Whether the component is enabled (default: true)

#### CategoryConfig

```typescript
type CategoryConfig = {
  id: string;
  displayName?: string;
  items: TodoItem[];
};

type TodoItem = {
  text: string;
  action?: string;
  info?: string;
  description?: string;
  notes?: string;
  priority?: "low" | "medium" | "high";
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
};
```

### Vue Composition

```ts
import { useVigiloStore } from "@remcostoeten/vigilo/vue";

const { state, store } = useVigiloStore({
  category: "dev",
  instanceId: "dev-overlay",
});
```

`state` stays reactive inside Vue components, and `store` exposes the same mutation helpers used by the React overlay so you can build custom Vue shells without reimplementing the business logic.

## Core API

The framework-agnostic core provides utilities for:

- Storage management (`createStorageKeys`, `loadState`, `savePosition`, etc.)
- Connection calculations (`calculateBezier`)

DOM helpers such as `generateSelector`, `getElementLabel`, and `isValidSelector` live in the React bundle (`@remcostoeten/vigilo/react`) because they require direct browser access.

## Command Palette

Press `Alt + K` anywhere in your app to open the Vigilo command palette. Search across every mounted overlay, jump directly to a task, or type `vigilo` to enter management mode where you can show/hide overlays, clear connections, or reset statuses globally.

## Theming

Pass `themeOverrides`, `stylesOverrides`, or set a `colorMode` to align Vigilo with your design tokens. Overrides accept Tailwind utility strings, CSS variables, hex, or rgb(a) values:

```tsx
<Vigilo
  category="dev"
  categories={categories}
  colorMode="dark"
  themeOverrides={{
    colors: { primary: "var(--brand-blue)", textMain: "text-white" },
    modes: {
      light: { colors: { bgPanel: "bg-white", textMain: "text-zinc-900" } },
    },
  }}
  stylesOverrides={{
    panel:
      "fixed right-4 top-4 rounded-2xl border border-white/10 bg-slate-900/80",
  }}
/>
```

## License

MIT
