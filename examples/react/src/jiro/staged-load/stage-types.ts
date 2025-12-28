export type StageStep = {
  readonly id: string
  readonly ms: number
}

export type StageState = {
  readonly current: string
  readonly index: number
  readonly done: boolean
  readonly ready: (id: string) => boolean
}

export type StageSnapshot = {
  readonly current: string
  readonly done: boolean
  readonly index: number
}
