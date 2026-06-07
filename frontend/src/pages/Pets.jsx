import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Pets() {
  const [pets, setPets] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    species: '',
    breed: '',
    age: '',
    gender: '',
    owner_name: '',
    owner_phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { hasRole } = useAuth();

  useEffect(() => {
    loadPets();
  }, []);

  const loadPets = async () => {
    try {
      const res = await api.get('/pets');
      setPets(res.data.pets);
    } catch (err) {
      console.error('加载宠物档案失败:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/pets', formData);
      setShowModal(false);
      setFormData({
        name: '',
        species: '',
        breed: '',
        age: '',
        gender: '',
        owner_name: '',
        owner_phone: ''
      });
      loadPets();
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
          <h2>宠物档案</h2>
          {hasRole('vet') && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              + 新建宠物档案
            </button>
          )}
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>宠物名称</th>
              <th>种类</th>
              <th>品种</th>
              <th>年龄</th>
              <th>主人姓名</th>
              <th>主人电话</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {pets.map((pet) => (
              <tr key={pet.id}>
                <td>{pet.name}</td>
                <td>{pet.species}</td>
                <td>{pet.breed || '-'}</td>
                <td>{pet.age ? pet.age + '岁' : '-'}</td>
                <td>{pet.owner_name}</td>
                <td>{pet.owner_phone || '-'}</td>
                <td>
                  <Link to={`/pets/${pet.id}`}>
                    <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>
                      查看详情
                    </button>
                  </Link>
                </td>
              </tr>
            ))}
            {pets.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', color: '#718096' }}>
                  暂无宠物档案
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
          <div className="card" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2>新建宠物档案</h2>
            {error && <div className="alert alert-error">{error}</div>}
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-2">
                <div className="form-group">
                  <label>宠物名称 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>种类 *</label>
                  <select
                    value={formData.species}
                    onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                    required
                  >
                    <option value="">请选择</option>
                    <option value="犬">犬</option>
                    <option value="猫">猫</option>
                    <option value="兔">兔</option>
                    <option value="鸟">鸟</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>品种</label>
                  <input
                    type="text"
                    value={formData.breed}
                    onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>年龄（岁）</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>性别</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="">请选择</option>
                    <option value="公">公</option>
                    <option value="母">母</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>主人姓名 *</label>
                  <input
                    type="text"
                    value={formData.owner_name}
                    onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>主人电话</label>
                <input
                  type="tel"
                  value={formData.owner_phone}
                  onChange={(e) => setFormData({ ...formData, owner_phone: e.target.value })}
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
