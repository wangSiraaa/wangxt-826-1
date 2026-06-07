#!/usr/bin/env python3
import os

frontend_dir = os.path.join(os.getcwd(), 'frontend')
src_dir = os.path.join(frontend_dir, 'src')
pages_dir = os.path.join(src_dir, 'pages')
components_dir = os.path.join(src_dir, 'components')
context_dir = os.path.join(src_dir, 'context')

files = {}

files['vite.config.js'] = r'''import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist'
  }
})
'''

files['index.html'] = r'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>动物诊疗病历归档系统</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
'''

files['src/main.jsx'] = r'''import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>,
)
'''

files['src/index.css'] = r'''* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: #f5f7fa;
  color: #333;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  font-size: 1.5rem;
  font-weight: 600;
}

.header .user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header button {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.header button:hover {
  background: rgba(255, 255, 255, 0.3);
}

.nav {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0 24px;
}

.nav ul {
  display: flex;
  list-style: none;
  gap: 4px;
}

.nav a {
  display: block;
  padding: 16px 20px;
  color: #666;
  text-decoration: none;
  border-bottom: 3px solid transparent;
  transition: all 0.2s;
}

.nav a:hover {
  color: #667eea;
}

.nav a.active {
  color: #667eea;
  border-bottom-color: #667eea;
}

.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 24px;
  margin-bottom: 20px;
}

.card h2 {
  font-size: 1.25rem;
  margin-bottom: 16px;
  color: #333;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover {
  background: #059669;
}

.btn-warning {
  background: #f59e0b;
  color: white;
}

.btn-warning:hover {
  background: #d97706;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

.btn-secondary {
  background: #e5e7eb;
  color: #374151;
}

.btn-secondary:hover {
  background: #d1d5db;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

table {
  width: 100%;
  border-collapse: collapse;
}

table th,
table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
}

table tr:hover {
  background: #f9fafb;
}

.badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.badge-active {
  background: #dcfce7;
  color: #166534;
}

.badge-pending {
  background: #fef3c7;
  color: #92400e;
}

.badge-completed {
  background: #dbeafe;
  color: #1e40af;
}

.badge-archived {
  background: #e5e7eb;
  color: #374151;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #374151;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal h3 {
  font-size: 1.25rem;
  margin-bottom: 20px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.tabs {
  display: flex;
  border-bottom: 2px solid #e5e7eb;
  margin-bottom: 20px;
}

.tabs button {
  background: none;
  border: none;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all 0.2s;
}

.tabs button:hover {
  color: #667eea;
}

.tabs button.active {
  color: #667eea;
  border-bottom-color: #667eea;
}

.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  background: white;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 420px;
}

.login-card h1 {
  text-align: center;
  color: #333;
  margin-bottom: 8px;
}

.login-card .subtitle {
  text-align: center;
  color: #6b7280;
  margin-bottom: 32px;
}

.login-card button {
  width: 100%;
  padding: 12px;
}

.dashboard-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.stat-card .stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: #667eea;
}

.stat-card .stat-label {
  color: #6b7280;
  font-size: 14px;
  margin-top: 4px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.info-item {
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.info-item .label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.info-item .value {
  font-weight: 500;
  color: #374151;
}

.alert {
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.alert-error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.alert-success {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.alert-warning {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #9ca3af;
}
'''

files['src/api.js'] = r'''import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
'''

files['src/context/AuthContext.jsx'] = r'''import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (token && savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    const response = await api.post('/auth/login', { username, password })
    const { token, user } = response.data
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setUser(user)
    return user
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const hasRole = (role) => {
    return user?.role === role
  }

  const hasAnyRole = (roles) => {
    return roles.includes(user?.role)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, hasRole, hasAnyRole, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
'''

files['src/App.jsx'] = r'''import { Routes, Route, Navigate } from 'react-router-dom'
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
'''

files['src/components/Layout.jsx'] = r'''import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const roleNames = {
  vet: '兽医',
  lab: '化验员',
  pharmacy: '药房',
  archivist: '档案员'
}

export default function Layout() {
  const { user, logout, hasRole } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div>
      <header className="header">
        <h1>🐾 动物诊疗病历归档系统</h1>
        <div className="user-info">
          <span>{user.name}（{roleNames[user.role]}）</span>
          <button onClick={handleLogout}>退出登录</button>
        </div>
      </header>
      <nav className="nav">
        <ul>
          <li><NavLink to="/" end>首页</NavLink></li>
          <li><NavLink to="/pets">宠物档案</NavLink></li>
          <li><NavLink to="/visits">就诊记录</NavLink></li>
          {hasRole('archivist') && (
            <li><NavLink to="/archives">归档管理</NavLink></li>
          )}
        </ul>
      </nav>
      <main className="container">
        <Outlet />
      </main>
    </div>
  )
}
'''

files['src/pages/Login.jsx'] = r'''import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(username, password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>🐾 动物诊疗病历归档系统</h1>
        <p className="subtitle">请登录您的账号</p>
        
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              required
            />
          </div>
          <div className="form-group">
            <label>密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>测试账号：</p>
          <div style={{ fontSize: '12px', color: '#9ca3af', lineHeight: '1.8' }}>
            <div>兽医: vet01 / vet123</div>
            <div>化验员: lab01 / lab123</div>
            <div>药房: pharm01 / pharm123</div>
            <div>档案员: arch01 / arch123</div>
          </div>
        </div>
      </div>
    </div>
  )
}
'''

files['src/pages/Dashboard.jsx'] = r'''import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function Dashboard() {
  const [stats, setStats] = useState({ pets: 0, visits: 0, pending: 0, archived: 0 })
  const [recentVisits, setRecentVisits] = useState([])
  const { user, hasRole } = useAuth()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [visitsRes] = await Promise.all([
        api.get('/visits')
      ])
      const visits = visitsRes.data.visits
      
      setStats({
        pets: visits.filter((v, i, arr) => arr.findIndex(x => x.pet_id === v.pet_id) === i).length,
        visits: visits.length,
        pending: visits.filter(v => v.status === 'active').length,
        archived: visits.filter(v => v.status === 'archived').length
      })
      
      setRecentVisits(visits.slice(0, 5))
    } catch (err) {
      console.error('加载数据失败', err)
    }
  }

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>欢迎回来，{user.name}！</h2>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-number">{stats.pets}</div>
          <div className="stat-label">宠物档案</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.visits}</div>
          <div className="stat-label">就诊记录</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.pending}</div>
          <div className="stat-label">进行中</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.archived}</div>
          <div className="stat-label">已归档</div>
        </div>
      </div>

      <div className="card">
        <h2>最近就诊记录</h2>
        {recentVisits.length === 0 ? (
          <div className="empty-state">暂无就诊记录</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>宠物名称</th>
                <th>种类</th>
                <th>主人</th>
                <th>主治兽医</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {recentVisits.map(visit => (
                <tr key={visit.id}>
                  <td>{visit.pet_name}</td>
                  <td>{visit.species}</td>
                  <td>{visit.owner_name}</td>
                  <td>{visit.vet_name || '-'}</td>
                  <td>
                    <span className={`badge badge-${visit.status}`}>
                      {visit.status === 'active' ? '进行中' : visit.status === 'completed' ? '已完成' : '已归档'}
                    </span>
                  </td>
                  <td>
                    <Link to={`/visits/${visit.id}`} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                      查看详情
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {hasRole('vet') && (
        <div style={{ display: 'flex', gap: '16px' }}>
          <Link to="/pets" className="btn btn-primary">
            管理宠物档案
          </Link>
          <Link to="/visits" className="btn btn-success">
            管理就诊记录
          </Link>
        </div>
      )}
    </div>
  )
}
'''

files['src/pages/Pets.jsx'] = r'''import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function Pets() {
  const [pets, setPets] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    species: '',
    breed: '',
    age: '',
    gender: '',
    owner_name: '',
    owner_phone: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { hasRole } = useAuth()

  useEffect(() => {
    loadPets()
  }, [])

  const loadPets = async () => {
    try {
      const res = await api.get('/pets')
      setPets(res.data.pets)
    } catch (err) {
      console.error('加载宠物档案失败', err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await api.post('/pets', formData)
      setShowModal(false)
      setFormData({
        name: '',
        species: '',
        breed: '',
        age: '',
        gender: '',
        owner_name: '',
        owner_phone: ''
      })
      loadPets()
    } catch (err) {
      setError(err.response?.data?.error || '创建失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>宠物档案</h2>
        {hasRole('vet') && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + 新建宠物档案
          </button>
        )}
      </div>

      <div className="card">
        {pets.length === 0 ? (
          <div className="empty-state">暂无宠物档案</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>名称</th>
                <th>种类</th>
                <th>品种</th>
                <th>年龄</th>
                <th>性别</th>
                <th>主人姓名</th>
                <th>主人电话</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {pets.map(pet => (
                <tr key={pet.id}>
                  <td>{pet.name}</td>
                  <td>{pet.species}</td>
                  <td>{pet.breed || '-'}</td>
                  <td>{pet.age || '-'}</td>
                  <td>{pet.gender || '-'}</td>
                  <td>{pet.owner_name}</td>
                  <td>{pet.owner_phone || '-'}</td>
                  <td>
                    <Link to={`/pets/${pet.id}`} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                      查看
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>新建宠物档案</h3>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>宠物名称 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>种类 *</label>
                  <input
                    type="text"
                    value={formData.species}
                    onChange={e => setFormData({ ...formData, species: e.target.value })}
                    placeholder="如：狗、猫"
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>品种</label>
                  <input
                    type="text"
                    value={formData.breed}
                    onChange={e => setFormData({ ...formData, breed: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>年龄</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={e => setFormData({ ...formData, age: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>性别</label>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="">请选择</option>
                    <option value="公">公</option>
                    <option value="母">母</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>主人电话</label>
                  <input
                    type="tel"
                    value={formData.owner_phone}
                    onChange={e => setFormData({ ...formData, owner_phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>主人姓名 *</label>
                <input
                  type="text"
                  value={formData.owner_name}
                  onChange={e => setFormData({ ...formData, owner_name: e.target.value })}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? '创建中...' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
'''

files['src/pages/PetDetail.jsx'] = r'''import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api.js'

export default function PetDetail() {
  const { id } = useParams()
  const [pet, setPet] = useState(null)
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPet()
  }, [id])

  const loadPet = async () => {
    try {
      const res = await api.get(`/pets/${id}`)
      setPet(res.data.pet)
      setVisits(res.data.visits || [])
    } catch (err) {
      console.error('加载宠物详情失败', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>加载中...</div>
  if (!pet) return <div>宠物档案不存在</div>

  return (
    <div>
      <Link to="/pets" style={{ color: '#667eea', textDecoration: 'none', marginBottom: '16px', display: 'inline-block' }}>
        ← 返回宠物列表
      </Link>

      <div className="card">
        <h2>{pet.name} 的档案</h2>
        <div className="info-grid">
          <div className="info-item">
            <div className="label">种类</div>
            <div className="value">{pet.species}</div>
          </div>
          <div className="info-item">
            <div className="label">品种</div>
            <div className="value">{pet.breed || '-'}</div>
          </div>
          <div className="info-item">
            <div className="label">年龄</div>
            <div className="value">{pet.age || '-'}</div>
          </div>
          <div className="info-item">
            <div className="label">性别</div>
            <div className="value">{pet.gender || '-'}</div>
          </div>
          <div className="info-item">
            <div className="label">主人姓名</div>
            <div className="value">{pet.owner_name}</div>
          </div>
          <div className="info-item">
            <div className="label">主人电话</div>
            <div className="value">{pet.owner_phone || '-'}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>就诊历史</h2>
        {visits.length === 0 ? (
          <div className="empty-state">暂无就诊记录</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>就诊时间</th>
                <th>主诉</th>
                <th>诊断</th>
                <th>主治兽医</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {visits.map(visit => (
                <tr key={visit.id}>
                  <td>{new Date(visit.visit_date).toLocaleString('zh-CN')}</td>
                  <td>{visit.chief_complaint || '-'}</td>
                  <td>{visit.diagnosis || '-'}</td>
                  <td>{visit.vet_name || '-'}</td>
                  <td>
                    <span className={`badge badge-${visit.status}`}>
                      {visit.status === 'active' ? '进行中' : visit.status === 'completed' ? '已完成' : '已归档'}
                    </span>
                  </td>
                  <td>
                    <Link to={`/visits/${visit.id}`} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                      查看
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
'''

files['src/pages/Visits.jsx'] = r'''import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function Visits() {
  const [visits, setVisits] = useState([])
  const [pets, setPets] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    pet_id: '',
    chief_complaint: '',
    diagnosis: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { hasRole } = useAuth()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [visitsRes, petsRes] = await Promise.all([
        api.get('/visits'),
        api.get('/pets')
      ])
      setVisits(visitsRes.data.visits)
      setPets(petsRes.data.pets)
    } catch (err) {
      console.error('加载数据失败', err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await api.post('/visits', formData)
      setShowModal(false)
      setFormData({ pet_id: '', chief_complaint: '', diagnosis: '' })
      loadData()
    } catch (err) {
      setError(err.response?.data?.error || '创建失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>就诊记录</h2>
        {hasRole('vet') && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + 新建就诊记录
          </button>
        )}
      </div>

      <div className="card">
        {visits.length === 0 ? (
          <div className="empty-state">暂无就诊记录</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>宠物名称</th>
                <th>种类</th>
                <th>主人</th>
                <th>主诉</th>
                <th>主治兽医</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {visits.map(visit => (
                <tr key={visit.id}>
                  <td>{visit.pet_name}</td>
                  <td>{visit.species}</td>
                  <td>{visit.owner_name}</td>
                  <td>{visit.chief_complaint || '-'}</td>
                  <td>{visit.vet_name || '-'}</td>
                  <td>
                    <span className={`badge badge-${visit.status}`}>
                      {visit.status === 'active' ? '进行中' : visit.status === 'completed' ? '已完成' : '已归档'}
                    </span>
                  </td>
                  <td>
                    <Link to={`/visits/${visit.id}`} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                      查看详情
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>新建就诊记录</h3>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>选择宠物 *</label>
                <select
                  value={formData.pet_id}
                  onChange={e => setFormData({ ...formData, pet_id: e.target.value })}
                  required
                >
                  <option value="">请选择宠物</option>
                  {pets.map(pet => (
                    <option key={pet.id} value={pet.id}>
                      {pet.name}（{pet.species} - {pet.owner_name}）
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>主诉</label>
                <textarea
                  value={formData.chief_complaint}
                  onChange={e => setFormData({ ...formData, chief_complaint: e.target.value })}
                  rows={3}
                  placeholder="宠物的主要症状和问题"
                />
              </div>
              <div className="form-group">
                <label>初步诊断</label>
                <textarea
                  value={formData.diagnosis}
                  onChange={e => setFormData({ ...formData, diagnosis: e.target.value })}
                  rows={3}
                  placeholder="医生的初步诊断结果"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? '创建中...' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
'''

files['src/pages/VisitDetail.jsx'] = r'''import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function VisitDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [visit, setVisit] = useState(null)
  const [prescriptions, setPrescriptions] = useState([])
  const [labOrders, setLabOrders] = useState([])
  const [archiveRecord, setArchiveRecord] = useState(null)
  const [activeTab, setActiveTab] = useState('info')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false)
  const [prescriptionForm, setPrescriptionForm] = useState({ medication: '', dosage: '', instructions: '' })
  
  const [showLabModal, setShowLabModal] = useState(false)
  const [labForm, setLabForm] = useState({ test_name: '' })
  
  const [labResultForm, setLabResultForm] = useState({})

  const { user, hasRole, hasAnyRole } = useAuth()

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      const res = await api.get(`/visits/${id}`)
      setVisit(res.data.visit)
      setPrescriptions(res.data.prescriptions || [])
      setLabOrders(res.data.labOrders || [])
      setArchiveRecord(res.data.archiveRecord || null)
    } catch (err) {
      console.error('加载就诊详情失败', err)
    } finally {
      setLoading(false)
    }
  }

  const clearMessages = () => {
    setError('')
    setSuccess('')
  }

  const handleAddPrescription = async (e) => {
    e.preventDefault()
    clearMessages()
    try {
      await api.post('/prescriptions', { ...prescriptionForm, visit_id: id })
      setShowPrescriptionModal(false)
      setPrescriptionForm({ medication: '', dosage: '', instructions: '' })
      setSuccess('处方添加成功')
      loadData()
    } catch (err) {
      setError(err.response?.data?.error || '添加失败')
    }
  }

  const handleVetSign = async (prescriptionId) => {
    clearMessages()
    try {
      await api.post(`/prescriptions/${prescriptionId}/vet-sign`)
      setSuccess('兽医签名成功')
      loadData()
    } catch (err) {
      setError(err.response?.data?.error || '签名失败')
    }
  }

  const handlePharmacySign = async (prescriptionId) => {
    clearMessages()
    try {
      await api.post(`/prescriptions/${prescriptionId}/pharmacy-sign`)
      setSuccess('药房确认成功')
      loadData()
    } catch (err) {
      setError(err.response?.data?.error || '确认失败')
    }
  }

  const handleCharge = async (prescriptionId) => {
    clearMessages()
    try {
      await api.post(`/prescriptions/${prescriptionId}/charge`)
      setSuccess('收费成功')
      loadData()
    } catch (err) {
      setError(err.response?.data?.error || '收费失败')
    }
  }

  const handleAddLab = async (e) => {
    e.preventDefault()
    clearMessages()
    try {
      await api.post('/lab-orders', { ...labForm, visit_id: id })
      setShowLabModal(false)
      setLabForm({ test_name: '' })
      setSuccess('检验单添加成功')
      loadData()
    } catch (err) {
      setError(err.response?.data?.error || '添加失败')
    }
  }

  const handleSubmitLabResult = async (labOrderId) => {
    clearMessages()
    try {
      const result = labResultForm[labOrderId]
      if (!result) {
        setError('请输入检验结果')
        return
      }
      await api.put(`/lab-orders/${labOrderId}/result`, { result })
      delete labResultForm[labOrderId]
      setSuccess('检验结果回填成功')
      loadData()
    } catch (err) {
      setError(err.response?.data?.error || '提交失败')
    }
  }

  const handleArchive = async () => {
    if (!window.confirm('确定要归档该就诊记录吗？归档后将不能修改。')) return
    clearMessages()
    try {
      await api.post(`/archives/${id}`)
      setSuccess('归档成功')
      loadData()
    } catch (err) {
      setError(err.response?.data?.error || '归档失败')
    }
  }

  if (loading) return <div>加载中...</div>
  if (!visit) return <div>就诊记录不存在</div>

  const isArchived = visit.status === 'archived'

  return (
    <div>
      <Link to="/visits" style={{ color: '#667eea', textDecoration: 'none', marginBottom: '16px', display: 'inline-block' }}>
        ← 返回就诊列表
      </Link>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {isArchived && (
        <div className="alert alert-warning">
          该病历已归档，仅可查看，不能修改。归档时间：{archiveRecord && new Date(archiveRecord.archived_at).toLocaleString('zh-CN')}，归档人：{archiveRecord?.archived_by_name}
        </div>
      )}

      <div className="card">
        <h2>就诊详情</h2>
        <div className="info-grid">
          <div className="info-item">
            <div className="label">宠物名称</div>
            <div className="value">{visit.pet_name}</div>
          </div>
          <div className="info-item">
            <div className="label">种类/品种</div>
            <div className="value">{visit.species} {visit.breed || ''}</div>
          </div>
          <div className="info-item">
            <div className="label">年龄/性别</div>
            <div className="value">{visit.age || '-'} / {visit.gender || '-'}</div>
          </div>
          <div className="info-item">
            <div className="label">主人</div>
            <div className="value">{visit.owner_name}</div>
          </div>
          <div className="info-item">
            <div className="label">主治兽医</div>
            <div className="value">{visit.vet_name || '-'}</div>
          </div>
          <div className="info-item">
            <div className="label">就诊时间</div>
            <div className="value">{new Date(visit.visit_date).toLocaleString('zh-CN')}</div>
          </div>
        </div>
        <div className="form-group">
          <label>主诉</label>
          <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
            {visit.chief_complaint || '无'}
          </div>
        </div>
        <div className="form-group">
          <label>诊断</label>
          <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
            {visit.diagnosis || '无'}
          </div>
        </div>
      </div>

      <div className="tabs">
        <button className={activeTab === 'prescriptions' ? 'active' : ''} onClick={() => setActiveTab('prescriptions')}>
          处方 ({prescriptions.length})
        </button>
        <button className={activeTab === 'lab' ? 'active' : ''} onClick={() => setActiveTab('lab')}>
          检验单 ({labOrders.length})
        </button>
        <button className={activeTab === 'archive' ? 'active' : ''} onClick={() => setActiveTab('archive')}>
          归档
        </button>
      </div>

      {activeTab === 'prescriptions' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>处方列表</h3>
            {hasRole('vet') && !isArchived && (
              <button className="btn btn-primary" onClick={() => setShowPrescriptionModal(true)}>
                + 添加处方
              </button>
            )}
          </div>
          {prescriptions.length === 0 ? (
            <div className="empty-state">暂无处方</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>药品名称</th>
                  <th>剂量</th>
                  <th>用法说明</th>
                  <th>兽医签名</th>
                  <th>药房确认</th>
                  <th>收费状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.map(pr => (
                  <tr key={pr.id}>
                    <td>{pr.medication}</td>
                    <td>{pr.dosage}</td>
                    <td>{pr.instructions || '-'}</td>
                    <td>
                      {pr.vet_signed ? (
                        <span className="badge badge-completed">已签名 - {pr.vet_signed_name}</span>
                      ) : (
                        <span className="badge badge-pending">未签名</span>
                      )}
                    </td>
                    <td>
                      {pr.pharmacy_signed ? (
                        <span className="badge badge-completed">已确认 - {pr.pharmacy_signed_name}</span>
                      ) : (
                        <span className="badge badge-pending">未确认</span>
                      )}
                    </td>
                    <td>
                      {pr.charged ? (
                        <span className="badge badge-completed">已收费</span>
                      ) : (
                        <span className="badge badge-pending">未收费</span>
                      )}
                    </td>
                    <td>
                      {!isArchived && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {hasRole('vet') && !pr.vet_signed && (
                            <button className="btn btn-success" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => handleVetSign(pr.id)}>
                              兽医签名
                            </button>
                          )}
                          {hasRole('pharmacy') && pr.vet_signed && !pr.pharmacy_signed && (
                            <button className="btn btn-success" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => handlePharmacySign(pr.id)}>
                              药房确认
                            </button>
                          )}
                          {hasRole('pharmacy') && !pr.charged && (
                            <button className="btn btn-warning" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => handleCharge(pr.id)}>
                              收费
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'lab' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>检验单列表</h3>
            {hasRole('vet') && !isArchived && (
              <button className="btn btn-primary" onClick={() => setShowLabModal(true)}>
                + 添加检验单
              </button>
            )}
          </div>
          {labOrders.length === 0 ? (
            <div className="empty-state">暂无检验单</div>
          ) : (
            <div>
              {labOrders.map(lo => (
                <div key={lo.id} className="card" style={{ marginBottom: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <strong>{lo.test_name}</strong>
                      <span style={{ marginLeft: '12px' }}>
                        <span className={`badge ${lo.status === 'completed' ? 'badge-completed' : 'badge-pending'}`}>
                          {lo.status === 'completed' ? '已完成' : '待回填'}
                        </span>
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      开单：{lo.requested_by_name} | {new Date(lo.requested_at).toLocaleString('zh-CN')}
                    </div>
                  </div>
                  {lo.status === 'completed' ? (
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                        检验结果（{lo.result_by_name}，{new Date(lo.result_at).toLocaleString('zh-CN')}）：
                      </div>
                      <div style={{ padding: '12px', background: '#f0fdf4', borderRadius: '8px' }}>
                        {lo.result}
                      </div>
                    </div>
                  ) : (
                    !isArchived && hasRole('lab') && (
                      <div>
                        <div className="form-group" style={{ marginBottom: '8px' }}>
                          <textarea
                            placeholder="请输入检验结果..."
                            rows={3}
                            value={labResultForm[lo.id] || ''}
                            onChange={e => setLabResultForm({ ...labResultForm, [lo.id]: e.target.value })}
                          />
                        </div>
                        <button 
                          className="btn btn-success" 
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          onClick={() => handleSubmitLabResult(lo.id)}
                        >
                          提交检验结果
                        </button>
                      </div>
                    )
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'archive' && (
        <div className="card">
          <h3>归档状态</h3>
          {isArchived ? (
            <div>
              <div className="alert alert-success">
                该病历已归档
              </div>
              <div className="info-grid">
                <div className="info-item">
                  <div className="label">归档人</div>
                  <div className="value">{archiveRecord?.archived_by_name}</div>
                </div>
                <div className="info-item">
                  <div className="label">归档时间</div>
                  <div className="value">{archiveRecord && new Date(archiveRecord.archived_at).toLocaleString('zh-CN')}</div>
                </div>
              </div>
              {archiveRecord?.notes && (
                <div className="form-group">
                  <label>归档备注</label>
                  <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                    {archiveRecord.notes}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="alert alert-warning">
                该病历尚未归档。归档前请确保：
                <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
                  <li>所有检验单已回填结果</li>
                  <li>所有处方已完成必要的签名</li>
                </ul>
              </div>
              {hasRole('archivist') && (
                <button className="btn btn-primary" onClick={handleArchive}>
                  执行归档
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {showPrescriptionModal && (
        <div className="modal-overlay" onClick={() => setShowPrescriptionModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>添加处方</h3>
            <form onSubmit={handleAddPrescription}>
              <div className="form-group">
                <label>药品名称 *</label>
                <input
                  type="text"
                  value={prescriptionForm.medication}
                  onChange={e => setPrescriptionForm({ ...prescriptionForm, medication: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>剂量 *</label>
                <input
                  type="text"
                  value={prescriptionForm.dosage}
                  onChange={e => setPrescriptionForm({ ...prescriptionForm, dosage: e.target.value })}
                  placeholder="如：每次1片，每日3次"
                  required
                />
              </div>
              <div className="form-group">
                <label>用法说明</label>
                <textarea
                  value={prescriptionForm.instructions}
                  onChange={e => setPrescriptionForm({ ...prescriptionForm, instructions: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPrescriptionModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  添加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLabModal && (
        <div className="modal-overlay" onClick={() => setShowLabModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>添加检验单</h3>
            <form onSubmit={handleAddLab}>
              <div className="form-group">
                <label>检验项目 *</label>
                <input
                  type="text"
                  value={labForm.test_name}
                  onChange={e => setLabForm({ ...labForm, test_name: e.target.value })}
                  placeholder="如：血常规、生化检查"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowLabModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  添加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
'''

files['src/pages/Archives.jsx'] = r'''import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function Archives() {
  const [archives, setArchives] = useState([])
  const [loading, setLoading] = useState(true)
  const { hasRole } = useAuth()

  useEffect(() => {
    loadArchives()
  }, [])

  const loadArchives = async () => {
    try {
      const res = await api.get('/archives')
      setArchives(res.data.archives)
    } catch (err) {
      console.error('加载归档记录失败', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>加载中...</div>

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>归档管理</h2>
      
      <div className="card">
        {archives.length === 0 ? (
          <div className="empty-state">暂无归档记录</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>宠物名称</th>
                <th>归档时间</th>
                <th>归档人</th>
                <th>备注</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {archives.map(arc => (
                <tr key={arc.id}>
                  <td>{arc.pet_name}</td>
                  <td>{new Date(arc.archived_at).toLocaleString('zh-CN')}</td>
                  <td>{arc.archived_by_name}</td>
                  <td>{arc.notes || '-'}</td>
                  <td>
                    <Link to={`/visits/${arc.visit_id}`} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                      查看病历
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
'''

print('开始创建前端文件...\n')

for filepath, content in files.items():
    fullpath = os.path.join(frontend_dir, filepath)
    os.makedirs(os.path.dirname(fullpath), exist_ok=True)
    with open(fullpath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'  ✓ {filepath}')

print('\n所有前端文件创建完成！')
