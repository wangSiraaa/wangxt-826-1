import { useState, useEffect } from 'react'
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
