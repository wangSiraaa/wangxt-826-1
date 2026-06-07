import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleNames = {
    vet: '兽医',
    lab: '化验员',
    pharmacy: '药房',
    archivist: '档案员'
  };

  const navItems = [
    { path: '/', label: '首页' },
    { path: '/pets', label: '宠物档案' },
    { path: '/visits', label: '就诊记录' },
  ];

  if (hasRole('archivist')) {
    navItems.push({ path: '/archives', label: '归档管理' });
  }

  return (
    <div>
      <header className="header">
        <h1>🐾 动物诊疗病历归档系统</h1>
        <div className="user-info">
          <span>{user.name} ({roleNames[user.role]})</span>
          <button className="btn btn-secondary" onClick={handleLogout}>
            退出登录
          </button>
        </div>
      </header>
      
      <nav className="nav">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={location.pathname === item.path ? 'active' : ''}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      
      <main className="container">
        <Outlet />
      </main>
    </div>
  );
}
