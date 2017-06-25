export const EventType = {
  message_received: 'message_received',
  facebook_postback: 'facebook_postback',
  message_delivered: 'message_delivered',
  message_read: 'message_read',
  facebook_optin: 'facebook_optin',
  facebook_referral: 'facebook_referral',
  facebook_payment: 'facebook_payment',
};

export const AttachmentType = {
  file: 'file',
  audio: 'audio',
  image: 'image',
  video: 'video',
  receipt: 'receipt',
  template: 'template'
};

// export type AttachmentType = 'file' | 'audio' | 'image' | 'video' | 'template';

export const TemplateType = {
  list: 'list',
  button: 'button',
  recepit: 'recepit',
  generic: 'generic',
};

export const ButtonType = {
  account_link: 'account_link',
  account_unlink: 'account_unlink',
  element_share: 'element_share',
  payment: 'payment',
  phone_number: 'phone_number',
  postback: 'postback',
  web_url: 'web_url'
};

export const ContentType = {
  text: 'text',
  location: 'location'
};

export const TopElementStyle = {
  large: 'large',
  compact: 'compact'
};

export const PaymentMethod = {
  fixedAmount: 'FIXED_AMOUNT',
};