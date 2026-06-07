const express = require('express');
const { run, get, all } = require('../database');
const { authMiddleware } = require('../auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const { status, pet_name, vet_id, start_date, end_date } = req.query;
    
    let sql = `
      SELECT v.*, p.name as pet_name, p.species, p.owner_name, u.name as vet_name,
             CASE 
               WHEN v.status = 'archived' THEN '已归档'
               WHEN v.status = 'completed' THEN '已完成'
               ELSE '进行中'
             END as status_text
      FROM visits v
      JOIN pets p ON v.pet_id = p.id
      LEFT JOIN users u ON v.vet_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (status) {
      sql += ' AND v.status = ?';
      params.push(status);
    }
    
    if (pet_name) {
      sql += ' AND p.name LIKE ?';
      params.push(`%${pet_name}%`);
    }
    
    if (vet_id) {
      sql += ' AND v.vet_id = ?';
      params.push(vet_id);
    }
    
    if (start_date) {
      sql += ' AND v.visit_date >= ?';
      params.push(start_date);
    }
    
    if (end_date) {
      sql += ' AND v.visit_date <= ?';
      params.push(end_date);
    }
    
    sql += ' ORDER BY v.visit_date DESC';
    
    const visits = await all(sql, params);
    
    const visitIds = visits.map(v => v.id);
    
    let prescriptions = [];
    let labOrders = [];
    
    if (visitIds.length > 0) {
      const placeholders = visitIds.map(() => '?').join(',');
      
      prescriptions = await all(`
        SELECT pr.*, uv.name as vet_signed_name, up.name as pharmacy_signed_name
        FROM prescriptions pr
        LEFT JOIN users uv ON pr.vet_signed = uv.id
        LEFT JOIN users up ON pr.pharmacy_signed = up.id
        WHERE pr.visit_id IN (${placeholders})
        ORDER BY pr.created_at DESC
      `, visitIds);
      
      labOrders = await all(`
        SELECT lo.*, ur.name as requested_by_name, ure.name as result_by_name
        FROM lab_orders lo
        LEFT JOIN users ur ON lo.requested_by = ur.id
        LEFT JOIN users ure ON lo.result_by = ure.id
        WHERE lo.visit_id IN (${placeholders})
        ORDER BY lo.requested_at DESC
      `, visitIds);
    }
    
    const visitsWithDetails = visits.map(visit => ({
      ...visit,
      prescriptions: prescriptions.filter(p => p.visit_id === visit.id),
      lab_orders: labOrders.filter(l => l.visit_id === visit.id),
      risk_flags: generateRiskFlags(visit, prescriptions.filter(p => p.visit_id === visit.id), labOrders.filter(l => l.visit_id === visit.id))
    }));
    
    res.json({ visits: visitsWithDetails });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const visit = await get(`
      SELECT v.*, p.name as pet_name, p.species, p.breed, p.age, p.gender, 
             p.owner_name, p.owner_phone, u.name as vet_name
      FROM visits v
      JOIN pets p ON v.pet_id = p.id
      LEFT JOIN users u ON v.vet_id = u.id
      WHERE v.id = ?
    `, [req.params.id]);
    
    if (!visit) {
      return res.status(404).json({ error: '就诊记录不存在' });
    }

    const prescriptions = await all(`
      SELECT pr.*, uv.name as vet_signed_name, up.name as pharmacy_signed_name
      FROM prescriptions pr
      LEFT JOIN users uv ON pr.vet_signed = uv.id
      LEFT JOIN users up ON pr.pharmacy_signed = up.id
      WHERE pr.visit_id = ?
      ORDER BY pr.created_at DESC
    `, [req.params.id]);

    const labOrders = await all(`
      SELECT lo.*, ur.name as requested_by_name, ure.name as result_by_name
      FROM lab_orders lo
      LEFT JOIN users ur ON lo.requested_by = ur.id
      LEFT JOIN users ure ON lo.result_by = ure.id
      WHERE lo.visit_id = ?
      ORDER BY lo.requested_at DESC
    `, [req.params.id]);

    const archiveRecord = await get(`
      SELECT ar.*, u.name as archived_by_name
      FROM archive_records ar
      JOIN users u ON ar.archived_by = u.id
      WHERE ar.visit_id = ?
      ORDER BY ar.archived_at DESC
      LIMIT 1
    `, [req.params.id]);

    const riskFlags = generateRiskFlags(visit, prescriptions, labOrders);

    res.json({ visit, prescriptions, labOrders, archiveRecord, risk_flags: riskFlags });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

function generateRiskFlags(visit, prescriptions, labOrders) {
  const flags = [];
  
  if (visit.status !== 'archived') {
    const unsignedPrescriptions = prescriptions.filter(p => !p.vet_signed);
    if (unsignedPrescriptions.length > 0) {
      flags.push({
        level: 'warning',
        code: 'UNSIGNED_PRESCRIPTION',
        message: `存在 ${unsignedPrescriptions.length} 张未签名的处方`,
        detail: '处方缺少医生签名，无法收费'
      });
    }
    
    const unchargedPrescriptions = prescriptions.filter(p => p.vet_signed && !p.charged);
    if (unchargedPrescriptions.length > 0) {
      flags.push({
        level: 'info',
        code: 'UNCHARGED_PRESCRIPTION',
        message: `存在 ${unchargedPrescriptions.length} 张未收费的处方`,
        detail: '处方已签名但尚未收费'
      });
    }
    
    if (labOrders.length === 0) {
      flags.push({
        level: 'danger',
        code: 'NO_LAB_ORDERS',
        message: '该就诊记录没有检验单',
        detail: '缺少检验单，无法归档'
      });
    } else {
      const pendingLabOrders = labOrders.filter(l => l.status === 'pending');
      if (pendingLabOrders.length > 0) {
        flags.push({
          level: 'warning',
          code: 'PENDING_LAB_ORDERS',
          message: `存在 ${pendingLabOrders.length} 张未回填的检验单`,
          detail: '检验单未回填结果，无法归档'
        });
      }
    }
  }
  
  if (flags.length === 0) {
    flags.push({
      level: 'success',
      code: 'NO_RISK',
      message: '未发现风险项',
      detail: '就诊记录状态正常'
    });
  }
  
  return flags;
}

module.exports = router;
