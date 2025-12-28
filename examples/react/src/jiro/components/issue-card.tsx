import { Link } from 'react-router-dom'
import type { Issue } from '../state/jiro-types'
import { getStatusName, getStatusTone } from '../state/status-map'
import Pill from './pill'

type Props = {
  readonly issue: Issue
  readonly linkBase: string
  readonly compact?: boolean
}

function priorityTone(priority: Issue['priority']): 'neutral' | 'accent' | 'success' | 'alert' {
  if (priority === 'high') {
    return 'alert'
  }
  if (priority === 'medium') {
    return 'accent'
  }
  return 'neutral'
}

function IssueCard({ issue, linkBase, compact = false }: Props) {
  return (
    <Link to={`${linkBase}/${issue.id}`} className={`issue-card ${compact ? 'issue-compact' : ''}`}>
      <div className="issue-top">
        <div className="issue-key">{issue.key}</div>
        <div className="issue-meta">
          <Pill text={getStatusName(issue.status)} tone={getStatusTone(issue.status)} />
          <Pill text={`${issue.storyPoints} pts`} tone="neutral" />
          <Pill text={issue.priority} tone={priorityTone(issue.priority)} />
        </div>
      </div>
      <div className="issue-title">{issue.title}</div>
      {!compact && (
        <div className="issue-footer">
          <div className="issue-assignee">{issue.assignee}</div>
          <div className="issue-tags">
            {issue.labels.slice(0, 3).map((label) => (
              <span key={label} className="issue-tag">
                {label}
              </span>
            ))}
          </div>
        </div>
      )}
    </Link>
  )
}

export default IssueCard
