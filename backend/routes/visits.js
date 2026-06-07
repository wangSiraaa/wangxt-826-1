const express = require('express');
const { run, get, all } = require('../database');
const { authMiddleware, roleMiddleware } = require('../auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const visits = await all(`
      SELECT v.*, p.name as pet_name, p.species, p.owner_name, u.name as vet_name
      FROM visits v
      JOIN pets p ON v.pet_id = p.id
      LEFT JOIN users u ON v.vet_id = u.id
      ORDER BY v.visit_date DESC
    `);
    res.json({ visits });
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

    res.json({ visit, prescriptions, labOrders, archiveRecord });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/', roleMiddleware('vet'), async (req, res) => {
  const { pet_id, chief_complaint, diagnosis } = req.body;
  
  if (!pet_id) {
    return res.status(400).json({ error: '必须选择宠物' });
  }

  try {
    const pet = await get('SELECT * FROM pets WHERE id = ?', [pet_id]);
    if (!pet) {
      return res.status(404).json({ error: '宠物档案不存在' });
    }

    const result = await run(`
      INSERT INTO visits (pet_id, chief_complaint, diagnosis, vet_id)
      VALUES (?, ?, ?, ?)
    `, [pet_id, chief_complaint, diagnosis, req.user.id]);

    const visit = await get('SELECT * FROM visits WHERE id = ?', [result.lastID]);
    res.status(201).json({ visit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.put('/:id', roleMiddleware('vet'), async (req, res) => {
  try {
    const visit = await get('SELECT * FROM visits WHERE id = ?', [req.params.id]);
    if (!visit) {
      return res.status(404).json({ error: '就诊记录不存在' });
    }

    if (visit.status === 'archived') {
      return res.status(403).json({ error: '已归档的就诊记录不能修改' });
    }

    const { chief_complaint, diagnosis } = req.body;
    
    await run(`
      UPDATE visits SET chief_complaint = ?, diagnosis = ?
      WHERE id = ?
    `, [chief_complaint, diagnosis, req.params.id]);

    const updatedVisit = await get('SELECT * FROM visits WHERE id = ?', [req.params.id]);
    res.json({ visit: updatedVisit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
