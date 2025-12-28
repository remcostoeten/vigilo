import type { StageState, StageStep } from '../staged-load/stage-types'
import Pill from './pill'

type Props = {
  readonly steps: readonly StageStep[]
  readonly stage: StageState
}

function StageStrip({ steps, stage }: Props) {
  return (
    <div className="stage-strip" aria-live="polite">
      {steps.map((step) => {
        const ready = stage.ready(step.id)
        const tone = ready ? 'success' : 'neutral'
        return (
          <div key={step.id} className="stage-step">
            <Pill text={step.id} tone={tone} />
            <span className="stage-time">{step.ms}ms</span>
          </div>
        )
      })}
    </div>
  )
}

export default StageStrip
