const express = require('express');
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
