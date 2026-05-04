import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { spismCan } from "../../../../utils/spismPermissions";
import {
  getFinancialYears,
  deleteFinancialYear,
} from "../Queries";
import showToast from "../../../../helpers/ToastHelper";
import BreadCumb from "../../../../layouts/BreadCumb";
import ReactLoading from "react-loading";
import Swal from "sweetalert2";
import FinancialYearModal from "./Modal";

function formatDateShort(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export const FinancialYearsPage = () => {
  const user = useSelector((state) => state.userReducer?.data);
  const canEditSetup = spismCan(user, "can_edit_spism_setup");
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [refresh, setRefresh] = useState(0);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await getFinancialYears();
      const data = res?.data ?? res;
      setList(Array.isArray(data) ? data : []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [refresh]);

  const handleDelete = async (row) => {
    const confirmed = await Swal.fire({
      title: "Delete financial year?",
      text: `"${row.name}" will be removed. Objectives may still reference this year by name.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, delete",
    });
    if (!confirmed.isConfirmed) return;
    try {
      const result = await deleteFinancialYear(row.uid);
      if (result?.status === 200 || result?.status === 8000) {
        showToast("Financial year deleted", "success", "Done");
        setRefresh((r) => r + 1);
      } else {
        showToast(result?.message || "Delete failed", "warning", "Error");
      }
    } catch {
      showToast("Failed to delete", "danger", "Error");
    }
  };

  const formatDate = (d) => formatDateShort(d);

  return (
    <>
      <BreadCumb pageList={["SPISM", "Setup & Configuration", "Financial Years"]} />
      <div className="card shadow-sm animate__animated animate__fadeInUp animate__fast">
        <div className="card-header bg-light d-flex align-items-center justify-content-between flex-wrap gap-2">
          <h5 className="mb-0 fw-semibold">
            <i className="bx bx-calendar me-2 text-primary"></i>
            Financial Years
          </h5>
          {canEditSetup && (
          <button
            type="button"
            className="btn btn-primary btn-sm animate__animated animate__fadeInRight animate__slow"
            data-bs-toggle="modal"
            data-bs-target="#financialYearModal"
            onClick={() => setSelected(null)}
          >
            <i className="bx bx-plus me-1"></i> Add financial year
          </button>
          )}
        </div>
        <div className="card-body">
          <p className="text-muted small mb-4">
            Define financial years in format <strong>YYYY/YYYY</strong> (e.g. 2025/2026) and set when each year starts and ends.
            Objectives and targets can be linked to these years. You can reuse or copy objectives across years.
          </p>
          {loading ? (
            <div className="text-center py-5">
              <ReactLoading type="cylon" color="#00853f" height={36} width={60} />
              <p className="text-muted mt-2 mb-0">Loading financial years...</p>
            </div>
          ) : list.length === 0 ? (
            <div className="alert alert-light border text-center py-4">
              <i className="bx bx-calendar-x fs-1 text-muted"></i>
              <p className="mb-2 mt-2">No financial years configured yet.</p>
              {canEditSetup && (
              <button
                type="button"
                className="btn btn-sm btn-primary"
                data-bs-toggle="modal"
                data-bs-target="#financialYearModal"
                onClick={() => setSelected(null)}
              >
                <i className="bx bx-plus me-1"></i> Add first financial year
              </button>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th style={{ width: "140px" }}>Financial year</th>
                    <th>Start date</th>
                    <th>End date</th>
                    <th style={{ width: "100px" }} className="text-center">Status</th>
                    <th style={{ width: "120px", minWidth: "120px" }} className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((row) => (
                    <tr key={row.uid}>
                      <td className="fw-semibold">{row.name}</td>
                      <td>{formatDate(row.start_date)}</td>
                      <td>{formatDate(row.end_date)}</td>
                      <td className="text-center">
                        <span className={`badge ${row.is_active ? "bg-label-success" : "bg-label-secondary"}`}>
                          {row.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="d-flex flex-nowrap align-items-center justify-content-center gap-1">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary flex-shrink-0"
                            onClick={() => navigate(`/performance-dashboard/setup/financial-years/open/${row.uid}`)}
                            title="View"
                          >
                            <i className="bx bx-show"></i>
                          </button>
                          {canEditSetup && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary flex-shrink-0"
                            data-bs-toggle="modal"
                            data-bs-target="#financialYearModal"
                            onClick={() => setSelected(row)}
                            title="Edit"
                          >
                            <i className="bx bx-edit-alt"></i>
                          </button>
                          )}
                          {canEditSetup && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger flex-shrink-0"
                            onClick={() => handleDelete(row)}
                            title="Delete"
                          >
                            <i className="bx bx-trash"></i>
                          </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <FinancialYearModal
        selected={selected}
        setSelected={setSelected}
        tableRefresh={refresh}
        setTableRefresh={setRefresh}
        onSuccess={() => setRefresh((r) => r + 1)}
        modalId="financialYearModal"
      />
    </>
  );
};
