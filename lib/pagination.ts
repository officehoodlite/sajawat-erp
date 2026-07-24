export const PAGE_SIZE = 15;

export function paginateClient<T>(items: T[], page: number, limit = PAGE_SIZE) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * limit;
  return {
    items: items.slice(start, start + limit),
    total,
    totalPages,
    page: safePage,
  };
}
