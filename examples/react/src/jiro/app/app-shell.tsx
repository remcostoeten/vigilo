import { useMemo } from 'react'
import { getProjects } from '../mock-data/projects'
import NavRail from '../components/nav-rail'
import JiroRouter from './router'
import { useView } from '../state/view-context'
import '../styles/jiro.css'

function AppShell() {
  const projects = useMemo(() => getProjects(), [])
  const view = useView()
  const navLoading = view.stage.index < 2

  return (
    <div className="app-frame">
      <NavRail projects={projects} loading={navLoading} activeKey={view.projectKey} />
      <main className="app-main">
        <JiroRouter />
      </main>
    </div>
  )
}

export default AppShell
