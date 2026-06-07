import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Pets from './pages/Pets';
import PetDetail from './pages/PetDetail';
import Visits from './pages/Visits';
import VisitDetail from './pages/VisitDetail';
import Archives from './pages/Archives';
import Layout from './components/Layout';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>加载中...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      
      <Route element={user ? <Layout /> : <Navigate to="/login" />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/pets" element={<Pets />} />
        <Route path="/pets/:id" element={<PetDetail />} />
        <Route path="/visits" element={<Visits />} />
        <Route path="/visits/:id" element={<VisitDetail />} />
        <Route path="/archives" element={<Archives />} />
      </Route>
    </Routes>
  );
}

export default App;
