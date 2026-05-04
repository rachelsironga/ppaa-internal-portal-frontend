import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createUpdateFinancialYear } from "../Queries";
import showToast from "../../../../helpers/ToastHelper";
import { spismCan } from "../../../../utils/spismPermissions";

const FINANCIAL_YEAR_REGEX = /^\d{4}\/\d{4}$/;

const FinancialYearModal = ({
  selected,
  setSelected,
  tableRefresh,
  setTableRefresh,
  onSuccess = null,
  modalId = "financialYearModal",
}) => {
  const user = useSelector((state) => state.userReducer?.data);
  const canSaveFinancialYear = spismCan(user, "can_edit_spism_setup");
  const initialValues = {
    name: selected?.name ?? "",
    start_date: selected?.start_date ?? "",
    end_date: selected?.end_date ?? "",
    is_active: selected?.is_active ?? true,
  };

  const validationSchema = Yup.object().shape({
    name: Yup.string()
      .required("Financial year is required")
      .matches(FINANCIAL_YEAR_REGEX, "Format must be YYYY/YYYY (e.g. 2025/2026)")
      .test("end-is-start-plus-one", "End year must be start year + 1", (val) => {
        if (!val || !FINANCIAL_YEAR_REGEX.test(val)) return true;
        const [s, e] = val.split("/").map(Number);
        return e === s + 1;
      }),
    start_date: Yup.date().required("Start date is required"),
    end_date: Yup.date()
      .required("End date is required")
      .when("start_date", (start_date, schema) =>
        start_date ? schema.min(start_date, "End date must be after start date") : schema
      ),
  });

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const payload = {
        ...(selected?.uid && { uid: selected.uid }),
        name: values.name.trim(),
        start_date: values.start_date,
        end_date: values.end_date,
        is_active: values.is_active,
      };
      const result = await createUpdateFinancialYear(payload);
      if (result?.status === 200 || result?.status === 8000) {
        showToast(
          selected ? "Financial year updated successfully" : "Financial year created successfully",
          "success",
          "Done"
        );
        setTableRefresh?.((prev) => prev + 1);
        handleClose();
        resetForm();
        setSelected?.(null);
        onSuccess?.();
      } else {
        showToast(result?.message || "Save failed", "warning", "Error");
      }
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to save", "error", "Error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    const el = document.getElementById(modalId);
    const modal = window.bootstrap?.Modal?.getInstance(el);
    if (modal) modal.hide();
    setSelected?.(null);
  };

  useEffect(() => {
    const el = document.getElementById(modalId);
    if (!el) return;
    const onHidden = () => setSelected?.(null);
    el.addEventListener("hidden.bs.modal", onHidden);
    return () => el.removeEventListener("hidden.bs.modal", onHidden);
  }, [modalId]);

  return (
    <div
      className="modal modal-slide-in"
      id={modalId}
      tabIndex="-1"
      aria-hidden="true"
      data-bs-backdrop="static"
      data-bs-keyboard="false"
    >
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{selected ? "Edit" : "Add"} Financial Year</h5>
            <button type="button" className="btn-close" onClick={handleClose} aria-label="Close" />
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
                  <div className="alert alert-light border small mb-3">
                    <strong>Format:</strong> YYYY/YYYY (e.g. 2025/2026). Specify the date range when the financial year starts and ends.
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Financial year *</label>
                    <Field
                      name="name"
                      className="form-control"
                      placeholder="e.g. 2025/2026"
                      disabled={!!selected?.uid}
                    />
                    <ErrorMessage name="name" component="div" className="text-danger small" />
                  </div>
                  <div className="row">
                    <div className="col-6">
                      <div className="mb-3">
                        <label className="form-label">Start date *</label>
                        <Field name="start_date" type="date" className="form-control" />
                        <ErrorMessage name="start_date" component="div" className="text-danger small" />
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="mb-3">
                        <label className="form-label">End date *</label>
                        <Field name="end_date" type="date" className="form-control" />
                        <ErrorMessage name="end_date" component="div" className="text-danger small" />
                      </div>
                    </div>
                  </div>
                  {selected && (
                    <div className="mb-3">
                      <div className="form-check form-switch">
                        <Field name="is_active" type="checkbox" className="form-check-input" id="fy_active" />
                        <label className="form-check-label" htmlFor="fy_active">Active</label>
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={handleClose}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting || !canSaveFinancialYear}
                    title={!canSaveFinancialYear ? "No permission to change financial years" : undefined}
                  >
                    {isSubmitting ? "Saving..." : selected ? "Update" : "Add financial year"}
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

export default FinancialYearModal;
