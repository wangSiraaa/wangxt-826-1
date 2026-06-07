import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function Archives() {
  const [archives, setArchives] = useState([])
  const [loading, setLoading] = useState(true)
  const { hasRole } = useAuth()

  useEffect(() => {
    loadArchives()
  }, [])

  const loadArchives = async () => {
    try {
      const res = await api.get('/archives')
      setArchives(res.data.archives)
    } catch (err) {
      console.error('加载归档记录失败', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>加载中...</div>

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>归档管理</h2>
      
      <div className="card">
        {archives.length === 0 ? (
          <div className="empty-state">暂无归档记录</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>宠物名称</th>
                <th>归档时间</th>
                <th>归档人</th>
                <th>备注</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {archives.map(arc => (
                <tr key={arc.id}>
                  <td>{arc.pet_name}</td>
                  <td>{new Date(arc.archived_at).toLocaleString('zh-CN')}</td>
                  <td>{arc.archived_by_name}</td>
                  <td>{arc.notes || '-'}</td>
                  <td>
                    <Link to={`/visits/${arc.visit_id}`} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                      查看病历
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
