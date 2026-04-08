import React, { useState } from "react";
import { useSelector } from "react-redux";
import BreadCumb from "../../../../../layouts/BreadCumb";
import PaginatedTable from "../../../../../components/ui-templates/PaginatedTable";
import FinancialYearModal from "./FinancialYearModal";
import { deleteFinancialYear } from "../../Queries";
import { formatDate } from "../../../../../helpers/DateFormater";
import showToast from "../../../../../helpers/ToastHelper";
import { hasAccess } from "../../../../../hooks/AccessHandler";
import Swal from "sweetalert2";

const FinancialYearListPage = () => {
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
      title: "Delete Financial Year?",
      html: `Are you sure you want to delete <strong>${item.name}</strong>?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        const response = await deleteFinancialYear(item.uid);
        if (response.status === 8000) {
          showToast("Financial Year deleted successfully", "success");
          handleRefresh();
        } else {
          showToast(response.message || "Failed to delete", "error");
        }
      } catch (error) {
        showToast("Failed to delete financial year", "error");
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
      label: "Financial Year",
      render: (row) => (
        <div>
          <strong>{row.name}</strong>
          {row.is_current && (
            <span className="badge bg-success ms-2">Current</span>
          )}
        </div>
      ),
    },
    {
      key: "start_date",
      label: "Start Date",
      render: (row) => formatDate(row.start_date),
    },
    {
      key: "end_date",
      label: "End Date",
      render: (row) => formatDate(row.end_date),
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
      key: "description",
      label: "Description",
      render: (row) => row.description || "-",
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="d-flex gap-1">
          {hasAccess(user, ['change_financialyear']) && (
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
          {hasAccess(user, ['delete_financialyear']) && (
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

  const addButton = hasAccess(user, ['add_financialyear']) ? [
    {
      label: (
        <>
          <i className="bx bx-plus me-1"></i>
          Add Financial Year
        </>
      ),
      className: "btn-primary",
      onClick: () => {
        setSelectedItem(null);
        setShowModal(true);
      },
    },
  ] : [];

  return (
    <div className="container-fluid flex-grow-1 container-p-y px-4">
      <BreadCumb pageList={["Report Management System (RMS)", "Setup", "Financial Years"]} />

      <PaginatedTable
        key={refreshKey}
        fetchPath="/api/reports/financial-years"
        isFullPath={true}
        title="Financial Years"
        columns={columns}
        buttons={addButton}
        searchPlaceholder="Search financial years..."
      />

      {showModal && (
        <FinancialYearModal
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

export default FinancialYearListPage;
