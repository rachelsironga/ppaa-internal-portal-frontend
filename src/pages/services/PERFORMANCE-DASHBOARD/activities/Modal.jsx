import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createUpdateActivity, getTargets, getObjectives, getFinancialYears } from "./Queries";
import showToast from "../../../../helpers/ToastHelper";
import { spismCan } from "../../../../utils/spismPermissions";

/** Each quarter = 3 months. Q1=months 1–3, Q2=4–6, Q3=7–9, Q4=10–12 from FY start. */
function getQuarterDateRange(startDateStr, endDateStr, quarter) {
  if (!startDateStr || !quarter) return null;
  const start = new Date(startDateStr);
  if (Number.isNaN(start.getTime())) return null;
  const q = Number(quarter);
  if (q < 1 || q > 4) return null;
  const qStart = new Date(start);
  qStart.setMonth(qStart.getMonth() + (q - 1) * 3);
  const qEnd = new Date(qStart);
  qEnd.setMonth(qEnd.getMonth() + 3);
  qEnd.setDate(qEnd.getDate() - 1);
  if (endDateStr) {
    const fyEnd = new Date(endDateStr);
    if (qEnd > fyEnd) qEnd.setTime(fyEnd.getTime());
  }
  const fmt = (d) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return { start: qStart, end: qEnd, label: `${fmt(qStart)} to ${fmt(qEnd)}` };
}

const inferPlannedValueType = (activity) => {
  const label = (activity?.planned_value_label || "").toLowerCase();
  if (label.includes("%") || label.includes("percent")) {
    return "PERCENT";
  }
  return "NUMBER";
};

const ActivityModal = ({
  selectedActivity,
  setSelectedActivity,
  tableRefresh,
  setTableRefresh,
  onSuccess,
  modalId = "activityModal",
}) => {
  const user = useSelector((state) => state.userReducer?.data);
  const canSaveActivity = selectedActivity?.uid
    ? spismCan(user, "can_edit_spism_activity")
    : spismCan(user, "can_add_spism_activity");
  const [targets, setTargets] = useState([]);
  const [targetsLoading, setTargetsLoading] = useState(false);
  const [financialYears, setFinancialYears] = useState([]);

  useEffect(() => {
    getFinancialYears()
      .then((res) => {
        const data = res?.data ?? res;
        setFinancialYears(Array.isArray(data) ? data : []);
      })
      .catch(() => setFinancialYears([]));
  }, []);

  useEffect(() => {
    setTargetsLoading(true);
    getObjectives({ status: "APPROVED" })
      .then((res) => {
        const data = res?.data ?? res?.results ?? res;
        const list = Array.isArray(data) ? data : data?.data ?? data?.results ?? [];
        const objectives = Array.isArray(list) ? list : [];
        if (objectives.length === 0) {
          setTargets([]);
          return;
        }
        const fetchTargets = objectives.map((o) =>
          getTargets({ objective: o.uid, pagination: { page_size: 200 } }).then((tRes) => {
            const tData = tRes?.data ?? tRes?.results ?? tRes;
            const tList = Array.isArray(tData) ? tData : tData?.data ?? tData?.results ?? [];
            return (Array.isArray(tList) ? tList : [])
              .filter((t) => t.status === "APPROVED")
              .map((t) => ({ ...t, objective_title: o.title, objective_financial_year: o.financial_year }));
          })
        );
        return Promise.all(fetchTargets);
      })
      .then((targetArrays) => {
        const flat = (targetArrays || []).flat();
        setTargets(flat);
      })
      .catch(() => setTargets([]))
      .finally(() => setTargetsLoading(false));
  }, []);

  const initialValues = useMemo(() => {
    const targetUid = selectedActivity?.target ?? "";
    const targetRow = targets.find((t) => t.uid === targetUid);
    const fyFromObjective =
      (selectedActivity?.planned_financial_year &&
        String(selectedActivity.planned_financial_year).trim()) ||
      targetRow?.objective_financial_year ||
      "";
    return {
      target: targetUid,
      title: selectedActivity?.title ?? "",
      description: selectedActivity?.description ?? "",
      weight: selectedActivity?.weight ?? "",
      planned_value: selectedActivity?.planned_value ?? "",
      planned_value_type: inferPlannedValueType(selectedActivity),
      planned_value_label: selectedActivity?.planned_value_label ?? "",
      planned_financial_year: fyFromObjective,
      planned_quarter: selectedActivity?.planned_quarter ?? "",
      planned_quarters: Array.isArray(selectedActivity?.planned_quarters)
        ? selectedActivity.planned_quarters
        : selectedActivity?.planned_quarter != null
          ? [Number(selectedActivity.planned_quarter)]
          : [],
    };
  }, [selectedActivity, targets]);

  const QUARTER_OPTIONS = [
    { value: 1, label: "Q1" },
    { value: 2, label: "Q2" },
    { value: 3, label: "Q3" },
    { value: 4, label: "Q4" },
  ];

  const validationSchema = Yup.object().shape({
    target: Yup.string().required("Target is required"),
    title: Yup.string().trim().required("Title is required"),
    weight: Yup.number().min(0.01).max(100).required("Weight % is required"),
  });

  const handleSubmit = async (values, { setSubmitting, resetForm, setErrors }) => {
    try {
      const targetRow = targets.find((t) => t.uid === values.target);
      const resolvedFy =
        (values.planned_financial_year && String(values.planned_financial_year).trim()) ||
        targetRow?.objective_financial_year ||
        "";
      const payload = {
        ...(selectedActivity?.uid && { uid: selectedActivity.uid }),
        target: values.target,
        title: values.title.trim(),
        description: values.description?.trim() || null,
        weight: Number(values.weight),
        planned_value: values.planned_value ? Number(values.planned_value) : null,
        planned_value_label:
          values.planned_value_label?.trim() ||
          (values.planned_value && values.planned_value_type === "PERCENT" ? "%" : null),
        planned_financial_year: resolvedFy || null,
        planned_quarter: values.planned_quarters?.length === 1 ? values.planned_quarters[0] : null,
        planned_quarters: Array.isArray(values.planned_quarters) ? values.planned_quarters : [],
      };
      const result = await createUpdateActivity(payload);
      if (result?.status === 200 || result?.status === 8000) {
        showToast(
          selectedActivity ? "Activity updated successfully" : "Activity created successfully",
          "success",
          "Done"
        );
        setTableRefresh?.((prev) => prev + 1);
        handleClose();
        resetForm();
        setSelectedActivity?.(null);
        onSuccess?.();
      } else if (result?.status === 8002) {
        const msg = result?.message || "Validation failed";
        showToast(msg, "warning", "Validation");
        setErrors(
          result?.data && typeof result.data === "object" && Object.keys(result.data).length > 0
            ? result.data
            : { weight: msg }
        );
      } else {
        showToast(result?.message || "Save failed", "warning", "Error");
      }
    } catch (err) {
      showToast(
        err?.response?.data?.message || "Failed to save activity",
        "error",
        "Error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    const el = document.getElementById(modalId);
    const modal = window.bootstrap?.Modal?.getInstance(el);
    if (modal) modal.hide();
    setSelectedActivity?.(null);
  };

  useEffect(() => {
    const el = document.getElementById(modalId);
    if (!el) return;
    const onHidden = () => setSelectedActivity?.(null);
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
      <div
        className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"
        role="document"
      >
        <div className="modal-content">
          <div className="modal-header flex-shrink-0">
            <h5 className="modal-title">{selectedActivity?.uid ? "Edit" : "Add"} Activity</h5>
            <button type="button" className="btn-close" onClick={handleClose} aria-label="Close" />
          </div>
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            enableReinitialize
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, values, setFieldValue }) => {
              const selectedTarget = targets.find((t) => t.uid === values.target);
              const displayFy = values.planned_financial_year || selectedTarget?.objective_financial_year || "";
              const selectedFy = financialYears.find(
                (fy) => (fy.name || fy.uid) === displayFy
              );
              const quarterRange = values.planned_quarters?.length === 1
                ? getQuarterDateRange(selectedFy?.start_date, selectedFy?.end_date, values.planned_quarters[0])
                : null;
              return (
              <Form className="d-flex flex-column flex-grow-1 overflow-hidden w-100" style={{ minHeight: 0 }}>
                <div className="modal-body flex-grow-1 overflow-y-auto">
                  <div className="mb-3">
                    <label className="form-label">Target *</label>
                    <Field as="select" name="target" className="form-select" disabled={targetsLoading}
                      onChange={(e) => {
                        const uid = e.target.value;
                        setFieldValue("target", uid);
                        const t = targets.find((x) => x.uid === uid);
                        if (t?.objective_financial_year) setFieldValue("planned_financial_year", t.objective_financial_year);
                      }}
                    >
                      <option value="">Select approved target</option>
                      {targets.map((t) => (
                        <option key={t.uid} value={t.uid}>
                          {t.title} {t.objective_title ? `(under ${t.objective_title})` : ""} {t.objective_financial_year ? ` — ${t.objective_financial_year}` : ""}
                        </option>
                      ))}
                    </Field>
                    <ErrorMessage name="target" component="div" className="text-danger small" />
                    {!targetsLoading && targets.length === 0 && (
                      <small className="text-warning">
                        No approved targets found. Approve objectives and targets first.
                      </small>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Title *</label>
                    <Field name="title" className="form-control" placeholder="Activity title" />
                    <ErrorMessage name="title" component="div" className="text-danger small" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <Field
                      as="textarea"
                      name="description"
                      className="form-control"
                      rows={2}
                      placeholder="Optional"
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Implementation year (from target)</label>
                        <input
                          type="text"
                          className="form-control bg-light"
                          value={displayFy || "Select a target above"}
                          readOnly
                          disabled
                        />
                        <small className="text-muted">Year is taken from the target’s objective. No need to select again.</small>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Quarters for implementation</label>
                        <div className="d-flex flex-wrap gap-3 align-items-center">
                          {QUARTER_OPTIONS.map((q) => {
                            const arr = values.planned_quarters || [];
                            const checked = arr.includes(q.value);
                            return (
                              <label key={q.value} className="form-check form-check-inline mb-0">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={checked}
                                  onChange={(e) => {
                                    const next = e.target.checked
                                      ? [...(arr.filter((n) => n !== q.value)), q.value].sort((a, b) => a - b)
                                      : arr.filter((n) => n !== q.value);
                                    setFieldValue("planned_quarters", next);
                                  }}
                                />
                                <span className="form-check-label">{q.label}</span>
                              </label>
                            );
                          })}
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => setFieldValue("planned_quarters", [1, 2, 3, 4])}
                          >
                            All quarters
                          </button>
                        </div>
                        <small className="text-muted">Select one or more quarters when this activity will be implemented. Use &quot;All quarters&quot; if it runs across the year.</small>
                        {quarterRange && (
                          <div className="alert alert-info py-2 px-3 mt-2 mb-0 small">
                            <i className="bx bx-calendar-event me-1"></i>
                            <strong>Single quarter selected:</strong> {quarterRange.label}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Weight % *</label>
                        <Field
                          name="weight"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          className="form-control"
                          placeholder="e.g. 25"
                        />
                        <ErrorMessage name="weight" component="div" className="text-danger small" />
                        <small className="text-muted">
                          Sum of all activity weights for this target must equal 100%.
                        </small>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Planned value</label>
                        <div className="d-flex gap-2">
                          <Field
                            as="select"
                            name="planned_value_type"
                            className="form-select form-select-sm"
                            style={{ maxWidth: "150px" }}
                          >
                            <option value="NUMBER">Number / units</option>
                            <option value="PERCENT">Percentage (%)</option>
                          </Field>
                          <Field
                            name="planned_value"
                            type="number"
                            step="any"
                            min="0"
                            className="form-control"
                            placeholder={values.planned_value_type === "PERCENT" ? "e.g. 75" : "e.g. 100"}
                          />
                        </div>
                        <small className="text-muted">
                          {values.planned_value_type === "PERCENT"
                            ? "Percentage value (0–100)."
                            : "Numeric value (e.g. number of items, people)."}
                        </small>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Planned value – what it represents</label>
                        <Field
                          name="planned_value_label"
                          className="form-control"
                          placeholder="e.g. Assessment, Number of trainings"
                        />
                        <small className="text-muted">
                          Describe what the planned value is for (e.g. if value is 1, type &quot;Assessment&quot;)
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer flex-shrink-0 border-top">
                  <button
                    type="button"
                    className="btn btn-label-secondary"
                    onClick={handleClose}
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting || targets.length === 0 || !canSaveActivity}
                    title={!canSaveActivity ? "No permission to save activities" : undefined}
                  >
                    {isSubmitting ? "Saving..." : selectedActivity?.uid ? "Update" : "Create activity"}
                  </button>
                </div>
              </Form>
            );
            }}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default ActivityModal;
