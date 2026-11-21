export const getPagination = (page = 1, limit = 10) => {
  const currentPage = Math.max(Number(page) || 1, 1);
  const perPage = Math.max(Number(limit) || 10, 1);

  const skip = (currentPage - 1) * perPage;

  return {
    page: currentPage,
    limit: perPage,
    skip,
    take: perPage,
  };
};

export const paginationMeta = ({ total, page, limit }) => {
  const totalItems = Number(total) || 0;
  const currentPage = Number(page) || 1;
  const perPage = Number(limit) || 0;
  const totalPages = perPage > 0 ? Math.ceil(totalItems / perPage) : 0;

  return {
    total: totalItems,
    page: currentPage,
    limit: perPage,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
  };
};
