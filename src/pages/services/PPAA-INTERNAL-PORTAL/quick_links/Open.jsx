import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BreadCumb from "../../../../layouts/BreadCumb";
import { getQuickLinksList, deleteQuickLink } from "./Queries";
import showToast from "../../../../helpers/ToastHelper";
import { formatDate } from "../../../../helpers/DateFormater";
import { normalizePublicPortalAssetUrl } from "../../../../helpers/publicPortalAssetUrl";
import ReactLoading from "react-loading";
import QuickLinkModal from "./Modal";
import Swal from "sweetalert2";

export const QuickLinkOpenPage = () => {
  const { uid } = useParams();
  const navigate = useNavigate();
  const [selectedObj, setSelectedObj] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tableRefresh, setTableRefresh] = useState(0);

  const handleFetchData = async () => {
    setLoading(true);
    try {
      const result = await getQuickLinksList({ uid });
      if (result.status === 200 || result.status === 8000) {
        setSelectedObj(result.data);
      } else {
        setSelectedObj(null);
        showToast("Unable to fetch quick link details", "warning", "Fetch Failed");
      }
    } catch (err) {
      setSelectedObj(null);
      showToast("Unable to fetch quick link details", "danger", "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const confirmation = await Swal.fire({
        title: "Are you sure?",
        text: `You're about to delete quick link: ${selectedObj?.name || 'this quick link'}. This action cannot be undone.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        cancelButtonColor: "#aaa",
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "Cancel",
      });

      if (confirmation.isConfirmed) {
        const result = await deleteQuickLink(uid);
        if (result.status === 200 || result.status === 8000) {
          Swal.fire(
            "Deleted!",
            "The quick link has been deleted successfully.",
            "success"
          );
          navigate("/ppaa-internal-portal/quick-links");
        } else {
          Swal.fire("Error!", result.message || "Failed to delete quick link", "error");
        }
      }
    } catch (error) {
      Swal.fire(
        "Error!",
        "Unable to delete quick link. Please try again or contact support.",
        "error"
      );
    }
  };

  useEffect(() => {
    handleFetchData();
  }, [uid, tableRefresh]);

  if (loading) {
    return (
      <>
        <BreadCumb pageList={["Internal Portal", "Quick Links", "View"]} />
        <div className="card">
          <div className="card-body">
            <center>
              <ReactLoading type={"cylon"} color={"#00853f"} height={"30px"} width={"50px"} />
              <h6 className="text-muted mt-2">Loading Quick Link Details...</h6>
            </center>
          </div>
        </div>
      </>
    );
  }

  if (!selectedObj) {
    return (
      <>
        <BreadCumb pageList={["Internal Portal", "Quick Links", "View"]} />
        <div className="card">
          <div className="card-body">
            <div className="alert alert-danger" role="alert">
              <div className="alert-body text-center">
                <p className="mb-0">
                  Sorry! Unable to get Quick Link Details. Please Contact System Administrator
                </p>
                <button
                  className="btn btn-primary btn-sm mt-3"
                  onClick={() => navigate("/ppaa-internal-portal/quick-links")}
                >
                  <i className="bx bx-arrow-back me-1"></i> Back to Quick Links
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
      <BreadCumb pageList={["Internal Portal", "Quick Links", "View"]} />

      {/* Quick Link Header Card */}
      <div className="card mb-4 shadow-sm animate__animated animate__fadeInDown animate__faster">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-8">
              <div className="d-flex align-items-start">
                <div className="flex-shrink-0">
                  <div className="avatar avatar-xl me-3">
                    <span className="avatar-initial rounded bg-label-primary">
                      <i className="bx bx-link bx-lg"></i>
                    </span>
                  </div>
                </div>
                <div className="flex-grow-1">
                  <h4 className="mb-1 fw-bold">
                    {selectedObj.name}
                  </h4>
           
                  <div className="d-flex gap-2 flex-wrap">
                    <span className={`badge ${selectedObj.is_active ? 'bg-success' : 'bg-secondary'}`}>
                      {selectedObj.is_active ? "Active" : "Inactive"}
                    </span>
                    {selectedObj.total_clicks !== undefined && (
                      <span className="badge bg-info">
                        {selectedObj.total_clicks || 0} Clicks
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4 text-end">
              <button
                type="button"
                className="btn btn-primary btn-sm me-2"
                data-bs-toggle="modal"
                data-bs-target="#quickLinkModal"
              >
                <i className="bx bx-edit-alt me-1"></i> Edit Quick Link
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm me-2"
                onClick={handleDelete}
              >
                <i className="bx bx-trash me-1"></i> Delete
              </button>
              <button
                type="button"
                className="btn btn-label-secondary btn-sm"
                onClick={() => navigate("/ppaa-internal-portal/quick-links")}
              >
                <i className="bx bx-arrow-back me-1"></i> Back
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar flex-shrink-0 me-3">
                  <span className="avatar-initial rounded bg-label-primary">
                    <i className="bx bx-link fs-4"></i>
                  </span>
                </div>
                <div className="flex-grow-1">
                  <small className="text-muted d-block mb-1">Link Name</small>
                  <h6 className="mb-0">
                    {selectedObj.name}
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
                    <span className={`badge ${selectedObj.is_active ? 'bg-success' : 'bg-secondary'}`}>
                      {selectedObj.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {selectedObj.total_clicks !== undefined && (
          <div className="col-xl-3 col-md-6 mb-3">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="avatar flex-shrink-0 me-3">
                    <span className="avatar-initial rounded bg-label-info">
                      <i className="bx bx-mouse fs-4"></i>
                    </span>
                  </div>
                  <div className="flex-grow-1">
                    <small className="text-muted d-block mb-1">Total Clicks</small>
                    <h6 className="mb-0">
                      {selectedObj.total_clicks || 0}
                    </h6>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {selectedObj.logo && (
          <div className="col-xl-3 col-md-6 mb-3">
            <div className="card shadow-sm h-100">
              <div className="card-body text-center">
                <small className="text-muted d-block mb-2">Logo</small>
                <div className="mb-2">
                  <img
                    src={normalizePublicPortalAssetUrl(selectedObj.logo)}
                    alt={selectedObj.name}
                    style={{ maxWidth: "100px", maxHeight: "100px", objectFit: "contain", border: "1px solid #ddd", padding: "5px", borderRadius: "4px" }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = "none";
                    }}
                  />
                </div>
                <div className="d-flex gap-1 justify-content-center">
                  <a
                    href={normalizePublicPortalAssetUrl(selectedObj.logo)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-outline-primary"
                    title="View Logo"
                  >
                    <i className="bx bx-show me-1"></i> View
                  </a>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        normalizePublicPortalAssetUrl(selectedObj.logo)
                      );
                      showToast("Logo URL copied", "success", "Copied");
                    }}
                    title="Copy URL"
                  >
                    <i className="bx bx-copy"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Link Details Card */}
      <div className="card shadow-sm animate__animated animate__fadeInUp animate__fast">
        <div className="card-header bg-light">
          <h5 className="mb-0 fw-semibold">
            <i className="bx bx-info-circle me-2 text-primary"></i>
            Quick Link Information
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
                      <i className="bx bx-link me-2 text-primary"></i>
                      Name:
                    </td>
                    <td>
                      <strong>{selectedObj.name}</strong>
                    </td>
                  </tr>
                  {selectedObj.url && (
                    <tr>
                      <td className="fw-medium">
                        <i className="bx bx-world me-2 text-primary"></i>
                        Link URL:
                      </td>
                      <td>
                        <a 
                          href={selectedObj.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary"
                        >
                          {selectedObj.url}
                          <i className="bx bx-link-external ms-1"></i>
                        </a>
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
                      <span className={`badge ${selectedObj.is_active ? 'bg-success' : 'bg-secondary'}`}>
                        {selectedObj.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                  {selectedObj.total_clicks !== undefined && (
                    <tr>
                      <td className="fw-medium">
                        <i className="bx bx-mouse me-2 text-info"></i>
                        Total Clicks:
                      </td>
                      <td>
                        <strong>{selectedObj.total_clicks || 0}</strong>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <QuickLinkModal
        selectedObj={selectedObj}
        setSelectedObj={setSelectedObj}
        tableRefresh={tableRefresh}
        setTableRefresh={setTableRefresh}
      />
    </>
  );
};
