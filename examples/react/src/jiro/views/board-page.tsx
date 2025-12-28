import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import BoardColumn from '../components/board-column'
import StageStrip from '../components/stage-strip'
import TopBar from '../components/top-bar'
import { useViewBridge } from '../hooks/use-view-bridge'
import { getIssues } from '../mock-data/issues'
import { getProject } from '../mock-data/projects'
import type { StageStep } from '../staged-load/stage-types'
import { useStageLoad } from '../staged-load/use-stage-load'
import type { Issue } from '../state/jiro-types'

const stagePlan: readonly StageStep[] = [
  { id: 'shell', ms: 220 },
  { id: 'sidebar', ms: 320 },
  { id: 'toolbar', ms: 420 },
  { id: 'lanes', ms: 520 },
  { id: 'cards', ms: 680 },
]

function BoardPage() {
  const params = useParams()
  const projectKey = params.key ?? 'ABC'
  const stage = useStageLoad(stagePlan)
  useViewBridge({
    view: 'board',
    projectKey,
    stage,
  })

  const project = getProject(projectKey) ?? getProject('ABC')!
  const issues = useMemo(() => getIssues(project.key), [project.key])

  const backlog = issues.filter((issue) => issue.status === 'backlog' || issue.status === 'selected')
  const progress = issues.filter((issue) => issue.status === 'progress')
  const review = issues.filter((issue) => issue.status === 'review')
  const done = issues.filter((issue) => issue.status === 'done')

  const linkBase = `/project/${project.key}/issue`
  const loading = !stage.ready('cards')

  return (
    <div className="page-body">
      <TopBar
        title="Board"
        subtitle={`${project.name} work board`}
        projectKey={project.key}
        loading={!stage.ready('toolbar')}
        stageLabel={stage.current}
      />
      <div className="lane-toolbar">
        <div className="lane-controls">
          <button type="button" className="control-btn">
            Group by status
          </button>
          <button type="button" className="control-btn">
            Swimlanes
          </button>
          <button type="button" className="control-btn">
            Sort by priority
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
      <div className="board" aria-busy={loading}>
        <BoardColumn title="Backlog" issues={backlog} linkBase={linkBase} loading={!stage.ready('lanes')} />
        <BoardColumn
          title="Selected"
          issues={backlog.slice(0, 6)}
          linkBase={linkBase}
          loading={!stage.ready('lanes')}
        />
        <BoardColumn title="In Progress" issues={progress} linkBase={linkBase} loading={loading} />
        <BoardColumn title="In Review" issues={review} linkBase={linkBase} loading={loading} />
        <BoardColumn title="Done" issues={done.slice(0, 8)} linkBase={linkBase} loading={loading} />
      </div>
    </div>
  )
}

export default BoardPage
