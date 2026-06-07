const fs = require('fs');
const path = require('path');

const backendDir = path.join(__dirname, 'backend');
const routesDir = path.join(backendDir, 'routes');

const files = {
  'database.js': `const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'vet_archive.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
  } else {
    console.log('数据库连接成功');
  }
});

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function exec(sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

module.exports = { db, run, get, all, exec };
`,

  'auth.js': `const jwt = require('jsonwebtoken');
const { get } = require('./database');

const JWT_SECRET = 'vet-medical-archive-secret-key-2024';

async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await get('SELECT id, username, name, role FROM users WHERE id = ?', [decoded.userId]);
    
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }
    
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: '无效的认证令牌' });
  }
}

function roleMiddleware(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足，需要角色: ' + roles.join(', ') });
    }
    next();
  };
}

module.exports = { authMiddleware, roleMiddleware, JWT_SECRET };
`,

  'init-db.js': `const { exec, run, get } = require('./database');
const bcrypt = require('bcryptjs');

async function initDB() {
  await exec(\`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('vet', 'lab', 'pharmacy', 'archivist')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      species TEXT NOT NULL,
      breed TEXT,
      age INTEGER,
      gender TEXT,
      owner_name TEXT NOT NULL,
      owner_phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by INTEGER REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pet_id INTEGER NOT NULL REFERENCES pets(id),
      visit_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      chief_complaint TEXT,
      diagnosis TEXT,
      vet_id INTEGER REFERENCES users(id),
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'archived')),
      archived_at DATETIME,
      archived_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS prescriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      visit_id INTEGER NOT NULL REFERENCES visits(id),
      medication TEXT NOT NULL,
      dosage TEXT NOT NULL,
      instructions TEXT,
      vet_signed INTEGER REFERENCES users(id),
      vet_signed_at DATETIME,
      pharmacy_signed INTEGER REFERENCES users(id),
      pharmacy_signed_at DATETIME,
      charged INTEGER DEFAULT 0,
      charged_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lab_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      visit_id INTEGER NOT NULL REFERENCES visits(id),
      test_name TEXT NOT NULL,
      requested_by INTEGER REFERENCES users(id),
      requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      result TEXT,
      result_by INTEGER REFERENCES users(id),
      result_at DATETIME,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed'))
    );

    CREATE TABLE IF NOT EXISTS archive_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      visit_id INTEGER NOT NULL REFERENCES visits(id),
      archived_by INTEGER NOT NULL REFERENCES users(id),
      archived_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      notes TEXT
    );
  \`);

  const users = [
    { username: 'vet01', password: 'vet123', name: '张兽医', role: 'vet' },
    { username: 'lab01', password: 'lab123', name: '李化验员', role: 'lab' },
    { username: 'pharm01', password: 'pharm123', name: '王药师', role: 'pharmacy' },
    { username: 'arch01', password: 'arch123', name: '赵档案员', role: 'archivist' }
  ];

  for (const user of users) {
    const existing = await get('SELECT id FROM users WHERE username = ?', [user.username]);
    if (!existing) {
      const hashedPassword = bcrypt.hashSync(user.password, 10);
      await run(
        'INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)',
        [user.username, hashedPassword, user.name, user.role]
      );
    }
  }

  console.log('数据库初始化完成！');
  console.log('预设账号：');
  console.log('  兽医: vet01 / vet123');
  console.log('  化验员: lab01 / lab123');
  console.log('  药房: pharm01 / pharm123');
  console.log('  档案员: arch01 / arch123');
}

initDB().catch(console.error);
`,

  'server.js': `const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const petRoutes = require('./routes/pets');
const visitRoutes = require('./routes/visits');
const prescriptionRoutes = require('./routes/prescriptions');
const labOrderRoutes = require('./routes/lab_orders');
const archiveRoutes = require('./routes/archives');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/lab-orders', labOrderRoutes);
app.use('/api/archives', archiveRoutes);

app.use(express.static(path.join(__dirname, '../frontend/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(\`动物诊疗病历归档系统后端服务已启动\`);
  console.log(\`服务地址: http://localhost:\${PORT}\`);
  console.log(\`API 前缀: /api\`);
});

module.exports = app;
`,

  'routes/auth.js': `const express = require('express');
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
`,

  'routes/pets.js': `const express = require('express');
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
    
    const visits = await all(\`
      SELECT v.*, u.name as vet_name 
      FROM visits v 
      LEFT JOIN users u ON v.vet_id = u.id 
      WHERE v.pet_id = ? 
      ORDER BY v.visit_date DESC
    \`, [req.params.id]);
    
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
    const result = await run(\`
      INSERT INTO pets (name, species, breed, age, gender, owner_name, owner_phone, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    \`, [name, species, breed, age, gender, owner_name, owner_phone, req.user.id]);

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
    
    await run(\`
      UPDATE pets SET name = ?, species = ?, breed = ?, age = ?, gender = ?, owner_name = ?, owner_phone = ?
      WHERE id = ?
    \`, [name, species, breed, age, gender, owner_name, owner_phone, req.params.id]);

    const updatedPet = await get('SELECT * FROM pets WHERE id = ?', [req.params.id]);
    res.json({ pet: updatedPet });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
`,

  'routes/visits.js': `const express = require('express');
const { run, get, all } = require('../database');
const { authMiddleware, roleMiddleware } = require('../auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const visits = await all(\`
      SELECT v.*, p.name as pet_name, p.species, p.owner_name, u.name as vet_name
      FROM visits v
      JOIN pets p ON v.pet_id = p.id
      LEFT JOIN users u ON v.vet_id = u.id
      ORDER BY v.visit_date DESC
    \`);
    res.json({ visits });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const visit = await get(\`
      SELECT v.*, p.name as pet_name, p.species, p.breed, p.age, p.gender, 
             p.owner_name, p.owner_phone, u.name as vet_name
      FROM visits v
      JOIN pets p ON v.pet_id = p.id
      LEFT JOIN users u ON v.vet_id = u.id
      WHERE v.id = ?
    \`, [req.params.id]);
    
    if (!visit) {
      return res.status(404).json({ error: '就诊记录不存在' });
    }

    const prescriptions = await all(\`
      SELECT pr.*, uv.name as vet_signed_name, up.name as pharmacy_signed_name
      FROM prescriptions pr
      LEFT JOIN users uv ON pr.vet_signed = uv.id
      LEFT JOIN users up ON pr.pharmacy_signed = up.id
      WHERE pr.visit_id = ?
      ORDER BY pr.created_at DESC
    \`, [req.params.id]);

    const labOrders = await all(\`
      SELECT lo.*, ur.name as requested_by_name, ure.name as result_by_name
      FROM lab_orders lo
      LEFT JOIN users ur ON lo.requested_by = ur.id
      LEFT JOIN users ure ON lo.result_by = ure.id
      WHERE lo.visit_id = ?
      ORDER BY lo.requested_at DESC
    \`, [req.params.id]);

    const archiveRecord = await get(\`
      SELECT ar.*, u.name as archived_by_name
      FROM archive_records ar
      JOIN users u ON ar.archived_by = u.id
      WHERE ar.visit_id = ?
      ORDER BY ar.archived_at DESC
      LIMIT 1
    \`, [req.params.id]);

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

    const result = await run(\`
      INSERT INTO visits (pet_id, chief_complaint, diagnosis, vet_id)
      VALUES (?, ?, ?, ?)
    \`, [pet_id, chief_complaint, diagnosis, req.user.id]);

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
    
    await run(\`
      UPDATE visits SET chief_complaint = ?, diagnosis = ?
      WHERE id = ?
    \`, [chief_complaint, diagnosis, req.params.id]);

    const updatedVisit = await get('SELECT * FROM visits WHERE id = ?', [req.params.id]);
    res.json({ visit: updatedVisit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
`,

  'routes/prescriptions.js': `const express = require('express');
const { run, get, all } = require('../database');
const { authMiddleware, roleMiddleware } = require('../auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/visit/:visitId', async (req, res) => {
  try {
    const prescriptions = await all(\`
      SELECT pr.*, uv.name as vet_signed_name, up.name as pharmacy_signed_name
      FROM prescriptions pr
      LEFT JOIN users uv ON pr.vet_signed = uv.id
      LEFT JOIN users up ON pr.pharmacy_signed = up.id
      WHERE pr.visit_id = ?
      ORDER BY pr.created_at DESC
    \`, [req.params.visitId]);
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

    const result = await run(\`
      INSERT INTO prescriptions (visit_id, medication, dosage, instructions)
      VALUES (?, ?, ?, ?)
    \`, [visit_id, medication, dosage, instructions]);

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

    await run(\`
      UPDATE prescriptions SET vet_signed = ?, vet_signed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    \`, [req.user.id, req.params.id]);

    const updated = await get(\`
      SELECT pr.*, uv.name as vet_signed_name, up.name as pharmacy_signed_name
      FROM prescriptions pr
      LEFT JOIN users uv ON pr.vet_signed = uv.id
      LEFT JOIN users up ON pr.pharmacy_signed = up.id
      WHERE pr.id = ?
    \`, [req.params.id]);

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

    await run(\`
      UPDATE prescriptions SET pharmacy_signed = ?, pharmacy_signed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    \`, [req.user.id, req.params.id]);

    const updated = await get(\`
      SELECT pr.*, uv.name as vet_signed_name, up.name as pharmacy_signed_name
      FROM prescriptions pr
      LEFT JOIN users uv ON pr.vet_signed = uv.id
      LEFT JOIN users up ON pr.pharmacy_signed = up.id
      WHERE pr.id = ?
    \`, [req.params.id]);

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

    await run(\`
      UPDATE prescriptions SET charged = 1, charged_at = CURRENT_TIMESTAMP
      WHERE id = ?
    \`, [req.params.id]);

    const updated = await get(\`
      SELECT pr.*, uv.name as vet_signed_name, up.name as pharmacy_signed_name
      FROM prescriptions pr
      LEFT JOIN users uv ON pr.vet_signed = uv.id
      LEFT JOIN users up ON pr.pharmacy_signed = up.id
      WHERE pr.id = ?
    \`, [req.params.id]);

    res.json({ prescription: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
`,

  'routes/lab_orders.js': `const express = require('express');
const { run, get, all } = require('../database');
const { authMiddleware, roleMiddleware } = require('../auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/visit/:visitId', async (req, res) => {
  try {
    const labOrders = await all(\`
      SELECT lo.*, ur.name as requested_by_name, ure.name as result_by_name
      FROM lab_orders lo
      LEFT JOIN users ur ON lo.requested_by = ur.id
      LEFT JOIN users ure ON lo.result_by = ure.id
      WHERE lo.visit_id = ?
      ORDER BY lo.requested_at DESC
    \`, [req.params.visitId]);
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

    const result = await run(\`
      INSERT INTO lab_orders (visit_id, test_name, requested_by)
      VALUES (?, ?, ?)
    \`, [visit_id, test_name, req.user.id]);

    const labOrder = await get(\`
      SELECT lo.*, ur.name as requested_by_name
      FROM lab_orders lo
      LEFT JOIN users ur ON lo.requested_by = ur.id
      WHERE lo.id = ?
    \`, [result.lastID]);
    
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

    await run(\`
      UPDATE lab_orders SET result = ?, result_by = ?, result_at = CURRENT_TIMESTAMP, status = 'completed'
      WHERE id = ?
    \`, [result, req.user.id, req.params.id]);

    const updated = await get(\`
      SELECT lo.*, ur.name as requested_by_name, ure.name as result_by_name
      FROM lab_orders lo
      LEFT JOIN users ur ON lo.requested_by = ur.id
      LEFT JOIN users ure ON lo.result_by = ure.id
      WHERE lo.id = ?
    \`, [req.params.id]);

    res.json({ labOrder: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
`,

  'routes/archives.js': `const express = require('express');
const { db, run, get, all } = require('../database');
const { authMiddleware, roleMiddleware } = require('../auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const archives = await all(\`
      SELECT ar.*, v.pet_id, p.name as pet_name, u.name as archived_by_name
      FROM archive_records ar
      JOIN visits v ON ar.visit_id = v.id
      JOIN pets p ON v.pet_id = p.id
      JOIN users u ON ar.archived_by = u.id
      ORDER BY ar.archived_at DESC
    \`);
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

    const pendingLabOrders = await get(\`
      SELECT COUNT(*) as count FROM lab_orders 
      WHERE visit_id = ? AND status = 'pending'
    \`, [visitId]);

    if (pendingLabOrders.count > 0) {
      return res.status(400).json({ error: '检验单未回填，不能归档' });
    }

    const hasLabOrders = await get(\`
      SELECT COUNT(*) as count FROM lab_orders WHERE visit_id = ?
    \`, [visitId]);

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

    const archiveRecord = await get(\`
      SELECT ar.*, u.name as archived_by_name
      FROM archive_records ar
      JOIN users u ON ar.archived_by = u.id
      WHERE ar.visit_id = ?
      ORDER BY ar.archived_at DESC
      LIMIT 1
    \`, [visitId]);

    res.status(201).json({ archive: archiveRecord });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/visit/:visitId', async (req, res) => {
  try {
    const archiveRecord = await get(\`
      SELECT ar.*, u.name as archived_by_name
      FROM archive_records ar
      JOIN users u ON ar.archived_by = u.id
      WHERE ar.visit_id = ?
      ORDER BY ar.archived_at DESC
      LIMIT 1
    \`, [req.params.visitId]);

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
`
};

console.log('开始创建后端文件...');

for (const [filename, content] of Object.entries(files)) {
  const filePath = path.join(backendDir, filename);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`  ✓ ${filename}`);
}

console.log('\\n所有后端文件创建完成！');
