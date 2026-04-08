import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import BreadCumb from "../../../../layouts/BreadCumb";
import { getFAQs, deleteFAQ } from "./Queries";
import showToast from "../../../../helpers/ToastHelper";
import { formatDate } from "../../../../helpers/DateFormater";
import ReactLoading from "react-loading";
import FAQModal from "./Modal";
import Swal from "sweetalert2";
import { hasAccess } from "../../../../hooks/AccessHandler";

export const FAQOpenPage = () => {
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
      const result = await getFAQs({ uid });
      if (result.status === 200 || result.status === 8000) {
        setSelectedObj(result.data);
      } else {
        setSelectedObj(null);
        showToast("Unable to fetch FAQ details", "warning", "Fetch Failed");
      }
    } catch (err) {
      setSelectedObj(null);
      showToast("Unable to fetch FAQ details", "danger", "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const faqUid = selectedObj?.uid || selectedObj?.id || uid;
    if (!faqUid) {
      showToast("Cannot delete: FAQ identifier is missing.", "error", "Error");
      return;
    }
    const confirmed = await Swal.fire({
      title: "Delete FAQ?",
      text: `Are you sure you want to delete this FAQ? This action cannot be undone.`,
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
      const result = await deleteFAQ(faqUid);
      if (result?.status === 200 || result?.status === 8000) {
        showToast("FAQ deleted successfully.", "success", "Done");
        navigate("/ppaa-internal-portal/faqs");
      } else {
        showToast(result?.message || "Failed to delete FAQ.", "warning", "Failed");
      }
    } catch (err) {
      showToast("Unable to delete FAQ.", "danger", "Failed");
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    handleFetchData();
  }, [uid, tableRefresh]);

  if (loading) {
    return (
      <>
        <BreadCumb pageList={["Internal Portal", "FAQs", "View"]} />
        <div className="card">
          <div className="card-body">
            <center>
              <ReactLoading type={"cylon"} color={"#696cff"} height={"30px"} width={"50px"} />
              <h6 className="text-muted mt-2">Loading FAQ Details...</h6>
            </center>
          </div>
        </div>
      </>
    );
  }

  if (!selectedObj) {
    return (
      <>
        <BreadCumb pageList={["Internal Portal", "FAQs", "View"]} />
        <div className="card">
          <div className="card-body">
            <div className="alert alert-danger" role="alert">
              <div className="alert-body text-center">
                <p className="mb-0">
                  Sorry! Unable to get FAQ Details. Please Contact System Administrator
                </p>
                <button
                  className="btn btn-primary btn-sm mt-3"
                  onClick={() => navigate("/ppaa-internal-portal/faqs")}
                >
                  <i className="bx bx-arrow-back me-1"></i> Back to FAQs
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
      <BreadCumb pageList={["Internal Portal", "FAQs", "View"]} />

      {/* FAQ Header Card */}
      <div className="card mb-4 shadow-sm animate__animated animate__fadeInDown animate__faster">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-8">
              <div className="d-flex align-items-start">
                <div className="flex-shrink-0">
                  <div className="avatar avatar-xl me-3">
                    <span className="avatar-initial rounded bg-label-info">
                      <i className="bx bx-help-circle bx-lg"></i>
                    </span>
                  </div>
                </div>
                <div className="flex-grow-1">
                  <h4 className="mb-1 fw-bold">
                    {selectedObj.question}
                  </h4>
                
                  <div className="d-flex gap-2 flex-wrap">
                    <span className={`badge ${selectedObj.is_active ? 'bg-success' : 'bg-secondary'}`}>
                      {selectedObj.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4 d-flex flex-nowrap gap-2 justify-content-end align-items-center">
              {hasAccess(user, ["can_edit_faq"]) && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  data-bs-toggle="modal"
                  data-bs-target="#faqModal"
                >
                  <i className="bx bx-edit-alt me-1"></i> Edit FAQ
                </button>
              )}
              {hasAccess(user, ["can_delete_faq"]) && (
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
                      <i className="bx bx-trash me-1"></i> Delete FAQ
                    </>
                  )}
                </button>
              )}
              <button
                type="button"
                className="btn btn-label-secondary btn-sm"
                onClick={() => navigate("/ppaa-internal-portal/faqs")}
              >
                <i className="bx bx-arrow-back me-1"></i> Back
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Details Card */}
      <div className="card shadow-sm animate__animated animate__fadeInUp animate__fast">
        <div className="card-header bg-light">
          <h5 className="mb-0 fw-semibold">
            <i className="bx bx-info-circle me-2 text-primary"></i>
            FAQ Information
          </h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <h6 className="mb-3 fw-semibold text-primary">Question</h6>
              <table className="table table-borderless">
                <tbody>
                  <tr>
                    <td className="fw-medium" style={{ width: "40%" }}>
                      <i className="bx bx-help-circle me-2 text-primary"></i>
                      Question:
                    </td>
                    <td>
                      <strong>{selectedObj.question}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="col-md-6">
              <h6 className="mb-3 fw-semibold text-primary">Answer & Status</h6>
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
          {selectedObj.answer && (
            <div className="row mt-3">
              <div className="col-12">
                <h6 className="mb-3 fw-semibold text-primary">Answer</h6>
                <div className="alert alert-light">
                  {selectedObj.answer
                    .split(/\n\n+/)
                    .filter(Boolean)
                    .map((paragraph, i) => (
                      <p
                        key={i}
                        className={i > 0 ? "mb-2 mt-0" : "mb-0"}
                        style={{ whiteSpace: "pre-line" }}
                      >
                        {paragraph.trim()}
                      </p>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <FAQModal
        selectedObj={selectedObj}
        setSelectedObj={setSelectedObj}
        tableRefresh={tableRefresh}
        setTableRefresh={setTableRefresh}
      />
    </>
  );
};
