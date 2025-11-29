import { useEffect } from 'react'
import { Vigilo, useVigiloInstance } from '@vigilo/react'
import type { CategoryConfig } from '@vigilo/react'

const categories: readonly CategoryConfig[] = [
  {
    id: 'development',
    displayName: 'Development Tasks',
    items: [
      {
        text: 'Implement user authentication',
        action: 'FEATURE',
        description: 'Add login and registration functionality with JWT tokens',
        info: 'This feature requires integration with the backend API',
        priority: 'high',
        tags: ['backend', 'auth', 'security'],
      },
      {
        text: 'Add dark mode toggle',
        action: 'ENHANCEMENT',
        description: 'Allow users to switch between light and dark themes',
        info: 'Use CSS variables for theme switching',
        priority: 'medium',
        tags: ['frontend', 'ui'],
      },
      {
        text: 'Write unit tests for API endpoints',
        action: 'TEST',
        description: 'Cover all API endpoints with comprehensive tests',
        info: 'Use Jest and Supertest for testing',
        priority: 'high',
        tags: ['testing', 'backend'],
      },
      {
        text: 'Optimize database queries',
        action: 'PERFORMANCE',
        description: 'Review and optimize slow database queries',
        info: 'Check query execution plans and add indexes where needed',
        priority: 'medium',
        tags: ['database', 'performance'],
      },
      {
        text: 'Update documentation',
        action: 'DOCS',
        description: 'Keep API and component documentation up to date',
        info: 'Use JSDoc for code documentation',
        priority: 'low',
        tags: ['documentation'],
      },
    ],
  },
] as const

function App() {
  // Access the Vigilo instance to add demo connections
  const { addConnection } = useVigiloInstance({ instanceId: 'development' })

  // Add a demo connection on mount
  useEffect(() => {
    // Wait a bit for the DOM to be ready
    const timer = setTimeout(() => {
      const feature1 = document.querySelector('#feature-1')
      if (feature1) {
        addConnection(0, feature1, 'Feature 1')
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [addConnection])

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Vigilo React Example</h1>
          <p className="text-zinc-400">
            A task awareness overlay for development environments
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            id="feature-1"
            className="p-6 bg-zinc-800 rounded-lg border border-zinc-700 hover:border-blue-500 transition-colors"
          >
            <h2 className="text-xl font-semibold mb-2">Feature 1</h2>
            <p className="text-zinc-400">
              This is a feature that can be connected to a Vigilo task. Right-click
              on a task in the overlay to connect it to this element.
            </p>
          </div>

          <div
            id="feature-2"
            className="p-6 bg-zinc-800 rounded-lg border border-zinc-700 hover:border-blue-500 transition-colors"
          >
            <h2 className="text-xl font-semibold mb-2">Feature 2</h2>
            <p className="text-zinc-400">
              Another feature that can be connected. Try connecting multiple tasks
              to different elements on the page.
            </p>
          </div>

          <div
            id="feature-3"
            className="p-6 bg-zinc-800 rounded-lg border border-zinc-700 hover:border-blue-500 transition-colors"
          >
            <h2 className="text-xl font-semibold mb-2">Feature 3</h2>
            <p className="text-zinc-400">
              You can also use freeroam mode by holding Shift while right-clicking
              on a task.
            </p>
          </div>

          <div
            id="feature-4"
            className="p-6 bg-zinc-800 rounded-lg border border-zinc-700 hover:border-blue-500 transition-colors"
          >
            <h2 className="text-xl font-semibold mb-2">Feature 4</h2>
            <p className="text-zinc-400">
              The overlay remembers your connections and position across page
              reloads.
            </p>
          </div>
        </div>

        <div className="mt-12 p-6 bg-zinc-800 rounded-lg border border-zinc-700">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <ul className="space-y-2 text-zinc-400 list-disc list-inside">
            <li>Right-click on a task to connect it to a page element</li>
            <li>Hold Shift while right-clicking for freeroam mode</li>
            <li>Double-click a task to view details</li>
            <li>Click the status indicator to cycle through todo → working → done</li>
            <li>Press 's' to open settings</li>
            <li>Press '/' to search tasks</li>
            <li>Drag the overlay panel to reposition it</li>
          </ul>
        </div>
      </div>

      <Vigilo categories={categories} category="development" enabled={true} />
    </div>
  )
}

export default App


