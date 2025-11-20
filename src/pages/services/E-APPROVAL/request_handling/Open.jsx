import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import showToast from "../../../../helpers/ToastHelper";
import ReactLoading from "react-loading";
import "animate.css";
import {
  deleteItem,
  deleteItemLevel,
  getModules,
  sortItemLevels,
} from "./Queries";
import { PageContext } from "../../../../utils/context";
import { useParams } from "react-router-dom";
import RequestHandlingModal from "./Modal";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import BreadCumb from "../../../../layouts/BreadCumb";

export const RequestHandlingOpenPage = () => {
  const { uid } = useParams();
  const [selectedObj, setSelectedObj] = useState(null);
  const [tableRefresh, setTableRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPositionalLevelModule, setSelectedPositionalLevelModule] =
    useState(null);
  const [debounceTimeout, setDebounceTimeout] = useState(null);
  const [moduleLevels, setModuleLevels] = useState([]);
  const [isSorted, setIsSorted] = useState(false);

  const handleFetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getModules({
        uid: uid,
      });
      if (result.status === 200 || result.status === 8000) {
        setSelectedObj(result.data);
        setModuleLevels(result.data.approval_module_levels);
      } else {
        setError(true);
        showToast("No Approval Module Found", "warning", "Fetch Completed");
      }
    } catch (err) {
      setError(true);
      showToast("Unable to Fetch Approval Modules", "warning", "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (selectedObj = null) => {
    if (!selectedObj) {
      Swal.fire("Error!", "Unable to Select this Approval Module.", "error");
      return;
    }

    try {
      const confirmation = await Swal.fire({
        title: "Are you sure?",
        text: "Your About to Delete the data",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        cancelButtonColor: "#aaa",
        confirmButtonText: "Yes, delete it!",
      });

      if (confirmation.isConfirmed) {
        const result = await deleteItem(selectedObj.uid);
        if (result.status === 200 || result.status === 8000) {
          Swal.fire(
            "Process Completed!",
            "The Approval Module has been deleted.",
            "success"
          );
          handleFetchData();
        } else {
          console.error("Error deleting Approval Module:", result);
          Swal.fire("Error Occurred!", `${result.message}`, "error");
        }
      }
    } catch (error) {
      console.error("Error deleting Approval Module:", error);
      Swal.fire(
        "Unsuccessful",
        `Unable to Perform Delete. Please Try Again or Contact Support Team`,
        "error"
      );
    }

    setSelectedObj(null); // Reset selected selectedObj after deletion
  };

  const handleDeleteLevel = async (selectedObjLevel = null) => {
    if (!selectedObjLevel) {
      Swal.fire(
        "Error!",
        "Unable to Select this Approval Module Level.",
        "error"
      );
      return;
    }

    try {
      const confirmation = await Swal.fire({
        title: "Are you sure?",
        text: "Your About to Delete the Module Level",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        cancelButtonColor: "#aaa",
        confirmButtonText: "Yes, delete it!",
      });

      if (confirmation.isConfirmed) {
        const result = await deleteItemLevel(selectedObjLevel.uid);
        if (result.status === 200 || result.status === 8000) {
          Swal.fire(
            "Process Completed!",
            "The Approval Module Level has been deleted.",
            "success"
          );
          handleFetchData();
        } else {
          console.error("Error deleting Approval Module:", result);
          Swal.fire("Error Occurred!", `${result.message}`, "error");
        }
      }
    } catch (error) {
      Swal.fire(
        "Unsuccessful",
        `Unable to Perform Delete. Please Try Again or Contact Support Team`,
        "error"
      );
    }

    setSelectedPositionalLevelModule(null); // Reset selected selectedObj after deletion
  };

  const handleSaveSorting = async () => {
    if (!isSorted || moduleLevels.length === 0) {
      Swal.fire(
        "Process Failed",
        "Unable to Save Sorting. No Change found.",
        "error"
      );
      return;
    }

    try {
      const confirmation = await Swal.fire({
        title: "Are you sure?",
        text: "After Sorting, The Approval Flow For this Module will be changed",
        icon: "info",
        showCancelButton: true,
        confirmButtonColor: "#696cff",
        cancelButtonColor: "#aaa",
        confirmButtonText: "Save Sorting",
      });

      if (confirmation.isConfirmed) {
        const uidsList = moduleLevels.map((level) => level.uid);

        const sortData = {
          module_uid: selectedObj.uid,
          sort_list: uidsList,
        };

        const result = await sortItemLevels(sortData);
        if (result.status === 200 || result.status === 8000) {
          Swal.fire(
            "Process Completed!",
            "The Approval Module has been Changed.",
            "success"
          );
          setIsSorted(false);
          handleFetchData();
        } else {
          Swal.fire("Process Failed!", `${result.message}`, "error");
        }
      }
    } catch (error) {
      console.error("Error deleting Approval Module:", error);
      Swal.fire(
        "Unsuccessful",
        `Unable to Perform Sorting. Please Try Again or Contact Support Team`,
        "error"
      );
    }
  };

  const handleDragEnd = (e) => {
    if (!e.destination) return;
    let tempData = Array.from(moduleLevels);
    let [source_data] = tempData.splice(e.source.index, 1);
    tempData.splice(e.destination.index, 0, source_data);
    setModuleLevels(tempData);
    setIsSorted(true);
  };

  useEffect(() => {
    if (debounceTimeout) clearTimeout(debounceTimeout);

    const timeout = setTimeout(() => {
      handleFetchData();
    }, 1500);

    setDebounceTimeout(timeout);

    return () => clearTimeout(timeout);
  }, [tableRefresh]);

  return (
    <PageContext.Provider
      value={{
        debounceTimeout,
        setDebounceTimeout,
        handleFetchData,
        selectedObj,
        setSelectedObj,
        tableRefresh,
        setTableRefresh,
        selectedPositionalLevelModule,
        setSelectedPositionalLevelModule,
      }}
    >
      <BreadCumb pageList={["Approval Modules", "view"]} />

      <div className="card mb-4 animate__animated animate__fadeInDown animate__faster">
        <div className="d-flex justify-content-between align-items-center card-header shadow-sm mb-4">
          <h5 className="mb-0">Approval Modules Details</h5>

          {loading || error || selectedObj == null ? (
            <div className="form-group"></div>
          ) : (
            <div className="form-group">
              <button
                aria-label="Open Modal"
                type="button"
                className="btn btn-primary ms-auto btn-sm me-2"
                data-bs-toggle="modal"
                data-bs-target="#viewCreateModuleDataModal"
              >
                <i className="bx bx-edit-alt me-1"></i> Edit
              </button>
              <button
                aria-label="Delete Item"
                className="btn btn-danger ms-auto btn-sm"
                onClick={async () => {
                  handleDelete(selectedObj);
                }}
                type="button"
              >
                <i className="bx bx-trash me-1"></i> Disable
              </button>
            </div>
          )}
        </div>

        <div className="card-body animate__animated animate__fadeInUp animate__faster">
          {loading ? (
            <div className="d-flex justify-content-between align-items-center">
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
                  <h6 className="text-muted">Fetching Approval Modules</h6>
                </center>
              </div>
            </div>
          ) : error || selectedObj.length === 0 ? (
            // error || selectedObj.length === 0
            <div className="alert alert-info" role="alert">
              <div className="alert-body text-center">
                <p className="mb-0">
                  Sorry! Unable to get Module Details Please Contanct System
                  Administrator{" "}
                </p>
              </div>
            </div>
          ) : (
            <div className="col-md-12">
              <div className="row mb-3">
                <div
                  className="col-md-1 col-sm-12"
                  style={{ minWidth: "120px" }}
                >
                  <h6 className="text-muted">Name:</h6>
                </div>
                <div className="col-md-9 col-sm-12">
                  <p className="text-justify">{selectedObj?.name || ""}</p>
                </div>
              </div>
              <div className="row mb-3">
                <div
                  className="col-md-1 col-sm-12"
                  style={{ minWidth: "120px" }}
                >
                  <h6 className="text-muted">Code:</h6>
                </div>
                <div className="col-md-9 col-sm-12">
                  <p className="text-justify">{selectedObj?.code || ""}</p>
                </div>
              </div>
              <div className="row mb-3">
                <div
                  className="col-md-1 col-sm-12"
                  style={{ minWidth: "120px" }}
                >
                  <h6 className="text-muted">Description:</h6>
                </div>
                <div className="col-md-9 col-sm-12">
                  <p className="text-justify">
                    {selectedObj?.description || ""}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="col-md-12 col-lg-12">
        <div className="card">
          <div>
            <div className="d-flex justify-content-between align-items-center card-header">
              <h5 className="mb-0">Assigned Modules Levels</h5>
              {loading || error || selectedObj == null ? (
                <div className="form-group"></div>
              ) : (
                <div className="form-group">
                  {isSorted && (
                    <button
                      aria-label="Click me"
                      type="button"
                      className="btn btn-success ms-auto btn-sm me-4"
                      onClick={async () => {
                        handleSaveSorting();
                      }}
                    >
                      <i className="bx bx-edit-alt me-1"></i> Save Sorting
                    </button>
                  )}
                  {/* <ApprovalModuleLevelModal
                    title="View Approval Modules"
                    onClose={() => setSelectedPositionalLevelModule(null)}
                  /> */}
                </div>
              )}
            </div>
          </div>

          <div className="card-body animate__animated animate__fadeInUp animate__faster">
            <div className="text-nowrap mb-4 table-responsive">
              <DragDropContext onDragEnd={handleDragEnd}>
                <table className="table table-hover table-align-middle mb-0 table-bordered">
                  <thead style={{ backgroundColor: "#f1f1f1" }}>
                    <tr>
                      <th style={{ width: "50px" }}>S/N</th>
                      <th>Name</th>
                      <th>Action</th>
                      <th>Location</th>
                      <th style={{ width: "100px" }}>Is Signatory</th>
                      <th style={{ width: "100px" }}>Status</th>
                      <th style={{ width: "60px" }}>Sort</th>
                      <th style={{ width: "100px" }}>Options</th>
                    </tr>
                  </thead>
                  <Droppable droppableId="droppable-1">
                    {(provider) => (
                      <tbody
                        className="table-border-bottom-0"
                        ref={provider.innerRef}
                        {...provider.droppableProps}
                      >
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
                                  <h6 className="text-muted">
                                    Fetching Module Levels
                                  </h6>
                                </center>
                              </div>
                            </td>
                          </tr>
                        ) : error || moduleLevels.length === 0 ? (
                          <tr>
                            <td colSpan="100%">
                              <div className="alert alert-info" role="alert">
                                <div className="alert-body text-center">
                                  <p className="mb-0">No Data Found</p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          moduleLevels.map((dataRows, index) => (
                            <Draggable
                              key={dataRows.uid}
                              draggableId={dataRows.uid}
                              index={index}
                            >
                              {(provider, snapshot) => (
                                <tr
                                  key={dataRows.uid}
                                  {...provider.draggableProps}
                                  ref={provider.innerRef}
                                >
                                  <td>{index + 1}</td>
                                  <td className="fw-medium">{`${dataRows.level.name}`}</td>
                                  <td className="fw-medium">
                                    {dataRows.action.name}
                                  </td>
                                  <td className="fw-medium">
                                    {dataRows.department !== null ? (
                                      <div className="d-flex flex-column text-start">
                                        <span className="fw-bold text-muted">
                                          {dataRows.department?.directory?.name}
                                        </span>
                                        <span className="small">
                                          Department:{" "}
                                          <span className="text-muted">
                                            {dataRows.department?.name}
                                          </span>
                                        </span>
                                      </div>
                                    ) : (
                                      <span>{dataRows.department?.name}</span>
                                    )}
                                  </td>
                                  <td className="fw-medium text-center">
                                    {dataRows.is_signatory ? (
                                      <span className="badge bg-label-success me-1">
                                        Yes
                                      </span>
                                    ) : (
                                      <span className="badge bg-label-danger me-1">
                                        No
                                      </span>
                                    )}
                                  </td>
                                  <td className="fw-medium text-center">
                                    {dataRows.is_active ? (
                                      <span className="badge bg-label-success me-1">
                                        Active
                                      </span>
                                    ) : (
                                      <span className="badge bg-label-danger me-1">
                                        Inactive
                                      </span>
                                    )}
                                  </td>
                                  <td {...provider.dragHandleProps}>
                                    <i
                                      className="bx bx-chevrons-up ms-1"
                                      style={{ cursor: "pointer" }}
                                    ></i>
                                    <i
                                      className="bx bx-chevrons-down ms-1"
                                      style={{ cursor: "pointer" }}
                                    ></i>
                                  </td>

                                  <td className="text-center">
                                    <div className="dropdown">
                                      <button
                                        aria-label="Click me"
                                        type="button"
                                        className="btn p-0 dropdown-toggle hide-arrow"
                                        data-bs-toggle="dropdown"
                                      >
                                        <i className="bx bx-menu"></i>
                                      </button>
                                      <div className="dropdown-menu">
                                        <a
                                          className="dropdown-item"
                                          href="#"
                                          onClick={() => {
                                            setSelectedPositionalLevelModule(
                                              dataRows
                                            );
                                          }}
                                          data-bs-toggle="modal"
                                          data-bs-target="#viewCreateDataLevelModal"
                                        >
                                          <i className="bx bx-edit-alt me-1"></i>{" "}
                                          View / Edit
                                        </a>
                                        <a
                                          className="dropdown-item text-danger"
                                          href="#"
                                          onClick={async () => {
                                            handleDeleteLevel(dataRows);
                                          }}
                                        >
                                          <i className="bx bx-trash me-1"></i>{" "}
                                          Delete
                                        </a>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </Draggable>
                          ))
                        )}
                        {provider.placeholder}
                      </tbody>
                    )}
                  </Droppable>
                </table>
              </DragDropContext>
              <div style={{ minHeight: "40px" }}></div>
            </div>
          </div>
        </div>
      </div>
      <RequestHandlingModal
        onClose={() => setSelectedPositionalLevelModule(null)}
      />
    </PageContext.Provider>
  );
};
