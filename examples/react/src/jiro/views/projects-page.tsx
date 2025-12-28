import { Link } from 'react-router-dom'
import BacklogList from '../components/backlog-list'
import StageStrip from '../components/stage-strip'
import TopBar from '../components/top-bar'
import SkeletonBlock from '../components/skeleton-block'
import { useViewBridge } from '../hooks/use-view-bridge'
import { getProjects } from '../mock-data/projects'
import { useStageLoad } from '../staged-load/use-stage-load'
import type { StageStep } from '../staged-load/stage-types'
import type { Sprint } from '../state/jiro-types'

const stagePlan: readonly StageStep[] = [
  { id: 'shell', ms: 260 },
  { id: 'sidebar', ms: 320 },
  { id: 'toolbar', ms: 440 },
  { id: 'main', ms: 520 },
  { id: 'content', ms: 640 },
]

function ProjectsPage() {
  const stage = useStageLoad(stagePlan)
  useViewBridge({
    view: 'projects',
    stage,
  })

  const projects = getProjects()
  const sprintShell: Sprint[] = [
    { id: 'shell-1', name: 'Upcoming work', goal: 'Staged content', issues: [] },
  ]

  return (
    <div className="page-body">
      <TopBar
        title="Projects"
        subtitle="Dense catalog of work streams"
        loading={!stage.ready('toolbar')}
        stageLabel={stage.current}
      />
      <StageStrip steps={stagePlan} stage={stage} />
      <div className="project-grid" aria-busy={!stage.ready('content')}>
        {!stage.ready('main') &&
          projects.map((project) => (
            <div key={project.key} className="project-card skeleton-card">
              <SkeletonBlock height="1.2rem" />
              <SkeletonBlock height="1rem" />
              <SkeletonBlock height="0.9rem" />
            </div>
          ))}
        {stage.ready('main') &&
          projects.map((project) => (
            <div key={project.key} className="project-card">
              <div className="project-top">
                <div className="project-key">{project.key}</div>
                <div className="project-meta">
                  <span>{project.category}</span>
                  <span className="dot" />
                  <span>{project.lead}</span>
                </div>
              </div>
              <div className="project-title">{project.name}</div>
              <div className="project-summary">{project.summary}</div>
              <div className="project-stats">
                <div>
                  <div className="stat-label">Backlog</div>
                  <div className="stat-value">{project.stats.backlog}</div>
                </div>
                <div>
                  <div className="stat-label">Board</div>
                  <div className="stat-value">{project.stats.board}</div>
                </div>
                <div>
                  <div className="stat-label">Done</div>
                  <div className="stat-value">{project.stats.done}</div>
                </div>
              </div>
              <div className="project-actions">
                <Link className="project-link" to={`/project/${project.key}/board`}>
                  Board
                </Link>
                <Link className="project-link" to={`/project/${project.key}/backlog`}>
                  Backlog
                </Link>
              </div>
            </div>
          ))}
      </div>
      <div className="project-backlog">
        <div className="project-backlog-head">
          <div className="project-backlog-title">Backlog preview</div>
          <div className="project-backlog-sub">Feels heavy, goes nowhere</div>
        </div>
        <BacklogList sprints={sprintShell} linkBase="/projects" loading={!stage.ready('content')} />
      </div>
    </div>
  )
}

export default ProjectsPage
