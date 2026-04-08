import React, { useState } from "react";
import { useSelector } from "react-redux";
import BreadCumb from "../../../../../layouts/BreadCumb";
import PaginatedTable from "../../../../../components/ui-templates/PaginatedTable";
import ReportTypeModal from "./ReportTypeModal";
import { deleteReportType, FREQUENCY_OPTIONS } from "../../Queries";
import showToast from "../../../../../helpers/ToastHelper";
import { hasAccess } from "../../../../../hooks/AccessHandler";
import Swal from "sweetalert2";

const ReportTypeListPage = () => {
  const user = useSelector((state) => state.userReducer?.data);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => setRefreshKey(prev => prev + 1);

  const handleEdit = (item) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleDelete = async (item) => {
    const result = await Swal.fire({
      title: "Delete Report Type?",
      html: `Are you sure you want to delete <strong>${item.name}</strong>?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        const response = await deleteReportType(item.uid);
        if (response.status === 8000) {
          showToast("Report Type deleted successfully", "success");
          handleRefresh();
        } else {
          showToast(response.message || "Failed to delete", "error");
        }
      } catch (error) {
        showToast("Failed to delete report type", "error");
      }
    }
  };

  const columns = [
    {
      key: "SN",
      label: "SN",
      style: { width: "60px" },
    },
    {
      key: "name",
      label: "Report Type",
      render: (row) => (
        <div>
          <strong style={{ textTransform: "uppercase" }}>{row.name}</strong>
          <br />
          <small className="text-muted">CODE: <span style={{ textTransform: "uppercase" }}>{row.code}</span></small>
        </div>
      ),
    },
    {
      key: "frequency",
      label: "Frequency",
      render: (row) => (
        <span className="badge bg-label-info">
          {row.frequency_display || row.frequency}
        </span>
      ),
    },
    {
      key: "submission_deadline_days",
      label: "Submission Deadline",
      render: (row) => `${row.submission_deadline_days ?? 0} day(s) after period end`,
    },
    {
      key: "before_reminder_days",
      label: "Reminder Days",
      render: (row) => `Before: ${row.before_reminder_days ?? 0}d | After: ${row.after_reminder_days ?? 0}d`,
    },
    {
      key: "requires_attachment",
      label: "Requires Attachment",
      render: (row) => (
        <span className={`badge bg-label-${row.requires_attachment ? 'success' : 'secondary'}`}>
          {row.requires_attachment ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: "template_file",
      label: "Template",
      render: (row) => row.template_file ? (
        <a href={row.template_file} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary">
          <i className="bx bx-download me-1"></i>Download
        </a>
      ) : "-",
    },
    {
      key: "is_active",
      label: "Status",
      render: (row) => (
        <span className={`badge bg-label-${row.is_active ? 'success' : 'secondary'}`}>
          {row.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="d-flex gap-1">
          {hasAccess(user, ['change_reporttype']) && (
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(row);
              }}
              title="Edit"
            >
              <i className="bx bx-edit"></i>
            </button>
          )}
          {hasAccess(user, ['delete_reporttype']) && (
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(row);
              }}
              title="Delete"
            >
              <i className="bx bx-trash"></i>
            </button>
          )}
        </div>
      ),
    },
  ];

  const filterGroups = [
    {
      key: "frequency",
      label: "Frequency",
      options: FREQUENCY_OPTIONS,
    },
  ];

  const addButton = hasAccess(user, ['add_reporttype']) ? [
    {
      label: (<><i className="bx bx-plus me-1"></i>Add Report Type</>),
      className: "btn-primary",
      onClick: () => { setSelectedItem(null); setShowModal(true); },
    },
  ] : [];

  return (
    <div className="container-fluid flex-grow-1 container-p-y px-4">
      <BreadCumb pageList={["Report Management System (RMS)", "Setup", "Report Types"]} />

      <PaginatedTable
        key={refreshKey}
        fetchPath="/api/reports/report-types"
        isFullPath={true}
        title="Report Types"
        columns={columns}
        buttons={addButton}
        filterGroups={filterGroups}
        searchPlaceholder="Search report types..."
      />

      {showModal && (
        <ReportTypeModal
          show={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedItem(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setSelectedItem(null);
            handleRefresh();
          }}
          item={selectedItem}
        />
      )}
    </div>
  );
};

export default ReportTypeListPage;
