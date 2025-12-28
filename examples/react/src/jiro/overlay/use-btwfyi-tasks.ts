import { useMemo } from 'react'
import type { CategoryConfig } from 'btwfyi/react'
import type { ViewState } from '../state/view-context'

type OverlayResult = {
  readonly categories: readonly CategoryConfig[]
  readonly category: string
}

function buildLoadCategory(view: ViewState): CategoryConfig {
  const activeStage = view.stage.current === 'idle' ? 'shell' : view.stage.current
  return {
    id: 'load',
    displayName: 'This page is still loading',
    items: [
      {
        text: 'The chrome is busy',
        action: 'WAIT',
        description: 'Frame pieces draw first.',
        info: `Stage: ${activeStage}`,
        priority: 'medium',
        tags: ['staged', 'ui'],
      },
      {
        text: 'Content shows up last',
        action: 'WAIT',
        description: 'Data waits for the slowest part.',
        info: view.stage.done ? 'You waited long enough' : 'Still pacing itself',
        priority: view.stage.done ? 'low' : 'medium',
        tags: ['load', 'pace'],
      },
    ],
  }
}

function buildProcessCategory(): CategoryConfig {
  return {
    id: 'process',
    displayName: 'Process',
    items: [
      {
        text: 'Move ticket to In Progress',
        action: 'DO',
        description: 'Pretend the swimlane matters.',
        info: 'Just change the status.',
        priority: 'medium',
        tags: ['flow'],
      },
      {
        text: 'Add comment: still working on this',
        action: 'WRITE',
        description: 'Signal without meaning.',
        info: 'Keep it short.',
        priority: 'medium',
        tags: ['status'],
      },
      {
        text: 'Schedule grooming',
        action: 'PLAN',
        description: 'Push discomfort into next week.',
        info: 'Put it on the calendar.',
        priority: 'low',
        tags: ['ritual'],
      },
      {
        text: 'Close ticket because sprint is ending',
        action: 'CLOSE',
        description: 'Declare victory to stop the clock.',
        info: 'No one checks anyway.',
        priority: 'high',
        tags: ['deadline'],
      },
    ],
  }
}

function buildTheaterCategory(): CategoryConfig {
  return {
    id: 'theater',
    displayName: 'Performance theater',
    items: [
      {
        text: 'Virtualize the list',
        action: 'PERF',
        description: 'Pretend it fixes everything.',
        info: 'Adds complexity fast.',
        priority: 'medium',
        tags: ['perf', 'list'],
      },
      {
        text: 'Remove virtualization because it is slower',
        action: 'PERF',
        description: 'Undo the last fix.',
        info: 'Now it feels lighter.',
        priority: 'medium',
        tags: ['perf', 'rollbacks'],
      },
      {
        text: 'Add it back after a perf review',
        action: 'PERF',
        description: 'It was always about optics.',
        info: 'Slides look better now.',
        priority: 'low',
        tags: ['perf', 'review'],
      },
    ],
  }
}

function buildBacklogCategory(): CategoryConfig {
  return {
    id: 'backlog',
    displayName: 'Backlog',
    items: [
      {
        text: 'This list is infinite',
        action: 'READ',
        description: 'No one finishes scrolling.',
        info: 'New items spawn overnight.',
        priority: 'medium',
        tags: ['backlog'],
      },
      {
        text: 'Only three items matter',
        action: 'READ',
        description: 'They are never on top.',
        info: 'Filters never help.',
        priority: 'high',
        tags: ['priority'],
      },
      {
        text: 'You will not scroll to them',
        action: 'READ',
        description: 'The fatigue is the point.',
        info: 'Accept the drift.',
        priority: 'medium',
        tags: ['backlog', 'scroll'],
      },
    ],
  }
}

function buildFocusItem(view: ViewState) {
  if (view.view === 'issue' && view.issueId) {
    return {
      text: `Stay on ${view.issueId}`,
      action: 'FOCUS',
      description: 'Do the work, not the ceremony.',
      info: 'One issue is enough.',
      priority: 'high',
      tags: ['focus', 'issue'],
    }
  }
  if (view.view === 'board' && view.projectKey) {
    return {
      text: `Pull one card in ${view.projectKey}`,
      action: 'FOCUS',
      description: 'Pick a single status change.',
      info: 'Move it once.',
      priority: 'high',
      tags: ['board', 'flow'],
    }
  }
  if (view.view === 'backlog' && view.projectKey) {
    return {
      text: `Pick a top item in ${view.projectKey}`,
      action: 'FOCUS',
      description: 'Stop browsing the queue.',
      info: 'One selection beats more filters.',
      priority: 'high',
      tags: ['backlog', 'focus'],
    }
  }
  return {
    text: 'Fix the actual bug',
    action: 'FOCUS',
    description: 'Not the ticket, not the description.',
    info: 'Do the work you came here to do.',
    priority: 'high',
    tags: ['focus'],
  }
}

function buildRecallCategory(view: ViewState): CategoryConfig {
  return {
    id: 'recall',
    displayName: 'What you were doing',
    items: [
      buildFocusItem(view),
      {
        text: 'Not the ticket',
        action: 'FOCUS',
        description: 'Ignore the ceremony.',
        info: 'Skip the template.',
        priority: 'medium',
        tags: ['focus'],
      },
      {
        text: 'Not the description',
        action: 'FOCUS',
        description: 'Details can wait.',
        info: 'Context stays in your head.',
        priority: 'low',
        tags: ['focus'],
      },
    ],
  }
}

function useBtwfyiTasks(view: ViewState): OverlayResult {
  return useMemo(() => {
    const categories: CategoryConfig[] = [
      buildLoadCategory(view),
      buildProcessCategory(),
      buildTheaterCategory(),
      buildBacklogCategory(),
      buildRecallCategory(view),
    ]
    return {
      categories,
      category: view.view === 'issue' ? 'recall' : 'process',
    }
  }, [view])
}

export { useBtwfyiTasks }
