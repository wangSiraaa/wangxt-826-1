import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function VisitDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [visit, setVisit] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [labOrders, setLabOrders] = useState([]);
  const [archiveRecord, setArchiveRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('prescriptions');
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showLabModal, setShowLabModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [selectedLabOrder, setSelectedLabOrder] = useState(null);
  
  const [prescriptionForm, setPrescriptionForm] = useState({
    medication: '',
    dosage: '',
    instructions: ''
  });
  const [labForm, setLabForm] = useState({ test_name: '' });
  const [resultForm, setResultForm] = useState({ result: '' });
  const [archiveNotes, setArchiveNotes] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const { user, hasRole } = useAuth();

  useEffect(() => {
    loadVisitDetail();
  }, [id]);

  const loadVisitDetail = async () => {
    try {
      const res = await api.get(`/visits/${id}`);
      setVisit(res.data.visit);
      setPrescriptions(res.data.prescriptions);
      setLabOrders(res.data.labOrders);
      setArchiveRecord(res.data.archiveRecord);
    } catch (err) {
      console.error('加载就诊详情失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const isArchived = visit?.status === 'archived';

  const handleAddPrescription = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await api.post('/prescriptions', {
        visit_id: id,
        ...prescriptionForm
      });
      setShowPrescriptionModal(false);
      setPrescriptionForm({ medication: '', dosage: '', instructions: '' });
      loadVisitDetail();
      showMessage('success', '处方添加成功');
    } catch (err) {
      showMessage('error', err.response?.data?.error || '添加失败');
    } finally {
      setFormLoading(false);
    }
  };

  const handleVetSign = async (prescriptionId) => {
    try {
      await api.post(`/prescriptions/${prescriptionId}/vet-sign`);
      loadVisitDetail();
      showMessage('success', '兽医签名成功');
    } catch (err) {
      showMessage('error', err.response?.data?.error || '签名失败');
    }
  };

  const handlePharmacySign = async (prescriptionId) => {
    try {
      await api.post(`/prescriptions/${prescriptionId}/pharmacy-sign`);
      loadVisitDetail();
      showMessage('success', '药房确认成功');
    } catch (err) {
      showMessage('error', err.response?.data?.error || '确认失败');
    }
  };

  const handleCharge = async (prescriptionId) => {
    try {
      await api.post(`/prescriptions/${prescriptionId}/charge`);
      loadVisitDetail();
      showMessage('success', '收费成功');
    } catch (err) {
      showMessage('error', err.response?.data?.error || '收费失败');
    }
  };

  const handleAddLabOrder = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await api.post('/lab-orders', {
        visit_id: id,
        ...labForm
      });
      setShowLabModal(false);
      setLabForm({ test_name: '' });
      loadVisitDetail();
      showMessage('success', '检验单添加成功');
    } catch (err) {
      showMessage('error', err.response?.data?.error || '添加失败');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSubmitResult = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await api.put(`/lab-orders/${selectedLabOrder.id}/result`, resultForm);
      setShowResultModal(false);
      setSelectedLabOrder(null);
      setResultForm({ result: '' });
      loadVisitDetail();
      showMessage('success', '检验结果提交成功');
    } catch (err) {
      showMessage('error', err.response?.data?.error || '提交失败');
    } finally {
      setFormLoading(false);
    }
  };

  const handleArchive = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await api.post(`/archives/${id}`, { notes: archiveNotes });
      setShowArchiveModal(false);
      setArchiveNotes('');
      loadVisitDetail();
      showMessage('success', '归档成功');
    } catch (err) {
      showMessage('error', err.response?.data?.error || '归档失败');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return <div className="card">加载中...</div>;
  }

  if (!visit) {
    return <div className="card">就诊记录不存在</div>;
  }

  return (
    <div>
      {message.text && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}

      {isArchived && (
        <div className="readonly-notice">
          <span>🔒</span>
          <span>该病历已归档，仅支持查看，不能修改</span>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2>就诊详情 - {visit.pet_name}</h2>
            <p><strong>就诊时间：</strong>{new Date(visit.visit_date).toLocaleString()}</p>
            <p><strong>主治兽医：</strong>{visit.vet_name || '-'}</p>
            <p><strong>状态：</strong>
              <span className={`badge ${isArchived ? 'badge-success' : 'badge-warning'}`}>
                {isArchived ? '已归档' : '进行中'}
              </span>
            </p>
          </div>
          <div>
            {isArchived && archiveRecord && (
              <div style={{ textAlign: 'right', fontSize: '0.875rem', color: '#718096' }}>
                <p>归档时间：{new Date(archiveRecord.archived_at).toLocaleString()}</p>
                <p>归档人：{archiveRecord.archived_by_name}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-2" style={{ marginTop: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', color: '#4a5568', marginBottom: '0.5rem' }}>宠物信息</h3>
            <p><strong>种类：</strong>{visit.species}</p>
            <p><strong>品种：</strong>{visit.breed || '-'}</p>
            <p><strong>年龄：</strong>{visit.age ? visit.age + '岁' : '-'}</p>
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', color: '#4a5568', marginBottom: '0.5rem' }}>主人信息</h3>
            <p><strong>姓名：</strong>{visit.owner_name}</p>
            <p><strong>电话：</strong>{visit.owner_phone || '-'}</p>
          </div>
        </div>

        <div style={{ marginTop: '1rem' }}>
          <p><strong>主诉：</strong>{visit.chief_complaint || '无'}</p>
          <p><strong>诊断：</strong>{visit.diagnosis || '无'}</p>
        </div>
      </div>

      <div className="card">
        <div className="tabs">
          <div
            className={`tab ${activeTab === 'prescriptions' ? 'active' : ''}`}
            onClick={() => setActiveTab('prescriptions')}
          >
            处方 ({prescriptions.length})
          </div>
          <div
            className={`tab ${activeTab === 'lab' ? 'active' : ''}`}
            onClick={() => setActiveTab('lab')}
          >
            检验单 ({labOrders.length})
          </div>
          {isArchived && archiveRecord && (
            <div
              className={`tab ${activeTab === 'archive' ? 'active' : ''}`}
              onClick={() => setActiveTab('archive')}
            >
              归档记录
            </div>
          )}
        </div>

        {activeTab === 'prescriptions' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem' }}>处方列表</h3>
              {hasRole('vet') && !isArchived && (
                <button className="btn btn-primary" onClick={() => setShowPrescriptionModal(true)}>
                  + 添加处方
                </button>
              )}
            </div>
            
            <table className="table">
              <thead>
                <tr>
                  <th>药品</th>
                  <th>剂量</th>
                  <th>兽医签名</th>
                  <th>药房确认</th>
                  <th>收费状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.map((p) => (
                  <tr key={p.id}>
                    <td>{p.medication}</td>
                    <td>{p.dosage}</td>
                    <td>
                      {p.vet_signed ? (
                        <span className="badge badge-success">
                          已签名 - {p.vet_signed_name}
                        </span>
                      ) : (
                        <span className="badge badge-warning">待签名</span>
                      )}
                    </td>
                    <td>
                      {p.pharmacy_signed ? (
                        <span className="badge badge-success">
                          已确认 - {p.pharmacy_signed_name}
                        </span>
                      ) : (
                        <span className="badge badge-secondary">待确认</span>
                      )}
                    </td>
                    <td>
                      {p.charged ? (
                        <span className="badge badge-success">已收费</span>
                      ) : (
                        <span className="badge badge-warning">待收费</span>
                      )}
                    </td>
                    <td>
                      {hasRole('vet') && !p.vet_signed && !isArchived && (
                        <button
                          className="btn btn-primary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', marginRight: '0.25rem' }}
                          onClick={() => handleVetSign(p.id)}
                        >
                          兽医签名
                        </button>
                      )}
                      {hasRole('pharmacy') && p.vet_signed && !p.pharmacy_signed && !isArchived && (
                        <button
                          className="btn btn-success"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', marginRight: '0.25rem' }}
                          onClick={() => handlePharmacySign(p.id)}
                        >
                          药房确认
                        </button>
                      )}
                      {hasRole('pharmacy') && !p.charged && !isArchived && (
                        <button
                          className="btn btn-primary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                          onClick={() => handleCharge(p.id)}
                          disabled={!p.vet_signed}
                          title={!p.vet_signed ? '处方缺少医生签名，不能收费' : ''}
                        >
                          收费
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {prescriptions.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: '#718096' }}>
                      暂无处方
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'lab' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem' }}>检验单列表</h3>
              {hasRole('vet') && !isArchived && (
                <button className="btn btn-primary" onClick={() => setShowLabModal(true)}>
                  + 申请检验
                </button>
              )}
            </div>
            
            <table className="table">
              <thead>
                <tr>
                  <th>检验项目</th>
                  <th>申请人</th>
                  <th>申请时间</th>
                  <th>状态</th>
                  <th>结果</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {labOrders.map((lo) => (
                  <tr key={lo.id}>
                    <td>{lo.test_name}</td>
                    <td>{lo.requested_by_name}</td>
                    <td>{new Date(lo.requested_at).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${lo.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                        {lo.status === 'completed' ? '已完成' : '待检验'}
                      </span>
                    </td>
                    <td>{lo.result || '-'}</td>
                    <td>
                      {hasRole('lab') && lo.status === 'pending' && !isArchived && (
                        <button
                          className="btn btn-primary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                          onClick={() => {
                            setSelectedLabOrder(lo);
                            setShowResultModal(true);
                          }}
                        >
                          回填结果
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {labOrders.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: '#718096' }}>
                      暂无检验单
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'archive' && archiveRecord && (
          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>归档记录</h3>
            <p><strong>归档时间：</strong>{new Date(archiveRecord.archived_at).toLocaleString()}</p>
            <p><strong>归档人：</strong>{archiveRecord.archived_by_name}</p>
            <p><strong>备注：</strong>{archiveRecord.notes || '无'}</p>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <Link to="/visits">
          <button className="btn btn-secondary">← 返回列表</button>
        </Link>
        
        {hasRole('archivist') && !isArchived && (
          <button className="btn btn-success" onClick={() => setShowArchiveModal(true)}>
            📁 执行归档
          </button>
        )}
      </div>

      {showPrescriptionModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
            <h2>添加处方</h2>
            <form onSubmit={handleAddPrescription}>
              <div className="form-group">
                <label>药品名称 *</label>
                <input
                  type="text"
                  value={prescriptionForm.medication}
                  onChange={(e) => setPrescriptionForm({ ...prescriptionForm, medication: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>剂量 *</label>
                <input
                  type="text"
                  value={prescriptionForm.dosage}
                  onChange={(e) => setPrescriptionForm({ ...prescriptionForm, dosage: e.target.value })}
                  placeholder="如：每日2次，每次1片"
                  required
                />
              </div>
              <div className="form-group">
                <label>用药说明</label>
                <textarea
                  value={prescriptionForm.instructions}
                  onChange={(e) => setPrescriptionForm({ ...prescriptionForm, instructions: e.target.value })}
                  rows="2"
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowPrescriptionModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? '添加中...' : '添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLabModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
            <h2>申请检验</h2>
            <form onSubmit={handleAddLabOrder}>
              <div className="form-group">
                <label>检验项目 *</label>
                <input
                  type="text"
                  value={labForm.test_name}
                  onChange={(e) => setLabForm({ ...labForm, test_name: e.target.value })}
                  placeholder="如：血常规、生化检查等"
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowLabModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? '提交中...' : '提交申请'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showResultModal && selectedLabOrder && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
            <h2>回填检验结果 - {selectedLabOrder.test_name}</h2>
            <form onSubmit={handleSubmitResult}>
              <div className="form-group">
                <label>检验结果 *</label>
                <textarea
                  value={resultForm.result}
                  onChange={(e) => setResultForm({ result: e.target.value })}
                  rows="5"
                  placeholder="请输入详细的检验结果..."
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowResultModal(false); setSelectedLabOrder(null); }}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? '提交中...' : '提交结果'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showArchiveModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
            <h2>执行归档</h2>
            <p style={{ marginBottom: '1rem', color: '#718096' }}>
              归档后病历将变为只读状态，无法再进行修改。请确认所有检验单已回填完成。
            </p>
            <form onSubmit={handleArchive}>
              <div className="form-group">
                <label>归档备注</label>
                <textarea
                  value={archiveNotes}
                  onChange={(e) => setArchiveNotes(e.target.value)}
                  rows="3"
                  placeholder="可选：填写归档备注信息..."
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowArchiveModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-success" disabled={formLoading}>
                  {formLoading ? '归档中...' : '确认归档'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
