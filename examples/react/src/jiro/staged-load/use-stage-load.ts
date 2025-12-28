import { useEffect, useMemo, useState } from 'react'
import type { StageSnapshot, StageState, StageStep } from './stage-types'

function stageKey(plan: readonly StageStep[], index: number): string {
  if (index === 0) {
    return 'idle'
  }
  const step = plan[Math.min(index - 1, plan.length - 1)]
  return step ? step.id : 'idle'
}

function makeReady(plan: readonly StageStep[], index: number, id: string): boolean {
  const target = plan.findIndex((step) => step.id === id)
  if (target === -1) {
    return true
  }
  return index > target
}

function useStageLoad(plan: readonly StageStep[]): StageState {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    function run(nextIndex: number) {
      if (cancelled || nextIndex >= plan.length) {
        return
      }
      timer = setTimeout(() => {
        if (cancelled) {
          return
        }
        setIndex(nextIndex + 1)
        run(nextIndex + 1)
      }, plan[nextIndex].ms)
    }

    setIndex(0)
    run(0)

    return () => {
      cancelled = true
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [plan])

  const ready = useMemo(() => {
    return (id: string) => makeReady(plan, index, id)
  }, [plan, index])

  const current = stageKey(plan, index)
  const done = index >= plan.length

  return { current, index, ready, done }
}

function getStageSnapshot(state: StageState): StageSnapshot {
  return {
    current: state.current,
    done: state.done,
    index: state.index,
  }
}

export { getStageSnapshot, useStageLoad }
