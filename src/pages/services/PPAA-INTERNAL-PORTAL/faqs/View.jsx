import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import BreadCumb from "../../../../layouts/BreadCumb";
import PaginatedTable from "../../../../components/ui-templates/PaginatedTable";
import { formatDate } from "../../../../helpers/DateFormater";
import FAQModal from "./Modal";
import { hasAccess } from "../../../../hooks/AccessHandler";

export const FAQPage = () => {
  const [selectedObj, setSelectedObj] = useState(null);
  const [tableRefresh, setTableRefresh] = useState(0);
  const navigate = useNavigate();
  const user = useSelector((state) => state.userReducer?.data);

  return (
    <>
      <BreadCumb pageList={["Internal Portal", "FAQs"]} />
      <PaginatedTable
        fetchPath="/internal-portal/faqs"
        title="FAQ Management"
        columns={[
          {
            key: "SN",
            label: "SN",
            style: { width: "80px" },
            className: "text-center",
          },
          {
            key: "question",
            label: "Question",
            className: "cursor-pointer",
            render: (row) => (
              <span
                className="text-bold"
                onClick={() => {
                  navigate(`/ppaa-internal-portal/faqs/open/${row.uid}`);
                }}
              >
                {row.question?.length > 80 ? `${row.question.substring(0, 80)}...` : row.question}
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
            key: "created_at",
            label: "Created At",
            style: { width: "150px" },
            className: "text-center",
            render: (row) => (
              <span className="text-purple">
                {formatDate(row.created_at, "DD/MM/YYYY HH:mm:ss") || "-"}
              </span>
            ),
          },
          {
            key: "actions",
            label: "Actions",
            className: "text-center",
            style: { width: "120px" },
            render: (row) => (
              <button
                className="btn btn-sm btn-outline-primary text-center"
                onClick={() => {
                  navigate(`/ppaa-internal-portal/faqs/open/${row.uid}`);
                }}
              >
                <i className="bx bx-show"></i>&nbsp; View
              </button>
            ),
          },
        ]}
        buttons={[
          ...(hasAccess(user, ["can_add_faq"])
            ? [
                {
                  label: "Add FAQ",
                  render: () => (
                    <button
                      aria-label="Add FAQ"
                      type="button"
                      className="btn btn-primary ms-auto btn-sm animate__animated animate__fadeInRight animate__slow me-1"
                      data-bs-toggle="modal"
                      data-bs-target="#faqModal"
                      onClick={() => setSelectedObj(null)}
                    >
                      <i className="bx bx-plus me-1"></i> Add FAQ
                    </button>
                  ),
                },
              ]
            : []),
        ]}
        onSelect={(row) => {
          setSelectedObj(row);
        }}
        isRefresh={tableRefresh}
      />
      <FAQModal
        selectedObj={selectedObj}
        setSelectedObj={setSelectedObj}
        tableRefresh={tableRefresh}
        setTableRefresh={setTableRefresh}
      />
    </>
  );
};

