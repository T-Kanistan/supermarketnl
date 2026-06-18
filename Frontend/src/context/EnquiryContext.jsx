/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from 'react';
import EnquiryModal from '../components/EnquiryModal';

const EnquiryContext = createContext(null);

export const EnquiryProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [productData, setProductData] = useState(null);

  const openEnquiry = useCallback((product = null) => {
    setProductData(product);
    setIsOpen(true);
  }, []);

  const closeEnquiry = useCallback(() => {
    setIsOpen(false);
    setProductData(null);
  }, []);

  return (
    <EnquiryContext.Provider value={{ openEnquiry }}>
      {children}
      <EnquiryModal isOpen={isOpen} onClose={closeEnquiry} product={productData} />
    </EnquiryContext.Provider>
  );
};

export const useEnquiry = () => {
  const context = useContext(EnquiryContext);
  if (!context) {
    throw new Error('useEnquiry must be used within EnquiryProvider');
  }
  return context;
};
