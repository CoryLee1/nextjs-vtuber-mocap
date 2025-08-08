import { loadStripe } from '@stripe/stripe-js';
import { getStripeConfig } from './stripe-config';

// 初始化 Stripe
export const initStripe = async () => {
  const config = getStripeConfig();
  return await loadStripe(config.publishableKey);
};

// 创建支付意图
export const createPaymentIntent = async (amount: number, currency: string) => {
  try {
    const response = await fetch('/api/stripe/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create payment intent');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

// 创建订阅
export const createSubscription = async (priceId: string, customerId?: string) => {
  try {
    const response = await fetch('/api/stripe/create-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId,
        customerId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create subscription');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
};

// 取消订阅
export const cancelSubscription = async (subscriptionId: string) => {
  try {
    const response = await fetch('/api/stripe/cancel-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscriptionId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to cancel subscription');
    }

    return await response.json();
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
};

// 获取客户信息
export const getCustomerInfo = async (customerId: string) => {
  try {
    const response = await fetch(`/api/stripe/customer/${customerId}`);
    
    if (!response.ok) {
      throw new Error('Failed to get customer info');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting customer info:', error);
    throw error;
  }
};

// 获取订阅信息
export const getSubscriptionInfo = async (subscriptionId: string) => {
  try {
    const response = await fetch(`/api/stripe/subscription/${subscriptionId}`);
    
    if (!response.ok) {
      throw new Error('Failed to get subscription info');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting subscription info:', error);
    throw error;
  }
}; 