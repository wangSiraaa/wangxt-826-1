const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function test() {
  console.log('==========================================');
  console.log('动物诊疗病历归档系统 - 验证脚本');
  console.log('==========================================\n');

  let vetToken, archToken, pharmToken;
  let petId, visitId, prescriptionId;

  console.log('[测试 1] 兽医登录...');
  try {
    const res = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'vet01',
      password: 'vet123'
    });
    vetToken = res.data.token;
    console.log('  ✓ 兽医登录成功\n');
  } catch (e) {
    console.log('  ✗ 失败:', e.response?.data?.error || e.message);
    process.exit(1);
  }

  console.log('[测试 2] 创建宠物档案...');
  try {
    const res = await axios.post(`${BASE_URL}/api/pets`, {
      name: '旺财',
      species: '狗',
      breed: '金毛',
      age: 3,
      gender: '公',
      owner_name: '张三',
      owner_phone: '13800138000'
    }, { headers: { Authorization: `Bearer ${vetToken}` } });
    petId = res.data.pet.id;
    console.log(`  ✓ 宠物档案创建成功 (ID: ${petId})\n`);
  } catch (e) {
    console.log('  ✗ 失败:', e.response?.data?.error || e.message);
    process.exit(1);
  }

  console.log('[测试 3] 创建就诊记录...');
  try {
    const res = await axios.post(`${BASE_URL}/api/visits`, {
      pet_id: petId,
      chief_complaint: '呕吐、食欲不振',
      diagnosis: '急性肠胃炎'
    }, { headers: { Authorization: `Bearer ${vetToken}` } });
    visitId = res.data.visit.id;
    console.log(`  ✓ 就诊记录创建成功 (ID: ${visitId})\n`);
  } catch (e) {
    console.log('  ✗ 失败:', e.response?.data?.error || e.message);
    process.exit(1);
  }

  console.log('[测试 4] 验证核心规则: 检验单缺失时归档接口拒绝...');
  try {
    const archLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'arch01',
      password: 'arch123'
    });
    archToken = archLogin.data.token;

    try {
      await axios.post(`${BASE_URL}/api/archives/${visitId}`, {
        notes: '测试归档'
      }, { headers: { Authorization: `Bearer ${archToken}` } });
      console.log('  ✗ 验证失败: 归档接口未拒绝');
      process.exit(1);
    } catch (e) {
      const error = e.response?.data?.error;
      if (error === '检验单缺失，不能归档') {
        console.log('  ✓ 验证通过: 检验单缺失时归档接口正确拒绝');
        console.log(`    错误信息: ${error}\n`);
      } else {
        console.log('  ✗ 验证失败: 错误信息不匹配');
        console.log('    实际错误:', error);
        process.exit(1);
      }
    }
  } catch (e) {
    console.log('  ✗ 失败:', e.response?.data?.error || e.message);
    process.exit(1);
  }

  console.log('[测试 5] 验证核心规则: 处方缺少医生签名时不能收费...');
  try {
    const presRes = await axios.post(`${BASE_URL}/api/prescriptions`, {
      visit_id: visitId,
      medication: '阿莫西林',
      dosage: '每次1粒，每日2次'
    }, { headers: { Authorization: `Bearer ${vetToken}` } });
    prescriptionId = presRes.data.prescription.id;

    const pharmLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'pharm01',
      password: 'pharm123'
    });
    pharmToken = pharmLogin.data.token;

    try {
      await axios.post(`${BASE_URL}/api/prescriptions/${prescriptionId}/charge`, {}, {
        headers: { Authorization: `Bearer ${pharmToken}` }
      });
      console.log('  ✗ 验证失败: 收费接口未拒绝');
      process.exit(1);
    } catch (e) {
      const error = e.response?.data?.error;
      if (error === '处方缺少医生签名，不能收费') {
        console.log('  ✓ 验证通过: 处方缺少医生签名时收费接口正确拒绝');
        console.log(`    错误信息: ${error}\n`);
      } else {
        console.log('  ✗ 验证失败: 错误信息不匹配');
        console.log('    实际错误:', error);
        process.exit(1);
      }
    }
  } catch (e) {
    console.log('  ✗ 失败:', e.response?.data?.error || e.message);
    process.exit(1);
  }

  console.log('[测试 6] 验证核心规则: 检验单未回填时不能归档...');
  try {
    await axios.post(`${BASE_URL}/api/lab-orders`, {
      visit_id: visitId,
      test_name: '血常规'
    }, { headers: { Authorization: `Bearer ${vetToken}` } });

    console.log('  ✓ 已添加检验单（未回填）');

    try {
      await axios.post(`${BASE_URL}/api/archives/${visitId}`, {
        notes: '测试归档'
      }, { headers: { Authorization: `Bearer ${archToken}` } });
      console.log('  ✗ 验证失败: 归档接口未拒绝');
      process.exit(1);
    } catch (e) {
      const error = e.response?.data?.error;
      if (error === '检验单未回填，不能归档') {
        console.log('  ✓ 验证通过: 检验单未回填时归档接口正确拒绝');
        console.log(`    错误信息: ${error}\n`);
      } else {
        console.log('  ✗ 验证失败: 错误信息不匹配');
        console.log('    实际错误:', error);
        process.exit(1);
      }
    }
  } catch (e) {
    console.log('  ✗ 失败:', e.response?.data?.error || e.message);
    process.exit(1);
  }

  console.log('==========================================');
  console.log('🎉 所有验证测试通过！');
  console.log('==========================================\n');
  console.log('三项核心业务规则验证结果：');
  console.log('  1. ✓ 检验单缺失时归档接口拒绝');
  console.log('  2. ✓ 检验单未回填时归档接口拒绝');
  console.log('  3. ✓ 处方缺少医生签名时不能收费');
  console.log('');
}

test().catch(e => {
  console.error('测试执行出错:', e.message);
  process.exit(1);
});
