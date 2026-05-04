import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createUpdateObjective, getFinancialYears } from "../Queries";
import showToast from "../../../../helpers/ToastHelper";
import { spismCan } from "../../../../utils/spismPermissions";

const ObjectiveModal = ({
  selectedObj,
  setSelectedObj,
  tableRefresh,
  setTableRefresh,
}) => {
  const user = useSelector((state) => state.userReducer?.data);
  const canSaveObjective = selectedObj
    ? spismCan(user, "can_edit_spism_objective")
    : spismCan(user, "can_add_spism_objective");
  const [errors, setOtherError] = useState({});
  const [financialYears, setFinancialYears] = useState([]);

  useEffect(() => {
    getFinancialYears()
      .then((res) => {
        const data = res?.data ?? res;
        setFinancialYears(Array.isArray(data) ? data : []);
      })
      .catch(() => setFinancialYears([]));
  }, []);

  const initialValues = {
    title: selectedObj?.title || "",
    description: selectedObj?.description || "",
    weight: selectedObj?.weight ?? "",
    financial_year: selectedObj?.financial_year || "",
    status: selectedObj?.status || "DRAFT",
  };

  const validationSchema = Yup.object().shape({
    title: Yup.string().required("Title is required"),
    weight: Yup.number().min(0.01).max(100).required("Weight % is required"),
    financial_year: Yup.string().required("Financial year is required (e.g. 2024/2025)"),
  });

  const handleSubmit = async (values, { setSubmitting, resetForm, setErrors }) => {
    try {
      if (selectedObj) values.uid = selectedObj.uid;
      const payload = { ...values, weight: Number(values.weight) };
      const result = await createUpdateObjective(payload);
      if (result.status === 200 || result.status === 8000) {
        showToast("Objective saved successfully", "success", "Done");
        setTableRefresh((prev) => prev + 1);
        handleClose();
        resetForm();
        setSelectedObj(null);
      } else if (result.status === 8002) {
        showToast(result.message || "Validation failed", "warning", "Validation");
        setErrors(result.data || {});
        setOtherError(result.data || {});
      } else {
        showToast(result.message || "Save failed", "warning", "Error");
      }
    } catch (err) {
      showToast("Failed to save objective", "error", "Error");
      handleClose();
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    const el = document.getElementById("objectiveModal");
    const modal = window.bootstrap?.Modal?.getInstance(el);
    if (modal) modal.hide();
    setSelectedObj(null);
  };

  useEffect(() => {
    const el = document.getElementById("objectiveModal");
    if (!el) return;
    const onHidden = () => setSelectedObj(null);
    el.addEventListener("hidden.bs.modal", onHidden);
    return () => el.removeEventListener("hidden.bs.modal", onHidden);
  }, []);

  return (
    <div
      className="modal modal-slide-in"
      id="objectiveModal"
      tabIndex="-1"
      aria-hidden="true"
      data-bs-backdrop="static"
      data-bs-keyboard="false"
    >
      <div className="modal-dialog modal-md">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {selectedObj ? "Edit" : "Add"} Objective
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleClose}
              aria-label="Close"
            />
          </div>
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            enableReinitialize
            onSubmit={handleSubmit}
          >
            {({ isSubmitting }) => (
              <Form>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Title *</label>
                    <Field name="title" className="form-control" placeholder="Objective title" />
                    <ErrorMessage name="title" component="div" className="text-danger small" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <Field as="textarea" name="description" className="form-control" rows={2} />
                  </div>
                  <div className="row">
                    <div className="col-6">
                      <div className="mb-3">
                        <label className="form-label">Weight % *</label>
                        <Field name="weight" type="number" step="0.01" min="0" max="100" className="form-control" />
                        <ErrorMessage name="weight" component="div" className="text-danger small" />
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="mb-3">
                        <label className="form-label">Financial Year *</label>
                        {financialYears.length > 0 ? (
                          <Field as="select" name="financial_year" className="form-select">
                            <option value="">Select financial year</option>
                            {financialYears
                              .filter((fy) => fy.is_active !== false)
                              .map((fy) => (
                                <option key={fy.uid} value={fy.name}>
                                  {fy.name}
                                  {fy.start_date && fy.end_date
                                    ? ` (${new Date(fy.start_date).getFullYear()}/${new Date(fy.end_date).getFullYear()})`
                                    : ""}
                                </option>
                              ))}
                          </Field>
                        ) : (
                          <Field name="financial_year" className="form-control" placeholder="e.g. 2024/2025" />
                        )}
                        {financialYears.length === 0 && (
                          <small className="text-muted">Configure years in Setup & Configuration → Financial Years</small>
                        )}
                        <ErrorMessage name="financial_year" component="div" className="text-danger small" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={handleClose}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting || !canSaveObjective}
                    title={!canSaveObjective ? "No permission to save objectives" : undefined}
                  >
                    {isSubmitting ? "Saving..." : "Save"}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default ObjectiveModal;
