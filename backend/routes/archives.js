const express = require('express');
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
