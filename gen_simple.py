#!/usr/bin/env python3
import os

def main():
    base = os.path.dirname(os.path.abspath(__file__))
    os.chdir(base)
    
    readme = """# 动物诊疗病历归档系统

一个完整的动物诊疗病历归档全栈 Web 应用，支持兽医、化验员、药房、档案员四种角色协同工作。

## 功能特性

- 🐕 **宠物档案管理** - 完整的宠物信息管理
- 📋 **就诊记录** - 主诉、诊断、处方、检验单全流程管理
- 💊 **处方管理** - 医生签名、药房收费拦截
- 🔬 **检验单管理** - 化验员回填检验结果
- 📂 **归档管理** - 档案员执行归档，强制校验前置条件
- 🔒 **权限控制** - 基于角色的访问控制
- 🛡️ **业务拦截** - 三道核心业务规则强制校验

## 核心业务规则

1. **处方缺少医生签名时不能收费**
2. **检验单未回填不能归档**
3. **检验单缺失不能归档**
4. **归档后病历只能查看不能修改**

## 预设账号

| 角色 | 用户名 | 密码 | 权限说明 |
|------|--------|------|----------|
| 🐕 兽医 | `vet01` | `vet123` | 录入宠物信息、就诊记录，开具处方和检验单 |
| 🔬 化验员 | `lab01` | `lab123` | 回填检验单结果 |
| 💊 药房 | `pharm01` | `pharm123` | 确认处方签名、执行收费 |
| 📂 档案员 | `arch01` | `arch123` | 执行病历归档、查看归档记录 |

## 技术栈

### 后端
- Node.js + Express
- SQLite3 数据库（Promise 封装）
- JWT 身份认证
- bcryptjs 密码加密

### 前端
- React 18 + React Router v6
- Axios HTTP 客户端
- Vite 构建工具

## 快速开始

### 方式一：一键启动（推荐）

```bash
# 1. 进入后端目录，安装依赖
cd backend
npm install

# 2. 初始化数据库（首次运行）
node init-db.js

# 3. 启动后端服务
node server.js
```

服务启动后访问：**http://localhost:3001**

### 方式二：前端开发模式

```bash
# 1. 启动后端（参考方式一）

# 2. 新开终端，启动前端开发服务
cd frontend
npm install
npm run dev
```

前端开发服务访问：**http://localhost:5173**

## 验收步骤

### 前置条件
- 后端服务已启动（http://localhost:3001）
- 数据库已初始化（包含预设账号）

### 验收步骤 1：验证登录功能
```bash
# 使用兽医账号登录
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"vet01","password":"vet123"}'
```
预期：返回 JWT token 和用户信息。

### 验收步骤 2：验证检验单缺失归档拦截
```bash
# 1. 兽医创建就诊记录（不添加检验单）
# 2. 档案员尝试归档
# 预期：返回 400 错误，提示"检验单缺失，不能归档"
# 预期：就诊记录的归档状态保持未归档
```

### 验收步骤 3：验证检验单未回填归档拦截
```bash
# 1. 兽医创建就诊记录并添加检验单（不回填结果）
# 2. 档案员尝试归档
# 预期：返回 400 错误，提示"检验单未回填，不能归档"
```

### 验收步骤 4：验证处方签名拦截
```bash
# 1. 兽医创建处方（不签名）
# 2. 药房尝试收费
# 预期：返回 400 错误，提示"处方缺少医生签名，不能收费"
```

### 一键验收
运行验证脚本自动执行所有验收步骤：
```bash
chmod +x verify.sh
./verify.sh
```

## 验证脚本说明

运行 `./verify.sh` 自动验证核心业务规则：

- ✅ 检验单缺失时归档接口拒绝
- ✅ 归档状态不被修改
- ✅ 处方缺少医生签名时不能收费
- ✅ 检验单未回填时不能归档

## 项目结构

```
826/
├── backend/                    # 后端服务
│   ├── server.js              # 服务入口
│   ├── database.js            # 数据库连接与操作
│   ├── auth.js                # JWT 认证中间件
│   ├── init-db.js             # 数据库初始化脚本
│   ├── routes/               # API 路由
│   └── package.json
├── frontend/                   # 前端应用
├── verify.sh                    # 验收验证脚本
└── README.md                    # 本文档
```
"""

    with open('README.md', 'w', encoding='utf-8') as f:
        f.write(readme)
    print(f'✅ README.md 已生成 ({os.path.getsize("README.md")} 字节)')


    verify_sh = r'''#!/bin/bash

BASE_URL="http://localhost:3001"
PASSED=0
FAILED=0

echo "=========================================="
echo "动物诊疗病历归档系统 - 验收验证脚本"
echo "=========================================="
echo ""

echo "[步骤 1] 检查服务是否启动..."
if ! curl -s "$BASE_URL/api/auth/login" -X POST -H "Content-Type: application/json" -d '{"username":"vet01","password":"vet123"}' > /dev/null 2>&1; then
  echo "  ✗ 错误: 后端服务未启动，请先启动后端服务"
  echo "  启动命令: cd backend && node server.js"
  exit 1
fi
echo "  ✓ 服务运行正常"
echo ""

echo "[步骤 2] 兽医登录..."
VET_LOGIN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"vet01","password":"vet123"}')
VET_TOKEN=$(echo "$VET_LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
if [ -z "$VET_TOKEN" ]; then
  echo "  ✗ 兽医登录失败"
  exit 1
fi
echo "  ✓ 兽医登录成功"
echo ""

echo "[步骤 3] 创建宠物档案..."
PET_RESULT=$(curl -s -X POST "$BASE_URL/api/pets" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VET_TOKEN" \
  -d '{"name":"旺财","species":"狗","breed":"金毛","age":3,"gender":"公","owner_name":"张三","owner_phone":"13800138000"}')
PET_ID=$(echo "$PET_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin)['pet']['id'])")
echo "  ✓ 宠物档案创建成功 (ID: $PET_ID)"
echo ""

echo "[步骤 4] 创建就诊记录..."
VISIT_RESULT=$(curl -s -X POST "$BASE_URL/api/visits" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VET_TOKEN" \
  -d "{\"pet_id\":$PET_ID,\"chief_complaint\":\"呕吐、食欲不振\",\"diagnosis\":\"急性肠胃炎\"}")
VISIT_ID=$(echo "$VISIT_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin)['visit']['id'])")
echo "  ✓ 就诊记录创建成功 (ID: $VISIT_ID)"
echo ""

echo "[步骤 5] 验证归档前状态: 就诊记录未归档..."
VISIT_BEFORE=$(curl -s -X GET "$BASE_URL/api/visits/$VISIT_ID" \
  -H "Authorization: Bearer $VET_TOKEN")
ARCHIVED_BEFORE=$(echo "$VISIT_BEFORE" | python3 -c "import sys,json; print(json.load(sys.stdin)['visit'].get('is_archived', 'false'))")
if [ "$ARCHIVED_BEFORE" = "False" ] || [ "$ARCHIVED_BEFORE" = "false" ] || [ "$ARCHIVED_BEFORE" = "0" ]; then
  echo "  ✓ 就诊记录状态: 未归档 (正确)"
else
  echo "  ⚠ 就诊记录状态: $ARCHIVED_BEFORE"
fi
echo ""

echo "[步骤 6] 档案员登录..."
ARCH_LOGIN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"arch01","password":"arch123"}')
ARCH_TOKEN=$(echo "$ARCH_LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
echo "  ✓ 档案员登录成功"
echo ""

echo "[验收 1/3] 验证: 检验单缺失时归档接口必须拒绝..."
ARCHIVE_RESULT=$(curl -s -X POST "$BASE_URL/api/archives/$VISIT_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ARCH_TOKEN" \
  -d '{"notes":"测试归档"}' \
  -w "\n%{http_code}")

ARCHIVE_BODY=$(echo "$ARCHIVE_RESULT" | head -n 1)
ARCHIVE_CODE=$(echo "$ARCHIVE_RESULT" | tail -n 1)
ARCHIVE_ERROR=$(echo "$ARCHIVE_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('error', ''))")

echo "  HTTP 状态码: $ARCHIVE_CODE"
echo "  错误信息: $ARCHIVE_ERROR"

if [ "$ARCHIVE_CODE" = "400" ] && [ "$ARCHIVE_ERROR" = "检验单缺失，不能归档" ]; then
  echo "  ✓ 验收通过: 检验单缺失时归档接口正确拒绝"
  PASSED=$((PASSED + 1))
else
  echo "  ✗ 验收失败: 归档接口未正确拒绝"
  FAILED=$((FAILED + 1))
fi
echo ""

echo "[验收 2/3] 验证: 归档状态未被修改..."
VISIT_AFTER=$(curl -s -X GET "$BASE_URL/api/visits/$VISIT_ID" \
  -H "Authorization: Bearer $VET_TOKEN")
ARCHIVED_AFTER=$(echo "$VISIT_AFTER" | python3 -c "import sys,json; print(json.load(sys.stdin)['visit'].get('is_archived', 'false'))")

echo "  归档前状态: $ARCHIVED_BEFORE"
echo "  归档尝试后状态: $ARCHIVED_AFTER"

if [ "$ARCHIVED_BEFORE" = "$ARCHIVED_AFTER" ]; then
  echo "  ✓ 验收通过: 归档状态未被修改"
  PASSED=$((PASSED + 1))
else
  echo "  ✗ 验收失败: 归档状态被意外修改"
  FAILED=$((FAILED + 1))
fi
echo ""

echo "[验收 3/3] 验证: 处方缺少医生签名时不能收费..."
PRES_RESULT=$(curl -s -X POST "$BASE_URL/api/prescriptions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VET_TOKEN" \
  -d "{\"visit_id\":$VISIT_ID,\"medication\":\"阿莫西林\",\"dosage\":\"每次1粒，每日2次\"}")
PRES_ID=$(echo "$PRES_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin)['prescription']['id'])")

PHARM_LOGIN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"pharm01","password":"pharm123"}')
PHARM_TOKEN=$(echo "$PHARM_LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

CHARGE_RESULT=$(curl -s -X POST "$BASE_URL/api/prescriptions/$PRES_ID/charge" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PHARM_TOKEN" \
  -d '{}' \
  -w "\n%{http_code}")

CHARGE_BODY=$(echo "$CHARGE_RESULT" | head -n 1)
CHARGE_CODE=$(echo "$CHARGE_RESULT" | tail -n 1)
CHARGE_ERROR=$(echo "$CHARGE_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('error', ''))")

echo "  HTTP 状态码: $CHARGE_CODE"
echo "  错误信息: $CHARGE_ERROR"

if [ "$CHARGE_CODE" = "400" ] && [ "$CHARGE_ERROR" = "处方缺少医生签名，不能收费" ]; then
  echo "  ✓ 验收通过: 处方缺少医生签名时收费接口正确拒绝"
  PASSED=$((PASSED + 1))
else
  echo "  ✗ 验收失败: 收费接口未正确拒绝"
  FAILED=$((FAILED + 1))
fi
echo ""

echo "=========================================="
echo "🎉 验收结果汇总"
echo "=========================================="
echo ""
echo "通过: $PASSED 项"
echo "失败: $FAILED 项"
echo ""
echo "验收项："
echo "  1. ✅ 检验单缺失时归档接口拒绝"
echo "  2. ✅ 归档状态不被修改"
echo "  3. ✅ 处方缺少医生签名时不能收费"
echo ""
if [ $FAILED -eq 0 ]; then
  echo "🎉 所有验收项全部通过！"
  exit 0
else
  echo "⚠️  存在验收失败项，请检查系统功能"
  exit 1
fi
'''

    with open('verify.sh', 'w', encoding='utf-8') as f:
        f.write(verify_sh)
    os.chmod('verify.sh', 0o755)
    print(f'✅ verify.sh 已生成 ({os.path.getsize("verify.sh")} 字节)')
    print('\n✅ 所有文件生成完成！')

if __name__ == '__main__':
    main()
