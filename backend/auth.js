const jwt = require('jsonwebtoken');
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
