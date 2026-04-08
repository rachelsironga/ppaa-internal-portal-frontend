import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import BreadCumb from "../../../../layouts/BreadCumb";
import { getPositionalLevels, deletePositionalLevel } from "./Queries";
import showToast from "../../../../helpers/ToastHelper";
import { formatDate } from "../../../../helpers/DateFormater";
import ReactLoading from "react-loading";
import Swal from "sweetalert2";
import { hasAccess } from "../../../../hooks/AccessHandler";
import PositionalLevelModal from "./Modal";

export const PositionalLevelOpenPage = () => {
  const { uid } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.userReducer?.data);
  const [selectedObj, setSelectedObj] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tableRefresh, setTableRefresh] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const handleFetchData = async () => {
    setLoading(true);
    try {
      const result = await getPositionalLevels({ uid });
      if (result.status === 200 || result.status === 8000) {
        setSelectedObj(result.data);
      } else {
        setSelectedObj(null);
        showToast("Unable to fetch position/designation details", "warning", "Fetch Failed");
      }
    } catch (err) {
      setSelectedObj(null);
      showToast("Unable to fetch position/designation details", "danger", "Failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleFetchData();
  }, [uid, tableRefresh]);

  const handleDelete = async () => {
    const levelUid = selectedObj?.uid || selectedObj?.id || uid;
    if (!levelUid) {
      showToast("Cannot delete: position/designation identifier is missing.", "error", "Error");
      return;
    }
    const confirmed = await Swal.fire({
      title: "Delete Position/Designation?",
      text: `Are you sure you want to delete "${selectedObj?.name}"? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, delete",
    });
    if (!confirmed.isConfirmed) return;
    setDeleting(true);
    try {
      const result = await deletePositionalLevel(levelUid);
      if (result?.status === 200 || result?.status === 8000) {
        showToast("Position/Designation deleted successfully.", "success", "Done");
        navigate("/ppaa-internal-portal/positional-levels");
      } else {
        showToast(result?.message || "Failed to delete position/designation.", "warning", "Failed");
      }
    } catch (err) {
      showToast("Unable to delete position/designation.", "danger", "Failed");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <>
        <BreadCumb pageList={["Internal Portal", "Position/Designation", "View"]} />
        <div className="card">
          <div className="card-body">
            <center>
              <ReactLoading type={"cylon"} color={"#696cff"} height={"30px"} width={"50px"} />
              <h6 className="text-muted mt-2">Loading Position/Designation Details...</h6>
            </center>
          </div>
        </div>
      </>
    );
  }

  if (!selectedObj) {
    return (
      <>
        <BreadCumb pageList={["Internal Portal", "Position/Designation", "View"]} />
        <div className="card">
          <div className="card-body">
            <div className="alert alert-danger" role="alert">
              <div className="alert-body text-center">
                <p className="mb-0">
                  Sorry! Unable to get Position/Designation Details. Please Contact System Administrator
                </p>
                <button
                  className="btn btn-primary btn-sm mt-3"
                  onClick={() => navigate("/ppaa-internal-portal/positional-levels")}
                >
                  <i className="bx bx-arrow-back me-1"></i> Back to Positions
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <BreadCumb pageList={["Internal Portal", "Position/Designation", "View"]} />

      {/* Position/Designation Header Card */}
      <div className="card mb-4 shadow-sm animate__animated animate__fadeInDown animate__faster">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-8">
              <div className="d-flex align-items-start">
                <div className="flex-shrink-0">
                  <div className="avatar avatar-xl me-3">
                    <span className="avatar-initial rounded bg-label-primary">
                      <i className="bx bx-briefcase bx-lg"></i>
                    </span>
                  </div>
                </div>
                <div className="flex-grow-1">
                  <h4 className="mb-1 fw-bold">
                    {selectedObj.name}
                  </h4>
                  {selectedObj.code && (
                    <p className="mb-2 text-muted">
                      Code: {selectedObj.code}
                    </p>
                  )}
                  <div className="d-flex gap-2 flex-wrap">
                    {selectedObj.code && (
                      <span className="badge bg-primary">
                        {selectedObj.code}
                      </span>
                    )}
                    <span className={`badge ${selectedObj.is_active ? 'bg-success' : 'bg-secondary'}`}>
                      {selectedObj.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4 d-flex flex-nowrap gap-2 justify-content-end align-items-center">
              {hasAccess(user, ["can_edit_positional_level"]) && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  data-bs-toggle="modal"
                  data-bs-target="#positionalLevelModal"
                >
                  <i className="bx bx-edit-alt me-1"></i> Edit Position
                </button>
              )}
              {hasAccess(user, ["can_delete_positional_level"]) && (
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <i className="bx bx-trash me-1"></i> Delete Position
                    </>
                  )}
                </button>
              )}
              <button
                type="button"
                className="btn btn-label-secondary btn-sm"
                onClick={() => navigate("/ppaa-internal-portal/positional-levels")}
              >
                <i className="bx bx-arrow-back me-1"></i> Back
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Position/Designation Details Card */}
      <div className="card shadow-sm animate__animated animate__fadeInUp animate__fast">
        <div className="card-header bg-light">
          <h5 className="mb-0 fw-semibold">
            <i className="bx bx-info-circle me-2 text-primary"></i>
            Position/Designation Information
          </h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <h6 className="mb-3 fw-semibold text-primary">Basic Information</h6>
              <table className="table table-borderless">
                <tbody>
                  <tr>
                    <td className="fw-medium" style={{ width: "40%" }}>
                      <i className="bx bx-briefcase me-2 text-primary"></i>
                      Name:
                    </td>
                    <td>
                      <strong>{selectedObj.name}</strong>
                    </td>
                  </tr>
                  {selectedObj.code && (
                    <tr>
                      <td className="fw-medium">
                        <i className="bx bx-code me-2 text-info"></i>
                        Code:
                      </td>
                      <td>
                        <strong>{selectedObj.code}</strong>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="col-md-6">
              <h6 className="mb-3 fw-semibold text-primary">Status</h6>
              <table className="table table-borderless">
                <tbody>
                  <tr>
                    <td className="fw-medium" style={{ width: "40%" }}>
                      <i className="bx bx-check-circle me-2 text-success"></i>
                      Status:
                    </td>
                    <td>
                      <span className={`badge ${selectedObj.is_active ? 'bg-success' : 'bg-secondary'}`}>
                        {selectedObj.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <PositionalLevelModal
        selectedObj={selectedObj}
        setSelectedObj={setSelectedObj}
        tableRefresh={tableRefresh}
        setTableRefresh={setTableRefresh}
      />
    </>
  );
};
