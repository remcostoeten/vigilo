export type IssueStatus =
  | 'backlog'
  | 'selected'
  | 'progress'
  | 'review'
  | 'done'

export type Priority = 'low' | 'medium' | 'high'

export type Project = {
  readonly key: string
  readonly name: string
  readonly lead: string
  readonly category: string
  readonly summary: string
  readonly stats: {
    readonly backlog: number
    readonly board: number
    readonly done: number
  }
}

export type Issue = {
  readonly id: string
  readonly key: string
  readonly projectKey: string
  readonly title: string
  readonly status: IssueStatus
  readonly priority: Priority
  readonly assignee: string
  readonly storyPoints: number
  readonly labels: readonly string[]
  readonly description: string
  readonly dates: {
    readonly created: string
    readonly updated: string
    readonly due: string
  }
}

export type Sprint = {
  readonly id: string
  readonly name: string
  readonly goal: string
  readonly issues: readonly Issue[]
}
