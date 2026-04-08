import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { spismCan } from "../../../../utils/spismPermissions";
import BreadCumb from "../../../../layouts/BreadCumb";
import { getFinancialYears, deleteFinancialYear } from "../Queries";
import showToast from "../../../../helpers/ToastHelper";
import { formatDate } from "../../../../helpers/DateFormater";
import ReactLoading from "react-loading";
import Swal from "sweetalert2";
import FinancialYearModal from "./Modal";

export const FinancialYearOpenPage = () => {
  const user = useSelector((state) => state.userReducer?.data);
  const canEditSetup = spismCan(user, "can_edit_spism_setup");
  const { uid } = useParams();
  const navigate = useNavigate();
  const [obj, setObj] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [tableRefresh, setTableRefresh] = useState(0);

  const fetchOne = async () => {
    try {
      const result = await getFinancialYears(uid);
      const data = result?.data ?? result;
      if (data && typeof data === "object" && data.uid) {
        setObj(data);
      } else {
        setObj(null);
      }
    } catch (err) {
      setObj(null);
      showToast("Failed to load financial year", "danger", "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchOne();
    return () => { mounted = false; };
  }, [uid]);

  const handleDelete = async () => {
    const confirmed = await Swal.fire({
      title: "Delete financial year?",
      text: `"${obj.name}" will be removed. Objectives may still reference this year by name.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, delete",
    });
    if (!confirmed.isConfirmed) return;
    try {
      const result = await deleteFinancialYear(uid);
      if (result?.status === 200 || result?.status === 8000) {
        showToast("Financial year deleted", "success", "Done");
        navigate("/performance-dashboard/setup/financial-years");
      } else {
        showToast(result?.message || "Delete failed", "warning", "Error");
      }
    } catch {
      showToast("Failed to delete", "danger", "Error");
    }
  };

  if (loading) {
    return (
      <>
        <BreadCumb pageList={["SPISM", "Setup & Configuration", "Financial Years", "View"]} />
        <div className="card">
          <div className="card-body">
            <center>
              <ReactLoading type="cylon" color="#696cff" height={30} width={50} />
              <h6 className="text-muted mt-2">Loading financial year...</h6>
            </center>
          </div>
        </div>
      </>
    );
  }

  if (!obj) {
    return (
      <>
        <BreadCumb pageList={["SPISM", "Setup & Configuration", "Financial Years", "View"]} />
        <div className="card">
          <div className="card-body">
            <div className="alert alert-danger" role="alert">
              <div className="alert-body text-center">
                <p className="mb-0">
                  Sorry! Unable to get financial year details. Please contact the system administrator.
                </p>
                <button
                  className="btn btn-primary btn-sm mt-3"
                  onClick={() => navigate("/performance-dashboard/setup/financial-years")}
                >
                  <i className="bx bx-arrow-back me-1"></i> Back to Financial Years
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <BreadCumb pageList={["SPISM", "Setup & Configuration", "Financial Years", obj.name]} />

      <div className="card mb-4 shadow-sm animate__animated animate__fadeInDown animate__faster">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-8">
              <div className="d-flex align-items-start">
                <div className="flex-shrink-0">
                  <div className="avatar avatar-xl me-3">
                    <span className="avatar-initial rounded bg-label-primary">
                      <i className="bx bx-calendar bx-lg"></i>
                    </span>
                  </div>
                </div>
                <div className="flex-grow-1">
                  <h4 className="mb-1 fw-bold">{obj.name}</h4>
                  <p className="mb-2 text-muted">
                    Financial year from {formatDate(obj.start_date)} to {formatDate(obj.end_date)}
                  </p>
                  <span className={`badge ${obj.is_active ? "bg-label-success" : "bg-label-secondary"}`}>
                    {obj.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
            <div className="col-md-4 d-flex flex-nowrap gap-2 justify-content-end align-items-center">
              <button
                type="button"
                className="btn btn-label-secondary btn-sm"
                onClick={() => navigate("/performance-dashboard/setup/financial-years")}
              >
                <i className="bx bx-arrow-back me-1"></i> Back
              </button>
              {canEditSetup && (
              <button
                type="button"
                className="btn btn-outline-primary btn-sm"
                data-bs-toggle="modal"
                data-bs-target="#financialYearModal"
                onClick={() => setSelected(obj)}
              >
                <i className="bx bx-edit-alt me-1"></i> Edit
              </button>
              )}
              {canEditSetup && (
              <button type="button" className="btn btn-outline-danger btn-sm" onClick={handleDelete}>
                <i className="bx bx-trash me-1"></i> Delete
              </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm animate__animated animate__fadeInUp animate__fast">
        <div className="card-header">
          <h5 className="mb-0">Details</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <p className="mb-1 text-muted small">Start date</p>
              <p className="mb-0 fw-medium">{formatDate(obj.start_date)}</p>
            </div>
            <div className="col-md-6">
              <p className="mb-1 text-muted small">End date</p>
              <p className="mb-0 fw-medium">{formatDate(obj.end_date)}</p>
            </div>
          </div>
          <hr />
          <div className="row">
            <div className="col-md-6">
              <p className="mb-1 text-muted small">Status</p>
              <p className="mb-0">
                <span className={`badge ${obj.is_active ? "bg-label-success" : "bg-label-secondary"}`}>
                  {obj.is_active ? "Active" : "Inactive"}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
      <FinancialYearModal
        selected={selected}
        setSelected={setSelected}
        tableRefresh={tableRefresh}
        setTableRefresh={setTableRefresh}
        onSuccess={fetchOne}
        modalId="financialYearModal"
      />
    </>
  );
};
