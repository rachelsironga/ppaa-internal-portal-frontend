import { useState, useEffect } from "react";

const usePagination = (
  pageSizeEntry = 10,
  pageEntry = 1,
  paginatedEntry = false
) => {
  const [currentPage, setCurrentPage] = useState(pageEntry);
  const [pageSize, setPageSize] = useState(pageSizeEntry);
  const [paginated, setPaginated] = useState(paginatedEntry);
  const [totalCount, setTotalCount] = useState(pageSizeEntry);
  const [pagination, setPagination] = useState({});



    useEffect(() => {
      setPagination({
        page: currentPage,
        page_size: pageSize,
        paginated: paginated,
      });
    }, [currentPage, pageSize]);

  const updatePage = (page) => setCurrentPage(page);
  const updatePageSize = (size) => setPageSize(size);
  const updateTotalCount = (total) => setTotalCount(total);
  const updatePaginate = (paginateValue) => setPaginated(paginateValue);

  const updatePagination = (pagination_data) => {
    if (pagination_data) {
      setTotalCount(pagination_data.total);
      setPagination({
        page: pagination_data.page,
        page_size: pagination_data.page_size,
        paginated: paginated,
      });
    } else {
      setPagination({});
    }
  };

  return {
    pagination,
    currentPage,
    pageSize,
    totalCount,
    paginated,
    updatePage,
    updatePageSize,
    updateTotalCount,
    updatePagination,
    updatePaginate,
  };
};

export default usePagination;
