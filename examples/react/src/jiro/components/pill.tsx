type Props = {
  readonly text: string
  readonly tone?: 'neutral' | 'accent' | 'success' | 'alert'
}

function toneClass(tone: Props['tone']): string {
  if (tone === 'accent') {
    return 'pill-accent'
  }
  if (tone === 'success') {
    return 'pill-success'
  }
  if (tone === 'alert') {
    return 'pill-alert'
  }
  return 'pill-neutral'
}

function Pill({ text, tone = 'neutral' }: Props) {
  return <span className={`pill ${toneClass(tone)}`}>{text}</span>
}

export default Pill
