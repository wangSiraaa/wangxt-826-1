#!/usr/bin/env python3
import requests
import json

BASE_URL = "http://localhost:3001"

def main():
    print("=== 验证归档后病历只读功能 ===")
    print()

    # 兽医登录
    print("1. 兽医登录...")
    resp = requests.post(f"{BASE_URL}/api/auth/login", 
                        json={"username":"vet01","password":"vet123"})
    vet_token = resp.json()["token"]
    vet_headers = {"Authorization": f"Bearer {vet_token}"}
    print("   ✓ 兽医登录成功")

    # 创建宠物
    print()
    print("2. 创建宠物档案...")
    resp = requests.post(f"{BASE_URL}/api/pets", 
                        headers=vet_headers,
                        json={"name":"测试只读","species":"猫","breed":"英短","age":2,
                              "gender":"母","owner_name":"测试用户","owner_phone":"13900139000"})
    pet_id = resp.json()["pet"]["id"]
    print(f"   ✓ 宠物创建成功 (ID: {pet_id})")

    # 创建就诊记录
    print()
    print("3. 创建就诊记录...")
    resp = requests.post(f"{BASE_URL}/api/visits", 
                        headers=vet_headers,
                        json={"pet_id": pet_id, "chief_complaint":"测试主诉","diagnosis":"测试诊断"})
    visit_id = resp.json()["visit"]["id"]
    print(f"   ✓ 就诊记录创建成功 (ID: {visit_id})")

    # 创建检验单
    print()
    print("4. 创建检验单...")
    resp = requests.post(f"{BASE_URL}/api/lab-orders", 
                        headers=vet_headers,
                        json={"visit_id": visit_id, "test_name":"血常规"})
    lab_id = resp.json()["labOrder"]["id"]
    print(f"   ✓ 检验单创建成功 (ID: {lab_id})")

    # 化验员登录并回填
    resp = requests.post(f"{BASE_URL}/api/auth/login", 
                        json={"username":"lab01","password":"lab123"})
    lab_token = resp.json()["token"]
    lab_headers = {"Authorization": f"Bearer {lab_token}"}
    
    requests.put(f"{BASE_URL}/api/lab-orders/{lab_id}/result",
                 headers=lab_headers,
                 json={"result":"各项指标正常"})
    print("   ✓ 检验单回填完成")

    # 档案员登录并归档
    print()
    print("5. 档案员归档...")
    resp = requests.post(f"{BASE_URL}/api/auth/login", 
                        json={"username":"arch01","password":"arch123"})
    arch_token = resp.json()["token"]
    arch_headers = {"Authorization": f"Bearer {arch_token}"}
    
    resp = requests.post(f"{BASE_URL}/api/archives/{visit_id}",
                         headers=arch_headers,
                         json={"notes":"测试归档"})
    print(f"   归档 HTTP 状态码: {resp.status_code}")

    # 验证归档后不能修改
    print()
    print("6. 验证归档后不能修改...")
    resp = requests.put(f"{BASE_URL}/api/visits/{visit_id}",
                        headers=vet_headers,
                        json={"chief_complaint":"修改后的主诉","diagnosis":"修改后的诊断"})
    
    print(f"   修改 HTTP 状态码: {resp.status_code}")
    error_msg = resp.json().get("error", "")
    print(f"   错误信息: {error_msg}")

    if resp.status_code == 403 and "已归档" in error_msg:
        print()
        print("✅ 归档后病历只读功能验证通过！")
        print("   - 归档后修改被正确拒绝")
        print("   - 返回了正确的错误信息")
        return 0
    else:
        print()
        print("❌ 归档后病历只读功能验证失败！")
        return 1

if __name__ == "__main__":
    exit(main())
