#!/usr/bin/env python3
import os

backend_dir = os.path.join(os.getcwd(), 'backend')
routes_dir = os.path.join(backend_dir, 'routes')

files = {}

files['auth.js'] = r'''const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { get } = require('../database');
const { JWT_SECRET, authMiddleware } = require('../auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  try {
    const user = await get('SELECT * FROM users WHERE username = ?', [username]);
    
    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const isValid = bcrypt.compareSync(password, user.password);
    
    if (!isValid) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
'''

files['pets.js'] = r'''const express = require('express');
const { run, get, all } = require('../database');
const { authMiddleware, roleMiddleware } = require('../auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const pets = await all('SELECT * FROM pets ORDER BY created_at DESC');
    res.json({ pets });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const pet = await get('SELECT * FROM pets WHERE id = ?', [req.params.id]);
    if (!pet) {
      return res.status(404).json({ error: '宠物档案不存在' });
    }
    
    const visits = await all(`
      SELECT v.*, u.name as vet_name 
      FROM visits v 
      LEFT JOIN users u ON v.vet_id = u.id 
      WHERE v.pet_id = ? 
      ORDER BY v.visit_date DESC
    `, [req.params.id]);
    
    res.json({ pet, visits });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/', roleMiddleware('vet'), async (req, res) => {
  const { name, species, breed, age, gender, owner_name, owner_phone } = req.body;
  
  if (!name || !species || !owner_name) {
    return res.status(400).json({ error: '宠物名称、种类和主人姓名为必填项' });
  }

  try {
    const result = await run(`
      INSERT INTO pets (name, species, breed, age, gender, owner_name, owner_phone, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [name, species, breed, age, gender, owner_name, owner_phone, req.user.id]);

    const pet = await get('SELECT * FROM pets WHERE id = ?', [result.lastID]);
    res.status(201).json({ pet });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.put('/:id', roleMiddleware('vet'), async (req, res) => {
  try {
    const pet = await get('SELECT * FROM pets WHERE id = ?', [req.params.id]);
    if (!pet) {
      return res.status(404).json({ error: '宠物档案不存在' });
    }

    const { name, species, breed, age, gender, owner_name, owner_phone } = req.body;
    
    await run(`
      UPDATE pets SET name = ?, species = ?, breed = ?, age = ?, gender = ?, owner_name = ?, owner_phone = ?
      WHERE id = ?
    `, [name, species, breed, age, gender, owner_name, owner_phone, req.params.id]);

    const updatedPet = await get('SELECT * FROM pets WHERE id = ?', [req.params.id]);
    res.json({ pet: updatedPet });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
'''

files['visits.js'] = r'''const express = require('express');
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
'''

files['prescriptions.js'] = r'''const express = require('express');
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
'''

files['lab_orders.js'] = r'''const express = require('express');
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
'''

files['archives.js'] = r'''const express = require('express');
const { db, run, get, all } = require('../database');
const { authMiddleware, roleMiddleware } = require('../auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const archives = await all(`
      SELECT ar.*, v.pet_id, p.name as pet_name, u.name as archived_by_name
      FROM archive_records ar
      JOIN visits v ON ar.visit_id = v.id
      JOIN pets p ON v.pet_id = p.id
      JOIN users u ON ar.archived_by = u.id
      ORDER BY ar.archived_at DESC
    `);
    res.json({ archives });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/:visitId', roleMiddleware('archivist'), async (req, res) => {
  const { notes } = req.body;
  const visitId = req.params.visitId;

  try {
    const visit = await get('SELECT * FROM visits WHERE id = ?', [visitId]);
    if (!visit) {
      return res.status(404).json({ error: '就诊记录不存在' });
    }

    if (visit.status === 'archived') {
      return res.status(400).json({ error: '该就诊记录已归档' });
    }

    const pendingLabOrders = await get(`
      SELECT COUNT(*) as count FROM lab_orders 
      WHERE visit_id = ? AND status = 'pending'
    `, [visitId]);

    if (pendingLabOrders.count > 0) {
      return res.status(400).json({ error: '检验单未回填，不能归档' });
    }

    const hasLabOrders = await get(`
      SELECT COUNT(*) as count FROM lab_orders WHERE visit_id = ?
    `, [visitId]);

    if (hasLabOrders.count === 0) {
      return res.status(400).json({ error: '检验单缺失，不能归档' });
    }

    await new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        db.run(
          'INSERT INTO archive_records (visit_id, archived_by, notes) VALUES (?, ?, ?)',
          [visitId, req.user.id, notes],
          function(err) {
            if (err) {
              db.run('ROLLBACK');
              return reject(err);
            }
          }
        );
        
        db.run(
          "UPDATE visits SET status = 'archived', archived_at = CURRENT_TIMESTAMP, archived_by = ? WHERE id = ?",
          [req.user.id, visitId],
          function(err) {
            if (err) {
              db.run('ROLLBACK');
              return reject(err);
            }
            db.run('COMMIT', (commitErr) => {
              if (commitErr) reject(commitErr);
              else resolve();
            });
          }
        );
      });
    });

    const archiveRecord = await get(`
      SELECT ar.*, u.name as archived_by_name
      FROM archive_records ar
      JOIN users u ON ar.archived_by = u.id
      WHERE ar.visit_id = ?
      ORDER BY ar.archived_at DESC
      LIMIT 1
    `, [visitId]);

    res.status(201).json({ archive: archiveRecord });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/visit/:visitId', async (req, res) => {
  try {
    const archiveRecord = await get(`
      SELECT ar.*, u.name as archived_by_name
      FROM archive_records ar
      JOIN users u ON ar.archived_by = u.id
      WHERE ar.visit_id = ?
      ORDER BY ar.archived_at DESC
      LIMIT 1
    `, [req.params.visitId]);

    if (!archiveRecord) {
      return res.status(404).json({ error: '该就诊记录未归档' });
    }

    res.json({ archive: archiveRecord });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
'''

print('开始创建路由文件...\n')

for filename, content in files.items():
    filepath = os.path.join(routes_dir, filename)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'  ✓ routes/{filename}')

print('\n所有路由文件创建完成！')
