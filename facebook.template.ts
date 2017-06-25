import { Response } from '../bot.util';
import * as FB from './facebook.constant';
import { AttachmentType, TemplateType } from './facebook.constant';

/**
 * attachment: {
 *   "type": "template",
 *   "payload": {
 *   }
 */
export interface FacebookAttachment extends Response {
  requireFeedback: boolean;
  content: {
    attachment: {
      type: string; // AttachmentType;
      payload: FacebookPayload;
    }
  };
}

export interface FacebookQuickReplies extends Response {
  requireFeedback: true;
  content: {
    text: string;
    quick_replies: FacebookQuickReply[];
  };
}

export interface FacebookPayload {
  // required
  template_type: string;

  // optional
  text?: string; // button
  image_aspect_ratio?: 'square' | 'horizontal';
  top_element_style?: string;
  elements?: FacebookElement[];
  buttons?: FacebookButton[];
}

export interface FacebookElement {
  // required
  title?: string;

  // optional
  subtitle?: string;
  image_url?: string;
  default_action?: FacebookDefaultAction;
  buttons?: FacebookButton[];
}

/**
 * "default_action": {
 *    "type": "web_url",
 *    "url": "https://peterssendreceiveapp.ngrok.io/shop_collection",
 *    "messenger_extensions": true,
 *    "webview_height_ratio": "tall",
 *    "fallback_url": "https://peterssendreceiveapp.ngrok.io/"
 * }
 */
export interface FacebookDefaultAction {
  type: string;
  url: string;
  messenger_extensions: boolean;
  webview_height_ratio: string; // compact/tall/full
  fallback_url: string;
}

/**
 * sample button json
 * "buttons": [{
 *     "type": "web_url", // phone_number/web_url/postback/element_share/payment/account_link/account_unlink
 *     "title": "Shop Now",
 *     "url": "https://peterssendreceiveapp.ngrok.io/shop?item=100",
 *     "messenger_extensions": true,
 *     "webview_height_ratio": "tall",
 *     "fallback_url": "https://peterssendreceiveapp.ngrok.io/"
 *   }
 * ]
 */
export interface FacebookButton {
  // required
  type: string;
  title?: string;

  // optional
  payload?: string;
  url?: string;
  messenger_extensions?: boolean;
  webview_height_ratio?: string;
  fallback_url?: string;
  payment_summary?: any;
}

/**
 * {
    "template_type": "receipt",
    "recipient_name": "Stephane Crozatier",
    "order_number": "12345678902",
    "currency": "USD",
    "payment_method": "Visa 2345",
    "order_url": "http://petersapparel.parseapp.com/order?order_id=123456",
    "timestamp": "1428444852",
    "elements": [
    ],
    "address": {
    },
    "summary": {
    },
    "adjustments": [
    ]
  }
 */
export interface FacebookReceipt {
  // required
  template_type: string; // AttachmentType;
  recipient_name: string;
  order_number: string; // must be unique
  currency: string;
  payment_method: string;
  summary: FacebookSummary;

  // optional
  merchant_name?: string;
  timestamp?: string;
  order_url?: string;
  elements?: FacebookItem[];
  address?: FacebookAddress;
  adjustments?: FacebookAdjustment[];
}

/**
 * "elements": [
      {
        "title": "Classic White T-Shirt",
        "subtitle": "100% Soft and Luxurious Cotton",
        "quantity": 2,
        "price": 50,
        "currency": "USD",
        "image_url": "http://petersapparel.parseapp.com/img/whiteshirt.png"
      },
      {
        "title": "Classic Gray T-Shirt",
        "subtitle": "100% Soft and Luxurious Cotton",
        "quantity": 1,
        "price": 25,
        "currency": "USD",
        "image_url": "http://petersapparel.parseapp.com/img/grayshirt.png"
      }
    ]
 */
export interface FacebookItem {
  // required
  title: string;
  price: number;

  // optional
  subtitle?: string;
  quantity?: number;
  currency?: string;
  image_url?: string;
}

/**
 * "address": {
      "street_1": "1 Hacker Way",
      "street_2": "",
      "city": "Menlo Park",
      "postal_code": "94025",
      "state": "CA",
      "country": "US"
    }
 */
export interface FacebookAddress {
  // required
  street_1: string;
  city: string;
  postal_code: string;
  state: string;
  country: string;

  // optional
  street_2?: string;
}

/**
 * "summary": {
      "subtotal": 75,
      "shipping_cost": 4.95,
      "total_tax": 6.19,
      "total_cost": 56.14
    }
 */
export interface FacebookSummary {
  // required
  total_cost: number;

  // optional
  subtotal?: number;
  shipping_cost?: number;
  total_tax?: number;
}

/**
 * "adjustments": [
      {
        "name": "New Customer Discount",
        "amount": 20
      },
      {
        "name": "$10 Off Coupon",
        "amount": 10
      }
    ]
 */
export interface FacebookAdjustment {
  // optional
  name: string;
  amount: number;
}

export interface FacebookPayment {
  elements: [{
    title: string;
    buttons: [{
      type: string;
      title: string;
      payload: string;
      payment_summay: {
        currency: string;
        payment_type: string;
        is_test_payment: boolean;
        merchant_name: string;
      }
    }]
  }];
}

export interface FacebookQuickReply {
  // required
  content_type: string; // text / location

  // optional
  title?: string; // if text
  payload?: string; // if text
  image_url?: string;
}