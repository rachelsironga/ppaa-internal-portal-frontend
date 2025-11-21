import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import ReactLoading from "react-loading";
import "animate.css";
import { OxygenUsageContext } from "../../../../utils/context";
import { useNavigate, useParams } from "react-router-dom";
import showToast from "../../../../helpers/ToastHelper";
import {
  deleteOxygenUsage,
  getOxygenUsages,
  getUsageReport,
  VerifyOxygenUsage,
} from "./Queries";
import OxygenUsagesModal from "./Modal";
import ReportModal from "./ReportModal";

export const OxygenUsageOpenPage = () => {
  const { uid } = useParams();
  const [loading, setLoading] = useState(true);
  const navigation = useNavigate();

  const [error, setError] = useState(null);
  const [selectedOxygenUsage, setSelectedOxygenUsage] = useState(null);
  const [debounceTimeout, setDebounceTimeout] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);

  const backTOPreviousPage = () => {
    navigation(-1); // Go back one step in history
  };

  const handleFetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getOxygenUsages({
        uid: uid,
      });
      if (result.status === 200 || result.status === 8000) {
        setSelectedOxygenUsage(result.data);
      } else {
        setError(true);
        showToast("No Oxygen Recieving Found", "warning", "Fetch Completed");
      }
    } catch (err) {
      setError(true);
      showToast("Unable to Fetch Oxygen Recievings", "warning", "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (receiving = null) => {
    if (!receiving) {
      Swal.fire("Error!", "Unable to Select this Oxygen Recieving.", "error");
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
        const result = await deleteOxygenUsage(receiving.uid);
        if (result.status === 200 || result.status === 8000) {
          Swal.fire(
            "Process Completed!",
            "The Oxygen Recieving has been deleted.",
            "success"
          );
          handleFetchData();
        } else {
          console.error("Error deleting Oxygen Recieving:", result);
          Swal.fire("Error Occurred!", `${result.message}`, "error");
        }
      }
    } catch (error) {
      console.error("Error deleting Oxygen Recieving:", error);
      Swal.fire(
        "Unsuccessful",
        `Unable to Perform Delete. Please Try Again or Contact Support Team`,
        "error"
      );
    }

    setSelectedOxygenUsage(null); // Reset selected selectedOxygenUsage after deletion
  };

  const handleVerification = async (selectedItems) => {
    if (!selectedItems || selectedItems.length === 0) {
      showToast(
        "Please select at least one item to verify.",
        "warning",
        "Check the items"
      );
      return;
    }

    try {
      const confirmation = await Swal.fire({
        text: "By proceeding with verification, you confirm that you have reviewed the items and are satisfied with their condition and quantity as per the order.",
        icon: "info",
        showCancelButton: true,
        confirmButtonColor: "#03B0D4",
        cancelButtonColor: "#aaa",
        confirmButtonText: "Verify",
      });

      if (confirmation.isConfirmed) {
        const result = await VerifyOxygenUsage(selectedOxygenUsage?.uid, {
          item_uids: selectedItems,
          status: "VERIFIED",
          remarks: "Verified by the user",
        });
        if (result.status === 200 || result.status === 8000) {
          Swal.fire(
            "Process Completed!",
            "Action Completed Successfully",
            "success"
          );
          handleFetchData();
        } else {
          Swal.fire("Error Occurred!", `${result.message}`, "error");
        }
      }
    } catch (error) {
      console.error("Error deleting Oxygen Recieving:", error);
      Swal.fire(
        "Unsuccessful",
        `Unable to Perform Selected Action. Please Try Again or Contact Support Team`,
        "error"
      );
    }
  };

  const handleSelectItem = (uid) => {
    setSelectedItems((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleSelectAll = () => {
    if (
      selectedOxygenUsage?.patient_age_groups?.length === selectedItems.length
    ) {
      setSelectedItems([]);
    } else {
      setSelectedItems(
        selectedOxygenUsage?.patient_age_groups?.map((item) => item.uid) || []
      );
    }
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
    <OxygenUsageContext.Provider
      value={{
        debounceTimeout,
        setDebounceTimeout,
        handleFetchData,
        selectedOxygenUsage,
        setSelectedOxygenUsage,
      }}
    >
      <h4 className="py-3 mb-4">
        <span className="text-muted fw-light">
          Setting /{" "}
          <span className="text-link" onClick={backTOPreviousPage}>
            Oxygen Recievings
          </span>{" "}
          /{" "}
        </span>{" "}
        View
      </h4>

      <div className="card mb-4 animate__animated animate__fadeInDown animate__faster">
        <div className="d-flex justify-content-between align-items-center card-header shadow-sm mb-4">
          <h5 className="mb-0">Oxygen Recievings Details</h5>
          <div className="demo-inline-spacing">
            <span
              style={{ minWidth: "150px" }}
              className={
                selectedOxygenUsage?.status === "NEW"
                  ? "badge bg-label-primary me-1"
                  : selectedOxygenUsage?.status === "PENDING" ||
                    selectedOxygenUsage?.status === "PARTIAL_VERIFIED"
                  ? "badge bg-label-warning me-1"
                  : selectedOxygenUsage?.status === "REJECTED" ||
                    selectedOxygenUsage?.status === "CANCELLED" ||
                    selectedOxygenUsage?.status === "EXPIRED"
                  ? "badge bg-label-danger me-1"
                  : selectedOxygenUsage?.status === "VERIFIED"
                  ? "badge bg-label-success me-1"
                  : "badge bg-label-info me-1"
              }
            >
              {selectedOxygenUsage?.status}
            </span>
          </div>

          {loading || error || selectedOxygenUsage == null ? (
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
                <i className="bx bx-edit-alt me-1"></i> Edit / Add Volume
              </button>
              {/* <button
                aria-label="Delete Item"
                className="btn btn-danger ms-auto btn-sm"
                onClick={async () => {
                  handleDelete(selectedOxygenUsage);
                }}
                type="button"
              >
                <i className="bx bx-trash me-1"></i> Remove
              </button> */}
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
                  <h6 className="text-muted">Fetching Oxygen Usages</h6>
                </center>
              </div>
            </div>
          ) : error || selectedOxygenUsage === null ? (
            <div className="alert alert-info" role="alert">
              <div className="alert-body text-center">
                <p className="mb-0">
                  Sorry! Unable to get Usage Details Please Contanct System
                  Administrator{" "}
                </p>
              </div>
            </div>
          ) : (
            <div className="col-md-12">
              <div className="row">
                <div
                  className="col-md-1 col-sm-12"
                  style={{ minWidth: "160px" }}
                >
                  <h6 className="text-muted">Date:</h6>
                </div>
                <div className="col-md-9 col-sm-12">
                  <p className="text-justify">
                    {(() => {
                      const d = new Date(selectedOxygenUsage.date);
                      const pad = (n) => n.toString().padStart(2, "0");
                      const day = pad(d.getDate());
                      const month = pad(d.getMonth() + 1);
                      const year = d.getFullYear();
                      let hours = d.getHours();
                      const minutes = pad(d.getMinutes());
                      const ampm = hours >= 12 ? "PM" : "AM";
                      hours = hours % 12;
                      hours = hours ? hours : 12; // the hour '0' should be '12'
                      return `${day}/${month}/${year} ${pad(
                        hours
                      )}:${minutes} ${ampm}`;
                    })()}
                  </p>
                </div>
              </div>
              <div className="row">
                <div
                  className="col-md-1 col-sm-12"
                  style={{ minWidth: "160px" }}
                >
                  <h6 className="text-muted">Location:</h6>
                </div>
                <div className="col-md-9 col-sm-12">
                  <p className="text-justify">
                    {`${selectedOxygenUsage?.location?.name} (${selectedOxygenUsage?.location?.code})` ||
                      "N/A"}
                  </p>
                </div>
              </div>

              <div className="row">
                <div
                  className="col-md-1 col-sm-12"
                  style={{ minWidth: "160px" }}
                >
                  <h6 className="text-muted">Total&nbsp;Quantity:</h6>
                </div>
                <div className="col-md-9 col-sm-12">
                  <p className="text-justify">
                    {selectedOxygenUsage?.patient_age_groups
                      ? selectedOxygenUsage.patient_age_groups.reduce(
                          (total, group) =>
                            total +
                            (Number(group.oxygen) || 0) +
                            (Number(group.ventilator) || 0) +
                            (Number(group.cpap) || 0),
                          0
                        )
                      : "0"}
                  </p>
                </div>
              </div>
              <div className="row">
                <div
                  className="col-md-1 col-sm-12"
                  style={{ minWidth: "160px" }}
                >
                  <h6 className="text-muted">Created&nbsp;By:</h6>
                </div>
                <div className="col-md-9 col-sm-12">
                  <p className="text-justify">
                    {selectedOxygenUsage?.used_by?.name || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="col-md-8">
        <div className="card">
          <div>
            <div className="d-flex justify-content-between align-items-center card-header">
              <h5 className="mb-0">
                Received Volumes For {selectedOxygenUsage?.location?.name}{" "}
              </h5>

              <>
                <div className="form-group">
                  <button
                    type="button"
                    className="btn btn-info btn-sm me-2"
                    onClick={() => handleVerification(selectedItems)}
                  >
                    <i className="bx bx-check-shield me-1"></i> Click to Verify
                  </button>
                  {selectedOxygenUsage?.status !== "VERIFIED" && (
                    <button
                      aria-label="Open Modal"
                      type="button"
                      className="btn btn-primary ms-auto btn-sm me-2"
                      data-bs-toggle="modal"
                      data-bs-target="#viewCreateReportModal"
                    >
                      <i className="bx bx-edit-alt me-1"></i> Print Report
                    </button>
                  )}
                </div>
              </>
            </div>
          </div>

          <div className="card-body animate__animated animate__fadeInUp animate__faster">
            <div className="text-nowrap mb-4">
              <table className="table table-hover table-align-middle mb-0 table-bordered">
                <thead style={{ backgroundColor: "#f1f1f1" }}>
                  <tr>
                    <th style={{ width: "50px" }}>
                      <input
                        className="form-check-input p-2"
                        type="checkbox"
                        checked={
                          selectedOxygenUsage?.patient_age_groups?.length > 0 &&
                          selectedOxygenUsage?.patient_age_groups?.length ===
                            selectedItems.length
                        }
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th style={{ width: "50px" }}>S/N</th>
                    <th>Patient Age Group</th>
                    <th style={{ width: "110px" }}>Oxygen</th>
                    <th style={{ width: "110px" }}>Ventilator</th>
                    <th style={{ width: "110px" }}>CPAP</th>
                    <th style={{ width: "150px" }}>Status</th>
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
                            <h6 className="text-muted">Fetching Items</h6>
                          </center>
                        </div>
                      </td>
                    </tr>
                  ) : error ||
                    selectedOxygenUsage?.patient_age_groups?.length === 0 ? (
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
                    selectedOxygenUsage?.patient_age_groups?.map(
                      (dataRow, index) => (
                        <tr key={`${dataRow.uid}-DataRow`}>
                          <td>
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={selectedItems.includes(dataRow.uid)}
                              onChange={() => handleSelectItem(dataRow.uid)}
                            />
                          </td>
                          <td>{index + 1}</td>
                          <td className="fw-medium">{`${dataRow.patient_age_group.name} `}</td>
                          <td className="fw-medium">{dataRow.oxygen}</td>
                          <td className="fw-medium">{dataRow.ventilator}</td>
                          <td className="fw-medium">{dataRow.cpap}</td>

                          <td className="text-center">
                            <span
                              className={
                                dataRow.status === "NEW"
                                  ? "badge bg-label-primary me-1"
                                  : dataRow.status === "REJECTED"
                                  ? "badge bg-label-danger me-1"
                                  : dataRow.status === "VERIFIED"
                                  ? "badge bg-label-success me-1"
                                  : "badge bg-label-info me-1"
                              }
                            >
                              {dataRow.status}
                            </span>
                          </td>
                        </tr>
                      )
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <OxygenUsagesModal
        loadOnlyModal={true}
        onClose={() => setSelectedOxygenUsage(null)}
      />
      <ReportModal
        loadOnlyModal={true}
        onClose={() => setSelectedOxygenUsage(null)}
      />
    </OxygenUsageContext.Provider>
  );
};
