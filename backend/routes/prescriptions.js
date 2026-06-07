const express = require('express');
const { run, get, all } = require('../database');
const { authMiddleware, roleMiddleware } = require('../auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/visit/:visitId', async (req, res) => {
  try {
    const prescriptions = await all(`
      SELECT pr.*, uv.name as vet_signed_name, up.name as pharmacy_signed_name
      FROM prescriptions pr
      LEFT JOIN users uv ON pr.vet_signed = uv.id
      LEFT JOIN users up ON pr.pharmacy_signed = up.id
      WHERE pr.visit_id = ?
      ORDER BY pr.created_at DESC
    `, [req.params.visitId]);
    res.json({ prescriptions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/', roleMiddleware('vet'), async (req, res) => {
  const { visit_id, medication, dosage, instructions } = req.body;
  
  if (!visit_id || !medication || !dosage) {
    return res.status(400).json({ error: '就诊ID、药品名称和剂量为必填项' });
  }

  try {
    const visit = await get('SELECT * FROM visits WHERE id = ?', [visit_id]);
    if (!visit) {
      return res.status(404).json({ error: '就诊记录不存在' });
    }

    if (visit.status === 'archived') {
      return res.status(403).json({ error: '已归档的就诊记录不能添加处方' });
    }

    const result = await run(`
      INSERT INTO prescriptions (visit_id, medication, dosage, instructions)
      VALUES (?, ?, ?, ?)
    `, [visit_id, medication, dosage, instructions]);

    const prescription = await get('SELECT * FROM prescriptions WHERE id = ?', [result.lastID]);
    res.status(201).json({ prescription });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/:id/vet-sign', roleMiddleware('vet'), async (req, res) => {
  try {
    const prescription = await get('SELECT * FROM prescriptions WHERE id = ?', [req.params.id]);
    if (!prescription) {
      return res.status(404).json({ error: '处方不存在' });
    }

    const visit = await get('SELECT * FROM visits WHERE id = ?', [prescription.visit_id]);
    if (visit.status === 'archived') {
      return res.status(403).json({ error: '已归档的就诊记录不能操作' });
    }

    if (prescription.vet_signed) {
      return res.status(400).json({ error: '处方已由兽医签名' });
    }

    await run(`
      UPDATE prescriptions SET vet_signed = ?, vet_signed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [req.user.id, req.params.id]);

    const updated = await get(`
      SELECT pr.*, uv.name as vet_signed_name, up.name as pharmacy_signed_name
      FROM prescriptions pr
      LEFT JOIN users uv ON pr.vet_signed = uv.id
      LEFT JOIN users up ON pr.pharmacy_signed = up.id
      WHERE pr.id = ?
    `, [req.params.id]);

    res.json({ prescription: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/:id/pharmacy-sign', roleMiddleware('pharmacy'), async (req, res) => {
  try {
    const prescription = await get('SELECT * FROM prescriptions WHERE id = ?', [req.params.id]);
    if (!prescription) {
      return res.status(404).json({ error: '处方不存在' });
    }

    const visit = await get('SELECT * FROM visits WHERE id = ?', [prescription.visit_id]);
    if (visit.status === 'archived') {
      return res.status(403).json({ error: '已归档的就诊记录不能操作' });
    }

    if (!prescription.vet_signed) {
      return res.status(400).json({ error: '处方必须先由兽医签名才能由药房确认' });
    }

    if (prescription.pharmacy_signed) {
      return res.status(400).json({ error: '处方已由药房确认' });
    }

    await run(`
      UPDATE prescriptions SET pharmacy_signed = ?, pharmacy_signed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [req.user.id, req.params.id]);

    const updated = await get(`
      SELECT pr.*, uv.name as vet_signed_name, up.name as pharmacy_signed_name
      FROM prescriptions pr
      LEFT JOIN users uv ON pr.vet_signed = uv.id
      LEFT JOIN users up ON pr.pharmacy_signed = up.id
      WHERE pr.id = ?
    `, [req.params.id]);

    res.json({ prescription: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/:id/charge', roleMiddleware('pharmacy'), async (req, res) => {
  try {
    const prescription = await get('SELECT * FROM prescriptions WHERE id = ?', [req.params.id]);
    if (!prescription) {
      return res.status(404).json({ error: '处方不存在' });
    }

    const visit = await get('SELECT * FROM visits WHERE id = ?', [prescription.visit_id]);
    if (visit.status === 'archived') {
      return res.status(403).json({ error: '已归档的就诊记录不能操作' });
    }

    if (!prescription.vet_signed) {
      return res.status(400).json({ error: '处方缺少医生签名，不能收费' });
    }

    if (prescription.charged) {
      return res.status(400).json({ error: '处方已收费' });
    }

    await run(`
      UPDATE prescriptions SET charged = 1, charged_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [req.params.id]);

    const updated = await get(`
      SELECT pr.*, uv.name as vet_signed_name, up.name as pharmacy_signed_name
      FROM prescriptions pr
      LEFT JOIN users uv ON pr.vet_signed = uv.id
      LEFT JOIN users up ON pr.pharmacy_signed = up.id
      WHERE pr.id = ?
    `, [req.params.id]);

    res.json({ prescription: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
