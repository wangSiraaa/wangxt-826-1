import { Outlet, NavLink, useNavigate } from 'react-router-dom'
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
