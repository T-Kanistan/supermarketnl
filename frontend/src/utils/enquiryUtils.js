export const ENQUIRY_WHATSAPP_NUMBER = '31659046526';
export const ENQUIRY_WHATSAPP_URL = `https://wa.me/${ENQUIRY_WHATSAPP_NUMBER}`;

export const ENQUIRY_TYPES = [
  'Product Details',
  'Product Availability',
  'Price Request',
  'Bulk Order',
  'Delivery Information',
  'General Enquiry',
];

export const CONTACT_METHODS = ['Phone', 'Email', 'WhatsApp'];

export const buildWhatsAppEnquiryMessage = ({
  fullName,
  phone,
  productName,
  quantity,
  enquiryType,
  message,
}) => `Hello Wins Wereld Winkel,

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

export const buildSubmissionMessage = (form) => {
  const lines = [
    '--- Product Enquiry ---',
    `Product Name: ${form.productName}`,
    `Quantity Required: ${form.quantity || 'N/A'}`,
    `Enquiry Type: ${form.enquiryType}`,
    `Preferred Contact: ${form.contactMethod}`,
    '',
    'Customer Message:',
    form.message,
  ];
  return lines.join('\n');
};

export const openWhatsAppEnquiry = (form) => {
  const text = buildWhatsAppEnquiryMessage(form);
  window.open(`${ENQUIRY_WHATSAPP_URL}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
};
