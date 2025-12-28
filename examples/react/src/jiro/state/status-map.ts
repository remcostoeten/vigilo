import type { IssueStatus } from './jiro-types'

const statusName: Record<IssueStatus, string> = {
  backlog: 'Backlog',
  selected: 'Selected',
  progress: 'In Progress',
  review: 'In Review',
  done: 'Done',
}

const statusTone: Record<IssueStatus, 'neutral' | 'accent' | 'success' | 'alert'> = {
  backlog: 'neutral',
  selected: 'accent',
  progress: 'accent',
  review: 'accent',
  done: 'success',
}

function getStatusName(status: IssueStatus): string {
  return statusName[status]
}

function getStatusTone(status: IssueStatus): 'neutral' | 'accent' | 'success' | 'alert' {
  return statusTone[status]
}

export { getStatusName, getStatusTone }
