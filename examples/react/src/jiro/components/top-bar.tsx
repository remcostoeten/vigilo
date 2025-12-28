import Pill from './pill'
import SkeletonBlock from './skeleton-block'

type Props = {
  readonly title: string
  readonly subtitle?: string
  readonly projectKey?: string
  readonly stageLabel?: string
  readonly loading: boolean
}

function TopBar({ title, subtitle, projectKey, stageLabel, loading }: Props) {
  return (
    <header className="top-bar" aria-busy={loading}>
      <div className="top-text">
        {loading ? (
          <SkeletonBlock width="10rem" height="1.4rem" />
        ) : (
          <div className="top-title">
            <span className="crumb">Projects</span>
            {projectKey ? (
              <>
                <span className="crumb-sep">/</span>
                <span className="crumb">{projectKey}</span>
              </>
            ) : null}
            <span className="crumb-sep">/</span>
            <span className="crumb">{title}</span>
          </div>
        )}
        {subtitle && !loading ? (
          <div className="top-sub">{subtitle}</div>
        ) : (
          loading && <SkeletonBlock width="14rem" height="1rem" />
        )}
      </div>
      <div className="top-actions">
        <div className="control">
          <input
            type="search"
            className="control-input"
            placeholder="Search issues"
            aria-label="Search issues"
          />
        </div>
        <div className="control">
          <button type="button" className="control-btn">
            Filters
          </button>
          <button type="button" className="control-btn">
            Insights
          </button>
        </div>
        <div className="control">
          <Pill text={stageLabel ?? 'staging'} tone="accent" />
        </div>
      </div>
    </header>
  )
}

export default TopBar
