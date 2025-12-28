# btwfyi

**btwfyi** _(noun)_  
/ˈbɪt.waɪ.faɪ.aɪ/ — _The art of looking productive while your task list grows, plus that nagging feeling when you remember you forgot something._

A lightweight task awareness overlay for development environments. btwfyi keeps tasks visible on top of your interface, helping you stay focused, plan effectively, and avoid forgetting important work. Designed for developers who want persistent task clarity without leaving the UI.

## Installation

```bash
npm install @remcostoeten/btwfyi
# or
pnpm add @remcostoeten/btwfyi
# or
yarn add @remcostoeten/btwfyi
```

## Usage

### React

```tsx
import { Btwfyi } from "@remcostoeten/btwfyi/react";
import type { CategoryConfig } from "@remcostoeten/btwfyi/react";

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
      <Btwfyi category="my-tasks" categories={categories} enabled={true} />
    </div>
  );
}
```

## New Features

### Smart Syntax
Natural language task entry with automatic parsing:
- **Dates**: "tomorrow", "next friday", "dec 31"
- **Tags**: `#bug`, `#feature`, `#urgent`
- **Priority**: `!high`, `!medium`, `!low`

```
"Fix login bug tomorrow #auth !high" 
→ { text: "Fix login bug", dueDate: [tomorrow], tags: ["auth"], priority: "high" }
```

### Bulk Import
Paste Markdown lists directly into the Command Palette:
```markdown
- Fix login bug #auth
- Add dark mode #ui !medium
- Update docs
```

### AI Enhancement
- **Local AI**: Uses Chrome's `window.ai` (Gemini Nano) for offline task enhancement
- **Cloud AI (Grok)**: Pass `aiConfig={{ grokApiKey: '...' }}` for smarter parsing

### Import/Export
- **Export**: Copy tasks as Markdown, JSON, or Slack format
- **Import**: Paste JSON arrays or Markdown lists

## Command Palette

Press `Alt + K` anywhere in your app to open the btwfyi command palette. Search across every mounted overlay, jump directly to a task, or type `btwfyi` to enter management mode where you can show/hide overlays, clear connections, or reset statuses globally.

## API

### React Component

#### Props

- `category: string` - The category ID to display
- `categories: CategoryConfig[]` - Array of category configurations
- `instanceId?: string` - Optional instance identifier
- `enabled?: boolean` - Whether the component is enabled (default: true)
- `onTaskCreate?: (task) => void` - Callback when a task is created via Smart Syntax
- `aiConfig?: { grokApiKey?: string; preferCloud?: boolean }` - AI configuration

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
  dueDate?: Date | string;
  priority?: "low" | "medium" | "high";
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
};
```

### Vue Composition

```ts
import { useBtwfyiStore } from "@remcostoeten/btwfyi/vue";

const { state, store } = useBtwfyiStore({
  category: "dev",
  instanceId: "dev-overlay",
});
```

## Theming

Pass `themeOverrides`, `stylesOverrides`, or set a `colorMode` to align btwfyi with your design tokens:

```tsx
<Btwfyi
  category="dev"
  categories={categories}
  colorMode="dark"
  themeOverrides={{
    colors: { primary: "var(--brand-blue)", textMain: "text-white" },
  }}
/>
```

## License

MIT
