import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import BreadCumb from "../../../../layouts/BreadCumb";
import PaginatedTable from "../../../../components/ui-templates/PaginatedTable";
import { formatDate } from "../../../../helpers/DateFormater";
import QuickLinkModal from "./Modal";
import { hasAccess } from "../../../../hooks/AccessHandler";

export const QuickLinkPage = () => {
  const [selectedObj, setSelectedObj] = useState(null);
  const [tableRefresh, setTableRefresh] = useState(0);
  const navigate = useNavigate();
  const user = useSelector((state) => state.userReducer?.data);

  return (
    <>
      <BreadCumb pageList={["Internal Portal", "Quick Links"]} />
      <PaginatedTable
        fetchPath="/internal-portal/quick-links"
        title="Quick Links Management"
        columns={[
          {
            key: "SN",
            label: "SN",
            style: { width: "80px" },
            className: "text-center",
          },
          {
            key: "name",
            label: "Link Name",
            render: (row) => (
              <span className="text-bold">
                {row.name}
              </span>
            ),
          },
          {
            key: "url",
            label: "URL",
            render: (row) => (
              <a 
                href={row.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary text-truncate"
                style={{ maxWidth: "300px", display: "inline-block" }}
              >
                {row.url}
              </a>
            ),
          },
          {
            key: "logo",
            label: "Logo",
            style: { width: "100px" },
            className: "text-center",
            render: (row) => (
              row.logo ? (
                <img 
                  src={row.logo} 
                  alt={row.name}
                  style={{ width: "40px", height: "40px", objectFit: "contain" }}
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <span className="text-muted">-</span>
              )
            ),
          },
          {
            key: "total_clicks",
            label: "Total Clicks",
            style: { width: "120px" },
            className: "text-center",
            render: (row) => (
              <span className="badge bg-label-info">
                {row.total_clicks || 0}
              </span>
            ),
          },
          {
            key: "is_active",
            label: "Status",
            style: { width: "120px" },
            className: "text-center",
            render: (row) => (
              <span
                className={
                  row.is_active
                    ? "badge bg-label-success me-1"
                    : "badge bg-label-secondary me-1"
                }
              >
                {row.is_active ? "Active" : "Inactive"}
              </span>
            ),
          },
          {
            key: "actions",
            label: "Actions",
            className: "text-center",
            style: { width: "120px" },
            render: (row) =>
              hasAccess(user, ["can_view_quick_link"]) ? (
                <button
                  className="btn btn-sm btn-outline-primary text-center"
                  onClick={() => {
                    navigate(`/ppaa-internal-portal/quick-links/open/${row.uid}`);
                  }}
                >
                  <i className="bx bx-show"></i>&nbsp; View
                </button>
              ) : null,
          },
        ]}
        buttons={[
          {
            label: "Add Quick Link",
            render: () => (
              hasAccess(user, ["can_add_quick_link"]) ? (
                <button
                aria-label="Add Quick Link"
                type="button"
                className="btn btn-primary ms-auto btn-sm animate__animated animate__fadeInRight animate__slow me-1"
                data-bs-toggle="modal"
                data-bs-target="#quickLinkModal"
                onClick={() => setSelectedObj(null)}
              >
                <i className="bx bx-plus me-1"></i> Add Quick Link
              </button>
              ):null
            
            ),
          },
        ]}
        onSelect={(row) => {
          setSelectedObj(row);
        }}
        isRefresh={tableRefresh}
      />
      <QuickLinkModal
        selectedObj={selectedObj}
        setSelectedObj={setSelectedObj}
        tableRefresh={tableRefresh}
        setTableRefresh={setTableRefresh}
      />
    </>
  );
};

