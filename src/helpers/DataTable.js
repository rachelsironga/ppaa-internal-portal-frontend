import React, { useState, useEffect, useRef } from 'react';
import { Button, Row, Col, Card, CardBody, CardSubtitle, Dropdown, DropdownToggle, DropdownMenu, DropdownItem, } from 'reactstrap';
import ReactPaginate from 'react-paginate';
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table"
import PlaceHolderLoader from './PlaceHolderLoader';

const SEARCH_CONTEXTS = {
  SELF: "SELF",
  UAA: "UAA",
  ACCOMMODATION: "ACCOMMODATION",
  REGISTRATION: "REGISTRATION"
}

/**
 * 
 * @param {*} param0 
 * @returns 
 */
const DataTable = ({
  /**
   * List of columns to be displayed by this table.
   * Each column should define for properties: key, label, renderer 
   * Where: @key is used to access values from data you provide 
   *        @label is the title of a column
   *        @renderer is a callback which renders the column value. I receives rowItem object and index.
   * Note:  1. When renderer is provided, the key is not neccessarily a property of a rowItem object
   *        2. A key can be used to access values of deep inner objects by using dots.
   * 
   * Example: const columns = [
   *            {
   *              key: "user.student.registrationNumber", 
   *              label: "Registration Number", 
   *              renderer: (rowItem, index) => (
   *                <span className="text-primary">{rowItem.student.registrationNumber}</span>
   *              )
   *            }
   *          ]
   */
  columns,
  
  actions,
  data: propData,
  fetchData,
  useQueryFunction,
  totalEntries,
  totalResults,
  pageLimit,
  currentPage,
  searchText,
  searchableLength = 3,
  searchContext,
  setCurrentPage,
  setSearchText,
  setSearchContext,
  searchContexts,
  buttons,
  isLoading,
  loadingComponent,
  isError,
  errorComponent
}) => {
  // const [currentPage, setCurrentPage] = useState(0); // Current page is 0-based
  const [resultsCount, setResultsCount] = useState(0); // Current page is 0-based
  const searchTimeout = useRef(null);
  const [filteredData, setFilteredData] = useState(propData);
  const [loading, setLoading] = useState(false);

  const initialSeachContext = searchContexts?.length? searchContexts[0].context : null
  const initialSeachContextLabel = searchContexts?.length? searchContexts[0].label : null

  const [isContextListOpen, setContextListOpen] = useState(false)

  const prevPageRef = useRef(null);
  
  // Latter we must set the initial value here
  // useEffect(()=>{
  //   setSearchContext(initialSeachContext)
  // }, [])

  const [searchContextLabel, setSearchContextLabel] = useState(initialSeachContextLabel)

  const toggleContextList = () => {
    setContextListOpen(!isContextListOpen);
  }

  const [dropdownOpen, setDropdownOpen] = useState(false)

  const toggleDropdown = index => {
    setDropdownOpen(prevState => ({
      ...prevState,
      [index]: !prevState[index],
    }))
  }

  // Pagination
  // const totalPages = Math.ceil(filteredData.length / pageLimit);
  const [totalPages, setTotalPages] = useState(Math.ceil(totalResults / pageLimit));

  // useEffect(() => {
  //   if (useQueryFunction) {
  //     fetchData({
  //       variables: {
  //         pagination: {
  //           offset: currentPage,
  //           limit: pageLimit,
  //           search: searchText,
  //           context: searchContext
  //         },
  //       },
  //     });
  //   }
  // }, [currentPage, pageLimit, fetchData, useQueryFunction]);

  useEffect(() => {
    const data = propData || []
    setFilteredData(data);
    setTotalPages(Math.ceil(totalResults / pageLimit))
    setResultsCount(data.length)
  }, [propData, columns]);

  useEffect(() => {
    const pageChanged = prevPageRef.current !== currentPage;

    if(pageChanged){
      handleRefresh()
      prevPageRef.current = currentPage;
    } else if(parseInt(searchText?.length) == 0 || parseInt(searchText?.length) >= parseInt(searchableLength)){
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
  
      searchTimeout.current = setTimeout(() => {
        handleRefresh()
        setCurrentPage(0);
      }, 3000);// 3 seconds delay
    }
     
  }, [currentPage, searchText, searchContext]);

  const handlePageClick = (selectedPage) => {
    setCurrentPage(selectedPage.selected);
  };

  useEffect(() => {
    if(process.env.REACT_APP_DEBUG_MODE){
      console.log("Fetched Data:", propData);
    }
    // ... other code
  }, [propData, filteredData]);

  const handleRefresh = () => {
    if (useQueryFunction) {
      if(searchContext){
        fetchData({
          variables: {
            pagination: {
              offset: currentPage,
              limit: pageLimit,
              search: searchText,
              context: searchContext
            },
          },
        });
      } else {
        fetchData({
          variables: {
            pagination: {
              offset: currentPage,
              limit: pageLimit,
              search: searchText
            },
          },
        });
      }
    }
  };

  const getColumnValue = (item, columnInfo, index) => {

    if(typeof columnInfo.renderer === 'function'){
      if(process.env.REACT_APP_DEBUG_MODE){
        console.log(item)
      }
      return columnInfo.renderer(item, index)
    } 

    const keys = columnInfo.key.split('.')

    let value = item;

    keys.forEach(key => {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        value = null;
        return;
      }
    });

    return value;
  }


  const renderTableData = () => {
    if (useQueryFunction) {
      // return (filteredData || []).slice(currentPage * pageLimit, (currentPage + 1) * pageLimit).map((item, index) => (
      //   <Tr key={index}>
      //     {columns.map(col => (
      //       <Td key={col.key}>{getColumnValue(item, col.key)}</Td>
      //     ))}
      //   </Tr>
      // ));
      return (filteredData || []).map((item, index) => (
        <Tr key={index}>
          <Td>{(pageLimit * currentPage) + 1 + index}</Td>
          {columns.map(col => (
            <Td key={col.key}>
              {
                getColumnValue(item, col, index)
              }
            </Td>
          ))}
          {
            actions?.length ? (
              <Td>
                <Dropdown
                  isOpen={dropdownOpen[index]}
                  toggle={() => toggleDropdown(index)}
                >
                  <DropdownToggle color="" caret>
                    <i
                      className="fas fa-ellipsis-v"
                      style={{ color: "green" }}
                    />
                  </DropdownToggle>
                  <DropdownMenu>
                    {
                      actions?.map((action, i) => (
                        action.isShowing(item)? 
                          <DropdownItem
                          key={index+i}
                            onClick={() => action.callback(item, index)}
                          >
                            <span className={`text-${action.color} me-2`}>
                              <i className={action.icon}></i>
                            </span>
                            {action.name}
                          </DropdownItem>
                        : ""
                      ))
                    }
                  </DropdownMenu>
                </Dropdown>
              </Td>
            ) : null
          }
        </Tr>
      ));
    } else {
      return propData.slice(currentPage * pageLimit, (currentPage + 1) * pageLimit).map((item, index) => (
        <Tr key={index}>
          <Td>{(pageLimit * currentPage) + 1 + index}</Td>
          {columns.map(col => (
            <Td key={col.key}>{item[col.key]}</Td>
          ))}
        </Tr>
      ));
    }
  };

  return (
    <div>
      <Card>
        <CardBody>
          <CardSubtitle className="mb-1">
            <Row>
              <Col className="col-lg-6 col-md-6 col-sm-6 animate__animated animate__fadeInRight animate__fast">
                <div className="d-flex">
                  <form className="app-search">
                    <div className="position-relative">
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Search..."
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                      />
                      <span className="bx bx-search-alt"></span>
                    </div>
                  </form>
                  <div
                    className={`dropdown-mega ${isContextListOpen ? '' : 'd-none'} d-lg-block ms-2 dropdown`}
                  >
                    <Dropdown
                      hidden={!searchContexts?.length}
                      isOpen={isContextListOpen}
                      toggle={() => toggleContextList()}
                    >
                      <DropdownToggle color="" caret className="btn header-item">
                        Search By: <span className='text-primary'>{searchContextLabel}</span> <i className="mdi mdi-chevron-down"></i>
                      </DropdownToggle>
                      <DropdownMenu>
                        {
                          searchContexts?.map((searchContext)=>(
                            <DropdownItem
                                key={searchContext.context}
                                onClick={() => {
                                  setSearchContext(searchContext.context)
                                  setSearchContextLabel(searchContext.label)
                                }}
                              >
                              <i
                                className="bx bx-right-arrow-alt"
                                style={{
                                  color: "green",
                                  marginRight: "10px",
                                }}
                              />
                                <span>{searchContext.label}</span>
                            </DropdownItem>
                          ))
                        }
                        
                      </DropdownMenu>
                    </Dropdown>
                  </div>
                </div>
              </Col>

              <Col className="col-lg-6 col-sm-6 col-md-6">
                <div className="text-sm-end mt-3">
                  {
                    buttons?.map((button, index) => (
                      <Button
                        key={index}
                        type="button"
                        color={button.color? button.color : "primary"}
                        className="btn mb-2 me-2"
                        onClick={button.action}
                      >
                        <i className={`${button.icon} me-1`} />
                        {button.name} 
                      </Button>
                    ))
                  }
                </div>
              </Col>

            </Row>
          </CardSubtitle>
          {
            isLoading?
              loadingComponent?
                <div>{loadingComponent}</div>
              : <PlaceHolderLoader rows={2} type="table" columSize={12} />
            : isError?
                errorComponent?
                  <div>{errorComponent}</div>
                : <div className="text-center mt-5 mb-5">
                    No any data entry was found! 
                    <a className="card-link text-primary ms-2"
                        onClick={(e) => {
                          e.preventDefault(); 
                          handleRefresh()
                        }}
                    >Try again</a>
                  </div>
              : <div>
                  <div className="table-rep-plugin">
                    <div
                      // className="table-responsive mb-0"
                      className="mb-0"
                      data-pattern="priority-columns"
                    >
                      <Table id="tech-companies-1" className="table-sm table-striped table-bordered table-hover">
                        <Thead>
                          <Tr>
                            <Th key="_SN_">S/N</Th>
                            {columns.map(col => (
                              <Th key={col.key}>{col.label}</Th>
                            ))}
                            {
                              actions?.length?
                                <Th>Action</Th>
                              : ""
                            }
                          </Tr>
                        </Thead>
                        <Tbody>
                          {renderTableData()}
                        </Tbody>
                      </Table>
                    </div>
                  </div>

                  <Row className='mb-3 mt-3'>
                    <Col className="col-lg-6 fw-bold text-gray-700">
                      Showing {(pageLimit * currentPage) + 1}{" "} 
                      to{" "}
                      {pageLimit * currentPage  + Math.min(10, resultsCount)}{" "}
                      of{" "}
                      {
                        totalEntries == totalResults? 
                          `${totalEntries} ` 
                        : `${resultsCount} entries searched from ${totalEntries} `
                      }
                      entries
                    </Col>
                    <Col
                      className="col-lg-6 pull-right"
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                      }}
                    >
                      <ReactPaginate
                        onPageChange={handlePageClick}
                        breakLabel={"..."}
                        pageCount={totalPages}
                        marginPagesDisplayed={3}
                        pageRangeDisplayed={3}
                        containerClassName={"pagination"}
                        pageClassName={"page-item"}
                        pageLinkClassName={"page-link"}
                        nextLinkClassName={"page-link"}
                        previousClassName={"page-link"}
                        previousLabel={"<"}
                        nextLabel={">"}
                        activeClassName={"active"}
                        breakLinkClassName={"page-link"}
                        initialPage={currentPage}
                      />

                    </Col>
                  </Row>
                </div>
          }
        </CardBody>
      </Card>
      
      
    </div>
  );
};

export {SEARCH_CONTEXTS}

export default DataTable

