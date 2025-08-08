# Stripe 环境配置指南

## 🔄 环境区分

### 🧪 测试环境 (Sandbox)
- **用途**: 开发和测试
- **特点**: 不会产生真实费用
- **密钥前缀**: `pk_test_` 和 `sk_test_`

### 🚀 生产环境 (Live)
- **用途**: 真实业务
- **特点**: 会产生真实费用
- **密钥前缀**: `pk_live_` 和 `sk_live_`

---

## 🧪 测试环境配置

### 本地开发 (.env.local)

```bash
# Stripe 测试环境配置
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_test_secret_key_here

# 环境标识
NODE_ENV=development
STRIPE_ENV=test
```

### 测试环境部署

```bash
# Vercel 测试环境变量
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_test_secret_key_here
NODE_ENV=development
STRIPE_ENV=test
```

---

## 🚀 生产环境配置

### 生产环境部署

```bash
# Vercel 生产环境变量
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key_here
STRIPE_SECRET_KEY=sk_live_your_live_secret_key_here
NODE_ENV=production
STRIPE_ENV=live
```

---

## 🔧 环境检测和切换

### 自动环境检测

```javascript
// 检测当前环境
const isTestEnv = process.env.STRIPE_ENV === 'test' || process.env.NODE_ENV === 'development';
const isLiveEnv = process.env.STRIPE_ENV === 'live' || process.env.NODE_ENV === 'production';

// 根据环境选择密钥
const publishableKey = isTestEnv 
  ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST
  : process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE;
```

### 环境切换脚本

```bash
# 切换到测试环境
npm run dev:test

# 切换到生产环境
npm run dev:live
```

---

## 📋 配置检查清单

### 测试环境 ✅
- [ ] 使用 `pk_test_` 开头的公钥
- [ ] 使用 `sk_test_` 开头的私钥
- [ ] 设置 `NODE_ENV=development`
- [ ] 设置 `STRIPE_ENV=test`
- [ ] 使用测试卡号验证
- [ ] 确认不会产生真实费用

### 生产环境 ✅
- [ ] 使用 `pk_live_` 开头的公钥
- [ ] 使用 `sk_live_` 开头的私钥
- [ ] 设置 `NODE_ENV=production`
- [ ] 设置 `STRIPE_ENV=live`
- [ ] 配置 Webhook 端点
- [ ] 设置监控和告警

---

## 🧪 测试卡号

### 成功支付测试
- **Visa**: 4242 4242 4242 4242
- **Mastercard**: 5555 5555 5555 4444
- **American Express**: 3782 822463 10005

### 失败支付测试
- **支付失败**: 4000 0000 0000 0002
- **需要验证**: 4000 0025 0000 3155
- **余额不足**: 4000 0000 0000 9995

---

## ⚠️ 重要提醒

### 测试环境
- ✅ 可以安全测试所有功能
- ✅ 不会产生真实费用
- ✅ 可以使用测试卡号
- ⚠️ 数据不会保留到生产环境

### 生产环境
- ⚠️ 会产生真实费用
- ⚠️ 需要真实信用卡
- ⚠️ 数据会永久保存
- ✅ 真实的业务交易

---

## 🚀 部署建议

### 开发阶段
1. 使用测试环境密钥
2. 在本地和测试服务器上测试
3. 验证所有支付流程
4. 确保错误处理正确

### 生产阶段
1. 切换到生产环境密钥
2. 在预生产环境测试
3. 配置监控和告警
4. 逐步上线功能

---

## 🔍 环境验证

### 检查当前环境
```javascript
console.log('当前环境:', process.env.NODE_ENV);
console.log('Stripe 环境:', process.env.STRIPE_ENV);
console.log('公钥前缀:', process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.substring(0, 8));
```

### 环境切换测试
1. 修改环境变量
2. 重启开发服务器
3. 检查控制台输出
4. 验证支付流程 