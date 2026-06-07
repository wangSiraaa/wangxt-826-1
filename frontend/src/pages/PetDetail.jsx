import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api.js'

export default function PetDetail() {
  const { id } = useParams()
  const [pet, setPet] = useState(null)
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPet()
  }, [id])

  const loadPet = async () => {
    try {
      const res = await api.get(`/pets/${id}`)
      setPet(res.data.pet)
      setVisits(res.data.visits || [])
    } catch (err) {
      console.error('加载宠物详情失败', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>加载中...</div>
  if (!pet) return <div>宠物档案不存在</div>

  return (
    <div>
      <Link to="/pets" style={{ color: '#667eea', textDecoration: 'none', marginBottom: '16px', display: 'inline-block' }}>
        ← 返回宠物列表
      </Link>

      <div className="card">
        <h2>{pet.name} 的档案</h2>
        <div className="info-grid">
          <div className="info-item">
            <div className="label">种类</div>
            <div className="value">{pet.species}</div>
          </div>
          <div className="info-item">
            <div className="label">品种</div>
            <div className="value">{pet.breed || '-'}</div>
          </div>
          <div className="info-item">
            <div className="label">年龄</div>
            <div className="value">{pet.age || '-'}</div>
          </div>
          <div className="info-item">
            <div className="label">性别</div>
            <div className="value">{pet.gender || '-'}</div>
          </div>
          <div className="info-item">
            <div className="label">主人姓名</div>
            <div className="value">{pet.owner_name}</div>
          </div>
          <div className="info-item">
            <div className="label">主人电话</div>
            <div className="value">{pet.owner_phone || '-'}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>就诊历史</h2>
        {visits.length === 0 ? (
          <div className="empty-state">暂无就诊记录</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>就诊时间</th>
                <th>主诉</th>
                <th>诊断</th>
                <th>主治兽医</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {visits.map(visit => (
                <tr key={visit.id}>
                  <td>{new Date(visit.visit_date).toLocaleString('zh-CN')}</td>
                  <td>{visit.chief_complaint || '-'}</td>
                  <td>{visit.diagnosis || '-'}</td>
                  <td>{visit.vet_name || '-'}</td>
                  <td>
                    <span className={`badge badge-${visit.status}`}>
                      {visit.status === 'active' ? '进行中' : visit.status === 'completed' ? '已完成' : '已归档'}
                    </span>
                  </td>
                  <td>
                    <Link to={`/visits/${visit.id}`} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                      查看
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
