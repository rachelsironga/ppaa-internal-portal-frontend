import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import BreadCumb from "../../../../layouts/BreadCumb";
import { getDocuments, deleteDocument, downloadPortalDocument } from "./Queries";
import showToast from "../../../../helpers/ToastHelper";
import { formatDate } from "../../../../helpers/DateFormater";
import ReactLoading from "react-loading";
import DocumentModal from "./Modal";
import Swal from "sweetalert2";
import { hasAccess } from "../../../../hooks/AccessHandler";

export const DocumentOpenPage = () => {
  const { uid } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.userReducer?.data);
  const [selectedObj, setSelectedObj] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tableRefresh, setTableRefresh] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [fileDownloading, setFileDownloading] = useState(false);

  const handleFetchData = async () => {
    setLoading(true);
    try {
      const result = await getDocuments({ uid });
      if (result.status === 200 || result.status === 8000) {
        setSelectedObj(result.data);
      } else {
        setSelectedObj(null);
        showToast("Unable to fetch document details", "warning", "Fetch Failed");
      }
    } catch (err) {
      setSelectedObj(null);
      showToast("Unable to fetch document details", "danger", "Failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleFetchData();
  }, [uid, tableRefresh]);

  const handleDownloadFile = async () => {
    if (!selectedObj?.uid || !selectedObj?.file_key) return;
    setFileDownloading(true);
    try {
      await downloadPortalDocument(
        selectedObj.uid,
        selectedObj.original_filename || "document"
      );
      setTableRefresh((r) => r + 1);
    } catch {
      showToast(
        "Download failed. For older documents, open Edit and re-upload the file.",
        "danger",
        "Download"
      );
    } finally {
      setFileDownloading(false);
    }
  };

  const handleDelete = async () => {
    const documentUid = selectedObj?.uid || selectedObj?.id || uid;
    if (!documentUid) {
      showToast("Cannot delete: document identifier is missing.", "error", "Error");
      return;
    }
    const confirmed = await Swal.fire({
      title: "Delete Document?",
      text: `Are you sure you want to delete "${selectedObj?.title || "this document"}"? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
    });
    if (!confirmed.isConfirmed) return;
    setDeleting(true);
    try {
      const result = await deleteDocument(documentUid);
      if (result?.status === 200 || result?.status === 8000) {
        showToast("Document deleted successfully.", "success", "Done");
        navigate("/ppaa-internal-portal/documents");
      } else {
        showToast(result?.message || "Failed to delete document.", "warning", "Failed");
      }
    } catch (err) {
      showToast("Unable to delete document.", "danger", "Failed");
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      PUBLISHED: { class: "bg-success", label: "Published" },
      DRAFT: { class: "bg-warning", label: "Draft" },
      ARCHIVED: { class: "bg-secondary", label: "Archived" },
    };
    return statusConfig[status] || { class: "bg-secondary", label: status || "Unknown" };
  };

  if (loading) {
    return (
      <>
        <BreadCumb pageList={["Internal Portal", "Documents", "View"]} />
        <div className="card">
          <div className="card-body">
            <center>
              <ReactLoading type={"cylon"} color={"#00853f"} height={"30px"} width={"50px"} />
              <h6 className="text-muted mt-2">Loading Document Details...</h6>
            </center>
          </div>
        </div>
      </>
    );
  }

  if (!selectedObj) {
    return (
      <>
        <BreadCumb pageList={["Internal Portal", "Documents", "View"]} />
        <div className="card">
          <div className="card-body">
            <div className="alert alert-danger" role="alert">
              <div className="alert-body text-center">
                <p className="mb-0">
                  Sorry! Unable to get Document Details. Please Contact System Administrator
                </p>
                <button
                  className="btn btn-primary btn-sm mt-3"
                  onClick={() => navigate("/ppaa-internal-portal/documents")}
                >
                  <i className="bx bx-arrow-back me-1"></i> Back to Documents
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const statusInfo = getStatusBadge(selectedObj.status);

  return (
    <>
      <BreadCumb pageList={["Internal Portal", "Documents", "View"]} />

      {/* Document Header Card */}
      <div className="card mb-4 shadow-sm animate__animated animate__fadeInDown animate__faster">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-8">
              <div className="d-flex align-items-start">
                <div className="flex-shrink-0">
                  <div className="avatar avatar-xl me-3">
                    <span className="avatar-initial rounded bg-label-danger">
                      <i className="bx bx-file bx-lg"></i>
                    </span>
                  </div>
                </div>
                <div className="flex-grow-1">
                  <h4 className="mb-1 fw-bold">
                    {selectedObj.title}
                  </h4>
                  <p className="mb-2 text-muted">
                    {selectedObj.description ? selectedObj.description.substring(0, 100) + (selectedObj.description.length > 100 ? '...' : '') : 'No description provided'}
                  </p>
                  <div className="d-flex gap-2 flex-wrap">
                    <span className={`badge ${statusInfo.class}`}>
                      {statusInfo.label}
                    </span>
                    {selectedObj.category && (
                      <span className="badge bg-primary">
                        {selectedObj.category.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4 d-flex flex-nowrap gap-2 justify-content-end align-items-center">
              {hasAccess(user, ["can_edit_document"]) && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  data-bs-toggle="modal"
                  data-bs-target="#documentModal"
                >
                  <i className="bx bx-edit-alt me-1"></i> Edit
                </button>
              )}

{hasAccess(user, ["can_delete_document"]) && (
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
                      <i className="bx bx-trash me-1"></i> Delete 
                    </>
                  )}
                </button>
              )}
              {selectedObj.file_key && hasAccess(user, ["can_view_document"]) && (
                <button
                  type="button"
                  className="btn btn-success btn-sm"
                  disabled={fileDownloading}
                  onClick={handleDownloadFile}
                >
                  {fileDownloading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
                      Downloading…
                    </>
                  ) : (
                    <>
                      <i className="bx bx-download me-1"></i> Download
                    </>
                  )}
                </button>
              )}
            
              <button
                type="button"
                className="btn btn-label-secondary btn-sm"
                onClick={() => navigate("/ppaa-internal-portal/documents")}
              >
                <i className="bx bx-arrow-back me-1"></i> Back
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="row mb-4">
        {selectedObj.category && (
          <div className="col-xl-3 col-md-6 mb-3">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="avatar flex-shrink-0 me-3">
                    <span className="avatar-initial rounded bg-label-primary">
                      <i className="bx bx-category fs-4"></i>
                    </span>
                  </div>
                  <div className="flex-grow-1">
                    <small className="text-muted d-block mb-1">Category</small>
                    <h6 className="mb-0">
                      {selectedObj.category.name}
                    </h6>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar flex-shrink-0 me-3">
                  <span className="avatar-initial rounded bg-label-warning">
                    <i className="bx bx-download fs-4"></i>
                  </span>
                </div>
                <div className="flex-grow-1">
                  <small className="text-muted d-block mb-1">Downloads</small>
                  <h6 className="mb-0">
                    {selectedObj.download_count || 0}
                  </h6>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar flex-shrink-0 me-3">
                  <span className="avatar-initial rounded bg-label-success">
                    <i className="bx bx-check-circle fs-4"></i>
                  </span>
                </div>
                <div className="flex-grow-1">
                  <small className="text-muted d-block mb-1">Status</small>
                  <div className="mb-0">
                    <span className={`badge ${statusInfo.class}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Details Card */}
      <div className="card shadow-sm animate__animated animate__fadeInUp animate__fast">
        <div className="card-header bg-light">
          <h5 className="mb-0 fw-semibold">
            <i className="bx bx-info-circle me-2 text-primary"></i>
            Document Information
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
                      <i className="bx bx-file me-2 text-primary"></i>
                      Title:
                    </td>
                    <td>
                      <strong>{selectedObj.title}</strong>
                    </td>
                  </tr>
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
                  {selectedObj.category && (
                    <tr>
                      <td className="fw-medium">
                        <i className="bx bx-category me-2 text-success"></i>
                        Category:
                      </td>
                      <td>
                        <strong>{selectedObj.category.name}</strong>
                      </td>
                    </tr>
                  )}
                  {selectedObj.tags && (
                    <tr>
                      <td className="fw-medium">
                        <i className="bx bx-tag me-2 text-warning"></i>
                        Tags:
                      </td>
                      <td>
                        <strong>{selectedObj.tags}</strong>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="col-md-6">
              <h6 className="mb-3 fw-semibold text-primary">Status & Statistics</h6>
              <table className="table table-borderless">
                <tbody>
                  <tr>
                    <td className="fw-medium" style={{ width: "40%" }}>
                      <i className="bx bx-check-circle me-2 text-success"></i>
                      Status:
                    </td>
                    <td>
                      <span className={`badge ${statusInfo.class}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="fw-medium">
                      <i className="bx bx-download me-2 text-info"></i>
                      Downloads:
                    </td>
                    <td>
                      <strong>{selectedObj.download_count || 0}</strong>
                    </td>
                  </tr>
                  {selectedObj.file_key && (
                    <tr>
                      <td className="fw-medium">
                        <i className="bx bx-link me-2 text-primary"></i>
                        File:
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          disabled={fileDownloading}
                          onClick={handleDownloadFile}
                        >
                          <i className="bx bx-download me-1"></i> Download File
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <DocumentModal
        selectedObj={selectedObj}
        setSelectedObj={setSelectedObj}
        tableRefresh={tableRefresh}
        setTableRefresh={setTableRefresh}
      />
    </>
  );
};
