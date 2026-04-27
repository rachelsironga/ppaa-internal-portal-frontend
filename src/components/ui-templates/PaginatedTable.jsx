import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import ReactLoading from "react-loading";
import ReactPaginate from "react-paginate";
import usePagination from "../../hooks/usePagination";
import { fetchData } from "../../utils/GlobalQueries";
import showToast from "../../helpers/ToastHelper";
import Select from "react-select";
import "animate.css";

const filterGroupKey = (group) => group.group ?? group.key;

/** Maps column `style` to `<col>` so widths stay consistent between header and body (avoids overlap with table-layout: fixed). */
const colStyleFromColumn = (col) => {
  const s = col.style || {};
  const out = {};
  if (s.width != null && s.width !== "auto") out.width = s.width;
  if (s.minWidth) out.minWidth = s.minWidth;
  if (s.maxWidth) out.maxWidth = s.maxWidth;
  return Object.keys(out).length ? out : undefined;
};

const PaginatedTable = ({
  fetchPath,
  title,
  columns,
  buttons,
  onSelect,
  isRefresh,
  filters = [],
  filterSelected = ["ALL"],
  filterGroups = [],
  initialFilters = {},
  clearFiltersOnEmpty = true,
  isFullPath = false,
  /** When true, table uses fixed layout so column widths and overflow clipping apply reliably. */
  tableLayoutFixed = false,
  /** Minimum table width (e.g. `768px`) so columns do not collapse when tbody has only colspan rows. */
  tableMinWidth,
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
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedFilters, setSelectedFilters] = useState(filterSelected);
  const [selectedFilterGroups, setSelectedFilterGroups] = useState(() => {
    const base = filterGroups.reduce((acc, group) => {
      const gk = filterGroupKey(group);
      if (gk) acc[gk] = Array.isArray(group.selected) ? [...group.selected] : [];
      return acc;
    }, {});
    if (initialFilters && typeof initialFilters === "object") {
      Object.entries(initialFilters).forEach(([k, v]) => {
        if (v === undefined || v === null || v === "") return;
        const arr = Array.isArray(v) ? v : [v];
        base[k] = arr.map(String).filter(Boolean);
      });
    }
    return base;
  });

  const handlePageClick = (event) => {
    updatePage(event.selected + 1);
  };

  const handleFetchData = async (clearFiltersOnEmpty = true) => {
    setLoading(true);
    setError(null);
    try {
      // Format filter groups for API
      const formattedFilterGroups = Object.entries(selectedFilterGroups)
        .filter(([_, values]) => values.length > 0)
        .reduce((acc, [group, values]) => {
          acc[group] = values.join(",");
          return acc;
        }, {});

      // Check if any filters are applied
      const hasFilters = Object.keys(formattedFilterGroups).length > 0 || 
                         selectedFilters.length > 0 || 
                         debouncedSearch.trim().length > 0;

      const result = await fetchData({
        url: fetchPath,
        isFullPath: isFullPath,
        filter: {
          page: currentPage,
          page_size: pageSize,
          paginated: true,
          search: debouncedSearch,
          filters: selectedFilters.join(","),
          ...formattedFilterGroups,
        },
      });

      if (result.status === 200 || result.status === 8000) {
        // Check if result is empty and filters are applied
        if (
          (!result.data || result.data.length === 0) &&
          hasFilters &&
          clearFiltersOnEmpty
        ) {
          // Show message and fetch without filters
          showToast("No records match your filter. Showing all records.", "info", "Filter Result");
          
          // Clear filters and fetch all data
          const cleared = {};
          filterGroups.forEach((g) => {
            const gk = filterGroupKey(g);
            if (gk) cleared[gk] = [];
          });
          setSelectedFilterGroups(cleared);
          setSelectedFilters([]);
          
          // Fetch without filters
          const allResult = await fetchData({
            url: fetchPath,
            isFullPath: isFullPath,
            filter: {
              page: 1,
              page_size: pageSize,
              paginated: true,
              search: "",
            },
          });
          
          if (allResult.status === 200 || allResult.status === 8000) {
            setRowRecords(allResult.data);
            if (allResult.pagination) {
              updatePagination(allResult.pagination);
              updateTotalCount(allResult.pagination.total || 0);
            } else {
              updatePagination({});
            }
          }
        } else {
          setRowRecords(result.data);
          if (result.pagination) {
            updatePagination(result.pagination);
            updateTotalCount(result.pagination.total || 0);
          } else {
            updatePagination({});
          }
        }
      } else {
        showToast("No Records Found", "warning", "Fetch Completed");
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(true);

      // Try to surface a more helpful backend message if available
      let message = "Unable to Fetch Records. Please try again later.";
      try {
        if (err?.response?.data) {
          const data = err.response.data;
          if (typeof data === "string") {
            message = data;
          } else if (data.message) {
            message = data.message;
          }
        }
      } catch (parseError) {
        // Fallback to default message if anything goes wrong while parsing
      }

      showToast(message, "warning", "Failed");
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

  // Debounce search input only; pagination and filters fetch immediately
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    handleFetchData();
  }, [debouncedSearch, pageSize, currentPage, selectedFilters, selectedFilterGroups]);

  // Handle group filter change
  const handleGroupFilterChange = (groupKey, selected) => {
    if (!groupKey) return;
    const values = selected ? selected.map((opt) => opt.value) : [];

    setSelectedFilterGroups((prev) => ({
      ...prev,
      [groupKey]: values,
    }));
    updatePage(1);
  };

  // Handle Group filter resert
  const resetAllFilters = () => {
    const cleared = {};
    filterGroups.forEach((g) => {
      const gk = filterGroupKey(g);
      if (gk) cleared[gk] = [];
    });
    setSelectedFilterGroups(cleared);
  };


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
        <div className="row d-flex justify-content-between align-items-center mb-2 ">
         
          {/* Multiple Filters */}
          {filterGroups.length > 0 && (
            <div className="row g-2 mb-2">
              {filterGroups.map((group) => {
                const gk = filterGroupKey(group);
                return (
                <div key={gk || group.label} className="col-auto">
                  <div className="input-group">
                    <span className="input-group-text text-info">
                      {group.label}
                    </span>

                    <Select
                      isMulti
                      options={group.options}
                      value={group.options.filter((opt) =>
                        gk && selectedFilterGroups[gk]?.includes(opt.value)
                      )}
                      onChange={(selected) =>
                        handleGroupFilterChange(gk, selected)
                      }
                      placeholder={group.placeholder || `Select ${group.label}`}
                      classNamePrefix="react-select"
                      styles={{
                        menu: (base) => ({
                          ...base,
                          zIndex: 99999,
                          borderColor: "#17a2b8",
                        }),
                        control: (base) => ({
                          ...base,
                          minHeight: "32px",
                        }),
                      }}
                    />
                  </div>
                </div>
              );
              })}
              {/*Reset All Button */}
              <div className="col-auto d-flex align-items-center">
                  <button
                    className="btn btn-outline-info me-2"
                    onClick={resetAllFilters}
                    title="Reset All Filters"
                  >
                    <i className="tf-icons bx bx-refresh"></i> Reset All
                  </button>
                </div>
            </div>
            )}
            
            <div className="d-flex align-items-center col-md-8 col-sm-6 mt-2">
                <Select
                  options={pageSizeData.map((size) => ({
                  value: size,
                  label: `${size}`,
                  }))}
                  value={{ value: pageSize, label: `${pageSize}` }}
                  onChange={(selected) => {
                  updatePageSize(Number(selected.value));
                  updatePage(1);
                  updatePagination({
                    page: 1,
                    page_size: Number(selected.value),
                  });
                }}
                className="me-2"
                classNamePrefix="react-select"
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: "32px",
                    width: "95px",
                  }),
                  menuPortal: (base) => ({
                    ...base,
                    zIndex: 99999,
                  }),
                }}
                menuPortalTarget={document.body}
            />

            {filters.length > 0 && (
              <div className="input-group " style={{ minWidth: "250px" }}>
                <span className="input-group-text text-info">
                  <i className="tf-icons bx bx-filter-alt"></i>
                </span>
                <Select
                  isMulti
                  options={filters}
                  value={filters.filter((f) =>
                    selectedFilters?.includes(f.value)
                  )}
                  onChange={(selected) => {
                    let values = selected
                      ? selected.map((opt) => opt.value)
                      : [];

                    if (values.includes("ALL")) {
                      // If ALL is selected, clear all others and keep only ALL
                      values = ["ALL"];
                      selected = filters.filter((f) => f.value === "ALL");
                    } else {
                      // Remove ALL if it was previously selected
                      values = values.filter((v) => v !== "ALL");
                    }
                    setSelectedFilters(values);
                    updatePage(1);
                  }}
                  placeholder="Select Filters"
                  classNamePrefix="react-select"
                  styles={{
                    menu: (base) => ({
                      ...base,
                      position: "absolute",
                      zIndex: 99999,
                      minHeight: "32px",
                      borderColor: "#17a2b8",
                    }),
                  }}
                />
              </div>
            )}           
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

        <div className="animate__animated animate__fadeInUp animate__faster">
          <div className="table-responsive">
            <table
              className="table table-hover table-align-middle mb-0 table-bordered"
              style={{
                width: "100%",
                ...(tableLayoutFixed ? { tableLayout: "fixed" } : {}),
                ...(tableMinWidth ? { minWidth: tableMinWidth } : {}),
              }}
            >
              {tableLayoutFixed ? (
                <colgroup>
                  {columns.map((col, idx) => (
                    <col key={col.key ?? idx} style={colStyleFromColumn(col)} />
                  ))}
                </colgroup>
              ) : null}
              <thead style={{ backgroundColor: "#f1f1f1" }}>
                <tr>
                  {columns.map((col, idx) => {
                    const {
                      whiteSpace: _cellWhiteSpace,
                      wordBreak: _cellWordBreak,
                      overflowWrap: _cellOverflowWrap,
                      wordWrap: _cellWordWrap,
                      ...thRestStyle
                    } = col.style || {};
                    return (
                      <th
                        key={col.key || col.label || idx}
                        className={col.className || ""}
                        scope="col"
                        style={{
                          verticalAlign: "middle",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          ...thRestStyle,
                          ...(col.headerStyle || {}),
                        }}
                      >
                        {col.label}
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="table-border-bottom-0">
                {loading ? (
                  <tr>
                    <td colSpan={columns.length || 1}>
                      <div className="col-md-12 col-lg-12 col-sm-12 p-2">
                        <center>
                          <ReactLoading
                            type={"cylon"}
                            color={"#00853f"}
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
                    <td colSpan={columns.length || 1}>
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
                    <td colSpan={columns.length || 1}>
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

          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3">
            <div className="text-muted flex-shrink-0">
              {totalCount > 0
                ? `Showing ${
                    currentPage * pageSize - pageSize + 1
                  } to ${Math.min(
                    currentPage * pageSize,
                    totalCount
                  )} of ${totalCount} records`
                : "No records to show"}
            </div>
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
  title: PropTypes.string,
  fetchPath: PropTypes.string.isRequired,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.string.isRequired,
      className: PropTypes.string,
      style: PropTypes.object,
      headerStyle: PropTypes.object,
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
  tableLayoutFixed: PropTypes.bool,
  tableMinWidth: PropTypes.string,
  filters: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
  filterSelected: PropTypes.arrayOf(PropTypes.string.isRequired),
  initialFilters: PropTypes.object,
  clearFiltersOnEmpty: PropTypes.bool,
  filterGroups: PropTypes.arrayOf(
    PropTypes.shape({
      group: PropTypes.string,
      key: PropTypes.string,
      label: PropTypes.string.isRequired,
      options: PropTypes.arrayOf(
        PropTypes.shape({
          value: PropTypes.string.isRequired,
          label: PropTypes.string.isRequired,
        })
      ).isRequired,
      selected: PropTypes.arrayOf(PropTypes.string),
      placeholder: PropTypes.string,
    })
  ),
};

export default PaginatedTable;