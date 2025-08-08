#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🎯 Stripe 产品创建指南');
console.log('========================');

const products = [
  {
    name: 'VTuber 基础版',
    description: `专业的 VTuber 创作平台基础版
包含：
• 基础 VTuber 功能
• 5 个模型
• 10 个动画
• 基础技术支持`,
    price: 9.99,
    currency: 'USD',
    interval: 'month'
  },
  {
    name: 'VTuber 专业版',
    description: `专业的 VTuber 创作平台专业版
包含：
• 所有基础功能
• 无限模型
• 无限动画
• 高级技术支持
• 优先更新`,
    price: 19.99,
    currency: 'USD',
    interval: 'month'
  },
  {
    name: 'VTuber 高级版',
    description: `专业的 VTuber 创作平台高级版
包含：
• 所有专业功能
• 自定义模型
• 专属动画
• 24/7 技术支持
• API 访问
• 白标解决方案`,
    price: 39.99,
    currency: 'USD',
    interval: 'month'
  }
];

console.log('\n📋 推荐的产品配置：\n');

products.forEach((product, index) => {
  console.log(`${index + 1}. ${product.name}`);
  console.log(`   价格: $${product.price} ${product.currency}/${product.interval}`);
  console.log(`   描述: ${product.description.split('\n')[0]}...`);
  console.log('');
});

console.log('🔧 在 Stripe Dashboard 中的配置步骤：\n');

console.log('1. 基本信息设置：');
console.log('   • 名称: 使用上述产品名称');
console.log('   • 描述: 复制上述产品描述');
console.log('   • 图片: 上传 VTuber 相关图片 (可选)');
console.log('');

console.log('2. 定价设置：');
console.log('   • 定价模式: 选择 "定期" (Recurring)');
console.log('   • 金额: 输入对应的美元价格');
console.log('   • 货币: 选择 USD');
console.log('   • 开单周期: 选择 "每月" (Monthly)');
console.log('');

console.log('3. 税务设置：');
console.log('   • 产品税务代码: 保持默认 "General - Electronically Supplied Services"');
console.log('   • 价格中含税: 设置为 "自动" (Automatic)');
console.log('');

console.log('4. 更多选项：');
console.log('   • 元数据: 添加标签如 "vtuber", "subscription"');
console.log('   • 库存: 数字产品无需设置');
console.log('');

console.log('⚠️  重要提醒：');
console.log('• 确保产品名称简洁明了');
console.log('• 描述要突出核心价值');
console.log('• 价格设置要合理且有竞争力');
console.log('• 测试订阅流程后再上线');
console.log('');

console.log('🚀 下一步操作：');
console.log('1. 登录 Stripe Dashboard');
console.log('2. 进入 "产品目录"');
console.log('3. 点击 "添加一个产品"');
console.log('4. 按照上述配置创建三个产品');
console.log('5. 测试订阅流程');
console.log('6. 监控产品表现');

// 创建配置文件
const configPath = path.join(process.cwd(), 'stripe-products-config.json');
const config = {
  products: products,
  created_at: new Date().toISOString(),
  notes: 'VTuber 应用产品配置'
};

try {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log('\n✅ 产品配置已保存到 stripe-products-config.json');
} catch (error) {
  console.error('❌ 保存配置失败:', error.message);
} 