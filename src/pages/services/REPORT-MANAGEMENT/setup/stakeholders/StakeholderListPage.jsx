import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import BreadCumb from "../../../../../layouts/BreadCumb";
import PaginatedTable from "../../../../../components/ui-templates/PaginatedTable";
import StakeholderModal from "./StakeholderModal";
import { deleteStakeholder, ORGANIZATION_TYPE_OPTIONS } from "../../Queries";
import showToast from "../../../../../helpers/ToastHelper";
import {
  canAddStakeholder,
  canChangeStakeholder,
  canDeleteStakeholder,
} from "../../../../../utils/rmsSetupPermissions";
import Swal from "sweetalert2";

const StakeholderListPage = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.userReducer?.data);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => setRefreshKey(prev => prev + 1);

  const handleView = (item) => {
    navigate(`/report-management/setup/stakeholders/${item.uid}`);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleDelete = async (item) => {
    const result = await Swal.fire({
      title: "Delete Stakeholder?",
      html: `Are you sure you want to delete <strong>${item.name}</strong>?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        const response = await deleteStakeholder(item.uid);
        if (response.status === 8000) {
          showToast("Stakeholder deleted successfully", "success");
          handleRefresh();
        } else {
          showToast(response.message || "Failed to delete", "error");
        }
      } catch (error) {
        showToast("Failed to delete stakeholder", "error");
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
      label: "Stakeholder Name",
      render: (row) => <strong style={{ textTransform: "uppercase" }}>{row.name}</strong>,
    },
    {
      key: "organization_type",
      label: "Organization Type",
      render: (row) => (
        <span className="badge bg-label-info">
          {row.organization_type_display || row.organization_type}
        </span>
      ),
    },
    {
      key: "contact_person",
      label: "Contact Person",
      render: (row) => row.contact_person || "-",
    },
    {
      key: "email",
      label: "Email",
      render: (row) => row.email ? (
        <a href={`mailto:${row.email}`}>{row.email}</a>
      ) : "-",
    },
    {
      key: "phone",
      label: "Phone",
      render: (row) => row.phone || "-",
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
          <button
            className="btn btn-sm btn-outline-info"
            onClick={(e) => {
              e.stopPropagation();
              handleView(row);
            }}
            title="View Details"
          >
            <i className="bx bx-show"></i>
          </button>
          {canChangeStakeholder(user) && (
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
          {canDeleteStakeholder(user) && (
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
      key: "organization_type",
      label: "Organization Type",
      options: ORGANIZATION_TYPE_OPTIONS,
    },
  ];

  const addButton = canAddStakeholder(user) ? [
    {
      label: (<><i className="bx bx-plus me-1"></i>Add Stakeholder</>),
      className: "btn-primary",
      onClick: () => { setSelectedItem(null); setShowModal(true); },
    },
  ] : [];

  return (
    <div className="w-100">
      <BreadCumb pageList={["Report Management System (RMS)", "Setup", "Stakeholders"]} />

      <PaginatedTable
        key={refreshKey}
        fetchPath="/api/reports/stakeholders"
        isFullPath={true}
        title="Stakeholders"
        columns={columns}
        buttons={addButton}
        filterGroups={filterGroups}
        searchPlaceholder="Search stakeholders..."
      />

      {showModal && (
        <StakeholderModal
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

export default StakeholderListPage;
