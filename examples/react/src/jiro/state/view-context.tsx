import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { StageSnapshot } from '../staged-load/stage-types'

type ViewKind = 'projects' | 'board' | 'backlog' | 'issue'

type ViewState = {
  readonly view: ViewKind
  readonly projectKey?: string
  readonly issueId?: string
  readonly stage: StageSnapshot
}

type Props = {
  readonly children: ReactNode
}

const defaultView: ViewState = {
  view: 'projects',
  stage: { current: 'idle', done: false, index: 0 },
}

const ViewValueContext = createContext<ViewState>(defaultView)
const ViewSetContext = createContext<(next: ViewState) => void>(() => {})

function sameView(prev: ViewState, next: ViewState): boolean {
  return (
    prev.view === next.view &&
    prev.projectKey === next.projectKey &&
    prev.issueId === next.issueId &&
    prev.stage.current === next.stage.current &&
    prev.stage.done === next.stage.done &&
    prev.stage.index === next.stage.index
  )
}

function ViewProvider({ children }: Props) {
  const [view, setView] = useState<ViewState>(defaultView)

  function update(next: ViewState) {
    setView(function compare(prev) {
      if (sameView(prev, next)) {
        return prev
      }
      return next
    })
  }

  const value = useMemo(() => view, [view])
  const setter = useMemo(() => update, [])

  return (
    <ViewValueContext.Provider value={value}>
      <ViewSetContext.Provider value={setter}>{children}</ViewSetContext.Provider>
    </ViewValueContext.Provider>
  )
}

function useView(): ViewState {
  return useContext(ViewValueContext)
}

function useViewSet(): (next: ViewState) => void {
  return useContext(ViewSetContext)
}

export type { ViewKind, ViewState }
export { ViewProvider, useView, useViewSet }
