import React, { useState, useEffect } from "react";
import "animate.css";
import { PositionalLevelContext } from "../../../../utils/context";
import { useNavigate } from "react-router-dom";
import BreadCumb from "../../../../layouts/BreadCumb";
import PaginatedTable from "../../../../components/ui-templates/PaginatedTable";
import { formatDate } from "../../../../helpers/DateFormater";
import Swal from "sweetalert2";
import PositionalLevelModal from "./Modal";
import { deletePositionalLevel, getPositionalLevels } from "./Queries";
import { FileImportModal } from "./ImportModal";

export const PositionalLevelPage = () => {
  const [selectedObj, setSelectedObj] = useState(null);
  const [tableRefresh, setTableRefresh] = useState(0);
  const navigate = useNavigate();

  const handleDelete = async (positionalLevel = null) => {
    if (!positionalLevel) {
      Swal.fire("Error!", "Unable to Select this Positional Level.", "error");
      return;
    }

    try {
      const confirmation = await Swal.fire({
        title: "Are you sure?",
        text: "Your About to Delete the data",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        cancelButtonColor: "#aaa",
        confirmButtonText: "Yes, delete it!",
      });

      if (confirmation.isConfirmed) {
        const result = await deletePositionalLevel(positionalLevel.uid);
        if (result.status === 200 || result.status === 8000) {
          Swal.fire(
            "Process Completed!",
            "The Positional Level has been deleted.",
            "success"
          );
        } else {
          console.error("Error deleting Positional Level:", result);
          Swal.fire("Error Occurred!", `${result.message}`, "error");
        }
      }
    } catch (error) {
      console.error("Error deleting Positional Level:", error);
      Swal.fire(
        "Unsuccessful",
        `Unable to Perform Delete. Please Try Again or Contact Support Team`,
        "error"
      );
    }

    setSelectedObj(null);
  };

  return (
    <PositionalLevelContext.Provider
      value={{
        selectedObj,
        setSelectedObj,
        tableRefresh,
        setTableRefresh,
      }}
    >
      <BreadCumb pageList={["Settings", "Designations"]} />
      <PaginatedTable
        fetchPath="/positional-level"
        title="List of Registered Designation / Approval Levels"
        columns={[
          {
            key: "SN",
            label: "SN",
            style: { width: "80px" },
            className: "text-center",
          },
          {
            key: "name",
            label: "Position",
            className: "cursor-pointer text-bold",
          },
          {
            key: "code",
            label: "Position Code",
            className: "text-justify",
            style: { width: "30%" },
          },
          {
            key: "is_active",
            label: "Status",
            style: { width: "150px" },
            render: (row) => (
              <span
                className={
                  row.is_active
                    ? "badge bg-label-success me-1"
                    : "badge bg-label-danger me-1"
                }
              >
                {row.is_active ? "Active" : "Disabled"}
              </span>
            ),
          },
          {
            key: "created_at",
            label: "Created Date",
            style: { width: "150px" },
            className: "text-right",
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
              <div className="dropdown">
                <button
                  aria-label="Click me"
                  type="button"
                  className="btn p-0 dropdown-toggle hide-arrow"
                  data-bs-toggle="dropdown"
                >
                  <i className="bx bx-menu"></i>
                </button>
                <div className="dropdown-menu">
                  <a
                    className="dropdown-item"
                    href="#"
                    onClick={() => {
                      setSelectedObj(row);
                    }}
                    data-bs-toggle="modal"
                    data-bs-target="#viewCreateDesignationModal"
                  >
                    <i className="bx bx-edit-alt me-1"></i> View / Edit
                  </a>
                  <a
                    aria-label="dropdown action option"
                    className="dropdown-item text-danger"
                    href="#"
                    onClick={async () => {
                      handleDelete(row);
                    }}
                  >
                    <i className="bx bx-trash me-1"></i> Disable
                  </a>
                </div>
              </div>
            ),
          },
        ]}
        buttons={[
          {
            label: "Import Disignations",
            render: () => (
              <button
                aria-label="Click me"
                type="button"
                className="btn btn-success ms-auto btn-sm me-4 animate__animated animate__fadeInRight animate__fast"
                data-bs-toggle="modal"
                data-bs-target="#fileImportModal"
              >
                <i className="bx bx-table me-1"></i> Import Disignations
              </button>
            ),
          },
          {
            label: "Add System Roles",
            render: () => (
              <button
                aria-label="Click me"
                type="button"
                className="btn btn-primary ms-auto btn-sm   animate__animated animate__fadeInRight animate__slow me-1"
                data-bs-toggle="modal"
                data-bs-target="#viewCreateDesignationModal"
              >
                <i className="bx bx-edit-alt me-1"></i> Add New Designation
              </button>
            ),
          },
        ]}
        isRefresh={tableRefresh}
      />
      <PositionalLevelModal />
      <FileImportModal context={PositionalLevelContext} />
    </PositionalLevelContext.Provider>
  );
};
