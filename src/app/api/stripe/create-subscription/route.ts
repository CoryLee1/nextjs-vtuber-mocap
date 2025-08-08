import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripeConfig } from '@/lib/stripe-config';

export async function POST(request: NextRequest) {
  try {
    const { priceId, customerId } = await request.json();
    
    const config = getStripeConfig();
    const stripe = new Stripe(config.secretKey, {
      apiVersion: '2023-10-16',
    });

    // 如果没有客户ID，创建新客户
    let customer;
    if (!customerId) {
      customer = await stripe.customers.create({
        metadata: {
          source: 'vtuber_app',
        },
      });
    } else {
      customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
    }

    // 创建订阅
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        source: 'vtuber_app',
      },
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret: (subscription.latest_invoice as Stripe.Invoice)?.payment_intent?.client_secret,
      customerId: customer.id,
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
} 