import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const scrollPageToTop = () => {
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  document.querySelector('.admin-content-body')?.scrollTo({ top: 0, left: 0, behavior: 'instant' });
};

const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    scrollPageToTop();
  }, [pathname, search]);

  return null;
};

export default ScrollToTop;
