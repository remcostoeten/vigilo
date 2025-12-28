type Props = {
  readonly width?: string
  readonly height?: string
}

function SkeletonBlock({ width = '100%', height = '1rem' }: Props) {
  return <div className="skeleton" style={{ width, height }} aria-hidden="true" />
}

export default SkeletonBlock
