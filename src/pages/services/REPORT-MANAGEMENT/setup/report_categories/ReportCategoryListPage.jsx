import React, { useState } from "react";
import { useSelector } from "react-redux";
import BreadCumb from "../../../../../layouts/BreadCumb";
import PaginatedTable from "../../../../../components/ui-templates/PaginatedTable";
import ReportCategoryModal from "./ReportCategoryModal";
import { deleteReportCategory } from "../../Queries";
import showToast from "../../../../../helpers/ToastHelper";
import { hasAccess } from "../../../../../hooks/AccessHandler";
import Swal from "sweetalert2";

const ReportCategoryListPage = () => {
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
      title: "Delete Category?",
      html: `Are you sure you want to delete <strong>${item.name}</strong>?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        const response = await deleteReportCategory(item.uid);
        if (response.status === 8000) {
          showToast("Category deleted successfully", "success");
          handleRefresh();
        } else {
          showToast(response.message || "Failed to delete", "error");
        }
      } catch (error) {
        showToast("Failed to delete category", "error");
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
      label: "Category",
      render: (row) => (
        <div className="d-flex align-items-center">
          <div
            className="rounded-circle me-2"
            style={{
              width: "20px",
              height: "20px",
              backgroundColor: row.color || "#6c757d",
            }}
          ></div>
          <div>
            <strong>{row.name}</strong>
            <br />
            <small className="text-muted">Code: {row.code}</small>
          </div>
        </div>
      ),
    },
    {
      key: "color",
      label: "Color",
      render: (row) => (
        <span
          className="badge"
          style={{ backgroundColor: row.color || "#6c757d", color: "#fff" }}
        >
          {row.color || "N/A"}
        </span>
      ),
    },
    {
      key: "icon",
      label: "Icon",
      render: (row) => row.icon ? (
        <i className={`bx ${row.icon} fs-5`}></i>
      ) : "-",
    },
    {
      key: "description",
      label: "Description",
      render: (row) => row.description || "-",
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
          {hasAccess(user, ['change_reportcategory']) && (
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
          {hasAccess(user, ['delete_reportcategory']) && (
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

  const addButton = hasAccess(user, ['add_reportcategory']) ? [
    {
      label: (<><i className="bx bx-plus me-1"></i>Add Category</>),
      className: "btn-primary",
      onClick: () => { setSelectedItem(null); setShowModal(true); },
    },
  ] : [];

  return (
    <div className="container-fluid flex-grow-1 container-p-y px-4">
      <BreadCumb pageList={["Report Management System (RMS)", "Setup", "Report Categories"]} />

      <PaginatedTable
        key={refreshKey}
        fetchPath="/api/reports/report-categories"
        isFullPath={true}
        title="Report Categories"
        columns={columns}
        buttons={addButton}
        searchPlaceholder="Search categories..."
      />

      {showModal && (
        <ReportCategoryModal
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

export default ReportCategoryListPage;
