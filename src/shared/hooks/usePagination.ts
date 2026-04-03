import { useState, useMemo, useCallback } from 'react';

interface UsePaginationOptions {
  totalItems: number;
  itemsPerPage?: number;
  initialPage?: number;
}

interface UsePaginationReturn {
  currentPage: number;
  totalPages: number;
  next: () => void;
  prev: () => void;
  goTo: (page: number) => void;
  hasNext: boolean;
  hasPrev: boolean;
  startIndex: number;
  endIndex: number;
}

export function usePagination({
  totalItems,
  itemsPerPage = 10,
  initialPage = 1,
}: UsePaginationOptions): UsePaginationReturn {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / itemsPerPage)),
    [totalItems, itemsPerPage],
  );

  const clampedPage = useMemo(
    () => Math.min(currentPage, totalPages),
    [currentPage, totalPages],
  );

  const hasNext = clampedPage < totalPages;
  const hasPrev = clampedPage > 1;

  const next = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const prev = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const goTo = useCallback(
    (page: number) => {
      const target = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(target);
    },
    [totalPages],
  );

  const startIndex = (clampedPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  return {
    currentPage: clampedPage,
    totalPages,
    next,
    prev,
    goTo,
    hasNext,
    hasPrev,
    startIndex,
    endIndex,
  };
}
