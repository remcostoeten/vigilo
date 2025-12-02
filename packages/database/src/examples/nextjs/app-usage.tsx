'use client'

import { VigiloProvider } from '@vigilo/database/react/provider'
import { Vigilo } from '@remcostoeten/vigilo-react'
import type { CategoryConfig } from '@remcostoeten/vigilo-core'

// Example categories
const devCategories: CategoryConfig[] = [
  {
    id: 'development',
    displayName: 'Development Tasks',
    items: [
      { text: 'Fix authentication bug', action: 'fix', priority: 'high' },
      { text: 'Add user profile page', action: 'feat', priority: 'medium' },
      { text: 'Optimize database queries', action: 'perf', priority: 'low' }
    ]
  },
  {
    id: 'design',
    displayName: 'Design Tasks', 
    items: [
      { text: 'Update color scheme', action: 'update', priority: 'medium' },
      { text: 'Create new icons', action: 'create', priority: 'low' }
    ]
  }
]

export default function MyApp() {
  return (
    <VigiloProvider
      baseUrl="/api/vigilo"  // Your API base URL
      defaultInstanceId="user-dev-tasks"
      getAuthToken={() => {
        // Return current user's auth token
        return localStorage.getItem('authToken') || undefined
      }}
    >
      <Vigilo
        category="development"
        categories={devCategories}
        // Storage is automatically provided by the provider!
      />
    </VigiloProvider>
  )
}
