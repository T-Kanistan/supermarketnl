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
  'Bulk Order',
  'Delivery Information',
  'General Enquiry',
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
  if (isFoodCorner) {
    return `Hello Wins Wereld Winkel,

I would like to enquire about a food corner item.

Customer Name: ${fullName}
Phone Number: ${phone}
Food Item: ${productName}

Message:
${message}

Thank you.`;
  }

  return `Hello Wins Wereld Winkel,

I would like to enquire about a product.

Customer Name: ${fullName}
Phone Number: ${phone}
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

export const openWhatsAppEnquiry = (form, options = {}) => {
  const text = buildWhatsAppEnquiryMessage({ ...form, ...options });
  window.open(`${ENQUIRY_WHATSAPP_URL}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
};
