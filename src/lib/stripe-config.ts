// Stripe 配置
// 支持中国和国际支付方式

export const STRIPE_CONFIG = {
  // 测试环境配置
  test: {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
  
  // 生产环境配置
  production: {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  }
}

// 获取当前环境配置
export const getStripeConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  return isProduction ? STRIPE_CONFIG.production : STRIPE_CONFIG.test;
}

// 支付方式配置
export const PAYMENT_METHODS = {
  // 中国支付方式
  china: {
    alipay: {
      name: '支付宝',
      icon: '💰',
      enabled: true,
      currency: 'CNY'
    },
    wechat: {
      name: '微信支付',
      icon: '💬',
      enabled: true,
      currency: 'CNY'
    },
    unionpay: {
      name: '银联',
      icon: '🏦',
      enabled: true,
      currency: 'CNY'
    }
  },
  
  // 国际支付方式
  international: {
    card: {
      name: '信用卡',
      icon: '💳',
      enabled: true,
      currencies: ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD']
    },
    paypal: {
      name: 'PayPal',
      icon: '🔵',
      enabled: true,
      currencies: ['USD', 'EUR', 'GBP']
    },
    applepay: {
      name: 'Apple Pay',
      icon: '🍎',
      enabled: true,
      currencies: ['USD', 'EUR', 'GBP']
    },
    googlepay: {
      name: 'Google Pay',
      icon: '🤖',
      enabled: true,
      currencies: ['USD', 'EUR', 'GBP']
    }
  }
}

// 订阅计划配置
export const SUBSCRIPTION_PLANS = {
  basic: {
    id: 'price_basic',
    name: '基础版',
    price: 9.99,
    currency: 'USD',
    interval: 'month',
    features: [
      '基础 VTuber 功能',
      '5 个模型',
      '10 个动画',
      '基础技术支持'
    ]
  },
  pro: {
    id: 'price_pro',
    name: '专业版',
    price: 19.99,
    currency: 'USD',
    interval: 'month',
    features: [
      '所有基础功能',
      '无限模型',
      '无限动画',
      '高级技术支持',
      '优先更新'
    ]
  },
  premium: {
    id: 'price_premium',
    name: '高级版',
    price: 39.99,
    currency: 'USD',
    interval: 'month',
    features: [
      '所有专业功能',
      '自定义模型',
      '专属动画',
      '24/7 技术支持',
      'API 访问',
      '白标解决方案'
    ]
  }
}

// 检测用户地区
export const detectUserRegion = (): 'china' | 'international' => {
  if (typeof window === 'undefined') return 'international';
  
  // 检查本地存储中的用户设置
  const userRegion = localStorage.getItem('user_region');
  if (userRegion === 'china' || userRegion === 'international') {
    return userRegion;
  }
  
  // 基于时区和语言检测
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const language = navigator.language.toLowerCase();
  
  // 中国时区检测
  if (timezone.includes('Asia/Shanghai') || timezone.includes('Asia/Chongqing') || 
      timezone.includes('Asia/Harbin') || timezone.includes('Asia/Urumqi')) {
    return 'china';
  }
  
  // 中文语言检测
  if (language.includes('zh') || language.includes('cn')) {
    return 'china';
  }
  
  return 'international';
}

// 获取用户可用的支付方式
export const getAvailablePaymentMethods = () => {
  const region = detectUserRegion();
  return PAYMENT_METHODS[region];
}

// 获取用户货币
export const getUserCurrency = (): string => {
  const region = detectUserRegion();
  return region === 'china' ? 'CNY' : 'USD';
} 