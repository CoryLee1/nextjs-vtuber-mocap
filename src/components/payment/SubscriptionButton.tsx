'use client';

import React, { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { getStripeConfig, SUBSCRIPTION_PLANS, detectUserRegion, getAvailablePaymentMethods } from '@/lib/stripe-config';
import { createSubscription } from '@/lib/stripe-client';

interface SubscriptionButtonProps {
  planId: keyof typeof SUBSCRIPTION_PLANS;
  className?: string;
}

export default function SubscriptionButton({ planId, className = '' }: SubscriptionButtonProps) {
  const [stripePromise, setStripePromise] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRegion, setUserRegion] = useState<'china' | 'international'>('international');
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<any>({});

  useEffect(() => {
    // 初始化 Stripe
    const initStripe = async () => {
      const config = getStripeConfig();
      const stripe = await loadStripe(config.publishableKey);
      setStripePromise(stripe);
    };

    // 检测用户地区
    const region = detectUserRegion();
    setUserRegion(region);
    setAvailablePaymentMethods(getAvailablePaymentMethods());

    initStripe();
  }, []);

  const plan = SUBSCRIPTION_PLANS[planId];
  const currency = userRegion === 'china' ? 'CNY' : 'USD';
  const priceInCurrency = userRegion === 'china' ? plan.price * 7.2 : plan.price; // 简单汇率转换

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await createSubscription(plan.id);
      
      if (result.clientSecret) {
        // 重定向到 Stripe Checkout
        const stripe = await stripePromise;
        const { error } = await stripe.redirectToCheckout({
          sessionId: result.clientSecret,
        });

        if (error) {
          setError(error.message);
        }
      } else {
        setError('Failed to create subscription');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodIcons = () => {
    const methods = availablePaymentMethods;
    return Object.values(methods)
      .filter((method: any) => method.enabled)
      .map((method: any) => method.icon)
      .join(' ');
  };

  return (
    <div className={`subscription-button ${className}`}>
      <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
          <div className="text-3xl font-bold text-blue-600 mt-2">
            {currency === 'CNY' ? '¥' : '$'}{priceInCurrency.toFixed(2)}
            <span className="text-sm text-gray-500 font-normal">/{plan.interval}</span>
          </div>
        </div>

        <div className="mb-6">
          <ul className="space-y-2">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-center text-sm text-gray-600">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-4">
          <div className="text-xs text-gray-500 mb-2">
            支持的支付方式: {getPaymentMethodIcons()}
          </div>
          <div className="text-xs text-gray-400">
            地区: {userRegion === 'china' ? '中国' : '国际'}
          </div>
        </div>

        <button
          onClick={handleSubscribe}
          disabled={loading || !stripePromise}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            loading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              处理中...
            </div>
          ) : (
            `订阅 ${plan.name}`
          )}
        </button>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="mt-4 text-xs text-gray-400 text-center">
          点击订阅即表示您同意我们的服务条款和隐私政策
        </div>
      </div>
    </div>
  );
} 