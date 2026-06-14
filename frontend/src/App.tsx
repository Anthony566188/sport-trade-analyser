import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/ui/Layout'
import { MatchesPage }      from './pages/MatchesPage'
import { NewMatchPage }     from './pages/NewMatchPage'
import { TimelinePage }     from './pages/TimelinePage'
import { CriteriaPage }     from './pages/CriteriaPage'
import { MethodsPage }      from './pages/MethodsPage'
import { TeamSearchDemo }   from './pages/TeamSearchDemo'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/"              element={<MatchesPage />} />
        <Route path="/matches/new"   element={<NewMatchPage />} />
        <Route path="/timeline/:id"  element={<TimelinePage />} />
        <Route path="/criteria"      element={<CriteriaPage />} />
        <Route path="/settings"      element={<MethodsPage />} />
        <Route path="/team-search"   element={<TeamSearchDemo />} />
        {/* Fallback */}
        <Route path="*"              element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
