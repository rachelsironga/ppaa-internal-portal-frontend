import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import BreadCumb from "../../../../layouts/BreadCumb";
import { getDepartments, deleteDepartment } from "./Queries";
import showToast from "../../../../helpers/ToastHelper";
import { formatDate } from "../../../../helpers/DateFormater";
import ReactLoading from "react-loading";
import Swal from "sweetalert2";
import { hasAccess } from "../../../../hooks/AccessHandler";
import DepartmentModal from "./Modal";

export const DepartmentOpenPage = () => {
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
      const result = await getDepartments({ uid });
      if (result.status === 200 || result.status === 8000) {
        setSelectedObj(result.data);
      } else {
        setSelectedObj(null);
        showToast("Unable to fetch department details", "warning", "Fetch Failed");
      }
    } catch (err) {
      setSelectedObj(null);
      showToast("Unable to fetch department details", "danger", "Failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleFetchData();
  }, [uid, tableRefresh]);

  const handleDelete = async () => {
    const departmentUid = selectedObj?.uid || selectedObj?.id || uid;
    if (!departmentUid) {
      showToast("Cannot delete: department identifier is missing.", "error", "Error");
      return;
    }
    const confirmed = await Swal.fire({
      title: "Delete Department?",
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
      const result = await deleteDepartment(departmentUid);
      if (result?.status === 200 || result?.status === 8000) {
        showToast("Department deleted successfully.", "success", "Done");
        navigate("/ppaa-internal-portal/departments");
      } else {
        showToast(result?.message || "Failed to delete department.", "warning", "Failed");
      }
    } catch (err) {
      showToast("Unable to delete department.", "danger", "Failed");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <>
        <BreadCumb pageList={["Internal Portal", "Departments", "View"]} />
        <div className="card">
          <div className="card-body">
            <center>
              <ReactLoading type={"cylon"} color={"#00853f"} height={"30px"} width={"50px"} />
              <h6 className="text-muted mt-2">Loading Department Details...</h6>
            </center>
          </div>
        </div>
      </>
    );
  }

  if (!selectedObj) {
    return (
      <>
        <BreadCumb pageList={["Internal Portal", "Departments", "View"]} />
        <div className="card">
          <div className="card-body">
            <div className="alert alert-danger" role="alert">
              <div className="alert-body text-center">
                <p className="mb-0">
                  Sorry! Unable to get Department Details. Please Contact System Administrator
                </p>
                <button
                  className="btn btn-primary btn-sm mt-3"
                  onClick={() => navigate("/ppaa-internal-portal/departments")}
                >
                  <i className="bx bx-arrow-back me-1"></i> Back to Departments
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
      <BreadCumb pageList={["Internal Portal", "Departments", "View"]} />

      {/* Department Header Card */}
      <div className="card mb-4 shadow-sm animate__animated animate__fadeInDown animate__faster">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-8">
              <div className="d-flex align-items-start">
                <div className="flex-shrink-0">
                  <div className="avatar avatar-xl me-3">
                    <span className="avatar-initial rounded bg-label-info">
                      <i className="bx bx-building bx-lg"></i>
                    </span>
                  </div>
                </div>
                <div className="flex-grow-1">
                  <h4 className="mb-1 fw-bold">
                    {selectedObj.name}
                  </h4>
                  <p className="mb-2 text-muted">
                    {selectedObj.description ? selectedObj.description.substring(0, 100) + (selectedObj.description.length > 100 ? '...' : '') : 'No description provided'}
                  </p>
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
              {hasAccess(user, ["can_edit_department"]) && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  data-bs-toggle="modal"
                  data-bs-target="#departmentModal"
                >
                  <i className="bx bx-edit-alt me-1"></i> Edit Department
                </button>
              )}
              {hasAccess(user, ["can_delete_department"]) && (
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
                      <i className="bx bx-trash me-1"></i> Delete Department
                    </>
                  )}
                </button>
              )}
              <button
                type="button"
                className="btn btn-label-secondary btn-sm"
                onClick={() => navigate("/ppaa-internal-portal/departments")}
              >
                <i className="bx bx-arrow-back me-1"></i> Back
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Department Details Card */}
      <div className="card shadow-sm animate__animated animate__fadeInUp animate__fast">
        <div className="card-header bg-light">
          <h5 className="mb-0 fw-semibold">
            <i className="bx bx-info-circle me-2 text-primary"></i>
            Department Information
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
                      <i className="bx bx-building me-2 text-primary"></i>
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
                  {selectedObj.description && (
                    <tr>
                      <td className="fw-medium">
                        <i className="bx bx-detail me-2 text-info"></i>
                        Description:
                      </td>
                      <td>
                        <div className="alert alert-light mb-0">
                          <p className="mb-0">{selectedObj.description}</p>
                        </div>
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

      <DepartmentModal
        selectedObj={selectedObj}
        setSelectedObj={setSelectedObj}
        tableRefresh={tableRefresh}
        setTableRefresh={setTableRefresh}
      />
    </>
  );
};
