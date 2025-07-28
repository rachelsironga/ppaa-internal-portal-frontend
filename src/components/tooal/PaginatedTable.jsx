import React from "react";
import PropTypes from "prop-types";
import ReactLoading from "react-loading";
import ReactPaginate from "react-paginate";

const PaginatedTable = ({
  columns,
  rowRecords = [],
  loading,
  error,
  totalCount,
  pageSize,
  currentPage,
  onPageChange,
  onSearch,
  searchQuery,
}) => {
  return (
    <div className="card">
      <div className="d-flex justify-content-between align-items-center card-header mb-1">
        <h5 className="mb-0">User Managments</h5>
        <UserModal
          title="View User Managment"
          onClose={() => setSelectedUser(null)}
        />
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      fetchUsers();
                    }
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
                        <p className="mb-0">
                          Unable to fetching Records. Please try again later.
                        </p>
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
                    <tr key={row.id || rowIndex}>
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
                            {content}
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
            {/* Your content here */}
            <div></div>
            <ReactPaginate
              previousLabel={"Previous"}
              nextLabel={"Next"}
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

        <div className="user-management-table">
          <div className="table-responsive text-nowrap">
            {loading ? (
              <div className="loading-container">
                <ReactLoading
                  type={"cylon"}
                  color={"#696cff"}
                  height={"30px"}
                  width={"50px"}
                />
                <h6 className="text-muted">Fetching Records...</h6>
              </div>
            ) : error ? (
              <div className="alert alert-danger" role="alert">
                <p className="mb-0">
                  Error fetching Records. Please try again later.
                </p>
              </div>
            ) : rowRecords.length === 0 ? (
              <div className="alert alert-info" role="alert">
                <p className="mb-0">No Records Found</p>
              </div>
            ) : (
              <table className="table table-hover table-bordered">
                <thead style={{ backgroundColor: "#f1f1f1" }}>
                  <tr>
                    {columns.map((col, idx) => (
                      <th
                        key={(col.key || col.label || idx) + "-table-column"}
                        className={col.className || ""}
                        style={col.style || {}}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rowRecords.map((rowData, index) => (
                    <tr key={rowData.uid || index}>
                      {columns.map((col, colIndex) => (
                        <td
                          key={col.key || colIndex}
                          className={col.className || ""}
                          style={col.style || {}}
                        >
                          {col.render
                            ? col.render(rowData, index)
                            : col.key === "__index"
                            ? (currentPage - 1) * pageSize + index + 1
                            : rowData[col.key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="pagination-container">
            <ReactPaginate
              previousLabel={<i className="bx bx-chevron-left"></i>}
              nextLabel={<i className="bx bx-chevrons-right"></i>}
              breakLabel={"..."}
              pageCount={Math.ceil(totalCount / pageSize)}
              marginPagesDisplayed={2}
              pageRangeDisplayed={5}
              onPageChange={onPageChange}
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
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.string.isRequired,
      className: PropTypes.string,
      style: PropTypes.object,
      render: PropTypes.func,
    })
  ).isRequired,
  rowRecords: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.bool.isRequired,
  totalCount: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  currentPage: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onSearch: PropTypes.func,
  searchQuery: PropTypes.string,
};

PaginatedTable.defaultProps = {
  onSearch: null,
  searchQuery: "",
};

export default PaginatedTable;
