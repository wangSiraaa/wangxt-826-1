const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const petRoutes = require('./routes/pets');
const visitRoutes = require('./routes/visits');
const prescriptionRoutes = require('./routes/prescriptions');
const labOrderRoutes = require('./routes/lab_orders');
const archiveRoutes = require('./routes/archives');
const riskReviewRoutes = require('./routes/risk_review');

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
app.use('/api/risk-review', riskReviewRoutes);

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
