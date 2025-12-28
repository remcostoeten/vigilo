import type { Issue, IssueStatus, Sprint } from '../state/jiro-types'

type IssueSeed = {
  readonly title: string
  readonly status: IssueStatus
  readonly priority: Issue['priority']
  readonly assignee: string
  readonly storyPoints: number
  readonly labels: readonly string[]
  readonly description: string
}

const seeds: readonly IssueSeed[] = [
  {
    title: 'Auth gateway loops on stale tokens',
    status: 'backlog',
    priority: 'high',
    assignee: 'Mae Hsu',
    storyPoints: 5,
    labels: ['auth', 'platform'],
    description: 'Token cache and upstream timing keep diverging.',
  },
  {
    title: 'Batch jobs ignore maintenance window',
    status: 'selected',
    priority: 'medium',
    assignee: 'Rita Chen',
    storyPoints: 3,
    labels: ['ops', 'scheduler'],
    description: 'Downtime flag applied after jobs already queued.',
  },
  {
    title: 'Search index drops synonyms',
    status: 'progress',
    priority: 'high',
    assignee: 'Dev Patel',
    storyPoints: 8,
    labels: ['search', 'ui'],
    description: 'Synonym list loads but scoring discards tokens.',
  },
  {
    title: 'Navigation layout shifts on resize',
    status: 'review',
    priority: 'medium',
    assignee: 'Leo Page',
    storyPoints: 3,
    labels: ['ui', 'layout'],
    description: 'Dense view loses track of primary action placement.',
  },
  {
    title: 'Release toggle missing audit trail',
    status: 'done',
    priority: 'low',
    assignee: 'Mae Hsu',
    storyPoints: 2,
    labels: ['platform', 'audit'],
    description: 'Deployment trail never stored origin on change.',
  },
  {
    title: 'Incident feed stalls on filters',
    status: 'backlog',
    priority: 'medium',
    assignee: 'Rita Chen',
    storyPoints: 5,
    labels: ['ops', 'feed'],
    description: 'Filter chain blocks stream because of chained debounce.',
  },
  {
    title: 'Story template duplicates sections',
    status: 'selected',
    priority: 'low',
    assignee: 'Dev Patel',
    storyPoints: 2,
    labels: ['ui', 'content'],
    description: 'Template migration leaves phantom markdown fragments.',
  },
  {
    title: 'Attachment preview never unloads',
    status: 'progress',
    priority: 'medium',
    assignee: 'Leo Page',
    storyPoints: 5,
    labels: ['storage', 'ui'],
    description: 'Preview queue keeps decoding images in background.',
  },
  {
    title: 'Sprint burndown drifts after midday',
    status: 'review',
    priority: 'high',
    assignee: 'Mae Hsu',
    storyPoints: 3,
    labels: ['metrics', 'charts'],
    description: 'Cache warms with stale timezone offsets.',
  },
  {
    title: 'Recurring reminders overlap',
    status: 'done',
    priority: 'medium',
    assignee: 'Rita Chen',
    storyPoints: 2,
    labels: ['ops', 'notifications'],
    description: 'Series recalculation ignores skip rules.',
  },
]

function makeIssueId(projectKey: string, index: number): string {
  return `${projectKey}-${(index + 1).toString().padStart(3, '0')}`
}

function inflate(projectKey: string): Issue[] {
  const list: Issue[] = []
  seeds.forEach((seed, seedIndex) => {
    const baseId = seedIndex * 3
    const copies = seed.status === 'backlog' ? 5 : seed.status === 'selected' ? 4 : 3
    for (let copyIndex = 0; copyIndex < copies; copyIndex += 1) {
      const issueIndex = baseId + copyIndex
      const id = makeIssueId(projectKey, issueIndex)
      const status = seed.status === 'backlog' && copyIndex > 2 ? 'selected' : seed.status
      const labels = copyIndex % 2 === 0 ? seed.labels : [...seed.labels, 'carry']
      const description =
        copyIndex === 0
          ? seed.description
          : `${seed.description} The backlog never shrinks; this is the ${copyIndex + 1}th reminder.`

      list.push({
        id,
        key: id,
        projectKey,
        title: seed.title,
        status,
        priority: copyIndex === 0 ? seed.priority : 'medium',
        assignee: seed.assignee,
        storyPoints: seed.storyPoints + (copyIndex % 2),
        labels,
        description,
        dates: {
          created: '2024-04-12',
          updated: '2024-09-18',
          due: '2024-10-04',
        },
      })
    }
  })
  return list
}

function getIssues(projectKey: string): readonly Issue[] {
  return inflate(projectKey)
}

function getIssue(projectKey: string, issueId: string): Issue | undefined {
  return getIssues(projectKey).find((issue) => issue.id === issueId)
}

function getSprints(projectKey: string): readonly Sprint[] {
  const issues = getIssues(projectKey)
  const mid = Math.floor(issues.length / 3)
  const upper = Math.floor(issues.length / 2)
  return [
    {
      id: `${projectKey}-SPR-1`,
      name: 'Sprint Nine',
      goal: 'Ship the thing everyone is waiting for.',
      issues: issues.slice(0, mid),
    },
    {
      id: `${projectKey}-SPR-2`,
      name: 'Sprint Ten',
      goal: 'Stabilize what already shipped.',
      issues: issues.slice(mid, upper),
    },
    {
      id: `${projectKey}-SPR-3`,
      name: 'Sprint Eleven',
      goal: 'Reduce scope but still pretend velocity is fine.',
      issues: issues.slice(upper),
    },
  ]
}

export { getIssue, getIssues, getSprints }
