const BaseNode = require('../base/BaseNode');
const axios = require('axios');

/**
 * RazorpayAction
 * Create orders, capture payments, issue refunds, and manage
 * subscriptions via the Razorpay Payments API.
 */
class RazorpayAction extends BaseNode {
  constructor() {
    super();
    this.name = 'RazorpayAction';
    this.displayName = 'Razorpay';
    this.description = 'Create orders, capture payments, issue refunds, manage subscriptions';
    this.version = 1;
    this.baseUrl = 'https://api.razorpay.com/v1';
  }

  // ─── Input Schema ────────────────────────────────────────────────────────────

  getInputSchema() {
    return {
      operation: {
        type: 'string',
        required: true,
        enum: [
          'createOrder',
          'fetchOrder',
          'capturePayment',
          'fetchPayment',
          'createRefund',
          'fetchRefund',
          'createSubscription',
          'cancelSubscription',
          'createPaymentLink',
        ],
        default: 'createOrder',
        description: 'Razorpay operation to perform',
      },
      keyId: {
        type: 'string',
        required: true,
        sensitive: true,
        description: 'Razorpay Key ID (rzp_live_... or rzp_test_...)',
      },
      keySecret: {
        type: 'string',
        required: true,
        sensitive: true,
        description: 'Razorpay Key Secret',
      },
      amount: {
        type: 'number',
        required: false,
        description: 'Amount in smallest currency unit (paise for INR). e.g. ₹10 = 1000',
      },
      currency: {
        type: 'string',
        required: false,
        default: 'INR',
        description: 'ISO 4217 currency code (INR, USD, etc.)',
      },
      receipt: {
        type: 'string',
        required: false,
        description: 'Your internal receipt/order reference ID',
      },
      notes: {
        type: 'object',
        required: false,
        description: 'Key-value metadata attached to the entity (max 15 pairs)',
      },
      orderId: {
        type: 'string',
        required: false,
        description: 'Razorpay Order ID (order_...)',
      },
      paymentId: {
        type: 'string',
        required: false,
        description: 'Razorpay Payment ID (pay_...)',
      },
      refundId: {
        type: 'string',
        required: false,
        description: 'Razorpay Refund ID (rfnd_...)',
      },
      planId: {
        type: 'string',
        required: false,
        description: 'Razorpay Plan ID for subscriptions (plan_...)',
      },
      subscriptionId: {
        type: 'string',
        required: false,
        description: 'Razorpay Subscription ID (sub_...)',
      },
      totalCount: {
        type: 'number',
        required: false,
        default: 12,
        description: 'Total billing cycles for a subscription',
      },
      description: {
        type: 'string',
        required: false,
        description: 'Description shown on payment page or invoice',
      },
      customerName: {
        type: 'string',
        required: false,
        description: 'Customer full name',
      },
      customerEmail: {
        type: 'string',
        required: false,
        description: 'Customer email address',
      },
      customerContact: {
        type: 'string',
        required: false,
        description: 'Customer phone number with country code',
      },
      expireBy: {
        type: 'number',
        required: false,
        description: 'Unix timestamp for payment link expiry',
      },
    };
  }

  // ─── Executor ────────────────────────────────────────────────────────────────

  async execute(inputData, credentials) {
    const { operation } = inputData;

    const keyId = credentials?.keyId || inputData.keyId;
    const keySecret = credentials?.keySecret || inputData.keySecret;

    if (!keyId || !keySecret) {
      throw this.createError('Razorpay keyId and keySecret are required', 'MISSING_CREDENTIALS');
    }

    const client = this._buildClient(keyId, keySecret);

    switch (operation) {
      case 'createOrder':
        return await this._createOrder(client, inputData);
      case 'fetchOrder':
        return await this._fetchOrder(client, inputData);
      case 'capturePayment':
        return await this._capturePayment(client, inputData);
      case 'fetchPayment':
        return await this._fetchPayment(client, inputData);
      case 'createRefund':
        return await this._createRefund(client, inputData);
      case 'fetchRefund':
        return await this._fetchRefund(client, inputData);
      case 'createSubscription':
        return await this._createSubscription(client, inputData);
      case 'cancelSubscription':
        return await this._cancelSubscription(client, inputData);
      case 'createPaymentLink':
        return await this._createPaymentLink(client, inputData);
      default:
        throw this.createError(`Unsupported operation: ${operation}`, 'INVALID_OPERATION');
    }
  }

  // ─── Operations ──────────────────────────────────────────────────────────────

  async _createOrder(client, data) {
    const { amount, currency = 'INR', receipt, notes } = data;

    if (!amount) throw this.createError('amount is required for createOrder', 'MISSING_FIELD');
    if (amount < 100) throw this.createError('amount must be at least 100 paise (₹1)', 'INVALID_AMOUNT');

    const payload = {
      amount: Math.round(amount),
      currency,
      ...(receipt && { receipt }),
      ...(notes && { notes }),
    };

    const response = await client.post('/orders', payload);

    return {
      success: true,
      orderId: response.data.id,
      amount: response.data.amount,
      currency: response.data.currency,
      status: response.data.status,
      receipt: response.data.receipt,
      createdAt: response.data.created_at,
      raw: response.data,
    };
  }

  async _fetchOrder(client, data) {
    const { orderId } = data;
    if (!orderId) throw this.createError('orderId is required for fetchOrder', 'MISSING_FIELD');

    const response = await client.get(`/orders/${orderId}`);

    return {
      success: true,
      order: response.data,
    };
  }

  async _capturePayment(client, data) {
    const { paymentId, amount, currency = 'INR' } = data;

    if (!paymentId) throw this.createError('paymentId is required for capturePayment', 'MISSING_FIELD');
    if (!amount) throw this.createError('amount is required for capturePayment', 'MISSING_FIELD');

    const response = await client.post(`/payments/${paymentId}/capture`, {
      amount: Math.round(amount),
      currency,
    });

    return {
      success: true,
      paymentId: response.data.id,
      status: response.data.status,
      amount: response.data.amount,
      method: response.data.method,
      raw: response.data,
    };
  }

  async _fetchPayment(client, data) {
    const { paymentId } = data;
    if (!paymentId) throw this.createError('paymentId is required for fetchPayment', 'MISSING_FIELD');

    const response = await client.get(`/payments/${paymentId}`);

    return {
      success: true,
      payment: response.data,
    };
  }

  async _createRefund(client, data) {
    const { paymentId, amount, notes } = data;

    if (!paymentId) throw this.createError('paymentId is required for createRefund', 'MISSING_FIELD');

    const payload = {
      ...(amount && { amount: Math.round(amount) }),
      ...(notes && { notes }),
    };

    const response = await client.post(`/payments/${paymentId}/refund`, payload);

    return {
      success: true,
      refundId: response.data.id,
      amount: response.data.amount,
      status: response.data.status,
      paymentId: response.data.payment_id,
      raw: response.data,
    };
  }

  async _fetchRefund(client, data) {
    const { paymentId, refundId } = data;

    if (!paymentId || !refundId) {
      throw this.createError('paymentId and refundId are required for fetchRefund', 'MISSING_FIELD');
    }

    const response = await client.get(`/payments/${paymentId}/refunds/${refundId}`);

    return {
      success: true,
      refund: response.data,
    };
  }

  async _createSubscription(client, data) {
    const { planId, totalCount = 12, notes, customerEmail, customerContact } = data;

    if (!planId) throw this.createError('planId is required for createSubscription', 'MISSING_FIELD');

    const payload = {
      plan_id: planId,
      total_count: totalCount,
      ...(notes && { notes }),
      ...(customerEmail || customerContact
        ? {
            notify_info: {
              notify_phone: customerContact,
              notify_email: customerEmail,
            },
          }
        : {}),
    };

    const response = await client.post('/subscriptions', payload);

    return {
      success: true,
      subscriptionId: response.data.id,
      status: response.data.status,
      planId: response.data.plan_id,
      shortUrl: response.data.short_url,
      raw: response.data,
    };
  }

  async _cancelSubscription(client, data) {
    const { subscriptionId } = data;
    if (!subscriptionId) {
      throw this.createError('subscriptionId is required for cancelSubscription', 'MISSING_FIELD');
    }

    const response = await client.post(`/subscriptions/${subscriptionId}/cancel`);

    return {
      success: true,
      subscriptionId: response.data.id,
      status: response.data.status,
      raw: response.data,
    };
  }

  async _createPaymentLink(client, data) {
    const {
      amount,
      currency = 'INR',
      description,
      customerName,
      customerEmail,
      customerContact,
      notes,
      expireBy,
    } = data;

    if (!amount) throw this.createError('amount is required for createPaymentLink', 'MISSING_FIELD');

    const payload = {
      amount: Math.round(amount),
      currency,
      ...(description && { description }),
      ...(notes && { notes }),
      ...(expireBy && { expire_by: expireBy }),
      ...((customerName || customerEmail || customerContact) && {
        customer: {
          ...(customerName && { name: customerName }),
          ...(customerEmail && { email: customerEmail }),
          ...(customerContact && { contact: customerContact }),
        },
      }),
    };

    const response = await client.post('/payment_links', payload);

    return {
      success: true,
      paymentLinkId: response.data.id,
      shortUrl: response.data.short_url,
      status: response.data.status,
      amount: response.data.amount,
      currency: response.data.currency,
      expiresAt: response.data.expire_by,
      raw: response.data,
    };
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  _buildClient(keyId, keySecret) {
    return axios.create({
      baseURL: this.baseUrl,
      auth: {
        username: keyId,
        password: keySecret,
      },
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 20000,
    });
  }
}

module.exports = RazorpayAction;
