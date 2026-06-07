import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function PetDetail() {
  const { id } = useParams();
  const [pet, setPet] = useState(null);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const { hasRole } = useAuth();

  useEffect(() => {
    loadPetDetail();
  }, [id]);

  const loadPetDetail = async () => {
    try {
      const res = await api.get(`/pets/${id}`);
      setPet(res.data.pet);
      setVisits(res.data.visits);
    } catch (err) {
      console.error('加载宠物详情失败:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="card">加载中...</div>;
  }

  if (!pet) {
    return <div className="card">宠物档案不存在</div>;
  }

  return (
    <div>
      <div className="card">
        <h2>宠物详情 - {pet.name}</h2>
        <div className="grid grid-2">
          <div>
            <p><strong>种类：</strong>{pet.species}</p>
            <p><strong>品种：</strong>{pet.breed || '-'}</p>
            <p><strong>年龄：</strong>{pet.age ? pet.age + '岁' : '-'}</p>
            <p><strong>性别：</strong>{pet.gender || '-'}</p>
          </div>
          <div>
            <p><strong>主人姓名：</strong>{pet.owner_name}</p>
            <p><strong>主人电话：</strong>{pet.owner_phone || '-'}</p>
            <p><strong>建档时间：</strong>{new Date(pet.created_at).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>就诊记录</h2>
        <table className="table">
          <thead>
            <tr>
              <th>就诊时间</th>
              <th>主治兽医</th>
              <th>主诉</th>
              <th>诊断</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {visits.map((visit) => (
              <tr key={visit.id}>
                <td>{new Date(visit.visit_date).toLocaleString()}</td>
                <td>{visit.vet_name || '-'}</td>
                <td>{visit.chief_complaint || '-'}</td>
                <td>{visit.diagnosis || '-'}</td>
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

      <Link to="/pets">
        <button className="btn btn-secondary">← 返回宠物列表</button>
      </Link>
    </div>
  );
}
