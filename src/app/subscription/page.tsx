'use client';

import React, { useState, useEffect } from 'react';
import SubscriptionButton from '@/components/payment/SubscriptionButton';
import { SUBSCRIPTION_PLANS, detectUserRegion, getAvailablePaymentMethods } from '@/lib/stripe-config';

export default function SubscriptionPage() {
  const [userRegion, setUserRegion] = useState<'china' | 'international'>('international');
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<any>({});

  useEffect(() => {
    const region = detectUserRegion();
    setUserRegion(region);
    setAvailablePaymentMethods(getAvailablePaymentMethods());
  }, []);

  const getPaymentMethodNames = () => {
    const methods = availablePaymentMethods;
    return Object.values(methods)
      .filter((method: any) => method.enabled)
      .map((method: any) => method.name)
      .join('、');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#636363] mb-4">
            VTuber 订阅计划
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            选择适合您的计划，开启 VTuber 创作之旅
          </p>
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
            <span>🌍 地区: {userRegion === 'china' ? '中国' : '国际'}</span>
            <span>💳 支付方式: {getPaymentMethodNames()}</span>
          </div>
        </div>

        {/* 订阅计划 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <SubscriptionButton planId="basic" className="transform hover:scale-105 transition-transform" />
          <SubscriptionButton planId="pro" className="transform hover:scale-105 transition-transform" />
          <SubscriptionButton planId="premium" className="transform hover:scale-105 transition-transform" />
        </div>

        {/* 功能对比 */}
        <div className="bg-white rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-[#636363] mb-6 text-center">
            功能对比
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-6 font-medium text-[#636363]">功能</th>
                  <th className="text-center py-4 px-6 font-medium text-[#636363]">基础版</th>
                  <th className="text-center py-4 px-6 font-medium text-[#636363]">专业版</th>
                  <th className="text-center py-4 px-6 font-medium text-[#636363]">高级版</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-6 text-gray-700">VTuber 模型数量</td>
                  <td className="text-center py-4 px-6">5 个</td>
                  <td className="text-center py-4 px-6">无限</td>
                  <td className="text-center py-4 px-6">无限</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-6 text-gray-700">动画数量</td>
                  <td className="text-center py-4 px-6">10 个</td>
                  <td className="text-center py-4 px-6">无限</td>
                  <td className="text-center py-4 px-6">无限</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-6 text-gray-700">技术支持</td>
                  <td className="text-center py-4 px-6">基础</td>
                  <td className="text-center py-4 px-6">高级</td>
                  <td className="text-center py-4 px-6">24/7</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-6 text-gray-700">自定义模型</td>
                  <td className="text-center py-4 px-6">❌</td>
                  <td className="text-center py-4 px-6">❌</td>
                  <td className="text-center py-4 px-6">✅</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-6 text-gray-700">API 访问</td>
                  <td className="text-center py-4 px-6">❌</td>
                  <td className="text-center py-4 px-6">❌</td>
                  <td className="text-center py-4 px-6">✅</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-6 text-gray-700">白标解决方案</td>
                  <td className="text-center py-4 px-6">❌</td>
                  <td className="text-center py-4 px-6">❌</td>
                  <td className="text-center py-4 px-6">✅</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 支付方式说明 */}
        <div className="bg-white rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-[#636363] mb-6 text-center">
            支持的支付方式
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-[#636363] mb-4">🇨🇳 中国支付方式</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">💰</span>
                  <span className="text-gray-700">支付宝</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">💬</span>
                  <span className="text-gray-700">微信支付</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🏦</span>
                  <span className="text-gray-700">银联</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#636363] mb-4">🌍 国际支付方式</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">💳</span>
                  <span className="text-gray-700">信用卡 (Visa, Mastercard, Amex)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🔵</span>
                  <span className="text-gray-700">PayPal</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🍎</span>
                  <span className="text-gray-700">Apple Pay</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🤖</span>
                  <span className="text-gray-700">Google Pay</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 常见问题 */}
        <div className="bg-white rounded-lg p-8">
          <h2 className="text-2xl font-bold text-[#636363] mb-6 text-center">
            常见问题
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-[#636363] mb-2">
                Q: 如何取消订阅？
              </h3>
              <p className="text-gray-600">
                您可以随时在账户设置中取消订阅，取消后仍可使用到当前计费周期结束。
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#636363] mb-2">
                Q: 支持哪些货币？
              </h3>
              <p className="text-gray-600">
                中国用户支持人民币 (CNY)，国际用户支持美元 (USD)、欧元 (EUR)、英镑 (GBP) 等主流货币。
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#636363] mb-2">
                Q: 如何获得技术支持？
              </h3>
              <p className="text-gray-600">
                基础版用户可通过邮件获得支持，专业版和高级版用户享有优先技术支持，高级版用户还享有 24/7 专属支持。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 