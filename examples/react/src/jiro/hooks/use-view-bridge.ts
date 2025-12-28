import { useEffect, useMemo } from 'react'
import type { StageState } from '../staged-load/stage-types'
import { getStageSnapshot } from '../staged-load/use-stage-load'
import type { ViewKind } from '../state/view-context'
import { useViewSet } from '../state/view-context'

type BridgeInput = {
  readonly view: ViewKind
  readonly projectKey?: string
  readonly issueId?: string
  readonly stage: StageState
}

function useViewBridge(input: BridgeInput) {
  const setView = useViewSet()
  const snapshot = useMemo(() => getStageSnapshot(input.stage), [input.stage])

  useEffect(() => {
    setView({
      view: input.view,
      projectKey: input.projectKey,
      issueId: input.issueId,
      stage: snapshot,
    })
  }, [input.issueId, input.projectKey, input.view, setView, snapshot])
}

export { useViewBridge }
