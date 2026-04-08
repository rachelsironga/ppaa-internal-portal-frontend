import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Card, CardBody, Row, Col } from "reactstrap";
import BreadCumb from "../../../../../layouts/BreadCumb";
import { getStakeholders, getReports, ORGANIZATION_TYPE_OPTIONS } from "../../Queries";
import { formatDate, formatDateTime } from "../../../../../helpers/DateFormater";
import { hasAccess } from "../../../../../hooks/AccessHandler";
import StakeholderModal from "./StakeholderModal";
import showToast from "../../../../../helpers/ToastHelper";

const StakeholderDetailPage = () => {
  const { uid } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.userReducer?.data);
  
  const [stakeholder, setStakeholder] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (uid) {
      fetchStakeholderDetails();
    }
  }, [uid]);

  const fetchStakeholderDetails = async () => {
    setLoading(true);
    try {
      const response = await getStakeholders({ uid });
      if (response.status === 8000) {
        setStakeholder(response.data);
        fetchRelatedReports();
      } else {
        showToast("Failed to load stakeholder details", "error");
        navigate("/report-management/setup/stakeholders");
      }
    } catch (error) {
      showToast("Error loading stakeholder details", "error");
      navigate("/report-management/setup/stakeholders");
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedReports = async () => {
    try {
      const response = await getReports({ stakeholder_uid: uid, paginated: false });
      if (response.status === 8000) {
        setReports(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching related reports:", error);
    }
  };

  const getOrganizationTypeLabel = (value) => {
    const option = ORGANIZATION_TYPE_OPTIONS.find(o => o.value === value);
    return option?.label || value;
  };

  if (loading) {
    return (
      <div className="container-fluid flex-grow-1 container-p-y px-4">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!stakeholder) {
    return (
      <div className="container-fluid flex-grow-1 container-p-y px-4">
        <div className="alert alert-danger">
          Stakeholder not found
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid flex-grow-1 container-p-y px-4">
      <BreadCumb pageList={["Report Management System (RMS)", "Setup", "Stakeholders", "Details"]} />

      {/* Header Card */}
      <Card className="mb-4 border-0 shadow-sm">
        <CardBody>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
            <div className="d-flex align-items-center mb-3 mb-md-0">
              <div className="avatar avatar-xl me-3 bg-label-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: "64px", height: "64px" }}>
                <i className="bx bx-buildings fs-1"></i>
              </div>
              <div>
                <h4 className="mb-1">{stakeholder.name}</h4>
                <span className="badge bg-label-info me-2">
                  {getOrganizationTypeLabel(stakeholder.organization_type)}
                </span>
                <span className={`badge bg-label-${stakeholder.is_active ? 'success' : 'secondary'}`}>
                  {stakeholder.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-secondary"
                onClick={() => navigate("/report-management/setup/stakeholders")}
              >
                <i className="bx bx-arrow-back me-1"></i>
                Back to List
              </button>
              {hasAccess(user, ['change_stakeholder']) && (
                <button
                  className="btn btn-primary"
                  onClick={() => setShowModal(true)}
                >
                  <i className="bx bx-edit me-1"></i>
                  Edit
                </button>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      <Row>
        {/* Contact Information */}
        <Col lg={6} className="mb-4">
          <Card className="h-100 border-0 shadow-sm">
            <CardBody>
              <h5 className="card-title mb-4">
                <i className="bx bx-user me-2 text-primary"></i>
                Contact Information
              </h5>
              
              <div className="mb-3">
                <label className="text-muted small d-block">Contact Person</label>
                <span className="fw-medium fs-6">
                  {stakeholder.contact_person || <span className="text-muted">Not specified</span>}
                </span>
              </div>

              <div className="mb-3">
                <label className="text-muted small d-block">Email Address</label>
                {stakeholder.email ? (
                  <a href={`mailto:${stakeholder.email}`} className="fw-medium fs-6">
                    <i className="bx bx-envelope me-1 text-primary"></i>
                    {stakeholder.email}
                  </a>
                ) : (
                  <span className="text-muted">Not specified</span>
                )}
              </div>

              <div className="mb-3">
                <label className="text-muted small d-block">Phone Number</label>
                {stakeholder.phone ? (
                  <a href={`tel:${stakeholder.phone}`} className="fw-medium fs-6">
                    <i className="bx bx-phone me-1 text-primary"></i>
                    {stakeholder.phone}
                  </a>
                ) : (
                  <span className="text-muted">Not specified</span>
                )}
              </div>

              <div className="mb-3">
                <label className="text-muted small d-block">Website</label>
                {stakeholder.website ? (
                  <a href={stakeholder.website} target="_blank" rel="noopener noreferrer" className="fw-medium fs-6">
                    <i className="bx bx-globe me-1 text-primary"></i>
                    {stakeholder.website}
                  </a>
                ) : (
                  <span className="text-muted">Not specified</span>
                )}
              </div>
            </CardBody>
          </Card>
        </Col>

        {/* Address & Details */}
        <Col lg={6} className="mb-4">
          <Card className="h-100 border-0 shadow-sm">
            <CardBody>
              <h5 className="card-title mb-4">
                <i className="bx bx-map me-2 text-primary"></i>
                Address & Details
              </h5>
              
              <div className="mb-3">
                <label className="text-muted small d-block">Physical Address</label>
                <span className="fw-medium fs-6">
                  {stakeholder.address || <span className="text-muted">Not specified</span>}
                </span>
              </div>

              <div className="mb-3">
                <label className="text-muted small d-block">Description</label>
                <p className="mb-0">
                  {stakeholder.description || <span className="text-muted">No description provided</span>}
                </p>
              </div>

              <hr />

              <div className="row">
                <div className="col-6">
                  <label className="text-muted small d-block">Created</label>
                  <span className="small">
                    {formatDateTime(stakeholder.created_at)}
                  </span>
                  {stakeholder.created_by_name && (
                    <div className="small text-muted">by {stakeholder.created_by_name}</div>
                  )}
                </div>
                <div className="col-6">
                  <label className="text-muted small d-block">Last Updated</label>
                  <span className="small">
                    {formatDateTime(stakeholder.updated_at)}
                  </span>
                  {stakeholder.updated_by_name && (
                    <div className="small text-muted">by {stakeholder.updated_by_name}</div>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Related Reports */}
      <Card className="border-0 shadow-sm">
        <CardBody>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h5 className="card-title mb-0">
              <i className="bx bx-file me-2 text-primary"></i>
              Related Reports
              <span className="badge bg-label-primary ms-2">{reports.length}</span>
            </h5>
            {reports.length > 0 && (
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => navigate(`/report-management/reports?stakeholder_uid=${uid}`)}
              >
                View All Reports
              </button>
            )}
          </div>

          {reports.length === 0 ? (
            <div className="text-center py-4">
              <i className="bx bx-file text-muted" style={{ fontSize: "48px" }}></i>
              <p className="text-muted mt-2 mb-0">No reports associated with this stakeholder</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>SN</th>
                    <th>Reference</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Deadline</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.slice(0, 5).map((report, index) => (
                    <tr key={report.uid}>
                      <td>{index + 1}</td>
                      <td>
                        <strong className="text-primary">{report.reference_number}</strong>
                      </td>
                      <td style={{ maxWidth: "200px" }}>
                        <div className="text-truncate" title={report.title}>
                          {report.title}
                        </div>
                      </td>
                      <td>
                        <span className={`badge bg-label-${
                          report.status === 'submitted' ? 'success' :
                          report.status === 'in_progress' ? 'info' : 'warning'
                        }`}>
                          {report.status_display || report.status}
                        </span>
                      </td>
                      <td>{formatDate(report.deadline_date)}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => navigate(`/report-management/reports/${report.uid}`)}
                        >
                          <i className="bx bx-show"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {reports.length > 5 && (
                <div className="text-center mt-3">
                  <small className="text-muted">
                    Showing 5 of {reports.length} reports
                  </small>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Edit Modal */}
      {showModal && (
        <StakeholderModal
          show={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchStakeholderDetails();
          }}
          item={stakeholder}
        />
      )}
    </div>
  );
};

export default StakeholderDetailPage;
