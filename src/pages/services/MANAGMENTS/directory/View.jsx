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

export const DirectoryPage = () => {
  const [selectedObj, setSelectedObj] = useState(null);
  const [tableRefresh, setTableRefresh] = useState(0);
  const navigate = useNavigate();
  const user = useSelector((state) => state.userReducer?.data);

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
    <DirectoryContext.Provider
      value={{
        selectedObj,
        setSelectedObj,
        tableRefresh,
        setTableRefresh,
      }}
    >
      <BreadCumb pageList={["Settings", "Designations"]} />
      <PaginatedTable
        fetchPath="/directory"
        title="List of Registered Directories"
        columns={[
          {
            key: "SN",
            label: "SN",
            style: { width: "80px" },
            className: "text-center",
          },
          {
            key: "name",
            label: "Name",
            className: "cursor-pointer text-bold",
            render: (row) => (
              <span
                onClick={() =>
                  hasAccess(user, [
                    [
                      "view_directory",
                      "can_add_directory",
                      "can_update_directory",
                      "add_directory",
                      "change_directory",
                    ],
                  ])
                    ? navigate(`/settings/directories/open/${row.uid}`)
                    : null
                }
              >
                {row.name || "-"}
              </span>
            ),
          },
          {
            key: "code",
            label: "Directory Code",
            className: "text-justify",
            style: { width: "30%" },
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
              <button
                aria-label="Click me"
                type="button"
                className="btn p-0 dropdown-toggle hide-arrow text-info"
                data-bs-toggle="dropdown"
                onClick={() =>
                  hasAccess(user, [
                    [
                      "view_directory",
                      "can_add_directory",
                      "can_update_directory",
                      "add_directory",
                      "change_directory",
                    ],
                  ])
                    ? navigate(`/settings/directories/open/${row.uid}`)
                    : null
                }
              >
                <i className="bx bx-link-external"></i>&nbsp; View
              </button>
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
                data-bs-target="#viewCreateDirectoryImportModal"
              >
                <i className="bx bx-table me-1"></i> Import Directories
              </button>
            ),
          },
          {
            label: "Add Directories",
            render: () => (
              <button
                aria-label="Click me"
                type="button"
                className="btn btn-primary ms-auto btn-sm   animate__animated animate__fadeInRight animate__slow me-1"
                data-bs-toggle="modal"
                data-bs-target="#viewCreateDirectoryModal"
              >
                <i className="bx bx-edit-alt me-1"></i> Add New Directories
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
