const { exec, run, get } = require('./database');
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
