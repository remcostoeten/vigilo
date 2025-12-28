import type { Project } from '../state/jiro-types'

const projects: readonly Project[] = [
  {
    key: 'ABC',
    name: 'Atlas Base',
    lead: 'Mae Hsu',
    category: 'Platform',
    summary: 'Foundation services for every other team',
    stats: { backlog: 32, board: 18, done: 142 },
  },
  {
    key: 'CORE',
    name: 'Core Stack',
    lead: 'Leo Page',
    category: 'Core',
    summary: 'Runtime tasks that never quite finish',
    stats: { backlog: 41, board: 23, done: 208 },
  },
  {
    key: 'OPS',
    name: 'Ops Loop',
    lead: 'Rita Chen',
    category: 'Operations',
    summary: 'Operational debt that renews itself weekly',
    stats: { backlog: 28, board: 11, done: 97 },
  },
  {
    key: 'UI',
    name: 'UI Fabric',
    lead: 'Dev Patel',
    category: 'Experience',
    summary: 'Front-end polish with perpetual tweaks',
    stats: { backlog: 53, board: 19, done: 184 },
  },
]

function getProjects(): readonly Project[] {
  return projects
}

function getProject(key: string): Project | undefined {
  return projects.find((project) => project.key === key)
}

export { getProject, getProjects }
