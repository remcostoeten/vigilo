import { NavLink } from 'react-router-dom'
import type { Project } from '../state/jiro-types'
import Pill from './pill'
import SkeletonBlock from './skeleton-block'

type Props = {
  readonly projects: readonly Project[]
  readonly loading: boolean
  readonly activeKey?: string
}

function linkClass(isActive: boolean): string {
  return isActive ? 'nav-link nav-link-active' : 'nav-link'
}

function NavRail({ projects, loading, activeKey }: Props) {
  return (
    <nav className="nav-rail" aria-label="Project navigation">
      <div className="nav-header">
        <div className="nav-title">Jiro</div>
        <Pill text="demo" tone="accent" />
      </div>
      <div className="nav-section">
        <div className="nav-label">Browse</div>
        <NavLink to="/projects" className={({ isActive }) => linkClass(isActive)}>
          <span className="nav-dot" />
          <span>Projects</span>
        </NavLink>
      </div>
      <div className="nav-section">
        <div className="nav-label">Projects</div>
        {loading && (
          <div className="nav-placeholder">
            <SkeletonBlock height="0.75rem" />
            <SkeletonBlock height="0.75rem" />
            <SkeletonBlock height="0.75rem" />
          </div>
        )}
        {!loading &&
          projects.map((project) => (
            <NavLink
              key={project.key}
              to={`/project/${project.key}/board`}
              className={({ isActive }) => linkClass(isActive || project.key === activeKey)}
            >
              <span className="nav-dot" />
              <span className="nav-text">
                <span className="nav-key">{project.key}</span>
                <span className="nav-subtext">{project.name}</span>
              </span>
              <Pill text={`${project.stats.board}`} tone="neutral" />
            </NavLink>
          ))}
      </div>
    </nav>
  )
}

export default NavRail
