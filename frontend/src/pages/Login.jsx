import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  const testAccounts = [
    { username: 'vet01', name: '张兽医', role: '兽医' },
    { username: 'lab01', name: '李化验员', role: '化验员' },
    { username: 'pharm01', name: '王药师', role: '药房' },
    { username: 'arch01', name: '赵档案员', role: '档案员' },
  ];

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>🐾 动物诊疗病历归档系统</h1>
        
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
          
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}
            disabled={loading}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
          <p style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: '#718096' }}>测试账号：</p>
          <div style={{ display: 'grid', gap: '0.25rem', fontSize: '0.8rem' }}>
            {testAccounts.map((acc) => (
              <div key={acc.username} style={{ color: '#4a5568' }}>
                {acc.role}: {acc.username} / {acc.username.replace(/[0-9]/g, '')}123
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
