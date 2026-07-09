import { useState, useEffect, useCallback } from 'react';
import { normalizeAdminSearchQuery } from '../utils/adminSearch';

/**
 * Universal admin search state:
 * - Updates results in real time while typing (debounced ~300ms)
 * - Clears instantly when the box is emptied
 * - Search button can force an immediate apply
 */
export function useAdminSearch(debounceMs = 300) {
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const normalized = normalizeAdminSearchQuery(searchInput);
    if (!normalized) {
      setSearchQuery('');
      return undefined;
    }

    const timer = setTimeout(() => {
      setSearchQuery(normalized);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchInput, debounceMs]);

  const clearSearch = useCallback(() => {
    setSearchInput('');
    setSearchQuery('');
  }, []);

  const applySearchNow = useCallback(
    (event) => {
      if (event?.preventDefault) event.preventDefault();
      setSearchQuery(normalizeAdminSearchQuery(searchInput));
    },
    [searchInput]
  );

  const onSearchChange = useCallback((eventOrValue) => {
    const next =
      typeof eventOrValue === 'string'
        ? eventOrValue
        : eventOrValue?.target?.value ?? '';
    setSearchInput(next);
  }, []);

  return {
    searchInput,
    setSearchInput,
    searchQuery,
    clearSearch,
    applySearchNow,
    onSearchChange,
    hasActiveSearch: Boolean(searchQuery),
  };
}

export default useAdminSearch;
