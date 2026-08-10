export const ENQUIRY_WHATSAPP_NUMBER = '31659046526';
export const ENQUIRY_WHATSAPP_URL = `https://wa.me/${ENQUIRY_WHATSAPP_NUMBER}`;

export const GENERAL_ENQUIRY_TYPES = [
  'General Enquiry',
  'Product Enquiry',
  'Food Corner Enquiry',
  'Bulk Order Enquiry',
  'Delivery Enquiry',
  'Other',
];

export const ENQUIRY_TYPES = [
  'Product Details',
  'Product Availability',
  'Price Request',
  'Delivery Information',
  'General Enquiry',
  'Other',
];

export const buildWhatsAppEnquiryMessage = ({
  fullName,
  phone,
  productName,
  quantity,
  enquiryType,
  message,
  isFoodCorner = false,
}) => {
  const resolvedPhone = (phone || '').trim() || 'N/A';

  if (isFoodCorner) {
    return `Hello Wins Wereld Winkel,

I would like to enquire about a food corner item.

Customer Name: ${fullName}
Phone Number: ${resolvedPhone}
Food Item: ${productName}

Message:
${message}

Thank you.`;
  }

  return `Hello Wins Wereld Winkel,

I would like to enquire about a product.

Customer Name: ${fullName}
Phone Number: ${resolvedPhone}
Product Name: ${productName}
Quantity: ${quantity || 'N/A'}

Enquiry Type: ${enquiryType}

Message:
${message}

Please provide more information regarding this product.

Thank you.`;
};

export const buildSubmissionMessage = (form, { isFoodCorner = false } = {}) => {
  if (isFoodCorner) {
    return [
      '--- Food Corner Enquiry ---',
      `Food Item: ${form.productName}`,
      '',
      'Customer Message:',
      form.message,
    ].join('\n');
  }

  const lines = [
    '--- Product Enquiry ---',
    `Product Name: ${form.productName}`,
    `Quantity Required: ${form.quantity || 'N/A'}`,
    `Enquiry Type: ${form.enquiryType}`,
    '',
    'Customer Message:',
    form.message,
  ];
  return lines.join('\n');
};

export const buildCustomerEnquiryWhatsAppMessage = ({
  fullName,
  phone,
  phoneNumber,
  email,
  enquiryType,
  message,
}) => {
  const resolvedPhone = String(phoneNumber || phone || '').trim() || 'N/A';
  return `📩 Customer Enquiry

👤 Name: ${fullName}
📞 Phone: ${resolvedPhone}
📧 Email: ${email}

📋 Enquiry Type:
${enquiryType}

💬 Message:
${message}

Send to:
+31659046526`;
};

export const openCustomerEnquiryWhatsApp = (payload) => {
  const text = buildCustomerEnquiryWhatsAppMessage(payload);
  window.open(`${ENQUIRY_WHATSAPP_URL}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
};

export const openWhatsAppEnquiry = (form, options = {}) => {
  const text = buildWhatsAppEnquiryMessage({ ...form, ...options });
  window.open(`${ENQUIRY_WHATSAPP_URL}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
};
