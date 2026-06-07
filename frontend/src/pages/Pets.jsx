import { useState, useEffect } from 'react'
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
