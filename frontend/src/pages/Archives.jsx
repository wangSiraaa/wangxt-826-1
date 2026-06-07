import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function Archives() {
  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArchives();
  }, []);

  const loadArchives = async () => {
    try {
      const res = await api.get('/archives');
      setArchives(res.data.archives);
    } catch (err) {
      console.error('加载归档记录失败:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="card">加载中...</div>;
  }

  return (
    <div>
      <div className="card">
        <h2>归档管理</h2>
        <table className="table">
          <thead>
            <tr>
              <th>宠物</th>
              <th>就诊ID</th>
              <th>归档人</th>
              <th>归档时间</th>
              <th>备注</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {archives.map((arc) => (
              <tr key={arc.id}>
                <td>{arc.pet_name}</td>
                <td>#{arc.visit_id}</td>
                <td>{arc.archived_by_name}</td>
                <td>{new Date(arc.archived_at).toLocaleString()}</td>
                <td>{arc.notes || '-'}</td>
                <td>
                  <Link to={`/visits/${arc.visit_id}`}>
                    <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>
                      查看病历
                    </button>
                  </Link>
                </td>
              </tr>
            ))}
            {archives.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: '#718096' }}>
                  暂无归档记录
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
