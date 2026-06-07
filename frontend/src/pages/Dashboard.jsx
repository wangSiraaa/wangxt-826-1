import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const [stats, setStats] = useState({ pets: 0, visits: 0, archived: 0, pending: 0 });
  const [recentVisits, setRecentVisits] = useState([]);
  const { user, hasRole } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const visitsRes = await api.get('/visits');
      const petsRes = await api.get('/pets');
      
      const visits = visitsRes.data.visits;
      const archived = visits.filter(v => v.status === 'archived').length;
      const pending = visits.filter(v => v.status !== 'archived').length;
      
      setStats({
        pets: petsRes.data.pets.length,
        visits: visits.length,
        archived,
        pending
      });
      
      setRecentVisits(visits.slice(0, 5));
    } catch (err) {
      console.error('加载数据失败:', err);
    }
  };

  const roleNames = {
    vet: '兽医',
    lab: '化验员',
    pharmacy: '药房',
    archivist: '档案员'
  };

  return (
    <div>
      <div className="card">
        <h2>欢迎，{user.name}！</h2>
        <p>您的角色是：{roleNames[user.role]}</p>
      </div>

      <div className="grid grid-2" style={{ marginBottom: '1rem' }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white' }}>
          <h3 style={{ borderBottomColor: 'rgba(255,255,255,0.3)', color: 'white' }}>宠物档案</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.pets}</p>
          <Link to="/pets" style={{ color: 'rgba(255,255,255,0.8)' }}>查看全部 →</Link>
        </div>
        
        <div className="card" style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)', color: 'white' }}>
          <h3 style={{ borderBottomColor: 'rgba(255,255,255,0.3)', color: 'white' }}>就诊记录</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.visits}</p>
          <Link to="/visits" style={{ color: 'rgba(255,255,255,0.8)' }}>查看全部 →</Link>
        </div>
        
        <div className="card" style={{ background: 'linear-gradient(135deg, #4facfe, #00f2fe)', color: 'white' }}>
          <h3 style={{ borderBottomColor: 'rgba(255,255,255,0.3)', color: 'white' }}>待处理</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.pending}</p>
        </div>
        
        <div className="card" style={{ background: 'linear-gradient(135deg, #43e97b, #38f9d7)', color: 'white' }}>
          <h3 style={{ borderBottomColor: 'rgba(255,255,255,0.3)', color: 'white' }}>已归档</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.archived}</p>
          {hasRole('archivist') && (
            <Link to="/archives" style={{ color: 'rgba(255,255,255,0.8)' }}>归档管理 →</Link>
          )}
        </div>
      </div>

      <div className="card">
        <h2>最近就诊记录</h2>
        <table className="table">
          <thead>
            <tr>
              <th>宠物</th>
              <th>主人</th>
              <th>日期</th>
              <th>兽医</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {recentVisits.map((visit) => (
              <tr key={visit.id}>
                <td>{visit.pet_name} ({visit.species})</td>
                <td>{visit.owner_name}</td>
                <td>{new Date(visit.visit_date).toLocaleString()}</td>
                <td>{visit.vet_name || '-'}</td>
                <td>
                  <span className={`badge ${visit.status === 'archived' ? 'badge-success' : 'badge-warning'}`}>
                    {visit.status === 'archived' ? '已归档' : '进行中'}
                  </span>
                </td>
                <td>
                  <Link to={`/visits/${visit.id}`}>
                    <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>
                      查看
                    </button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
