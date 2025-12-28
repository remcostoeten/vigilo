import type { Issue } from '../state/jiro-types'
import IssueCard from './issue-card'
import SkeletonBlock from './skeleton-block'

type Props = {
  readonly title: string
  readonly issues: readonly Issue[]
  readonly linkBase: string
  readonly loading: boolean
}

function BoardColumn({ title, issues, linkBase, loading }: Props) {
  return (
    <section className="board-column" aria-busy={loading}>
      <div className="board-head">
        <div className="board-title">{title}</div>
        <div className="board-count">{issues.length}</div>
      </div>
      <div className="board-body">
        {loading && (
          <div className="board-skeleton">
            <SkeletonBlock height="5rem" />
            <SkeletonBlock height="5rem" />
            <SkeletonBlock height="5rem" />
          </div>
        )}
        {!loading &&
          issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} linkBase={linkBase} compact={true} />
          ))}
      </div>
    </section>
  )
}

export default BoardColumn
