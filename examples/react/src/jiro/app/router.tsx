import { Navigate, Route, Routes } from 'react-router-dom'
import BacklogPage from '../views/backlog-page'
import BoardPage from '../views/board-page'
import IssuePage from '../views/issue-page'
import ProjectsPage from '../views/projects-page'

function JiroRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/projects" replace />} />
      <Route path="/projects" element={<ProjectsPage />} />
      <Route path="/project/:key/board" element={<BoardPage />} />
      <Route path="/project/:key/backlog" element={<BacklogPage />} />
      <Route path="/project/:key/issue/:id" element={<IssuePage />} />
      <Route path="*" element={<Navigate to="/projects" replace />} />
    </Routes>
  )
}

export default JiroRouter
