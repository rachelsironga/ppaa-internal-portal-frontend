import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import ReactLoading from "react-loading";
import ReactPaginate from "react-paginate";
import usePagination from "../../hooks/usePagination";
import { fetchData } from "../../utils/GlobalQueries";
import showToast from "../../helpers/ToastHelper";
import "animate.css";

const PaginatedTable = ({
  fetchPath,
  title,
  columns,
  buttons,
  onSelect,
  isRefresh,
  filters = {},
  isFullPath = false,
}) => {
  const {
    currentPage,
    totalCount,
    pageSize,
    updatePage,
    updatePageSize,
    updatePagination,
    updateTotalCount,
  } = usePagination(10, 1, true);
  const [rowRecords, setRowRecords] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const pageSizeData = [10, 25, 50, 100];
  const [searchQuery, setSearchQuery] = useState("");
  const [debounceTimeout, setDebounceTimeout] = useState(null);
  const handlePageClick = (event) => {
    updatePage(event.selected + 1);
  };

  const handleFetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchData({
        url: fetchPath,
        isFullPath: isFullPath,
        filter: {
          ...filters,
          page: currentPage,
          page_size: pageSize,
          paginated: true,
          search: searchQuery,
        },
      });

      if (result.status === 200 || result.status === 8000) {
        setRowRecords(result.data);
        if (result.pagination) {
          updatePagination(result.pagination);
          updateTotalCount(result.pagination.total || 0);
        } else {
          updatePagination({});
        }
      } else {
        showToast("No Records Found", "warning", "Fetch Completed");
      }
    } catch (err) {
      setError(true);
      showToast("Unable to Fetch Records", "warning", "Failed");
    } finally {
      setLoading(false);
    }
  };

  // Refresh data if isRefresh prop changes
  useEffect(() => {
    if (isRefresh) {
      handleFetchData();
    }
  }, [isRefresh]);

  // Fetch ApprovalModules on initial load
  useEffect(() => {
    if (debounceTimeout) clearTimeout(debounceTimeout);
    const timeout = setTimeout(() => {
      handleFetchData();
    }, 1500);
    setDebounceTimeout(timeout);
    return () => clearTimeout(timeout);
  }, [searchQuery, pageSize, currentPage]);

  return (
    <div className="card">
      <div className="d-flex justify-content-between align-items-center card-header mb-1">
        <h5 className="mb-0">{title || "Presentation Table"}</h5>
        <div key="action_button_div" className=" d-flex align-items-center">
          {buttons &&
            buttons.length > 0 &&
            buttons.map((button, index) =>
              button.render ? (
                <React.Fragment key={`action_button_${index}`}>
                  {button.render()}
                </React.Fragment>
              ) : (
                <button
                  key={"action_button_" + index}
                  className={`btn btn-sm ${
                    button.className || "btn-primary"
                  } me-2`}
                  onClick={button.onClick}
                >
                  {button.label}
                </button>
              )
            )}
        </div>
      </div>

      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-2 animate__animated animate__fadeInDown animate__faster">
          <div className="d-flex align-items-center col-md-8 col-sm-6">
            <label className="text-sm font-medium me-2 mb-0">
              Rows per page:
            </label>
            <select
              value={pageSize}
              onChange={(e) => {
                updatePageSize(Number(e.target.value));
                updatePage(1);
                updatePagination({
                  page: 1,
                  page_size: Number(e.target.value),
                });
              }}
              className="form-select"
              aria-label="Default select example"
              style={{ width: "80px" }}
            >
              {pageSizeData.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <div className=" col-md-4 col-sm-6  animate__animated animate__fadeInRight animate__fast">
            <form className="d-flex">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="tf-icons bx bx-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    updatePage(1);
                  }}
                />
              </div>
            </form>
          </div>
        </div>

        <div className=" text-nowrap animate__animated animate__fadeInUp animate__faster">
          <div className="table-responsive text-nowrap">
            <table className="table table-hover table-align-middle mb-0 table-bordered">
              <thead style={{ backgroundColor: "#f1f1f1" }}>
                <tr>
                  {columns.map((col, idx) => (
                    <th
                      key={col.key || col.label || idx}
                      className={col.className || ""}
                      style={col.style || {}}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="table-border-bottom-0">
                {loading ? (
                  <tr>
                    <td colSpan="100%">
                      <div className="col-md-12 col-lg-12 col-sm-12 p-2">
                        <center>
                          <ReactLoading
                            type={"cylon"}
                            color={"#696cff"}
                            height={"30px"}
                            width={"50px"}
                          />
                        </center>
                        <center className="mt-1">
                          <h6 className="text-muted">Fetching Records...</h6>
                        </center>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="100%">
                      <div className="alert alert-danger" role="alert">
                        <div className="alert-body text-center">
                          <p className="mb-0">
                            Unable to fetching Records. Please try again later.
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : rowRecords.length === 0 ? (
                  <tr>
                    <td colSpan="100%">
                      <div className="alert alert-info" role="alert">
                        <div className="alert-body text-center">
                          <p className="mb-0">No Records Found</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  rowRecords.map((row, rowIndex) => (
                    <tr
                      key={row.id || rowIndex}
                      onClick={() => onSelect && onSelect(row)}
                    >
                      {columns.map((col) => {
                        const content = col.render
                          ? col.render(row, rowIndex, currentPage, pageSize)
                          : row[col.key];

                        return (
                          <td
                            key={col.key}
                            className={col.className}
                            style={col.style}
                          >
                            {col.key === "SN"
                              ? currentPage * pageSize - pageSize + rowIndex + 1
                              : content !== undefined && content !== null
                              ? content
                              : "N/A"}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-between align-items-center mt-3">
            <div className="text-muted">
              {totalCount > 0
                ? `Showing ${
                    currentPage * pageSize - pageSize + 1
                  } to ${Math.min(
                    currentPage * pageSize,
                    totalCount
                  )} of ${totalCount} records`
                : "No records to show"}
            </div>
            {/* Your content here */}
            <div></div>
            <ReactPaginate
              previousLabel={<i className="tf-icons bx bx-chevrons-left"></i>}
              nextLabel={<i className="tf-icons bx bx-chevrons-right"></i>}
              breakLabel={"..."}
              pageCount={Math.ceil((totalCount || 0) / (pageSize || 1))}
              marginPagesDisplayed={2}
              pageRangeDisplayed={5}
              onPageChange={handlePageClick}
              containerClassName={"pagination justify-content-center"}
              pageClassName={"page-item"}
              pageLinkClassName={"page-link"}
              previousClassName={"page-item"}
              previousLinkClassName={"page-link"}
              nextClassName={"page-item"}
              nextLinkClassName={"page-link"}
              breakClassName={"page-item"}
              breakLinkClassName={"page-link"}
              activeClassName={"active"}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

PaginatedTable.propTypes = {
  title: PropTypes.string.isRequired,
  fetchPath: PropTypes.string.isRequired,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.string.isRequired,
      className: PropTypes.string,
      style: PropTypes.object,
      render: PropTypes.func,
    })
  ).isRequired,
  buttons: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      onClick: PropTypes.func,
      className: PropTypes.string,
      render: PropTypes.func,
    })
  ),
  onSelect: PropTypes.func,
  isRefresh: PropTypes.number,
  isFullPath: PropTypes.bool,
  filters: PropTypes.object,
};

export default PaginatedTable;
