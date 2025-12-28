import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import Pill from '../components/pill'
import StageStrip from '../components/stage-strip'
import TopBar from '../components/top-bar'
import SkeletonBlock from '../components/skeleton-block'
import { useViewBridge } from '../hooks/use-view-bridge'
import { getIssue } from '../mock-data/issues'
import { getProject } from '../mock-data/projects'
import type { StageStep } from '../staged-load/stage-types'
import { useStageLoad } from '../staged-load/use-stage-load'
import { getStatusName, getStatusTone } from '../state/status-map'

const stagePlan: readonly StageStep[] = [
  { id: 'shell', ms: 240 },
  { id: 'sidebar', ms: 360 },
  { id: 'toolbar', ms: 460 },
  { id: 'tabs', ms: 560 },
  { id: 'content', ms: 720 },
]

function IssuePage() {
  const params = useParams()
  const projectKey = params.key ?? 'ABC'
  const issueId = params.id ?? ''
  const stage = useStageLoad(stagePlan)

  useViewBridge({
    view: 'issue',
    projectKey,
    issueId,
    stage,
  })

  const project = getProject(projectKey) ?? getProject('ABC')!
  const issue = useMemo(() => getIssue(project.key, issueId), [project.key, issueId])
  const loading = !stage.ready('content')

  return (
    <div className="page-body">
      <TopBar
        title="Issue"
        subtitle={issue ? issue.title : 'Issue loading'}
        projectKey={project.key}
        loading={!stage.ready('toolbar')}
        stageLabel={stage.current}
      />
      <StageStrip steps={stagePlan} stage={stage} />
      <div className="issue-layout">
        <div className="issue-main" aria-busy={loading}>
          <div className="issue-head">
            {issue ? (
              <>
                <div className="issue-id">{issue.key}</div>
                <div className="issue-title">{issue.title}</div>
              </>
            ) : (
              <>
                <SkeletonBlock width="6rem" height="1.2rem" />
                <SkeletonBlock width="12rem" height="1.4rem" />
              </>
            )}
          </div>
          <div className="issue-tabs">
            <button type="button" className="control-btn">
              Comments
            </button>
            <button type="button" className="control-btn">
              History
            </button>
            <button type="button" className="control-btn">
              Activity
            </button>
          </div>
          <div className="issue-description">
            {loading && (
              <>
                <SkeletonBlock height="1rem" />
                <SkeletonBlock height="1rem" />
                <SkeletonBlock height="1rem" />
                <SkeletonBlock height="1rem" width="70%" />
              </>
            )}
            {!loading && issue && (
              <p>
                {issue.description} Notes keep stacking with every status change. The page keeps
                loading in phases so you remember waiting here before.
              </p>
            )}
            {!loading && !issue && <p>This issue does not exist here.</p>}
          </div>
          <div className="issue-activity">
            <div className="activity-head">Recent activity</div>
            {loading && (
              <>
                <SkeletonBlock height="1rem" />
                <SkeletonBlock height="1rem" width="60%" />
              </>
            )}
            {!loading && (
              <ul className="activity-list">
                <li>
                  Status set to {issue ? getStatusName(issue.status) : 'Unknown'} while tabs were
                  still loading.
                </li>
                <li>Assignee nudged the team for an update that never lands.</li>
                <li>Labels changed twice to look busy.</li>
              </ul>
            )}
          </div>
        </div>
        <aside className="issue-side" aria-busy={loading}>
          <div className="side-card">
            <div className="side-label">Status</div>
            {issue ? (
              <Pill text={getStatusName(issue.status)} tone={getStatusTone(issue.status)} />
            ) : (
              <SkeletonBlock width="6rem" height="1.4rem" />
            )}
          </div>
          <div className="side-card">
            <div className="side-label">Assignee</div>
            {issue ? <div className="side-value">{issue.assignee}</div> : <SkeletonBlock />}
          </div>
          <div className="side-card">
            <div className="side-label">Priority</div>
            {issue ? <div className="side-value">{issue.priority}</div> : <SkeletonBlock />}
          </div>
          <div className="side-card">
            <div className="side-label">Story points</div>
            {issue ? <div className="side-value">{issue.storyPoints}</div> : <SkeletonBlock />}
          </div>
          <div className="side-card">
            <div className="side-label">Labels</div>
            {issue ? (
              <div className="side-tags">
                {issue.labels.map((label) => (
                  <span key={label} className="issue-tag">
                    {label}
                  </span>
                ))}
              </div>
            ) : (
              <SkeletonBlock />
            )}
          </div>
          <div className="side-card">
            <div className="side-label">Dates</div>
            {issue ? (
              <div className="side-dates">
                <div>
                  <span className="side-date-label">Created</span>
                  <span>{issue.dates.created}</span>
                </div>
                <div>
                  <span className="side-date-label">Updated</span>
                  <span>{issue.dates.updated}</span>
                </div>
                <div>
                  <span className="side-date-label">Due</span>
                  <span>{issue.dates.due}</span>
                </div>
              </div>
            ) : (
              <SkeletonBlock />
            )}
          </div>
          <div className="side-card">
            <div className="side-label">Navigation</div>
            <Link to={`/project/${project.key}/board`} className="control-link">
              Back to board
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default IssuePage
