import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import ReactLoading from "react-loading";
import "animate.css";
import { OxygenLocationUsageContext } from "../../../../utils/context";
import { useParams } from "react-router-dom";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import showToast from "../../../../helpers/ToastHelper";
import { deleteOxygenLocationUsage, getOxygenLocationUsages } from "./Queries";

import OxygenLocationUsagesModal from "./ModalLocationUsage";

export const OxygenLocationUsagePage = () => {
  const { uid } = useParams();
  const [oxygenLocationUsage, setOxygenLocationUsage] = useState(null);
  const [selectOxygenLocationUsage, setSelectedOxygenLocationUsage] =
    useState(null);
  const [oxygenLocation, setOxygenLocation] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);
  const [debounceTimeout, setDebounceTimeout] = useState(null);

  const handleFetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getOxygenLocationUsages({
        uid: uid,
      });
      if (result.status === 200 || result.status === 8000) {
        setOxygenLocationUsage(result.data);
        setSelectedOxygenLocationUsage(result.data);
        // Initialize with empty array if volumes is undefined
        setOxygenLocation(result.data.location || []);
      } else {
        setError(true);
        showToast("No Oxygen Location Found", "warning", "Fetch Completed");
      }
    } catch (err) {
      setError(true);
      showToast("Unable to Fetch Oxygen Locations", "warning", "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (location = null) => {
    if (!location) {
      Swal.fire("Error!", "Unable to Select this Oxygen Location.", "error");
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
        const result = await deleteOxygenLocationUsage(location.uid);
        if (result.status === 200 || result.status === 8000) {
          Swal.fire(
            "Process Completed!",
            "The Oxygen Location has been deleted.",
            "success"
          );
          handleFetchData();
        } else {
          console.error("Error deleting Oxygen Location:", result);
          Swal.fire("Error Occurred!", `${result.message}`, "error");
        }
      }
    } catch (error) {
      console.error("Error deleting Oxygen Location:", error);
      Swal.fire(
        "Unsuccessful",
        `Unable to Perform Delete. Please Try Again or Contact Support Team`,
        "error"
      );
    }

    setSelectedOxygenLocationUsage(null); // Reset selected oxygenLocationUsage after deletion
  };

  useEffect(() => {
    if (debounceTimeout) clearTimeout(debounceTimeout);

    const timeout = setTimeout(() => {
      handleFetchData();
    }, 1500);

    setDebounceTimeout(timeout);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <OxygenLocationUsageContext.Provider
      value={{
        debounceTimeout,
        setDebounceTimeout,
        handleFetchData,
        selectOxygenLocationUsage,
        setSelectedOxygenLocationUsage,
        setOxygenLocationUsage,
        setOxygenLocation,
      }}
    >
      <h4 className="py-3 mb-4">
        <span className="text-muted fw-light">
          Setting /{" "}
          <a className="text-link" href="/oxygen-management/locations">
            Oxygen Locations
          </a>{" "}
          /{" "}
        </span>{" "}
        Usage
      </h4>

      <div className="card mb-4 animate__animated animate__fadeInDown animate__faster">
        <div className="d-flex justify-content-between align-items-center card-header shadow-sm mb-4">
          <h5 className="mb-0">Oxygen Locations Details</h5>

          {loading || error || oxygenLocation == null ? (
            <div className="form-group"></div>
          ) : (
            <div className="form-group">
              <button
                aria-label="Open Modal"
                type="button"
                className="btn btn-primary ms-auto btn-sm me-2"
                data-bs-toggle="modal"
                data-bs-target="#viewCreateDataModal"
              >
                <i className="bx bx-edit-alt me-1"></i> Edit
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
                  <h6 className="text-muted">Fetching Oxygen Locations</h6>
                </center>
              </div>
            </div>
          ) : error || oxygenLocationUsage.length === 0 ? (
            // error || oxygenLocationUsage.length === 0
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
              <div className="row mb-1">
                <div
                  className="col-md-1 col-sm-12"
                  style={{ minWidth: "120px" }}
                >
                  <h6 className="text-muted">Name:</h6>
                </div>
                <div className="col-md-9 col-sm-12">
                  <p className="text-justify">
                    {oxygenLocationUsage?.name || ""} (&nbsp;
                    {oxygenLocationUsage?.code}&nbsp;)
                  </p>
                </div>
              </div>
              <div className="row mb-1">
                <div
                  className="col-md-1 col-sm-12"
                  style={{ minWidth: "120px" }}
                >
                  <h6 className="text-muted">Type:</h6>
                </div>
                <div className="col-md-9 col-sm-12">
                  <p className="text-justify">
                    {oxygenLocationUsage?.type || ""}
                  </p>
                </div>
              </div>
              <div className="row mb-1">
                <div
                  className="col-md-1 col-sm-12"
                  style={{ minWidth: "120px" }}
                >
                  <h6 className="text-muted">Available:</h6>
                </div>
                <div className="col-md-9 col-sm-12">
                  <p className="text-justify">
                    {oxygenLocationUsage?.quantity || "0"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div>
          <div className="d-flex justify-content-between align-items-center card-header">
            <h5 className="mb-0">
              Oxygen Volumes For {oxygenLocationUsage?.name}{" "}
            </h5>
            {loading || error || oxygenLocationUsage == null ? (
              <div className="form-group"></div>
            ) : (
              <div className="form-group">
                <ModalLocationUsage title="View / Add Oxygen Location Volumes" />
              </div>
            )}
          </div>
        </div>

        <div className="card-body animate__animated animate__fadeInUp animate__faster">
          <div className="text-nowrap mb-4">
            <table className="table table-hover table-align-middle mb-0 table-bordered">
              <thead style={{ backgroundColor: "#f1f1f1" }}>
                <tr>
                  <th style={{ width: "50px" }}>S/N</th>
                  <th>Name</th>
                  <th style={{ width: "100px" }}>Value</th>
                  <th style={{ width: "100px" }}>Quantity</th>
                  <th style={{ width: "100px" }}>Action</th>
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
                          <h6 className="text-muted">Fetching Volumes</h6>
                        </center>
                      </div>
                    </td>
                  </tr>
                ) : error || oxygenLocationUsage.length === 0 ? (
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
                  oxygenLocationUsage.map((dataRow, index) => (
                    <tr key={dataRow.volume_uid}>
                      <td>{index + 1}</td>
                      <td className="fw-medium">{`${dataRow.volume_name} `}</td>
                      <td className="fw-medium">{dataRow.volume_value}</td>
                      <td className="fw-medium">{dataRow.quantity}</td>

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
                          <div className="dropdown-menu"></div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <OxygenLocationUsagesModal
        loadOnlyModal={true}
        onClose={() => setSelectedOxygenLocationUsage(null)}
      />
    </OxygenLocationUsageContext.Provider>
  );
};
