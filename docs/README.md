# 项目文档索引

本文档目录包含了项目的所有技术文档、配置指南和开发说明。

## 📚 文档分类

### 🏗️ 架构文档

- **[项目架构文档](./project-architecture.md)** - 完整的项目架构说明，包括技术栈、目录结构、核心组件和数据流
- **[数据流架构文档](./data-flow-architecture.md)** - 详细的数据流架构和时序控制说明
- **[项目结构文档](./STRUCTURE.md)** - 项目文件结构说明
- **[代码规范和开发指南](./coding-standards.md)** - 代码规范、命名约定和开发最佳实践

### 🚀 快速开始

- **[启动指南](./STARTUP.md)** - 项目启动和运行说明
- **[设置指南](./SETUP.md)** - 项目初始设置和配置
- **[部署指南](./DEPLOYMENT_GUIDE.md)** - 生产环境部署说明

### 🔧 配置文档

- **[API 密钥设置](./API_KEY_SETUP.md)** - 各种 API 密钥的配置方法
- **[PostHog 设置](./POSTHOG_SETUP.md)** - PostHog 分析工具的配置
- **[Stripe 设置指南](./STRIPE_SETUP_GUIDE.md)** - Stripe 支付集成配置
- **[Stripe 环境设置](./STRIPE_ENV_SETUP.md)** - Stripe 环境变量配置
- **[Stripe 产品设置](./STRIPE_PRODUCT_SETUP.md)** - Stripe 产品配置
- **[Stripe 集成文档](./STRIPE_INTEGRATION.md)** - Stripe 集成详细说明
- **[鼠标控制配置](./MOUSE_CONTROL_CONFIG.md)** - 鼠标控制相关配置

### 🎨 功能文档

- **[主题系统改进](./THEME_SYSTEM_IMPROVEMENTS.md)** - 主题系统的改进说明
- **[性能和维护](./PERFORMANCE_AND_MAINTENANCE.md)** - 性能优化和维护指南
- **[KPI 追踪指南](./KPI_TRACKING_GUIDE.md)** - KPI 追踪功能使用说明
- **[代码优化清单](./code-optimization-checklist.md)** - 代码优化、问题修复和性能改进清单

### 🔄 重构文档

- **[R3F Canvas 重构计划](./R3F_CANVAS_REFACTOR_PLAN.md)** - React Three Fiber Canvas 重构计划
- **[重构测试清单](./REFACTOR_TEST_CHECKLIST.md)** - 重构后的测试检查清单
- **[迁移清理总结](./migration-cleanup-summary.md)** - 迁移和清理工作总结
- **[阶段 6 总结](./phase-6-summary.md)** - 项目阶段 6 的总结

### 🐛 调试文档

- **[调试总结](./DEBUG_SUMMARY.md)** - 调试问题和解决方案总结
- **[清理缓存指南](./CLEAN_CACHE.md)** - Next.js 缓存清理方法

### 📊 项目状态

- **[项目状态](./PROJECT_STATUS.md)** - 当前项目开发状态和进度

## 📖 文档使用指南

### 新开发者

如果你是第一次接触这个项目，建议按以下顺序阅读：

1. **[项目架构文档](./project-architecture.md)** - 了解整体架构
2. **[启动指南](./STARTUP.md)** - 学习如何启动项目
3. **[设置指南](./SETUP.md)** - 完成必要的配置
4. **[数据流架构文档](./data-flow-architecture.md)** - 理解数据流

### 功能开发

如果要开发新功能：

1. **[项目架构文档](./project-architecture.md)** - 了解代码组织方式
2. **[R3F Canvas 重构计划](./R3F_CANVAS_REFACTOR_PLAN.md)** - 了解 3D 渲染架构
3. 相关功能文档（如主题、性能等）

### 部署上线

如果要部署到生产环境：

1. **[部署指南](./DEPLOYMENT_GUIDE.md)** - 部署步骤
2. **[API 密钥设置](./API_KEY_SETUP.md)** - 配置必要的 API 密钥
3. **[性能和维护](./PERFORMANCE_AND_MAINTENANCE.md)** - 性能优化建议

### 问题排查

如果遇到问题：

1. **[调试总结](./DEBUG_SUMMARY.md)** - 查看已知问题和解决方案
2. **[清理缓存指南](./CLEAN_CACHE.md)** - 尝试清理缓存
3. **[项目状态](./PROJECT_STATUS.md)** - 查看当前已知问题

## 🔍 快速查找

### 按主题查找

- **架构相关**: [项目架构](./project-architecture.md), [数据流架构](./data-flow-architecture.md), [项目结构](./STRUCTURE.md)
- **配置相关**: [API 密钥](./API_KEY_SETUP.md), [PostHog](./POSTHOG_SETUP.md), [Stripe](./STRIPE_SETUP_GUIDE.md)
- **开发相关**: [启动指南](./STARTUP.md), [设置指南](./SETUP.md), [重构计划](./R3F_CANVAS_REFACTOR_PLAN.md)
- **部署相关**: [部署指南](./DEPLOYMENT_GUIDE.md), [性能维护](./PERFORMANCE_AND_MAINTENANCE.md)

### 按文件类型查找

- **架构文档**: `project-architecture.md`, `data-flow-architecture.md`, `STRUCTURE.md`
- **配置文档**: `*_SETUP.md`, `*_CONFIG.md`
- **指南文档**: `*_GUIDE.md`, `STARTUP.md`, `SETUP.md`
- **状态文档**: `PROJECT_STATUS.md`, `DEBUG_SUMMARY.md`

## 📝 文档维护

### 更新文档

当项目发生变化时，请及时更新相关文档：

1. **架构变更**: 更新 `project-architecture.md`
2. **新功能**: 创建新的功能文档或更新相关文档
3. **配置变更**: 更新相应的配置文档
4. **问题修复**: 更新 `DEBUG_SUMMARY.md` 或相关文档

### 文档规范

- 使用 Markdown 格式
- 保持文档结构清晰
- 添加必要的代码示例
- 包含相关的链接和引用

## 🔗 相关链接

- [项目 README](../README.md) - 项目主文档
- [GitHub Issues](https://github.com/your-repo/issues) - 问题反馈
- [项目 Wiki](https://github.com/your-repo/wiki) - 更多文档

---

**最后更新**: 2024年

