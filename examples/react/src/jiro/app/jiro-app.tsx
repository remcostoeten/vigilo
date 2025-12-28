import { BrowserRouter } from 'react-router-dom'
import { Btwfyi } from 'btwfyi/react'
import AppShell from './app-shell'
import { useBtwfyiTasks } from '../overlay/use-btwfyi-tasks'
import { ViewProvider, useView } from '../state/view-context'

function OverlayHost() {
  const view = useView()
  const overlay = useBtwfyiTasks(view)

  return (
    <Btwfyi
      categories={overlay.categories}
      category={overlay.category}
      enabled={true}
      instanceId="jiro-overlay"
      colorMode="dark"
      themeOverrides={{
        colors: {
          primary: 'rgb(182, 194, 255)',
          primaryDim: 'rgba(182, 194, 255, 0.12)',
          textMain: 'text-gray-100',
          textDim: 'text-zinc-500',
          bgPanel: 'bg-slate-900/90',
          borderPanel: 'border-slate-800',
          bgOverlay: 'rgba(12, 13, 18, 0.4)',
          freeroam: 'rgb(139, 92, 246)',
        },
      }}
    />
  )
}

function JiroApp() {
  return (
    <BrowserRouter>
      <ViewProvider>
        <div className="page">
          <AppShell />
          <OverlayHost />
        </div>
      </ViewProvider>
    </BrowserRouter>
  )
}

export default JiroApp
