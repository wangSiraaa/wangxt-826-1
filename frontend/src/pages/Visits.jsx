import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Visits() {
  const [visits, setVisits] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [pets, setPets] = useState([]);
  const [formData, setFormData] = useState({
    pet_id: '',
    chief_complaint: '',
    diagnosis: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { hasRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [visitsRes, petsRes] = await Promise.all([
        api.get('/visits'),
        api.get('/pets')
      ]);
      setVisits(visitsRes.data.visits);
      setPets(petsRes.data.pets);
    } catch (err) {
      console.error('加载数据失败:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/visits', formData);
      setShowModal(false);
      setFormData({ pet_id: '', chief_complaint: '', diagnosis: '' });
      navigate(`/visits/${res.data.visit.id}`);
    } catch (err) {
      setError(err.response?.data?.error || '创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>就诊记录</h2>
          {hasRole('vet') && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              + 新建就诊
            </button>
          )}
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>宠物</th>
              <th>主人</th>
              <th>就诊时间</th>
              <th>主治兽医</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {visits.map((visit) => (
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
                      查看详情
                    </button>
                  </Link>
                </td>
              </tr>
            ))}
            {visits.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: '#718096' }}>
                  暂无就诊记录
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
            <h2>新建就诊记录</h2>
            {error && <div className="alert alert-error">{error}</div>}
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>选择宠物 *</label>
                <select
                  value={formData.pet_id}
                  onChange={(e) => setFormData({ ...formData, pet_id: e.target.value })}
                  required
                >
                  <option value="">请选择宠物</option>
                  {pets.map((pet) => (
                    <option key={pet.id} value={pet.id}>
                      {pet.name} - {pet.species}（{pet.owner_name}）
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>主诉</label>
                <textarea
                  value={formData.chief_complaint}
                  onChange={(e) => setFormData({ ...formData, chief_complaint: e.target.value })}
                  rows="3"
                  placeholder="宠物的主要症状..."
                />
              </div>
              <div className="form-group">
                <label>初步诊断</label>
                <textarea
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  rows="3"
                  placeholder="初步诊断结果..."
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
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
  );
}
