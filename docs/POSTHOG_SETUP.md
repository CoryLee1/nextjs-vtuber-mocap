# PostHog 设置指南

## 环境变量配置

在 `.env.local` 文件中添加以下配置：

```bash
# PostHog 配置
# 国际环境
NEXT_PUBLIC_POSTHOG_KEY=your_international_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# 中国环境（自托管或云服务）
NEXT_PUBLIC_POSTHOG_KEY_CN=your_china_posthog_key
NEXT_PUBLIC_POSTHOG_HOST_CN=https://cn.posthog.com

# 应用版本
NEXT_PUBLIC_APP_VERSION=1.0.0
```

## 中国环境部署建议

### 1. 自托管 PostHog

推荐在中国大陆自托管 PostHog 以避免网络问题：

```bash
# 使用 Docker 部署
docker run -d \
  --name posthog \
  -p 8000:8000 \
  -e POSTGRES_HOST=your_postgres_host \
  -e POSTGRES_DB=posthog \
  -e POSTGRES_USER=posthog \
  -e POSTGRES_PASSWORD=your_password \
  -e SECRET_KEY=your_secret_key \
  posthog/posthog:latest
```

### 2. 云服务提供商

- **阿里云**：使用阿里云 ECS 部署
- **腾讯云**：使用腾讯云 CVM 部署
- **华为云**：使用华为云 ECS 部署

### 3. 域名和 SSL

确保配置了正确的域名和 SSL 证书：

```bash
# 示例域名
NEXT_PUBLIC_POSTHOG_HOST_CN=https://posthog.yourdomain.com
```

## 功能标志配置

在 PostHog 中创建以下功能标志：

1. **tracking_enabled**：控制是否启用跟踪
2. **china_region**：控制中国地区特殊功能
3. **gdpr_compliance**：控制 GDPR 合规功能
4. **pipl_compliance**：控制 PIPL 合规功能

## 事件跟踪配置

### 基础事件

- `page_view`：页面浏览
- `button_click`：按钮点击
- `user_signup`：用户注册
- `user_login`：用户登录

### VTuber 相关事件

- `character_created`：角色创建
- `character_updated`：角色更新
- `live_stream_started`：直播开始
- `live_stream_ended`：直播结束

### 引导流程事件

- `onboarding_started`：引导开始
- `onboarding_completed`：引导完成
- `onboarding_step_completed`：引导步骤完成

## 合规性配置

### PIPL (中国)

- 实现明确的用户同意机制
- 提供数据删除功能
- 记录数据处理活动
- 实现数据本地化存储

### GDPR (欧盟)

- 实现数据主体权利
- 提供数据可携带性
- 实现数据保护影响评估
- 记录数据处理活动

## 监控和告警

### 关键指标

1. **事件发送成功率**
2. **用户同意率**
3. **地区分布**
4. **功能使用率**

### 告警设置

- 事件发送失败率 > 5%
- 用户同意率 < 80%
- 中国地区连接失败

## 故障排除

### 常见问题

1. **网络连接问题**
   - 检查防火墙设置
   - 验证域名解析
   - 检查 SSL 证书

2. **数据丢失**
   - 检查事件队列
   - 验证网络连接
   - 检查服务器状态

3. **合规性问题**
   - 验证同意机制
   - 检查数据存储位置
   - 确认隐私政策

### 调试工具

```javascript
// 在浏览器控制台中检查 PostHog 状态
console.log('PostHog initialized:', window.posthog !== undefined)
console.log('Consent status:', localStorage.getItem('tracking_consent'))
console.log('Region:', localStorage.getItem('user_region'))
``` 