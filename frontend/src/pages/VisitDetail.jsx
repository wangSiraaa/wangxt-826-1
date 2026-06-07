import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function VisitDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [visit, setVisit] = useState(null)
  const [prescriptions, setPrescriptions] = useState([])
  const [labOrders, setLabOrders] = useState([])
  const [archiveRecord, setArchiveRecord] = useState(null)
  const [activeTab, setActiveTab] = useState('info')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false)
  const [prescriptionForm, setPrescriptionForm] = useState({ medication: '', dosage: '', instructions: '' })
  
  const [showLabModal, setShowLabModal] = useState(false)
  const [labForm, setLabForm] = useState({ test_name: '' })
  
  const [labResultForm, setLabResultForm] = useState({})

  const { user, hasRole, hasAnyRole } = useAuth()

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      const res = await api.get(`/visits/${id}`)
      setVisit(res.data.visit)
      setPrescriptions(res.data.prescriptions || [])
      setLabOrders(res.data.labOrders || [])
      setArchiveRecord(res.data.archiveRecord || null)
    } catch (err) {
      console.error('加载就诊详情失败', err)
    } finally {
      setLoading(false)
    }
  }

  const clearMessages = () => {
    setError('')
    setSuccess('')
  }

  const handleAddPrescription = async (e) => {
    e.preventDefault()
    clearMessages()
    try {
      await api.post('/prescriptions', { ...prescriptionForm, visit_id: id })
      setShowPrescriptionModal(false)
      setPrescriptionForm({ medication: '', dosage: '', instructions: '' })
      setSuccess('处方添加成功')
      loadData()
    } catch (err) {
      setError(err.response?.data?.error || '添加失败')
    }
  }

  const handleVetSign = async (prescriptionId) => {
    clearMessages()
    try {
      await api.post(`/prescriptions/${prescriptionId}/vet-sign`)
      setSuccess('兽医签名成功')
      loadData()
    } catch (err) {
      setError(err.response?.data?.error || '签名失败')
    }
  }

  const handlePharmacySign = async (prescriptionId) => {
    clearMessages()
    try {
      await api.post(`/prescriptions/${prescriptionId}/pharmacy-sign`)
      setSuccess('药房确认成功')
      loadData()
    } catch (err) {
      setError(err.response?.data?.error || '确认失败')
    }
  }

  const handleCharge = async (prescriptionId) => {
    clearMessages()
    try {
      await api.post(`/prescriptions/${prescriptionId}/charge`)
      setSuccess('收费成功')
      loadData()
    } catch (err) {
      setError(err.response?.data?.error || '收费失败')
    }
  }

  const handleAddLab = async (e) => {
    e.preventDefault()
    clearMessages()
    try {
      await api.post('/lab-orders', { ...labForm, visit_id: id })
      setShowLabModal(false)
      setLabForm({ test_name: '' })
      setSuccess('检验单添加成功')
      loadData()
    } catch (err) {
      setError(err.response?.data?.error || '添加失败')
    }
  }

  const handleSubmitLabResult = async (labOrderId) => {
    clearMessages()
    try {
      const result = labResultForm[labOrderId]
      if (!result) {
        setError('请输入检验结果')
        return
      }
      await api.put(`/lab-orders/${labOrderId}/result`, { result })
      delete labResultForm[labOrderId]
      setSuccess('检验结果回填成功')
      loadData()
    } catch (err) {
      setError(err.response?.data?.error || '提交失败')
    }
  }

  const handleArchive = async () => {
    if (!window.confirm('确定要归档该就诊记录吗？归档后将不能修改。')) return
    clearMessages()
    try {
      await api.post(`/archives/${id}`)
      setSuccess('归档成功')
      loadData()
    } catch (err) {
      setError(err.response?.data?.error || '归档失败')
    }
  }

  if (loading) return <div>加载中...</div>
  if (!visit) return <div>就诊记录不存在</div>

  const isArchived = visit.status === 'archived'

  return (
    <div>
      <Link to="/visits" style={{ color: '#667eea', textDecoration: 'none', marginBottom: '16px', display: 'inline-block' }}>
        ← 返回就诊列表
      </Link>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {isArchived && (
        <div className="alert alert-warning">
          该病历已归档，仅可查看，不能修改。归档时间：{archiveRecord && new Date(archiveRecord.archived_at).toLocaleString('zh-CN')}，归档人：{archiveRecord?.archived_by_name}
        </div>
      )}

      <div className="card">
        <h2>就诊详情</h2>
        <div className="info-grid">
          <div className="info-item">
            <div className="label">宠物名称</div>
            <div className="value">{visit.pet_name}</div>
          </div>
          <div className="info-item">
            <div className="label">种类/品种</div>
            <div className="value">{visit.species} {visit.breed || ''}</div>
          </div>
          <div className="info-item">
            <div className="label">年龄/性别</div>
            <div className="value">{visit.age || '-'} / {visit.gender || '-'}</div>
          </div>
          <div className="info-item">
            <div className="label">主人</div>
            <div className="value">{visit.owner_name}</div>
          </div>
          <div className="info-item">
            <div className="label">主治兽医</div>
            <div className="value">{visit.vet_name || '-'}</div>
          </div>
          <div className="info-item">
            <div className="label">就诊时间</div>
            <div className="value">{new Date(visit.visit_date).toLocaleString('zh-CN')}</div>
          </div>
        </div>
        <div className="form-group">
          <label>主诉</label>
          <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
            {visit.chief_complaint || '无'}
          </div>
        </div>
        <div className="form-group">
          <label>诊断</label>
          <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
            {visit.diagnosis || '无'}
          </div>
        </div>
      </div>

      <div className="tabs">
        <button className={activeTab === 'prescriptions' ? 'active' : ''} onClick={() => setActiveTab('prescriptions')}>
          处方 ({prescriptions.length})
        </button>
        <button className={activeTab === 'lab' ? 'active' : ''} onClick={() => setActiveTab('lab')}>
          检验单 ({labOrders.length})
        </button>
        <button className={activeTab === 'archive' ? 'active' : ''} onClick={() => setActiveTab('archive')}>
          归档
        </button>
      </div>

      {activeTab === 'prescriptions' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>处方列表</h3>
            {hasRole('vet') && !isArchived && (
              <button className="btn btn-primary" onClick={() => setShowPrescriptionModal(true)}>
                + 添加处方
              </button>
            )}
          </div>
          {prescriptions.length === 0 ? (
            <div className="empty-state">暂无处方</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>药品名称</th>
                  <th>剂量</th>
                  <th>用法说明</th>
                  <th>兽医签名</th>
                  <th>药房确认</th>
                  <th>收费状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.map(pr => (
                  <tr key={pr.id}>
                    <td>{pr.medication}</td>
                    <td>{pr.dosage}</td>
                    <td>{pr.instructions || '-'}</td>
                    <td>
                      {pr.vet_signed ? (
                        <span className="badge badge-completed">已签名 - {pr.vet_signed_name}</span>
                      ) : (
                        <span className="badge badge-pending">未签名</span>
                      )}
                    </td>
                    <td>
                      {pr.pharmacy_signed ? (
                        <span className="badge badge-completed">已确认 - {pr.pharmacy_signed_name}</span>
                      ) : (
                        <span className="badge badge-pending">未确认</span>
                      )}
                    </td>
                    <td>
                      {pr.charged ? (
                        <span className="badge badge-completed">已收费</span>
                      ) : (
                        <span className="badge badge-pending">未收费</span>
                      )}
                    </td>
                    <td>
                      {!isArchived && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {hasRole('vet') && !pr.vet_signed && (
                            <button className="btn btn-success" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => handleVetSign(pr.id)}>
                              兽医签名
                            </button>
                          )}
                          {hasRole('pharmacy') && pr.vet_signed && !pr.pharmacy_signed && (
                            <button className="btn btn-success" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => handlePharmacySign(pr.id)}>
                              药房确认
                            </button>
                          )}
                          {hasRole('pharmacy') && !pr.charged && (
                            <button className="btn btn-warning" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => handleCharge(pr.id)}>
                              收费
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'lab' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>检验单列表</h3>
            {hasRole('vet') && !isArchived && (
              <button className="btn btn-primary" onClick={() => setShowLabModal(true)}>
                + 添加检验单
              </button>
            )}
          </div>
          {labOrders.length === 0 ? (
            <div className="empty-state">暂无检验单</div>
          ) : (
            <div>
              {labOrders.map(lo => (
                <div key={lo.id} className="card" style={{ marginBottom: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <strong>{lo.test_name}</strong>
                      <span style={{ marginLeft: '12px' }}>
                        <span className={`badge ${lo.status === 'completed' ? 'badge-completed' : 'badge-pending'}`}>
                          {lo.status === 'completed' ? '已完成' : '待回填'}
                        </span>
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      开单：{lo.requested_by_name} | {new Date(lo.requested_at).toLocaleString('zh-CN')}
                    </div>
                  </div>
                  {lo.status === 'completed' ? (
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                        检验结果（{lo.result_by_name}，{new Date(lo.result_at).toLocaleString('zh-CN')}）：
                      </div>
                      <div style={{ padding: '12px', background: '#f0fdf4', borderRadius: '8px' }}>
                        {lo.result}
                      </div>
                    </div>
                  ) : (
                    !isArchived && hasRole('lab') && (
                      <div>
                        <div className="form-group" style={{ marginBottom: '8px' }}>
                          <textarea
                            placeholder="请输入检验结果..."
                            rows={3}
                            value={labResultForm[lo.id] || ''}
                            onChange={e => setLabResultForm({ ...labResultForm, [lo.id]: e.target.value })}
                          />
                        </div>
                        <button 
                          className="btn btn-success" 
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          onClick={() => handleSubmitLabResult(lo.id)}
                        >
                          提交检验结果
                        </button>
                      </div>
                    )
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'archive' && (
        <div className="card">
          <h3>归档状态</h3>
          {isArchived ? (
            <div>
              <div className="alert alert-success">
                该病历已归档
              </div>
              <div className="info-grid">
                <div className="info-item">
                  <div className="label">归档人</div>
                  <div className="value">{archiveRecord?.archived_by_name}</div>
                </div>
                <div className="info-item">
                  <div className="label">归档时间</div>
                  <div className="value">{archiveRecord && new Date(archiveRecord.archived_at).toLocaleString('zh-CN')}</div>
                </div>
              </div>
              {archiveRecord?.notes && (
                <div className="form-group">
                  <label>归档备注</label>
                  <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                    {archiveRecord.notes}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="alert alert-warning">
                该病历尚未归档。归档前请确保：
                <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
                  <li>所有检验单已回填结果</li>
                  <li>所有处方已完成必要的签名</li>
                </ul>
              </div>
              {hasRole('archivist') && (
                <button className="btn btn-primary" onClick={handleArchive}>
                  执行归档
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {showPrescriptionModal && (
        <div className="modal-overlay" onClick={() => setShowPrescriptionModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>添加处方</h3>
            <form onSubmit={handleAddPrescription}>
              <div className="form-group">
                <label>药品名称 *</label>
                <input
                  type="text"
                  value={prescriptionForm.medication}
                  onChange={e => setPrescriptionForm({ ...prescriptionForm, medication: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>剂量 *</label>
                <input
                  type="text"
                  value={prescriptionForm.dosage}
                  onChange={e => setPrescriptionForm({ ...prescriptionForm, dosage: e.target.value })}
                  placeholder="如：每次1片，每日3次"
                  required
                />
              </div>
              <div className="form-group">
                <label>用法说明</label>
                <textarea
                  value={prescriptionForm.instructions}
                  onChange={e => setPrescriptionForm({ ...prescriptionForm, instructions: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPrescriptionModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  添加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLabModal && (
        <div className="modal-overlay" onClick={() => setShowLabModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>添加检验单</h3>
            <form onSubmit={handleAddLab}>
              <div className="form-group">
                <label>检验项目 *</label>
                <input
                  type="text"
                  value={labForm.test_name}
                  onChange={e => setLabForm({ ...labForm, test_name: e.target.value })}
                  placeholder="如：血常规、生化检查"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowLabModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  添加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
