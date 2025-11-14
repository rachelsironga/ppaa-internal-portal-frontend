import React, { useState, useEffect } from "react";
import "animate.css";
import { DirectoryContext } from "../../../../utils/context";
import { useNavigate } from "react-router-dom";
import BreadCumb from "../../../../layouts/BreadCumb";
import PaginatedTable from "../../../../components/ui-templates/PaginatedTable";
import { formatDate } from "../../../../helpers/DateFormater";
import Swal from "sweetalert2";
import { DirectoryModal } from "./Modal";
import { DirectoryImportModal } from "./ImportModal";
import { hasAccess } from "../../../../hooks/AccessHandler";
import { useSelector } from "react-redux";
// import { FileImportModal } from "./ImportModal";

export const AssetListPage = () => {
  const [selectedObj, setSelectedObj] = useState(null);
  const [tableRefresh, setTableRefresh] = useState(0);
  const navigate = useNavigate();
  const user = useSelector((state) => state.userReducer?.data);
  return (
    <DirectoryContext.Provider
      value={{
        selectedObj,
        setSelectedObj,
        tableRefresh,
        setTableRefresh,
      }}
    >
      <BreadCumb pageList={["Assets", "List"]} />
      <PaginatedTable
  fetchPath="/assets"
  title="List of Assets"
  columns={[
    {
      key: "asset_tag",
      label: "Asset Tag",
      className: "fw-bold",
      style: { width: "150px" },
      render: (row) => (
        <span
          className="text-primary cursor-pointer"
          onClick={() =>
            hasAccess(user, [
              ["view_asset", "add_asset", "change_asset"]
            ])
              ? navigate(`/assets/${row.uid}`)
              : null
          }
        >
          {row.asset_tag || "-"}
        </span>
      ),
    },

    {
      key: "serial_number",
      label: "Serial Number",
      className: "text-center",
      style: { width: "150px" },
    },

    {
      key: "model",
      label: "Model",
      className: "text-left",
      render: (row) => row.model || "-",
    },

    // {
    //   key: "purchase_cost",
    //   label: "Cost",
    //   className: "text-right",
    //   style: { width: "120px" },
    //   render: (row) =>
    //     row.purchase_cost ? (
    //       <span>${Number(row.purchase_cost).toLocaleString()}</span>
    //     ) : (
    //       "-"
    //     ),
    // },

    {
      key: "purchase_date",
      label: "Purchase Date",
      className: "text-right",
      style: { width: "140px" },
      render: (row) =>
        formatDate(row.purchase_date, "DD/MM/YYYY") || "-",
    },

    {
      key: "warranty_expiry",
      label: "Warranty Expiry",
      className: "text-right",
      style: { width: "150px" },
      render: (row) => (
        <span
          className={`${
            new Date(row.warranty_expiry) < new Date()
              ? "text-danger"
              : "text-success"
          }`}
        >
          {formatDate(row.warranty_expiry, "DD/MM/YYYY")}
        </span>
      ),
    },

    {
      key: "custodian",
      label: "Custodian",
      style: { width: "180px" },
      render: (row) =>
        row.custodian_details
          ? `${row.custodian_details.first_name} ${row.custodian_details.last_name}`
          : "-",
    },

    {
      key: "last_audit_date",
      label: "Last Audit",
      className: "text-right",
      render: (row) =>
        formatDate(row.last_audit_date, "DD/MM/YYYY") || "-",
    },

    {
      key: "status",
      label: "Status",
      className: "text-center",
      style: { width: "120px" },
      render: (row) => (
        <span
          className={`badge ${
            row.status === "active"
              ? "bg-success"
              : row.status === "inactive"
              ? "bg-warning"
              : "bg-secondary"
          }`}
        >
          {row.status || "-"}
        </span>
      ),
    },

    {
      key: "actions",
      label: "Actions",
      style: { width: "110px" },
      className: "text-center",
      render: (row) => (
        <div className="btn-group">
          <button
            aria-label="View"
            type="button"
            className="btn btn-sm text-info p-0 px-2"
            onClick={() => navigate(`/assets/${row.uid}`)}
          >
            <i className="bx bx-show"></i>
          </button>

          {hasAccess(user, [["change_asset"]]) && (
            <button
              aria-label="Edit"
              type="button"
              className="btn btn-sm text-primary p-0 px-2"
              onClick={() => navigate(`/assets/${row.uid}/edit`)}
            >
              <i className="bx bx-edit"></i>
            </button>
          )}

          {hasAccess(user, [["delete_asset"]]) && (
            <button
              aria-label="Delete"
              type="button"
              className="btn btn-sm text-danger p-0 px-2"
              data-bs-toggle="modal"
              data-bs-target={`#deleteAssetModal-${row.uid}`}
            >
              <i className="bx bx-trash"></i>
            </button>
          )}
        </div>
      ),
    },
  ]}

  buttons={[
    {
      label: "Import Assets",
      render: () => (
        <button
          type="button"
          className="btn btn-success btn-sm me-2"
          data-bs-toggle="modal"
          data-bs-target="#assetImportModal"
        >
          <i className="bx bx-upload me-1"></i> Import
        </button>
      ),
    },
    {
      label: "Add Asset",
      render: () => (
        <button
          type="button"
          className="btn btn-primary btn-sm"
          data-bs-toggle="modal"
          data-bs-target="#createAssetModal"
        >
          <i className="bx bx-plus me-1"></i> Add Asset
        </button>
      ),
    },
  ]}

  isRefresh={tableRefresh}
/>

      <DirectoryModal />
      <DirectoryImportModal context={DirectoryContext} />
    </DirectoryContext.Provider>
  );
};
