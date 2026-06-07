import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Pets from './pages/Pets.jsx'
import PetDetail from './pages/PetDetail.jsx'
import Visits from './pages/Visits.jsx'
import VisitDetail from './pages/VisitDetail.jsx'
import Archives from './pages/Archives.jsx'

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()

  if (loading) return <div>加载中...</div>

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return children
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="pets" element={<Pets />} />
        <Route path="pets/:id" element={<PetDetail />} />
        <Route path="visits" element={<Visits />} />
        <Route path="visits/:id" element={<VisitDetail />} />
        <Route path="archives" element={
          <ProtectedRoute roles={['archivist', 'vet']}>
            <Archives />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  )
}

export default App
