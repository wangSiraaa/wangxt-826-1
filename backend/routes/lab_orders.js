const express = require('express');
const { run, get, all } = require('../database');
const { authMiddleware, roleMiddleware } = require('../auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/visit/:visitId', async (req, res) => {
  try {
    const labOrders = await all(`
      SELECT lo.*, ur.name as requested_by_name, ure.name as result_by_name
      FROM lab_orders lo
      LEFT JOIN users ur ON lo.requested_by = ur.id
      LEFT JOIN users ure ON lo.result_by = ure.id
      WHERE lo.visit_id = ?
      ORDER BY lo.requested_at DESC
    `, [req.params.visitId]);
    res.json({ labOrders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/', roleMiddleware('vet'), async (req, res) => {
  const { visit_id, test_name } = req.body;
  
  if (!visit_id || !test_name) {
    return res.status(400).json({ error: '就诊ID和检验项目为必填项' });
  }

  try {
    const visit = await get('SELECT * FROM visits WHERE id = ?', [visit_id]);
    if (!visit) {
      return res.status(404).json({ error: '就诊记录不存在' });
    }

    if (visit.status === 'archived') {
      return res.status(403).json({ error: '已归档的就诊记录不能添加检验单' });
    }

    const result = await run(`
      INSERT INTO lab_orders (visit_id, test_name, requested_by)
      VALUES (?, ?, ?)
    `, [visit_id, test_name, req.user.id]);

    const labOrder = await get(`
      SELECT lo.*, ur.name as requested_by_name
      FROM lab_orders lo
      LEFT JOIN users ur ON lo.requested_by = ur.id
      WHERE lo.id = ?
    `, [result.lastID]);
    
    res.status(201).json({ labOrder });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.put('/:id/result', roleMiddleware('lab'), async (req, res) => {
  const { result } = req.body;
  
  if (!result) {
    return res.status(400).json({ error: '检验结果为必填项' });
  }

  try {
    const labOrder = await get('SELECT * FROM lab_orders WHERE id = ?', [req.params.id]);
    if (!labOrder) {
      return res.status(404).json({ error: '检验单不存在' });
    }

    const visit = await get('SELECT * FROM visits WHERE id = ?', [labOrder.visit_id]);
    if (visit.status === 'archived') {
      return res.status(403).json({ error: '已归档的就诊记录不能修改' });
    }

    await run(`
      UPDATE lab_orders SET result = ?, result_by = ?, result_at = CURRENT_TIMESTAMP, status = 'completed'
      WHERE id = ?
    `, [result, req.user.id, req.params.id]);

    const updated = await get(`
      SELECT lo.*, ur.name as requested_by_name, ure.name as result_by_name
      FROM lab_orders lo
      LEFT JOIN users ur ON lo.requested_by = ur.id
      LEFT JOIN users ure ON lo.result_by = ure.id
      WHERE lo.id = ?
    `, [req.params.id]);

    res.json({ labOrder: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
