#!/usr/bin/env python3
import os

backend_dir = os.path.join(os.getcwd(), 'backend')
routes_dir = os.path.join(backend_dir, 'routes')

files = {}

files['database.js'] = r'''const sqlite3 = require('sqlite3').verbose();
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
'''

files['auth.js'] = r'''const jwt = require('jsonwebtoken');
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
'''

files['init-db.js'] = r'''const { exec, run, get } = require('./database');
const bcrypt = require('bcryptjs');

async function initDB() {
  await exec(`
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
  `);

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
'''

files['server.js'] = r'''const express = require('express');
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
  console.log(`动物诊疗病历归档系统后端服务已启动`);
  console.log(`服务地址: http://localhost:${PORT}`);
  console.log(`API 前缀: /api`);
});

module.exports = app;
'''

print('开始创建后端文件...\n')

for filename, content in files.items():
    filepath = os.path.join(backend_dir, filename)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'  ✓ {filename}')

print('\n核心后端文件创建完成！')
