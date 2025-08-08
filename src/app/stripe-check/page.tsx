'use client';

import React, { useState, useEffect } from 'react';
import { getStripeEnvironment, TEST_CARD_NUMBERS } from '@/lib/stripe-config';

export default function StripeCheckPage() {
  const [environment, setEnvironment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const env = getStripeEnvironment();
    setEnvironment(env);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">检查 Stripe 配置...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Stripe 环境检查
          </h1>
          <p className="text-xl text-gray-600">
            验证 Stripe 配置和环境设置
          </p>
        </div>

        {/* 环境信息 */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            当前环境配置
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">环境状态</h3>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${environment?.isTest ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-gray-700">
                    {environment?.isTest ? '🧪 测试环境' : '🚀 生产环境'}
                  </span>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">环境标识</h3>
                <p className="text-gray-700 font-mono bg-gray-100 p-2 rounded">
                  {environment?.environment}
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">公钥状态</h3>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${environment?.publishableKey?.startsWith('pk_') ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-gray-700">
                    {environment?.publishableKey?.startsWith('pk_') ? '✅ 已配置' : '❌ 未配置'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 font-mono">
                  {environment?.publishableKey?.substring(0, 20)}...
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">私钥状态</h3>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${environment?.secretKey !== 'not configured' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-gray-700">
                    {environment?.secretKey !== 'not configured' ? '✅ 已配置' : '❌ 未配置'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 font-mono">
                  {environment?.secretKey}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 测试卡号 */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            测试卡号
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">✅ 成功支付测试</h3>
              <div className="space-y-3">
                <div className="bg-green-50 p-3 rounded border border-green-200">
                  <p className="text-sm font-medium text-green-800">Visa</p>
                  <p className="text-xs text-green-600 font-mono">{TEST_CARD_NUMBERS.success.visa}</p>
                </div>
                <div className="bg-green-50 p-3 rounded border border-green-200">
                  <p className="text-sm font-medium text-green-800">Mastercard</p>
                  <p className="text-xs text-green-600 font-mono">{TEST_CARD_NUMBERS.success.mastercard}</p>
                </div>
                <div className="bg-green-50 p-3 rounded border border-green-200">
                  <p className="text-sm font-medium text-green-800">American Express</p>
                  <p className="text-xs text-green-600 font-mono">{TEST_CARD_NUMBERS.success.amex}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">❌ 失败支付测试</h3>
              <div className="space-y-3">
                <div className="bg-red-50 p-3 rounded border border-red-200">
                  <p className="text-sm font-medium text-red-800">支付失败</p>
                  <p className="text-xs text-red-600 font-mono">{TEST_CARD_NUMBERS.failure.declined}</p>
                </div>
                <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                  <p className="text-sm font-medium text-yellow-800">需要验证</p>
                  <p className="text-xs text-yellow-600 font-mono">{TEST_CARD_NUMBERS.failure.requiresAuth}</p>
                </div>
                <div className="bg-orange-50 p-3 rounded border border-orange-200">
                  <p className="text-sm font-medium text-orange-800">余额不足</p>
                  <p className="text-xs text-orange-600 font-mono">{TEST_CARD_NUMBERS.failure.insufficientFunds}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 环境建议 */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            环境建议
          </h2>
          
          {environment?.isTest ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">🧪 测试环境</h3>
              <ul className="space-y-2 text-blue-800">
                <li>✅ 可以安全测试所有支付功能</li>
                <li>✅ 不会产生真实费用</li>
                <li>✅ 可以使用测试卡号</li>
                <li>⚠️ 数据不会保留到生产环境</li>
              </ul>
              <div className="mt-4 p-3 bg-blue-100 rounded">
                <p className="text-sm text-blue-700">
                  <strong>建议:</strong> 在测试环境中验证所有功能后，再切换到生产环境。
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-900 mb-3">🚀 生产环境</h3>
              <ul className="space-y-2 text-red-800">
                <li>⚠️ 会产生真实费用</li>
                <li>⚠️ 需要真实信用卡</li>
                <li>⚠️ 数据会永久保存</li>
                <li>✅ 真实的业务交易</li>
              </ul>
              <div className="mt-4 p-3 bg-red-100 rounded">
                <p className="text-sm text-red-700">
                  <strong>警告:</strong> 生产环境会产生真实费用，请谨慎测试！
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 快速操作 */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            快速操作
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <a 
                href="/subscription" 
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg text-center transition-colors"
              >
                测试订阅页面
              </a>
              <a 
                href="/deploy-check" 
                className="block w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg text-center transition-colors"
              >
                检查部署配置
              </a>
            </div>
            
            <div className="space-y-4">
              <button 
                onClick={() => {
                  console.log('Stripe Environment:', environment);
                  console.log('Test Cards:', TEST_CARD_NUMBERS);
                }}
                className="block w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg text-center transition-colors"
              >
                打印配置到控制台
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg text-center transition-colors"
              >
                刷新页面
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 