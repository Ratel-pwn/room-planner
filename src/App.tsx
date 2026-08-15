import { Navigate, Route, Routes } from 'react-router'
import PlannerPage from '@/pages/PlannerPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/planner" replace />} />
      <Route path="/planner" element={<PlannerPage />} />
      <Route path="*" element={<Navigate to="/planner" replace />} />
    </Routes>
  )
}
