import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import BacklogList from '../components/backlog-list'
import StageStrip from '../components/stage-strip'
import TopBar from '../components/top-bar'
import { useViewBridge } from '../hooks/use-view-bridge'
import { getSprints } from '../mock-data/issues'
import { getProject } from '../mock-data/projects'
import { useStageLoad } from '../staged-load/use-stage-load'
import type { StageStep } from '../staged-load/stage-types'

const stagePlan: readonly StageStep[] = [
  { id: 'shell', ms: 260 },
  { id: 'sidebar', ms: 340 },
  { id: 'toolbar', ms: 440 },
  { id: 'filters', ms: 540 },
  { id: 'content', ms: 720 },
]

function BacklogPage() {
  const params = useParams()
  const projectKey = params.key ?? 'ABC'
  const stage = useStageLoad(stagePlan)

  useViewBridge({
    view: 'backlog',
    projectKey,
    stage,
  })

  const project = getProject(projectKey) ?? getProject('ABC')!
  const sprints = useMemo(() => getSprints(project.key), [project.key])
  const loading = !stage.ready('content')

  return (
    <div className="page-body">
      <TopBar
        title="Backlog"
        subtitle={`${project.name} backlog queue`}
        projectKey={project.key}
        loading={!stage.ready('toolbar')}
        stageLabel={stage.current}
      />
      <div className="lane-toolbar">
        <div className="lane-controls">
          <button type="button" className="control-btn">
            Refine
          </button>
          <button type="button" className="control-btn">
            Bulk move
          </button>
          <button type="button" className="control-btn">
            Rank top
          </button>
        </div>
        <div className="lane-links">
          <Link to={`/project/${project.key}/backlog`} className="control-link">
            Backlog
          </Link>
          <Link to={`/project/${project.key}/board`} className="control-link">
            Board
          </Link>
        </div>
      </div>
      <StageStrip steps={stagePlan} stage={stage} />
      <div className="backlog-filters" aria-busy={!stage.ready('filters')}>
        <div className="filter-row">
          <label className="filter-label" htmlFor="filter-text">
            Search
          </label>
          <input id="filter-text" className="control-input" placeholder="Type to search" />
        </div>
        <div className="filter-row">
          <label className="filter-label" htmlFor="filter-type">
            Type
          </label>
          <select id="filter-type" className="control-input">
            <option>Story</option>
            <option>Task</option>
            <option>Bug</option>
          </select>
        </div>
        <div className="filter-row">
          <label className="filter-label" htmlFor="filter-label">
            Labels
          </label>
          <input id="filter-label" className="control-input" placeholder="labels,separated" />
        </div>
      </div>
      <BacklogList sprints={sprints} linkBase={`/project/${project.key}/issue`} loading={loading} />
    </div>
  )
}

export default BacklogPage
