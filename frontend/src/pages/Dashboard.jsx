import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function Dashboard() {
  const [stats, setStats] = useState({ pets: 0, visits: 0, pending: 0, archived: 0 })
  const [recentVisits, setRecentVisits] = useState([])
  const { user, hasRole } = useAuth()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [visitsRes] = await Promise.all([
        api.get('/visits')
      ])
      const visits = visitsRes.data.visits
      
      setStats({
        pets: visits.filter((v, i, arr) => arr.findIndex(x => x.pet_id === v.pet_id) === i).length,
        visits: visits.length,
        pending: visits.filter(v => v.status === 'active').length,
        archived: visits.filter(v => v.status === 'archived').length
      })
      
      setRecentVisits(visits.slice(0, 5))
    } catch (err) {
      console.error('加载数据失败', err)
    }
  }

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>欢迎回来，{user.name}！</h2>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-number">{stats.pets}</div>
          <div className="stat-label">宠物档案</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.visits}</div>
          <div className="stat-label">就诊记录</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.pending}</div>
          <div className="stat-label">进行中</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.archived}</div>
          <div className="stat-label">已归档</div>
        </div>
      </div>

      <div className="card">
        <h2>最近就诊记录</h2>
        {recentVisits.length === 0 ? (
          <div className="empty-state">暂无就诊记录</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>宠物名称</th>
                <th>种类</th>
                <th>主人</th>
                <th>主治兽医</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {recentVisits.map(visit => (
                <tr key={visit.id}>
                  <td>{visit.pet_name}</td>
                  <td>{visit.species}</td>
                  <td>{visit.owner_name}</td>
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

      {hasRole('vet') && (
        <div style={{ display: 'flex', gap: '16px' }}>
          <Link to="/pets" className="btn btn-primary">
            管理宠物档案
          </Link>
          <Link to="/visits" className="btn btn-success">
            管理就诊记录
          </Link>
        </div>
      )}
    </div>
  )
}
