import type { Sprint } from '../state/jiro-types'
import IssueCard from './issue-card'
import SkeletonBlock from './skeleton-block'

type Props = {
  readonly sprints: readonly Sprint[]
  readonly linkBase: string
  readonly loading: boolean
}

function BacklogList({ sprints, linkBase, loading }: Props) {
  return (
    <div className="backlog" aria-busy={loading}>
      {sprints.map((sprint) => (
        <section key={sprint.id} className="backlog-sprint">
          <div className="backlog-head">
            <div className="backlog-name">{sprint.name}</div>
            <div className="backlog-meta">
              <span>{sprint.goal}</span>
              <span className="backlog-count">{sprint.issues.length} issues</span>
            </div>
          </div>
          <div className="backlog-body">
            {loading && (
              <div className="backlog-skeleton">
                <SkeletonBlock height="4rem" />
                <SkeletonBlock height="4rem" />
                <SkeletonBlock height="4rem" />
                <SkeletonBlock height="4rem" />
              </div>
            )}
            {!loading &&
              sprint.issues.map((issue) => (
                <IssueCard key={issue.id} issue={issue} linkBase={linkBase} />
              ))}
          </div>
        </section>
      ))}
    </div>
  )
}

export default BacklogList
